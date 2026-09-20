import { Router } from 'express';
import { authenticate } from '../../common/middleware/authenticate';
import { validateBody, validateParams, validateQuery } from '../../common/middleware/validate';
import { paginationQuerySchema } from '../../common/utils/pagination';
import { createProject, deleteProject, getProject, listProjects, updateProject } from './projects.controller';
import {
  createProjectSchema,
  projectIdParamsSchema,
  updateProjectSchema,
  workspaceProjectParamsSchema,
} from './projects.schemas';

export const projectNestedRouter = Router({ mergeParams: true });
projectNestedRouter.get(
  '/',
  authenticate,
  validateParams(workspaceProjectParamsSchema),
  validateQuery(paginationQuerySchema),
  listProjects,
);
projectNestedRouter.post(
  '/',
  authenticate,
  validateParams(workspaceProjectParamsSchema),
  validateBody(createProjectSchema),
  createProject,
);

export const projectsRouter = Router();
projectsRouter.get('/:id', authenticate, validateParams(projectIdParamsSchema), getProject);
projectsRouter.patch(
  '/:id',
  authenticate,
  validateParams(projectIdParamsSchema),
  validateBody(updateProjectSchema),
  updateProject,
);
projectsRouter.delete('/:id', authenticate, validateParams(projectIdParamsSchema), deleteProject);