export type UserStatus = 'active' | 'disabled';

export interface UserDto {
  id: string;
  email: string;
  name: string;
  avatarUrl: string | null;
  status: UserStatus;
  createdAt: string;
  updatedAt: string;
}

export interface UserRecord {
  _id: { toString(): string };
  email: string;
  name: string;
  passwordHash?: string;
  avatarUrl?: string | null;
  status: UserStatus;
  createdAt: Date;
  updatedAt: Date;
}