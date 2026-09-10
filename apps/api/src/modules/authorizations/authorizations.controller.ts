import type { Request, Response } from 'express';
import { authorizationsService } from './authorizations.service.js';
import { CreateAuthorizationSchema, UpdateAuthorizationUnitsSchema } from '@crystal/validation';
import type { AuthorizationStatus } from '@crystal/types';

export class AuthorizationsController {
  async createClientAuthorization(req: Request, res: Response): Promise<void> {
    try {
      const user = (req as any).user;
      const orgId = (req as any).orgId;
      const clientId = String(req.params.id);

      const parsed = CreateAuthorizationSchema.safeParse({
        ...req.body,
        client_id: clientId,
      });

      if (!parsed.success) {
        res.status(400).json({
          error: 'Validation failed',
          details: parsed.error.issues,
        });
        return;
      }

      const auth = await authorizationsService.createAuthorization(
        parsed.data,
        user,
        orgId,
        req.ip
      );

      res.status(201).json(auth);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      res.status(500).json({ error: msg });
    }
  }

  async getClientAuthorizations(req: Request, res: Response): Promise<void> {
    try {
      const orgId = (req as any).orgId;
      const clientId = String(req.params.id);

      const auths = await authorizationsService.getClientAuthorizations(clientId, orgId);
      res.status(200).json(auths);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      res.status(500).json({ error: msg });
    }
  }

  async listAuthorizations(req: Request, res: Response): Promise<void> {
    try {
      const orgId = (req as any).orgId;
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
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      res.status(500).json({ error: msg });
    }
  }

  async getBurndown(req: Request, res: Response): Promise<void> {
    try {
      const orgId = (req as any).orgId;
      const authId = String(req.params.id);

      const summary = await authorizationsService.getBurndownSummary(authId, orgId);
      res.status(200).json(summary);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      res.status(404).json({ error: msg });
    }
  }

  async updateUnits(req: Request, res: Response): Promise<void> {
    try {
      const user = (req as any).user;
      const orgId = (req as any).orgId;
      const authId = String(req.params.id);

      const parsed = UpdateAuthorizationUnitsSchema.safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({
          error: 'Validation failed',
          details: parsed.error.issues,
        });
        return;
      }

      const updated = await authorizationsService.updateUnitsUsed(
        authId,
        orgId,
        parsed.data,
        user,
        req.ip
      );

      res.status(200).json(updated);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      res.status(500).json({ error: msg });
    }
  }

  async triggerExpirationCheck(req: Request, res: Response): Promise<void> {
    try {
      const counts = await authorizationsService.runExpirationCheck();
      res.status(200).json({
        message: 'Expiration scan completed successfully',
        ...counts,
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      res.status(500).json({ error: msg });
    }
  }
}

export const authorizationsController = new AuthorizationsController();
