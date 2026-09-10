import type { Request, Response } from 'express';
import fs from 'fs';
import { RequestUploadUrlSchema, ReviewDocumentSchema } from '@crystal/validation';
import { documentsService } from './documents.service.js';
import { getStorageProvider, LocalStorageProvider } from '../../integrations/storage/index.js';

export class DocumentsController {
  async requestUploadUrl(req: Request, res: Response): Promise<void> {
    const parseResult = RequestUploadUrlSchema.safeParse(req.body);
    if (!parseResult.success) {
      res.status(400).json({
        success: false,
        error: 'Validation failed for document upload request',
        details: parseResult.error.format(),
      });
      return;
    }

    const orgId = req.user?.org_id;
    if (!orgId && req.user?.role !== 'super_admin') {
      res.status(400).json({
        success: false,
        error: 'Missing organization context',
      });
      return;
    }

    const ipAddress = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress;

    const result = await documentsService.requestUploadUrl(
      parseResult.data,
      req.user!,
      orgId || 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
      ipAddress
    );

    res.status(201).json({
      success: true,
      data: result,
    });
  }

  async getDownloadUrl(req: Request, res: Response): Promise<void> {
    const id = String(req.params.id);
    const ipAddress = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress;
    const userAgent = req.headers['user-agent'];

    try {
      const result = await documentsService.getDownloadUrl(id, req.user!, ipAddress, userAgent);
      res.json({
        success: true,
        data: result,
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.includes('Forbidden')) {
        res.status(403).json({ success: false, error: msg });
      } else {
        res.status(404).json({ success: false, error: msg });
      }
    }
  }

  async reviewDocument(req: Request, res: Response): Promise<void> {
    const id = String(req.params.id);
    const parseResult = ReviewDocumentSchema.safeParse(req.body);
    if (!parseResult.success) {
      res.status(400).json({
        success: false,
        error: 'Invalid document review payload',
        details: parseResult.error.format(),
      });
      return;
    }

    const ipAddress = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress;

    try {
      const document = await documentsService.reviewDocument(id, parseResult.data, req.user!, ipAddress);
      res.json({
        success: true,
        data: { document },
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      res.status(400).json({ success: false, error: msg });
    }
  }

  async getCaregiverDocuments(req: Request, res: Response): Promise<void> {
    const caregiverId = String(req.params.caregiverId);
    const documents = await documentsService.getCaregiverDocuments(caregiverId);
    res.json({
      success: true,
      data: { documents },
    });
  }

  async getComplianceScore(req: Request, res: Response): Promise<void> {
    const caregiverId = String(req.params.caregiverId);
    const score = await documentsService.getComplianceScore(caregiverId);
    res.json({
      success: true,
      data: { score },
    });
  }

  // ==========================================================================
  // Local File System Driver Handlers (for 100% offline / local functionality)
  // ==========================================================================

  async handleLocalUpload(req: Request, res: Response): Promise<void> {
    const storagePath = req.query.path as string;
    const token = req.query.token as string;

    if (!storagePath || !token) {
      res.status(400).json({ success: false, error: 'Missing path or token' });
      return;
    }

    const provider = getStorageProvider();
    if (provider instanceof LocalStorageProvider) {
      if (!provider.verifyToken(storagePath, token)) {
        res.status(403).json({ success: false, error: 'Invalid or expired upload token' });
        return;
      }

      // Stream request body directly into file on disk
      const fullPath = provider.getAbsoluteFilePath(storagePath);
      const dir = fullPath.substring(0, fullPath.lastIndexOf(/[\/\\]/.exec(fullPath)?.[0] || '/'));
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      const fileStream = fs.createWriteStream(fullPath);
      req.pipe(fileStream);

      fileStream.on('finish', () => {
        res.status(200).json({ success: true, message: 'File saved locally to disk' });
      });

      fileStream.on('error', (err) => {
        res.status(500).json({ success: false, error: err.message });
      });
    } else {
      res.status(400).json({ success: false, error: 'Local upload not supported on cloud driver' });
    }
  }

  async handleLocalDownload(req: Request, res: Response): Promise<void> {
    const storagePath = req.query.path as string;
    const token = req.query.token as string;

    if (!storagePath || !token) {
      res.status(400).json({ success: false, error: 'Missing path or token' });
      return;
    }

    const provider = getStorageProvider();
    if (provider instanceof LocalStorageProvider) {
      if (!provider.verifyToken(storagePath, token)) {
        res.status(403).json({ success: false, error: 'Invalid or expired download token' });
        return;
      }

      const fullPath = provider.getAbsoluteFilePath(storagePath);
      if (!fs.existsSync(fullPath)) {
        res.status(404).json({ success: false, error: 'File not found on disk' });
        return;
      }

      res.sendFile(fullPath);
    } else {
      res.status(400).json({ success: false, error: 'Local download not supported on cloud driver' });
    }
  }
}

export const documentsController = new DocumentsController();
