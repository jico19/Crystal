import { Router } from 'express';
import { verifyJWT, requireRole, requireOrg } from '../../middleware/auth.middleware.js';
import { esignController } from './esign.controller.js';

export const esignRouter = Router();

// Create new electronic signature envelope
esignRouter.post(
  '/envelopes',
  verifyJWT,
  requireOrg,
  requireRole('super_admin', 'agency_admin', 'care_coordinator', 'registered_nurse'),
  esignController.createEnvelope.bind(esignController)
);

// Get envelope details / signing status
esignRouter.get(
  '/envelopes/:id',
  esignController.getEnvelope.bind(esignController)
);

// Submit electronic signature (Signer action)
esignRouter.post(
  '/envelopes/:id/sign',
  esignController.signEnvelope.bind(esignController)
);

// Provider webhook receiver (DocuSign/SignWell/provider)
esignRouter.post(
  '/webhooks/:provider',
  esignController.handleWebhook.bind(esignController)
);
