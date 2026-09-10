import crypto from 'crypto';
import type { SmsProvider, SendSmsParams, SendSmsResult } from './sms.interface.js';
import { stripPhiFromSms } from './sms.interface.js';

export class TwilioSmsProvider implements SmsProvider {
  readonly name = 'twilio' as const;
  private accountSid: string | undefined;
  private authToken: string | undefined;
  private fromNumber: string;

  constructor() {
    this.accountSid = process.env.TWILIO_ACCOUNT_SID;
    this.authToken = process.env.TWILIO_AUTH_TOKEN;
    this.fromNumber = process.env.TWILIO_PHONE_NUMBER || '+15550199000';

    if (this.accountSid && this.authToken) {
      console.log(`📱 [TwilioSmsProvider] Initialized production Twilio SMS client (Account: ${this.accountSid.slice(0, 8)}...)`);
    } else {
      console.warn(
        '⚠️  [TwilioSmsProvider Warning] Twilio credentials missing from environment. Operating in sandbox logging mode.'
      );
    }
  }

  async sendSms(params: SendSmsParams): Promise<SendSmsResult> {
    // 1. Mandatory HIPAA PHI Sanitization filter
    const sanitizedBody = stripPhiFromSms(params.body);
    const timestamp = new Date().toISOString();

    if (this.accountSid && this.authToken) {
      try {
        const url = `https://api.twilio.com/2010-04-01/Accounts/${this.accountSid}/Messages.json`;
        const auth = Buffer.from(`${this.accountSid}:${this.authToken}`).toString('base64');

        const formData = new URLSearchParams();
        formData.append('To', params.to);
        formData.append('From', this.fromNumber);
        formData.append('Body', sanitizedBody);

        const response = await fetch(url, {
          method: 'POST',
          headers: {
            Authorization: `Basic ${auth}`,
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: formData.toString(),
        });

        const data = await response.json() as { sid?: string; message?: string };
        if (!response.ok) {
          throw new Error(data.message || `Twilio SMS dispatch failed with status ${response.status}`);
        }

        return {
          messageId: data.sid || `twilio-${crypto.randomUUID()}`,
          provider: 'twilio',
          timestamp,
          sanitizedBody,
        };
      } catch (err: unknown) {
        const errorMsg = err instanceof Error ? err.message : String(err);
        console.error(`❌ [TwilioSmsProvider Error] Dispatch failed: ${errorMsg}`);
        throw err;
      }
    }

    const messageId = `twilio-mock-${crypto.randomUUID()}`;
    console.log(`📡 [TwilioSmsProvider Sandbox] Dispatching SMS to: ${params.to} | Sanitized Text: "${sanitizedBody}"`);

    return {
      messageId,
      provider: 'twilio',
      timestamp,
      sanitizedBody,
    };
  }
}
