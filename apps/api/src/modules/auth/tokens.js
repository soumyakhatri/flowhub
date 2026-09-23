import { createHash } from 'crypto';
import jwt from 'jsonwebtoken';
import { nanoid } from 'nanoid';
import { env } from '../../config/env.js';
import { unauthorized } from '../../common/errors/AppError.js';
function sign(payload, secret, expiresIn, jwtid) {
    const options = {
        expiresIn: expiresIn,
    };
    if (jwtid) {
        options.jwtid = jwtid;
    }
    return jwt.sign(payload, secret, options);
}
export function hashToken(token) {
    return createHash('sha256').update(token).digest('hex');
}
export function signAccessToken(userId, email) {
    return sign({ sub: userId, email }, env.JWT_ACCESS_SECRET, env.JWT_ACCESS_EXPIRES);
}
export function signRefreshToken(userId) {
    const token = sign({ sub: userId }, env.JWT_REFRESH_SECRET, env.JWT_REFRESH_EXPIRES, nanoid());
    const decoded = jwt.decode(token);
    if (!decoded || typeof decoded === 'string' || typeof decoded.exp !== 'number') {
        throw new Error('Failed to sign refresh token');
    }
    return { token, expiresAt: new Date(decoded.exp * 1000) };
}
export function verifyAccessToken(token) {
    let decoded;
    try {
        decoded = jwt.verify(token, env.JWT_ACCESS_SECRET);
    }
    catch (err) {
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
export function verifyRefreshToken(token) {
    let decoded;
    try {
        decoded = jwt.verify(token, env.JWT_REFRESH_SECRET);
    }
    catch (err) {
        throw err;
    }
    if (typeof decoded === 'string' || typeof decoded.sub !== 'string' || typeof decoded.jti !== 'string') {
        throw unauthorized('Invalid refresh token');
    }
    return { sub: decoded.sub, jti: decoded.jti };
}
