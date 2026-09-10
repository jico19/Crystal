import { Router } from 'express';
import { verifyJWT, requireRole, requireOrg } from '../../middleware/auth.middleware.js';
import { clientsController } from './clients.controller.js';
import { authorizationsController } from '../authorizations/authorizations.controller.js';

export const clientsRouter = Router();

// Create new client intake
clientsRouter.post(
  '/',
  verifyJWT,
  requireOrg,
  requireRole('super_admin', 'agency_admin', 'care_coordinator', 'registered_nurse'),
  clientsController.createClient.bind(clientsController)
);

// List clients with status/search filter
clientsRouter.get(
  '/',
  verifyJWT,
  requireOrg,
  clientsController.listClients.bind(clientsController)
);

// Get client by ID (logs HIPAA PHI access)
clientsRouter.get(
  '/:id',
  verifyJWT,
  requireOrg,
  clientsController.getClientById.bind(clientsController)
);

// Update client lifecycle status
clientsRouter.patch(
  '/:id/status',
  verifyJWT,
  requireOrg,
  requireRole('super_admin', 'agency_admin', 'care_coordinator'),
  clientsController.updateStatus.bind(clientsController)
);

// Upload clinical document for client
clientsRouter.post(
  '/:id/documents',
  verifyJWT,
  requireOrg,
  clientsController.uploadDocument.bind(clientsController)
);

// List clinical documents for client
clientsRouter.get(
  '/:id/documents',
  verifyJWT,
  requireOrg,
  clientsController.listDocuments.bind(clientsController)
);

// Client Prior Authorizations (Spec 06)
clientsRouter.post(
  '/:id/authorizations',
  verifyJWT,
  requireOrg,
  requireRole('super_admin', 'agency_admin', 'care_coordinator'),
  authorizationsController.createClientAuthorization.bind(authorizationsController)
);

clientsRouter.get(
  '/:id/authorizations',
  verifyJWT,
  requireOrg,
  authorizationsController.getClientAuthorizations.bind(authorizationsController)
);

// Download Admission & Service Agreement Packet
clientsRouter.get('/packet/download', clientsController.downloadAdmissionPacket.bind(clientsController));

// Client Visit Schedules
clientsRouter.get('/:id/schedules', clientsController.getSchedules.bind(clientsController));
clientsRouter.post(
  '/:id/schedules',
  verifyJWT,
  requireOrg,
  requireRole('super_admin', 'agency_admin', 'care_coordinator'),
  clientsController.createSchedule.bind(clientsController)
);

