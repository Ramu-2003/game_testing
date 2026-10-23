const ALLOWED_LANGUAGES = new Set(['javascript', 'python', 'java']);
const MAX_SOURCE_BYTES = 32 * 1024;
const ALLOWED_STATUSES = new Set(['completed', 'error', 'timeout', 'output_limit', 'unavailable']);

function validateRunRequest(body) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) return 'A JSON object is required.';
  const language = String(body.language || '').trim().toLowerCase();
  if (!ALLOWED_LANGUAGES.has(language)) return 'Choose JavaScript, Python, or Java to run.';
  if (typeof body.sourceCode !== 'string' || !body.sourceCode.trim()) return 'Add code before running it.';
  if (Buffer.byteLength(body.sourceCode, 'utf8') > MAX_SOURCE_BYTES) return 'Code is too large. The limit is 32 KB.';
  return null;
}

function getRunnerUrl(value) {
  try {
    const base = new URL(value);
    if (!['http:', 'https:'].includes(base.protocol) || base.username || base.password || base.search || base.hash) return null;
    return new URL('/v1/run', base).toString();
  } catch {
    return null;
  }
}

function createRunCodeController({ fetchImpl = fetch, env = process.env } = {}) {
  return async (req, res) => {
    res.set('Cache-Control', 'no-store');
    const validationError = validateRunRequest(req.body);
    if (validationError) return res.status(400).json({ message: validationError });

    const runnerUrl = getRunnerUrl(env.CODE_RUNNER_URL);
    const runnerSecret = env.CODE_RUNNER_SECRET;
    if (!runnerUrl || typeof runnerSecret !== 'string' || Buffer.byteLength(runnerSecret) < 32) {
      return res.status(503).json({ message: 'The isolated code runner is not configured.' });
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);
    timeout.unref?.();
    try {
      const runnerResponse = await fetchImpl(runnerUrl, {
        method: 'POST',
        headers: {
          authorization: `Bearer ${runnerSecret}`,
          'content-type': 'application/json',
          accept: 'application/json',
        },
        body: JSON.stringify({ language: req.body.language.trim().toLowerCase(), sourceCode: req.body.sourceCode }),
        signal: controller.signal,
      });

      if (!runnerResponse.ok) {
        const statusCode = runnerResponse.status === 429 ? 429 : 503;
        return res.status(statusCode).json({
          message: statusCode === 429 ? 'The code runner is busy. Try again shortly.' : 'The isolated code runner is unavailable.',
        });
      }

      const result = await runnerResponse.json();
      if (!result || !ALLOWED_STATUSES.has(result.status)) {
        return res.status(502).json({ message: 'The code runner returned an invalid response.' });
      }
      if (result.status === 'unavailable') {
        return res.status(503).json({ message: 'The isolated code runner is unavailable.' });
      }
      return res.set('Cache-Control', 'no-store').json({
        status: result.status,
        stdout: typeof result.stdout === 'string' ? result.stdout.slice(0, 32768) : '',
        stderr: typeof result.stderr === 'string' ? result.stderr.slice(0, 32768) : '',
        exitCode: Number.isInteger(result.exitCode) ? result.exitCode : null,
        durationMs: Number.isFinite(result.durationMs) ? Math.max(0, Math.min(result.durationMs, 10000)) : 0,
      });
    } catch (error) {
      const timedOut = error.name === 'AbortError';
      console.warn(`[Code Runner] ${timedOut ? 'Request timed out' : 'Request failed'}`);
      return res.status(503).json({ message: timedOut ? 'The code runner took too long to respond.' : 'The isolated code runner is unavailable.' });
    } finally {
      clearTimeout(timeout);
    }
  };
}

exports.validateRunRequest = validateRunRequest;
exports.getRunnerUrl = getRunnerUrl;
exports.createRunCodeController = createRunCodeController;
exports.runCode = createRunCodeController();
