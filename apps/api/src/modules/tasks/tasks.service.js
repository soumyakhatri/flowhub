import { badRequest } from '../../common/errors/AppError.js';
import { buildPagination, getSkip } from '../../common/utils/pagination.js';
import { assertRole } from '../../common/utils/roles.js';
import { CommentModel } from '../comments/comment.model.js';
import { requireProject } from '../projects/projectAccess.js';
import { WorkspaceMemberModel } from '../workspaces/workspaceMember.model.js';
import { TaskModel } from './task.model.js';
import { requireTask } from './taskAccess.js';
function toTaskDto(task) {
    return {
        id: task._id.toString(),
        projectId: task.projectId.toString(),
        workspaceId: task.workspaceId.toString(),
        title: task.title,
        description: task.description ?? null,
        status: task.status,
        priority: task.priority,
        assigneeId: task.assigneeId ? task.assigneeId.toString() : null,
        dueDate: task.dueDate ? task.dueDate.toISOString() : null,
        createdBy: task.createdBy.toString(),
        createdAt: task.createdAt.toISOString(),
        updatedAt: task.updatedAt.toISOString(),
    };
}
async function assertAssignee(workspaceId, assigneeId) {
    const member = await WorkspaceMemberModel.findOne({
        workspaceId,
        userId: assigneeId,
    }).lean();
    if (!member) {
        throw badRequest('Assignee is not a member of this workspace');
    }
}
export async function createTask(userId, projectId, input) {
    const { project } = await requireProject(userId, projectId);
    if (input.assigneeId) {
        await assertAssignee(project.workspaceId.toString(), input.assigneeId);
    }
    const task = await TaskModel.create({
        projectId: project._id,
        workspaceId: project.workspaceId,
        title: input.title,
        description: input.description,
        status: input.status,
        priority: input.priority,
        assigneeId: input.assigneeId ?? null,
        dueDate: input.dueDate ?? null,
        createdBy: userId,
    });
    return toTaskDto(task.toObject());
}
export async function listTasks(userId, projectId, query) {
    await requireProject(userId, projectId);
    const filter = { projectId };
    if (query.status) {
        filter.status = query.status;
    }
    const total = await TaskModel.countDocuments(filter);
    const sortDirection = query.order === 'asc' ? 1 : -1;
    const tasks = await TaskModel.find(filter)
        .sort({ [query.sort]: sortDirection })
        .skip(getSkip(query.page, query.limit))
        .limit(query.limit)
        .lean();
    return {
        data: tasks.map(toTaskDto),
        pagination: buildPagination(query.page, query.limit, total),
    };
}
export async function getTask(userId, taskId) {
    const { task } = await requireTask(userId, taskId);
    return toTaskDto(task);
}
export async function updateTask(userId, taskId, input) {
    const { task } = await requireTask(userId, taskId);
    if (input.assigneeId) {
        await assertAssignee(task.workspaceId.toString(), input.assigneeId);
    }
    const updated = await TaskModel.findByIdAndUpdate(task._id, {
        ...(input.title !== undefined ? { title: input.title } : {}),
        ...(input.description !== undefined ? { description: input.description } : {}),
        ...(input.status !== undefined ? { status: input.status } : {}),
        ...(input.priority !== undefined ? { priority: input.priority } : {}),
        ...(input.assigneeId !== undefined ? { assigneeId: input.assigneeId } : {}),
        ...(input.dueDate !== undefined ? { dueDate: input.dueDate } : {}),
    }, { new: true }).lean();
    return toTaskDto(updated ?? task);
}
export async function deleteTask(userId, taskId) {
    const { task, access } = await requireTask(userId, taskId);
    const isCreator = task.createdBy.toString() === userId;
    if (!isCreator) {
        assertRole(access.role, ['OWNER', 'ADMIN'], 'Only the creator or a workspace admin can delete this task');
    }
    await CommentModel.deleteMany({ taskId: task._id });
    await TaskModel.deleteOne({ _id: task._id });
}
