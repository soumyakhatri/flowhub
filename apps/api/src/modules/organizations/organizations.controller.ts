import { requireUser } from '../../common/middleware/authenticate';
import { asyncHandler } from '../../common/utils/asyncHandler';
import { routeParam } from '../../common/utils/params';
import type { PaginationQuery } from '../../common/utils/pagination';
import type { AddOrganizationMemberInput, CreateOrganizationInput } from './organizations.schemas';
import * as organizationsService from './organizations.service';

export const createOrganization = asyncHandler(async (req, res) => {
  const user = requireUser(req);
  const data = await organizationsService.createOrganization(user.id, req.body as CreateOrganizationInput);
  res.status(201).json({ data });
});

export const listOrganizations = asyncHandler(async (req, res) => {
  const user = requireUser(req);
  const result = await organizationsService.listOrganizations(user.id, req.query as unknown as PaginationQuery);
  res.json(result);
});

export const getOrganization = asyncHandler(async (req, res) => {
  const user = requireUser(req);
  const data = await organizationsService.getOrganization(user.id, routeParam(req, 'id'));
  res.json({ data });
});

export const addMember = asyncHandler(async (req, res) => {
  const user = requireUser(req);
  const data = await organizationsService.addMember(
    user.id,
    routeParam(req, 'id'),
    req.body as AddOrganizationMemberInput,
  );
  res.status(201).json({ data });
});