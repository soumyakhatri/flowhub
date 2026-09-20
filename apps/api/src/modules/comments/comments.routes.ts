import { Router } from 'express';
import { authenticate } from '../../common/middleware/authenticate';
import { validateBody, validateParams, validateQuery } from '../../common/middleware/validate';
import { paginationQuerySchema } from '../../common/utils/pagination';
import { createComment, listComments } from './comments.controller';
import { createCommentSchema, taskCommentParamsSchema } from './comments.schemas';

export const commentsRouter = Router({ mergeParams: true });

commentsRouter.get(
  '/',
  authenticate,
  validateParams(taskCommentParamsSchema),
  validateQuery(paginationQuerySchema),
  listComments,
);
commentsRouter.post(
  '/',
  authenticate,
  validateParams(taskCommentParamsSchema),
  validateBody(createCommentSchema),
  createComment,
);