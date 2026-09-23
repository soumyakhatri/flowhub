import { requireUser } from '../../common/middleware/authenticate.js';
import { asyncHandler } from '../../common/utils/asyncHandler.js';
import { routeParam } from '../../common/utils/params.js';
import * as commentsService from './comments.service.js';
export const listComments = asyncHandler(async (req, res) => {
    const user = requireUser(req);
    const result = await commentsService.listComments(user.id, routeParam(req, 'taskId'), req.query);
    res.json(result);
});
export const createComment = asyncHandler(async (req, res) => {
    const user = requireUser(req);
    const data = await commentsService.createComment(user.id, routeParam(req, 'taskId'), req.body);
    res.status(201).json({ data });
});
