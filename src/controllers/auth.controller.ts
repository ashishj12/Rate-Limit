import { type Request, type Response } from 'express';
import { validationResult } from 'express-validator';
import { AuthService } from '../services/auth.service.js';
import { type AuthRequest } from '../models/types.js';

const authService = new AuthService();

export class AuthController {
  async register(req: Request, res: Response) {
    try {
      //check validations
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation Failed',
          errors: errors.array(),
        });
      }

      const { email, password, fullname,role,adminKey } = req.body;
      const result = await authService.register({ email, password, fullname,role,adminKey });

      res.status(201).json({
        success: true,
        message: 'User registered successfully',
        data: result,
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message || 'Registration failed',
      });
    }
  }
  // Login user
  async login(req: Request, res: Response) {
    try {
      // Check validation errors
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array(),
        });
      }

      const { email, password } = req.body;
      const result = await authService.login({ email, password });

      res.status(200).json({
        success: true,
        message: 'Login successful',
        data: result,
      });
    } catch (error: any) {
      res.status(401).json({
        success: false,
        message: error.message || 'Login failed',
      });
    }
  }

  async getMe(req: AuthRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'Not authenticated',
        });
      }

      const user = await authService.getUserById(req.user.id);
      res.status(200).json({
        success: true,
        data: { user },
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message || 'Failed to get user data',
      });
    }
  }
}
