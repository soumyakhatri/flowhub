import { z } from 'zod';
import { objectIdSchema } from '../../common/schemas/objectId.js';
export const createCommentSchema = z.object({
    content: z.string().trim().min(1).max(8000),
    mentionUserIds: z.array(objectIdSchema).max(20).optional(),
});
export const taskCommentParamsSchema = z.object({
    taskId: objectIdSchema,
});
