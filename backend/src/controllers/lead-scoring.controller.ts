import { Request, Response, NextFunction } from 'express';
import { LeadScoringService } from '../services/lead-scoring.service.js';
import { z } from 'zod';

const scoringService = new LeadScoringService();

const bulkScoreSchema = z.object({
  leadIds: z.array(z.number().int()).optional(),
});

export class LeadScoringController {
  static async scoreSingleLead(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = parseInt(String(req.params.id), 10);
      if (isNaN(id)) {
        res.status(400).json({ success: false, error: 'Invalid Lead ID' });
        return;
      }

      const result = await scoringService.scoreLead(id);

      res.status(200).json({
        success: true,
        message: `Lead scored: ${result.score}/100 (${result.temperature})`,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  static async bulkScoreLeads(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const body = bulkScoreSchema.parse(req.body || {});
      const summary = await scoringService.bulkScoreLeads(body.leadIds);

      res.status(200).json({
        success: true,
        message: `Bulk scoring complete: ${summary.hot} HOT, ${summary.warm} WARM, ${summary.low} LOW`,
        data: summary,
      });
    } catch (error) {
      next(error);
    }
  }

  static async getScoringBreakdown(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = parseInt(String(req.params.id), 10);
      if (isNaN(id)) {
        res.status(400).json({ success: false, error: 'Invalid Lead ID' });
        return;
      }

      const result = await scoringService.scoreLead(id);
      res.status(200).json({
        success: true,
        data: {
          score: result.score,
          temperature: result.temperature,
          reasons: result.reasons,
        },
      });
    } catch (error) {
      next(error);
    }
  }
}
