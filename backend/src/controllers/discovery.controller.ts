import { Request, Response, NextFunction } from 'express';
import { DiscoveryService } from '../services/discovery/discovery.service.js';
import { discoverySearchSchema } from '../validators/discovery.validator.js';

export class DiscoveryController {
  static async search(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const validated = discoverySearchSchema.parse(req.body);

      const service = new DiscoveryService();
      const summary = await service.search(validated.city, validated.category, validated.limit);

      res.status(200).json({
        success: true,
        message: `Discovery complete: ${summary.newLeads} new leads found in ${validated.city}`,
        data: summary,
      });
    } catch (error: any) {
      if (error.message?.includes('SERPAPI_API_KEY')) {
        res.status(503).json({
          success: false,
          error: 'SerpAPI is not configured. Please add SERPAPI_API_KEY to your .env file.',
        });
        return;
      }
      next(error);
    }
  }
}
