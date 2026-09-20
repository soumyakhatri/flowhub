import mongoose, { Schema } from 'mongoose';

const organizationSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true, collection: 'organizations' },
);

organizationSchema.index({ createdBy: 1 });

export const OrganizationModel = mongoose.model('Organization', organizationSchema);