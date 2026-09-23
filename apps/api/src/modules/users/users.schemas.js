import { z } from 'zod';
import { objectIdSchema } from '../../common/schemas/objectId.js';
export const userIdParamsSchema = z.object({
    id: objectIdSchema,
});
