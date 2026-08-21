import { Router } from 'express';
import { LeadController } from '../controllers/lead.controller.js';
import { WebsiteValidatorController } from '../controllers/website-validator.controller.js';
import { LeadScoringController } from '../controllers/lead-scoring.controller.js';
import { LeadImportController } from '../controllers/lead-import.controller.js';

const router = Router();

// CSV Import endpoints
router.post('/leads/import/preview', LeadImportController.preview);
router.post('/leads/import/confirm', LeadImportController.confirm);

// Lead scoring endpoints
router.post('/leads/score', LeadScoringController.bulkScoreLeads);
router.post('/leads/:id/score', LeadScoringController.scoreSingleLead);
router.get('/leads/:id/score', LeadScoringController.getScoringBreakdown);

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

