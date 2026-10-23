const assert = require('node:assert/strict');
const test = require('node:test');
const rankTiers = require('../../shared/rankTiers.json');
const {
  claimDailyXp,
  calculateDailyReward,
  utcDateDifference,
  awardXpOnce,
} = require('../services/rewards');
const { getRankForPoints } = require('../services/seasons');
const {
  LANGUAGES,
  DIFFICULTIES,
  CATALOG_VERSION,
  XP_REWARDS,
  listChallengeIds,
  getPublicChallenge,
  getChallenge,
  validateRepair,
  getHint,
} = require('../data/bugHunterChallenges');
const { normalizePagination, getPeriodStart, getMatchLeaderboard, recordMatchResult } = require('../services/leaderboards');
const { getCourseLevelCount } = require('../utils/curriculumStats');
const levelsRegistry = require('../data/levelsRegistry.json');

test('course leaderboard totals are derived from the current server curriculum', () => {
  for (const [course, phases] of Object.entries(levelsRegistry)) {
    const expected = Object.values(phases).reduce((total, levels) => total + Object.keys(levels).length, 0);
    assert.equal(getCourseLevelCount(course), expected);
  }
});

test('daily XP follows UTC streaks and never produces RP rewards', () => {
  const first = calculateDailyReward({ now: new Date('2026-10-20T23:59:00.000Z') });
  assert.equal(first.reward, 50);
  assert.equal(first.today, '2026-10-20');
  assert.equal(first.nextClaimAt.toISOString(), '2026-10-21T00:00:00.000Z');

  const seventh = calculateDailyReward({
    lastClaimDate: '2026-10-20', currentDay: 6, now: new Date('2026-10-21T00:01:00.000Z'),
  });
  assert.equal(seventh.reward, 100);
  assert.equal(seventh.nextDay, 0);
  assert.equal(calculateDailyReward({ lastClaimDate: '2026-10-21', now: new Date('2026-10-21T12:00:00.000Z') }).canClaim, false);
  assert.equal(calculateDailyReward({ lastClaimDate: '2026-10-19', currentDay: 5, now: new Date('2026-10-21T12:00:00.000Z') }).reward, 50);
  assert.equal(utcDateDifference('2026-10-22', '2026-10-20'), 2);
});

test('daily claim updates the XP balance and ledger without touching rank points', async () => {
  const user = { xpPoints: 40, rankPoints: 725, dailyRewards: { currentDay: 0, lastClaimDate: null } };
  const transactions = [];
  const session = { withTransaction: async (callback) => callback(), endSession: async () => {} };
  const UserModel = {
    db: { startSession: async () => session },
    findById: () => ({ session: async () => ({ ...user, dailyRewards: { ...user.dailyRewards } }) }),
    async findOneAndUpdate(_filter, update) {
      user.xpPoints += update.$inc.xpPoints;
      Object.entries(update.$set).forEach(([key, value]) => {
        const [, field] = key.split('.');
        user.dailyRewards[field] = value;
      });
      return { ...user, dailyRewards: { ...user.dailyRewards } };
    },
  };
  const TransactionModel = { create: async (items) => { transactions.push(...items); } };
  const now = new Date('2026-10-22T09:00:00.000Z');
  const first = await claimDailyXp('player-1', now, { UserModel, TransactionModel });
  const repeat = await claimDailyXp('player-1', now, { UserModel, TransactionModel });
  assert.equal(first.reward, 50);
  assert.equal(user.xpPoints, 90);
  assert.equal(user.rankPoints, 725);
  assert.equal(transactions.length, 1);
  assert.equal(transactions[0].currency, 'xp');
  assert.equal(transactions[0].amount, 50);
  assert.equal(repeat.reason, 'ALREADY_CLAIMED');
});

test('Bug Hunter XP idempotency changes XP only and cannot change RP on replay', async () => {
  const user = { xpPoints: 120, rankPoints: 775 };
  const transactions = new Map();
  const UserModel = {
    async findByIdAndUpdate(_userId, update) {
      user.xpPoints += update.$inc.xpPoints;
      return user;
    },
  };
  const TransactionModel = {
    findOne(filter) { return { session: async () => transactions.get(filter.idempotencyKey) || null }; },
    async create([transaction]) { transactions.set(transaction.idempotencyKey, transaction); },
  };
  const reward = {
    userId: 'player-1', amount: 25, source: 'bug-hunter',
    idempotencyKey: 'bug-hunter:player-1:html-easy-heading', relatedId: 'attempt-1',
    session: {}, UserModel, TransactionModel,
  };
  const first = await awardXpOnce(reward);
  const replay = await awardXpOnce(reward);
  assert.equal(first.awarded, true);
  assert.equal(first.balance, 145);
  assert.equal(replay.awarded, false);
  assert.equal(replay.balance, 145);
  assert.equal(user.xpPoints, 145);
  assert.equal(user.rankPoints, 775);
  assert.equal(transactions.size, 1);
});

test('rank tier names and boundaries remain shared with the profile tiers', () => {
  assert.equal(rankTiers[0].name, 'SYNTAX SPAMMER');
  assert.equal(getRankForPoints(0).name, 'SYNTAX SPAMMER');
  assert.equal(getRankForPoints(499).name, 'SYNTAX SPAMMER');
  assert.equal(getRankForPoints(500).name, 'LOGIC RUNNER');
  assert.equal(getRankForPoints(1000).name, 'CODE BREAKER');
  assert.equal(getRankForPoints(4000).name, 'SYSTEM OVERLORD');
  assert.equal(getRankForPoints(4000).progress, 100);
});

test('Bug Hunter catalog covers each language and difficulty and keeps solutions private', () => {
  assert.equal(LANGUAGES.length, 5);
  assert.equal(DIFFICULTIES.length, 3);
  assert.deepEqual(XP_REWARDS, { Easy: 25, Medium: 50, Hard: 100 });
  for (const language of LANGUAGES) {
    for (const difficulty of DIFFICULTIES) {
      const [challengeId] = listChallengeIds(language, difficulty);
      assert.ok(challengeId, `missing ${language} ${difficulty} challenge`);
      const challenge = getChallenge(challengeId);
      const publicChallenge = getPublicChallenge(challengeId);
      assert.equal(publicChallenge.catalogVersion, CATALOG_VERSION);
      assert.equal(typeof challenge.solutionCode, 'string');
      assert.equal(Object.hasOwn(publicChallenge, 'solutionCode'), false);
      assert.equal(Object.hasOwn(publicChallenge, 'hints'), false);
      assert.equal(publicChallenge.hintCount, challenge.hints.length);
      assert.equal(validateRepair(challengeId, challenge.solutionCode).valid, true);
      assert.equal(validateRepair(challengeId, challenge.starterCode).valid, challenge.starterCode === challenge.solutionCode);
      assert.equal(getHint(challengeId, 0), challenge.hints[0]);
    }
  }
});

test('repair comparison normalizes line endings but checks actual source text', () => {
  const [challengeId] = listChallengeIds('JavaScript', 'Easy');
  const solution = getChallenge(challengeId).solutionCode;
  assert.equal(validateRepair(challengeId, solution.replace(/\n/g, '\r\n') + '  \n').valid, true);
  assert.equal(validateRepair(challengeId, `${solution}\n// another edit`).valid, false);
});

test('leaderboard pagination is bounded and period filters have stable dates', () => {
  assert.deepEqual(normalizePagination(-1, 1000), { page: 1, limit: 50, skip: 0 });
  assert.deepEqual(normalizePagination(3, 20), { page: 3, limit: 20, skip: 40 });
  assert.equal(getPeriodStart('7d', new Date('2026-10-22T00:00:00.000Z')).toISOString(), '2026-10-15T00:00:00.000Z');
  assert.equal(getPeriodStart('all', new Date('2026-10-22T00:00:00.000Z')), null);
});

test('human leaderboard filters out group matches and supports difficulty filters', async () => {
  let pipeline;
  const MatchModel = { aggregate: (value) => ({ allowDiskUse: async () => { pipeline = value; return []; } }) };
  await getMatchLeaderboard({ category: 'multiplayer', userId: 'player-1', difficulty: 'Hard', MatchModel });
  const match = pipeline[0].$match;
  assert.equal(match.category, 'multiplayer');
  assert.equal(match.difficulty, 'Hard');
  assert.deepEqual(match['participants.1'], { $exists: true });
  assert.deepEqual(match['participants.2'], { $exists: false });
});

test('match result persistence is insert-only by stable match id', async () => {
  const records = new Map();
  const fakeModel = {
    async findOneAndUpdate(filter, update) {
      if (!records.has(filter.matchId)) records.set(filter.matchId, update.$setOnInsert);
      return records.get(filter.matchId);
    },
  };
  const base = {
    matchId: 'custom:room-1', category: 'multiplayer',
    participants: [
      { userId: 'user-1', username: 'Coder', outcome: 'win', score: 3 },
      { userId: 'user-2', username: 'Rival', outcome: 'loss', score: 2 },
    ],
  };
  await recordMatchResult(base, fakeModel);
  await recordMatchResult({ ...base, participants: [{ ...base.participants[0], outcome: 'loss' }, base.participants[1]] }, fakeModel);
  assert.equal(records.size, 1);
  assert.equal(records.get(base.matchId).participants[0].outcome, 'win');
});

test('group multiplayer results persist while the 1v1 board excludes them', async () => {
  let stored;
  let pipeline;
  const MatchModel = {
    async findOneAndUpdate(_filter, update) { stored ||= update.$setOnInsert; return stored; },
    aggregate: (value) => ({ allowDiskUse: async () => { pipeline = value; return []; } }),
  };
  await recordMatchResult({
    matchId: 'custom:group-room',
    category: 'multiplayer',
    participants: [
      { userId: 'user-1', outcome: 'win' },
      { userId: 'user-2', outcome: 'loss' },
      { userId: 'user-3', outcome: 'loss' },
    ],
  }, MatchModel);
  assert.equal(stored.participants.length, 3);
  await getMatchLeaderboard({ category: 'multiplayer', userId: 'user-1', MatchModel });
  assert.deepEqual(pipeline[0].$match['participants.2'], { $exists: false });
});
