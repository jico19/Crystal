import type { Request, Response, NextFunction } from 'express';
import { authService } from './auth.service.js';
import { env } from '../../config/env.js';
import { AppError } from '../../lib/errors.js';

export class AuthController {
  async login(req: Request, res: Response, next: NextFunction): Promise<void> {
    const { email, password } = req.body;
    if (!email) {
      res.status(400).json({ success: false, error: 'Email is required' });
      return;
    }
    if (!password) {
      res.status(400).json({ success: false, error: 'Password is required' });
      return;
    }

    const ipAddress = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress;

    try {
      const result = await authService.login(email, password, ipAddress);
      res.json({
        success: true,
        data: result,
      });
    } catch (err) {
      next(err);
    }
  }

  async getTestAccounts(_req: Request, res: Response, next: NextFunction): Promise<void> {
    if (env.NODE_ENV === 'production') {
      next(AppError.notFound('Endpoint not available in production'));
      return;
    }

    try {
      const accounts = await authService.listTestAccounts();
      res.json({
        success: true,
        data: {
          accounts,
          defaultPassword: 'Password123!',
        },
      });
    } catch (err) {
      next(err);
    }
  }
}

export const authController = new AuthController();

