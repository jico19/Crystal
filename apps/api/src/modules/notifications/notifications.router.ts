import { Router } from 'express';
import { verifyJWT, requireRole, requireOrg } from '../../middleware/auth.middleware.js';
import { notificationsController } from './notifications.controller.js';

export const notificationsRouter = Router();

// Dispatch / queue a notification
notificationsRouter.post(
  '/dispatch',
  verifyJWT,
  requireOrg,
  notificationsController.dispatchNotification.bind(notificationsController)
);

// Process pending outbox batch
notificationsRouter.post(
  '/process-outbox',
  verifyJWT,
  requireRole('super_admin', 'agency_admin'),
  notificationsController.processOutbox.bind(notificationsController)
);

// User in-app inbox
notificationsRouter.get(
  '/inbox',
  verifyJWT,
  requireOrg,
  notificationsController.getInbox.bind(notificationsController)
);

// Mark in-app notification read
notificationsRouter.patch(
  '/:id/read',
  verifyJWT,
  notificationsController.markAsRead.bind(notificationsController)
);
