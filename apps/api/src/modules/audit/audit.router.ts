import { Router } from 'express';
import { verifyJWT, requireRole } from '../../middleware/auth.middleware.js';
import { auditController } from './audit.controller.js';

export const auditRouter = Router();

// Secure HIPAA audit log inspection endpoint
// super_admin sees global logs; agency_admin is scoped to own organization
auditRouter.get(
  '/logs',
  verifyJWT,
  requireRole('super_admin', 'agency_admin'),
  auditController.getAuditLogs.bind(auditController)
);
