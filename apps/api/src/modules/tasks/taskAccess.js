import { notFound } from '../../common/errors/AppError.js';
import { resolveWorkspaceAccess } from '../workspaces/workspaceAccess.js';
import { TaskModel } from './task.model.js';
export async function requireTask(userId, taskId) {
    const task = await TaskModel.findById(taskId).lean();
    if (!task) {
        throw notFound('Task not found');
    }
    const access = await resolveWorkspaceAccess(userId, task.workspaceId.toString());
    return { task, access };
}
