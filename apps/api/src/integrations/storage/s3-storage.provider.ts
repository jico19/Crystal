import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import type { StorageProvider, PresignedUploadResult, PresignedDownloadResult } from './storage.interface.js';

export class S3StorageProvider implements StorageProvider {
  name = 's3';
  private bucket: string;
  private region: string;
  private s3Client: S3Client | null = null;

  constructor() {
    this.bucket = process.env.AWS_S3_BUCKET || 'crystal-prod-documents-secure';
    this.region = process.env.AWS_REGION || 'us-east-1';

    if (process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY) {
      this.s3Client = new S3Client({
        region: this.region,
        credentials: {
          accessKeyId: process.env.AWS_ACCESS_KEY_ID,
          secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
        },
      });
      console.log(`📦 [S3StorageProvider] Initialized production AWS S3 client (Region: ${this.region}, Bucket: ${this.bucket})`);
    } else {
      console.warn(
        '⚠️  [S3StorageProvider Warning] AWS S3 credentials not found in env. S3 driver operating in simulated mock mode.'
      );
    }
  }

  async getUploadUrl(params: {
    storagePath: string;
    mimeType: string;
    maxSizeBytes?: number;
  }): Promise<PresignedUploadResult> {
    if (this.s3Client) {
      const command = new PutObjectCommand({
        Bucket: this.bucket,
        Key: params.storagePath,
        ContentType: params.mimeType,
        ServerSideEncryption: 'aws:kms',
      });
      const uploadUrl = await getSignedUrl(this.s3Client, command, { expiresIn: 900 });
      return {
        uploadUrl,
        storagePath: params.storagePath,
        expiresInSeconds: 900,
        httpMethod: 'PUT',
      };
    }

    const uploadUrl = `https://${this.bucket}.s3.${this.region}.amazonaws.com/${params.storagePath}?mock_presigned_upload=true`;
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
    if (this.s3Client) {
      const command = new GetObjectCommand({
        Bucket: this.bucket,
        Key: params.storagePath,
      });
      const downloadUrl = await getSignedUrl(this.s3Client, command, { expiresIn: 900 });
      return {
        downloadUrl,
        expiresInSeconds: 900,
      };
    }

    const downloadUrl = `https://${this.bucket}.s3.${this.region}.amazonaws.com/${params.storagePath}?mock_presigned_download=true`;
    return {
      downloadUrl,
      expiresInSeconds: 900,
    };
  }

  async deleteFile(storagePath: string): Promise<void> {
    if (this.s3Client) {
      await this.s3Client.send(
        new DeleteObjectCommand({
          Bucket: this.bucket,
          Key: storagePath,
        })
      );
      return;
    }
    console.log(`[S3StorageProvider] S3 Delete requested for key: ${storagePath} in bucket: ${this.bucket}`);
  }
}
