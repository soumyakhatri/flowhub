import { forbidden, notFound } from '../../common/errors/AppError.js';
import { OrganizationMemberModel } from '../organizations/organizationMember.model.js';
import { WorkspaceMemberModel } from './workspaceMember.model.js';
import { WorkspaceModel } from './workspace.model.js';
export async function resolveWorkspaceAccess(userId, workspaceId) {
    const workspace = await WorkspaceModel.findById(workspaceId).lean();
    if (!workspace) {
        throw notFound('Workspace not found');
    }
    const membership = await WorkspaceMemberModel.findOne({
        workspaceId,
        userId,
    }).lean();
    if (membership) {
        return { workspace, role: membership.role };
    }
    const orgMembership = await OrganizationMemberModel.findOne({
        organizationId: workspace.organizationId,
        userId,
    }).lean();
    if (orgMembership && (orgMembership.role === 'OWNER' || orgMembership.role === 'ADMIN')) {
        return { workspace, role: orgMembership.role };
    }
    throw forbidden('Not a member of this workspace');
}
