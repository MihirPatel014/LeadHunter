import { Router } from 'express';
import { LeadController } from '../controllers/lead.controller.js';
import { WebsiteValidatorController } from '../controllers/website-validator.controller.js';

const router = Router();

// Validation endpoints
router.post('/leads/validate', WebsiteValidatorController.bulkValidateLeads);
router.post('/leads/:id/validate', WebsiteValidatorController.validateSingleLead);

// Lead CRUD endpoints
router.get('/leads', LeadController.getLeads);
router.get('/leads/:id', LeadController.getLeadById);
router.post('/leads', LeadController.createLead);
router.patch('/leads/:id', LeadController.updateLead);
router.delete('/leads/:id', LeadController.deleteLead);

export default router;
