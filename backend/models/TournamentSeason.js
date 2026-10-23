const mongoose = require('mongoose');

const tournamentSeasonSchema = new mongoose.Schema({
  seasonNumber: { type: Number, required: true, unique: true },
  seasonId: { type: String, required: true, unique: true },
  status: { type: String, enum: ['active', 'completed'], required: true, default: 'active' },
  startsAt: { type: Date, required: true },
  endsAt: { type: Date, required: true },
  completedAt: { type: Date, default: null },
  carryoverFactor: { type: Number, default: 0.5 },
}, { timestamps: true });

tournamentSeasonSchema.index({ status: 1, startsAt: 1 });
tournamentSeasonSchema.index({ status: 1 }, { unique: true, partialFilterExpression: { status: 'active' } });

module.exports = mongoose.model('TournamentSeason', tournamentSeasonSchema);
