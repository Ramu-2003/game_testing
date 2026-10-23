const assert = require('node:assert/strict');
const test = require('node:test');
const { validateCodeHeuristic } = require('../utils/heuristicValidator');

function passed(language, code, description) {
  return validateCodeHeuristic({
    language,
    userCode: code,
    testCases: [{ id: 1, description }],
  }).testResults[0].passed;
}

test('offline CSS checks ignore a required property found only in a comment', () => {
  assert.equal(passed('css', '/* outline */ .card { color: red; }', 'Use the code token `outline` to satisfy the focus requirement.'), false);
});

test('offline CSS checks require every property named in the task', () => {
  const description = 'Set h1 color to blue and padding to 20px.';
  assert.equal(passed('css', 'h1 { color: blue; }', description), false);
  assert.equal(passed('css', 'h1 { color: blue; padding: 20px; }', description), true);
});

test('offline JavaScript checks ignore a required token found only in a comment', () => {
  assert.equal(passed('javascript', '// reduce(\nfunction solve() { return 1; }', 'Use the code token `reduce(` to summarize the scores.'), false);
});

test('offline code-token checks reject a token found only in a string', () => {
  assert.equal(passed('javascript', 'const note = "reduce("; function solve() { return 1; }', 'Use the code token `reduce(` to summarize the scores.'), false);
});

test('offline Python checks do not award an unrecognized long submission', () => {
  assert.equal(passed('python', 'x = 1\n' + 'print(x)\n'.repeat(20), 'Complete the task successfully.'), false);
});

test('offline HTML checks require all headings in a described range', () => {
  const code = '<h1>One</h1><h2>Two</h2><h3>Three</h3><h4>Four</h4><h5>Five</h5>';
  assert.equal(passed('html', code, 'Add all six heading tags from <h1> to <h6>'), false);
  assert.equal(passed('html', `${code}<h6>Six</h6>`, 'Add all six heading tags from <h1> to <h6>'), true);
});

test('offline Java checks ignore tokens inside block comments', () => {
  assert.equal(passed('java', '/* System.out.println( */ class Main {}', 'Use System.out.println() to print output'), false);
});
