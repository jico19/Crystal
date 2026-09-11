import type { StorageProvider } from './storage.interface.js';
import { LocalStorageProvider } from './local-storage.provider.js';
import { S3StorageProvider } from './s3-storage.provider.js';
import { env } from '../../config/env.js';

export * from './storage.interface.js';
export * from './local-storage.provider.js';
export * from './s3-storage.provider.js';

let activeStorageProvider: StorageProvider | null = null;

export function getStorageProvider(): StorageProvider {
  if (!activeStorageProvider) {
    const driver = env.STORAGE_DRIVER;
    if (driver === 's3') {
      activeStorageProvider = new S3StorageProvider();
    } else {
      activeStorageProvider = new LocalStorageProvider();
    }
    console.log(`📦 [Storage Provider] Initialized driver: "${activeStorageProvider.name}"`);
  }
  return activeStorageProvider;
}
