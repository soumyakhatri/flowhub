import { z } from 'zod';
import { objectIdSchema } from '../../common/schemas/objectId';

export const createProjectSchema = z.object({
  name: z.string().trim().min(1).max(160),
  description: z.string().trim().max(4000).optional(),
});

export const updateProjectSchema = z
  .object({
    name: z.string().trim().min(1).max(160),
    description: z.string().trim().max(4000).nullable(),
  })
  .partial();

export const projectIdParamsSchema = z.object({
  id: objectIdSchema,
});

export const workspaceProjectParamsSchema = z.object({
  workspaceId: objectIdSchema,
});

export type CreateProjectInput = z.infer<typeof createProjectSchema>;
export type UpdateProjectInput = z.infer<typeof updateProjectSchema>;