import { Router } from 'express';
import { verifyJWT, requireRole } from '../../middleware/auth.middleware.js';
import { adminController } from './admin.controller.js';

export const adminRouter = Router();

// Multi-state or state-filtered KPI metrics
adminRouter.get(
  '/kpis',
  verifyJWT,
  requireRole('super_admin', 'agency_admin'),
  adminController.getKpis.bind(adminController)
);

// State survey audit packet export (CSV stream)
adminRouter.get(
  '/export/audit-packet',
  verifyJWT,
  requireRole('super_admin', 'agency_admin'),
  adminController.exportAuditPacket.bind(adminController)
);

// Reports & Analytics Endpoints (Scope 4)
adminRouter.get(
  '/reports/referral-sources',
  verifyJWT,
  requireRole('super_admin', 'agency_admin'),
  adminController.getReferralSourcesReport.bind(adminController)
);

adminRouter.get(
  '/reports/training-compliance',
  verifyJWT,
  requireRole('super_admin', 'agency_admin'),
  adminController.getTrainingComplianceReport.bind(adminController)
);

adminRouter.get(
  '/reports/authorizations',
  verifyJWT,
  requireRole('super_admin', 'agency_admin'),
  adminController.getAuthorizationsSummaryReport.bind(adminController)
);
