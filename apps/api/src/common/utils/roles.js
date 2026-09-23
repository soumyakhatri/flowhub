import { forbidden } from '../errors/AppError.js';
export const MEMBERSHIP_ROLES = ['OWNER', 'ADMIN', 'MEMBER'];
export function assertRole(role, allowed, message = 'Insufficient permissions') {
    if (!allowed.includes(role)) {
        throw forbidden(message);
    }
}
