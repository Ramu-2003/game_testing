const crypto = require('crypto');
const jwt = require('jsonwebtoken');

const COURSE_LANGUAGES = new Set(['html', 'css', 'javascript', 'python', 'java']);
const curriculumLimits = require('../../shared/curriculumLimits.json');

function hashCode(code) {
  return crypto.createHash('sha256').update(code, 'utf8').digest('hex');
}

function isLevelContextValid({ course, phase, level, userCode }) {
  return COURSE_LANGUAGES.has(course)
    && Number.isInteger(Number(phase))
    && Number(phase) >= 1
    && Number(phase) <= curriculumLimits.phaseCount
    && Number.isInteger(Number(level))
    && Number(level) >= 1
    && Number(level) <= curriculumLimits.maxLevelsPerPhase
    && typeof userCode === 'string'
    && userCode.trim().length > 0;
}

function issueLevelCompletionProof({ userId, course, phase, level, userCode }) {
  if (!process.env.JWT_SECRET || !userId || !isLevelContextValid({ course, phase, level, userCode })) {
    return null;
  }

  return jwt.sign({
    type: 'level-completion',
    userId: String(userId),
    course,
    phase: Number(phase),
    level: Number(level),
    codeHash: hashCode(userCode),
  }, process.env.JWT_SECRET, { expiresIn: '15m' });
}

function verifyLevelCompletionProof(token, { userId, course, phase, level, userCode }) {
  if (!token || !process.env.JWT_SECRET || !isLevelContextValid({ course, phase, level, userCode })) {
    return false;
  }

  try {
    const proof = jwt.verify(token, process.env.JWT_SECRET);
    return proof.type === 'level-completion'
      && proof.userId === String(userId)
      && proof.course === course
      && proof.phase === Number(phase)
      && proof.level === Number(level)
      && proof.codeHash === hashCode(userCode);
  } catch {
    return false;
  }
}

function issueMultiplayerCompletionProof({ userId, mode, roomId, challengeId, userCode }) {
  if (!process.env.JWT_SECRET || !userId || !roomId || !challengeId
      || !['computer', 'custom'].includes(mode)
      || typeof userCode !== 'string' || !userCode.trim()) {
    return null;
  }

  return jwt.sign({
    type: 'multiplayer-completion',
    userId: String(userId),
    mode,
    roomId: String(roomId),
    challengeId: String(challengeId),
    codeHash: hashCode(userCode),
  }, process.env.JWT_SECRET, { expiresIn: '15m' });
}

function verifyMultiplayerCompletionProof(token, { userId, mode, roomId, challengeId }) {
  if (!token || !process.env.JWT_SECRET || !userId || !roomId || !challengeId) {
    return false;
  }

  try {
    const proof = jwt.verify(token, process.env.JWT_SECRET);
    return proof.type === 'multiplayer-completion'
      && proof.userId === String(userId)
      && proof.mode === mode
      && proof.roomId === String(roomId)
      && proof.challengeId === String(challengeId)
      && typeof proof.codeHash === 'string';
  } catch {
    return false;
  }
}

function normalizeValidationResult(result, testCases) {
  const reported = new Map(
    (Array.isArray(result?.testResults) ? result.testResults : [])
      .filter((item) => item && item.id !== undefined)
      .map((item) => [String(item.id), item])
  );
  const testResults = testCases.map((testCase, index) => {
    const id = testCase.id ?? index + 1;
    const item = reported.get(String(id));
    return {
      id,
      passed: item?.passed === true,
      message: typeof item?.message === 'string' ? item.message.slice(0, 500) : 'Requirement was not verified.',
    };
  });
  const errors = (Array.isArray(result?.errors) ? result.errors : [])
    .filter((error) => error && typeof error.message === 'string')
    .slice(0, 20)
    .map((error) => ({
      line: Number.isInteger(error.line) && error.line > 0 ? error.line : 1,
      message: error.message.slice(0, 500),
      type: typeof error.type === 'string' ? error.type.slice(0, 80) : 'ValidationError',
    }));
  const allTestsPassed = testResults.length > 0
    && testResults.every((item) => item.passed)
    && errors.length === 0;
  const passedCount = testResults.filter((item) => item.passed).length;

  return {
    testResults,
    errors,
    allTestsPassed,
    completionPercentage: testResults.length ? Math.round((passedCount / testResults.length) * 100) : 0,
    summary: typeof result?.summary === 'string'
      ? result.summary.slice(0, 500)
      : `${passedCount} of ${testResults.length} requirements passed.`,
  };
}

function validateCodeRequest({ userCode, levelTitle, testCases, levelDescription, expectedOutput }) {
  if (typeof userCode !== 'string' || !userCode.trim() || userCode.length > 20000) {
    return 'Code must contain between 1 and 20,000 characters.';
  }
  if (typeof levelTitle !== 'string' || !levelTitle.trim() || levelTitle.length > 200) {
    return 'A valid challenge title is required.';
  }
  if (levelDescription !== undefined && (typeof levelDescription !== 'string' || levelDescription.length > 2000)) {
    return 'Challenge description is too long.';
  }
  if (expectedOutput !== undefined && (typeof expectedOutput !== 'string' || expectedOutput.length > 20000)) {
    return 'Expected output is too long.';
  }
  if (!Array.isArray(testCases) || testCases.length < 1 || testCases.length > 20
      || testCases.some((testCase) => !testCase || typeof testCase.description !== 'string'
        || !testCase.description.trim() || testCase.description.length > 600)) {
    return 'Provide between 1 and 20 valid test cases.';
  }
  const ids = testCases.map((testCase, index) => String(testCase.id ?? index + 1));
  if (new Set(ids).size !== ids.length) return 'Test case identifiers must be unique.';
  return null;
}

module.exports = {
  issueLevelCompletionProof,
  verifyLevelCompletionProof,
  issueMultiplayerCompletionProof,
  verifyMultiplayerCompletionProof,
  normalizeValidationResult,
  validateCodeRequest,
};
