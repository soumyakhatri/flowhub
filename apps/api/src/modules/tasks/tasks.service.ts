import { badRequest } from '../../common/errors/AppError';
import { buildPagination, getSkip } from '../../common/utils/pagination';
import { assertRole } from '../../common/utils/roles';
import { CommentModel } from '../comments/comment.model';
import { requireProject } from '../projects/projectAccess';
import { WorkspaceMemberModel } from '../workspaces/workspaceMember.model';
import type { WorkspaceMemberRecord } from '../workspaces/workspaces.types';
import { TaskModel } from './task.model';
import { requireTask } from './taskAccess';
import type { CreateTaskInput, ListTasksQuery, UpdateTaskInput } from './tasks.schemas';
import type { TaskDto, TaskRecord } from './tasks.types';

function toTaskDto(task: TaskRecord): TaskDto {
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

async function assertAssignee(workspaceId: string, assigneeId: string): Promise<void> {
  const member = await WorkspaceMemberModel.findOne({
    workspaceId,
    userId: assigneeId,
  }).lean<WorkspaceMemberRecord | null>();
  if (!member) {
    throw badRequest('Assignee is not a member of this workspace');
  }
}

export async function createTask(userId: string, projectId: string, input: CreateTaskInput) {
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
  return toTaskDto(task.toObject() as TaskRecord);
}

export async function listTasks(userId: string, projectId: string, query: ListTasksQuery) {
  await requireProject(userId, projectId);
  const filter: Record<string, unknown> = { projectId };
  if (query.status) {
    filter.status = query.status;
  }
  const total = await TaskModel.countDocuments(filter);
  const sortDirection = query.order === 'asc' ? 1 : -1;
  const tasks = await TaskModel.find(filter)
    .sort({ [query.sort]: sortDirection })
    .skip(getSkip(query.page, query.limit))
    .limit(query.limit)
    .lean<TaskRecord[]>();
  return {
    data: tasks.map(toTaskDto),
    pagination: buildPagination(query.page, query.limit, total),
  };
}

export async function getTask(userId: string, taskId: string): Promise<TaskDto> {
  const { task } = await requireTask(userId, taskId);
  return toTaskDto(task);
}

export async function updateTask(userId: string, taskId: string, input: UpdateTaskInput) {
  const { task } = await requireTask(userId, taskId);
  if (input.assigneeId) {
    await assertAssignee(task.workspaceId.toString(), input.assigneeId);
  }
  const updated = await TaskModel.findByIdAndUpdate(
    task._id,
    {
      ...(input.title !== undefined ? { title: input.title } : {}),
      ...(input.description !== undefined ? { description: input.description } : {}),
      ...(input.status !== undefined ? { status: input.status } : {}),
      ...(input.priority !== undefined ? { priority: input.priority } : {}),
      ...(input.assigneeId !== undefined ? { assigneeId: input.assigneeId } : {}),
      ...(input.dueDate !== undefined ? { dueDate: input.dueDate } : {}),
    },
    { new: true },
  ).lean<TaskRecord | null>();
  return toTaskDto(updated ?? task);
}

export async function deleteTask(userId: string, taskId: string): Promise<void> {
  const { task, access } = await requireTask(userId, taskId);
  const isCreator = task.createdBy.toString() === userId;
  if (!isCreator) {
    assertRole(access.role, ['OWNER', 'ADMIN'], 'Only the creator or a workspace admin can delete this task');
  }
  await CommentModel.deleteMany({ taskId: task._id });
  await TaskModel.deleteOne({ _id: task._id });
}