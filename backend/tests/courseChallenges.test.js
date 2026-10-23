const assert = require('node:assert/strict');
const test = require('node:test');
const { getCanonicalLevel } = require('../utils/courseChallenges');
const levelsRegistry = require('../data/levelsRegistry.json');
const curriculumLimits = require('../../shared/curriculumLimits.json');

test('server-owned curriculum contains 795 complete, addressable challenges', () => {
  const courses = ['html', 'css', 'javascript', 'python', 'java'];
  let total = 0;

  for (const course of courses) {
    for (let phase = 1; phase <= curriculumLimits.phaseCount; phase += 1) {
      const phaseCount = Object.keys(levelsRegistry[course][phase]).length;
      assert.ok(phaseCount > 0 && phaseCount <= curriculumLimits.maxLevelsPerPhase);
      for (let level = 1; level <= phaseCount; level += 1) {
        const challenge = getCanonicalLevel(course, phase, level);
        assert.ok(challenge, `${course} phase ${phase} level ${level} should exist`);
        assert.ok(challenge.title && challenge.description && challenge.expectedOutput);
        assert.ok(Array.isArray(challenge.testCases) && challenge.testCases.length > 0);
        total += 1;
      }
    }
  }

  assert.equal(total, 795);
});

test('server-owned curriculum rejects unsupported courses and out-of-range levels', () => {
  assert.equal(getCanonicalLevel('ruby', 1, 1), null);
  assert.equal(getCanonicalLevel('javascript', 0, 1), null);
  assert.equal(getCanonicalLevel('javascript', 1, 11), null);
});
