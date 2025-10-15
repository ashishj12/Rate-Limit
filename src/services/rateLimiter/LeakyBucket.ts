import prisma from '../../config/database.js';
import { type IRateLimiter } from '../../models/types.js';
import { logger } from '../../utils/logger.js';

export class LeakyBucket implements IRateLimiter {
  private capacity: number;
  private leakRate: number; 
  private windowMs: number;

  constructor(maxRequests: number, windowMs: number) {
    this.capacity = maxRequests;
    this.windowMs = windowMs;
    this.leakRate = maxRequests / (windowMs / 1000); 
  }

  async checkLimit(
    userId: string,
  ): Promise<{ allowed: boolean; remainingTokens?: number; retryAfter?: number }> {
    try {
      const rateLimit = await prisma.rateLimit.findFirst({
        where: { userId, algorithm: 'LEAKY_BUCKET', isActive: true },
      });

      const now = new Date();

      if (!rateLimit) {
        // Create new rate limit
        await prisma.rateLimit.create({
          data: {
            userId,
            algorithm: 'LEAKY_BUCKET',
            maxRequests: this.capacity,
            windowMs: this.windowMs,
            queueSize: 1, 
            lastLeak: now,
          },
        });
        return { allowed: true, remainingTokens: this.capacity - 1 };
      }

      // Calculate how many requests have leaked since last check
      const timeSinceLastLeak = now.getTime() - rateLimit.lastLeak.getTime();
      const leakedRequests = (timeSinceLastLeak / 1000) * this.leakRate;

      // Calculate current queue size after leaking
      let currentQueueSize = Math.max(0, rateLimit.queueSize - leakedRequests);

      if (currentQueueSize < this.capacity) {
        // Bucket has space, add request
        currentQueueSize += 1;

        await prisma.rateLimit.update({
          where: { id: rateLimit.id },
          data: {
            queueSize: currentQueueSize,
            lastLeak: now,
          },
        });

        return {
          allowed: true,
          remainingTokens: Math.floor(this.capacity - currentQueueSize),
        };
      } else {
        // Bucket is full, calculate retry after
        const requestsToLeak = currentQueueSize - this.capacity + 1;
        const retryAfter = Math.ceil((requestsToLeak / this.leakRate) * 1000);

        return {
          allowed: false,
          remainingTokens: 0,
          retryAfter,
        };
      }
    } catch (error) {
      logger.error('LeakyBucket checkLimit error:', error);
      throw error;
    }
  }

  async resetLimit(userId: string): Promise<void> {
    await prisma.rateLimit.updateMany({
      where: { userId, algorithm: 'LEAKY_BUCKET' },
      data: {
        queueSize: 0,
        lastLeak: new Date(),
      },
    });
  }
}
