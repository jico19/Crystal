import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { app } from './server.js';

describe('API Server Integration Tests', () => {
  it('GET /health returns 200 ok status', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      status: 'ok',
      service: 'Crystal Unified API (Express.js v5)',
    });
  });

  it('GET /api/v1/organizations/by-domain without domain returns 400 bad request', async () => {
    const res = await request(app).get('/api/v1/organizations/by-domain');
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error).toContain('domain query parameter is required');
  });

  it('GET /api/v1/training/modules without auth returns 401 unauthorized', async () => {
    const res = await request(app).get('/api/v1/training/modules');
    expect(res.status).toBe(401);
  });
});
