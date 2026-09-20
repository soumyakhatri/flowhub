import { requireUser } from '../../common/middleware/authenticate';
import { asyncHandler } from '../../common/utils/asyncHandler';
import { routeParam } from '../../common/utils/params';
import type { PaginationQuery } from '../../common/utils/pagination';
import type { AddWorkspaceMemberInput, CreateWorkspaceInput } from './workspaces.schemas';
import * as workspacesService from './workspaces.service';

export const createWorkspace = asyncHandler(async (req, res) => {
  const user = requireUser(req);
  const data = await workspacesService.createWorkspace(
    user.id,
    routeParam(req, 'orgId'),
    req.body as CreateWorkspaceInput,
  );
  res.status(201).json({ data });
});

export const listWorkspaces = asyncHandler(async (req, res) => {
  const user = requireUser(req);
  const result = await workspacesService.listWorkspaces(
    user.id,
    routeParam(req, 'orgId'),
    req.query as unknown as PaginationQuery,
  );
  res.json(result);
});

export const getWorkspace = asyncHandler(async (req, res) => {
  const user = requireUser(req);
  const data = await workspacesService.getWorkspace(user.id, routeParam(req, 'id'));
  res.json({ data });
});

export const addMember = asyncHandler(async (req, res) => {
  const user = requireUser(req);
  const data = await workspacesService.addMember(
    user.id,
    routeParam(req, 'id'),
    req.body as AddWorkspaceMemberInput,
  );
  res.status(201).json({ data });
});