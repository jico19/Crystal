import { Router } from 'express';
import { verifyJWT, optionalJWT, requireRole } from '../../middleware/auth.middleware.js';
import {
  createApplicationDraftController,
  saveDraftStepController,
  submitApplicationController,
  getCaregiverMeController,
  listCaregiversController,
  downloadEmploymentPacketController,
} from './caregivers.controller.js';

export const caregiversRouter = Router();

// GET /api/v1/caregivers/packet/download — Download employment packet
caregiversRouter.get('/packet/download', downloadEmploymentPacketController);

// GET /api/v1/caregivers/me — Retrieve current applicant profile and application status
caregiversRouter.get('/me', verifyJWT, getCaregiverMeController);

// GET /api/v1/caregivers — List caregiver profiles (Admin only)
caregiversRouter.get('/', verifyJWT, requireRole('super_admin', 'agency_admin'), listCaregiversController);

// POST /api/v1/caregivers/application — Create or upsert Step 1 draft profile (Public / optional JWT)
caregiversRouter.post('/application', optionalJWT, createApplicationDraftController);

// PUT /api/v1/caregivers/application/draft — Save step progress (Steps 2, 3, 4)
caregiversRouter.put('/application/draft', verifyJWT, saveDraftStepController);

// POST /api/v1/caregivers/application/submit — Final submission (Step 5 attestation)
caregiversRouter.post('/application/submit', verifyJWT, submitApplicationController);
