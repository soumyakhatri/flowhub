import { Router } from 'express';
import { validateBody } from '../../common/middleware/validate';
import { login, logout, refresh, register } from './auth.controller';
import { loginSchema, refreshBodySchema, registerSchema } from './auth.schemas';

export const authRouter = Router();

authRouter.post('/register', validateBody(registerSchema), register);
authRouter.post('/login', validateBody(loginSchema), login);
authRouter.post('/refresh', validateBody(refreshBodySchema), refresh);
authRouter.post('/logout', validateBody(refreshBodySchema), logout);