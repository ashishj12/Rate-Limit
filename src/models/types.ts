import type { Request } from 'express';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: string;
  };
}

export interface RegisterDTO {
  //DTO -> Data Transfer Object
  email: string;
  password: string;
  fullname: string;
}

export interface LoginDTO {
  email: string;
  password: string;
}

export interface RateLimitConfig {
  algorithm: 'TOKEN_BUCKET' | 'SLIDING_WINDOW' | 'LEAKY_BUCKET';
  maxRequests: number;
  windowMs: number;
}

export interface IRateLimiter {
  checkLimit(
    userId: string,
  ): Promise<{ allowed: boolean; remainingTokens?: number; retryAfter?: number }>;
  resetLimit(userId: string): Promise<void>;
}

export interface TokenBucketState {
  tokens: number;
  lastRefill: Date;
}

export interface SlidingWindowState {
  requestTimestamps: number[];
}

export interface LeakyBucketState {
  queueSize: number;
  lastLeak: Date;
}
