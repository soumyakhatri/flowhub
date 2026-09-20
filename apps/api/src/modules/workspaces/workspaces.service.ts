import { conflict, notFound } from '../../common/errors/AppError';
import { isDuplicateKeyError } from '../../common/errors/isDuplicateKey';
import { buildPagination, getSkip, type PaginationQuery } from '../../common/utils/pagination';
import { assertRole, type MembershipRole } from '../../common/utils/roles';
import { requireOrgMember } from '../organizations/orgAccess';
import { OrganizationMemberModel } from '../organizations/organizationMember.model';
import type { OrganizationMemberRecord } from '../organizations/organizations.types';
import { UserModel } from '../users/user.model';
import type { UserRecord } from '../users/users.types';
import { WorkspaceMemberModel } from './workspaceMember.model';
import { WorkspaceModel } from './workspace.model';
import type { AddWorkspaceMemberInput, CreateWorkspaceInput } from './workspaces.schemas';
import type { WorkspaceDto, WorkspaceMemberRecord, WorkspaceRecord } from './workspaces.types';
import { resolveWorkspaceAccess } from './workspaceAccess';

function toWorkspaceDto(workspace: WorkspaceRecord, role: MembershipRole): WorkspaceDto {
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

export async function createWorkspace(userId: string, organizationId: string, input: CreateWorkspaceInput) {
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
  } catch (err) {
    await WorkspaceModel.deleteOne({ _id: workspace._id });
    throw err;
  }
  return toWorkspaceDto(workspace.toObject() as WorkspaceRecord, 'OWNER');
}

export async function listWorkspaces(userId: string, organizationId: string, query: PaginationQuery) {
  const { membership } = await requireOrgMember(organizationId, userId);
  const filter: Record<string, unknown> = { organizationId };

  if (membership.role === 'MEMBER') {
    const workspaceMemberships = await WorkspaceMemberModel.find({ userId }).lean<WorkspaceMemberRecord[]>();
    filter._id = { $in: workspaceMemberships.map((item) => item.workspaceId) };
  }

  const total = await WorkspaceModel.countDocuments(filter);
  const workspaces = await WorkspaceModel.find(filter)
    .sort({ createdAt: -1 })
    .skip(getSkip(query.page, query.limit))
    .limit(query.limit)
    .lean<WorkspaceRecord[]>();

  const memberships = await WorkspaceMemberModel.find({
    userId,
    workspaceId: { $in: workspaces.map((workspace) => workspace._id) },
  }).lean<WorkspaceMemberRecord[]>();
  const roleByWorkspace = new Map(
    memberships.map((item) => [item.workspaceId.toString(), item.role]),
  );

  return {
    data: workspaces.map((workspace) =>
      toWorkspaceDto(workspace, roleByWorkspace.get(workspace._id.toString()) ?? membership.role),
    ),
    pagination: buildPagination(query.page, query.limit, total),
  };
}

export async function getWorkspace(userId: string, workspaceId: string): Promise<WorkspaceDto> {
  const access = await resolveWorkspaceAccess(userId, workspaceId);
  return toWorkspaceDto(access.workspace, access.role);
}

export async function addMember(actorId: string, workspaceId: string, input: AddWorkspaceMemberInput) {
  const access = await resolveWorkspaceAccess(actorId, workspaceId);
  assertRole(access.role, ['OWNER', 'ADMIN'], 'Only workspace owners and admins can add members');
  if (input.role === 'OWNER') {
    assertRole(access.role, ['OWNER'], 'Only owners can assign the owner role');
  }

  const user = await UserModel.findOne({ email: input.email }).lean<UserRecord | null>();
  if (!user) {
    throw notFound('User not found');
  }

  const orgMembership = await OrganizationMemberModel.findOne({
    organizationId: access.workspace.organizationId,
    userId: user._id,
  }).lean<OrganizationMemberRecord | null>();
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
  } catch (err) {
    if (isDuplicateKeyError(err)) {
      throw conflict('User is already a member of this workspace');
    }
    throw err;
  }
}