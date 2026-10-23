// Keep production model IDs in one place so challenge and Computer Mode
// validation use the same supported fallback order.
const MODELS = Object.freeze([
  'openai/gpt-oss-120b',
  'openai/gpt-oss-20b',
]);

const getModels = () => [...MODELS];
const getPrimaryModel = () => MODELS[0];

module.exports = { MODELS, getModels, getPrimaryModel };
