import type { CookieOptions, Response } from 'express';
import { env } from '../../config/env';
import { unauthorized } from '../../common/errors/AppError';
import { asyncHandler } from '../../common/utils/asyncHandler';
import type { LoginInput, RegisterInput } from './auth.schemas';
import * as authService from './auth.service';

const REFRESH_COOKIE = 'refreshToken';

function cookieOptions(maxAge: number): CookieOptions {
  return {
    httpOnly: true,
    secure: env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/api/v1/auth',
    maxAge,
  };
}

function setRefreshCookie(res: Response, token: string, expiresAt: Date): void {
  const maxAge = Math.max(0, expiresAt.getTime() - Date.now());
  res.cookie(REFRESH_COOKIE, token, cookieOptions(maxAge));
}

function clearRefreshCookie(res: Response): void {
  res.clearCookie(REFRESH_COOKIE, cookieOptions(0));
}

function readRefreshToken(req: { cookies?: unknown; body?: unknown }): string | undefined {
  const cookies = req.cookies as Record<string, unknown> | undefined;
  const fromCookie = cookies?.[REFRESH_COOKIE];
  if (typeof fromCookie === 'string' && fromCookie.length > 0) {
    return fromCookie;
  }
  const body = req.body as { refreshToken?: unknown } | undefined;
  if (typeof body?.refreshToken === 'string' && body.refreshToken.length > 0) {
    return body.refreshToken;
  }
  return undefined;
}

export const register = asyncHandler(async (req, res) => {
  const result = await authService.register(req.body as RegisterInput);
  setRefreshCookie(res, result.refreshToken, result.refreshExpiresAt);
  res.status(201).json({
    data: { user: result.user, accessToken: result.accessToken },
  });
});

export const login = asyncHandler(async (req, res) => {
  const result = await authService.login(req.body as LoginInput);
  setRefreshCookie(res, result.refreshToken, result.refreshExpiresAt);
  res.json({
    data: { user: result.user, accessToken: result.accessToken },
  });
});

export const refresh = asyncHandler(async (req, res) => {
  const token = readRefreshToken(req);
  if (!token) {
    throw unauthorized('Missing refresh token');
  }
  const result = await authService.refresh(token);
  setRefreshCookie(res, result.refreshToken, result.refreshExpiresAt);
  res.json({
    data: { user: result.user, accessToken: result.accessToken },
  });
});

export const logout = asyncHandler(async (req, res) => {
  const token = readRefreshToken(req);
  await authService.logout(token);
  clearRefreshCookie(res);
  res.status(204).send();
});