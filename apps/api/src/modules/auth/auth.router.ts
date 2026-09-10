import { Router } from 'express';
import { authController } from './auth.controller.js';

export const authRouter = Router();

// 1. Unified authentication endpoint
authRouter.post('/login', authController.login.bind(authController));

// 2. Discoverable seeded test accounts with preset roles & org bindings
authRouter.get('/test-accounts', authController.getTestAccounts.bind(authController));
