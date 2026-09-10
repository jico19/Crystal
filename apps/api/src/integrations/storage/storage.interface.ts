// ============================================================================
// Pluggable Storage Provider Interface (Local Disk vs AWS S3)
// ============================================================================

export interface PresignedUploadResult {
  uploadUrl: string;
  storagePath: string;
  expiresInSeconds: number;
  httpMethod: 'PUT' | 'POST';
}

export interface PresignedDownloadResult {
  downloadUrl: string;
  expiresInSeconds: number;
}

export interface StorageProvider {
  name: string;
  getUploadUrl(params: {
    storagePath: string;
    mimeType: string;
    maxSizeBytes?: number;
  }): Promise<PresignedUploadResult>;
  getDownloadUrl(params: {
    storagePath: string;
  }): Promise<PresignedDownloadResult>;
  deleteFile(storagePath: string): Promise<void>;
}
