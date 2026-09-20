import type { Types } from 'mongoose';
import type { MembershipRole } from '../../common/utils/roles';

export interface OrganizationRecord {
  _id: Types.ObjectId;
  name: string;
  createdBy: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

export interface OrganizationMemberRecord {
  _id: Types.ObjectId;
  organizationId: Types.ObjectId;
  userId: Types.ObjectId;
  role: MembershipRole;
  createdAt: Date;
  updatedAt: Date;
}

export interface OrganizationDto {
  id: string;
  name: string;
  createdBy: string;
  role: MembershipRole;
  createdAt: string;
  updatedAt: string;
}