const levelsRegistry = require('../data/levelsRegistry.json');
const curriculumLimits = require('../../shared/curriculumLimits.json');

function getCanonicalLevel(course, phase, level) {
  if (!Object.hasOwn(levelsRegistry, course)
      || !Number.isInteger(phase) || phase < 1 || phase > curriculumLimits.phaseCount
      || !Number.isInteger(level) || level < 1 || level > curriculumLimits.maxLevelsPerPhase) {
    return null;
  }

  return levelsRegistry[course]?.[phase]?.[level] || null;
}

module.exports = { getCanonicalLevel };
