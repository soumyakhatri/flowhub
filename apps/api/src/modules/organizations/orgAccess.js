import { forbidden, notFound } from '../../common/errors/AppError.js';
import { OrganizationMemberModel } from './organizationMember.model.js';
import { OrganizationModel } from './organization.model.js';
export async function requireOrgMember(organizationId, userId) {
    const organization = await OrganizationModel.findById(organizationId).lean();
    if (!organization) {
        throw notFound('Organization not found');
    }
    const membership = await OrganizationMemberModel.findOne({
        organizationId,
        userId,
    }).lean();
    if (!membership) {
        throw forbidden('Not a member of this organization');
    }
    return { organization, membership };
}
