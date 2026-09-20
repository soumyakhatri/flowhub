import { requireUser } from '../../common/middleware/authenticate';
import { asyncHandler } from '../../common/utils/asyncHandler';
import { routeParam } from '../../common/utils/params';
import type { PaginationQuery } from '../../common/utils/pagination';
import type { CreateCommentInput } from './comments.schemas';
import * as commentsService from './comments.service';

export const listComments = asyncHandler(async (req, res) => {
  const user = requireUser(req);
  const result = await commentsService.listComments(
    user.id,
    routeParam(req, 'taskId'),
    req.query as unknown as PaginationQuery,
  );
  res.json(result);
});

export const createComment = asyncHandler(async (req, res) => {
  const user = requireUser(req);
  const data = await commentsService.createComment(
    user.id,
    routeParam(req, 'taskId'),
    req.body as CreateCommentInput,
  );
  res.status(201).json({ data });
});