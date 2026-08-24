import { Router } from 'express';
import { previewMessage } from '../controllers/message.controller.js';
import {
  listReplies,
  syncReplies,
  simulateReply,
} from '../controllers/reply.controller.js';

const router = Router();

// POST /api/messages/preview — Generate a rendered message preview (Lead + Template)
router.post('/messages/preview', previewMessage);

// Replies Endpoints (CHUNK 14)
router.get('/messages/replies', listReplies);
router.post('/messages/replies/sync', syncReplies);
router.post('/messages/replies/simulate', simulateReply);

export default router;
