import { createHash } from 'crypto';
import jwt, { type SignOptions } from 'jsonwebtoken';
import { nanoid } from 'nanoid';
import { env } from '../../config/env';
import { unauthorized } from '../../common/errors/AppError';
import type { AccessTokenPayload, RefreshTokenPayload } from './auth.types';

function sign(payload: object, secret: string, expiresIn: string, jwtid?: string): string {
  const options: SignOptions = {
    expiresIn: expiresIn as SignOptions['expiresIn'],
  };
  if (jwtid) {
    options.jwtid = jwtid;
  }
  return jwt.sign(payload, secret, options);
}

export function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

export function signAccessToken(userId: string, email: string): string {
  return sign({ sub: userId, email }, env.JWT_ACCESS_SECRET, env.JWT_ACCESS_EXPIRES);
}

export function signRefreshToken(userId: string): { token: string; expiresAt: Date } {
  const token = sign({ sub: userId }, env.JWT_REFRESH_SECRET, env.JWT_REFRESH_EXPIRES, nanoid());
  const decoded = jwt.decode(token);
  if (!decoded || typeof decoded === 'string' || typeof decoded.exp !== 'number') {
    throw new Error('Failed to sign refresh token');
  }
  return { token, expiresAt: new Date(decoded.exp * 1000) };
}

export function verifyAccessToken(token: string): AccessTokenPayload {
  let decoded: jwt.JwtPayload | string;
  try {
    decoded = jwt.verify(token, env.JWT_ACCESS_SECRET);
  } catch (err) {
    throw err;
  }
  if (typeof decoded === 'string' || typeof decoded.sub !== 'string') {
    throw unauthorized('Invalid access token');
  }
  const email = decoded['email'];
  if (typeof email !== 'string') {
    throw unauthorized('Invalid access token');
  }
  return { sub: decoded.sub, email };
}

export function verifyRefreshToken(token: string): RefreshTokenPayload {
  let decoded: jwt.JwtPayload | string;
  try {
    decoded = jwt.verify(token, env.JWT_REFRESH_SECRET);
  } catch (err) {
    throw err;
  }
  if (typeof decoded === 'string' || typeof decoded.sub !== 'string' || typeof decoded.jti !== 'string') {
    throw unauthorized('Invalid refresh token');
  }
  return { sub: decoded.sub, jti: decoded.jti };
}