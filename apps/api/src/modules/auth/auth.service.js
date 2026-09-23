import { conflict, unauthorized } from '../../common/errors/AppError.js';
import { isDuplicateKeyError } from '../../common/errors/isDuplicateKey.js';
import { UserModel } from '../users/user.model.js';
import { toUserDto } from '../users/users.service.js';
import { hashPassword, verifyPassword } from './password.js';
import { RefreshTokenModel } from './refreshToken.model.js';
import { hashToken, signAccessToken, signRefreshToken, verifyRefreshToken } from './tokens.js';
async function issueSession(user) {
    const userId = user._id.toString();
    const accessToken = signAccessToken(userId, user.email);
    const refresh = signRefreshToken(userId);
    await RefreshTokenModel.create({
        userId: user._id,
        tokenHash: hashToken(refresh.token),
        expiresAt: refresh.expiresAt,
        revokedAt: null,
    });
    return {
        user: toUserDto(user),
        accessToken,
        refreshToken: refresh.token,
        refreshExpiresAt: refresh.expiresAt,
    };
}
export async function register(input) {
    const passwordHash = await hashPassword(input.password);
    try {
        const created = await UserModel.create({
            name: input.name,
            email: input.email,
            passwordHash,
            status: 'active',
        });
        const user = created.toObject();
        return await issueSession(user);
    }
    catch (err) {
        if (isDuplicateKeyError(err)) {
            throw conflict('Email already registered');
        }
        throw err;
    }
}
export async function login(input) {
    const user = await UserModel.findOne({ email: input.email })
        .select('+passwordHash')
        .lean();
    if (!user || !user.passwordHash) {
        throw unauthorized('Invalid email or password');
    }
    const matches = await verifyPassword(input.password, user.passwordHash);
    if (!matches) {
        throw unauthorized('Invalid email or password');
    }
    if (user.status === 'disabled') {
        throw unauthorized('Account disabled');
    }
    return issueSession(user);
}
export async function refresh(rawToken) {
    const payload = verifyRefreshToken(rawToken);
    const tokenHash = hashToken(rawToken);
    const stored = await RefreshTokenModel.findOne({ tokenHash }).lean();
    if (!stored) {
        throw unauthorized('Invalid refresh token');
    }
    if (stored.revokedAt) {
        await RefreshTokenModel.updateMany({ userId: stored.userId, revokedAt: null }, { revokedAt: new Date() });
        throw unauthorized('Refresh token reuse detected');
    }
    if (stored.expiresAt.getTime() <= Date.now()) {
        throw unauthorized('Refresh token expired');
    }
    if (stored.userId.toString() !== payload.sub) {
        throw unauthorized('Invalid refresh token');
    }
    const user = await UserModel.findById(payload.sub).lean();
    if (!user || user.status !== 'active') {
        throw unauthorized('Invalid refresh token');
    }
    await RefreshTokenModel.updateOne({ _id: stored._id }, { revokedAt: new Date() });
    return issueSession(user);
}
export async function logout(rawToken) {
    if (!rawToken) {
        return;
    }
    const tokenHash = hashToken(rawToken);
    await RefreshTokenModel.updateOne({ tokenHash, revokedAt: null }, { revokedAt: new Date() });
}
