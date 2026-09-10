import crypto from 'crypto';
import type { SmsProvider, SendSmsParams, SendSmsResult } from './sms.interface.js';
import { stripPhiFromSms } from './sms.interface.js';

export class LocalSmsProvider implements SmsProvider {
  readonly name = 'local' as const;

  async sendSms(params: SendSmsParams): Promise<SendSmsResult> {
    const sanitizedBody = stripPhiFromSms(params.body);
    const messageId = `local-sms-${crypto.randomUUID()}`;
    const timestamp = new Date().toISOString();

    console.log(`\n📱 [LocalSmsProvider] Outbound SMS Dispatched (HIPAA Sanitized):`);
    console.log(`   To: ${params.to}`);
    console.log(`   From: ${params.from || '+18005550199'}`);
    console.log(`   Message ID: ${messageId}`);
    console.log(`   Sanitized Body: "${sanitizedBody}"\n`);

    return {
      messageId,
      provider: 'local',
      timestamp,
      sanitizedBody,
    };
  }
}
