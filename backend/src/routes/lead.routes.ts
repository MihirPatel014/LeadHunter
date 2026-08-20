import { Router } from 'express';
import { LeadController } from '../controllers/lead.controller.js';

const router = Router();

// Bulk operations (must be before /:id routes)
router.post('/leads/bulk-delete', LeadController.bulkDelete);
router.patch('/leads/bulk-update', LeadController.bulkUpdate);

// Single resource CRUD
router.get('/leads', LeadController.getLeads);
router.get('/leads/:id', LeadController.getLeadById);
router.post('/leads', LeadController.createLead);
router.patch('/leads/:id', LeadController.updateLead);
router.delete('/leads/:id', LeadController.deleteLead);

export default router;
