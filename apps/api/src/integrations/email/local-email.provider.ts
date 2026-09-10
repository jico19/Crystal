import crypto from 'crypto';
import type { EmailProvider, SendEmailParams, SendEmailResult } from './email.interface.js';

export class LocalEmailProvider implements EmailProvider {
  readonly name = 'local' as const;

  async sendEmail(params: SendEmailParams): Promise<SendEmailResult> {
    const messageId = `local-mail-${crypto.randomUUID()}`;
    const timestamp = new Date().toISOString();

    console.log(`\n📧 [LocalEmailProvider] Outbound Email Dispatched:`);
    console.log(`   To: ${params.to}`);
    console.log(`   From: ${params.from || 'noreply@crystalcare.health'}`);
    console.log(`   Subject: ${params.subject}`);
    console.log(`   Message ID: ${messageId}`);
    console.log(`   Preview: ${(params.text || params.html).slice(0, 120)}...\n`);

    return {
      messageId,
      provider: 'local',
      timestamp,
    };
  }
}
