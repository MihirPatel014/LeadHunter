import { Router } from 'express';
import {
  listCampaigns,
  getCampaign,
  createCampaign,
  updateCampaign,
  deleteCampaign,
  runCampaign,
} from '../controllers/campaign.controller.js';

const router = Router();

router.get('/campaigns', listCampaigns);
router.get('/campaigns/:id', getCampaign);
router.post('/campaigns', createCampaign);
router.patch('/campaigns/:id', updateCampaign);
router.delete('/campaigns/:id', deleteCampaign);
router.post('/campaigns/:id/run', runCampaign);

export default router;
