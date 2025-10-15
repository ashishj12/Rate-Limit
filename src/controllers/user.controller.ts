import { type Response } from 'express';
import { type AuthRequest } from '../models/types.js';
import { UserService } from '../services/user.service.js';

const userService = new UserService();

export class UserController {
  async getProfile(req: AuthRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'Not authenticated',
        });
      }

      const profile = await userService.getUserProfile(req.user.id);
      res.status(200).json({
        success: true,
        data: { profile },
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message || 'Failed to get profile',
      });
    }
  }

  async updateRateLimit(req: AuthRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'Not authenticated',
        });
      }

      const { algorithm, maxRequests, windowMs } = req.body;

      // Validation
      if (!algorithm || !maxRequests || !windowMs) {
        return res.status(400).json({
          success: false,
          message: 'algorithm, maxRequests, and windowMs are required',
        });
      }

      if (!['TOKEN_BUCKET', 'SLIDING_WINDOW', 'LEAKY_BUCKET'].includes(algorithm)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid algorithm. Must be TOKEN_BUCKET, SLIDING_WINDOW, or LEAKY_BUCKET',
        });
      }

      const rateLimit = await userService.updateRateLimitConfig(req.user.id, {
        algorithm,
        maxRequests,
        windowMs,
      });

      res.status(200).json({
        success: true,
        message: 'Rate limit configuration updated successfully',
        data: { rateLimit },
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message || 'Failed to update rate limit',
      });
    }
  }

  async getApiLogs(req: AuthRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'Not authenticated',
        });
      }

      const limit = req.query.limit ? parseInt(req.query.limit as string) : 50;

      const logs = await userService.getUserApiLogs(req.user.id, limit);

      res.status(200).json({
        success: true,
        data: { logs },
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message || 'Failed to get API logs',
      });
    }
  }

  async getStats(req: AuthRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'Not authenticated',
        });
      }

      const stats = await userService.getRateLimitStats(req.user.id);

      res.status(200).json({
        success: true,
        data: { stats },
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message || 'Failed to get stats',
      });
    }
  }

  // Protected endpoint to test rate limiting
  async testEndpoint(req: AuthRequest, res: Response) {
    res.status(200).json({
      success: true,
      message: 'Request successful! Rate limiter is working.',
      timestamp: new Date().toISOString(),
      user: req.user?.email,
    });
  }
}
