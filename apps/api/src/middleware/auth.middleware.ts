import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export interface AuthenticatedUser {
  id: string;
  email?: string;
  role?: string;
  org_id?: string;
}

// Extend Express Request interface
declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
    }
  }
}

export function verifyJWT(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({
      success: false,
      error: 'Missing or invalid Bearer authentication token',
    });
    return;
  }

  const token = authHeader.split(' ')[1];
  const jwtSecret = process.env.JWT_SECRET || 'super-secret-jwt-key-change-in-production-12345';

  try {
    const decoded = jwt.verify(token, jwtSecret) as jwt.JwtPayload;
    
    // Supabase JWTs or standard JWTs
    const userId = decoded.sub || (decoded.id as string);
    if (!userId) {
      res.status(401).json({
        success: false,
        error: 'Invalid token payload: missing user id',
      });
      return;
    }

    req.user = {
      id: userId,
      email: decoded.email as string | undefined,
      role: (decoded.app_metadata?.role || decoded.role) as string | undefined,
      org_id: (decoded.app_metadata?.org_id || decoded.org_id) as string | undefined,
    };

    next();
  } catch (_err) {
    res.status(401).json({
      success: false,
      error: 'Missing or invalid Bearer authentication token',
    });
  }
}
