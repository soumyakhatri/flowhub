import type { Request } from 'express';
import { badRequest } from '../errors/AppError';

export function routeParam(req: Request, name: string): string {
  const value = req.params[name];
  if (!value) {
    throw badRequest('Missing route parameter: ' + name);
  }
  return value;
}