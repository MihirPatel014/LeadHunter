import { Request, Response, NextFunction } from 'express';
import { loggerService, LogLevel, LogCategory } from '../services/logger.service.js';

export function requestLoggerMiddleware(req: Request, res: Response, next: NextFunction): void {
  // Skip logging poll requests to /api/logs itself to prevent recursive logging loops
  if (req.originalUrl.startsWith('/api/logs')) {
    next();
    return;
  }

  const startTime = Date.now();
  const method = req.method;
  const url = req.originalUrl || req.url;

  res.on('finish', () => {
    const duration = Date.now() - startTime;
    const statusCode = res.statusCode;

    let level: LogLevel = 'INFO';
    if (statusCode >= 500) level = 'ERROR';
    else if (statusCode >= 400) level = 'WARN';

    // Determine category based on route path
    let category: LogCategory = 'API';
    if (url.includes('/webhooks')) category = 'WEBHOOK';
    else if (url.includes('/whatsapp')) category = 'WHATSAPP';
    else if (url.includes('/gmail') || url.includes('/outreach')) category = 'OUTREACH';
    else if (url.includes('/personalization')) category = 'AI';
    else if (url.includes('/discovery')) category = 'API';

    const message = `${method} ${url} -> ${statusCode} (${duration}ms)`;

    loggerService.log({
      source: 'BACKEND',
      level,
      category,
      message,
      meta: {
        method,
        url,
        statusCode,
        durationMs: duration,
        ip: req.ip || req.socket.remoteAddress,
        query: Object.keys(req.query).length > 0 ? req.query : undefined,
      },
    });
  });

  next();
}
