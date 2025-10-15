import prisma from '../../config/database.js';
import { logger } from '../../utils/logger.js';
import { type IRateLimiter } from '../../models/types.js';

export class TokenBucket implements IRateLimiter {
  private maxTokens: number;
  private refillRate: number;
  private windowsMs: number;

  constructor(maxRequests: number, windowMs: number) {
    this.maxTokens = maxRequests;
    this.windowsMs = windowMs;
    this.refillRate = maxRequests / (windowMs / 1000);
  }

  async checkLimit(
    userId: string,
  ): Promise<{ allowed: boolean; remainingTokens?: number; retryAfter?: number }> {
    try {
      const rateLimit = await prisma.rateLimit.findFirst({
        where: { userId, algorithm: 'TOKEN_BUCKET', isActive: true },
      });

      if (!rateLimit) {
        await prisma.rateLimit.create({
          data: {
            userId,
            algorithm: 'TOKEN_BUCKET',
            maxRequests: this.windowsMs,
            windowMs: this.windowsMs,
            tokens: this.maxTokens - 1,
            lastRefill: new Date(),
          },
        });
        return { allowed: true, remainingTokens: this.maxTokens - 1 };
      }

      //calculate tokens to add based on time elaspsed

      const now = new Date();
      const timeSinceLastRefill = now.getTime() - rateLimit.lastRefill.getTime();
      const tokensToAdd = (timeSinceLastRefill / 1000) * this.refillRate;

      let currentTokens = Math.min(rateLimit.tokens + tokensToAdd, this.maxTokens);

      if (currentTokens >= 1) {
        currentTokens -= 1;

        await prisma.rateLimit.update({
          where: { id: rateLimit.id },
          data: {
            tokens: currentTokens,
            lastRefill: now,
          },
        });
        return { allowed: true, remainingTokens: Math.floor(currentTokens) };
      } else {
        //not enough tokens, calulate retry after
        const tokensNeeded = 1 - currentTokens;
        const retryAfter = Math.ceil((tokensNeeded / this.refillRate) * 1000);

        return { allowed: false, remainingTokens: 0, retryAfter };
      }
    } catch (error) {
      logger.error('TokenBucket checkLimit error:', error);
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
