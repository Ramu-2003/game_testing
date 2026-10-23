const DAY_MS = 24 * 60 * 60 * 1000;
const SEASON_DAYS = Math.max(60, Math.min(120, Number(process.env.TOURNAMENT_SEASON_DAYS) || 90));
const carryoverSetting = Number(process.env.TOURNAMENT_RP_CARRYOVER);
const RP_CARRYOVER_FACTOR = Number.isFinite(carryoverSetting)
  ? Math.max(0, Math.min(1, carryoverSetting))
  : 0.5;
const MATCH_RP_WIN = Object.freeze({ Easy: 8, Medium: 15, Hard: 25 });
const QUEUE_TTL_MS = 90 * 1000;
const MATCH_DISCONNECT_GRACE_MS = 45 * 1000;
const MAX_MATCH_SUBMISSIONS = 25;
const LEADERBOARD_WIN_POINTS = 10;

module.exports = {
  DAY_MS,
  SEASON_DAYS,
  RP_CARRYOVER_FACTOR,
  MATCH_RP_WIN,
  QUEUE_TTL_MS,
  MATCH_DISCONNECT_GRACE_MS,
  MAX_MATCH_SUBMISSIONS,
  LEADERBOARD_WIN_POINTS,
};
