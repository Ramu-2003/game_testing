const mongoose = require('mongoose');

const bugHunterAttemptSchema = new mongoose.Schema({
  attemptId: { type: String, required: true, unique: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  challengeId: { type: String, required: true },
  catalogVersion: { type: String, default: 'v1', required: true },
  language: { type: String, required: true },
  difficulty: { type: String, required: true },
  status: { type: String, enum: ['active', 'completed', 'abandoned'], default: 'active', index: true },
  startedAt: { type: Date, default: Date.now },
  completedAt: { type: Date, default: null },
  attemptCount: { type: Number, default: 0 },
  hintCount: { type: Number, default: 0 },
  rewardAvailable: { type: Boolean, default: true },
  xpAwarded: { type: Number, default: 0 },
  completionMs: { type: Number, default: null },
  lastSubmittedAt: { type: Date, default: null },
}, { timestamps: true });

bugHunterAttemptSchema.index({ userId: 1, challengeId: 1, completedAt: -1 });
bugHunterAttemptSchema.index({ userId: 1, status: 1 }, {
  unique: true,
  partialFilterExpression: { status: 'active' },
});

module.exports = mongoose.model('BugHunterAttempt', bugHunterAttemptSchema);
