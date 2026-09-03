import { Router } from 'express';
import { getOrganizationByDomainController } from './organizations.controller.js';

export const organizationsRouter = Router();

// GET /api/v1/organizations/by-domain?domain=withopenhands.com
organizationsRouter.get('/by-domain', getOrganizationByDomainController);
