import { Request, Response, NextFunction } from 'express';
import { OutreachService } from '../services/outreach.service.js';
import { GmailService } from '../services/gmail.service.js';
import { sendEmailSchema, updateGmailCredentialsSchema } from '../validators/outreach.validator.js';
import { z } from 'zod';

const sendWhatsAppSchema = z.object({
  leadId: z.number().int().positive().optional(),
  recipient: z.string().min(1, 'Recipient phone number is required'),
  body: z.string().min(1, 'Message body is required').max(4096, 'OpenWA text messages are limited to 4096 characters'),
});

const createSessionSchema = z.object({
  name: z.string().min(3, 'Session name must be at least 3 characters').max(50, 'Session name must be at most 50 characters'),
  autoRejectCalls: z.boolean().optional(),
  maxReconnectAttempts: z.number().int().min(0).max(20).nullable().optional(),
  reconnectBaseDelay: z.number().int().min(1000).max(300000).optional(),
  proxyUrl: z.string().optional(),
  proxyType: z.enum(['http', 'https', 'socks4', 'socks5']).optional(),
});

const pairingCodeSchema = z.object({
  phoneNumber: z.string().min(1, 'Phone number is required'),
});

export class OutreachController {
  private outreachService: OutreachService;
  private gmailService: GmailService;

  constructor() {
    this.outreachService = new OutreachService();
    this.gmailService = new GmailService();
  }

  /**
   * GET /api/integrations/gmail/status
   */
  getGmailStatus = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const status = await this.outreachService.getStatus();
      const creds = this.gmailService.getCredentials();
      // Return the EXACT configured redirect URI so frontend can display it for Google Cloud Console copy-paste
      res.status(200).json({
        success: true,
        data: {
          ...status,
          redirectUri: creds.redirectUri || status.redirectUri,
          connectedEmail: creds.connectedEmail || status.email,
        },
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * GET /api/integrations/whatsapp/status
   */
  getWhatsAppStatus = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const status = await this.outreachService.getWhatsAppStatus();
      res.status(200).json({
        success: true,
        data: status,
      });
    } catch (error) {
      next(error);
    }
  };

  // ────────────────────────────────────────────────────────────────
  // WhatsApp Session Management (OpenWA Gateway)
  // ────────────────────────────────────────────────────────────────

  /**
   * GET /api/integrations/whatsapp/sessions
   */
  listWhatsAppSessions = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const sessions = await this.outreachService.listWhatsAppSessions();
      res.status(200).json({ success: true, data: sessions });
    } catch (error) {
      next(error);
    }
  };

  /**
   * GET /api/integrations/whatsapp/sessions/:sessionId
   */
  getWhatsAppSession = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const session = await this.outreachService.getWhatsAppSession(String(req.params.sessionId));
      res.status(200).json({ success: true, data: session });
    } catch (error) {
      next(error);
    }
  };

  /**
   * POST /api/integrations/whatsapp/sessions
   */
  createWhatsAppSession = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const validated = createSessionSchema.parse(req.body);
      const session = await this.outreachService.createWhatsAppSession(validated);
      res.status(201).json({ success: true, data: session });
    } catch (error) {
      next(error);
    }
  };

  /**
   * POST /api/integrations/whatsapp/sessions/:sessionId/start
   */
  startWhatsAppSession = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const session = await this.outreachService.startWhatsAppSession(String(req.params.sessionId));
      res.status(200).json({ success: true, data: session });
    } catch (error) {
      next(error);
    }
  };

  /**
   * POST /api/integrations/whatsapp/sessions/:sessionId/stop
   */
  stopWhatsAppSession = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const session = await this.outreachService.stopWhatsAppSession(String(req.params.sessionId));
      res.status(200).json({ success: true, data: session });
    } catch (error) {
      next(error);
    }
  };

  /**
   * POST /api/integrations/whatsapp/sessions/:sessionId/restart
   */
  restartWhatsAppSession = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const session = await this.outreachService.restartWhatsAppSession(String(req.params.sessionId));
      res.status(200).json({ success: true, data: session });
    } catch (error) {
      next(error);
    }
  };

  /**
   * POST /api/integrations/whatsapp/sessions/:sessionId/logout
   */
  logoutWhatsAppSession = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const session = await this.outreachService.logoutWhatsAppSession(String(req.params.sessionId));
      res.status(200).json({ success: true, data: session });
    } catch (error) {
      next(error);
    }
  };

  /**
   * DELETE /api/integrations/whatsapp/sessions/:sessionId
   */
  deleteWhatsAppSession = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      await this.outreachService.deleteWhatsAppSession(String(req.params.sessionId));
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  };

  /**
   * POST /api/integrations/whatsapp/sessions/:sessionId/force-kill
   */
  forceKillWhatsAppSession = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const session = await this.outreachService.forceKillWhatsAppSession(String(req.params.sessionId));
      res.status(200).json({ success: true, data: session });
    } catch (error) {
      next(error);
    }
  };

  /**
   * GET /api/integrations/whatsapp/qr
   * Query: ?sessionId=xxx (optional — falls back to env OPENWA_SESSION_ID)
   */
  getWhatsAppQrCode = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const sessionId = (req.query.sessionId as string) || undefined;
      const qr = await this.outreachService.getWhatsAppQrCode(sessionId);
      res.status(200).json({ success: true, data: qr });
    } catch (error) {
      next(error);
    }
  };

  /**
   * POST /api/integrations/whatsapp/pairing-code
   * Alternative to QR: request 8-char pairing code by phone number
   */
  requestWhatsAppPairingCode = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { phoneNumber } = pairingCodeSchema.parse(req.body);
      const sessionId = (req.query.sessionId as string) || undefined;
      const result = await this.outreachService.requestWhatsAppPairingCode(phoneNumber, sessionId);
      res.status(201).json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  };

  /**
   * POST /api/integrations/gmail/save-credentials
   * Saves Gmail OAuth credentials (client ID, secret, redirect URI, refresh token) to DB.
   * Returns the resulting credential state + (if enough creds exist) the OAuth auth URL.
   */
  saveGmailCredentials = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const validated = updateGmailCredentialsSchema.parse(req.body);
      await this.gmailService.updateCredentials(validated);
      await this.gmailService.reloadCredentials();

      const creds = this.gmailService.getCredentials();
      let authUrl: string | null = null;
      try {
        authUrl = creds.clientId ? this.gmailService.getAuthUrl() : null;
      } catch {
        authUrl = null;
      }

      res.status(200).json({
        success: true,
        message: 'Gmail credentials saved to database',
        data: {
          credentialState: {
            hasClientId: Boolean(creds.clientId),
            hasClientSecret: Boolean(creds.clientSecret),
            hasRefreshToken: Boolean(creds.refreshToken),
            redirectUri: creds.redirectUri,
            connectedEmail: creds.connectedEmail,
          },
          authUrl,
        },
      });
    } catch (error: any) {
      next(error);
    }
  };

  /**
   * POST /api/integrations/gmail/connect
   * (Deprecated — use /save-credentials above, then GET /integrations/gmail/auth-url)
   * Returns OAuth authorization URL or saves direct credentials.
   */
  connectGmail = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (req.body && Object.keys(req.body).length > 0) {
        const validated = updateGmailCredentialsSchema.parse(req.body);
        await this.gmailService.updateCredentials(validated);
      }

      const authUrl = this.gmailService.getAuthUrl();
      res.status(200).json({
        success: true,
        data: {
          authUrl,
        },
      });
    } catch (error: any) {
      next(error);
    }
  };

  /**
   * GET /api/integrations/gmail/callback
   * OAuth redirect handler
   */
  handleCallback = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const code = req.query.code as string;
      if (!code) {
        res.status(400).send('Authorization code missing');
        return;
      }

      await this.gmailService.handleCallback(code);
      res.redirect('http://localhost:5173/integrations?gmail=connected');
    } catch (error: any) {
      next(error);
    }
  };

  /**
   * POST /api/outreach/email/send
   */
  sendEmail = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const validated = sendEmailSchema.parse(req.body);
      const result = await this.outreachService.sendEmail(validated);

      res.status(200).json({
        success: true,
        message: 'Email dispatched successfully',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * POST /api/outreach/email/test
   * Diagnostic test send: sends a pre-written test email to a custom address
   * and returns full debug info (provider used, credential state, DB record).
   */
  sendTestEmail = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const testEmailSchema = z.object({
      recipient: z.string().email('Valid recipient email address is required'),
      subject: z.string().min(1).optional(),
      body: z.string().min(1).optional(),
    });

    try {
      const validated = testEmailSchema.parse(req.body);
      const creds = this.gmailService.getCredentials();
      const status = await this.outreachService.getStatus();

      const subject = validated.subject || '🧪 LeadHunter Gmail Test (please confirm receipt)';
      const body = validated.body ||
        `Hi!\r\n\r\nThis is an automated test email from LeadHunter.\r\n\r\nIf you are reading this in your inbox, the Gmail pipeline is working correctly end-to-end: credentials are loaded, the GmailProvider was selected, the Gmail API sent the message, and the SentMessage table logged the dispatch.\r\n\r\n— LeadHunter Test Suite\r\nSent at: ${new Date().toISOString()}`;

      let sendResult: any;
      let errorMessage: string | undefined;

      try {
        sendResult = await this.outreachService.sendEmail({
          recipient: validated.recipient,
          subject,
          body,
          isHtml: false,
        });
      } catch (err: any) {
        errorMessage = err.message;
        sendResult = err.details || null;
      }

      const credentialState = {
        hasClientId: Boolean(creds.clientId),
        hasClientSecret: Boolean(creds.clientSecret),
        hasRefreshToken: Boolean(creds.refreshToken),
        redirectUri: creds.redirectUri || '',
        connectedEmail: creds.connectedEmail || '',
      };

      res.status(errorMessage ? 502 : 200).json({
        success: !errorMessage,
        message: errorMessage
          ? `Test email failed: ${errorMessage}`
          : `Test email dispatched. Check ${validated.recipient} inbox (and spam folder).`,
        data: {
          providerUsed: status.provider,
          providerMode: status.mode,
          providerIsConnected: status.isConnected,
          gmailAccount: status.email || creds.connectedEmail || '(unknown)',
          credentialState,
          recipient: validated.recipient,
          subject,
          bodyPreview: body.slice(0, 200),
          sendResult,
        },
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * POST /api/outreach/whatsapp/send
   */
  sendWhatsApp = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const validated = sendWhatsAppSchema.parse(req.body);
      const result = await this.outreachService.sendWhatsApp(validated);

      res.status(200).json({
        success: true,
        message: 'WhatsApp message dispatched successfully',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * GET /api/outreach/sent
   */
  getSentHistory = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const leadId = req.query.leadId ? Number(req.query.leadId) : undefined;
      const history = await this.outreachService.getSentMessages(leadId);

      res.status(200).json({
        success: true,
        data: history,
      });
    } catch (error) {
      next(error);
    }
  };
}
