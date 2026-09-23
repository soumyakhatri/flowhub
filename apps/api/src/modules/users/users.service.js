import { notFound } from '../../common/errors/AppError.js';
import { UserModel } from './user.model.js';
export function toUserDto(user) {
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
export async function getMe(userId) {
    const user = await UserModel.findById(userId).lean();
    if (!user) {
        throw notFound('User not found');
    }
    return toUserDto(user);
}
