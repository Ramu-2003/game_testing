const mongoose = require('mongoose');

const participantSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  username: { type: String, default: 'Player' },
  outcome: { type: String, enum: ['win', 'loss', 'draw'], required: true },
  score: { type: Number, default: 0 },
}, { _id: false });

const leaderboardMatchSchema = new mongoose.Schema({
  matchId: { type: String, required: true, unique: true },
  category: { type: String, enum: ['ai', 'multiplayer'], required: true },
  participants: { type: [participantSchema], required: true },
  winnerId: { type: String, default: null },
  opponentType: { type: String, enum: ['ai', 'human'], required: true },
  opponentName: { type: String, default: null },
  language: { type: String, default: null },
  difficulty: { type: String, default: null },
  finalizedAt: { type: Date, required: true },
}, { timestamps: true });

leaderboardMatchSchema.index({ category: 1, finalizedAt: -1 });
leaderboardMatchSchema.index({ category: 1, 'participants.userId': 1, finalizedAt: -1 });

module.exports = mongoose.model('LeaderboardMatch', leaderboardMatchSchema);
