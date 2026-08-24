export interface SendEmailOptions {
  to: string;
  subject: string;
  body: string;
  isHtml?: boolean;
  replyTo?: string;
}

export interface SendEmailResult {
  success: boolean;
  messageId?: string;
  threadId?: string;
  provider: string;
  sentAt: Date;
  error?: string;
}

export interface ProviderStatus {
  isConnected: boolean;
  email?: string;
  provider: string;
  mode: 'oauth' | 'mock' | 'unconfigured';
  error?: string;
}

export interface EmailProvider {
  readonly providerName: string;
  getStatus(): Promise<ProviderStatus>;
  sendEmail(options: SendEmailOptions): Promise<SendEmailResult>;
}
