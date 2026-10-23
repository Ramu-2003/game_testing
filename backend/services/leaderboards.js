const User = require('../models/User');
const LeaderboardMatch = require('../models/LeaderboardMatch');
const mongoose = require('mongoose');
const { LEADERBOARD_WIN_POINTS } = require('../config/competitivePolicy');
const { getCourseLevelCount } = require('../utils/curriculumStats');

const COURSE_KEYS = Object.freeze(['html', 'css', 'javascript', 'python', 'java']);

function normalizePagination(page, limit) {
  const pageNumber = Number.isInteger(Number(page)) ? Math.max(1, Number(page)) : 1;
  const pageSize = Number.isInteger(Number(limit)) ? Math.max(1, Math.min(50, Number(limit))) : 20;
  return { page: pageNumber, limit: pageSize, skip: (pageNumber - 1) * pageSize };
}

function getPeriodStart(period, now = new Date()) {
  if (period === '7d') return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  if (period === '30d') return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  return null;
}

function toRows(result, currentUserId) {
  const facet = result?.[0] || {};
  const total = facet.total?.[0]?.value || 0;
  const rows = (facet.rows || []).map((row) => ({
    rank: row.rank,
    userId: String(row.userId || row._id),
    username: row.username || 'Player',
    profileImage: row.profileImage || null,
    score: row.score || 0,
    wins: row.wins || 0,
    losses: row.losses || 0,
    draws: row.draws || 0,
    matchesPlayed: row.matchesPlayed || 0,
    winRate: row.matchesPlayed ? Math.round((row.wins / row.matchesPlayed) * 100) : 0,
    isCurrentUser: String(row.userId || row._id) === String(currentUserId),
    completedLevels: row.completedLevels || 0,
    totalLevels: row.totalLevels || null,
    completionPercent: row.completionPercent ?? null,
  }));
  const me = (facet.me || []).map((row) => ({
    rank: row.rank,
    userId: String(row.userId || row._id),
    username: row.username || 'Player',
    profileImage: row.profileImage || null,
    score: row.score || 0,
    wins: row.wins || 0,
    losses: row.losses || 0,
    draws: row.draws || 0,
    matchesPlayed: row.matchesPlayed || 0,
    winRate: row.matchesPlayed ? Math.round((row.wins / row.matchesPlayed) * 100) : 0,
    completedLevels: row.completedLevels || 0,
    totalLevels: row.totalLevels || null,
    completionPercent: row.completionPercent ?? null,
  }))[0] || null;
  return { rows, total, me };
}

async function getLevelLeaderboard({ course, userId, page = 1, limit = 20, UserModel = User }) {
  if (!COURSE_KEYS.includes(course)) throw new Error('Select a supported course.');
  const pagination = normalizePagination(page, limit);
  const totalLevels = getCourseLevelCount(course);
  const pipeline = [
    { $match: { isPublic: { $ne: false }, completedLevels: { $elemMatch: { course } } } },
    { $unwind: '$completedLevels' },
    { $match: { 'completedLevels.course': course } },
    { $group: {
      _id: '$_id',
      username: { $first: { $ifNull: ['$username', '$name'] } },
      profileImage: { $first: '$profileImage' },
      levels: { $addToSet: { phase: '$completedLevels.phase', level: '$completedLevels.level' } },
    } },
    { $addFields: { completedLevels: { $size: '$levels' } } },
    { $addFields: {
      score: '$completedLevels',
      totalLevels,
      completionPercent: { $round: [{ $multiply: [{ $divide: ['$completedLevels', totalLevels] }, 100] }, 1] },
    } },
    { $sort: { completedLevels: -1, _id: 1 } },
    { $setWindowFields: { sortBy: { completedLevels: -1, _id: 1 }, output: { rank: { $documentNumber: {} } } } },
    { $facet: {
      total: [{ $count: 'value' }],
      rows: [{ $skip: pagination.skip }, { $limit: pagination.limit }],
      me: [{ $match: { _id: mongoose.Types.ObjectId.isValid(userId) ? new mongoose.Types.ObjectId(userId) : userId } }],
    } },
  ];
  const result = await UserModel.aggregate(pipeline).allowDiskUse(true);
  return { ...toRows(result, userId), page: pagination.page, limit: pagination.limit, course, totalLevels };
}

async function getMatchLeaderboard({ category, userId, page = 1, limit = 20, period = 'all', language = null, difficulty = null, MatchModel = LeaderboardMatch }) {
  if (!['ai', 'multiplayer'].includes(category)) throw new Error('Select a supported leaderboard category.');
  const pagination = normalizePagination(page, limit);
  const match = { category };
  const periodStart = getPeriodStart(period);
  if (periodStart) match.finalizedAt = { $gte: periodStart };
  if (language && ['HTML', 'CSS', 'JavaScript', 'Python', 'Java'].includes(language)) match.language = language;
  if (difficulty && ['Easy', 'Medium', 'Hard'].includes(difficulty)) match.difficulty = difficulty;
  if (category === 'multiplayer') {
    // Custom Mode also supports groups; only exact two-player records belong on this board.
    match['participants.1'] = { $exists: true };
    match['participants.2'] = { $exists: false };
  }

  const pipeline = [
    { $match: match },
    { $unwind: '$participants' },
    { $group: {
      _id: '$participants.userId',
      wins: { $sum: { $cond: [{ $eq: ['$participants.outcome', 'win'] }, 1, 0] } },
      losses: { $sum: { $cond: [{ $eq: ['$participants.outcome', 'loss'] }, 1, 0] } },
      draws: { $sum: { $cond: [{ $eq: ['$participants.outcome', 'draw'] }, 1, 0] } },
      matchesPlayed: { $sum: 1 },
    } },
    { $addFields: {
      objectId: { $convert: { input: '$_id', to: 'objectId', onError: null, onNull: null } },
      score: { $multiply: ['$wins', LEADERBOARD_WIN_POINTS] },
    } },
    { $lookup: { from: 'users', localField: 'objectId', foreignField: '_id', as: 'user' } },
    { $unwind: '$user' },
    { $match: { 'user.isPublic': { $ne: false } } },
    { $addFields: {
      username: { $ifNull: ['$user.username', '$user.name'] },
      profileImage: '$user.profileImage',
    } },
    { $sort: { score: -1, wins: -1, _id: 1 } },
    { $setWindowFields: { sortBy: { score: -1, wins: -1, _id: 1 }, output: { rank: { $documentNumber: {} } } } },
    { $facet: {
      total: [{ $count: 'value' }],
      rows: [{ $skip: pagination.skip }, { $limit: pagination.limit }],
      me: [{ $match: { _id: String(userId) } }],
    } },
  ];

  const [result, aiSystem] = await Promise.all([
    MatchModel.aggregate(pipeline).allowDiskUse(true),
    category === 'ai' ? MatchModel.aggregate([
      { $match: match },
      { $unwind: '$participants' },
      { $group: {
        _id: { $ifNull: ['$opponentName', 'AI System'] },
        wins: { $sum: { $cond: [{ $eq: ['$participants.outcome', 'loss'] }, 1, 0] } },
        losses: { $sum: { $cond: [{ $eq: ['$participants.outcome', 'win'] }, 1, 0] } },
        draws: { $sum: { $cond: [{ $eq: ['$participants.outcome', 'draw'] }, 1, 0] } },
        matchesPlayed: { $sum: 1 },
      } },
      { $addFields: { score: { $multiply: ['$wins', LEADERBOARD_WIN_POINTS] }, entityType: 'ai' } },
      { $sort: { score: -1, wins: -1, _id: 1 } },
    ]) : null,
  ]);

  const data = toRows(result, userId);
  return {
    ...data,
    page: pagination.page,
    limit: pagination.limit,
    aiSystem: (aiSystem || []).map((entry) => ({
      entityType: 'ai',
      name: entry._id,
      score: entry.score,
      wins: entry.wins,
      losses: entry.losses,
      draws: entry.draws,
      matchesPlayed: entry.matchesPlayed,
      winRate: entry.matchesPlayed ? Math.round((entry.wins / entry.matchesPlayed) * 100) : 0,
    })),
  };
}

async function recordMatchResult(result, MatchModel = LeaderboardMatch, session = null) {
  if (!result?.matchId || !['ai', 'multiplayer'].includes(result.category)
      || !Array.isArray(result.participants) || !result.participants.length) {
    throw new Error('A stable match id, category, and participant results are required.');
  }
  const record = {
    matchId: String(result.matchId),
    category: result.category,
    participants: result.participants.map((participant) => ({
      userId: String(participant.userId),
      username: String(participant.username || 'Player').slice(0, 32),
      outcome: participant.outcome,
      score: Number.isSafeInteger(participant.score) ? participant.score : 0,
    })),
    winnerId: result.winnerId ? String(result.winnerId) : null,
    opponentType: result.category === 'ai' ? 'ai' : 'human',
    opponentName: result.category === 'ai' ? String(result.opponentName || 'AI System') : null,
    language: result.language || null,
    difficulty: result.difficulty || null,
    finalizedAt: result.finalizedAt || new Date(),
  };
  try {
    return await MatchModel.findOneAndUpdate(
      { matchId: record.matchId },
      { $setOnInsert: record },
      { upsert: true, new: true, setDefaultsOnInsert: true, ...(session ? { session } : {}) },
    );
  } catch (error) {
    if (error.code === 11000) return MatchModel.findOne({ matchId: record.matchId });
    throw error;
  }
}

module.exports = {
  COURSE_KEYS,
  LEADERBOARD_WIN_POINTS,
  normalizePagination,
  getPeriodStart,
  getLevelLeaderboard,
  getMatchLeaderboard,
  recordMatchResult,
};
