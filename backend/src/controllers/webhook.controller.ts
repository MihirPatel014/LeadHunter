import { Request, Response, NextFunction } from 'express';
import { ReplyDetectionService } from '../services/reply-detection.service.js';
import { WhatsAppProvider } from '../services/outreach/providers/whatsapp.provider.js';
import { z } from 'zod';

const replyDetectionService = new ReplyDetectionService();
const whatsappProvider = new WhatsAppProvider();

const registerWebhookSchema = z.object({
  url: z.string().url('A valid webhook URL is required'),
  events: z.array(z.string()).optional(),
  secret: z.string().min(16).optional(),
  sessionId: z.string().optional(),
});

export class WebhookController {
  /**
   * POST /api/webhooks/openwa
   * Primary webhook receiver for OpenWA events.
   */
  handleOpenWaWebhook = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const payload = req.body;

      if (!payload || typeof payload !== 'object') {
        res.status(400).json({ success: false, error: 'Invalid webhook payload' });
        return;
      }

      const event = payload.event;
      const sessionId = payload.sessionId;
      const data = payload.data || {};

      console.log(`[WebhookController] Received OpenWA event "${event}" for session "${sessionId}"`);

      // Handle inbound message events
      if (event === 'message.received' || (event === 'message.create' && data.fromMe === false)) {
        const senderPhone = (data.from || data.chatId || data.author || '') as string;
        const bodyText = (data.body || data.text || data.caption || data.message || '') as string;
        const messageId = (data.id || data.messageId || payload.idempotencyKey || payload.deliveryId) as string;
        const pushName = (data.pushName || data.notifyName || data._data?.notifyName) as string | undefined;
        const timestamp = data.timestamp || payload.timestamp;

        if (senderPhone) {
          const result = await replyDetectionService.processWhatsAppInboundReply({
            senderPhone,
            body: bodyText,
            messageId,
            pushName,
            timestamp,
            sessionId,
          });

          console.log(`[WebhookController] Processed WhatsApp reply from ${senderPhone}:`, {
            matchedLeadId: result.matchedLeadId,
            leadUpdated: result.leadUpdated,
            duplicate: result.duplicate,
          });
        }
      } else if (event === 'session.status') {
        console.log(`[WebhookController] Session ${sessionId} status update:`, data.status || data);
      }

      // Return 200 OK to OpenWA immediately so it doesn't retry
      res.status(200).json({ success: true, received: true, event });
    } catch (err) {
      console.error('[WebhookController] Error processing OpenWA webhook:', err);
      // Still return 200 to prevent delivery failure loops unless fatal
      res.status(200).json({ success: false, error: (err as Error).message });
    }
  };

  /**
   * GET /api/integrations/whatsapp/webhooks
   * List registered webhooks in OpenWA
   */
  listWebhooks = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const sessionId = req.query.sessionId as string | undefined;
      const webhooks = await whatsappProvider.listWebhooks(sessionId);
      res.json({ success: true, data: webhooks });
    } catch (err) {
      next(err);
    }
  };

  /**
   * POST /api/integrations/whatsapp/webhooks
   * Register a new webhook with OpenWA
   */
  registerWebhook = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const data = registerWebhookSchema.parse(req.body);
      const result = await whatsappProvider.registerWebhook(data);
      res.status(201).json({
        success: true,
        message: 'Webhook registered successfully with OpenWA',
        data: result,
      });
    } catch (err) {
      next(err);
    }
  };

  /**
   * DELETE /api/integrations/whatsapp/webhooks/:webhookId
   * Delete a webhook from OpenWA
   */
  deleteWebhook = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const webhookId = Array.isArray(req.params.webhookId) ? req.params.webhookId[0] : req.params.webhookId;
      const sessionId = req.query.sessionId as string | undefined;
      await whatsappProvider.deleteWebhook(String(webhookId), sessionId);
      res.json({ success: true, message: `Webhook #${webhookId} deleted` });
    } catch (err) {
      next(err);
    }
  };

  /**
   * POST /api/integrations/whatsapp/webhooks/:webhookId/test
   * Test a webhook delivery via OpenWA
   */
  testWebhook = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const webhookId = Array.isArray(req.params.webhookId) ? req.params.webhookId[0] : req.params.webhookId;
      const sessionId = req.query.sessionId as string | undefined;
      const result = await whatsappProvider.testWebhook(String(webhookId), sessionId);
      res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  };
}
