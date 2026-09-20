import './loadEnv';
import mongoose from 'mongoose';
import { createApp } from './app';
import { env } from './config/env';
import { connectMongo } from './infrastructure/database/mongo';
import { logger } from './infrastructure/logging/logger';

async function main(): Promise<void> {
  if (env.JWT_ACCESS_SECRET === env.JWT_REFRESH_SECRET) {
    logger.warn('JWT access and refresh secrets are identical');
  }

  await connectMongo();
  const app = createApp();
  const server = app.listen(env.PORT, () => {
    logger.info({ port: env.PORT }, 'FlowHub API listening');
  });

  const shutdown = (signal: string): void => {
    logger.info({ signal }, 'shutting down');
    server.close(() => {
      void mongoose.disconnect().finally(() => {
        process.exit(0);
      });
    });
  };

  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));
}

main().catch((err: unknown) => {
  logger.error({ err }, 'failed to start');
  process.exit(1);
});