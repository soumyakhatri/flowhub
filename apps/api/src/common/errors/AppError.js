export class AppError extends Error {
    statusCode;
    code;
    isOperational;
    constructor(statusCode, code, message) {
        super(message);
        this.name = 'AppError';
        this.statusCode = statusCode;
        this.code = code;
        this.isOperational = true;
        Error.captureStackTrace(this, this.constructor);
    }
}
export function badRequest(message) {
    return new AppError(400, 'BAD_REQUEST', message);
}
export function unauthorized(message = 'Unauthorized') {
    return new AppError(401, 'UNAUTHORIZED', message);
}
export function forbidden(message = 'Forbidden') {
    return new AppError(403, 'FORBIDDEN', message);
}
export function notFound(message = 'Resource not found') {
    return new AppError(404, 'NOT_FOUND', message);
}
export function conflict(message) {
    return new AppError(409, 'CONFLICT', message);
}
