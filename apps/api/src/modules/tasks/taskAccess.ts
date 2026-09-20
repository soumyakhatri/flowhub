import { notFound } from '../../common/errors/AppError';
import { resolveWorkspaceAccess, type WorkspaceAccess } from '../workspaces/workspaceAccess';
import { TaskModel } from './task.model';
import type { TaskRecord } from './tasks.types';

export async function requireTask(
  userId: string,
  taskId: string,
): Promise<{ task: TaskRecord; access: WorkspaceAccess }> {
  const task = await TaskModel.findById(taskId).lean<TaskRecord | null>();
  if (!task) {
    throw notFound('Task not found');
  }
  const access = await resolveWorkspaceAccess(userId, task.workspaceId.toString());
  return { task, access };
}