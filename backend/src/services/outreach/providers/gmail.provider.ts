import { EmailProvider, SendEmailOptions, SendEmailResult, ProviderStatus } from '../outreach.provider.js';

export interface GmailProviderConfig {
  clientId: string;
  clientSecret: string;
  refreshToken?: string;
  accessToken?: string;
}

/**
 * GmailProvider
 * Interacts directly with the official Google Gmail REST API.
 */
export class GmailProvider implements EmailProvider {
  readonly providerName = 'GMAIL';
  private config: GmailProviderConfig;

  constructor(config: GmailProviderConfig) {
    this.config = config;
  }

  isConfigured(): boolean {
    return Boolean(
      this.config.clientId &&
      this.config.clientSecret &&
      (this.config.refreshToken || this.config.accessToken)
    );
  }

  /**
   * Refreshes access token via Google OAuth2 token endpoint.
   */
  private async getValidAccessToken(): Promise<string> {
    if (this.config.accessToken) {
      return this.config.accessToken;
    }

    if (!this.config.refreshToken) {
      throw new Error('No refresh token or access token available for Gmail.');
    }

    const tokenUrl = 'https://oauth2.googleapis.com/token';
    const params = new URLSearchParams({
      client_id: this.config.clientId,
      client_secret: this.config.clientSecret,
      refresh_token: this.config.refreshToken,
      grant_type: 'refresh_token',
    });

    const res = await fetch(tokenUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params.toString(),
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`Failed to refresh Google OAuth token (${res.status}): ${errText}`);
    }

    const data = await res.json();
    return data.access_token;
  }

  async getStatus(): Promise<ProviderStatus> {
    if (!this.isConfigured()) {
      return {
        isConnected: false,
        provider: 'GMAIL',
        mode: 'unconfigured',
        error: 'Google OAuth credentials or refresh token missing',
      };
    }

    try {
      const token = await this.getValidAccessToken();
      const res = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/profile', {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        return {
          isConnected: false,
          provider: 'GMAIL',
          mode: 'oauth',
          error: `Gmail API authentication failed (${res.status})`,
        };
      }

      const profile = await res.json();
      return {
        isConnected: true,
        email: profile.emailAddress,
        provider: 'GMAIL',
        mode: 'oauth',
      };
    } catch (err: any) {
      return {
        isConnected: false,
        provider: 'GMAIL',
        mode: 'oauth',
        error: err.message,
      };
    }
  }

  async sendEmail(options: SendEmailOptions): Promise<SendEmailResult> {
    const token = await this.getValidAccessToken();

    // Construct standard RFC 2822 email message
    const utf8Subject = `=?utf-8?B?${Buffer.from(options.subject, 'utf-8').toString('base64')}?=`;
    const messageParts = [
      `To: ${options.to}`,
      `Subject: ${utf8Subject}`,
      'MIME-Version: 1.0',
      'Content-Type: text/plain; charset=utf-8',
      'Content-Transfer-Encoding: 7bit',
      '',
      options.body,
    ];

    if (options.replyTo) {
      messageParts.splice(1, 0, `Reply-To: ${options.replyTo}`);
    }

    const rawMessage = messageParts.join('\r\n');
    const encodedMessage = Buffer.from(rawMessage)
      .toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');

    const res = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ raw: encodedMessage }),
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`Gmail API error while sending message (${res.status}): ${errText}`);
    }

    const data = await res.json();

    return {
      success: true,
      messageId: data.id,
      threadId: data.threadId,
      provider: 'GMAIL',
      sentAt: new Date(),
    };
  }
}
