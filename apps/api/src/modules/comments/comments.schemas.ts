import { z } from 'zod';
import { objectIdSchema } from '../../common/schemas/objectId';

export const createCommentSchema = z.object({
  content: z.string().trim().min(1).max(8000),
  mentionUserIds: z.array(objectIdSchema).max(20).optional(),
});

export const taskCommentParamsSchema = z.object({
  taskId: objectIdSchema,
});

export type CreateCommentInput = z.infer<typeof createCommentSchema>;