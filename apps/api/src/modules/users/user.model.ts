import mongoose, { Schema } from 'mongoose';

const userSchema = new Schema(
  {
    email: { type: String, required: true, lowercase: true, trim: true },
    name: { type: String, required: true, trim: true },
    passwordHash: { type: String, required: true, select: false },
    avatarUrl: { type: String },
    status: {
      type: String,
      enum: ['active', 'disabled'],
      default: 'active',
      required: true,
    },
  },
  { timestamps: true, collection: 'users' },
);

userSchema.index({ email: 1 }, { unique: true });

export const UserModel = mongoose.model('User', userSchema);