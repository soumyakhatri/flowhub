import { z } from 'zod';
import { objectIdSchema } from '../../common/schemas/objectId.js';
import { MEMBERSHIP_ROLES } from '../../common/utils/roles.js';
export const createOrganizationSchema = z.object({
    name: z.string().trim().min(1).max(120),
});
export const addOrganizationMemberSchema = z.object({
    email: z.string().trim().email().max(320).transform((value) => value.toLowerCase()),
    role: z.enum(MEMBERSHIP_ROLES),
});
export const organizationIdParamsSchema = z.object({
    id: objectIdSchema,
});
export const organizationOrgIdParamsSchema = z.object({
    orgId: objectIdSchema,
});
