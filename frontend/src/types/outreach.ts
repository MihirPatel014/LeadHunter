export interface GmailStatus {
  isConnected: boolean;
  email?: string;
  provider: 'GMAIL' | 'MOCK';
  mode: 'oauth' | 'mock' | 'unconfigured';
  hasClientId: boolean;
  hasClientSecret: boolean;
  hasRefreshToken: boolean;
  redirectUri: string;
  error?: string;
}

export interface ConnectGmailRequest {
  clientId?: string;
  clientSecret?: string;
  redirectUri?: string;
  refreshToken?: string;
}

export interface SendEmailRequest {
  leadId?: number;
  recipient: string;
  subject: string;
  body: string;
  isHtml?: boolean;
}

export interface SentMessageItem {
  id: number;
  leadId?: number | null;
  recipient: string;
  subject: string;
  body: string;
  channel: string;
  provider: string;
  messageId?: string | null;
  threadId?: string | null;
  status: string;
  errorMessage?: string | null;
  sentAt: string;
  createdAt: string;
}

export interface SendTestEmailRequest {
  recipient: string;
  subject?: string;
  body?: string;
}

export interface GmailCredentialState {
  hasClientId: boolean;
  hasClientSecret: boolean;
  hasRefreshToken: boolean;
  redirectUri: string;
  connectedEmail: string;
}

export interface TestEmailResult {
  providerUsed: 'GMAIL' | 'MOCK' | string;
  providerMode: 'oauth' | 'mock' | 'unconfigured';
  providerIsConnected: boolean;
  gmailAccount: string;
  credentialState: GmailCredentialState;
  recipient: string;
  subject: string;
  bodyPreview: string;
  sendResult?: {
    success?: boolean;
    sentMessage?: SentMessageItem;
  };
}

export interface SaveGmailCredentialsRequest {
  clientId?: string;
  clientSecret?: string;
  redirectUri?: string;
  refreshToken?: string;
}

export interface SaveGmailCredentialsResponse {
  credentialState: GmailCredentialState;
  authUrl: string | null;
}
