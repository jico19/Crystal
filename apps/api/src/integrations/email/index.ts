import type { EmailProvider } from './email.interface.js';
import { LocalEmailProvider } from './local-email.provider.js';
import { SesEmailProvider } from './ses-email.provider.js';
import { env } from '../../config/env.js';

export * from './email.interface.js';
export * from './local-email.provider.js';
export * from './ses-email.provider.js';

let activeEmailProvider: EmailProvider | null = null;

export function getEmailProvider(): EmailProvider {
  if (activeEmailProvider) {
    return activeEmailProvider;
  }

  const driver = env.EMAIL_DRIVER;

  if (driver === 'ses' && env.AWS_ACCESS_KEY_ID && env.AWS_SECRET_ACCESS_KEY) {
    console.log('📧 [Email Provider] Initialized driver: "ses"');
    activeEmailProvider = new SesEmailProvider();
  } else {
    console.log('📧 [Email Provider] Initialized driver: "local" (Zero external cloud dependencies)');
    activeEmailProvider = new LocalEmailProvider();
  }

  return activeEmailProvider;
}

export function setEmailProvider(provider: EmailProvider): void {
  activeEmailProvider = provider;
}
