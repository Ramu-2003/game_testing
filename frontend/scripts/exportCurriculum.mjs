import { mkdir, writeFile } from 'node:fs/promises';
import { Buffer } from 'node:buffer';
import { build } from 'esbuild';
import { fileURLToPath, URL } from 'node:url';

const registryBuild = await build({
  entryPoints: [fileURLToPath(new URL('../src/config/levelsRegistry.js', import.meta.url))],
  bundle: true,
  format: 'esm',
  platform: 'node',
  write: false,
});
const registryUrl = `data:text/javascript;base64,${Buffer.from(registryBuild.outputFiles[0].text).toString('base64')}`;
const { levelsRegistry } = await import(registryUrl);
const outputPath = new URL('../../backend/data/levelsRegistry.json', import.meta.url);

await writeFile(outputPath, `${JSON.stringify(levelsRegistry, null, 2)}\n`, 'utf8');

const publicCurriculumPath = new URL('../public/curriculum/', import.meta.url);
await mkdir(publicCurriculumPath, { recursive: true });
let exportedPhaseCount = 0;
for (const [course, phases] of Object.entries(levelsRegistry)) {
  for (const [phase, levels] of Object.entries(phases)) {
    const phasePath = new URL(`${course}-phase-${phase}.json`, publicCurriculumPath);
    await writeFile(phasePath, `${JSON.stringify(levels)}\n`, 'utf8');
    exportedPhaseCount += 1;
  }
}

const totalLessons = Object.values(levelsRegistry).reduce(
  (total, phases) => total + Object.values(phases).reduce((sum, levels) => sum + Object.keys(levels).length, 0),
  0,
);
console.log(`Exported ${totalLessons} lessons to backend/data/levelsRegistry.json and ${exportedPhaseCount} lazy public phase assets.`);
