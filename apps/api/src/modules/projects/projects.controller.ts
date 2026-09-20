import { requireUser } from '../../common/middleware/authenticate';
import { asyncHandler } from '../../common/utils/asyncHandler';
import { routeParam } from '../../common/utils/params';
import type { PaginationQuery } from '../../common/utils/pagination';
import type { CreateProjectInput, UpdateProjectInput } from './projects.schemas';
import * as projectsService from './projects.service';

export const createProject = asyncHandler(async (req, res) => {
  const user = requireUser(req);
  const data = await projectsService.createProject(
    user.id,
    routeParam(req, 'workspaceId'),
    req.body as CreateProjectInput,
  );
  res.status(201).json({ data });
});

export const listProjects = asyncHandler(async (req, res) => {
  const user = requireUser(req);
  const result = await projectsService.listProjects(
    user.id,
    routeParam(req, 'workspaceId'),
    req.query as unknown as PaginationQuery,
  );
  res.json(result);
});

export const getProject = asyncHandler(async (req, res) => {
  const user = requireUser(req);
  const data = await projectsService.getProject(user.id, routeParam(req, 'id'));
  res.json({ data });
});

export const updateProject = asyncHandler(async (req, res) => {
  const user = requireUser(req);
  const data = await projectsService.updateProject(
    user.id,
    routeParam(req, 'id'),
    req.body as UpdateProjectInput,
  );
  res.json({ data });
});

export const deleteProject = asyncHandler(async (req, res) => {
  const user = requireUser(req);
  await projectsService.deleteProject(user.id, routeParam(req, 'id'));
  res.status(204).send();
});