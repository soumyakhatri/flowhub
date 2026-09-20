import type { RequestHandler } from 'express';
import { unauthorized } from '../errors/AppError';
import { verifyAccessToken } from '../../modules/auth/tokens';

export const authenticate: RequestHandler = (req, _res, next) => {
  const header = req.header('authorization');
  if (!header || !header.startsWith('Bearer ')) {
    next(unauthorized('Missing access token'));
    return;
  }
  const token = header.slice('Bearer '.length).trim();
  if (!token) {
    next(unauthorized('Missing access token'));
    return;
  }
  try {
    const payload = verifyAccessToken(token);
    req.user = { id: payload.sub, email: payload.email };
    next();
  } catch (err) {
    next(err);
  }
};

export function requireUser(req: { user?: { id: string; email: string } }): {
  id: string;
  email: string;
} {
  if (!req.user) {
    throw unauthorized('Missing access token');
  }
  return req.user;
}