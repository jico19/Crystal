import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import type { StorageProvider, PresignedUploadResult, PresignedDownloadResult } from './storage.interface.js';
import { env } from '../../config/env.js';

export class LocalStorageProvider implements StorageProvider {
  name = 'local';
  private uploadsDir: string;
  private secret: string;

  constructor() {
    this.uploadsDir = path.resolve(process.cwd(), 'uploads');
    if (!fs.existsSync(this.uploadsDir)) {
      fs.mkdirSync(this.uploadsDir, { recursive: true });
    }
    this.secret = env.JWT_SECRET;
  }

  private generateToken(storagePath: string): string {
    return crypto
      .createHmac('sha256', this.secret)
      .update(storagePath)
      .digest('hex');
  }

  verifyToken(storagePath: string, token: string): boolean {
    const expected = this.generateToken(storagePath);
    return crypto.timingSafeEqual(Buffer.from(token), Buffer.from(expected));
  }

  getAbsoluteFilePath(storagePath: string): string {
    // Sanitize to prevent path traversal
    const safePath = path.normalize(storagePath).replace(/^(\.\.(\/|\\|$))+/, '');
    return path.join(this.uploadsDir, safePath);
  }

  async getUploadUrl(params: {
    storagePath: string;
    mimeType: string;
    maxSizeBytes?: number;
  }): Promise<PresignedUploadResult> {
    const token = this.generateToken(params.storagePath);
    const port = env.PORT;
    const encodedPath = encodeURIComponent(params.storagePath);
    const uploadUrl = `http://localhost:${port}/api/v1/documents/local-storage/upload?path=${encodedPath}&token=${token}`;

    return {
      uploadUrl,
      storagePath: params.storagePath,
      expiresInSeconds: 900,
      httpMethod: 'PUT',
    };
  }

  async getDownloadUrl(params: {
    storagePath: string;
  }): Promise<PresignedDownloadResult> {
    const token = this.generateToken(params.storagePath);
    const port = env.PORT;
    const encodedPath = encodeURIComponent(params.storagePath);
    const downloadUrl = `http://localhost:${port}/api/v1/documents/local-storage/download?path=${encodedPath}&token=${token}`;

    return {
      downloadUrl,
      expiresInSeconds: 900,
    };
  }

  async deleteFile(storagePath: string): Promise<void> {
    const fullPath = this.getAbsoluteFilePath(storagePath);
    if (fs.existsSync(fullPath)) {
      fs.unlinkSync(fullPath);
    }
  }

  async saveFileBuffer(storagePath: string, buffer: Buffer): Promise<void> {
    const fullPath = this.getAbsoluteFilePath(storagePath);
    const dir = path.dirname(fullPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(fullPath, buffer);
  }
}
