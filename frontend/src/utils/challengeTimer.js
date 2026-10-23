import curriculumLimits from '../config/curriculumLimits.js';

export function readChallengeTimer(key, durationSeconds, storage = globalThis.sessionStorage, now = Date.now()) {
  const defaultSeconds = Number.isFinite(durationSeconds) ? Math.max(0, Math.floor(durationSeconds)) : 0;
  if (!storage) return { timeLeft: defaultSeconds, isRunning: defaultSeconds > 0 };

  try {
    const raw = storage.getItem(key);
    if (!raw) return { timeLeft: defaultSeconds, isRunning: defaultSeconds > 0 };

    const saved = JSON.parse(raw);
    if (!Number.isFinite(saved.timeLeft) || saved.timeLeft < 0 || saved.timeLeft > defaultSeconds
        || !Number.isFinite(saved.timestamp) || saved.timestamp <= 0) {
      storage.removeItem(key);
      return { timeLeft: defaultSeconds, isRunning: defaultSeconds > 0 };
    }

    const elapsed = Math.max(0, Math.floor((now - saved.timestamp) / 1000));
    const timeLeft = Math.max(0, Math.floor(saved.timeLeft) - elapsed);
    return { timeLeft, isRunning: timeLeft > 0 };
  } catch {
    try { storage.removeItem(key); } catch { /* Storage may be unavailable. */ }
    return { timeLeft: defaultSeconds, isRunning: defaultSeconds > 0 };
  }
}

export function saveChallengeTimer(key, timeLeft, storage = globalThis.sessionStorage, now = Date.now()) {
  if (!storage || !Number.isFinite(timeLeft)) return;
  try {
    storage.setItem(key, JSON.stringify({ timeLeft: Math.max(0, Math.floor(timeLeft)), timestamp: now }));
  } catch {
    // The timer still runs for this page even if session storage is unavailable.
  }
}

export function clearPhaseChallengeTimers(course, phase, storage = globalThis.sessionStorage) {
  if (!storage) return;
  for (let level = 1; level <= curriculumLimits.maxLevelsPerPhase; level += 1) {
    try {
      storage.removeItem(`${course}_phase${phase}_level${level}_timer`);
    } catch {
      // Best effort: session storage can be disabled by the browser.
    }
  }
}

