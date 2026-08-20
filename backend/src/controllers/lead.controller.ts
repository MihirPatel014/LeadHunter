import { Request, Response, NextFunction } from 'express';
import { LeadService } from '../services/lead.service.js';
import { createLeadSchema, updateLeadSchema, leadQuerySchema } from '../validators/lead.validator.js';

const leadService = new LeadService();

export class LeadController {
  static async getLeads(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const validatedQuery = leadQuerySchema.parse(req.query);
      const result = await leadService.getLeads(validatedQuery);
      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  static async getLeadById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = parseInt(String(req.params.id), 10);
      if (isNaN(id)) {
        res.status(400).json({ success: false, error: 'Invalid Lead ID' });
        return;
      }
      const lead = await leadService.getLeadById(id);
      res.status(200).json({
        success: true,
        data: lead,
      });
    } catch (error) {
      next(error);
    }
  }

  static async createLead(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const validatedBody = createLeadSchema.parse(req.body);
      const lead = await leadService.createLead(validatedBody);
      res.status(201).json({
        success: true,
        message: 'Lead created successfully',
        data: lead,
      });
    } catch (error) {
      next(error);
    }
  }

  static async updateLead(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = parseInt(String(req.params.id), 10);
      if (isNaN(id)) {
        res.status(400).json({ success: false, error: 'Invalid Lead ID' });
        return;
      }
      const validatedBody = updateLeadSchema.parse(req.body);
      const updatedLead = await leadService.updateLead(id, validatedBody);
      res.status(200).json({
        success: true,
        message: 'Lead updated successfully',
        data: updatedLead,
      });
    } catch (error) {
      next(error);
    }
  }

  static async deleteLead(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = parseInt(String(req.params.id), 10);
      if (isNaN(id)) {
        res.status(400).json({ success: false, error: 'Invalid Lead ID' });
        return;
      }
      await leadService.deleteLead(id);
      res.status(200).json({
        success: true,
        message: 'Lead deleted successfully',
      });
    } catch (error) {
      next(error);
    }
  }
}
