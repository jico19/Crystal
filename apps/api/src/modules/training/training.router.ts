import { Router } from 'express';
import { verifyJWT } from '../../middleware/auth.middleware.js';
import { trainingController } from './training.controller.js';

export const trainingRouter = Router();

// 1. Course catalog with caregiver progress
trainingRouter.get(
  '/modules',
  verifyJWT,
  trainingController.listModules.bind(trainingController)
);

// 2. Anti-skip video watch progress update
trainingRouter.post(
  '/progress',
  verifyJWT,
  trainingController.updateVideoProgress.bind(trainingController)
);

// 3. Submit quiz answers & grade
trainingRouter.post(
  '/quiz/submit',
  verifyJWT,
  trainingController.submitQuiz.bind(trainingController)
);

// 4. View verified certificate
trainingRouter.get(
  '/certificates/:id',
  verifyJWT,
  trainingController.getCertificate.bind(trainingController)
);
