import prisma from '../config/database.js';
import { logger } from '../utils/logger.js';
import { type RateLimitConfig } from '../models/types.js';

export class UserService {
  async getUserProfile(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        fullname: true,
        role: true,
        createdAt: true,
        rateLimits: {
          where: { isActive: true },
          select: {
            id: true,
            algorithm: true,
            maxRequests: true,
            windowMs: true,
            tokens: true,
            queueSize: true,
            createdAt: true,
          },
        },
      },
    });

    return user;
  }

  async updateRateLimitConfig(userId: string, config: RateLimitConfig) {
    try {
      // Deactivate old rate limits for this algorithm
      await prisma.rateLimit.updateMany({
        where: {
          userId,
          algorithm: config.algorithm,
        },
        data: { isActive: false },
      });

      // Create new rate limit configuration
      const rateLimit = await prisma.rateLimit.create({
        data: {
          userId,
          algorithm: config.algorithm,
          maxRequests: config.maxRequests,
          windowMs: config.windowMs,
          tokens: config.maxRequests, // For token bucket
          queueSize: 0, // For leaky bucket
        },
      });

      logger.info(`Rate limit config updated for user ${userId}: ${config.algorithm}`);

      return rateLimit;
    } catch (error) {
      logger.error('Update rate limit config error:', error);
      throw error;
    }
  }

  async getUserApiLogs(userId: string, limit: number = 50) {
    const logs = await prisma.apiLog.findMany({
      where: { userId },
      orderBy: { timestamp: 'desc' },
      take: limit,
      select: {
        id: true,
        endpoint: true,
        method: true,
        statusCode: true,
        rateLimited: true,
        timestamp: true,
      },
    });

    return logs;
  }

  async getRateLimitStats(userId: string) {
    const [totalRequests, rateLimitedRequests] = await Promise.all([
      prisma.apiLog.count({ where: { userId } }),
      prisma.apiLog.count({ where: { userId, rateLimited: true } }),
    ]);

    const rateLimitedPercentage =
      totalRequests > 0 ? ((rateLimitedRequests / totalRequests) * 100).toFixed(2) : '0.00';

    return {
      totalRequests,
      rateLimitedRequests,
      successfulRequests: totalRequests - rateLimitedRequests,
      rateLimitedPercentage: parseFloat(rateLimitedPercentage),
    };
  }
}
