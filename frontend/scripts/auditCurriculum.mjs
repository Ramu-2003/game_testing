import { Buffer } from 'node:buffer';
import { build } from 'esbuild';
import { fileURLToPath, URL } from 'node:url';

const entry = fileURLToPath(new URL('../src/config/levelsRegistry.js', import.meta.url));
const bundle = await build({ entryPoints: [entry], bundle: true, format: 'esm', platform: 'node', write: false });
const moduleUrl = `data:text/javascript;base64,${Buffer.from(bundle.outputFiles[0].text).toString('base64')}`;
const { levelsRegistry } = await import(moduleUrl);
const targetLevelsPerCourse = 1000;
const expectedPhases = 10;
const maximumLevelsPerPhase = 100;
let total = 0;
let structureIssues = 0;
const authoredMetadataGaps = [];

console.log('Course       Levels  To target  Authored  Needs review  No metadata  Generic  Duplicate titles');
console.log('-----------------------------------------------------------------------------------------------');

for (const [course, phases] of Object.entries(levelsRegistry)) {
  if (Object.keys(phases).length !== expectedPhases) {
    structureIssues += 1;
    console.error(`${course}: expected ${expectedPhases} phases, found ${Object.keys(phases).length}.`);
  }

  const lessons = Object.values(phases).flatMap((levels) => Object.values(levels));
  const authored = lessons.filter((lesson) => lesson.contentStatus === 'authored').length;
  const expanded = lessons.filter((lesson) => lesson.contentStatus === 'template-generated-needs-review').length;
  const noMetadata = lessons.filter((lesson) => !lesson.contentStatus).length;
  const generic = lessons.filter((lesson) => /Solve the programming puzzle for .* Instruction:/i.test(lesson.description || '')).length;
  const titleCounts = new Map();
  for (const [phase, levels] of Object.entries(phases)) {
    const levelNumbers = Object.keys(levels).map(Number).sort((a, b) => a - b);
    if (!levelNumbers.length || levelNumbers.length > maximumLevelsPerPhase
      || levelNumbers.some((level, index) => level !== index + 1)) {
      structureIssues += 1;
      console.error(`${course} phase ${phase}: levels must be contiguous from 1 and stay within ${maximumLevelsPerPhase}.`);
    }

    for (const [level, challenge] of Object.entries(levels)) {
      if (!challenge.title?.trim()
        || !challenge.description?.trim()
        || !Number.isFinite(challenge.timeLimit)
        || challenge.timeLimit <= 0
        || typeof challenge.starterCode !== 'string'
        || !challenge.expectedOutput
        || !Array.isArray(challenge.testCases)
        || challenge.testCases.length === 0) {
        structureIssues += 1;
        console.error(`${course} phase ${phase} level ${level}: missing core lesson content.`);
      }

      const normalizedTitle = String(challenge.title || '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
      if (normalizedTitle) titleCounts.set(normalizedTitle, (titleCounts.get(normalizedTitle) || 0) + 1);

      if (challenge.contentStatus === 'authored') {
        const hasExample = challenge.workedExample
          && challenge.workedExample.input !== undefined
          && challenge.workedExample.output !== undefined;
        const hasTeachingNotes = challenge.learningObjective?.trim().length > 20
          && Array.isArray(challenge.instructions)
          && challenge.instructions.length >= 3
          && hasExample
          && challenge.hint?.trim().length > 15
          && challenge.explanation?.trim().length > 20
          && Array.isArray(challenge.testCases)
          && challenge.testCases.length >= 3
          && challenge.assessmentMode === 'source-rubric'
          && /reference|not executed|not compiled|visual/i.test(challenge.expectedOutputHint || '');
        if (!hasTeachingNotes) authoredMetadataGaps.push(`${course} phase ${phase} level ${level}`);
      }
    }
  }

  const duplicateTitles = [...titleCounts.values()].filter((count) => count > 1).length;
  total += lessons.length;
  console.log(`${course.padEnd(12)} ${String(lessons.length).padStart(6)}  ${String(Math.max(0, targetLevelsPerCourse - lessons.length)).padStart(9)}  ${String(authored).padStart(8)}  ${String(expanded).padStart(12)}  ${String(noMetadata).padStart(11)}  ${String(generic).padStart(7)}  ${String(duplicateTitles).padStart(16)}`);
}

console.log('-------------------------------------------------------------------------------');
console.log(`Total addressable lessons: ${total}`);
console.log(`Target lesson count: ${targetLevelsPerCourse} per course (${targetLevelsPerCourse * Object.keys(levelsRegistry).length} total)`);
console.log(`Catalog structure issues: ${structureIssues}`);
console.log(`Authored lessons missing review metadata: ${authoredMetadataGaps.length}`);
if (authoredMetadataGaps.length) console.error(authoredMetadataGaps.slice(0, 20).join('\n'));
console.log('Generic prompts are included in the no-metadata count. Duplicate titles are reported per course for manual review; uniqueness alone cannot prove lesson quality. Template-generated lessons still need review. Source-rubric lessons do not execute submitted code.');
if (structureIssues || authoredMetadataGaps.length) process.exitCode = 1;
