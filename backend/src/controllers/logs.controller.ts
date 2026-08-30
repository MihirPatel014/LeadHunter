import { Request, Response, NextFunction } from 'express';
import { loggerService, LogLevel, LogSource, LogCategory } from '../services/logger.service.js';
import { z } from 'zod';

const clientLogSchema = z.object({
  level: z.enum(['INFO', 'WARN', 'ERROR', 'DEBUG']).default('INFO'),
  category: z.string().default('CLIENT'),
  message: z.string().min(1, 'Message is required'),
  meta: z.record(z.any()).optional(),
  timestamp: z.string().optional(),
});

export class LogsController {
  /**
   * GET /api/logs
   * List logs with optional filtering (source, level, category, search, limit, offset)
   */
  getLogs = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const source = req.query.source as LogSource | undefined;
      const level = req.query.level as LogLevel | undefined;
      const category = req.query.category as string | undefined;
      const search = req.query.search as string | undefined;
      const limit = req.query.limit ? Number(req.query.limit) : 100;
      const offset = req.query.offset ? Number(req.query.offset) : 0;

      const result = loggerService.list({
        source,
        level,
        category,
        search,
        limit,
        offset,
      });

      res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  };

  /**
   * POST /api/logs/client
   * Ingest client-side logs or UI errors from React
   */
  ingestClientLog = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const data = clientLogSchema.parse(req.body);
      const entry = loggerService.log({
        source: 'FRONTEND',
        level: data.level as LogLevel,
        category: data.category,
        message: data.message,
        meta: data.meta,
        timestamp: data.timestamp,
      });

      res.status(201).json({ success: true, data: entry });
    } catch (err) {
      next(err);
    }
  };

  /**
   * DELETE /api/logs
   * Clear the in-memory log buffer
   */
  clearLogs = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      loggerService.clear();
      res.json({ success: true, message: 'Log buffer cleared successfully' });
    } catch (err) {
      next(err);
    }
  };

  /**
   * POST /api/logs/simulate
   * Generate test logs for demonstration & testing
   */
  simulateLog = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const sampleEvents = [
        {
          source: 'BACKEND' as const,
          level: 'INFO' as const,
          category: 'WHATSAPP',
          message: 'WhatsApp session leadhunter-main authenticated successfully',
          meta: { pushName: 'LeadHunter Agent', batteryLevel: 94 },
        },
        {
          source: 'BACKEND' as const,
          level: 'INFO' as const,
          category: 'WEBHOOK',
          message: 'Received inbound webhook event message.received from 919876543210@c.us',
          meta: { latencyMs: 38, leadId: 165, leadUpdated: true },
        },
        {
          source: 'FRONTEND' as const,
          level: 'WARN' as const,
          category: 'CLIENT',
          message: 'Slow network response detected during CSV Lead import',
          meta: { durationMs: 2450, rowCount: 150 },
        },
        {
          source: 'BACKEND' as const,
          level: 'ERROR' as const,
          category: 'GMAIL',
          message: 'Gmail API token expired, auto-refreshing OAuth access token',
          meta: { retries: 1, errorCode: 'AUTH_EXPIRED' },
        },
      ];

      const created = sampleEvents.map((ev) => loggerService.log(ev));
      res.status(201).json({ success: true, data: created });
    } catch (err) {
      next(err);
    }
  };
}
