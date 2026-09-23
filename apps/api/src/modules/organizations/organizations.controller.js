import { requireUser } from '../../common/middleware/authenticate.js';
import { asyncHandler } from '../../common/utils/asyncHandler.js';
import { routeParam } from '../../common/utils/params.js';
import * as organizationsService from './organizations.service.js';
export const createOrganization = asyncHandler(async (req, res) => {
    const user = requireUser(req);
    const data = await organizationsService.createOrganization(user.id, req.body);
    res.status(201).json({ data });
});
export const listOrganizations = asyncHandler(async (req, res) => {
    const user = requireUser(req);
    const result = await organizationsService.listOrganizations(user.id, req.query);
    res.json(result);
});
export const getOrganization = asyncHandler(async (req, res) => {
    const user = requireUser(req);
    const data = await organizationsService.getOrganization(user.id, routeParam(req, 'id'));
    res.json({ data });
});
export const addMember = asyncHandler(async (req, res) => {
    const user = requireUser(req);
    const data = await organizationsService.addMember(user.id, routeParam(req, 'id'), req.body);
    res.status(201).json({ data });
});
