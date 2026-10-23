const http = require('node:http');
const crypto = require('node:crypto');
const os = require('node:os');
const path = require('node:path');
const fs = require('node:fs/promises');
const { spawn } = require('node:child_process');

const MAX_BODY_BYTES = 40 * 1024;
const MAX_SOURCE_BYTES = 32 * 1024;
const MAX_OUTPUT_BYTES = 32 * 1024;
const MAX_CONCURRENT_RUNS = 2;
const LANGUAGES = new Set(['javascript', 'python', 'java']);
const TIME_LIMIT_MS = { javascript: 3000, python: 3000, java: 7000 };

function sendJson(res, statusCode, body) {
  const payload = Buffer.from(JSON.stringify(body));
  res.writeHead(statusCode, {
    'content-type': 'application/json; charset=utf-8',
    'content-length': payload.length,
    'cache-control': 'no-store',
    'x-content-type-options': 'nosniff',
  });
  res.end(payload);
}

function normalizeRequest(body) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) return { error: 'A JSON object is required.' };
  const language = String(body.language || '').trim().toLowerCase();
  const sourceCode = body.sourceCode;
  if (!LANGUAGES.has(language)) return { error: 'Language must be javascript, python, or java.' };
  if (typeof sourceCode !== 'string') return { error: 'sourceCode must be a string.' };
  if (Buffer.byteLength(sourceCode, 'utf8') === 0) return { error: 'Add code before running it.' };
  if (Buffer.byteLength(sourceCode, 'utf8') > MAX_SOURCE_BYTES) return { error: 'Code is too large. The limit is 32 KB.' };
  return { language, sourceCode };
}

function buildDockerArgs({ language, cidFile, image, runtime }) {
  return [
    'run',
    '--rm',
    '--pull=never',
    '--cidfile', cidFile,
    '--interactive',
    '--runtime', runtime,
    '--network', 'none',
    '--read-only',
    '--cap-drop=ALL',
    '--security-opt=no-new-privileges:true',
    '--pids-limit=64',
    '--memory=320m',
    '--memory-swap=320m',
    '--cpus=0.5',
    '--ulimit', 'nofile=64:64',
    '--ulimit', 'fsize=1048576:1048576',
    '--tmpfs', '/tmp:rw,nosuid,nodev,size=32m,mode=1777',
    '--user', '10001:10001',
    image,
    language,
  ];
}

function secureEquals(actual, expected) {
  const actualBytes = Buffer.from(actual || '');
  const expectedBytes = Buffer.from(expected || '');
  return actualBytes.length === expectedBytes.length && actualBytes.length > 0
    && crypto.timingSafeEqual(actualBytes, expectedBytes);
}

async function readJson(req) {
  const chunks = [];
  let total = 0;
  for await (const chunk of req) {
    total += chunk.length;
    if (total > MAX_BODY_BYTES) {
      const error = new Error('Request body is too large.');
      error.statusCode = 413;
      throw error;
    }
    chunks.push(chunk);
  }
  try {
    return JSON.parse(Buffer.concat(chunks).toString('utf8'));
  } catch {
    const error = new Error('Request body must contain valid JSON.');
    error.statusCode = 400;
    throw error;
  }
}

function appendLimited(current, incoming, state) {
  const remaining = Math.max(0, MAX_OUTPUT_BYTES - state.bytes);
  if (remaining > 0) current.push(incoming.subarray(0, remaining));
  state.bytes += incoming.length;
  if (state.bytes > MAX_OUTPUT_BYTES) state.exceeded = true;
}

async function removeContainer(containerId) {
  if (!/^[a-f0-9]{12,64}$/i.test(containerId || '')) return;
  await new Promise((resolve) => {
    let child;
    try {
      child = spawn('docker', ['rm', '-f', containerId], { stdio: 'ignore', windowsHide: true });
    } catch {
      resolve();
      return;
    }
    const timer = setTimeout(() => {
      child.kill('SIGKILL');
      resolve();
    }, 2000);
    timer.unref?.();
    child.once('error', () => { clearTimeout(timer); resolve(); });
    child.once('close', () => { clearTimeout(timer); resolve(); });
  });
}

async function runInContainer({ language, sourceCode, image, runtime, spawnProcess = spawn }) {
  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'game-trail-run-'));
  const cidFile = path.join(tempDir, 'container.id');
  const stdoutChunks = [];
  const stderrChunks = [];
  const outState = { bytes: 0, exceeded: false };
  const errState = { bytes: 0, exceeded: false };
  const startedAt = Date.now();
  let timedOut = false;
  let outputExceeded = false;
  let child;

  try {
    child = spawnProcess('docker', buildDockerArgs({ language, cidFile, image, runtime }), {
      stdio: ['pipe', 'pipe', 'pipe'],
      windowsHide: true,
    });
    const completion = new Promise((resolve, reject) => {
      let settled = false;
      const finish = (value, error) => {
        if (settled) return;
        settled = true;
        clearTimeout(timeout);
        if (error) reject(error);
        else resolve(value);
      };
      const stop = () => {
        outputExceeded = outState.exceeded || errState.exceeded;
        child.kill('SIGTERM');
        const hardStop = setTimeout(() => child.kill('SIGKILL'), 250);
        hardStop.unref?.();
      };
      child.stdout.on('data', (chunk) => {
        appendLimited(stdoutChunks, chunk, outState);
        if (outState.exceeded && !outputExceeded) stop();
      });
      child.stderr.on('data', (chunk) => {
        appendLimited(stderrChunks, chunk, errState);
        if (errState.exceeded && !outputExceeded) stop();
      });
      child.once('error', (error) => finish(null, error));
      child.once('close', (code, signal) => finish({ code, signal }));
      child.stdin.on('error', () => {});
      const timeout = setTimeout(() => {
        timedOut = true;
        stop();
      }, TIME_LIMIT_MS[language]);
      timeout.unref?.();
    });

    child.stdin.end(sourceCode, 'utf8');
    const processResult = await completion;
    const stdout = Buffer.concat(stdoutChunks).toString('utf8');
    const stderr = Buffer.concat(stderrChunks).toString('utf8');
    const durationMs = Date.now() - startedAt;
    if (timedOut) return { status: 'timeout', stdout, stderr, exitCode: null, durationMs };
    if (outputExceeded) return { status: 'output_limit', stdout, stderr, exitCode: null, durationMs };
    if (processResult.code !== 0) {
      const dockerUnavailable = processResult.code === 125 || processResult.code === null;
      return dockerUnavailable
        ? { status: 'unavailable', stdout: '', stderr: '', exitCode: null, durationMs }
        : { status: 'error', stdout, stderr, exitCode: processResult.code, durationMs };
    }
    return { status: 'completed', stdout, stderr, exitCode: processResult.code, durationMs };
  } finally {
    let containerId = '';
    try { containerId = (await fs.readFile(cidFile, 'utf8')).trim(); } catch { /* No container was created. */ }
    await removeContainer(containerId);
    await fs.rm(tempDir, { recursive: true, force: true });
  }
}

function createRunnerHandler({ secret, image = process.env.RUNNER_DOCKER_IMAGE || 'game-trail-execution:1', runtime = process.env.RUNNER_DOCKER_RUNTIME || 'runsc', execute = runInContainer, concurrency = MAX_CONCURRENT_RUNS } = {}) {
  if (typeof secret !== 'string' || Buffer.byteLength(secret) < 32) {
    throw new Error('RUNNER_SHARED_SECRET must contain at least 32 bytes.');
  }
  if (!/^[a-zA-Z0-9][a-zA-Z0-9_.-]{0,62}(?::[a-zA-Z0-9][a-zA-Z0-9_.-]{0,127})?$/.test(image)) throw new Error('RUNNER_DOCKER_IMAGE is invalid.');
  if (runtime !== 'runsc') throw new Error('RUNNER_DOCKER_RUNTIME must be runsc.');
  let activeRuns = 0;

  return async (req, res) => {
    if (req.method === 'GET' && req.url === '/healthz') return sendJson(res, 200, { ready: true });
    if (req.method !== 'POST' || req.url !== '/v1/run') return sendJson(res, 404, { message: 'Not found.' });
    if (!secureEquals(req.headers.authorization?.replace(/^Bearer\s+/i, ''), secret)) {
      return sendJson(res, 401, { message: 'Unauthorized.' });
    }
    if (!String(req.headers['content-type'] || '').toLowerCase().includes('application/json')) {
      return sendJson(res, 415, { message: 'Content-Type must be application/json.' });
    }

    let request;
    try {
      request = normalizeRequest(await readJson(req));
    } catch (error) {
      return sendJson(res, error.statusCode || 400, { message: error.message });
    }
    if (request.error) return sendJson(res, 400, { message: request.error });
    if (activeRuns >= concurrency) {
      res.setHeader('retry-after', '2');
      return sendJson(res, 429, { message: 'The code runner is busy. Try again shortly.' });
    }

    activeRuns += 1;
    try {
      const result = await execute({ ...request, image, runtime });
      return sendJson(res, 200, result);
    } catch (error) {
      console.error('[Code Runner] Execution service error:', error.message);
      return sendJson(res, 503, { message: 'The isolated code runner is unavailable.' });
    } finally {
      activeRuns -= 1;
    }
  };
}

function createRunnerServer(options = {}) {
  return http.createServer(createRunnerHandler(options));
}

if (require.main === module) {
  const secret = process.env.RUNNER_SHARED_SECRET;
  const host = process.env.RUNNER_HOST || '127.0.0.1';
  const port = Number(process.env.RUNNER_PORT || 3010);
  try {
    const server = createRunnerServer({ secret });
    server.listen(port, host, () => console.log(`[Code Runner] Listening on ${host}:${port}`));
  } catch (error) {
    console.error(`[Code Runner] Startup refused: ${error.message}`);
    process.exitCode = 1;
  }
}

module.exports = { buildDockerArgs, createRunnerHandler, createRunnerServer, normalizeRequest, runInContainer };
