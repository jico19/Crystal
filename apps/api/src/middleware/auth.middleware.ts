import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import type { UserRole, AuthenticatedUser } from '@crystal/types';
import { env } from '../config/env.js';

export type { AuthenticatedUser };

// Extend Express Request interface
declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
      orgId?: string;
    }
  }
}

/**
 * Validates the cryptographic signature of the Bearer JWT token
 * and extracts user identity into req.user
 */
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
  const jwtSecret = env.JWT_SECRET;

  try {
    const decoded = jwt.verify(token, jwtSecret) as jwt.JwtPayload;

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
      role: (decoded.app_metadata?.role || decoded.role) as UserRole | undefined,
      org_id: (decoded.app_metadata?.org_id || decoded.org_id) as string | undefined,
    };
    req.orgId = req.user.org_id;

    next();
  } catch (_err) {
    res.status(401).json({
      success: false,
      error: 'Missing or invalid Bearer authentication token',
    });
  }
}

/**
 * Enforces Role-Based Access Control (RBAC).
 * super_admin automatically satisfies all role checks.
 */
export function requireRole(...allowedRoles: UserRole[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: 'Authentication required before role verification',
      });
      return;
    }

    const userRole = req.user.role;

    // Super admin has global bypass permissions across all state domains
    if (userRole === 'super_admin') {
      next();
      return;
    }

    if (!userRole || !allowedRoles.includes(userRole)) {
      res.status(403).json({
        success: false,
        error: `Forbidden: User role [${userRole || 'unassigned'}] lacks required permissions (${allowedRoles.join(', ')})`,
      });
      return;
    }

    next();
  };
}

/**
 * Enforces organization boundary isolation.
 * Requires that req.user has an org_id assigned (unless user is super_admin).
 */
export function requireOrg(req: Request, res: Response, next: NextFunction): void {
  if (!req.user) {
    res.status(401).json({
      success: false,
      error: 'Authentication required',
    });
    return;
  }

  // Super admin can operate without an explicit org_id or override via query
  if (req.user.role === 'super_admin') {
    req.orgId = (req.query.org_id as string) || (req.headers['x-org-id'] as string) || req.user.org_id;
    next();
    return;
  }

  if (!req.user.org_id) {
    res.status(400).json({
      success: false,
      error: 'Bad Request: User profile is not bound to a valid organization tenant',
    });
    return;
  }

  req.orgId = req.user.org_id;
  next();
};

/**
 * Optional JWT validation: extracts user identity if valid Bearer token provided,
 * but allows unauthenticated public requests to proceed without error.
 */
export function optionalJWT(req: Request, _res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    next();
    return;
  }

  const token = authHeader.split(' ')[1];
  if (!token || token === 'dev-applicant-token') {
    next();
    return;
  }

  const jwtSecret = env.JWT_SECRET;

  try {
    const decoded = jwt.verify(token, jwtSecret) as jwt.JwtPayload;
    const userId = decoded.sub || (decoded.id as string);
    if (userId) {
      req.user = {
        id: userId,
        email: decoded.email as string | undefined,
        role: (decoded.app_metadata?.role || decoded.role) as UserRole | undefined,
        org_id: (decoded.app_metadata?.org_id || decoded.org_id) as string | undefined,
      };
      req.orgId = req.user.org_id;
    }
  } catch {
    // Ignore invalid/expired token for optional endpoints
  }

  next();
}
