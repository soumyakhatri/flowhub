import { assertRole } from '../../common/utils/roles';
import { buildPagination, getSkip, type PaginationQuery } from '../../common/utils/pagination';
import { CommentModel } from '../comments/comment.model';
import { TaskModel } from '../tasks/task.model';
import type { TaskRecord } from '../tasks/tasks.types';
import { resolveWorkspaceAccess } from '../workspaces/workspaceAccess';
import { ProjectModel } from './project.model';
import { requireProject } from './projectAccess';
import type { CreateProjectInput, UpdateProjectInput } from './projects.schemas';
import type { ProjectDto, ProjectRecord } from './projects.types';

function toProjectDto(project: ProjectRecord): ProjectDto {
  return {
    id: project._id.toString(),
    workspaceId: project.workspaceId.toString(),
    name: project.name,
    description: project.description ?? null,
    createdBy: project.createdBy.toString(),
    createdAt: project.createdAt.toISOString(),
    updatedAt: project.updatedAt.toISOString(),
  };
}

export async function createProject(userId: string, workspaceId: string, input: CreateProjectInput) {
  await resolveWorkspaceAccess(userId, workspaceId);
  const project = await ProjectModel.create({
    workspaceId,
    name: input.name,
    description: input.description,
    createdBy: userId,
  });
  return toProjectDto(project.toObject() as ProjectRecord);
}

export async function listProjects(userId: string, workspaceId: string, query: PaginationQuery) {
  await resolveWorkspaceAccess(userId, workspaceId);
  const filter = { workspaceId };
  const total = await ProjectModel.countDocuments(filter);
  const projects = await ProjectModel.find(filter)
    .sort({ createdAt: -1 })
    .skip(getSkip(query.page, query.limit))
    .limit(query.limit)
    .lean<ProjectRecord[]>();
  return {
    data: projects.map(toProjectDto),
    pagination: buildPagination(query.page, query.limit, total),
  };
}

export async function getProject(userId: string, projectId: string): Promise<ProjectDto> {
  const { project } = await requireProject(userId, projectId);
  return toProjectDto(project);
}

export async function updateProject(userId: string, projectId: string, input: UpdateProjectInput) {
  const { project } = await requireProject(userId, projectId);
  const updated = await ProjectModel.findByIdAndUpdate(
    project._id,
    {
      ...(input.name !== undefined ? { name: input.name } : {}),
      ...(input.description !== undefined ? { description: input.description } : {}),
    },
    { new: true },
  ).lean<ProjectRecord | null>();
  if (!updated) {
    return toProjectDto(project);
  }
  return toProjectDto(updated);
}

export async function deleteProject(userId: string, projectId: string): Promise<void> {
  const { project, access } = await requireProject(userId, projectId);
  assertRole(access.role, ['OWNER', 'ADMIN'], 'Only workspace owners and admins can delete projects');
  const tasks = await TaskModel.find({ projectId: project._id }).select('_id').lean<Pick<TaskRecord, '_id'>[]>();
  const taskIds = tasks.map((task) => task._id);
  if (taskIds.length > 0) {
    await CommentModel.deleteMany({ taskId: { $in: taskIds } });
  }
  await TaskModel.deleteMany({ projectId: project._id });
  await ProjectModel.deleteOne({ _id: project._id });
}