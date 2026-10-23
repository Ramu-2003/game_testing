const mongoose = require('mongoose');

const seasonStandingSchema = new mongoose.Schema({
  seasonId: { type: String, required: true },
  seasonNumber: { type: Number, required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  username: { type: String, default: 'Player' },
  profileImage: { type: String, default: null },
  rankPoints: { type: Number, required: true },
  wins: { type: Number, default: 0 },
  losses: { type: Number, default: 0 },
  draws: { type: Number, default: 0 },
  finalRank: { type: Number, required: true },
  finalizedAt: { type: Date, required: true },
}, { timestamps: true });

seasonStandingSchema.index({ seasonId: 1, userId: 1 }, { unique: true });
seasonStandingSchema.index({ seasonId: 1, rankPoints: -1, wins: -1, userId: 1 });

module.exports = mongoose.model('SeasonStanding', seasonStandingSchema);
