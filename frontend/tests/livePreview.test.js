import assert from 'node:assert/strict';
import test from 'node:test';
import { buildCssPreview, buildHtmlPreview, buildSubmissionPreview } from '../src/utils/livePreview.js';

test('HTML preview inserts a restrictive policy before learner markup', () => {
  const preview = buildHtmlPreview('<!doctype html><html><head><title>Demo</title></head><body><h1>Hi</h1></body></html>');

  assert.ok(preview.indexOf('Content-Security-Policy') < preview.indexOf('<title>Demo</title>'));
  assert.match(preview, /script-src &#39;none&#39;|script-src 'none'/);
  assert.match(preview, /connect-src &#39;none&#39;|connect-src 'none'/);
});

test('HTML fragments receive a complete document wrapper', () => {
  const preview = buildHtmlPreview('<h1>Fragment</h1>');

  assert.match(preview, /<html lang="en">/);
  assert.match(preview, /<body><h1>Fragment<\/h1><\/body>/);
});

test('CSS preview encodes the stylesheet separately and blocks script execution', () => {
  const preview = buildCssPreview('<main><h1>Card</h1></main>', '.card { color: red; }');

  assert.match(preview, /data:text\/css;charset=utf-8,/);
  assert.match(preview, /color%3A%20red/);
  assert.match(preview, /script-src &#39;none&#39;|script-src 'none'/);
  assert.match(preview, /<main><h1>Card<\/h1><\/main>/);
});

test('non-browser language preview states that it is not a runtime and escapes source', () => {
  const preview = buildSubmissionPreview('Python', 'print("<script>")');

  assert.match(preview, /Requirement check only/);
  assert.match(preview, /does not run this program in a language runtime/);
  assert.match(preview, /&lt;script&gt;/);
  assert.match(preview, /script-src &#39;none&#39;|script-src 'none'/);
});

test('empty submissions keep the output panel empty', () => {
  assert.equal(buildSubmissionPreview('Java', ''), '');
});
