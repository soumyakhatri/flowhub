import { Router } from 'express';
import { validateBody } from '../../common/middleware/validate.js';
import { login, logout, refresh, register } from './auth.controller.js';
import { loginSchema, refreshBodySchema, registerSchema } from './auth.schemas.js';
export const authRouter = Router();
authRouter.post('/register', validateBody(registerSchema), register);
authRouter.post('/login', validateBody(loginSchema), login);
authRouter.post('/refresh', validateBody(refreshBodySchema), refresh);
authRouter.post('/logout', validateBody(refreshBodySchema), logout);
