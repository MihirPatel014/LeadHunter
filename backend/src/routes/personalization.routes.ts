import { Router } from 'express';
import { PersonalizationController } from '../controllers/personalization.controller.js';

const router = Router();
const personalizationController = new PersonalizationController();

router.get('/status', personalizationController.getStatus);
router.post('/config', personalizationController.updateConfig);
router.post('/generate', personalizationController.generatePersonalization);
router.post('/test', personalizationController.testChat);

export default router;
