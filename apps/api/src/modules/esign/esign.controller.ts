import type { Request, Response } from 'express';
import { esignService } from './esign.service.js';
import { CreateEnvelopeSchema, SubmitSignatureSchema } from '@crystal/validation';

export class EsignController {
  async createEnvelope(req: Request, res: Response): Promise<void> {
    try {
      const user = (req as any).user;
      const orgId = (req as any).orgId || req.body.org_id;

      const parsed = CreateEnvelopeSchema.safeParse({
        ...req.body,
        org_id: orgId,
      });

      if (!parsed.success) {
        res.status(400).json({
          error: 'Validation failed',
          details: parsed.error.issues,
        });
        return;
      }

      const envelope = await esignService.createEnvelope(parsed.data, user, req.ip);
      res.status(201).json(envelope);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      res.status(500).json({ error: msg });
    }
  }

  async getEnvelope(req: Request, res: Response): Promise<void> {
    try {
      const id = String(req.params.id);
      const envelope = await esignService.getEnvelope(id);

      if (!envelope) {
        res.status(404).json({ error: 'Signature envelope not found' });
        return;
      }

      res.status(200).json(envelope);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      res.status(500).json({ error: msg });
    }
  }

  async signEnvelope(req: Request, res: Response): Promise<void> {
    try {
      const id = String(req.params.id);
      const parsed = SubmitSignatureSchema.safeParse(req.body);

      if (!parsed.success) {
        res.status(400).json({
          error: 'Validation failed',
          details: parsed.error.issues,
        });
        return;
      }

      const signed = await esignService.signEnvelope(id, parsed.data, req.ip);
      res.status(200).json(signed);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      res.status(500).json({ error: msg });
    }
  }

  async handleWebhook(req: Request, res: Response): Promise<void> {
    try {
      const provider = String(req.params.provider || 'generic');
      const result = await esignService.processWebhook(provider, req.body);
      res.status(200).json(result);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      res.status(500).json({ error: msg });
    }
  }
}

export const esignController = new EsignController();
