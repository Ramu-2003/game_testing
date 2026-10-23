const assert = require('node:assert/strict');
const test = require('node:test');
const jwt = require('jsonwebtoken');
const { authenticateSocket, resolveSocketUserId } = require('../middleware/socketAuth');
const { createCorsOptions } = require('../utils/corsPolicy');
const { SECURITY_HEADERS, securityHeaders } = require('../utils/securityHeaders');
const { getActiveChallenge, registerActiveChallenge, removeActiveChallenge } = require('../utils/activeChallenges');

test('socket identity comes from a valid JWT and rejects missing or invalid tokens', () => {
  const previousSecret = process.env.JWT_SECRET;
  process.env.JWT_SECRET = 'socket-test-secret';
  const socket = { handshake: { auth: { token: jwt.sign({ id: 'user-1' }, process.env.JWT_SECRET) } }, data: {} };
  let error = null;

  authenticateSocket(socket, (result) => { error = result || null; });
  assert.equal(error, null);
  assert.equal(socket.data.userId, 'user-1');
  assert.equal(resolveSocketUserId(socket, 'user-1'), 'user-1');
  assert.equal(resolveSocketUserId(socket, 'user-2'), null);

  let rejected;
  authenticateSocket({ handshake: { auth: {} }, data: {} }, (result) => { rejected = result; });
  assert.match(rejected.message, /Authentication required/);
  if (previousSecret === undefined) delete process.env.JWT_SECRET;
  else process.env.JWT_SECRET = previousSecret;
});

test('CORS accepts configured origins and local development while rejecting unrelated sites', () => {
  const options = createCorsOptions({
    NODE_ENV: 'development',
    FRONTEND_URL: 'https://game.example.com',
    ALLOWED_ORIGINS: 'https://preview.example.com, https://staging.example.com',
  });

  const decide = (origin) => new Promise((resolve, reject) => {
    options.origin(origin, (error, allowed) => error ? reject(error) : resolve(allowed));
  });

  return Promise.all([
    decide('https://game.example.com'),
    decide('https://preview.example.com'),
    decide('http://localhost:5173'),
    decide(undefined),
    decide('https://attacker.example'),
  ]).then((results) => assert.deepEqual(results, [true, true, true, true, false]));
});

test('API security middleware adds the baseline browser protections', () => {
  const actualHeaders = {};
  let continued = false;
  securityHeaders({}, {
    setHeader: (name, value) => { actualHeaders[name] = value; },
  }, () => { continued = true; });

  assert.deepEqual(actualHeaders, SECURITY_HEADERS);
  assert.equal(continued, true);
});

test('active challenge storage is namespaced by game mode and room', () => {
  const computer = { id: 'challenge-computer' };
  const custom = { id: 'challenge-custom' };
  registerActiveChallenge('computer', 'ROOM-1', computer);
  registerActiveChallenge('custom', 'ROOM-1', custom);

  assert.equal(getActiveChallenge('computer', 'ROOM-1'), computer);
  assert.equal(getActiveChallenge('custom', 'ROOM-1'), custom);
  removeActiveChallenge('custom', 'ROOM-1');
  assert.equal(getActiveChallenge('custom', 'ROOM-1'), null);
  assert.equal(getActiveChallenge('computer', 'ROOM-1'), computer);
  removeActiveChallenge('computer', 'ROOM-1');
});

test('active challenge entries expire after two hours', () => {
  const challenge = { id: 'old-challenge' };
  registerActiveChallenge('computer', 'ROOM-EXPIRED', challenge, 1000);
  assert.equal(getActiveChallenge('computer', 'ROOM-EXPIRED', 1000 + 2 * 60 * 60 * 1000), null);
});
