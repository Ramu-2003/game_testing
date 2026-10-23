const levelsRegistry = require('../data/levelsRegistry.json');

function getCourseLevelCount(course, registry = levelsRegistry) {
  return Object.values(registry[course] || {})
    .reduce((total, phase) => total + Object.keys(phase).length, 0);
}

function getPhaseLevelCounts(registry = levelsRegistry) {
  return Object.fromEntries(Object.entries(registry).map(([course, phases]) => [
    course,
    Object.fromEntries(Object.entries(phases).map(([phase, levels]) => [
      `phase${phase}`,
      Object.keys(levels).length,
    ])),
  ]));
}

module.exports = { getCourseLevelCount, getPhaseLevelCounts };
