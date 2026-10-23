const mongoose = require('mongoose');

const rewardTransactionSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  currency: { type: String, enum: ['xp', 'rp'], required: true },
  amount: { type: Number, required: true, validate: Number.isSafeInteger },
  source: { type: String, enum: ['daily', 'level', 'bug-hunter', 'tournament', 'conversion'], required: true },
  idempotencyKey: { type: String, required: true },
  relatedId: { type: String, default: null },
  seasonId: { type: String, default: null },
  balanceAfter: { type: Number, required: true },
}, { timestamps: true });

rewardTransactionSchema.index({ userId: 1, idempotencyKey: 1 }, { unique: true });
rewardTransactionSchema.index({ userId: 1, currency: 1, createdAt: -1 });

module.exports = mongoose.model('RewardTransaction', rewardTransactionSchema);
