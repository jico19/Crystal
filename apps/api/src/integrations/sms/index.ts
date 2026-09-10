import type { SmsProvider } from './sms.interface.js';
import { LocalSmsProvider } from './local-sms.provider.js';
import { TwilioSmsProvider } from './twilio-sms.provider.js';

export * from './sms.interface.js';
export * from './local-sms.provider.js';
export * from './twilio-sms.provider.js';

let activeSmsProvider: SmsProvider | null = null;

export function getSmsProvider(): SmsProvider {
  if (activeSmsProvider) {
    return activeSmsProvider;
  }

  const driver = process.env.SMS_DRIVER || 'local';

  if (driver === 'twilio' && process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) {
    console.log('📱 [SMS Provider] Initialized driver: "twilio"');
    activeSmsProvider = new TwilioSmsProvider();
  } else {
    console.log('📱 [SMS Provider] Initialized driver: "local" (Zero external cloud dependencies)');
    activeSmsProvider = new LocalSmsProvider();
  }

  return activeSmsProvider;
}

export function setSmsProvider(provider: SmsProvider): void {
  activeSmsProvider = provider;
}
