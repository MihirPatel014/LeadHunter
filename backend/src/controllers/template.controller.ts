import { Request, Response, NextFunction } from 'express';
import { TemplateService } from '../services/template.service.js';
import { createTemplateSchema, updateTemplateSchema, templateQuerySchema } from '../validators/template.validator.js';
import { SUPPORTED_TEMPLATE_VARIABLES } from '../types/template.types.js';

const templateService = new TemplateService();

export class TemplateController {
  static async getTemplates(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const validatedQuery = templateQuerySchema.parse(req.query);
      const templates = await templateService.getTemplates(validatedQuery);
      res.status(200).json({
        success: true,
        data: templates,
      });
    } catch (error) {
      next(error);
    }
  }

  static async getTemplateById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = parseInt(String(req.params.id), 10);
      if (isNaN(id)) {
        res.status(400).json({ success: false, error: 'Invalid Template ID' });
        return;
      }
      const template = await templateService.getTemplateById(id);
      res.status(200).json({
        success: true,
        data: template,
      });
    } catch (error) {
      next(error);
    }
  }

  static async createTemplate(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const validatedBody = createTemplateSchema.parse(req.body);
      const template = await templateService.createTemplate(validatedBody);
      res.status(201).json({
        success: true,
        message: 'Template created successfully',
        data: template,
      });
    } catch (error) {
      next(error);
    }
  }

  static async updateTemplate(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = parseInt(String(req.params.id), 10);
      if (isNaN(id)) {
        res.status(400).json({ success: false, error: 'Invalid Template ID' });
        return;
      }
      const validatedBody = updateTemplateSchema.parse(req.body);
      const updatedTemplate = await templateService.updateTemplate(id, validatedBody);
      res.status(200).json({
        success: true,
        message: 'Template updated successfully',
        data: updatedTemplate,
      });
    } catch (error) {
      next(error);
    }
  }

  static async deleteTemplate(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = parseInt(String(req.params.id), 10);
      if (isNaN(id)) {
        res.status(400).json({ success: false, error: 'Invalid Template ID' });
        return;
      }
      await templateService.deleteTemplate(id);
      res.status(200).json({
        success: true,
        message: 'Template deleted successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  static async getVariables(_req: Request, res: Response): Promise<void> {
    res.status(200).json({
      success: true,
      data: SUPPORTED_TEMPLATE_VARIABLES,
    });
  }
}
