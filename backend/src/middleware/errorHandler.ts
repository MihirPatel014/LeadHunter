import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { loggerService } from '../services/logger.service.js';

export interface AppError extends Error {
  statusCode?: number;
}

export const notFoundHandler = (req: Request, res: Response): void => {
  loggerService.warn('API', `Route not found: ${req.method} ${req.originalUrl}`);
  res.status(404).json({
    success: false,
    error: `Route not found: ${req.method} ${req.originalUrl}`,
  });
};

export const errorHandler = (
  err: AppError,
  req: Request,
  res: Response,
  _next: NextFunction
): void => {
  if (err instanceof ZodError) {
    const formattedErrors = err.errors.map((e) => `${e.path.join('.')}: ${e.message}`);
    loggerService.warn('API', `Validation failed for ${req.method} ${req.originalUrl}`, {
      errors: formattedErrors,
    });
    res.status(400).json({
      success: false,
      error: 'Validation failed',
      details: formattedErrors,
    });
    return;
  }

  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';

  loggerService.error('SYSTEM', `${statusCode} - ${message} on ${req.method} ${req.originalUrl}`, {
    stack: err.stack,
    url: req.originalUrl,
    method: req.method,
  });

  console.error(`[Error] ${statusCode} - ${message}`);

  res.status(statusCode).json({
    success: false,
    error: message,
    ...(process.env.NODE_ENV === 'development' ? { stack: err.stack } : {}),
  });
};

