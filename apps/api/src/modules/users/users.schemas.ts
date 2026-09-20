import { z } from 'zod';
import { objectIdSchema } from '../../common/schemas/objectId';

export const userIdParamsSchema = z.object({
  id: objectIdSchema,
});