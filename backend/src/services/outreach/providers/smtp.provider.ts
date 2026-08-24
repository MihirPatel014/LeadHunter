import nodemailer from 'nodemailer';
import { EmailProvider, SendEmailOptions, SendEmailResult, ProviderStatus } from '../outreach.provider.js';

export interface SmtpProviderConfig {
  user: string;
  pass: string;
}

/**
 * SmtpProvider
 * Interacts with SMTP using App Password (specifically tuned for Gmail SMTP).
 */
export class SmtpProvider implements EmailProvider {
  readonly providerName = 'SMTP';
  private config: SmtpProviderConfig;
  private transporter: nodemailer.Transporter;

  constructor(config: SmtpProviderConfig) {
    this.config = config;
    
    // Defaulting to Gmail SMTP host
    this.transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 465,
      secure: true, // true for 465, false for other ports
      auth: {
        user: this.config.user,
        pass: this.config.pass,
      },
    });
  }

  isConfigured(): boolean {
    return Boolean(this.config.user && this.config.pass);
  }

  async getStatus(): Promise<ProviderStatus> {
    if (!this.isConfigured()) {
      return {
        isConnected: false,
        provider: 'SMTP',
        mode: 'unconfigured',
        error: 'SMTP credentials (user/pass) missing',
      };
    }

    try {
      // Verify connection configuration
      await this.transporter.verify();
      
      return {
        isConnected: true,
        email: this.config.user,
        provider: 'SMTP',
        mode: 'oauth', // Keeping this for frontend UI compatibility
      };
    } catch (err: any) {
      return {
        isConnected: false,
        provider: 'SMTP',
        mode: 'unconfigured',
        error: err.message,
      };
    }
  }

  async sendEmail(options: SendEmailOptions): Promise<SendEmailResult> {
    if (!this.isConfigured()) {
      throw new Error('SMTP is not configured.');
    }

    try {
      const info = await this.transporter.sendMail({
        from: this.config.user,
        to: options.to,
        replyTo: options.replyTo,
        subject: options.subject,
        text: !options.isHtml ? options.body : undefined,
        html: options.isHtml ? options.body : undefined,
      });

      return {
        success: true,
        messageId: info.messageId,
        provider: 'SMTP',
        sentAt: new Date(),
      };
    } catch (err: any) {
      throw new Error(`SMTP API error while sending message: ${err.message}`);
    }
  }
}
