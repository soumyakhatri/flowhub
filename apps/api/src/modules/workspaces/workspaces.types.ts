import type { Types } from 'mongoose';
import type { MembershipRole } from '../../common/utils/roles';

export interface WorkspaceRecord {
  _id: Types.ObjectId;
  organizationId: Types.ObjectId;
  name: string;
  description?: string | null;
  createdBy: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

export interface WorkspaceMemberRecord {
  _id: Types.ObjectId;
  workspaceId: Types.ObjectId;
  userId: Types.ObjectId;
  role: MembershipRole;
  createdAt: Date;
  updatedAt: Date;
}

export interface WorkspaceDto {
  id: string;
  organizationId: string;
  name: string;
  description: string | null;
  createdBy: string;
  role: MembershipRole;
  createdAt: string;
  updatedAt: string;
}