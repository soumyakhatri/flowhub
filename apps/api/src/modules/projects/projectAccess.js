import { notFound } from '../../common/errors/AppError.js';
import { resolveWorkspaceAccess } from '../workspaces/workspaceAccess.js';
import { ProjectModel } from './project.model.js';
export async function requireProject(userId, projectId) {
    const project = await ProjectModel.findById(projectId).lean();
    if (!project) {
        throw notFound('Project not found');
    }
    const access = await resolveWorkspaceAccess(userId, project.workspaceId.toString());
    return { project, access };
}
