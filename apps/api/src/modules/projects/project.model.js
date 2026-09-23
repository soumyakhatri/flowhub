import mongoose, { Schema } from 'mongoose';
const projectSchema = new Schema({
    workspaceId: { type: Schema.Types.ObjectId, ref: 'Workspace', required: true },
    name: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
}, { timestamps: true, collection: 'projects' });
projectSchema.index({ workspaceId: 1, createdAt: -1 });
export const ProjectModel = mongoose.model('Project', projectSchema);
