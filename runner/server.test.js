const test = require('node:test');
const assert = require('node:assert/strict');
const { Readable } = require('node:stream');
const { buildDockerArgs, createRunnerHandler, normalizeRequest } = require('./server');

const SECRET = 'test-secret-with-more-than-thirty-two-bytes';

function mockResponse() {
  return {
    headers: {},
    statusCode: 200,
    body: '',
    setHeader(name, value) { this.headers[name.toLowerCase()] = value; },
    writeHead(statusCode, headers) {
      this.statusCode = statusCode;
      Object.entries(headers).forEach(([name, value]) => this.setHeader(name, value));
    },
    end(body) { this.body = body?.toString() || ''; },
    json() { return JSON.parse(this.body); },
  };
}

async function invoke(handler, { method = 'POST', url = '/v1/run', headers = {}, body = '' } = {}) {
  const req = Readable.from([Buffer.from(body)]);
  req.method = method;
  req.url = url;
  req.headers = headers;
  const res = mockResponse();
  await handler(req, res);
  return res;
}

test('normalizes supported runtimes and rejects malformed or oversized source', () => {
  assert.deepEqual(normalizeRequest({ language: 'python', sourceCode: 'print(1)' }), {
    language: 'python', sourceCode: 'print(1)',
  });
  assert.match(normalizeRequest({ language: 'html', sourceCode: '<h1>Hi</h1>' }).error, /Language/);
  assert.match(normalizeRequest({ language: 'java', sourceCode: '' }).error, /Add code/);
  assert.match(normalizeRequest({ language: 'java', sourceCode: '🙂'.repeat(9000) }).error, /32 KB/);
});

test('docker invocation uses fixed sandbox controls and never receives learner source as an argument', () => {
  const args = buildDockerArgs({ language: 'javascript', cidFile: '/tmp/run-id', image: 'game-trail-execution:1', runtime: 'runsc' });
  assert.ok(args.includes('--network') && args.includes('none'));
  assert.ok(args.includes('--pull=never'), 'execution images must be provisioned locally, never pulled during a learner run');
  assert.ok(args.includes('--read-only'));
  assert.ok(args.includes('--cap-drop=ALL'));
  assert.ok(args.includes('--runtime') && args.includes('runsc'));
  assert.ok(args.includes('--memory=320m'));
  assert.ok(!args.includes('process.exit(1)'));
  assert.throws(() => createRunnerHandler({ secret: SECRET, runtime: 'runc' }), /must be runsc/);
});

test('runner requires bearer authentication and returns bounded execution results', async () => {
  const calls = [];
  const handler = createRunnerHandler({
    secret: SECRET,
    execute: async (request) => {
      calls.push(request);
      return { status: 'completed', stdout: '42\n', stderr: '', exitCode: 0, durationMs: 12 };
    },
  });
  const body = JSON.stringify({ language: 'javascript', sourceCode: 'console.log(42)' });
  const denied = await invoke(handler, { headers: { 'content-type': 'application/json' }, body });
  assert.equal(denied.statusCode, 401);

  const allowed = await invoke(handler, {
    headers: { authorization: `Bearer ${SECRET}`, 'content-type': 'application/json' }, body,
  });
  assert.equal(allowed.statusCode, 200);
  assert.deepEqual(allowed.json(), { status: 'completed', stdout: '42\n', stderr: '', exitCode: 0, durationMs: 12 });
  assert.equal(calls.length, 1);
  assert.equal(calls[0].sourceCode, 'console.log(42)');
});

test('runner rejects large bodies and malformed JSON before execution', async () => {
  let executions = 0;
  const handler = createRunnerHandler({ secret: SECRET, execute: async () => { executions += 1; } });
  const headers = { authorization: `Bearer ${SECRET}`, 'content-type': 'application/json' };
  const large = await invoke(handler, {
    headers, body: JSON.stringify({ language: 'python', sourceCode: 'x'.repeat(41 * 1024) }),
  });
  assert.equal(large.statusCode, 413);

  const malformed = await invoke(handler, { headers, body: '{bad json' });
  assert.equal(malformed.statusCode, 400);
  assert.equal(executions, 0);
});

test('runner enforces the concurrent execution ceiling', async () => {
  let releaseFirst;
  let markEntered;
  const firstExecution = new Promise((resolve) => { releaseFirst = resolve; });
  const entered = new Promise((resolve) => { markEntered = resolve; });
  const handler = createRunnerHandler({
    secret: SECRET,
    concurrency: 1,
    execute: async () => {
      markEntered();
      await firstExecution;
      return { status: 'completed', stdout: '', stderr: '', exitCode: 0, durationMs: 1 };
    },
  });
  const options = {
    headers: { authorization: `Bearer ${SECRET}`, 'content-type': 'application/json' },
    body: JSON.stringify({ language: 'python', sourceCode: 'print(1)' }),
  };
  const firstResponse = mockResponse();
  const firstReq = Readable.from([Buffer.from(options.body)]);
  Object.assign(firstReq, { method: 'POST', url: '/v1/run', headers: options.headers });
  const firstCall = handler(firstReq, firstResponse);
  await entered;

  const second = await invoke(handler, options);
  assert.equal(second.statusCode, 429);
  releaseFirst();
  await firstCall;
  assert.equal(firstResponse.statusCode, 200);
});
