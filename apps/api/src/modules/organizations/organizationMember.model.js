import mongoose, { Schema } from 'mongoose';
import { MEMBERSHIP_ROLES } from '../../common/utils/roles.js';
const organizationMemberSchema = new Schema({
    organizationId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    role: { type: String, enum: MEMBERSHIP_ROLES, required: true },
}, { timestamps: true, collection: 'organization_members' });
organizationMemberSchema.index({ organizationId: 1, userId: 1 }, { unique: true });
organizationMemberSchema.index({ userId: 1 });
export const OrganizationMemberModel = mongoose.model('OrganizationMember', organizationMemberSchema);
