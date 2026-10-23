const mongoose = require('mongoose');

const tournamentQueueEntrySchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  username: { type: String, required: true },
  language: { type: String, required: true },
  difficulty: { type: String, required: true },
  seasonId: { type: String, required: true },
  status: { type: String, enum: ['queued', 'matched'], required: true, default: 'queued' },
  matchId: { type: String, default: null },
  queuedAt: { type: Date, default: Date.now },
  lastSeenAt: { type: Date, default: Date.now },
  expiresAt: { type: Date, required: true },
}, { timestamps: true });

tournamentQueueEntrySchema.index({ status: 1, language: 1, difficulty: 1, queuedAt: 1 });
tournamentQueueEntrySchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model('TournamentQueueEntry', tournamentQueueEntrySchema);
