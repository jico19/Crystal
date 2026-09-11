import type { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';

export class AppError extends Error {
  public readonly statusCode: number;
  public readonly fieldErrors?: Record<string, string[]>;
  public readonly isOperational: boolean;

  constructor(
    message: string,
    statusCode: number = 500,
    fieldErrors?: Record<string, string[]>,
    isOperational: boolean = true
  ) {
    super(message);
    this.name = 'AppError';
    this.statusCode = statusCode;
    this.fieldErrors = fieldErrors;
    this.isOperational = isOperational;
    Object.setPrototypeOf(this, new.target.prototype);
  }

  static badRequest(message: string, fieldErrors?: Record<string, string[]>): AppError {
    return new AppError(message, 400, fieldErrors);
  }

  static unauthorized(message: string = 'Unauthorized: Authentication required'): AppError {
    return new AppError(message, 401);
  }

  static forbidden(message: string = 'Forbidden: Access denied'): AppError {
    return new AppError(message, 403);
  }

  static notFound(message: string = 'Resource not found'): AppError {
    return new AppError(message, 404);
  }

  static unprocessable(message: string, fieldErrors?: Record<string, string[]>): AppError {
    return new AppError(message, 422, fieldErrors);
  }

  static internal(message: string = 'Internal server error'): AppError {
    return new AppError(message, 500, undefined, false);
  }
}

/**
 * Express centralized error handling middleware.
 * Guarantees standard JSON structure:
 * { success: false, error: string, fieldErrors?: Record<string, string[]> }
 */
export function errorHandler(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      success: false,
      error: err.message,
      ...(err.fieldErrors ? { fieldErrors: err.fieldErrors } : {}),
    });
    return;
  }

  if (err instanceof ZodError) {
    res.status(422).json({
      success: false,
      error: 'Validation failed',
      fieldErrors: err.flatten().fieldErrors,
    });
    return;
  }

  console.error('[Unhandled Server Error]', err);
  res.status(500).json({
    success: false,
    error: 'Internal server error. Please try again later.',
  });
}
