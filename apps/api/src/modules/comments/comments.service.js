import { badRequest } from '../../common/errors/AppError.js';
import { buildPagination, getSkip } from '../../common/utils/pagination.js';
import { requireTask } from '../tasks/taskAccess.js';
import { UserModel } from '../users/user.model.js';
import { CommentModel } from './comment.model.js';
function toCommentDto(comment) {
    return {
        id: comment._id.toString(),
        taskId: comment.taskId.toString(),
        authorId: comment.authorId.toString(),
        content: comment.content,
        mentionUserIds: (comment.mentionUserIds ?? []).map((id) => id.toString()),
        createdAt: comment.createdAt.toISOString(),
        updatedAt: comment.updatedAt.toISOString(),
    };
}
export async function listComments(userId, taskId, query) {
    await requireTask(userId, taskId);
    const filter = { taskId };
    const total = await CommentModel.countDocuments(filter);
    const comments = await CommentModel.find(filter)
        .sort({ createdAt: 1 })
        .skip(getSkip(query.page, query.limit))
        .limit(query.limit)
        .lean();
    return {
        data: comments.map(toCommentDto),
        pagination: buildPagination(query.page, query.limit, total),
    };
}
export async function createComment(userId, taskId, input) {
    const { task } = await requireTask(userId, taskId);
    const mentionUserIds = input.mentionUserIds ?? [];
    if (mentionUserIds.length > 0) {
        const uniqueIds = [...new Set(mentionUserIds)];
        const count = await UserModel.countDocuments({ _id: { $in: uniqueIds } });
        if (count !== uniqueIds.length) {
            throw badRequest('One or more mentioned users do not exist');
        }
    }
    const comment = await CommentModel.create({
        taskId: task._id,
        authorId: userId,
        content: input.content,
        mentionUserIds,
    });
    return toCommentDto(comment.toObject());
}
