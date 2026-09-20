import { Router } from 'express';
import { authenticate } from '../../common/middleware/authenticate';
import { validateBody, validateParams, validateQuery } from '../../common/middleware/validate';
import { paginationQuerySchema } from '../../common/utils/pagination';
import {
  addWorkspaceMemberSchema,
  createWorkspaceSchema,
  orgWorkspaceParamsSchema,
  workspaceIdParamsSchema,
} from './workspaces.schemas';
import { addMember, createWorkspace, getWorkspace, listWorkspaces } from './workspaces.controller';

export const workspaceNestedRouter = Router({ mergeParams: true });
workspaceNestedRouter.post(
  '/',
  authenticate,
  validateParams(orgWorkspaceParamsSchema),
  validateBody(createWorkspaceSchema),
  createWorkspace,
);
workspaceNestedRouter.get(
  '/',
  authenticate,
  validateParams(orgWorkspaceParamsSchema),
  validateQuery(paginationQuerySchema),
  listWorkspaces,
);

export const workspacesRouter = Router();
workspacesRouter.get('/:id', authenticate, validateParams(workspaceIdParamsSchema), getWorkspace);
workspacesRouter.post(
  '/:id/members',
  authenticate,
  validateParams(workspaceIdParamsSchema),
  validateBody(addWorkspaceMemberSchema),
  addMember,
);