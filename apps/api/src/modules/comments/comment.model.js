import mongoose, { Schema } from 'mongoose';
const commentSchema = new Schema({
    taskId: { type: Schema.Types.ObjectId, ref: 'Task', required: true },
    authorId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    content: { type: String, required: true, trim: true },
    mentionUserIds: { type: [{ type: Schema.Types.ObjectId, ref: 'User' }], default: [] },
}, { timestamps: true, collection: 'comments' });
commentSchema.index({ taskId: 1, createdAt: 1 });
export const CommentModel = mongoose.model('Comment', commentSchema);
