import cookieParser from 'cookie-parser';
import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import { env } from './config/env';
import { errorHandler } from './common/errors/errorHandler';
import { requestId } from './common/middleware/requestId';
import { isMongoReady } from './infrastructure/database/mongo';
import { logger } from './infrastructure/logging/logger';
import { authRouter } from './modules/auth/auth.routes';
import { commentsRouter } from './modules/comments/comments.routes';
import { organizationsRouter } from './modules/organizations/organizations.routes';
import { projectNestedRouter, projectsRouter } from './modules/projects/projects.routes';
import { taskNestedRouter, tasksRouter } from './modules/tasks/tasks.routes';
import { usersRouter } from './modules/users/users.routes';
import { workspaceNestedRouter, workspacesRouter } from './modules/workspaces/workspaces.routes';

export function createApp(): express.Express {
  const app = express();
  app.disable('x-powered-by');

  const origins = env.CORS_ORIGIN.split(',')
    .map((origin) => origin.trim())
    .filter((origin) => origin.length > 0);

  app.use(helmet());
  app.use(
    cors({
      origin: origins.length === 1 ? origins[0] : origins,
      credentials: true,
      exposedHeaders: ['X-Request-Id'],
    }),
  );
  app.use(express.json({ limit: '1mb' }));
  app.use(cookieParser());
  app.use(requestId);
  app.use((req, res, next) => {
    const started = Date.now();
    res.on('finish', () => {
      logger.info(
        {
          requestId: req.requestId,
          method: req.method,
          path: req.originalUrl,
          status: res.statusCode,
          ms: Date.now() - started,
        },
        'request',
      );
    });
    next();
  });

  app.get('/health', (_req, res) => {
    res.json({ status: 'ok' });
  });

  app.get('/ready', (_req, res) => {
    if (!isMongoReady()) {
      res.status(503).json({ status: 'not_ready' });
      return;
    }
    res.json({ status: 'ok' });
  });

  app.use('/api/v1/auth', authRouter);
  app.use('/api/v1/users', usersRouter);
  app.use('/api/v1/organizations', organizationsRouter);
  app.use('/api/v1/organizations/:orgId/workspaces', workspaceNestedRouter);
  app.use('/api/v1/workspaces', workspacesRouter);
  app.use('/api/v1/workspaces/:workspaceId/projects', projectNestedRouter);
  app.use('/api/v1/projects', projectsRouter);
  app.use('/api/v1/projects/:projectId/tasks', taskNestedRouter);
  app.use('/api/v1/tasks', tasksRouter);
  app.use('/api/v1/tasks/:taskId/comments', commentsRouter);

  app.use((req, res) => {
    res.status(404).json({
      error: {
        code: 'NOT_FOUND',
        message: 'Route not found',
        requestId: req.requestId || 'unknown',
      },
    });
  });

  app.use(errorHandler);
  return app;
}