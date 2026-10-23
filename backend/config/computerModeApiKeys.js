// Computer Mode API Keys Configuration
//
// HOW TO ADD KEYS:
//   In your .env (local) or Render dashboard (production), set ONE variable:
//
//   GROQ_API_KEYS=gsk_key1,gsk_key2,gsk_key3,...
//
//   Shared with apiKeys.js — one pool for everything.
//   Supports unlimited keys. No code changes needed when adding more.

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
  console.warn('[computerModeApiKeys] WARNING: No keys found in GROQ_API_KEYS env variable.');
} else {
  console.log(`[computerModeApiKeys] Loaded ${SHARED_API_KEYS.length} API key(s) from GROQ_API_KEYS.`);
}

let validationUsageCount = 0;
let challengeUsageCount = 0;

/**
 * Get API key for code validation using round-robin.
 * @returns {string|null}
 */
const getValidationApiKey = () => {
  if (SHARED_API_KEYS.length === 0) {
    console.error('[computerModeApiKeys] No keys configured in GROQ_API_KEYS.');
    return null;
  }
  const index = validationUsageCount % SHARED_API_KEYS.length;
  validationUsageCount++;
  console.log(`[Validation API Key] key #${index + 1}/${SHARED_API_KEYS.length}`);
  return SHARED_API_KEYS[index];
};

/**
 * Get API key for challenge generation using round-robin.
 * @returns {string|null}
 */
const getChallengeApiKey = () => {
  if (SHARED_API_KEYS.length === 0) {
    console.error('[computerModeApiKeys] No keys configured in GROQ_API_KEYS.');
    return null;
  }
  const index = challengeUsageCount % SHARED_API_KEYS.length;
  challengeUsageCount++;
  console.log(`[Challenge API Key] key #${index + 1}/${SHARED_API_KEYS.length}`);
  return SHARED_API_KEYS[index];
};

/**
 * Try an API call with automatic fallback across all keys and models.
 *
 * @param {string} type - 'validation' or 'challenge' (for logging)
 * @param {Function} apiCallFn - async (apiKey: string, model: string) => result
 * @returns {Promise<any>}
 */
const tryWithFallback = async (type, apiCallFn) => {
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
        console.log(`[Attempt] Type: ${type}, key #${ki + 1}/${SHARED_API_KEYS.length}, model: ${model}`);
        const result = await apiCallFn(apiKey, model);
        console.log(`[Success] Type: ${type}, key #${ki + 1}, model: ${model}`);
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
          if (ki === SHARED_API_KEYS.length - 1 && mi === MODELS.length - 1) {
            throw error;
          }
        }
        // continue to next model / key
      }
    }
  }

  throw new Error(
    `All ${SHARED_API_KEYS.length} key(s) and ${MODELS.length} model(s) exhausted for ${type}. Try again later.`
  );
};

/** @returns {string[]} */
/**
 * Get API key stats.
 * @returns {{ validation: object, challenge: object, models: number }}
 */
const getApiKeyStats = () => ({
  validation: { count: SHARED_API_KEYS.length, usage: validationUsageCount },
  challenge:  { count: SHARED_API_KEYS.length, usage: challengeUsageCount },
  models: MODELS.length,
});

module.exports = {
  getValidationApiKey,
  getChallengeApiKey,
  tryWithFallback,
  getModels,
  getPrimaryModel,
  getApiKeyStats,
  MODELS,
};
