import type { ErrorRequestHandler } from 'express';
import { JsonWebTokenError, TokenExpiredError } from 'jsonwebtoken';
import mongoose from 'mongoose';
import { ZodError } from 'zod';
import { logger } from '../../infrastructure/logging/logger';
import { AppError } from './AppError';
import { isDuplicateKeyError } from './isDuplicateKey';

function formatZodError(error: ZodError): string {
  return error.issues
    .map((issue) => {
      const path = issue.path.length > 0 ? issue.path.join('.') : 'body';
      return path + ': ' + issue.message;
    })
    .join('; ');
}

function send(
  res: { status: (code: number) => { json: (body: unknown) => void } },
  statusCode: number,
  code: string,
  message: string,
  requestId: string,
): void {
  res.status(statusCode).json({
    error: { code, message, requestId },
  });
}

export const errorHandler: ErrorRequestHandler = (err, req, res, _next) => {
  const requestId = req.requestId || 'unknown';

  if (err instanceof AppError) {
    send(res, err.statusCode, err.code, err.message, requestId);
    return;
  }

  if (err instanceof ZodError) {
    send(res, 400, 'VALIDATION_ERROR', formatZodError(err), requestId);
    return;
  }

  if (err instanceof TokenExpiredError || err instanceof JsonWebTokenError) {
    send(res, 401, 'UNAUTHORIZED', 'Invalid or expired token', requestId);
    return;
  }

  if (err instanceof mongoose.Error.CastError) {
    send(res, 400, 'BAD_REQUEST', 'Invalid identifier', requestId);
    return;
  }

  if (err instanceof mongoose.Error.ValidationError) {
    send(res, 400, 'VALIDATION_ERROR', err.message, requestId);
    return;
  }

  if (err instanceof SyntaxError && 'body' in err) {
    send(res, 400, 'BAD_REQUEST', 'Invalid JSON body', requestId);
    return;
  }

  if (isDuplicateKeyError(err)) {
    send(res, 409, 'CONFLICT', 'Resource already exists', requestId);
    return;
  }

  logger.error({ err, requestId }, 'unhandled error');
  send(res, 500, 'INTERNAL_ERROR', 'Internal server error', requestId);
};