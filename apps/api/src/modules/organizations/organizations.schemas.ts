import { z } from 'zod';
import { objectIdSchema } from '../../common/schemas/objectId';
import { MEMBERSHIP_ROLES } from '../../common/utils/roles';

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

export type CreateOrganizationInput = z.infer<typeof createOrganizationSchema>;
export type AddOrganizationMemberInput = z.infer<typeof addOrganizationMemberSchema>;