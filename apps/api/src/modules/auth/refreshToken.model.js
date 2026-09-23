import mongoose, { Schema } from 'mongoose';
const refreshTokenSchema = new Schema({
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    tokenHash: { type: String, required: true },
    expiresAt: { type: Date, required: true },
    revokedAt: { type: Date, default: null },
}, { timestamps: { createdAt: true, updatedAt: false }, collection: 'refresh_tokens' });
refreshTokenSchema.index({ tokenHash: 1 }, { unique: true });
export const RefreshTokenModel = mongoose.model('RefreshToken', refreshTokenSchema);
