import { conflict, notFound } from '../../common/errors/AppError';
import { isDuplicateKeyError } from '../../common/errors/isDuplicateKey';
import { buildPagination, getSkip, type PaginationQuery } from '../../common/utils/pagination';
import { assertRole } from '../../common/utils/roles';
import { UserModel } from '../users/user.model';
import type { UserRecord } from '../users/users.types';
import { OrganizationMemberModel } from './organizationMember.model';
import { OrganizationModel } from './organization.model';
import type { AddOrganizationMemberInput, CreateOrganizationInput } from './organizations.schemas';
import type {
  OrganizationDto,
  OrganizationMemberRecord,
  OrganizationRecord,
} from './organizations.types';
import { requireOrgMember } from './orgAccess';

function toOrganizationDto(org: OrganizationRecord, role: OrganizationDto['role']): OrganizationDto {
  return {
    id: org._id.toString(),
    name: org.name,
    createdBy: org.createdBy.toString(),
    role,
    createdAt: org.createdAt.toISOString(),
    updatedAt: org.updatedAt.toISOString(),
  };
}

export async function createOrganization(
  userId: string,
  input: CreateOrganizationInput,
): Promise<OrganizationDto> {
  const organization = await OrganizationModel.create({
    name: input.name,
    createdBy: userId,
  });
  try {
    await OrganizationMemberModel.create({
      organizationId: organization._id,
      userId,
      role: 'OWNER',
    });
  } catch (err) {
    await OrganizationModel.deleteOne({ _id: organization._id });
    throw err;
  }
  return toOrganizationDto(organization.toObject() as OrganizationRecord, 'OWNER');
}

export async function listOrganizations(userId: string, query: PaginationQuery) {
  const memberships = await OrganizationMemberModel.find({ userId }).lean<OrganizationMemberRecord[]>();
  const orgIds = memberships.map((membership) => membership.organizationId);
  const filter = { _id: { $in: orgIds } };
  const total = await OrganizationModel.countDocuments(filter);
  const organizations = await OrganizationModel.find(filter)
    .sort({ createdAt: -1 })
    .skip(getSkip(query.page, query.limit))
    .limit(query.limit)
    .lean<OrganizationRecord[]>();
  const roleByOrg = new Map(
    memberships.map((membership) => [membership.organizationId.toString(), membership.role]),
  );
  return {
    data: organizations.map((org) => toOrganizationDto(org, roleByOrg.get(org._id.toString()) ?? 'MEMBER')),
    pagination: buildPagination(query.page, query.limit, total),
  };
}

export async function getOrganization(userId: string, organizationId: string): Promise<OrganizationDto> {
  const { organization, membership } = await requireOrgMember(organizationId, userId);
  return toOrganizationDto(organization, membership.role);
}

export async function addMember(
  actorId: string,
  organizationId: string,
  input: AddOrganizationMemberInput,
) {
  const { membership } = await requireOrgMember(organizationId, actorId);
  assertRole(membership.role, ['OWNER', 'ADMIN'], 'Only owners and admins can add members');
  if (input.role === 'OWNER') {
    assertRole(membership.role, ['OWNER'], 'Only owners can assign the owner role');
  }

  const user = await UserModel.findOne({ email: input.email }).lean<UserRecord | null>();
  if (!user) {
    throw notFound('User not found');
  }

  try {
    const created = await OrganizationMemberModel.create({
      organizationId,
      userId: user._id,
      role: input.role,
    });
    return {
      id: created._id.toString(),
      organizationId,
      userId: user._id.toString(),
      email: user.email,
      role: input.role,
    };
  } catch (err) {
    if (isDuplicateKeyError(err)) {
      throw conflict('User is already a member of this organization');
    }
    throw err;
  }
}