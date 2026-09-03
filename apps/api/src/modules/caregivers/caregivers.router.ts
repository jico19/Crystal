import { Router } from 'express';
import { verifyJWT } from '../../middleware/auth.middleware.js';
import {
  createApplicationDraftController,
  saveDraftStepController,
  submitApplicationController,
} from './caregivers.controller.js';

export const caregiversRouter = Router();

// POST /api/v1/caregivers/application — Create or upsert Step 1 draft profile
caregiversRouter.post('/application', verifyJWT, createApplicationDraftController);

// PUT /api/v1/caregivers/application/draft — Save step progress (Steps 2, 3, 4)
caregiversRouter.put('/application/draft', verifyJWT, saveDraftStepController);

// POST /api/v1/caregivers/application/submit — Final submission (Step 5 attestation)
caregiversRouter.post('/application/submit', verifyJWT, submitApplicationController);
