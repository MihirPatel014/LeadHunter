import { EmailProvider } from './outreach/outreach.provider.js';
import { GmailProvider } from './outreach/providers/gmail.provider.js';
import { SmtpProvider } from './outreach/providers/smtp.provider.js';
import { MockEmailProvider } from './outreach/providers/mock-email.provider.js';
import {
  WhatsAppProvider,
  OpenWaSession,
  OpenWaQrCode,
  CreateSessionOptions,
} from './outreach/providers/whatsapp.provider.js';
import { GmailService } from './gmail.service.js';
import { SentMessageRepository } from '../repositories/sent-message.repository.js';
import { LeadRepository } from '../repositories/lead.repository.js';
import { config } from '../config/env.js';

export interface SendEmailPayload {
  leadId?: number;
  recipient: string;
  subject: string;
  body: string;
  isHtml?: boolean;
}

export interface SendWhatsAppPayload {
  leadId?: number;
  recipient: string;
  body: string;
}

export class OutreachService {
  private gmailService: GmailService;
  private sentMessageRepo: SentMessageRepository;
  private leadRepo: LeadRepository;
  private whatsappProvider: WhatsAppProvider;

  constructor() {
    this.gmailService = new GmailService();
    this.sentMessageRepo = new SentMessageRepository();
    this.leadRepo = new LeadRepository();
    this.whatsappProvider = new WhatsAppProvider({
      baseUrl: config.openWaBaseUrl,
      apiKey: config.openWaApiKey,
      sessionId: config.openWaSessionId,
      precheckContacts: config.openWaPrecheckContacts,
    });
  }

  /**
   * Returns the active email provider.
   * If Gmail credentials exist, uses GmailProvider; otherwise falls back to MockEmailProvider.
   */
  private getEmailProvider(): EmailProvider {
    // 1. Try SMTP Provider first if configured
    const smtpProvider = new SmtpProvider({
      user: config.smtpUser,
      pass: config.smtpPass,
    });

    if (smtpProvider.isConfigured()) {
      return smtpProvider;
    }

    // 2. Try Gmail OAuth Provider
    const creds = this.gmailService.getCredentials();
    const gmailProvider = new GmailProvider({
      clientId: creds.clientId,
      clientSecret: creds.clientSecret,
      refreshToken: creds.refreshToken,
    });

    if (gmailProvider.isConfigured()) {
      return gmailProvider;
    }

    // 3. Fallback to Mock
    return new MockEmailProvider();
  }

  /**
   * Retrieves Gmail and Outreach service status.
   */
  async getStatus() {
    const provider = this.getEmailProvider();
    const status = await provider.getStatus();
    const creds = this.gmailService.getCredentials();

    return {
      ...status,
      hasClientId: Boolean(creds.clientId),
      hasClientSecret: Boolean(creds.clientSecret),
      hasRefreshToken: Boolean(creds.refreshToken),
      redirectUri: creds.redirectUri,
    };
  }

  /**
   * Retrieves OpenWA WhatsApp gateway status.
   */
  async getWhatsAppStatus() {
    return this.whatsappProvider.getStatus();
  }

  // ────────────────────────────────────────────────────────────────
  // WhatsApp Session Management (OpenWA)
  // ────────────────────────────────────────────────────────────────

  async listWhatsAppSessions(): Promise<OpenWaSession[]> {
    return this.whatsappProvider.listSessions();
  }

  async getWhatsAppSession(sessionId?: string): Promise<OpenWaSession> {
    return this.whatsappProvider.getSession(sessionId);
  }

  async createWhatsAppSession(options: CreateSessionOptions): Promise<OpenWaSession> {
    return this.whatsappProvider.createSession(options);
  }

  async startWhatsAppSession(sessionId?: string): Promise<OpenWaSession> {
    return this.whatsappProvider.startSession(sessionId);
  }

  async stopWhatsAppSession(sessionId?: string): Promise<OpenWaSession> {
    return this.whatsappProvider.stopSession(sessionId);
  }

  async restartWhatsAppSession(sessionId?: string): Promise<OpenWaSession> {
    return this.whatsappProvider.restartSession(sessionId);
  }

  async logoutWhatsAppSession(sessionId?: string): Promise<OpenWaSession> {
    return this.whatsappProvider.logoutSession(sessionId);
  }

  async deleteWhatsAppSession(sessionId?: string): Promise<void> {
    return this.whatsappProvider.deleteSession(sessionId);
  }

  async forceKillWhatsAppSession(sessionId?: string): Promise<OpenWaSession> {
    return this.whatsappProvider.forceKillSession(sessionId);
  }

  async getWhatsAppQrCode(sessionId?: string): Promise<OpenWaQrCode> {
    return this.whatsappProvider.getQrCode(sessionId);
  }

  async requestWhatsAppPairingCode(
    phoneNumber: string,
    sessionId?: string
  ): Promise<{ pairingCode: string }> {
    return this.whatsappProvider.requestPairingCode(phoneNumber, sessionId);
  }

  /**
   * Backend-controlled email dispatch.
   * Logs dispatch to SentMessage database table and updates lead status to CONTACTED.
   */
  async sendEmail(payload: SendEmailPayload) {
    const { leadId, recipient, subject, body, isHtml } = payload;
    const provider = this.getEmailProvider();

    try {
      const result = await provider.sendEmail({
        to: recipient,
        subject,
        body,
        isHtml,
      });

      // 1. Log sent message in DB
      const record = await this.sentMessageRepo.create({
        leadId,
        recipient,
        subject,
        body,
        channel: 'EMAIL',
        provider: result.provider,
        messageId: result.messageId,
        threadId: result.threadId,
        status: 'SENT',
      });

      // 2. Update Lead status to CONTACTED if leadId exists
      if (leadId) {
        try {
          await this.leadRepo.update(leadId, {
            status: 'CONTACTED',
          });
        } catch {
          // Continue even if lead update fails
        }
      }

      return {
        success: true,
        sentMessage: record,
      };
    } catch (err: any) {
      // Record failed dispatch
      const record = await this.sentMessageRepo.create({
        leadId,
        recipient,
        subject,
        body,
        channel: 'EMAIL',
        provider: provider.providerName,
        status: 'FAILED',
        errorMessage: err.message,
      });

      const error: any = new Error(`Failed to send email: ${err.message}`);
      error.statusCode = 502;
      error.details = { recordId: record.id };
      throw error;
    }
  }

  /**
   * Backend-controlled WhatsApp message dispatch.
   */
  async sendWhatsApp(payload: SendWhatsAppPayload) {
    const { leadId, recipient, body } = payload;

    try {
      const result = await this.whatsappProvider.sendMessage({
        to: recipient,
        body,
      });

      if (!result.success) {
        throw new Error(result.error || 'Failed to dispatch WhatsApp message');
      }

      // Log sent message
      const record = await this.sentMessageRepo.create({
        leadId,
        recipient,
        subject: 'WhatsApp Outreach',
        body,
        channel: 'WHATSAPP',
        provider: this.whatsappProvider.providerName,
        messageId: result.messageId,
        status: 'SENT',
      });

      // Update lead status to CONTACTED
      if (leadId) {
        try {
          await this.leadRepo.update(leadId, {
            status: 'CONTACTED',
          });
        } catch {
          // Continue
        }
      }

      return {
        success: true,
        sentMessage: record,
      };
    } catch (err: any) {
      const record = await this.sentMessageRepo.create({
        leadId,
        recipient,
        subject: 'WhatsApp Outreach',
        body,
        channel: 'WHATSAPP',
        provider: this.whatsappProvider.providerName,
        status: 'FAILED',
        errorMessage: err.message,
      });

      const error: any = new Error(`Failed to send WhatsApp message: ${err.message}`);
      error.statusCode = 502;
      error.details = { recordId: record.id };
      throw error;
    }
  }

  /**
   * Lists sent messages history.
   */
  async getSentMessages(leadId?: number) {
    return this.sentMessageRepo.findMany({ leadId });
  }
}
