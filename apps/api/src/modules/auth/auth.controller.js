import { env } from '../../config/env.js';
import { unauthorized } from '../../common/errors/AppError.js';
import { asyncHandler } from '../../common/utils/asyncHandler.js';
import * as authService from './auth.service.js';
const REFRESH_COOKIE = 'refreshToken';
function cookieOptions(maxAge) {
    return {
        httpOnly: true,
        secure: env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/api/v1/auth',
        maxAge,
    };
}
function setRefreshCookie(res, token, expiresAt) {
    const maxAge = Math.max(0, expiresAt.getTime() - Date.now());
    res.cookie(REFRESH_COOKIE, token, cookieOptions(maxAge));
}
function clearRefreshCookie(res) {
    res.clearCookie(REFRESH_COOKIE, cookieOptions(0));
}
function readRefreshToken(req) {
    const cookies = req.cookies;
    const fromCookie = cookies?.[REFRESH_COOKIE];
    if (typeof fromCookie === 'string' && fromCookie.length > 0) {
        return fromCookie;
    }
    const body = req.body;
    if (typeof body?.refreshToken === 'string' && body.refreshToken.length > 0) {
        return body.refreshToken;
    }
    return undefined;
}
export const register = asyncHandler(async (req, res) => {
    const result = await authService.register(req.body);
    setRefreshCookie(res, result.refreshToken, result.refreshExpiresAt);
    res.status(201).json({
        data: { user: result.user, accessToken: result.accessToken },
    });
});
export const login = asyncHandler(async (req, res) => {
    const result = await authService.login(req.body);
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
