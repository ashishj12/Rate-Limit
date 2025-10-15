import prisma from '../../config/database.js';
import { logger } from '../../utils/logger.js';
import { type IRateLimiter } from '../../models/types.js';

export class SlidingWindow implements IRateLimiter {
  private maxRequests: number;
  private windowMs: number;

  constructor(maxRequests: number, windowMs: number) {
    ((this.maxRequests = maxRequests), (this.windowMs = windowMs));
  }

  async checkLimit(
    userId: string,
  ): Promise<{ allowed: boolean; remainingTokens?: number; retryAfter?: number }> {
    try {
      const rateLimit = await prisma.rateLimit.findFirst({
        where: { userId, algorithm: 'SLIDING_WINDOW', isActive: true },
      });

      const now = Date.now();
      const windowStart = now - this.windowMs;

      if (!rateLimit) {
        await prisma.rateLimit.create({
          data: {
            userId,
            algorithm: 'SLIDING_WINDOW',
            maxRequests: this.windowMs,
            requestTimestamps: [now],
          },
        });
        return { allowed: true, remainingTokens: this.maxRequests - 1 };
      }

      const timestamps = (rateLimit.requestTimestamps as number[]) || [];
      const validTimestamps = timestamps.filter((ts) => ts > windowStart);

      if (validTimestamps.length < this.maxRequests) {
        validTimestamps.push(now);

        await prisma.rateLimit.update({
          where: { id: rateLimit.id },
          data: {
            requestTimestamps: validTimestamps,
            updatedAt: new Date(),
          },
        });

        return {
          allowed: true,
          remainingTokens: this.maxRequests - validTimestamps.length,
        };
      } else {
        // Reject request - calculate retry after
        const oldestTimestamp = Math.min(...validTimestamps);
        const retryAfter = oldestTimestamp + this.windowMs - now;

        return {
          allowed: false,
          remainingTokens: 0,
          retryAfter: Math.max(retryAfter, 0),
        };
      }
    } catch (error) {
      logger.error('SlidingWindow checkLimit error:', error);
      throw error;
    }
  }

  async resetLimit(userId: string): Promise<void> {
    await prisma.rateLimit.updateMany({
      where: { userId, algorithm: 'SLIDING_WINDOW' },
      data: {
        requestTimestamps: [],
      },
    });
  }
}
