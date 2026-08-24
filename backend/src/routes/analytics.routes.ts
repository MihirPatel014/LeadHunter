import { Router } from 'express';
import {
  getOverview,
  getPipeline,
  getTopCities,
  getTopCategories,
  getCampaignPerformance,
  getLeadSourceBreakdown,
  getLeadTemperature,
} from '../controllers/analytics.controller.js';

const router = Router();

router.get('/analytics/overview', getOverview);
router.get('/analytics/pipeline', getPipeline);
router.get('/analytics/cities', getTopCities);
router.get('/analytics/categories', getTopCategories);
router.get('/analytics/campaigns', getCampaignPerformance);
router.get('/analytics/lead-source', getLeadSourceBreakdown);
router.get('/analytics/temperature', getLeadTemperature);

export default router;
