import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { organizationsRouter } from './modules/organizations/organizations.router.js';
import { inquiriesRouter } from './modules/inquiries/inquiries.router.js';
import { caregiversRouter } from './modules/caregivers/caregivers.router.js';
import { auditRouter } from './modules/audit/audit.router.js';
import { documentsRouter } from './modules/documents/documents.router.js';
import { trainingRouter } from './modules/training/training.router.js';
import { clientsRouter } from './modules/clients/clients.router.js';
import { authorizationsRouter } from './modules/authorizations/authorizations.router.js';
import { notificationsRouter } from './modules/notifications/notifications.router.js';
import { esignRouter } from './modules/esign/esign.router.js';
import { adminRouter } from './modules/admin/admin.router.js';
import { authRouter } from './modules/auth/auth.router.js';
import { startAccountLockoutMonitor } from './modules/audit/account-lockout.job.js';
import { startAuthorizationExpirationJob } from './modules/authorizations/authorizations-expiration.job.js';
import { startCredentialExpirationJob } from './modules/documents/credential-expiration.job.js';
import { startNotificationOutboxJob } from './modules/notifications/notifications-outbox.job.js';
import { testDbConnection } from './db/index.js';
import { env } from './config/env.js';
import { errorHandler } from './lib/errors.js';

const app = express();
const PORT = env.PORT;

// Security: HTTP Response Headers
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  })
);

app.use(cors());
app.use(express.json());

// Security: Global Rate Limiting (500 requests per 15 minutes per IP)
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 500,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: 'Too many requests from this IP. Please try again later.',
  },
});
app.use('/api/', globalLimiter);

// Security: Strict Rate Limiting on Authentication & Public Inquiries (25 attempts per 15 mins)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 25,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: 'Too many authentication attempts. Please try again in 15 minutes.',
  },
});
app.use('/api/v1/auth/login', authLimiter);

// Health check endpoint
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'Crystal Unified API (Express.js v5)' });
});

// API v1 Routes
app.use('/api/v1/auth', authRouter);
app.use('/api/v1/organizations', organizationsRouter);
app.use('/api/v1/inquiries', inquiriesRouter);
app.use('/api/v1/caregivers', caregiversRouter);
app.use('/api/v1/audit', auditRouter);
app.use('/api/v1/documents', documentsRouter);
app.use('/api/v1/training', trainingRouter);
app.use('/api/v1/clients', clientsRouter);
app.use('/api/v1/authorizations', authorizationsRouter);
app.use('/api/v1/notifications', notificationsRouter);
app.use('/api/v1/esign', esignRouter);
app.use('/api/v1/admin', adminRouter);

// Express v5 Centralized Error Handler (standardized error envelope & Zod support)
app.use(errorHandler);

export { app };

if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, async () => {
    console.log(`⚡ Crystal Unified API running on http://localhost:${PORT}`);
    await testDbConnection();
    startAccountLockoutMonitor();
    startAuthorizationExpirationJob();
    startCredentialExpirationJob();
    startNotificationOutboxJob();
  });
}

