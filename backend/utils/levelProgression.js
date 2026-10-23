const VALID_COURSES = new Set(['html', 'css', 'javascript', 'python', 'java']);
const levelsRegistry = require('../data/levelsRegistry.json');
const curriculumLimits = require('../../shared/curriculumLimits.json');

function getLevelCompletionDecision({ course, phase, level, user }) {
  if (!VALID_COURSES.has(course)
      || !Number.isInteger(phase) || phase < 1 || phase > curriculumLimits.phaseCount
      || !Number.isInteger(level) || level < 1 || level > curriculumLimits.maxLevelsPerPhase
      || !levelsRegistry[course]?.[phase]?.[level]) {
    return { allowed: false, reason: 'invalid_level' };
  }

  const courseCompletions = Array.isArray(user?.completedLevels)
    ? user.completedLevels.filter((item) => item.course === course)
    : [];
  const alreadyCompleted = courseCompletions.some((item) => item.phase === phase && item.level === level);

  const phaseKey = `phase${phase}`;
  const currentPhaseWasStarted = Number(user?.levelProgress?.[course]?.[phaseKey]) > 0;
  for (let previousPhase = 1; !currentPhaseWasStarted && previousPhase < phase; previousPhase += 1) {
    const requiredCount = Object.keys(levelsRegistry[course]?.[previousPhase] || {}).length;
    const completedCount = new Set(courseCompletions
      .filter((item) => item.phase === previousPhase)
      .map((item) => item.level)).size;
    if (requiredCount === 0 || completedCount < requiredCount) {
      return { allowed: false, reason: 'phase_locked', previousPhase, requiredCount, completedCount };
    }
  }

  const storedUnlocked = Number(user?.levelProgress?.[course]?.[phaseKey]);
  const unlockedLevel = Number.isInteger(storedUnlocked) && storedUnlocked > 0
    ? Math.min(storedUnlocked, curriculumLimits.maxLevelsPerPhase + 1)
    : 1;
  const phaseLevelCount = Object.keys(levelsRegistry[course][phase]).length;

  if (level > unlockedLevel && !alreadyCompleted) {
    return { allowed: false, reason: 'level_locked', unlockedLevel };
  }

  return {
    allowed: true,
    alreadyCompleted,
    unlockedLevel,
    nextUnlocked: Math.max(unlockedLevel, Math.min(level + 1, curriculumLimits.maxLevelsPerPhase + 1)),
    phaseKey,
    ...(level === phaseLevelCount && phase < curriculumLimits.phaseCount
      ? { nextPhaseKey: `phase${phase + 1}` }
      : {}),
  };
}

module.exports = { getLevelCompletionDecision };
