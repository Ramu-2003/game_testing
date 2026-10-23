import { mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL, fileURLToPath } from 'node:url';
import { build } from 'esbuild';
import React from 'react';
import { renderToString } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';

const frontendRoot = fileURLToPath(new URL('..', import.meta.url));
const distRoot = path.join(frontendRoot, 'dist');
const assetsRoot = path.join(distRoot, 'assets');
const bundlePath = path.join(frontendRoot, 'node_modules', '.cache', 'learn-prerender.mjs');

await mkdir(path.dirname(bundlePath), { recursive: true });
await build({
  entryPoints: [path.join(frontendRoot, 'src', 'pages', 'LearnPage.jsx')],
  outfile: bundlePath,
  bundle: true,
  format: 'esm',
  platform: 'node',
  target: 'node18',
  jsx: 'automatic',
  external: ['react', 'react-dom', 'react-router-dom', 'lucide-react'],
  loader: { '.css': 'empty' },
});

const { default: LearnPage } = await import(`${pathToFileURL(bundlePath).href}?build=${Date.now()}`);
const renderedContent = renderToString(
  React.createElement(MemoryRouter, { initialEntries: ['/learn'] }, React.createElement(LearnPage)),
);

const assets = await readdir(assetsRoot);
const learnCss = assets.find((asset) => /^LearnPage-.*\.css$/.test(asset));
const learnScript = assets.find((asset) => /^LearnPage-.*\.js$/.test(asset));
if (!learnCss || !learnScript) throw new Error('Vite did not emit the public learning page assets.');

let html = await readFile(path.join(distRoot, 'index.html'), 'utf8');
if (!html.includes('<div id="root"></div>') || !html.includes('<title>GAME IN MY STYLE</title>')) {
  throw new Error('The Vite HTML shell did not match the expected prerender template.');
}
html = html.replace('<div id="root"></div>', `<div id="root" data-prerendered="learn">${renderedContent}</div>`);
html = html.replace('<title>GAME IN MY STYLE</title>', '<title>Learn HTML, CSS, JavaScript, Python &amp; Java | GAME IN MY STYLE</title>');
html = html.replace(
  /<meta name="description" content="[^"]*"\s*\/>/,
  '<meta name="description" content="Learn five programming tracks through guided coding levels, browser previews, multiplayer rooms, debugging cases, and ranked practice in GAME IN MY STYLE." />',
);
html = html.replace(
  /<meta property="og:title" content="[^"]*"\s*\/>/,
  '<meta property="og:title" content="Learn HTML, CSS, JavaScript, Python &amp; Java | GAME IN MY STYLE" />',
);
html = html.replace(
  /<meta property="og:description" content="[^"]*"\s*\/>/,
  '<meta property="og:description" content="Choose a coding track, build small projects, debug realistic mistakes, and practice with other players." />',
);
html = html.replace('</head>', '<meta name="robots" content="index, follow" /></head>');
html = html.replace('</head>', `<link rel="stylesheet" href="/assets/${learnCss}" /><link rel="modulepreload" href="/assets/${learnScript}" /></head>`);
if (!html.includes('data-prerendered="learn"') || !html.includes('name="description" content="Learn five programming tracks')) {
  throw new Error('The prerendered learning page is missing its content or metadata.');
}

const learnRoot = path.join(distRoot, 'learn');
await mkdir(learnRoot, { recursive: true });
await writeFile(path.join(learnRoot, 'index.html'), html);
console.log(`Prerendered /learn with ${learnCss} and ${learnScript}.`);
