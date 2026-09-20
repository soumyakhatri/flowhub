import { conflict, unauthorized } from '../../common/errors/AppError';
import { isDuplicateKeyError } from '../../common/errors/isDuplicateKey';
import { UserModel } from '../users/user.model';
import { toUserDto } from '../users/users.service';
import type { UserRecord } from '../users/users.types';
import type { AuthResult } from './auth.types';
import type { LoginInput, RegisterInput } from './auth.schemas';
import { hashPassword, verifyPassword } from './password';
import { RefreshTokenModel, type RefreshTokenRecord } from './refreshToken.model';
import { hashToken, signAccessToken, signRefreshToken, verifyRefreshToken } from './tokens';

async function issueSession(user: UserRecord): Promise<AuthResult> {
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

export async function register(input: RegisterInput): Promise<AuthResult> {
  const passwordHash = await hashPassword(input.password);
  try {
    const created = await UserModel.create({
      name: input.name,
      email: input.email,
      passwordHash,
      status: 'active',
    });
    const user = created.toObject() as UserRecord;
    return await issueSession(user);
  } catch (err) {
    if (isDuplicateKeyError(err)) {
      throw conflict('Email already registered');
    }
    throw err;
  }
}

export async function login(input: LoginInput): Promise<AuthResult> {
  const user = await UserModel.findOne({ email: input.email })
    .select('+passwordHash')
    .lean<UserRecord | null>();
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

export async function refresh(rawToken: string): Promise<AuthResult> {
  const payload = verifyRefreshToken(rawToken);
  const tokenHash = hashToken(rawToken);
  const stored = await RefreshTokenModel.findOne({ tokenHash }).lean<RefreshTokenRecord | null>();
  if (!stored) {
    throw unauthorized('Invalid refresh token');
  }
  if (stored.revokedAt) {
    await RefreshTokenModel.updateMany(
      { userId: stored.userId, revokedAt: null },
      { revokedAt: new Date() },
    );
    throw unauthorized('Refresh token reuse detected');
  }
  if (stored.expiresAt.getTime() <= Date.now()) {
    throw unauthorized('Refresh token expired');
  }
  if (stored.userId.toString() !== payload.sub) {
    throw unauthorized('Invalid refresh token');
  }

  const user = await UserModel.findById(payload.sub).lean<UserRecord | null>();
  if (!user || user.status !== 'active') {
    throw unauthorized('Invalid refresh token');
  }

  await RefreshTokenModel.updateOne({ _id: stored._id }, { revokedAt: new Date() });
  return issueSession(user);
}

export async function logout(rawToken: string | undefined): Promise<void> {
  if (!rawToken) {
    return;
  }
  const tokenHash = hashToken(rawToken);
  await RefreshTokenModel.updateOne({ tokenHash, revokedAt: null }, { revokedAt: new Date() });
}