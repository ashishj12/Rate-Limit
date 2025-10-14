import dotenv from 'dotenv';
dotenv.config();

if (!process.env.JWT_SECRET) {
  throw new Error('Missing JWT_SECRET environment variable');
}

export const config = {
  port: process.env.PORT || 8080,
  nodeEnv: process.env.NODE_ENV || 'development',

  jwt: {
    secret: process.env.JWT_SECRET,
    expiresIn: process.env.JWT_EXPIRES_IN || '1h',
  },

  rateLimiter: {
    defaultAlgorithm: process.env.DEFAULT_RATE_LIMIT_ALGORITHM || 'token_bucket',
    defaultMaxRequests: parseInt(process.env.DEFAULT_MAX_REQUESTS || '100'),
    defaultWindowMs: parseInt(process.env.DEFAULT_WINDOW_SIZE_MS || '60000'),
  },

  database: {
    url: process.env.DATABASE_URL,
  },
};
