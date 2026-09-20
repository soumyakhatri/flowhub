import mongoose, { Schema } from 'mongoose';

const workspaceSchema = new Schema(
  {
    organizationId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true },
    name: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true, collection: 'workspaces' },
);

workspaceSchema.index({ organizationId: 1, createdAt: -1 });

export const WorkspaceModel = mongoose.model('Workspace', workspaceSchema);