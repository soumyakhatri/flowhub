import type { Types } from 'mongoose';

export interface ProjectRecord {
  _id: Types.ObjectId;
  workspaceId: Types.ObjectId;
  name: string;
  description?: string | null;
  createdBy: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

export interface ProjectDto {
  id: string;
  workspaceId: string;
  name: string;
  description: string | null;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}