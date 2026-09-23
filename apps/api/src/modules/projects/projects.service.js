import { assertRole } from '../../common/utils/roles.js';
import { buildPagination, getSkip } from '../../common/utils/pagination.js';
import { CommentModel } from '../comments/comment.model.js';
import { TaskModel } from '../tasks/task.model.js';
import { resolveWorkspaceAccess } from '../workspaces/workspaceAccess.js';
import { ProjectModel } from './project.model.js';
import { requireProject } from './projectAccess.js';
function toProjectDto(project) {
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
export async function createProject(userId, workspaceId, input) {
    await resolveWorkspaceAccess(userId, workspaceId);
    const project = await ProjectModel.create({
        workspaceId,
        name: input.name,
        description: input.description,
        createdBy: userId,
    });
    return toProjectDto(project.toObject());
}
export async function listProjects(userId, workspaceId, query) {
    await resolveWorkspaceAccess(userId, workspaceId);
    const filter = { workspaceId };
    const total = await ProjectModel.countDocuments(filter);
    const projects = await ProjectModel.find(filter)
        .sort({ createdAt: -1 })
        .skip(getSkip(query.page, query.limit))
        .limit(query.limit)
        .lean();
    return {
        data: projects.map(toProjectDto),
        pagination: buildPagination(query.page, query.limit, total),
    };
}
export async function getProject(userId, projectId) {
    const { project } = await requireProject(userId, projectId);
    return toProjectDto(project);
}
export async function updateProject(userId, projectId, input) {
    const { project } = await requireProject(userId, projectId);
    const updated = await ProjectModel.findByIdAndUpdate(project._id, {
        ...(input.name !== undefined ? { name: input.name } : {}),
        ...(input.description !== undefined ? { description: input.description } : {}),
    }, { new: true }).lean();
    if (!updated) {
        return toProjectDto(project);
    }
    return toProjectDto(updated);
}
export async function deleteProject(userId, projectId) {
    const { project, access } = await requireProject(userId, projectId);
    assertRole(access.role, ['OWNER', 'ADMIN'], 'Only workspace owners and admins can delete projects');
    const tasks = await TaskModel.find({ projectId: project._id }).select('_id').lean();
    const taskIds = tasks.map((task) => task._id);
    if (taskIds.length > 0) {
        await CommentModel.deleteMany({ taskId: { $in: taskIds } });
    }
    await TaskModel.deleteMany({ projectId: project._id });
    await ProjectModel.deleteOne({ _id: project._id });
}
