import mongoose, { Schema } from 'mongoose';
import { MEMBERSHIP_ROLES } from '../../common/utils/roles.js';
const workspaceMemberSchema = new Schema({
    workspaceId: { type: Schema.Types.ObjectId, ref: 'Workspace', required: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    role: { type: String, enum: MEMBERSHIP_ROLES, required: true },
}, { timestamps: true, collection: 'workspace_members' });
workspaceMemberSchema.index({ workspaceId: 1, userId: 1 }, { unique: true });
workspaceMemberSchema.index({ userId: 1 });
export const WorkspaceMemberModel = mongoose.model('WorkspaceMember', workspaceMemberSchema);
