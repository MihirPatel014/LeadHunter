import { Request, Response, NextFunction } from 'express';
import { WebsiteValidatorService } from '../services/website-validator.service.js';
import { z } from 'zod';

const validatorService = new WebsiteValidatorService();

const bulkValidateSchema = z.object({
  leadIds: z.array(z.number().int()).optional(),
});

export class WebsiteValidatorController {
  static async validateSingleLead(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = parseInt(String(req.params.id), 10);
      if (isNaN(id)) {
        res.status(400).json({ success: false, error: 'Invalid Lead ID' });
        return;
      }

      const result = await validatorService.validateLead(id);

      res.status(200).json({
        success: true,
        message: `Website validation complete for ${result.lead.businessName}: Status is ${result.validation.status}`,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  static async bulkValidateLeads(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const body = bulkValidateSchema.parse(req.body || {});
      const summary = await validatorService.bulkValidateLeads(body.leadIds);

      res.status(200).json({
        success: true,
        message: `Bulk validation complete: ${summary.online} Online, ${summary.offline} Offline, ${summary.invalid} Invalid`,
        data: summary,
      });
    } catch (error) {
      next(error);
    }
  }
}
