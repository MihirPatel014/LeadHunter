import { Router } from 'express';
import { TemplateController } from '../controllers/template.controller.js';

const router = Router();

router.get('/templates/variables', TemplateController.getVariables);
router.get('/templates', TemplateController.getTemplates);
router.get('/templates/:id', TemplateController.getTemplateById);
router.post('/templates', TemplateController.createTemplate);
router.patch('/templates/:id', TemplateController.updateTemplate);
router.delete('/templates/:id', TemplateController.deleteTemplate);

export default router;
