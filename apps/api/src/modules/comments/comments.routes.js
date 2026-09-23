import { Router } from 'express';
import { authenticate } from '../../common/middleware/authenticate.js';
import { validateBody, validateParams, validateQuery } from '../../common/middleware/validate.js';
import { paginationQuerySchema } from '../../common/utils/pagination.js';
import { createComment, listComments } from './comments.controller.js';
import { createCommentSchema, taskCommentParamsSchema } from './comments.schemas.js';
export const commentsRouter = Router({ mergeParams: true });
commentsRouter.get('/', authenticate, validateParams(taskCommentParamsSchema), validateQuery(paginationQuerySchema), listComments);
commentsRouter.post('/', authenticate, validateParams(taskCommentParamsSchema), validateBody(createCommentSchema), createComment);
