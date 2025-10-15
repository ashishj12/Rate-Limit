import { type Response, type NextFunction } from 'express';
import { type AuthRequest } from '../models/types.js';
import { RateLimiterFactory } from '../services/rateLimiter/RateLimiterFactory.js';
import prisma from '../config/database.js';
import { logger } from '../utils/logger.js';
import { config } from '../config/dotenv.js';

export const rateLimiter = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required for rate limiting',
      });
    }

    const userId = req.user.id;

    // Get user's rate limit configuration
    let rateLimitConfig = await prisma.rateLimit.findFirst({
      where: { userId, isActive: true },
    });

    // If no config exists, create default one
    if (!rateLimitConfig) {
      rateLimitConfig = await prisma.rateLimit.create({
        data: {
          userId,
          algorithm: 'TOKEN_BUCKET',
          maxRequests: config.rateLimiter.defaultMaxRequests,
          windowMs: config.rateLimiter.defaultWindowMs,
          tokens: config.rateLimiter.defaultMaxRequests,
        },
      });
    }

    // Create rate limiter instance based on algorithm
    const limiter = RateLimiterFactory.create(
      rateLimitConfig.algorithm,
      rateLimitConfig.maxRequests,
      rateLimitConfig.windowMs
    );

    // Check if request is allowed
    const result = await limiter.checkLimit(userId);

    // Log the API request
    await prisma.apiLog.create({
      data: {
        userId,
        endpoint: req.path,
        method: req.method,
        statusCode: result.allowed ? 200 : 429,
        rateLimited: !result.allowed,
      },
    });

    if (!result.allowed) {
      logger.warn(`Rate limit exceeded for user ${userId} on ${req.method} ${req.path}`);
      
      return res.status(429).json({
        success: false,
        message: 'Rate limit exceeded. Please try again later.',
        retryAfter: result.retryAfter,
        remainingRequests: 0,
      });
    }

    // Add rate limit info to response headers
    res.setHeader('X-RateLimit-Limit', rateLimitConfig.maxRequests);
    res.setHeader('X-RateLimit-Remaining', result.remainingTokens || 0);
    res.setHeader('X-RateLimit-Algorithm', rateLimitConfig.algorithm);

    next();
  } catch (error) {
    logger.error('Rate limiter middleware error:', error);
    // On error, allow the request but log it
    next();
  }
};