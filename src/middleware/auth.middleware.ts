import { type Response, type NextFunction } from 'express';
import { JwtUtil } from '../utils/jwt.js';
import { type AuthRequest } from '../models/types.js';
import { logger } from '../utils/logger.js';

export const authenticate = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    //token from header
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({
        success: false,
        message: 'No Token Provided',
      });
    }

    //verify token
    const token = authHeader.substring(7);
    const decoded = JwtUtil.verify(token);
    if (!decoded) {
      return res.status(401).json({
        success: false,
        message: 'Invalid or expired token. Please login again.',
      });
    }

    //user info to request
    req.user = {
      id: decoded.id,
      email: decoded.email,
      role: decoded.role,
    };
    next();
  } catch (error) {
    logger.error('Authentication error :', error);
    return res.status(401).json({
      success: false,
      message: 'Authentication Failed',
    });
  }
};

//authorization
export const authorize = (...roles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required',
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to perform this action',
      });
    }
    next();
  };
};
