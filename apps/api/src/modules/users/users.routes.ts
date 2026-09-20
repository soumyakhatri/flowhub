import { Router } from 'express';
import { authenticate } from '../../common/middleware/authenticate';
import { getMe } from './users.controller';

export const usersRouter = Router();

usersRouter.get('/me', authenticate, getMe);