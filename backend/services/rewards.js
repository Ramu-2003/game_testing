const User = require('../models/User');
const RewardTransaction = require('../models/RewardTransaction');
const { DAY_MS } = require('../config/competitivePolicy');

const DAILY_XP_REWARDS = Object.freeze([50, 50, 50, 50, 50, 50, 100]);

function utcDateKey(date) {
  return date.toISOString().slice(0, 10);
}

function utcDateDifference(laterKey, earlierKey) {
  const later = Date.parse(`${laterKey}T00:00:00.000Z`);
  const earlier = Date.parse(`${earlierKey}T00:00:00.000Z`);
  if (!Number.isFinite(later) || !Number.isFinite(earlier)) return Infinity;
  return Math.round((later - earlier) / DAY_MS);
}

function calculateDailyReward({ lastClaimDate, currentDay = 0, now = new Date() }) {
  const today = utcDateKey(now);
  if (lastClaimDate === today) return { canClaim: false, today };
  const consecutive = lastClaimDate && utcDateDifference(today, lastClaimDate) === 1;
  const rewardIndex = consecutive ? Math.max(0, Math.min(6, currentDay)) : 0;
  const nextDay = (rewardIndex + 1) % DAILY_XP_REWARDS.length;
  return {
    canClaim: true,
    today,
    reward: DAILY_XP_REWARDS[rewardIndex],
    nextDay,
    nextClaimAt: new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1)),
  };
}

async function claimDailyXp(userId, now = new Date(), deps = {}) {
  const UserModel = deps.UserModel || User;
  const TransactionModel = deps.TransactionModel || RewardTransaction;
  const session = await UserModel.db.startSession();
  let result;
  try {
    await session.withTransaction(async () => {
      const user = await UserModel.findById(userId).session(session);
      if (!user) {
        result = { success: false, reason: 'USER_NOT_FOUND' };
        return;
      }

      const daily = user.dailyRewards || {};
      const calculated = calculateDailyReward({
        lastClaimDate: daily.lastClaimDate,
        currentDay: daily.currentDay,
        now,
      });
      if (!calculated.canClaim) {
        result = { success: false, reason: 'ALREADY_CLAIMED', today: calculated.today };
        return;
      }

      const nextClaimAt = calculated.nextClaimAt;
      const updatedUser = await UserModel.findOneAndUpdate(
        { _id: userId, 'dailyRewards.lastClaimDate': { $ne: calculated.today } },
        {
          $inc: { xpPoints: calculated.reward },
          $set: {
            'dailyRewards.currentDay': calculated.nextDay,
            'dailyRewards.lastClaimTime': now,
            'dailyRewards.lastClaimDate': calculated.today,
            'dailyRewards.canClaimAt': nextClaimAt,
          },
        },
        { new: true, session }
      );

      if (!updatedUser) {
        result = { success: false, reason: 'ALREADY_CLAIMED', today: calculated.today };
        return;
      }

      await TransactionModel.create([{
        userId,
        currency: 'xp',
        amount: calculated.reward,
        source: 'daily',
        idempotencyKey: `daily:${calculated.today}`,
        relatedId: calculated.today,
        balanceAfter: updatedUser.xpPoints,
      }], { session });

      result = {
        success: true,
        reward: calculated.reward,
        nextDay: calculated.nextDay + 1,
        newXpBalance: updatedUser.xpPoints,
        canClaimAt: nextClaimAt,
      };
    });
    return result;
  } finally {
    await session.endSession();
  }
}

async function awardXpOnce({ userId, amount, source, idempotencyKey, relatedId = null, session, UserModel = User, TransactionModel = RewardTransaction }) {
  if (!session || !userId || !Number.isSafeInteger(amount) || amount <= 0 || !idempotencyKey) {
    throw new Error('A transaction session, user, positive XP amount, and idempotency key are required.');
  }
  const existing = await TransactionModel.findOne({ userId, currency: 'xp', idempotencyKey }).session(session);
  if (existing) return { awarded: false, balance: existing.balanceAfter };

  const updatedUser = await UserModel.findByIdAndUpdate(
    userId,
    { $inc: { xpPoints: amount } },
    { new: true, session }
  );
  if (!updatedUser) throw new Error('User not found while awarding XP.');

  await TransactionModel.create([{
    userId,
    currency: 'xp',
    amount,
    source,
    idempotencyKey,
    relatedId,
    balanceAfter: updatedUser.xpPoints,
  }], { session });
  return { awarded: true, balance: updatedUser.xpPoints };
}

module.exports = {
  DAILY_XP_REWARDS,
  utcDateKey,
  utcDateDifference,
  calculateDailyReward,
  claimDailyXp,
  awardXpOnce,
};
