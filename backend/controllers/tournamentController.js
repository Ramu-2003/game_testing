const crypto = require('crypto');
const mongoose = require('mongoose');
const User = require('../models/User');
const TournamentSeason = require('../models/TournamentSeason');
const TournamentQueueEntry = require('../models/TournamentQueueEntry');
const TournamentMatch = require('../models/TournamentMatch');
const SeasonStanding = require('../models/SeasonStanding');
const RewardTransaction = require('../models/RewardTransaction');
const LeaderboardMatch = require('../models/LeaderboardMatch');
const { ensureActiveSeason, getRankForPoints } = require('../services/seasons');
const { recordMatchResult } = require('../services/leaderboards');
const { notifyUser } = require('../utils/realtime');
const { LANGUAGES, DIFFICULTIES, CATALOG_VERSION, listChallengeIds, getPublicChallenge, validateRepair } = require('../data/bugHunterChallenges');
const {
  MATCH_RP_WIN,
  QUEUE_TTL_MS,
  MATCH_DISCONNECT_GRACE_MS,
  MAX_MATCH_SUBMISSIONS,
  LEADERBOARD_WIN_POINTS,
} = require('../config/competitivePolicy');

const MATCH_TIME_MS = 10 * 60 * 1000;
const idOf = (value) => String(value?._id || value);

function publicMatch(match, viewerId, publicProfiles = new Map()) {
  if (!match) return null;
  const viewer = String(viewerId);
  const challenge = getPublicChallenge(match.challengeId);
  return {
    matchId: match.matchId,
    status: match.status,
    language: match.language,
    difficulty: match.difficulty,
    challenge,
    players: match.players.map((id, index) => {
      const userId = String(id);
      const isYou = userId === viewer;
      const profile = publicProfiles.get(userId);
      const isPublic = isYou || profile?.isPublic !== false;
      return {
        userId,
        username: isYou
          ? profile?.username || match.playerNames[index] || 'You'
          : profile?.isPublic === false ? 'Private player' : profile?.username || 'Opponent',
        profileImage: isPublic ? profile?.profileImage || null : null,
        rankPoints: isPublic ? profile?.rankPoints ?? null : null,
        rank: isPublic && profile?.rankPoints != null ? getRankForPoints(profile.rankPoints) : null,
        isYou,
        solved: Boolean(match.submissions.find((submission) => submission.userId === userId)?.solvedAt),
      };
    }),
    startedAt: match.startedAt,
    endsAt: match.endsAt,
    finalizedAt: match.finalizedAt,
    winnerId: match.winnerId,
    result: match.status === 'draw' ? 'draw' : match.status === 'cancelled' ? 'cancelled' : match.winnerId
      ? (String(match.winnerId) === viewer ? 'win' : 'loss')
      : null,
    rpDeltas: match.rpDeltas,
    mySubmissionAttempts: match.submissions.find((submission) => submission.userId === viewer)?.attempts || 0,
    cancelReason: match.cancelReason,
  };
}

async function getPublicPlayerProfiles(playerIds) {
  const ids = [...new Set(playerIds.map((id) => String(id)))].filter((id) => mongoose.Types.ObjectId.isValid(id));
  if (!ids.length) return new Map();
  const users = await User.find({ _id: { $in: ids } }).select('username name profileImage rankPoints isPublic').lean();
  return new Map(users.map((user) => [String(user._id), {
    username: user.isPublic === false ? null : user.username || user.name || 'Player',
    profileImage: user.isPublic === false ? null : user.profileImage || null,
    rankPoints: user.isPublic === false ? null : Number(user.rankPoints) || 0,
    isPublic: user.isPublic !== false,
  }]));
}

async function writeRpTransactions(match, winnerId, session) {
  const reward = MATCH_RP_WIN[match.difficulty] || 0;
  const deltas = [];
  for (const rawPlayerId of match.players) {
    const playerId = idOf(rawPlayerId);
    const amount = winnerId && playerId === String(winnerId) ? reward : 0;
    const existing = await RewardTransaction.findOne({
      userId: rawPlayerId,
      currency: 'rp',
      idempotencyKey: `tournament:${match.matchId}:${playerId}`,
    }).session(session);
    if (existing) {
      deltas.push({ userId: playerId, amount: existing.amount, balanceAfter: existing.balanceAfter });
      continue;
    }
    let balanceAfter;
    if (amount > 0) {
      const updated = await User.findByIdAndUpdate(rawPlayerId, { $inc: { rankPoints: amount } }, { new: true, session });
      if (!updated) throw new Error('Tournament participant no longer exists.');
      balanceAfter = Number(updated.rankPoints) || 0;
    } else {
      const user = await User.findById(rawPlayerId).select('rankPoints').session(session);
      if (!user) throw new Error('Tournament participant no longer exists.');
      balanceAfter = Number(user.rankPoints) || 0;
    }
    await RewardTransaction.create([{
      userId: rawPlayerId,
      currency: 'rp',
      amount,
      source: 'tournament',
      idempotencyKey: `tournament:${match.matchId}:${playerId}`,
      relatedId: match.matchId,
      seasonId: match.seasonId,
      balanceAfter,
    }], { session });
    deltas.push({ userId: playerId, amount, balanceAfter });
  }
  match.rpDeltas = deltas;
  return deltas;
}

async function writeTournamentLeaderboardRecord(match, winnerId, outcome, session) {
  const participants = match.players.map((playerId, index) => {
    const userId = idOf(playerId);
    const participantOutcome = outcome === 'draw' ? 'draw' : userId === String(winnerId) ? 'win' : 'loss';
    return { userId, username: match.playerNames[index] || 'Player', outcome: participantOutcome, score: participantOutcome === 'win' ? 1 : 0 };
  });
  await recordMatchResult({
    matchId: `tournament:${match.matchId}`,
    category: 'multiplayer',
    participants,
    winnerId: winnerId || null,
    language: match.language,
    difficulty: match.difficulty,
    finalizedAt: match.finalizedAt,
  }, LeaderboardMatch, session);
}

async function finalizeMatch(match, { winnerId = null, status = 'draw', now = new Date(), reason = null }, session) {
  match.status = status;
  match.winnerId = winnerId ? String(winnerId) : null;
  match.finalizedAt = now;
  match.cancelReason = reason;
  const deltas = status === 'completed' || status === 'forfeit'
    ? await writeRpTransactions(match, winnerId, session)
    : await writeRpTransactions(match, null, session);
  await match.save({ session });
  await writeTournamentLeaderboardRecord(match, winnerId, status === 'draw' ? 'draw' : 'completed', session);
  return deltas;
}

async function buildSeasonLeaderboard(seasonId, viewerId, limit = 10) {
  const stats = await TournamentMatch.aggregate([
    { $match: { seasonId, status: { $in: ['completed', 'draw', 'forfeit'] } } },
    { $unwind: '$players' },
    { $group: {
      _id: '$players',
      wins: { $sum: { $cond: [{ $eq: ['$winnerId', { $toString: '$players' }] }, 1, 0] } },
      draws: { $sum: { $cond: [{ $eq: ['$status', 'draw'] }, 1, 0] } },
      matches: { $sum: 1 },
    } },
  ]);
  const userIds = stats.map((entry) => entry._id);
  const statById = new Map(stats.map((entry) => [String(entry._id), entry]));
  const users = await User.find({
    isPublic: { $ne: false },
    $or: [
      ...(userIds.length ? [{ _id: { $in: userIds } }] : []),
      { rankPoints: { $gt: 0 } },
    ],
  })
    .select('username name profileImage rankPoints')
    .lean();
  const sorted = users.map((user) => {
    const stat = statById.get(String(user._id)) || {};
    const matches = stat.matches || 0;
    const wins = stat.wins || 0;
    const draws = stat.draws || 0;
    return {
      userId: String(user._id),
      username: user.username || user.name || 'Player',
      profileImage: user.profileImage || null,
      rankPoints: Number(user.rankPoints) || 0,
      wins,
      draws,
      losses: Math.max(0, matches - wins - draws),
      matchesPlayed: matches,
    };
  }).sort((a, b) => b.rankPoints - a.rankPoints || b.wins - a.wins || a.userId.localeCompare(b.userId))
    .map((row, index) => ({ ...row, rank: index + 1, isCurrentUser: row.userId === String(viewerId) }));
  return {
    rows: sorted.slice(0, limit),
    me: sorted.find((row) => row.isCurrentUser) || null,
    total: sorted.length,
  };
}

exports.getState = async (req, res) => {
  try {
    const userId = new mongoose.Types.ObjectId(req.user.id);
    const now = new Date();
    const season = await ensureActiveSeason(now);
    const activeMatch = await TournamentMatch.findOne({ players: userId, status: 'active' }).sort({ createdAt: -1 });
    let queue = await TournamentQueueEntry.findOne({ userId });
    if (activeMatch && queue?.status === 'matched') {
      await TournamentQueueEntry.updateOne({ _id: queue._id, status: 'matched' }, { $set: { lastSeenAt: now, expiresAt: new Date(activeMatch.endsAt.getTime() + MATCH_DISCONNECT_GRACE_MS + 60_000) } });
      queue = await TournamentQueueEntry.findById(queue._id);
    } else if (queue?.status === 'queued' && queue.expiresAt > now) {
      await TournamentQueueEntry.updateOne({ _id: queue._id, status: 'queued' }, { $set: { lastSeenAt: now, expiresAt: new Date(now.getTime() + QUEUE_TTL_MS) } });
      queue = await TournamentQueueEntry.findById(queue._id);
    } else if (queue && !activeMatch) {
      await TournamentQueueEntry.deleteOne({ _id: queue._id });
      queue = null;
    }

    const user = await User.findById(userId).select('username name profileImage rankPoints');
    const seasonBoard = await buildSeasonLeaderboard(season.seasonId, userId, 10);
    const [recentMatches, onlineQueued] = await Promise.all([
      TournamentMatch.find({ players: userId }).sort({ createdAt: -1 }).limit(10).lean(),
      TournamentQueueEntry.countDocuments({ status: 'queued', expiresAt: { $gt: now } }),
    ]);
    const profileMatchIds = [activeMatch, ...recentMatches].filter(Boolean).flatMap((match) => match.players);
    const publicProfiles = await getPublicPlayerProfiles(profileMatchIds);
    const rank = getRankForPoints(user?.rankPoints || 0);
    res.json({
      season: {
        seasonId: season.seasonId,
        seasonNumber: season.seasonNumber,
        status: season.status,
        startsAt: season.startsAt,
        endsAt: season.endsAt,
        daysRemaining: Math.max(0, Math.ceil((season.endsAt.getTime() - now.getTime()) / (24 * 60 * 60 * 1000))),
      },
      player: {
        username: user?.username || user?.name || 'Player',
        rankPoints: Number(user?.rankPoints) || 0,
        rank,
        seasonRank: seasonBoard.me?.rank || null,
        wins: seasonBoard.me?.wins || 0,
        losses: seasonBoard.me?.losses || 0,
        draws: seasonBoard.me?.draws || 0,
        matchesPlayed: seasonBoard.me?.matchesPlayed || 0,
      },
      leaderboard: seasonBoard,
      queue: queue?.status === 'queued' ? {
        status: 'queued', language: queue.language, difficulty: queue.difficulty, queuedAt: queue.queuedAt,
      } : null,
      activeMatch: activeMatch ? publicMatch(activeMatch, userId, publicProfiles) : null,
      recentMatches: recentMatches.map((match) => publicMatch(match, userId, publicProfiles)),
      queuedPlayerCount: onlineQueued,
      rewardPolicy: MATCH_RP_WIN,
      matchRules: {
        winner: 'First correct server-checked repair receives the listed RP.',
        loss: 'No RP is removed for a loss.',
        draw: 'Timeouts with no correct repair award no RP.',
        disconnect: `A player inactive for ${MATCH_DISCONNECT_GRACE_MS / 1000} seconds may forfeit; the disconnected player loses no RP.`,
      },
    });
  } catch (error) {
    console.error('[Tournament] State lookup failed:', error);
    res.status(500).json({ message: 'Could not load tournament status.' });
  }
};

exports.enqueue = async (req, res) => {
  try {
    const { language, difficulty } = req.body || {};
    if (!LANGUAGES.includes(language) || !DIFFICULTIES.includes(difficulty)) {
      return res.status(400).json({ message: 'Choose a supported language and difficulty.' });
    }
    const season = await ensureActiveSeason(new Date());
    const userId = new mongoose.Types.ObjectId(req.user.id);
    const activeMatch = await TournamentMatch.findOne({ players: userId, status: 'active' });
    if (activeMatch) return res.status(409).json({ activeMatch: publicMatch(activeMatch, userId), message: 'You already have an active tournament match.' });

    const user = await User.findById(userId).select('username name');
    if (!user) return res.status(404).json({ message: 'User not found.' });
    const username = String(user.username || user.name || 'Player').slice(0, 32);
    const now = new Date();
    let ownEntry = await TournamentQueueEntry.findOne({ userId });
    if (ownEntry?.status === 'matched') {
      const existingMatch = ownEntry.matchId ? await TournamentMatch.findOne({ matchId: ownEntry.matchId, status: 'active' }) : null;
      if (existingMatch) return res.json({ status: 'matched', match: publicMatch(existingMatch, userId) });
      await TournamentQueueEntry.deleteOne({ _id: ownEntry._id });
      ownEntry = null;
    }
    if (ownEntry?.status === 'queued' && ownEntry.expiresAt > now) {
      if (ownEntry.language !== language || ownEntry.difficulty !== difficulty || ownEntry.seasonId !== season.seasonId) {
        await TournamentQueueEntry.deleteOne({ _id: ownEntry._id, status: 'queued' });
        ownEntry = null;
      } else {
        await TournamentQueueEntry.updateOne({ _id: ownEntry._id, status: 'queued' }, { $set: { lastSeenAt: now, expiresAt: new Date(now.getTime() + QUEUE_TTL_MS) } });
      }
    } else if (ownEntry) {
      await TournamentQueueEntry.deleteOne({ _id: ownEntry._id });
      ownEntry = null;
    }
    if (!ownEntry) {
      try {
        ownEntry = await TournamentQueueEntry.create({
          userId, username, language, difficulty, seasonId: season.seasonId,
          status: 'queued', queuedAt: now, lastSeenAt: now,
          expiresAt: new Date(now.getTime() + QUEUE_TTL_MS),
        });
      } catch (error) {
        if (error.code !== 11000) throw error;
        ownEntry = await TournamentQueueEntry.findOne({ userId });
      }
    }

    if (!ownEntry || ownEntry.status !== 'queued') return res.status(409).json({ message: 'Could not reserve your queue entry. Try again.' });
    const matchId = crypto.randomUUID();
    const opponent = await TournamentQueueEntry.findOneAndUpdate(
      {
        _id: { $ne: ownEntry._id }, userId: { $ne: userId },
        language, difficulty, seasonId: season.seasonId,
        status: 'queued', expiresAt: { $gt: now },
      },
      { $set: { status: 'matched', matchId } },
      { new: true, sort: { queuedAt: 1 } },
    );
    if (!opponent) {
      notifyUser(userId, 'tournament-queue-updated', { status: 'queued', language, difficulty });
      return res.status(202).json({ status: 'queued', language, difficulty, queuedAt: ownEntry.queuedAt });
    }

    const ownMatched = await TournamentQueueEntry.findOneAndUpdate(
      { _id: ownEntry._id, status: 'queued' },
      { $set: { status: 'matched', matchId } },
      { new: true },
    );
    if (!ownMatched) {
      await TournamentQueueEntry.updateOne({ _id: opponent._id, status: 'matched', matchId }, { $set: { status: 'queued', matchId: null, expiresAt: new Date(now.getTime() + QUEUE_TTL_MS) } });
      return res.status(409).json({ message: 'Queue entry changed. Try again.' });
    }

    const pool = listChallengeIds(language, difficulty);
    const challengeId = pool[crypto.randomInt(0, pool.length)];
    const challenge = getPublicChallenge(challengeId);
    let match;
    try {
      match = await TournamentMatch.create({
        matchId,
        seasonId: season.seasonId,
        seasonNumber: season.seasonNumber,
        players: [ownEntry.userId, opponent.userId],
        playerNames: [username, opponent.username],
        language,
        difficulty,
        challengeId,
        catalogVersion: CATALOG_VERSION,
        status: 'active',
        startedAt: now,
        endsAt: new Date(now.getTime() + Math.min(MATCH_TIME_MS, challenge.timeLimitSeconds * 1000)),
      });
      await TournamentQueueEntry.updateMany(
        { matchId, status: 'matched' },
        { $set: { expiresAt: new Date(match.endsAt.getTime() + MATCH_DISCONNECT_GRACE_MS + 60_000) } },
      );
    } catch (error) {
      await TournamentMatch.deleteOne({ matchId }).catch(() => {});
      await TournamentQueueEntry.updateMany(
        { matchId, status: 'matched' },
        { $set: { status: 'queued', matchId: null, expiresAt: new Date(now.getTime() + QUEUE_TTL_MS) } },
      ).catch(() => {});
      throw error;
    }
    const publicForSelf = publicMatch(match, userId);
    const publicForOpponent = publicMatch(match, opponent.userId);
    notifyUser(userId, 'tournament-match-found', publicForSelf);
    notifyUser(opponent.userId, 'tournament-match-found', publicForOpponent);
    return res.status(201).json({ status: 'matched', match: publicForSelf });
  } catch (error) {
    console.error('[Tournament] Queue request failed:', error);
    return res.status(500).json({ message: 'Could not enter matchmaking.' });
  }
};

exports.cancelQueue = async (req, res) => {
  try {
    const userId = new mongoose.Types.ObjectId(req.user.id);
    const removed = await TournamentQueueEntry.findOneAndDelete({ userId, status: 'queued' });
    if (!removed) {
      const match = await TournamentMatch.findOne({ players: userId, status: 'active' }).sort({ createdAt: -1 });
      if (match) return res.status(409).json({ message: 'A match has already started.', match: publicMatch(match, userId) });
      return res.json({ status: 'not-queued' });
    }
    notifyUser(userId, 'tournament-queue-updated', { status: 'cancelled' });
    return res.json({ status: 'cancelled' });
  } catch (error) {
    console.error('[Tournament] Queue cancellation failed:', error);
    res.status(500).json({ message: 'Could not cancel matchmaking.' });
  }
};

exports.getMatch = async (req, res) => {
  try {
    const userId = new mongoose.Types.ObjectId(req.user.id);
    const match = await TournamentMatch.findOne({ matchId: req.params.matchId, players: userId });
    if (!match) return res.status(404).json({ message: 'Tournament match not found.' });
    const publicProfiles = await getPublicPlayerProfiles(match.players);
    const now = new Date();
    await TournamentQueueEntry.updateOne(
      { matchId: match.matchId, userId },
      { $set: { lastSeenAt: now, expiresAt: new Date(match.endsAt.getTime() + MATCH_DISCONNECT_GRACE_MS + 60_000) } },
    );
    return res.json({ match: publicMatch(match, userId, publicProfiles) });
  } catch (error) {
    console.error('[Tournament] Match lookup failed:', error);
    return res.status(500).json({ message: 'Could not load this match.' });
  }
};

exports.submitMatch = async (req, res) => {
  const { code } = req.body || {};
  if (typeof code !== 'string' || !code.trim() || code.length > 20000) {
    return res.status(400).json({ message: 'Enter a repair under 20,000 characters.' });
  }
  const session = await User.db.startSession();
  let response;
  let notifyMatch = null;
  try {
    await session.withTransaction(async () => {
      const userId = new mongoose.Types.ObjectId(req.user.id);
      const match = await TournamentMatch.findOne({ matchId: req.params.matchId, players: userId }).session(session);
      if (!match) { response = { statusCode: 404, body: { message: 'Tournament match not found.' } }; return; }
      if (match.status !== 'active') { response = { statusCode: 409, body: { message: 'This match is already finished.', match: publicMatch(match, userId) } }; return; }
      const now = new Date();
      if (now >= match.endsAt) {
        await finalizeMatch(match, { status: 'draw', now, reason: 'Match time expired with no accepted repair' }, session);
        response = { statusCode: 200, body: { correct: false, finished: true, match: publicMatch(match, userId) } };
        notifyMatch = match;
        return;
      }
      const challenge = getChallenge(match.challengeId);
      const validation = validateRepair(match.challengeId, code);
      if (!challenge || !validation) { response = { statusCode: 500, body: { message: 'The challenge validator is unavailable.' } }; return; }
      const playerId = String(userId);
      let submission = match.submissions.find((entry) => entry.userId === playerId);
      if (submission?.solvedAt) { response = { statusCode: 409, body: { message: 'Your solution was already accepted.', match: publicMatch(match, userId) } }; return; }
      if ((submission?.attempts || 0) >= MAX_MATCH_SUBMISSIONS) { response = { statusCode: 429, body: { message: 'Submission limit reached for this match.' } }; return; }
      if (submission?.lastSubmittedAt && now.getTime() - submission.lastSubmittedAt.getTime() < 500) {
        response = { statusCode: 429, body: { message: 'Wait a moment before submitting again.' } };
        return;
      }
      if (!submission) {
        submission = { userId: playerId, attempts: 0, solvedAt: null, lastSubmittedAt: null, solutionHash: null };
        match.submissions.push(submission);
      }
      submission.attempts += 1;
      submission.lastSubmittedAt = now;
      submission.solutionHash = crypto.createHash('sha256').update(code).digest('hex');
      if (!validation.valid) {
        await match.save({ session });
        response = { statusCode: 200, body: { correct: false, message: validation.message, match: publicMatch(match, userId) } };
        return;
      }

      submission.solvedAt = now;
      await finalizeMatch(match, { winnerId: playerId, status: 'completed', now }, session);
      response = {
        statusCode: 200,
        body: { correct: true, finished: true, explanation: validation.explanation, match: publicMatch(match, userId) },
      };
      notifyMatch = match;
    });
    if (notifyMatch) {
      for (const playerId of notifyMatch.players) notifyUser(playerId, 'tournament-match-finished', { match: publicMatch(notifyMatch, playerId) });
    }
    return res.status(response?.statusCode || 500).json(response?.body || { message: 'Could not save the submission.' });
  } catch (error) {
    console.error('[Tournament] Submission transaction failed:', error);
    return res.status(503).json({ message: 'The result could not be saved safely. Please try again.' });
  } finally {
    await session.endSession();
  }
};

exports.getProfileSummary = async (req, res) => {
  try {
    const userId = new mongoose.Types.ObjectId(req.user.id);
    const user = await User.findById(userId).select('rankPoints');
    if (!user) return res.status(404).json({ message: 'User not found.' });
    const currentSeason = await TournamentSeason.findOne({ status: 'active' });
    const matchFilter = { players: userId, status: { $in: ['completed', 'draw', 'forfeit'] } };
    if (currentSeason) matchFilter.seasonId = currentSeason.seasonId;
    const [seasonMatches, allMatches, history, rpTransactions, seasonHistory] = await Promise.all([
      currentSeason ? TournamentMatch.find(matchFilter).lean() : [],
      TournamentMatch.find({ players: userId, status: { $in: ['completed', 'draw', 'forfeit'] } }).lean(),
      TournamentMatch.find({ players: userId }).sort({ createdAt: -1 }).limit(10).lean(),
      RewardTransaction.find({ userId, currency: 'rp' }).sort({ createdAt: -1 }).limit(10).lean(),
      SeasonStanding.find({ userId }).sort({ seasonNumber: -1 }).limit(5)
        .select('seasonId seasonNumber rankPoints finalRank wins losses draws finalizedAt').lean(),
    ]);
    const publicProfiles = await getPublicPlayerProfiles(history.flatMap((match) => match.players));
    const statsFor = (matches) => matches.reduce((stats, match) => {
      const won = String(match.winnerId) === String(userId);
      const drawn = match.status === 'draw';
      stats.matchesPlayed += 1;
      if (drawn) stats.draws += 1;
      else if (won) stats.wins += 1;
      else stats.losses += 1;
      return stats;
    }, { matchesPlayed: 0, wins: 0, losses: 0, draws: 0 });
    const seasonStats = statsFor(seasonMatches);
    const lifetimeStats = statsFor(allMatches);
    const transactions = rpTransactions.map((entry) => ({
      amount: entry.amount,
      source: entry.source,
      relatedId: entry.relatedId,
      seasonId: entry.seasonId,
      createdAt: entry.createdAt,
      balanceAfter: entry.balanceAfter,
    }));
    return res.json({
      currentSeason: currentSeason ? { seasonId: currentSeason.seasonId, seasonNumber: currentSeason.seasonNumber, endsAt: currentSeason.endsAt } : null,
      rankPoints: Number(user.rankPoints) || 0,
      rank: getRankForPoints(user.rankPoints || 0),
      seasonStats,
      lifetimeStats,
      recentMatches: history.map((match) => publicMatch(match, userId, publicProfiles)),
      recentRpTransactions: transactions,
      seasonHistory: seasonHistory.map((standing) => ({
        seasonId: standing.seasonId,
        seasonNumber: standing.seasonNumber,
        finalRank: standing.finalRank,
        rankPoints: standing.rankPoints,
        wins: standing.wins,
        losses: standing.losses,
        draws: standing.draws,
        finalizedAt: standing.finalizedAt,
      })),
      previousSeason: seasonHistory[0] ? {
        seasonId: seasonHistory[0].seasonId,
        seasonNumber: seasonHistory[0].seasonNumber,
        finalRank: seasonHistory[0].finalRank,
        rankPoints: seasonHistory[0].rankPoints,
        wins: seasonHistory[0].wins,
      } : null,
    });
  } catch (error) {
    console.error('[Tournament] Profile summary failed:', error);
    return res.status(500).json({ message: 'Could not load tournament profile stats.' });
  }
};

exports.cleanupExpiredMatches = async (now = new Date()) => {
  const expired = await TournamentMatch.find({ status: 'active', endsAt: { $lte: now } }).limit(100);
  for (const match of expired) {
    const session = await User.db.startSession();
    let finalizedMatch = null;
    try {
      await session.withTransaction(async () => {
        const current = await TournamentMatch.findOne({ _id: match._id, status: 'active' }).session(session);
        if (!current) return;
        await finalizeMatch(current, { status: 'draw', now, reason: 'Match timer expired' }, session);
        finalizedMatch = current;
      });
      if (finalizedMatch) for (const playerId of finalizedMatch.players) notifyUser(playerId, 'tournament-match-finished', { match: publicMatch(finalizedMatch, playerId) });
    } catch (error) {
      console.error('[Tournament] Match expiry failed:', error.message);
    } finally {
      await session.endSession();
    }
  }

  const active = await TournamentMatch.find({ status: 'active', endsAt: { $gt: now } }).limit(100);
  for (const match of active) {
    const entries = await TournamentQueueEntry.find({ matchId: match.matchId, status: 'matched' }).select('userId lastSeenAt');
    if (entries.length < 2) continue;
    const online = entries.filter((entry) => now.getTime() - entry.lastSeenAt.getTime() <= MATCH_DISCONNECT_GRACE_MS);
    if (online.length !== 1) continue;
    const session = await User.db.startSession();
    try {
      let finalizedMatch = null;
      await session.withTransaction(async () => {
        const current = await TournamentMatch.findOne({ _id: match._id, status: 'active' }).session(session);
        if (!current) return;
        const latestEntries = await TournamentQueueEntry.find({ matchId: current.matchId, status: 'matched' }).session(session);
        const lastSeenById = new Map(latestEntries.map((entry) => [String(entry.userId), entry.lastSeenAt]));
        const available = current.players.filter((playerId) => now.getTime() - (lastSeenById.get(String(playerId))?.getTime() || 0) <= MATCH_DISCONNECT_GRACE_MS);
        if (available.length !== 1) return;
        await finalizeMatch(current, { winnerId: String(available[0]), status: 'forfeit', now, reason: 'Opponent disconnected past the grace period' }, session);
        finalizedMatch = current;
      });
      if (finalizedMatch) for (const playerId of finalizedMatch.players) notifyUser(playerId, 'tournament-match-finished', { match: publicMatch(finalizedMatch, playerId) });
    } catch (error) {
      console.error('[Tournament] Disconnect check failed:', error.message);
    } finally {
      await session.endSession();
    }
  }
};

exports.getPublicMatch = publicMatch;
exports.getRankForPoints = getRankForPoints;
