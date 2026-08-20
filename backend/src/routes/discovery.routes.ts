import { Router } from 'express';
import { DiscoveryController } from '../controllers/discovery.controller.js';

const router = Router();

router.post('/discovery/search', DiscoveryController.search);

export default router;
