const express = require('express');
const { protect } = require('../middleware/auth');
const leaderboardController = require('../controllers/leaderboardController');
const tournamentController = require('../controllers/tournamentController');
const bugHunterController = require('../controllers/bugHunterController');
const rewardHistoryController = require('../controllers/rewardHistoryController');

const router = express.Router();

router.get('/leaderboards', protect, leaderboardController.getLeaderboard);
router.get('/rewards/history', protect, rewardHistoryController.getRewardHistory);

router.get('/tournament/state', protect, tournamentController.getState);
router.get('/tournament/profile', protect, tournamentController.getProfileSummary);
router.post('/tournament/queue', protect, tournamentController.enqueue);
router.delete('/tournament/queue', protect, tournamentController.cancelQueue);
router.get('/tournament/matches/:matchId', protect, tournamentController.getMatch);
router.post('/tournament/matches/:matchId/submit', protect, tournamentController.submitMatch);

router.get('/bug-hunter/catalog', protect, bugHunterController.getCatalog);
router.get('/bug-hunter/attempts/active', protect, bugHunterController.getActiveAttempt);
router.post('/bug-hunter/attempts', protect, bugHunterController.startAttempt);
router.post('/bug-hunter/attempts/:attemptId/hint', protect, bugHunterController.requestHint);
router.post('/bug-hunter/attempts/:attemptId/submit', protect, bugHunterController.submitRepair);
router.get('/bug-hunter/stats', protect, bugHunterController.getStats);

module.exports = router;
