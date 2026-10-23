const TournamentSeason = require('../models/TournamentSeason');
const TournamentMatch = require('../models/TournamentMatch');
const TournamentQueueEntry = require('../models/TournamentQueueEntry');
const SeasonStanding = require('../models/SeasonStanding');
const User = require('../models/User');
const rankTiers = require('../../shared/rankTiers.json');
const { SEASON_DAYS, RP_CARRYOVER_FACTOR, DAY_MS } = require('../config/competitivePolicy');

function getRankForPoints(points) {
  const rp = Math.max(0, Number(points) || 0);
  const tier = rankTiers.find((item) => rp >= item.min && (item.max === null || rp < item.max)) || rankTiers[0];
  const next = rankTiers[rankTiers.indexOf(tier) + 1] || null;
  return {
    ...tier,
    progress: next ? Math.max(0, Math.min(100, Math.floor(((rp - tier.min) / (next.min - tier.min)) * 100))) : 100,
    nextRank: next?.name || null,
    pointsToNextRank: next ? Math.max(0, next.min - rp) : 0,
  };
}

async function createNextSeason(now, previousSeason = null) {
  const highest = previousSeason || await TournamentSeason.findOne().sort({ seasonNumber: -1 });
  const seasonNumber = highest ? highest.seasonNumber + 1 : 0;
  const seasonId = `season-${seasonNumber}`;
  try {
    return await TournamentSeason.findOneAndUpdate(
      { seasonId },
      {
        $setOnInsert: {
          seasonNumber,
          seasonId,
          status: 'active',
          startsAt: now,
          endsAt: new Date(now.getTime() + SEASON_DAYS * DAY_MS),
          carryoverFactor: RP_CARRYOVER_FACTOR,
        },
      },
      { new: true, upsert: true },
    );
  } catch (error) {
    if (error.code !== 11000) throw error;
    return TournamentSeason.findOne({ status: 'active' });
  }
}

async function ensureActiveSeason(now = new Date()) {
  let active = await TournamentSeason.findOne({ status: 'active' });
  if (active && active.endsAt > now) return active;
  if (active) await rollSeasonOver(now);
  active = await TournamentSeason.findOne({ status: 'active' });
  return active || createNextSeason(now);
}

async function rollSeasonOver(now = new Date()) {
  const session = await User.db.startSession();
  let rolled = false;
  try {
    await session.withTransaction(async () => {
      const current = await TournamentSeason.findOne({ status: 'active', endsAt: { $lte: now } }).session(session);
      if (!current) return;

      const closed = await TournamentSeason.findOneAndUpdate(
        { _id: current._id, status: 'active', endsAt: { $lte: now } },
        { $set: { status: 'completed', completedAt: now } },
        { new: true, session },
      );
      if (!closed) return;

      await TournamentMatch.updateMany(
        { seasonId: current.seasonId, status: 'active' },
        { $set: { status: 'cancelled', cancelReason: 'Season ended before the match completed', finalizedAt: now } },
        { session },
      );
      await TournamentQueueEntry.deleteMany({ seasonId: current.seasonId }, { session });

      const stats = await TournamentMatch.aggregate([
        { $match: { seasonId: current.seasonId, status: { $in: ['completed', 'draw', 'forfeit'] } } },
        { $unwind: '$players' },
        { $group: {
          _id: '$players',
          matches: { $sum: 1 },
          wins: { $sum: { $cond: [{ $eq: ['$winnerId', { $toString: '$players' }] }, 1, 0] } },
          draws: { $sum: { $cond: [{ $eq: ['$status', 'draw'] }, 1, 0] } },
        } },
      ]).session(session);
      const statsById = new Map(stats.map((item) => [String(item._id), item]));
      const rankedIds = stats.map((item) => item._id);
      const users = await User.find({
        $or: [
          { _id: { $in: rankedIds.length ? rankedIds : [null] } },
          { rankPoints: { $gt: 0 } },
        ],
      }).select('_id name username profileImage rankPoints').session(session).lean();

      const rows = users.map((user) => {
        const statsForUser = statsById.get(String(user._id)) || { matches: 0, wins: 0, draws: 0 };
        return {
          user,
          rankPoints: Math.max(0, Number(user.rankPoints) || 0),
          wins: statsForUser.wins || 0,
          losses: Math.max(0, (statsForUser.matches || 0) - (statsForUser.wins || 0) - (statsForUser.draws || 0)),
          draws: statsForUser.draws || 0,
        };
      }).sort((a, b) => b.rankPoints - a.rankPoints || b.wins - a.wins || String(a.user._id).localeCompare(String(b.user._id)));

      if (rows.length) {
        await SeasonStanding.bulkWrite(rows.map((row, index) => ({
          updateOne: {
            filter: { seasonId: current.seasonId, userId: row.user._id },
            update: { $setOnInsert: {
              seasonId: current.seasonId,
              seasonNumber: current.seasonNumber,
              userId: row.user._id,
              username: row.user.username || row.user.name || 'Player',
              profileImage: row.user.profileImage || null,
              rankPoints: row.rankPoints,
              wins: row.wins,
              losses: row.losses,
              draws: row.draws,
              finalRank: index + 1,
              finalizedAt: now,
            } },
            upsert: true,
          },
        })), { session });

        await User.bulkWrite(rows.map((row) => ({
          updateOne: {
            filter: { _id: row.user._id },
            update: { $set: { rankPoints: Math.floor(row.rankPoints * current.carryoverFactor) } },
          },
        })), { session });
      }

      const nextNumber = current.seasonNumber + 1;
      const nextSeasonId = `season-${nextNumber}`;
      await TournamentSeason.findOneAndUpdate(
        { seasonId: nextSeasonId },
        { $setOnInsert: {
          seasonNumber: nextNumber,
          seasonId: nextSeasonId,
          status: 'active',
          startsAt: now,
          endsAt: new Date(now.getTime() + SEASON_DAYS * DAY_MS),
          carryoverFactor: RP_CARRYOVER_FACTOR,
        } },
        { upsert: true, new: true, session },
      );
      rolled = true;
    });
    return rolled;
  } finally {
    await session.endSession();
  }
}

let rolloverTimer = null;
let rolloverInFlight = false;

function startSeasonScheduler() {
  if (rolloverTimer) return;
  rolloverTimer = setInterval(async () => {
    if (rolloverInFlight) return;
    rolloverInFlight = true;
    try {
      await ensureActiveSeason(new Date());
    } catch (error) {
      console.error('[Tournament] Season check failed:', error.message);
    } finally {
      rolloverInFlight = false;
    }
  }, 60 * 1000);
  rolloverTimer.unref?.();
}

module.exports = { getRankForPoints, ensureActiveSeason, rollSeasonOver, startSeasonScheduler };
