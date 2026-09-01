import { describe, it, expect } from 'vitest';
import { middleware } from '../apps/api/src/middleware';
import { NextRequest } from 'next/server';

describe('API CORS Middleware', () => {
  it('handles OPTIONS preflight request from localhost:3001 with 204 status', () => {
    const req = new NextRequest('http://localhost:3000/api/v1/caregivers/draft', {
      method: 'OPTIONS',
      headers: {
        origin: 'http://localhost:3001',
        'access-control-request-method': 'POST',
      },
    });

    const res = middleware(req);
    expect(res.status).toBe(204);
    expect(res.headers.get('Access-Control-Allow-Origin')).toBe('http://localhost:3001');
    expect(res.headers.get('Access-Control-Allow-Methods')).toContain('POST');
    expect(res.headers.get('Access-Control-Allow-Credentials')).toBe('true');
  });

  it('handles OPTIONS preflight request from Indiana portal (localhost:3002)', () => {
    const req = new NextRequest('http://localhost:3000/api/v1/caregivers/apply', {
      method: 'OPTIONS',
      headers: {
        origin: 'http://localhost:3002',
        'access-control-request-method': 'POST',
      },
    });

    const res = middleware(req);
    expect(res.status).toBe(204);
    expect(res.headers.get('Access-Control-Allow-Origin')).toBe('http://localhost:3002');
  });

  it('attaches CORS headers to normal GET/POST requests', () => {
    const req = new NextRequest('http://localhost:3000/api/v1/caregivers/onboarding-status', {
      method: 'GET',
      headers: {
        origin: 'http://localhost:3001',
      },
    });

    const res = middleware(req);
    expect(res.headers.get('Access-Control-Allow-Origin')).toBe('http://localhost:3001');
    expect(res.headers.get('Access-Control-Allow-Credentials')).toBe('true');
  });
});
