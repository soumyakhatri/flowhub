import { forbidden, notFound } from '../../common/errors/AppError';
import { OrganizationMemberModel } from './organizationMember.model';
import { OrganizationModel } from './organization.model';
import type { OrganizationMemberRecord, OrganizationRecord } from './organizations.types';

export async function requireOrgMember(
  organizationId: string,
  userId: string,
): Promise<{ organization: OrganizationRecord; membership: OrganizationMemberRecord }> {
  const organization = await OrganizationModel.findById(organizationId).lean<OrganizationRecord | null>();
  if (!organization) {
    throw notFound('Organization not found');
  }
  const membership = await OrganizationMemberModel.findOne({
    organizationId,
    userId,
  }).lean<OrganizationMemberRecord | null>();
  if (!membership) {
    throw forbidden('Not a member of this organization');
  }
  return { organization, membership };
}