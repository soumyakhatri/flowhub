import pino from 'pino';
import { env } from '../../config/env';

export const logger = pino({
  level: env.LOG_LEVEL,
  base: { service: 'flowhub-api' },
  redact: ['req.headers.authorization', 'req.headers.cookie'],
  ...(env.NODE_ENV === 'development'
    ? {
        transport: {
          target: 'pino-pretty',
          options: { colorize: true, translateTime: 'SYS:standard' },
        },
      }
    : {}),
});