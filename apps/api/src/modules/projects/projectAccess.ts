import { notFound } from '../../common/errors/AppError';
import { resolveWorkspaceAccess, type WorkspaceAccess } from '../workspaces/workspaceAccess';
import { ProjectModel } from './project.model';
import type { ProjectRecord } from './projects.types';

export async function requireProject(
  userId: string,
  projectId: string,
): Promise<{ project: ProjectRecord; access: WorkspaceAccess }> {
  const project = await ProjectModel.findById(projectId).lean<ProjectRecord | null>();
  if (!project) {
    throw notFound('Project not found');
  }
  const access = await resolveWorkspaceAccess(userId, project.workspaceId.toString());
  return { project, access };
}