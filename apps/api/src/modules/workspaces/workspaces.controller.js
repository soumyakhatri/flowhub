import { requireUser } from '../../common/middleware/authenticate.js';
import { asyncHandler } from '../../common/utils/asyncHandler.js';
import { routeParam } from '../../common/utils/params.js';
import * as workspacesService from './workspaces.service.js';
export const createWorkspace = asyncHandler(async (req, res) => {
    const user = requireUser(req);
    const data = await workspacesService.createWorkspace(user.id, routeParam(req, 'orgId'), req.body);
    res.status(201).json({ data });
});
export const listWorkspaces = asyncHandler(async (req, res) => {
    const user = requireUser(req);
    const result = await workspacesService.listWorkspaces(user.id, routeParam(req, 'orgId'), req.query);
    res.json(result);
});
export const getWorkspace = asyncHandler(async (req, res) => {
    const user = requireUser(req);
    const data = await workspacesService.getWorkspace(user.id, routeParam(req, 'id'));
    res.json({ data });
});
export const addMember = asyncHandler(async (req, res) => {
    const user = requireUser(req);
    const data = await workspacesService.addMember(user.id, routeParam(req, 'id'), req.body);
    res.status(201).json({ data });
});
