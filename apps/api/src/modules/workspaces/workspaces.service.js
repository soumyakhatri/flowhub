import { conflict, notFound } from '../../common/errors/AppError.js';
import { isDuplicateKeyError } from '../../common/errors/isDuplicateKey.js';
import { buildPagination, getSkip } from '../../common/utils/pagination.js';
import { assertRole } from '../../common/utils/roles.js';
import { requireOrgMember } from '../organizations/orgAccess.js';
import { OrganizationMemberModel } from '../organizations/organizationMember.model.js';
import { UserModel } from '../users/user.model.js';
import { WorkspaceMemberModel } from './workspaceMember.model.js';
import { WorkspaceModel } from './workspace.model.js';
import { resolveWorkspaceAccess } from './workspaceAccess.js';
function toWorkspaceDto(workspace, role) {
    return {
        id: workspace._id.toString(),
        organizationId: workspace.organizationId.toString(),
        name: workspace.name,
        description: workspace.description ?? null,
        createdBy: workspace.createdBy.toString(),
        role,
        createdAt: workspace.createdAt.toISOString(),
        updatedAt: workspace.updatedAt.toISOString(),
    };
}
export async function createWorkspace(userId, organizationId, input) {
    await requireOrgMember(organizationId, userId);
    const workspace = await WorkspaceModel.create({
        organizationId,
        name: input.name,
        description: input.description,
        createdBy: userId,
    });
    try {
        await WorkspaceMemberModel.create({
            workspaceId: workspace._id,
            userId,
            role: 'OWNER',
        });
    }
    catch (err) {
        await WorkspaceModel.deleteOne({ _id: workspace._id });
        throw err;
    }
    return toWorkspaceDto(workspace.toObject(), 'OWNER');
}
export async function listWorkspaces(userId, organizationId, query) {
    const { membership } = await requireOrgMember(organizationId, userId);
    const filter = { organizationId };
    if (membership.role === 'MEMBER') {
        const workspaceMemberships = await WorkspaceMemberModel.find({ userId }).lean();
        filter._id = { $in: workspaceMemberships.map((item) => item.workspaceId) };
    }
    const total = await WorkspaceModel.countDocuments(filter);
    const workspaces = await WorkspaceModel.find(filter)
        .sort({ createdAt: -1 })
        .skip(getSkip(query.page, query.limit))
        .limit(query.limit)
        .lean();
    const memberships = await WorkspaceMemberModel.find({
        userId,
        workspaceId: { $in: workspaces.map((workspace) => workspace._id) },
    }).lean();
    const roleByWorkspace = new Map(memberships.map((item) => [item.workspaceId.toString(), item.role]));
    return {
        data: workspaces.map((workspace) => toWorkspaceDto(workspace, roleByWorkspace.get(workspace._id.toString()) ?? membership.role)),
        pagination: buildPagination(query.page, query.limit, total),
    };
}
export async function getWorkspace(userId, workspaceId) {
    const access = await resolveWorkspaceAccess(userId, workspaceId);
    return toWorkspaceDto(access.workspace, access.role);
}
export async function addMember(actorId, workspaceId, input) {
    const access = await resolveWorkspaceAccess(actorId, workspaceId);
    assertRole(access.role, ['OWNER', 'ADMIN'], 'Only workspace owners and admins can add members');
    if (input.role === 'OWNER') {
        assertRole(access.role, ['OWNER'], 'Only owners can assign the owner role');
    }
    const user = await UserModel.findOne({ email: input.email }).lean();
    if (!user) {
        throw notFound('User not found');
    }
    const orgMembership = await OrganizationMemberModel.findOne({
        organizationId: access.workspace.organizationId,
        userId: user._id,
    }).lean();
    if (!orgMembership) {
        throw conflict('User must be an organization member before joining a workspace');
    }
    try {
        const created = await WorkspaceMemberModel.create({
            workspaceId,
            userId: user._id,
            role: input.role,
        });
        return {
            id: created._id.toString(),
            workspaceId,
            userId: user._id.toString(),
            email: user.email,
            role: input.role,
        };
    }
    catch (err) {
        if (isDuplicateKeyError(err)) {
            throw conflict('User is already a member of this workspace');
        }
        throw err;
    }
}
