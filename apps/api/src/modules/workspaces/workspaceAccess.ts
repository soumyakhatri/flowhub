import { forbidden, notFound } from '../../common/errors/AppError';
import type { MembershipRole } from '../../common/utils/roles';
import { OrganizationMemberModel } from '../organizations/organizationMember.model';
import type { OrganizationMemberRecord } from '../organizations/organizations.types';
import { WorkspaceMemberModel } from './workspaceMember.model';
import { WorkspaceModel } from './workspace.model';
import type { WorkspaceMemberRecord, WorkspaceRecord } from './workspaces.types';

export interface WorkspaceAccess {
  workspace: WorkspaceRecord;
  role: MembershipRole;
}

export async function resolveWorkspaceAccess(userId: string, workspaceId: string): Promise<WorkspaceAccess> {
  const workspace = await WorkspaceModel.findById(workspaceId).lean<WorkspaceRecord | null>();
  if (!workspace) {
    throw notFound('Workspace not found');
  }

  const membership = await WorkspaceMemberModel.findOne({
    workspaceId,
    userId,
  }).lean<WorkspaceMemberRecord | null>();
  if (membership) {
    return { workspace, role: membership.role };
  }

  const orgMembership = await OrganizationMemberModel.findOne({
    organizationId: workspace.organizationId,
    userId,
  }).lean<OrganizationMemberRecord | null>();
  if (orgMembership && (orgMembership.role === 'OWNER' || orgMembership.role === 'ADMIN')) {
    return { workspace, role: orgMembership.role };
  }

  throw forbidden('Not a member of this workspace');
}