import assert from 'node:assert/strict';
import test from 'node:test';
import { Buffer } from 'node:buffer';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { build } from 'esbuild';
import {
  readChallengeTimer,
  saveChallengeTimer,
  clearPhaseChallengeTimers,
} from '../src/utils/challengeTimer.js';

const registryBuild = await build({
  entryPoints: [fileURLToPath(new URL('../src/config/levelsRegistry.js', import.meta.url))],
  bundle: true,
  format: 'esm',
  platform: 'node',
  write: false,
});
const registryUrl = `data:text/javascript;base64,${Buffer.from(registryBuild.outputFiles[0].text).toString('base64')}`;
const { levelsRegistry } = await import(registryUrl);
const serverRegistry = JSON.parse(await readFile(
  fileURLToPath(new URL('../../backend/data/levelsRegistry.json', import.meta.url)),
  'utf8',
));
const curriculumLimits = JSON.parse(await readFile(
  fileURLToPath(new URL('../../shared/curriculumLimits.json', import.meta.url)),
  'utf8',
));

test('server validation catalog stays in sync with the playable frontend lessons', () => {
  assert.deepEqual(serverRegistry, levelsRegistry);
});

test('all five courses expose ten phases with contiguous lessons within the shared phase limit', () => {
  assert.deepEqual(Object.keys(levelsRegistry).sort(), ['css', 'html', 'java', 'javascript', 'python']);
  let totalLevels = 0;

  for (const [course, phases] of Object.entries(levelsRegistry)) {
    assert.equal(Object.keys(phases).length, curriculumLimits.phaseCount, `${course} should have ten phases`);
    for (const [phase, levels] of Object.entries(phases)) {
      const phaseLevelCount = Object.keys(levels).length;
      assert.ok(phaseLevelCount > 0 && phaseLevelCount <= curriculumLimits.maxLevelsPerPhase,
        `${course} phase ${phase} should fit the shared phase level limit`);
      for (const [level, challenge] of Object.entries(levels)) {
        assert.ok(Number(level) >= 1 && Number(level) <= phaseLevelCount,
          `${course} phase ${phase} should use contiguous level numbers`);
        totalLevels += 1;
        assert.ok(challenge.title, `${course} phase ${phase} level ${level} needs a title`);
        assert.ok(challenge.description, `${course} phase ${phase} level ${level} needs instructions`);
        assert.ok(challenge.timeLimit > 0, `${course} phase ${phase} level ${level} needs a timer`);
        assert.ok(challenge.starterCode !== undefined, `${course} phase ${phase} level ${level} needs starter code`);
        assert.ok(challenge.expectedOutput, `${course} phase ${phase} level ${level} needs an expected output`);
        assert.ok(Array.isArray(challenge.testCases) && challenge.testCases.length > 0,
          `${course} phase ${phase} level ${level} needs test cases`);
        assert.doesNotMatch(challenge.description, /Practice .* in this .* level challenge|Verify step \d+:/i,
          `${course} phase ${phase} level ${level} still has a placeholder description`);
      }
    }
  }

  assert.equal(totalLevels, 795);
});

test('placeholder lessons are replaced with tasks that match their course and phase', () => {
  assert.match(levelsRegistry.css[10][6].title, /Prevent Grid Blowout/);
  assert.match(levelsRegistry.javascript[3][1].title, /Score Gate/);
  assert.match(levelsRegistry.python[8][8].title, /Constructors/);
  assert.match(levelsRegistry.java[9][9].title, /Try and Catch/);
  assert.match(levelsRegistry.css[9][9].description, /Responsive media rules/);
});

test('advanced phase additions are authored in their intended course topics', () => {
  const additions = [
    { lessons: levelsRegistry.html[8], titles: [/Import Progress/, /Mastery Reading/, /Upload Notes/, /Hidden Course ID/, /Publish or Save Draft/] },
    { lessons: levelsRegistry.css[10], titles: [/Right-to-Left Note/, /Card Width by Container/, /Frosted Surface/, /High Contrast State/, /Aligned Course Cards/] },
    { lessons: levelsRegistry.javascript[9], titles: [/Invalid Preferences/, /Safe Record ID/, /Blocked Storage/, /Validate a Lesson List/, /Safe Error Message/] },
    { lessons: levelsRegistry.python[10], titles: [/Sum Scores Lazily/, /Validate Every Score/, /Keep Passing Scores/, /Insert Before a Duplicate/, /Select the Fastest Three/] },
    { lessons: levelsRegistry.java[10], titles: [/Freeze a Course Snapshot/, /Filter Completed Lessons/, /Optional Title/, /Total Study Minutes/, /Group Lessons by Course/] },
  ];
  for (const { lessons, titles } of additions) {
    for (let index = 0; index < titles.length; index += 1) {
      const lesson = lessons[index + 11];
      assert.match(lesson.title, titles[index]);
      assert.equal(lesson.contentStatus, 'authored');
    }
  }
});

test('authored JavaScript conditional lessons include teachable steps and examples', () => {
  for (const [level, challenge] of Object.entries(levelsRegistry.javascript[3])) {
    assert.equal(challenge.contentStatus, 'authored', `conditional level ${level} should be explicitly authored`);
    assert.equal(challenge.assessmentMode, 'source-rubric');
    assert.ok(challenge.learningObjective.length > 20, `level ${level} needs a specific objective`);
    assert.ok(challenge.instructions.length >= 3, `level ${level} needs actionable steps`);
    assert.ok(challenge.workedExample.input, `level ${level} needs a sample input`);
    assert.ok(challenge.workedExample.output, `level ${level} needs an expected sample result`);
    assert.ok(challenge.hint.length > 15, `level ${level} needs a progressive hint`);
    assert.ok(challenge.explanation.length > 20, `level ${level} needs a concept explanation`);
    assert.doesNotMatch(challenge.description, /demonstrate .* in your code|Keep the solution focused/i);
    assert.ok(challenge.testCases.some((testCase) => /returns?|return/i.test(testCase.description)));
  }
});

test('curated lesson batches include explicit teaching metadata and honest assessment labels', () => {
  const authoredLessons = Object.entries(levelsRegistry).flatMap(([course, phases]) =>
    Object.entries(phases).flatMap(([phase, levels]) =>
      Object.entries(levels)
        .filter(([, challenge]) => challenge.contentStatus === 'authored')
        .map(([level, challenge]) => ({ course, phase, level, challenge }))
    )
  );

  assert.equal(authoredLessons.length, 465);
  for (const { course, phase, level, challenge } of authoredLessons) {
    assert.equal(challenge.assessmentMode, 'source-rubric', `${course} phase ${phase} level ${level} must describe its assessment honestly`);
    assert.ok(challenge.learningObjective?.length > 20, `${course} phase ${phase} level ${level} needs an objective`);
    assert.ok(challenge.instructions?.length >= 3, `${course} phase ${phase} level ${level} needs actionable steps`);
    assert.ok(challenge.workedExample?.input, `${course} phase ${phase} level ${level} needs a worked input`);
    assert.ok(challenge.workedExample?.output, `${course} phase ${phase} level ${level} needs a worked expected value`);
    assert.ok(challenge.hint?.length > 15, `${course} phase ${phase} level ${level} needs a hint`);
    assert.ok(challenge.explanation?.length > 20, `${course} phase ${phase} level ${level} needs a concept explanation`);
    assert.ok(challenge.testCases?.length >= 3, `${course} phase ${phase} level ${level} needs multiple review criteria`);
    assert.match(challenge.expectedOutputHint || '', /reference|not executed|not compiled|visual/i,
      `${course} phase ${phase} level ${level} must not imply the learner's code was run`);
  }
});

test('remaining generated lessons stay explicitly flagged for author review', () => {
  for (const course of ['css', 'python', 'java']) {
    const lesson = Object.values(levelsRegistry[course])
      .flatMap((phase) => Object.values(phase))
      .find((challenge) => challenge.contentStatus === 'template-generated-needs-review');
    assert.ok(lesson, `${course} should identify remaining generated content for review`);
  }
});

test('expired challenge timers remain expired after a reload and malformed storage is recovered', () => {
  const data = new Map();
  const storage = {
    getItem: (key) => data.get(key) ?? null,
    setItem: (key, value) => data.set(key, value),
    removeItem: (key) => data.delete(key),
  };
  const key = 'python_phase2_level3_timer';

  saveChallengeTimer(key, 2, storage, 10000);
  assert.deepEqual(readChallengeTimer(key, 180, storage, 13000), { timeLeft: 0, isRunning: false });

  data.set(key, '{bad json');
  assert.deepEqual(readChallengeTimer(key, 180, storage, 13000), { timeLeft: 180, isRunning: true });
  assert.equal(data.has(key), false);
});

test('phase entry clears only that phase timer state', () => {
  const data = new Map([
    ['python_phase2_level1_timer', 'saved'],
    ['python_phase2_level100_timer', 'saved'],
    ['python_phase3_level1_timer', 'keep'],
  ]);
  const storage = { removeItem: (key) => data.delete(key) };

  clearPhaseChallengeTimers('python', 2, storage);
  assert.equal(data.has('python_phase2_level1_timer'), false);
  assert.equal(data.has('python_phase2_level100_timer'), false);
  assert.equal(data.has('python_phase3_level1_timer'), true);
});
