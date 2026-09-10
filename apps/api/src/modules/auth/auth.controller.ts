import type { Request, Response } from 'express';
import { authService } from './auth.service.js';

export class AuthController {
  async login(req: Request, res: Response): Promise<void> {
    const { email, password } = req.body;
    if (!email) {
      res.status(400).json({ success: false, error: 'Email is required' });
      return;
    }

    const ipAddress = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress;

    try {
      const result = await authService.login(email, password, ipAddress);
      res.json({
        success: true,
        data: result,
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      res.status(401).json({ success: false, error: msg });
    }
  }

  async getTestAccounts(_req: Request, res: Response): Promise<void> {
    try {
      const accounts = await authService.listTestAccounts();
      res.json({
        success: true,
        data: {
          accounts,
          defaultPassword: 'Password123!',
        },
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      res.status(500).json({ success: false, error: msg });
    }
  }
}

export const authController = new AuthController();
