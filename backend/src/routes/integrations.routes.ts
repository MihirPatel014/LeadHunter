import { Router, Request, Response } from 'express';
import { SerpApiAccountService } from '../services/serpapi-account.service.js';

const router = Router();

router.get('/integrations/serpapi/status', async (_req: Request, res: Response): Promise<void> => {
  const apiKey = process.env.SERPAPI_API_KEY;

  if (!apiKey) {
    res.status(503).json({
      success: false,
      error: 'SERPAPI_API_KEY is not configured on this server.',
    });
    return;
  }

  try {
    const service = new SerpApiAccountService(apiKey);
    const data = await service.getAccountInfo();
    res.json({ success: true, data });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    res.status(502).json({
      success: false,
      error: `Failed to reach SerpAPI: ${message}`,
    });
  }
});

export default router;
