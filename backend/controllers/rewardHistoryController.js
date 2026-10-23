const RewardTransaction = require('../models/RewardTransaction');

exports.getRewardHistory = async (req, res) => {
  try {
    const currency = req.query.currency ? String(req.query.currency) : null;
    if (currency && !['xp', 'rp'].includes(currency)) {
      return res.status(400).json({ message: 'Choose xp or rp for reward history.' });
    }
    const pageValue = Number.parseInt(req.query.page, 10);
    const limitValue = Number.parseInt(req.query.limit, 10);
    const page = Number.isFinite(pageValue) ? Math.max(1, pageValue) : 1;
    const limit = Number.isFinite(limitValue) ? Math.max(1, Math.min(50, limitValue)) : 20;
    const filter = { userId: req.user.id, ...(currency ? { currency } : {}) };
    const [transactions, total] = await Promise.all([
      RewardTransaction.find(filter)
        .select('currency amount source relatedId seasonId balanceAfter createdAt')
        .sort({ createdAt: -1, _id: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      RewardTransaction.countDocuments(filter),
    ]);
    return res.json({ transactions, total, page, limit });
  } catch (error) {
    console.error('[Rewards] History lookup failed:', error);
    return res.status(500).json({ message: 'Could not load reward history.' });
  }
};
