import type { Request, Response } from 'express';
import { esignService } from './esign.service.js';
import { CreateEnvelopeSchema, SubmitSignatureSchema } from '@crystal/validation';
import { AppError } from '../../lib/errors.js';

export class EsignController {
  async createEnvelope(req: Request, res: Response): Promise<void> {
    const orgId = req.orgId || req.body.org_id;

    const parsed = CreateEnvelopeSchema.safeParse({
      ...req.body,
      org_id: orgId,
    });

    if (!parsed.success) {
      throw AppError.unprocessable('Validation failed', parsed.error.flatten().fieldErrors);
    }

    const envelope = await esignService.createEnvelope(parsed.data, req.user!, req.ip);
    res.status(201).json(envelope);
  }

  async getEnvelope(req: Request, res: Response): Promise<void> {
    const id = String(req.params.id);
    const envelope = await esignService.getEnvelope(id);

    if (!envelope) {
      throw AppError.notFound('Signature envelope not found');
    }

    res.status(200).json(envelope);
  }

  async signEnvelope(req: Request, res: Response): Promise<void> {
    const id = String(req.params.id);
    const parsed = SubmitSignatureSchema.safeParse(req.body);

    if (!parsed.success) {
      throw AppError.unprocessable('Validation failed', parsed.error.flatten().fieldErrors);
    }

    const signed = await esignService.signEnvelope(id, parsed.data, req.ip);
    res.status(200).json(signed);
  }

  async handleWebhook(req: Request, res: Response): Promise<void> {
    const provider = String(req.params.provider || 'generic');
    const result = await esignService.processWebhook(provider, req.body);
    res.status(200).json(result);
  }
}

export const esignController = new EsignController();

