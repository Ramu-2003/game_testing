const assert = require('node:assert/strict');
const test = require('node:test');

const {
  issueLevelCompletionProof,
  verifyLevelCompletionProof,
  issueMultiplayerCompletionProof,
  verifyMultiplayerCompletionProof,
  normalizeValidationResult,
  validateCodeRequest,
} = require('../utils/completionProof');
const { getLevelCompletionDecision } = require('../utils/levelProgression');

const previousSecret = process.env.JWT_SECRET;
process.env.JWT_SECRET = 'test-only-secret';

test('level completion proofs are user, level, and code specific', () => {
  const context = { userId: 'player-1', course: 'javascript', phase: 2, level: 3, userCode: 'function solve() { return 1; }' };
  const proof = issueLevelCompletionProof(context);

  assert.equal(typeof proof, 'string');
  assert.equal(verifyLevelCompletionProof(proof, context), true);
  assert.equal(verifyLevelCompletionProof(proof, { ...context, userId: 'player-2' }), false);
  assert.equal(verifyLevelCompletionProof(proof, { ...context, level: 4 }), false);
  assert.equal(verifyLevelCompletionProof(proof, { ...context, userCode: 'function solve() { return 2; }' }), false);
});

test('multiplayer completion proofs are bound to the player, room, and challenge', () => {
  const context = { userId: 'player-1', mode: 'custom', roomId: 'ROOM7', challengeId: 'challenge-1', userCode: 'print("ready")' };
  const proof = issueMultiplayerCompletionProof(context);

  assert.equal(typeof proof, 'string');
  assert.equal(verifyMultiplayerCompletionProof(proof, context), true);
  assert.equal(verifyMultiplayerCompletionProof(proof, { ...context, roomId: 'ROOM8' }), false);
  assert.equal(verifyMultiplayerCompletionProof(proof, { ...context, challengeId: 'challenge-2' }), false);
  assert.equal(verifyMultiplayerCompletionProof(proof, { ...context, mode: 'computer' }), false);
});

test('normalization requires every expected checkpoint and rejects inconsistent success flags', () => {
  const cases = [{ id: 1, description: 'first' }, { id: 2, description: 'second' }];
  const incomplete = normalizeValidationResult({
    allTestsPassed: true,
    testResults: [{ id: 1, passed: true }],
    errors: [],
  }, cases);

  assert.equal(incomplete.allTestsPassed, false);
  assert.equal(incomplete.testResults[1].passed, false);

  const complete = normalizeValidationResult({
    testResults: [{ id: 1, passed: true }, { id: 2, passed: true }],
    errors: [],
  }, cases);
  assert.equal(complete.allTestsPassed, true);
});

test('level completion is sequential, bounded, and idempotent', () => {
  const user = {
    levelProgress: { javascript: { phase1: 2 } },
    completedLevels: [{ course: 'javascript', phase: 1, level: 1 }],
  };

  assert.deepEqual(getLevelCompletionDecision({ course: 'javascript', phase: 1, level: 2, user }), {
    allowed: true,
    alreadyCompleted: false,
    unlockedLevel: 2,
    nextUnlocked: 3,
    phaseKey: 'phase1',
  });
  assert.equal(getLevelCompletionDecision({ course: 'javascript', phase: 1, level: 10, user: {
    levelProgress: { javascript: { phase1: 10 } },
    completedLevels: Array.from({ length: 9 }, (_, index) => ({ course: 'javascript', phase: 1, level: index + 1 })),
  } }).nextPhaseKey, 'phase2');
  assert.equal(getLevelCompletionDecision({ course: 'javascript', phase: 1, level: 4, user }).reason, 'level_locked');
  assert.equal(getLevelCompletionDecision({ course: 'javascript', phase: 11, level: 1, user }).reason, 'invalid_level');
  assert.equal(getLevelCompletionDecision({ course: 'javascript', phase: 1, level: 1, user }).alreadyCompleted, true);
});

test('later phases stay locked on the server until the previous phase is complete', () => {
  const freshUser = { completedLevels: [], levelProgress: { javascript: {} } };
  assert.equal(getLevelCompletionDecision({ course: 'javascript', phase: 2, level: 1, user: freshUser }).reason, 'phase_locked');

  const completedFirstPhase = {
    levelProgress: { javascript: { phase1: 11, phase2: 0 } },
    completedLevels: Array.from({ length: 10 }, (_, index) => ({
      course: 'javascript', phase: 1, level: index + 1,
    })),
  };
  assert.equal(getLevelCompletionDecision({ course: 'javascript', phase: 2, level: 1, user: completedFirstPhase }).allowed, true);
});

test('validation requests reject empty code and malformed test cases', () => {
  assert.ok(validateCodeRequest({ userCode: ' ', levelTitle: 'Task', testCases: [{ description: 'Check it' }] }));
  assert.ok(validateCodeRequest({ userCode: 'code', levelTitle: 'Task', testCases: [] }));
  assert.equal(validateCodeRequest({ userCode: 'code', levelTitle: 'Task', testCases: [{ description: 'Check it' }] }), null);
});

test.after(() => {
  if (previousSecret === undefined) delete process.env.JWT_SECRET;
  else process.env.JWT_SECRET = previousSecret;
});
