import { notFound } from '../../common/errors/AppError';
import { UserModel } from './user.model';
import type { UserDto, UserRecord } from './users.types';

export function toUserDto(user: UserRecord): UserDto {
  return {
    id: user._id.toString(),
    email: user.email,
    name: user.name,
    avatarUrl: user.avatarUrl ?? null,
    status: user.status,
    createdAt: user.createdAt.toISOString(),
    updatedAt: user.updatedAt.toISOString(),
  };
}

export async function getMe(userId: string): Promise<UserDto> {
  const user = await UserModel.findById(userId).lean<UserRecord | null>();
  if (!user) {
    throw notFound('User not found');
  }
  return toUserDto(user);
}