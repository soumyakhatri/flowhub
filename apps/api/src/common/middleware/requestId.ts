import type { RequestHandler } from 'express';
import { nanoid } from 'nanoid';

export const requestId: RequestHandler = (req, res, next) => {
  const header = req.header('x-request-id');
  const id = header && /^[\w-]{1,128}$/.test(header) ? header : nanoid();
  req.requestId = id;
  res.setHeader('X-Request-Id', id);
  next();
};