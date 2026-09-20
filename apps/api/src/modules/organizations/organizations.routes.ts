import { Router } from 'express';
import { authenticate } from '../../common/middleware/authenticate';
import { validateBody, validateParams, validateQuery } from '../../common/middleware/validate';
import { paginationQuerySchema } from '../../common/utils/pagination';
import { addMember, createOrganization, getOrganization, listOrganizations } from './organizations.controller';
import {
  addOrganizationMemberSchema,
  createOrganizationSchema,
  organizationIdParamsSchema,
} from './organizations.schemas';

export const organizationsRouter = Router();

organizationsRouter.post('/', authenticate, validateBody(createOrganizationSchema), createOrganization);
organizationsRouter.get('/', authenticate, validateQuery(paginationQuerySchema), listOrganizations);
organizationsRouter.get('/:id', authenticate, validateParams(organizationIdParamsSchema), getOrganization);
organizationsRouter.post(
  '/:id/members',
  authenticate,
  validateParams(organizationIdParamsSchema),
  validateBody(addOrganizationMemberSchema),
  addMember,
);