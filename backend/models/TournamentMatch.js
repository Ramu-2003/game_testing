const mongoose = require('mongoose');

const submissionSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  attempts: { type: Number, default: 0 },
  solvedAt: { type: Date, default: null },
  lastSubmittedAt: { type: Date, default: null },
  solutionHash: { type: String, default: null },
}, { _id: false });

const rpDeltaSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  amount: { type: Number, required: true },
  balanceAfter: { type: Number, required: true },
}, { _id: false });

const tournamentMatchSchema = new mongoose.Schema({
  matchId: { type: String, required: true, unique: true },
  seasonId: { type: String, required: true, index: true },
  seasonNumber: { type: Number, required: true },
  players: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }],
  playerNames: [{ type: String, required: true }],
  language: { type: String, required: true },
  difficulty: { type: String, required: true },
  challengeId: { type: String, required: true },
  catalogVersion: { type: String, default: 'v1', required: true },
  status: { type: String, enum: ['active', 'completed', 'draw', 'cancelled', 'forfeit'], default: 'active', index: true },
  winnerId: { type: String, default: null },
  submissions: { type: [submissionSchema], default: [] },
  rpDeltas: { type: [rpDeltaSchema], default: [] },
  startedAt: { type: Date, required: true },
  endsAt: { type: Date, required: true },
  finalizedAt: { type: Date, default: null },
  cancelReason: { type: String, default: null },
}, { timestamps: true });

tournamentMatchSchema.index({ seasonId: 1, status: 1, createdAt: -1 });
tournamentMatchSchema.index({ players: 1, createdAt: -1 });

module.exports = mongoose.model('TournamentMatch', tournamentMatchSchema);
