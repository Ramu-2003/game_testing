const activeChallenges = new Map();
const ACTIVE_CHALLENGE_TTL_MS = 2 * 60 * 60 * 1000;

function getKey(mode, roomId) {
  return `${mode}:${roomId}`;
}

function registerActiveChallenge(mode, roomId, challenge, now = Date.now()) {
  if (!['computer', 'custom'].includes(mode) || !roomId || !challenge?.id) return;
  for (const [key, entry] of activeChallenges) {
    if (entry.expiresAt <= now) activeChallenges.delete(key);
  }
  activeChallenges.set(getKey(mode, roomId), {
    challenge,
    expiresAt: now + ACTIVE_CHALLENGE_TTL_MS,
  });
}

function getActiveChallenge(mode, roomId, now = Date.now()) {
  if (!['computer', 'custom'].includes(mode) || !roomId) return null;
  const key = getKey(mode, roomId);
  const entry = activeChallenges.get(key);
  if (!entry) return null;
  if (entry.expiresAt <= now) {
    activeChallenges.delete(key);
    return null;
  }
  return entry.challenge;
}

function removeActiveChallenge(mode, roomId) {
  if (!['computer', 'custom'].includes(mode) || !roomId) return;
  activeChallenges.delete(getKey(mode, roomId));
}

module.exports = { registerActiveChallenge, getActiveChallenge, removeActiveChallenge };
