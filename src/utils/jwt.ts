import jwt from 'jsonwebtoken';
import { config } from '../config/dotenv.js';

export class JwtUtil {
  static sign(payload: object): string {
    return jwt.sign(payload, config.jwt.secret!, {
      expiresIn: config.jwt.expiresIn,
    } as jwt.SignOptions);
  }

  static verify(token: string): any {
    try {
      return jwt.verify(token, config.jwt.secret!);
    } catch (error) {
      return null;
    }
  }

  static decode(token: string): any {
    return jwt.decode(token);
  }
}
