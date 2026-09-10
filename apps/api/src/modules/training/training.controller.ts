import type { Request, Response } from 'express';
import { VideoProgressUpdateSchema, QuizSubmissionSchema } from '@crystal/validation';
import { trainingService } from './training.service.js';

export class TrainingController {
  async listModules(req: Request, res: Response): Promise<void> {
    const caregiverId = (req.query.caregiverId as string) || req.user?.id;
    if (!caregiverId) {
      res.status(400).json({ success: false, error: 'Missing caregiver ID context' });
      return;
    }

    const orgId = req.user?.org_id;
    const modules = await trainingService.listModulesWithProgress(caregiverId, orgId);
    res.json({
      success: true,
      data: { modules },
    });
  }

  async updateVideoProgress(req: Request, res: Response): Promise<void> {
    const parseResult = VideoProgressUpdateSchema.safeParse(req.body);
    if (!parseResult.success) {
      res.status(400).json({
        success: false,
        error: 'Invalid video progress payload',
        details: parseResult.error.format(),
      });
      return;
    }

    const caregiverId = (req.body.caregiver_id as string) || req.user?.id;
    if (!caregiverId) {
      res.status(400).json({ success: false, error: 'Missing caregiver ID' });
      return;
    }

    try {
      const progress = await trainingService.updateVideoProgress(caregiverId, parseResult.data);
      res.json({
        success: true,
        data: { progress },
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      res.status(400).json({ success: false, error: msg });
    }
  }

  async submitQuiz(req: Request, res: Response): Promise<void> {
    const parseResult = QuizSubmissionSchema.safeParse(req.body);
    if (!parseResult.success) {
      res.status(400).json({
        success: false,
        error: 'Invalid quiz submission format',
        details: parseResult.error.format(),
      });
      return;
    }

    const caregiverId = (req.body.caregiver_id as string) || req.user?.id;
    if (!caregiverId) {
      res.status(400).json({ success: false, error: 'Missing caregiver ID' });
      return;
    }

    try {
      const result = await trainingService.submitQuiz(caregiverId, parseResult.data);
      res.json({
        success: true,
        data: result,
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      const isLocked = msg.includes('locked') || msg.includes('Anti-skip');
      res.status(isLocked ? 403 : 400).json({ success: false, error: msg });
    }
  }

  async getCertificate(req: Request, res: Response): Promise<void> {
    const id = String(req.params.id);
    try {
      const certificate = await trainingService.getCertificate(id);
      res.json({
        success: true,
        data: { certificate },
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      res.status(404).json({ success: false, error: msg });
    }
  }
}

export const trainingController = new TrainingController();
