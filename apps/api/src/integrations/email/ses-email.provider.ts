import crypto from 'crypto';
import { SESClient, SendEmailCommand } from '@aws-sdk/client-ses';
import type { EmailProvider, SendEmailParams, SendEmailResult } from './email.interface.js';

export class SesEmailProvider implements EmailProvider {
  readonly name = 'ses' as const;
  private sesClient: SESClient | null = null;
  private fromEmail: string;

  constructor() {
    const region = process.env.AWS_REGION || 'us-east-1';
    this.fromEmail = process.env.SES_FROM_EMAIL || 'notifications@crystalhomecare.com';

    if (process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY) {
      this.sesClient = new SESClient({
        region,
        credentials: {
          accessKeyId: process.env.AWS_ACCESS_KEY_ID,
          secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
        },
      });
      console.log(`📧 [SesEmailProvider] Initialized production Amazon SES client (Region: ${region})`);
    } else {
      console.warn(
        '⚠️  [SesEmailProvider Warning] AWS credentials missing from environment. Operating in sandbox logging mode.'
      );
    }
  }

  async sendEmail(params: SendEmailParams): Promise<SendEmailResult> {
    const timestamp = new Date().toISOString();

    if (this.sesClient) {
      const command = new SendEmailCommand({
        Source: params.from || this.fromEmail,
        Destination: {
          ToAddresses: [params.to],
        },
        Message: {
          Subject: {
            Data: params.subject,
            Charset: 'UTF-8',
          },
          Body: {
            Html: {
              Data: params.html,
              Charset: 'UTF-8',
            },
            Text: params.text
              ? {
                  Data: params.text,
                  Charset: 'UTF-8',
                }
              : undefined,
          },
        },
      });

      const response = await this.sesClient.send(command);
      return {
        messageId: response.MessageId || `ses-${crypto.randomUUID()}`,
        provider: 'ses',
        timestamp,
      };
    }

    const messageId = `ses-mock-${crypto.randomUUID()}`;
    console.log(`📡 [SesEmailProvider Sandbox] Dispatching email to: ${params.to} | Subject: ${params.subject}`);
    return {
      messageId,
      provider: 'ses',
      timestamp,
    };
  }
}
