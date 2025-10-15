import { type Response } from 'express';
import { type AuthRequest } from '../models/types.js';
import prisma from '../config/database.js';

export class AdminController {
  async getAllUsers(req: AuthRequest, res: Response) {
    try {
      const users = await prisma.user.findMany({
        select: {
          id: true,
          email: true,
          fullname: true,
          role: true,
          createdAt: true,
          _count: {
            select: {
              rateLimits: true,
              apiLogs: true,
            },
          },
        },
      });

      res.status(200).json({
        success: true,
        data: { users, count: users.length },
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message || 'Failed to get users',
      });
    }
  }

  async getUserDetails(req: AuthRequest, res: Response) {
    try {
      const { userId } = req.params;

      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: {
          rateLimits: {
            where: { isActive: true },
          },
          apiLogs: {
            take: 20,
            orderBy: { timestamp: 'desc' },
          },
        },
      });

      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found',
        });
      }

      res.status(200).json({
        success: true,
        data: { user },
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message || 'Failed to get user details',
      });
    }
  }

  async resetUserRateLimit(req: AuthRequest, res: Response) {
    try {
      const { userId } = req.params;

      if (!userId) {
        return res.status(400).json({
          success: false,
          message: 'User ID is required',
        });
      }

      await prisma.rateLimit.updateMany({
        where: { userId: userId },
        data: {
          tokens: 100,
          queueSize: 0,
          requestTimestamps: [],
          lastRefill: new Date(),
          lastLeak: new Date(),
        },
      });

      res.status(200).json({
        success: true,
        message: 'User rate limit reset successfully',
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message || 'Failed to reset rate limit',
      });
    }
  }
}
