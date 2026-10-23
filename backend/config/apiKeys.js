// API Keys Configuration for Load Balancing
//
// HOW TO ADD KEYS:
//   In your .env (local) or Render dashboard (production), set ONE variable:
//
//   GROQ_API_KEYS=gsk_key1,gsk_key2,gsk_key3,...
//
//   Just keep appending comma-separated keys — no code changes ever needed.
//   Supports unlimited keys.

/**
 * Load all keys from the single GROQ_API_KEYS comma-separated env variable.
 */
const loadSharedKeys = () => {
  const raw = process.env.GROQ_API_KEYS || '';
  return raw
    .split(',')
    .map((k) => k.trim())
    .filter(Boolean);
};

const SHARED_API_KEYS = loadSharedKeys();
const { MODELS, getModels, getPrimaryModel } = require('./groqModels');

if (SHARED_API_KEYS.length === 0) {
  console.warn('[apiKeys] WARNING: No keys found in GROQ_API_KEYS env variable.');
} else {
  console.log(`[apiKeys] Loaded ${SHARED_API_KEYS.length} API key(s) from GROQ_API_KEYS.`);
}

// Round-robin counters per course (for logging/tracking only)
const usageCount = {};

/**
 * Get the next API key in round-robin rotation.
 * @param {string} course - Course name (for logging)
 * @returns {string|null}
 */
const getApiKey = (course) => {
  if (SHARED_API_KEYS.length === 0) {
    console.error('[apiKeys] No keys configured in GROQ_API_KEYS.');
    return null;
  }
  if (!usageCount[course]) usageCount[course] = 0;
  const index = usageCount[course] % SHARED_API_KEYS.length;
  usageCount[course]++;
  console.log(`[API Key] Course: ${course}, key #${index + 1}/${SHARED_API_KEYS.length}`);
  return SHARED_API_KEYS[index];
};

/**
 * Get all API keys.
 * @returns {string[]}
 */
const getAllApiKeys = () => [...SHARED_API_KEYS];

/** @returns {string[]} */
/**
 * Try an API call with automatic fallback across all keys and models.
 * On rate-limit (429) or any error, moves to the next model then next key.
 *
 * @param {string} course - Course name (for logging)
 * @param {Function} apiCallFn - async (apiKey: string, model: string) => result
 * @returns {Promise<any>}
 */
const tryWithFallback = async (course, apiCallFn) => {
  if (SHARED_API_KEYS.length === 0) {
    throw new Error(
      'No API keys configured. Set GROQ_API_KEYS in your .env or Render environment variables.'
    );
  }

  for (let ki = 0; ki < SHARED_API_KEYS.length; ki++) {
    const apiKey = SHARED_API_KEYS[ki];

    for (let mi = 0; mi < MODELS.length; mi++) {
      const model = MODELS[mi];

      try {
        console.log(`[Attempt] Course: ${course}, key #${ki + 1}/${SHARED_API_KEYS.length}, model: ${model}`);
        const result = await apiCallFn(apiKey, model);
        console.log(`[Success] Course: ${course}, key #${ki + 1}, model: ${model}`);
        return result;
      } catch (error) {
        const isRateLimit =
          error.response?.status === 429 ||
          error.message?.includes('rate limit') ||
          error.message?.includes('429');

        if (isRateLimit) {
          console.log(`[Rate Limit] key #${ki + 1}, model: ${model} — trying next...`);
        } else {
          console.error(`[Error] key #${ki + 1}, model: ${model}:`, error.message);
        }
        // continue to next model / key
      }
    }
  }

  throw new Error(
    `All ${SHARED_API_KEYS.length} key(s) and ${MODELS.length} model(s) exhausted for course: ${course}. Try again later.`
  );
};

/** @returns {boolean} */
const hasApiKeys = () => SHARED_API_KEYS.length > 0;

/** @returns {number} */
const getApiKeyCount = () => SHARED_API_KEYS.length;

module.exports = {
  getApiKey,
  getAllApiKeys,
  getModels,
  getPrimaryModel,
  tryWithFallback,
  hasApiKeys,
  getApiKeyCount,
};
