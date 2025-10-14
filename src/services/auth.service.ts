import prisma from '../config/database.js';
import { JwtUtil } from '../utils/jwt.js';
import { logger } from '../utils/logger.js';
import { PasswordUtil } from '../utils/password.js';
import { type RegisterDTO, type LoginDTO } from '../models/types.js';

export class AuthService {
  async register(data: RegisterDTO) {
    try {
      //check is user is exists or not
      const existingUser = await prisma.user.findUnique({
        where: { email: data.email },
      });

      if (existingUser) {
        throw new Error('User is already exists');
      }

      //hash password
      const hashedPassword = await PasswordUtil.hash(data.password);

      //create user
      const user = await prisma.user.create({
        data: {
          email: data.email,
          password: hashedPassword,
          fullname: data.fullname,
        },
        select: {
          id: true,
          email: true,
          fullname: true,
          role: true,
          createdAt: true,
        },
      });

      //generate token
      const token = JwtUtil.sign({
        id: user.id,
        email: user.email,
        role: user.role,
      });

      logger.info(`New user registered: ${user.email}`);
      return { user, token };
    } catch (error) {
      logger.error('Registration error:', error);
      throw error;
    }
  }

  async login(data: LoginDTO) {
    try {
      // find user
      const user = await prisma.user.findUnique({
        where: { email: data.email },
      });

      if (!user) {
        throw new Error('Invalid User');
      }

      //verify password
      const isPasswordValid = await PasswordUtil.compare(data.password, user.password);
      if (!isPasswordValid) {
        throw new Error('Invalid Credentials');
      }

      // Generate JWT token
      const token = JwtUtil.sign({
        id: user.id,
        email: user.email,
        role: user.role,
      });

      logger.info(`User logged in: ${user.email}`);
      return {
        user: {
          id: user.id,
          email: user.email,
          fullname: user.fullname,
          role: user.role,
        },
        token,
      };
    } catch (error) {
      logger.error('Login error:', error);
      throw error;
    }
  }

  async getUserById(userId: string) {
    return prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        fullname: true,
        role: true,
        createdAt: true,
      },
    });
  }
}

// prisma.rateLimit.updateMany({
//   where: { userId, algorithm: 'TOKEN_BUCKET' },
//   data: {
//     tokens: this.maxTokens,
//     lastRefill: new Date(),
//   },
// });
