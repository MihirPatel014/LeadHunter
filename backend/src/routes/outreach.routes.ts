import { Router } from 'express';
import { OutreachController } from '../controllers/outreach.controller.js';

const router = Router();
const outreachController = new OutreachController();

// ─── Gmail Integrations endpoints ───────────────────────────────
router.get('/integrations/gmail/status', outreachController.getGmailStatus);
router.post('/integrations/gmail/save-credentials', outreachController.saveGmailCredentials);
router.post('/integrations/gmail/connect', outreachController.connectGmail);
router.get('/integrations/gmail/callback', outreachController.handleCallback);

// ─── OpenWA WhatsApp gateway + session management ───────────────
router.get('/integrations/whatsapp/status', outreachController.getWhatsAppStatus);
router.get('/integrations/whatsapp/sessions', outreachController.listWhatsAppSessions);
router.get('/integrations/whatsapp/sessions/:sessionId', outreachController.getWhatsAppSession);
router.post('/integrations/whatsapp/sessions', outreachController.createWhatsAppSession);
router.post('/integrations/whatsapp/sessions/:sessionId/start', outreachController.startWhatsAppSession);
router.post('/integrations/whatsapp/sessions/:sessionId/stop', outreachController.stopWhatsAppSession);
router.post('/integrations/whatsapp/sessions/:sessionId/restart', outreachController.restartWhatsAppSession);
router.post('/integrations/whatsapp/sessions/:sessionId/logout', outreachController.logoutWhatsAppSession);
router.post('/integrations/whatsapp/sessions/:sessionId/force-kill', outreachController.forceKillWhatsAppSession);
router.delete('/integrations/whatsapp/sessions/:sessionId', outreachController.deleteWhatsAppSession);
router.get('/integrations/whatsapp/qr', outreachController.getWhatsAppQrCode);
router.post('/integrations/whatsapp/pairing-code', outreachController.requestWhatsAppPairingCode);
router.post('/outreach/whatsapp/send', outreachController.sendWhatsApp);

// ─── Email Outreach dispatch endpoints ──────────────────────────
router.post('/outreach/email/send', outreachController.sendEmail);
router.post('/outreach/email/test', outreachController.sendTestEmail);
router.get('/outreach/sent', outreachController.getSentHistory);

export default router;
