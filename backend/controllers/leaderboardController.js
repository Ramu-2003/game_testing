const { COURSE_KEYS, getLevelLeaderboard, getMatchLeaderboard } = require('../services/leaderboards');

exports.getLeaderboard = async (req, res) => {
  try {
    const category = String(req.query.category || 'ai');
    const page = req.query.page || 1;
    const limit = req.query.limit || 20;
    if (category === 'levels') {
      const course = String(req.query.course || 'html').toLowerCase();
      if (!COURSE_KEYS.includes(course)) return res.status(400).json({ message: 'Choose a supported course.' });
      const result = await getLevelLeaderboard({ course, userId: req.user.id, page, limit });
      return res.json({ category, ...result });
    }
    if (!['ai', 'multiplayer'].includes(category)) {
      return res.status(400).json({ message: 'Choose ai, levels, or multiplayer.' });
    }
    const period = String(req.query.period || 'all');
    if (!['all', '7d', '30d'].includes(period)) return res.status(400).json({ message: 'Choose all, 7d, or 30d.' });
    const language = req.query.language ? String(req.query.language) : null;
    const difficulty = req.query.difficulty ? String(req.query.difficulty) : null;
    if (language && !['HTML', 'CSS', 'JavaScript', 'Python', 'Java'].includes(language)) {
      return res.status(400).json({ message: 'Choose a supported language.' });
    }
    if (difficulty && !['Easy', 'Medium', 'Hard'].includes(difficulty)) {
      return res.status(400).json({ message: 'Choose a supported difficulty.' });
    }
    const result = await getMatchLeaderboard({
      category, userId: req.user.id, page, limit, period, language, difficulty,
    });
    return res.json({ category, period, language, difficulty, ...result });
  } catch (error) {
    console.error('[Leaderboard] Query failed:', error);
    return res.status(500).json({ message: 'Could not load this leaderboard.' });
  }
};
