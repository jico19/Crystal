export interface SendEmailParams {
  to: string;
  from?: string;
  subject: string;
  html: string;
  text?: string;
}

export interface SendEmailResult {
  messageId: string;
  provider: 'local' | 'ses';
  timestamp: string;
}

export interface EmailProvider {
  name: 'local' | 'ses';
  sendEmail(params: SendEmailParams): Promise<SendEmailResult>;
}
