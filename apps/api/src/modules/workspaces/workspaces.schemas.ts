import { z } from 'zod';
import { objectIdSchema } from '../../common/schemas/objectId';
import { MEMBERSHIP_ROLES } from '../../common/utils/roles';

export const createWorkspaceSchema = z.object({
  name: z.string().trim().min(1).max(120),
  description: z.string().trim().max(2000).optional(),
});

export const addWorkspaceMemberSchema = z.object({
  email: z.string().trim().email().max(320).transform((value) => value.toLowerCase()),
  role: z.enum(MEMBERSHIP_ROLES),
});

export const workspaceIdParamsSchema = z.object({
  id: objectIdSchema,
});

export const orgWorkspaceParamsSchema = z.object({
  orgId: objectIdSchema,
});

export type CreateWorkspaceInput = z.infer<typeof createWorkspaceSchema>;
export type AddWorkspaceMemberInput = z.infer<typeof addWorkspaceMemberSchema>;