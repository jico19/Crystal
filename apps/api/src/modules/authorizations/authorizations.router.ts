import { Router } from 'express';
import { verifyJWT, requireRole, requireOrg } from '../../middleware/auth.middleware.js';
import { authorizationsController } from './authorizations.controller.js';

export const authorizationsRouter = Router();

// Roster of authorizations across organization
authorizationsRouter.get(
  '/',
  verifyJWT,
  requireOrg,
  authorizationsController.listAuthorizations.bind(authorizationsController)
);

// Get burndown metrics for a specific authorization
authorizationsRouter.get(
  '/:id/burndown',
  verifyJWT,
  requireOrg,
  authorizationsController.getBurndown.bind(authorizationsController)
);

// Burn-down unit deduction
authorizationsRouter.patch(
  '/:id/units',
  verifyJWT,
  requireOrg,
  requireRole('super_admin', 'agency_admin', 'care_coordinator', 'registered_nurse'),
  authorizationsController.updateUnits.bind(authorizationsController)
);

// Maintenance / cron route for expiration check
authorizationsRouter.post(
  '/expire-check',
  verifyJWT,
  requireRole('super_admin', 'agency_admin'),
  authorizationsController.triggerExpirationCheck.bind(authorizationsController)
);
