import { conflict, notFound } from '../../common/errors/AppError.js';
import { isDuplicateKeyError } from '../../common/errors/isDuplicateKey.js';
import { buildPagination, getSkip } from '../../common/utils/pagination.js';
import { assertRole } from '../../common/utils/roles.js';
import { UserModel } from '../users/user.model.js';
import { OrganizationMemberModel } from './organizationMember.model.js';
import { OrganizationModel } from './organization.model.js';
import { requireOrgMember } from './orgAccess.js';
function toOrganizationDto(org, role) {
    return {
        id: org._id.toString(),
        name: org.name,
        createdBy: org.createdBy.toString(),
        role,
        createdAt: org.createdAt.toISOString(),
        updatedAt: org.updatedAt.toISOString(),
    };
}
export async function createOrganization(userId, input) {
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
    }
    catch (err) {
        await OrganizationModel.deleteOne({ _id: organization._id });
        throw err;
    }
    return toOrganizationDto(organization.toObject(), 'OWNER');
}
export async function listOrganizations(userId, query) {
    const memberships = await OrganizationMemberModel.find({ userId }).lean();
    const orgIds = memberships.map((membership) => membership.organizationId);
    const filter = { _id: { $in: orgIds } };
    const total = await OrganizationModel.countDocuments(filter);
    const organizations = await OrganizationModel.find(filter)
        .sort({ createdAt: -1 })
        .skip(getSkip(query.page, query.limit))
        .limit(query.limit)
        .lean();
    const roleByOrg = new Map(memberships.map((membership) => [membership.organizationId.toString(), membership.role]));
    return {
        data: organizations.map((org) => toOrganizationDto(org, roleByOrg.get(org._id.toString()) ?? 'MEMBER')),
        pagination: buildPagination(query.page, query.limit, total),
    };
}
export async function getOrganization(userId, organizationId) {
    const { organization, membership } = await requireOrgMember(organizationId, userId);
    return toOrganizationDto(organization, membership.role);
}
export async function addMember(actorId, organizationId, input) {
    const { membership } = await requireOrgMember(organizationId, actorId);
    assertRole(membership.role, ['OWNER', 'ADMIN'], 'Only owners and admins can add members');
    if (input.role === 'OWNER') {
        assertRole(membership.role, ['OWNER'], 'Only owners can assign the owner role');
    }
    const user = await UserModel.findOne({ email: input.email }).lean();
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
    }
    catch (err) {
        if (isDuplicateKeyError(err)) {
            throw conflict('User is already a member of this organization');
        }
        throw err;
    }
}
