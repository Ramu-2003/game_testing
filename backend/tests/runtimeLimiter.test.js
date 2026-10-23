const assert = require('node:assert/strict');
const test = require('node:test');
const { createRuntimeLimiter } = require('../middleware/runtimeLimiter');

function mockResponse() {
  const handlers = new Map();
  return {
    headers: {},
    statusCode: 200,
    body: null,
    set(name, value) {
      this.headers[name] = value;
      return this;
    },
    status(statusCode) {
      this.statusCode = statusCode;
      return this;
    },
    json(body) {
      this.body = body;
      return this;
    },
    once(event, handler) {
      handlers.set(event, handler);
      return this;
    },
    emit(event) {
      handlers.get(event)?.();
    },
  };
}

test('runtime limiter serializes one user and releases the slot once', () => {
  const limiter = createRuntimeLimiter();
  const firstResponse = mockResponse();
  let allowed = 0;

  limiter({ user: { id: 'player-1' } }, firstResponse, () => { allowed += 1; });
  const busyResponse = mockResponse();
  limiter({ user: { id: 'player-1' } }, busyResponse, () => { allowed += 1; });

  assert.equal(allowed, 1);
  assert.equal(busyResponse.statusCode, 429);
  assert.match(busyResponse.body.message, /current program run/);

  firstResponse.emit('finish');
  firstResponse.emit('close');
  limiter({ user: { id: 'player-1' } }, mockResponse(), () => { allowed += 1; });
  assert.equal(allowed, 2);
});

test('runtime limiter applies a per-user window and resets after cooldown', () => {
  let currentTime = 1000;
  const limiter = createRuntimeLimiter({
    now: () => currentTime,
    windowMs: 10_000,
    maxRunsPerWindow: 2,
  });
  let allowed = 0;

  for (let run = 0; run < 2; run += 1) {
    const response = mockResponse();
    limiter({ user: { id: 'player-2' } }, response, () => { allowed += 1; });
    response.emit('finish');
  }

  const limitedResponse = mockResponse();
  limiter({ user: { id: 'player-2' } }, limitedResponse, () => { allowed += 1; });
  assert.equal(limitedResponse.statusCode, 429);
  assert.equal(limitedResponse.headers['Retry-After'], '10');

  currentTime += 10_000;
  limiter({ user: { id: 'player-2' } }, mockResponse(), () => { allowed += 1; });
  assert.equal(allowed, 3);
});

test('runtime limiter requires an authenticated user identity', () => {
  const response = mockResponse();
  let allowed = false;

  createRuntimeLimiter()({}, response, () => { allowed = true; });

  assert.equal(response.statusCode, 401);
  assert.equal(allowed, false);
});
