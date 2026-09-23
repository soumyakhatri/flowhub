import mongoose, { Schema } from 'mongoose';
import { TASK_PRIORITIES, TASK_STATUSES } from './tasks.schemas.js';
const taskSchema = new Schema({
    projectId: { type: Schema.Types.ObjectId, ref: 'Project', required: true },
    workspaceId: { type: Schema.Types.ObjectId, ref: 'Workspace', required: true },
    title: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    status: { type: String, enum: TASK_STATUSES, required: true, default: 'todo' },
    priority: { type: String, enum: TASK_PRIORITIES, required: true, default: 'medium' },
    assigneeId: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    dueDate: { type: Date, default: null },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
}, { timestamps: true, collection: 'tasks' });
taskSchema.index({ projectId: 1, status: 1, createdAt: -1 });
taskSchema.index({ assigneeId: 1, status: 1 });
taskSchema.index({ workspaceId: 1, updatedAt: -1 });
export const TaskModel = mongoose.model('Task', taskSchema);
