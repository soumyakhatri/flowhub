import type { Types } from 'mongoose';

export interface CommentRecord {
  _id: Types.ObjectId;
  taskId: Types.ObjectId;
  authorId: Types.ObjectId;
  content: string;
  mentionUserIds: Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
}

export interface CommentDto {
  id: string;
  taskId: string;
  authorId: string;
  content: string;
  mentionUserIds: string[];
  createdAt: string;
  updatedAt: string;
}