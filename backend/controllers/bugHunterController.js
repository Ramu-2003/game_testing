const crypto = require('crypto');
const mongoose = require('mongoose');
const BugHunterAttempt = require('../models/BugHunterAttempt');
const User = require('../models/User');
const { awardXpOnce } = require('../services/rewards');
const {
  LANGUAGES,
  DIFFICULTIES,
  XP_REWARDS,
  CATALOG_VERSION,
  listChallengeIds,
  getPublicChallenge,
  getChallenge,
  validateRepair,
  getHint,
} = require('../data/bugHunterChallenges');

function publicAttempt(attempt) {
  const challenge = getPublicChallenge(attempt.challengeId);
  if (!challenge) return null;
  return {
    attemptId: attempt.attemptId,
    catalogVersion: attempt.catalogVersion || CATALOG_VERSION,
    status: attempt.status,
    startedAt: attempt.startedAt,
    attemptCount: attempt.attemptCount,
    hintCount: attempt.hintCount,
    unlockedHints: Array.from({ length: attempt.hintCount }, (_, index) => getHint(attempt.challengeId, index)).filter(Boolean),
    xpReward: attempt.rewardAvailable === false ? 0 : XP_REWARDS[attempt.difficulty],
    rewardAvailable: attempt.rewardAvailable !== false,
    challenge,
  };
}

async function getOrExpireActiveAttempt(userId, now = new Date()) {
  const active = await BugHunterAttempt.findOne({ userId, status: 'active' });
  if (!active) return null;
  const challenge = getChallenge(active.challengeId);
  if (!challenge || now.getTime() - active.startedAt.getTime() >= challenge.timeLimitSeconds * 1000) {
    await BugHunterAttempt.updateOne(
      { _id: active._id, status: 'active' },
      { $set: { status: 'abandoned' } },
    );
    return null;
  }
  return active;
}

exports.getCatalog = async (_req, res) => {
  const challengeCounts = Object.fromEntries(LANGUAGES.map((language) => [
    language,
    Object.fromEntries(DIFFICULTIES.map((difficulty) => [difficulty, listChallengeIds(language, difficulty).length])),
  ]));
  res.json({ catalogVersion: CATALOG_VERSION, languages: LANGUAGES, difficulties: DIFFICULTIES, rewards: XP_REWARDS, challengeCounts });
};

exports.getActiveAttempt = async (req, res) => {
  try {
    const attempt = await getOrExpireActiveAttempt(req.user.id);
    res.json({ attempt: attempt ? publicAttempt(attempt) : null });
  } catch (error) {
    console.error('[Bug Hunter] Active attempt lookup failed:', error);
    res.status(500).json({ message: 'Could not load your active challenge.' });
  }
};

exports.startAttempt = async (req, res) => {
  try {
    const { language, difficulty } = req.body || {};
    if (!LANGUAGES.includes(language) || !DIFFICULTIES.includes(difficulty)) {
      return res.status(400).json({ message: 'Choose a supported language and difficulty.' });
    }

    const current = await getOrExpireActiveAttempt(req.user.id);
    if (current) {
      return res.status(409).json({
        message: 'Finish your active challenge before starting another.',
        attempt: publicAttempt(current),
      });
    }

    const ids = listChallengeIds(language, difficulty);
    if (!ids.length) return res.status(404).json({ message: 'No challenge is available for that selection yet.' });
    const [recentIds, rewardedIds] = await Promise.all([
      BugHunterAttempt.distinct('challengeId', {
        userId: req.user.id,
        language,
        difficulty,
        startedAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
      }),
      BugHunterAttempt.distinct('challengeId', {
        userId: req.user.id,
        language,
        difficulty,
        status: 'completed',
        xpAwarded: { $gt: 0 },
      }),
    ]);
    const unplayedRewardableIds = ids.filter((id) => !recentIds.includes(id) && !rewardedIds.includes(id));
    const unclaimedIds = ids.filter((id) => !rewardedIds.includes(id));
    const freshIds = ids.filter((id) => !recentIds.includes(id));
    const pool = unplayedRewardableIds.length
      ? unplayedRewardableIds
      : unclaimedIds.length
        ? unclaimedIds
        : freshIds.length
          ? freshIds
          : ids;
    const challengeId = pool[crypto.randomInt(0, pool.length)];
    const rewardAvailable = !rewardedIds.includes(challengeId);
    const attempt = await BugHunterAttempt.create({
      attemptId: crypto.randomUUID(),
      catalogVersion: CATALOG_VERSION,
      userId: req.user.id,
      challengeId,
      language,
      difficulty,
      status: 'active',
      rewardAvailable,
    });
    return res.status(201).json({ attempt: publicAttempt(attempt) });
  } catch (error) {
    if (error.code === 11000) {
      const current = await getOrExpireActiveAttempt(req.user.id).catch(() => null);
      return res.status(409).json({ message: 'An active challenge already exists.', attempt: current ? publicAttempt(current) : null });
    }
    console.error('[Bug Hunter] Start attempt failed:', error);
    return res.status(500).json({ message: 'Could not start a challenge.' });
  }
};

exports.requestHint = async (req, res) => {
  try {
    const attempt = await getOrExpireActiveAttempt(req.user.id);
    if (!attempt || attempt.attemptId !== req.params.attemptId) {
      return res.status(404).json({ message: 'Active challenge not found.' });
    }
    const hint = getHint(attempt.challengeId, attempt.hintCount);
    if (!hint) return res.status(404).json({ message: 'No more hints are available.' });
    await BugHunterAttempt.updateOne(
      { _id: attempt._id, userId: req.user.id, status: 'active', hintCount: attempt.hintCount },
      { $inc: { hintCount: 1 } },
    );
    return res.json({ hint, hintCount: attempt.hintCount + 1, hintLimit: getChallenge(attempt.challengeId).hints.length });
  } catch (error) {
    console.error('[Bug Hunter] Hint request failed:', error);
    return res.status(500).json({ message: 'Could not load a hint.' });
  }
};

exports.submitRepair = async (req, res) => {
  const { code } = req.body || {};
  if (typeof code !== 'string' || !code.trim() || code.length > 20000) {
    return res.status(400).json({ message: 'Enter a repair under 20,000 characters.' });
  }

  const attempt = await getOrExpireActiveAttempt(req.user.id);
  if (!attempt || attempt.attemptId !== req.params.attemptId) {
    return res.status(404).json({ message: 'Active challenge not found. Start a fresh challenge.' });
  }
  if (attempt.attemptCount >= 50) return res.status(429).json({ message: 'Submission limit reached for this challenge.' });
  if (attempt.lastSubmittedAt && Date.now() - attempt.lastSubmittedAt.getTime() < 500) {
    return res.status(429).json({ message: 'Wait a moment before checking another repair.' });
  }

  const validation = validateRepair(attempt.challengeId, code);
  if (!validation.valid) {
    await BugHunterAttempt.updateOne(
      { _id: attempt._id, userId: req.user.id, status: 'active' },
      { $inc: { attemptCount: 1 }, $set: { lastSubmittedAt: new Date() } },
    );
    return res.json({ correct: false, message: validation.message });
  }

  const session = await User.db.startSession();
  let response;
  try {
    await session.withTransaction(async () => {
      const completed = await BugHunterAttempt.findOneAndUpdate(
        { _id: attempt._id, userId: req.user.id, status: 'active' },
        {
          $inc: { attemptCount: 1 },
          $set: {
            status: 'completed',
            completedAt: new Date(),
            lastSubmittedAt: new Date(),
            xpAwarded: 0,
            completionMs: Math.max(0, Date.now() - attempt.startedAt.getTime()),
          },
        },
        { new: true, session },
      );
      if (!completed) {
        const already = await BugHunterAttempt.findById(attempt._id).session(session);
        response = already?.status === 'completed'
          ? { alreadyCompleted: true, xpEarned: 0 }
          : { conflict: true };
        return;
      }
      const priorRewardedAttempt = await BugHunterAttempt.exists({
        _id: { $ne: attempt._id },
        userId: req.user.id,
        challengeId: attempt.challengeId,
        status: 'completed',
        xpAwarded: { $gt: 0 },
      }).session(session);
      const reward = attempt.rewardAvailable !== false && !priorRewardedAttempt
        ? await awardXpOnce({
          userId: req.user.id,
          amount: XP_REWARDS[attempt.difficulty],
          source: 'bug-hunter',
          idempotencyKey: `bug-hunter:${req.user.id}:${attempt.challengeId}`,
          relatedId: attempt.attemptId,
          session,
        })
        : { awarded: false, balance: null };
      if (reward.awarded) {
        await BugHunterAttempt.updateOne(
          { _id: completed._id, userId: req.user.id, status: 'completed' },
          { $set: { xpAwarded: XP_REWARDS[attempt.difficulty] } },
          { session },
        );
      }
      response = {
        completed: true,
        xpEarned: reward.awarded ? XP_REWARDS[attempt.difficulty] : 0,
        newXpBalance: reward.balance,
        explanation: validation.explanation,
        completionMs: completed.completionMs,
      };
    });
    if (response?.conflict) return res.status(409).json({ message: 'This challenge changed. Refresh and try again.' });
    return res.json(response || { message: 'Could not save the challenge result.' });
  } catch (error) {
    console.error('[Bug Hunter] Submission transaction failed:', error);
    return res.status(503).json({ message: 'The result could not be saved safely. Please try again.' });
  } finally {
    await session.endSession();
  }
};

exports.getStats = async (req, res) => {
  try {
    const userId = mongoose.Types.ObjectId.isValid(req.user.id) ? new mongoose.Types.ObjectId(req.user.id) : req.user.id;
    const [summary, byLanguage, history] = await Promise.all([
      BugHunterAttempt.aggregate([
        { $match: { userId } },
        { $group: {
          _id: null,
          attempted: { $sum: 1 },
          completed: { $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] } },
          xpEarned: { $sum: '$xpAwarded' },
        } },
      ]),
      BugHunterAttempt.aggregate([
        { $match: { userId } },
        { $group: {
          _id: { language: '$language', challengeId: '$challengeId' },
          attempts: { $sum: 1 },
          completedAttempts: { $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] } },
          xpEarned: { $sum: '$xpAwarded' },
        } },
        { $group: {
          _id: '$_id.language',
          attempted: { $sum: '$attempts' },
          completed: { $sum: '$completedAttempts' },
          solvedChallenges: { $sum: { $cond: [{ $gt: ['$completedAttempts', 0] }, 1, 0] } },
          xpEarned: { $sum: '$xpEarned' },
        } },
      ]),
      BugHunterAttempt.find({ userId }).sort({ startedAt: -1 }).limit(6)
        .select('attemptId challengeId language difficulty status startedAt completedAt attemptCount hintCount xpAwarded completionMs').lean(),
    ]);
    const total = summary[0] || { attempted: 0, completed: 0, xpEarned: 0, bestCompletionMs: null };
    const uniqueSolvedChallenges = byLanguage.reduce((sum, language) => sum + (language.solvedChallenges || 0), 0);
    const best = await BugHunterAttempt.findOne({
      userId,
      status: 'completed',
      completionMs: { $type: 'number' },
    }).sort({ completionMs: 1 }).select('completionMs').lean();
    return res.json({
      attempted: total.attempted,
      completed: uniqueSolvedChallenges,
      completedAttempts: total.completed,
      successRate: total.attempted ? Math.round((total.completed / total.attempted) * 100) : 0,
      xpEarned: total.xpEarned,
      bestCompletionMs: best?.completionMs ?? null,
      byLanguage,
      history: history.map((entry) => ({
        attemptId: entry.attemptId,
        challengeId: entry.challengeId,
        title: getChallenge(entry.challengeId)?.title || 'Challenge',
        language: entry.language,
        difficulty: entry.difficulty,
        status: entry.status,
        startedAt: entry.startedAt,
        completedAt: entry.completedAt,
        attemptCount: entry.attemptCount,
        hintCount: entry.hintCount,
        xpAwarded: entry.xpAwarded,
        completionMs: entry.completionMs,
      })),
    });
  } catch (error) {
    console.error('[Bug Hunter] Stats lookup failed:', error);
    return res.status(500).json({ message: 'Could not load Bug Hunter stats.' });
  }
};
