import { describe, expect, it } from 'vitest';
import { AppError, conflict, notFound } from './AppError.js';
describe('AppError', () => {
    it('carries status, code, and message', () => {
        const err = new AppError(404, 'NOT_FOUND', 'missing');
        expect(err).toBeInstanceOf(Error);
        expect(err).toBeInstanceOf(AppError);
        expect(err.statusCode).toBe(404);
        expect(err.code).toBe('NOT_FOUND');
        expect(err.message).toBe('missing');
        expect(err.isOperational).toBe(true);
        expect(err.name).toBe('AppError');
    });
    it('builds common error variants', () => {
        expect(notFound('Task not found').statusCode).toBe(404);
        expect(conflict('Email already registered').code).toBe('CONFLICT');
    });
});
