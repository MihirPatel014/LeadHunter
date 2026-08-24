import { Router } from 'express';
import {
  listFollowUps,
  skipFollowUp,
  processDueFollowUps,
  scheduleFollowUp,
  getFollowUpConfig,
  updateFollowUpConfig,
} from '../controllers/follow-up.controller.js';

const router = Router();

router.get('/follow-ups', listFollowUps);
router.post('/follow-ups/process-now', processDueFollowUps);
router.post('/follow-ups/schedule', scheduleFollowUp);
router.get('/follow-ups/config', getFollowUpConfig);
router.patch('/follow-ups/config', updateFollowUpConfig);
router.post('/follow-ups/:id/skip', skipFollowUp);

export default router;
