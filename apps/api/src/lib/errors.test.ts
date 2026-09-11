import { describe, it, expect } from 'vitest';
import { AppError } from './errors.js';

describe('AppError', () => {
  it('creates badRequest with 400 status', () => {
    const err = AppError.badRequest('Invalid input data', { email: ['Required'] });
    expect(err.statusCode).toBe(400);
    expect(err.message).toBe('Invalid input data');
    expect(err.fieldErrors).toEqual({ email: ['Required'] });
    expect(err.isOperational).toBe(true);
  });

  it('creates unauthorized with 401 status', () => {
    const err = AppError.unauthorized();
    expect(err.statusCode).toBe(401);
    expect(err.message).toContain('Unauthorized');
  });

  it('creates forbidden with 403 status', () => {
    const err = AppError.forbidden('Access denied to tenant');
    expect(err.statusCode).toBe(403);
    expect(err.message).toBe('Access denied to tenant');
  });

  it('creates notFound with 404 status', () => {
    const err = AppError.notFound('User not found');
    expect(err.statusCode).toBe(404);
    expect(err.message).toBe('User not found');
  });

  it('creates internal error marked non-operational', () => {
    const err = AppError.internal();
    expect(err.statusCode).toBe(500);
    expect(err.isOperational).toBe(false);
  });
});
