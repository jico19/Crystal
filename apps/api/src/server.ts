import express from 'express';
import cors from 'cors';
import { organizationsRouter } from './modules/organizations/organizations.router.js';
import { inquiriesRouter } from './modules/inquiries/inquiries.router.js';
import { caregiversRouter } from './modules/caregivers/caregivers.router.js';
import { testDbConnection } from './db/index.js';

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

// Health check endpoint
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'Crystal Unified API (Express.js v5)' });
});

// API v1 Routes
app.use('/api/v1/organizations', organizationsRouter);
app.use('/api/v1/inquiries', inquiriesRouter);
app.use('/api/v1/caregivers', caregiversRouter);

// Express v5 Centralized Error Handler (native async/await error propagation)
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('[Unhandled Express Error]', err);
  res.status(500).json({
    success: false,
    error: 'Internal server error. Please try again later.',
  });
});

app.listen(PORT, async () => {
  console.log(`⚡ Crystal Unified API running on http://localhost:${PORT}`);
  await testDbConnection();
});
