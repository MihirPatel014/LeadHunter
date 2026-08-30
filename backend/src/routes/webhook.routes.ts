import { Router } from 'express';
import { WebhookController } from '../controllers/webhook.controller.js';

const router = Router();
const webhookController = new WebhookController();

// ── OpenWA Inbound Webhook Dispatch Target ──────────────────────────
router.post('/webhooks/openwa', webhookController.handleOpenWaWebhook);

// ── OpenWA Webhook Registration & Management ────────────────────────
router.get('/integrations/whatsapp/webhooks', webhookController.listWebhooks);
router.post('/integrations/whatsapp/webhooks', webhookController.registerWebhook);
router.delete('/integrations/whatsapp/webhooks/:webhookId', webhookController.deleteWebhook);
router.post('/integrations/whatsapp/webhooks/:webhookId/test', webhookController.testWebhook);

export default router;
