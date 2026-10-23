const WINDOW_MS = 60 * 1000;
const MAX_RUNS_PER_WINDOW = 8;
const MAX_ACTIVE_RUNS_PER_USER = 1;
const MAX_TRACKED_USERS = 5000;

function createRuntimeLimiter({
  windowMs = WINDOW_MS,
  maxRunsPerWindow = MAX_RUNS_PER_WINDOW,
  maxActiveRunsPerUser = MAX_ACTIVE_RUNS_PER_USER,
  maxTrackedUsers = MAX_TRACKED_USERS,
  now = Date.now,
} = {}) {
  const userRuns = new Map();

  function removeExpiredUsers(currentTime) {
    for (const [userId, state] of userRuns) {
      if (state.active === 0 && currentTime - state.lastSeenAt >= windowMs * 2) userRuns.delete(userId);
    }
  }

  return function runtimeLimiter(req, res, next) {
    const userId = req.user?.id || req.user?._id || req.user?.sub;
    if (!userId) return res.status(401).json({ message: 'Sign in before running code.' });

    const currentTime = now();
    const key = String(userId);
    let state = userRuns.get(key);

    if (!state) {
      if (userRuns.size >= maxTrackedUsers) removeExpiredUsers(currentTime);
      if (userRuns.size >= maxTrackedUsers) {
        return res.status(503).json({ message: 'The code runner is temporarily at capacity.' });
      }
      state = { windowStartedAt: currentTime, lastSeenAt: currentTime, count: 0, active: 0 };
      userRuns.set(key, state);
    }

    if (currentTime - state.windowStartedAt >= windowMs) {
      state.windowStartedAt = currentTime;
      state.count = 0;
    }
    state.lastSeenAt = currentTime;

    if (state.active >= maxActiveRunsPerUser) {
      res.set('Retry-After', '2');
      return res.status(429).json({ message: 'Wait for your current program run to finish.' });
    }

    if (state.count >= maxRunsPerWindow) {
      const retryAfter = Math.max(1, Math.ceil((state.windowStartedAt + windowMs - currentTime) / 1000));
      res.set('Retry-After', String(retryAfter));
      return res.status(429).json({ message: 'You have reached the code-run limit. Try again after the short cooldown.' });
    }

    state.count += 1;
    state.active += 1;
    let released = false;
    const release = () => {
      if (released) return;
      released = true;
      state.active = Math.max(0, state.active - 1);
      state.lastSeenAt = now();
    };
    res.once('finish', release);
    res.once('close', release);
    return next();
  };
}

const runtimeLimiter = createRuntimeLimiter();

module.exports = { createRuntimeLimiter, runtimeLimiter };
