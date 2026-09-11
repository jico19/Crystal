import type { Request, Response } from 'express';
import { authorizationsService } from './authorizations.service.js';
import { CreateAuthorizationSchema, UpdateAuthorizationUnitsSchema } from '@crystal/validation';
import type { AuthorizationStatus } from '@crystal/types';
import { AppError } from '../../lib/errors.js';

export class AuthorizationsController {
  async createClientAuthorization(req: Request, res: Response): Promise<void> {
    const orgId = req.orgId || req.user?.org_id || '';
    const clientId = String(req.params.id);

    const parsed = CreateAuthorizationSchema.safeParse({
      ...req.body,
      client_id: clientId,
    });

    if (!parsed.success) {
      throw AppError.unprocessable('Validation failed', parsed.error.flatten().fieldErrors);
    }

    const auth = await authorizationsService.createAuthorization(
      parsed.data,
      req.user!,
      orgId,
      req.ip
    );

    res.status(201).json(auth);
  }

  async getClientAuthorizations(req: Request, res: Response): Promise<void> {
    const orgId = req.orgId || req.user?.org_id || '';
    const clientId = String(req.params.id);

    const auths = await authorizationsService.getClientAuthorizations(clientId, orgId);
    res.status(200).json(auths);
  }

  async listAuthorizations(req: Request, res: Response): Promise<void> {
    const orgId = req.orgId || req.user?.org_id;
    if (!orgId) {
      throw AppError.badRequest('Organization context required');
    }
    const clientId = req.query.client_id as string | undefined;
    const status = req.query.status as AuthorizationStatus | undefined;
    const limit = req.query.limit ? parseInt(String(req.query.limit), 10) : 50;
    const offset = req.query.offset ? parseInt(String(req.query.offset), 10) : 0;

    const result = await authorizationsService.listAuthorizations({
      org_id: orgId,
      client_id: clientId,
      status,
      limit,
      offset,
    });

    res.status(200).json(result);
  }

  async getBurndown(req: Request, res: Response): Promise<void> {
    const orgId = req.orgId || req.user?.org_id || '';
    const authId = String(req.params.id);

    const summary = await authorizationsService.getBurndownSummary(authId, orgId);
    if (!summary) {
      throw AppError.notFound('Authorization not found');
    }
    res.status(200).json(summary);
  }

  async updateUnits(req: Request, res: Response): Promise<void> {
    const orgId = req.orgId || req.user?.org_id || '';
    const authId = String(req.params.id);

    const parsed = UpdateAuthorizationUnitsSchema.safeParse(req.body);
    if (!parsed.success) {
      throw AppError.unprocessable('Validation failed', parsed.error.flatten().fieldErrors);
    }

    const updated = await authorizationsService.updateUnitsUsed(
      authId,
      orgId,
      parsed.data,
      req.user!,
      req.ip
    );

    if (!updated) {
      throw AppError.notFound('Authorization not found or update unauthorized');
    }

    res.status(200).json(updated);
  }

  async triggerExpirationCheck(_req: Request, res: Response): Promise<void> {
    const counts = await authorizationsService.runExpirationCheck();
    res.status(200).json({
      message: 'Expiration scan completed successfully',
      ...counts,
    });
  }
}

export const authorizationsController = new AuthorizationsController();

