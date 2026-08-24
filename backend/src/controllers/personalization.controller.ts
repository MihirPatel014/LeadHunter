import { Request, Response, NextFunction } from 'express';
import { PersonalizationService } from '../services/personalization.service.js';
import { generatePersonalizationSchema, updateAIConfigSchema } from '../validators/personalization.validator.js';
import { z } from 'zod';

const testAIChatSchema = z.object({
  prompt: z.string().min(1, 'Prompt is required'),
  provider: z.string().optional(),
  model: z.string().optional(),
  apiKey: z.string().optional(),
});

export class PersonalizationController {
  private personalizationService: PersonalizationService;

  constructor() {
    this.personalizationService = new PersonalizationService();
  }

  /**
   * GET /api/personalization/status
   * Returns current AI provider configuration and readiness.
   */
  getStatus = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const status = this.personalizationService.getAIStatus();
      res.status(200).json({
        success: true,
        data: status,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * POST /api/personalization/config
   * Update active AI provider, model, and API key from UI settings.
   */
  updateConfig = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const validated = updateAIConfigSchema.parse(req.body);
      const status = this.personalizationService.updateAIConfig(validated);
      res.status(200).json({
        success: true,
        message: 'AI Configuration updated successfully',
        data: status,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * POST /api/personalization/generate
   * Generates an AI-personalized message for a lead and template.
   */
  generatePersonalization = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const validated = generatePersonalizationSchema.parse(req.body);
      const result = await this.personalizationService.generatePersonalization(validated);

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * POST /api/personalization/test
   * Live interactive chat/prompt test endpoint to verify AI connection.
   */
  testChat = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const validated = testAIChatSchema.parse(req.body);
      const result = await this.personalizationService.testAIChat(validated);

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message || 'AI test failed',
      });
    }
  };
}
