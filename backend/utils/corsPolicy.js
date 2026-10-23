function parseOrigins(value) {
  return String(value || '')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);
}

function createCorsOptions(env = process.env) {
  const allowedOrigins = new Set([
    ...parseOrigins(env.FRONTEND_URL),
    ...parseOrigins(env.ALLOWED_ORIGINS),
  ]);

  if (env.NODE_ENV !== 'production') {
    allowedOrigins.add('http://localhost:5173');
    allowedOrigins.add('http://127.0.0.1:5173');
  }

  const isAllowedOrigin = (origin) => !origin || allowedOrigins.has(origin);
  return {
    origin: (origin, callback) => callback(null, isAllowedOrigin(origin)),
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  };
}

module.exports = { createCorsOptions };
