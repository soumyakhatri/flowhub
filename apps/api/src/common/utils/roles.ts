import { forbidden } from '../errors/AppError';

export const MEMBERSHIP_ROLES = ['OWNER', 'ADMIN', 'MEMBER'] as const;
export type MembershipRole = (typeof MEMBERSHIP_ROLES)[number];

export function assertRole(
  role: string,
  allowed: readonly string[],
  message = 'Insufficient permissions',
): void {
  if (!allowed.includes(role)) {
    throw forbidden(message);
  }
}