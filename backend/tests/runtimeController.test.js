const test = require('node:test');
const assert = require('node:assert/strict');
const { validateRunRequest, getRunnerUrl, createRunCodeController } = require('../controllers/runtimeController');

function mockResponse() {
  return {
    statusCode: 200,
    headers: {},
    body: null,
    status(code) { this.statusCode = code; return this; },
    set(name, value) { this.headers[name.toLowerCase()] = value; return this; },
    json(body) { this.body = body; return this; },
  };
}

test('runtime endpoint accepts only bounded source for supported executable languages', () => {
  assert.equal(validateRunRequest({ language: 'javascript', sourceCode: 'console.log(1)' }), null);
  assert.equal(validateRunRequest({ language: 'python', sourceCode: 'print(1)' }), null);
  assert.equal(validateRunRequest({ language: 'java', sourceCode: 'class Main {}' }), null);
  assert.match(validateRunRequest({ language: 'html', sourceCode: '<h1>unsafe</h1>' }), /JavaScript, Python, or Java/);
  assert.match(validateRunRequest({ language: 'java', sourceCode: ' ' }), /Add code/);
  assert.match(validateRunRequest({ language: 'java', sourceCode: 'x'.repeat(32 * 1024 + 1) }), /32 KB/);
});

test('API bridge sends only the private runner URL and secret, and caps returned output', async () => {
  const secret = 'runner-shared-secret-with-at-least-32-bytes';
  let fetchArgs;
  const controller = createRunCodeController({
    env: { CODE_RUNNER_URL: 'http://runner.internal:3010', CODE_RUNNER_SECRET: secret },
    fetchImpl: async (...args) => {
      fetchArgs = args;
      return {
        ok: true,
        json: async () => ({
          status: 'completed', stdout: 'x'.repeat(40000), stderr: '', exitCode: 0, durationMs: 4,
        }),
      };
    },
  });
  const res = mockResponse();
  await controller({ body: { language: 'JavaScript', sourceCode: 'console.log(1)' } }, res);

  assert.equal(fetchArgs[0], 'http://runner.internal:3010/v1/run');
  assert.equal(fetchArgs[1].headers.authorization, `Bearer ${secret}`);
  assert.deepEqual(JSON.parse(fetchArgs[1].body), { language: 'javascript', sourceCode: 'console.log(1)' });
  assert.equal(res.body.stdout.length, 32768);
  assert.equal(res.headers['cache-control'], 'no-store');
});

test('API bridge rejects unsafe runner URLs and returns a busy response without leaking service details', async () => {
  assert.equal(getRunnerUrl('ftp://runner.internal'), null);
  assert.equal(getRunnerUrl('http://user:pass@runner.internal'), null);
  const controller = createRunCodeController({
    env: { CODE_RUNNER_URL: 'http://runner.internal:3010', CODE_RUNNER_SECRET: 'runner-shared-secret-with-at-least-32-bytes' },
    fetchImpl: async () => ({ ok: false, status: 429 }),
  });
  const res = mockResponse();
  await controller({ body: { language: 'python', sourceCode: 'print(1)' } }, res);
  assert.equal(res.statusCode, 429);
  assert.equal(res.body.message, 'The code runner is busy. Try again shortly.');
});
