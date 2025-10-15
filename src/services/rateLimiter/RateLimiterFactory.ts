import { type IRateLimiter } from '../../models/types.js';
import { TokenBucket } from './TokenBucket.js';
import { SlidingWindow } from './SlidingWindows.js';
import { LeakyBucket } from './LeakyBucket.js';

/**
 * Factory Pattern to create rate limiter instances
 * Makes it easy to switch between different algorithms
 */
export class RateLimiterFactory {
  static create(
    algorithm: 'TOKEN_BUCKET' | 'SLIDING_WINDOW' | 'LEAKY_BUCKET',
    maxRequests: number,
    windowMs: number,
  ): IRateLimiter {
    switch (algorithm) {
      case 'TOKEN_BUCKET':
        return new TokenBucket(maxRequests, windowMs);
      case 'SLIDING_WINDOW':
        return new SlidingWindow(maxRequests, windowMs);
      case 'LEAKY_BUCKET':
        return new LeakyBucket(maxRequests, windowMs);
      default:
        throw new Error(`Unknown rate limit algorithm: ${algorithm}`);
    }
  }
}
