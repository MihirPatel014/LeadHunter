import { Router, Request, Response, NextFunction } from 'express';
import { appSettingsService } from '../services/app-settings.service.js';
import { z } from 'zod';

const router = Router();

const setSchema = z.object({
  key: z.string().min(1),
  value: z.string(),
});

const setBulkSchema = z.record(z.string(), z.string());

/**
 * GET /api/settings
 * Returns all settings (API key masked).
 */
router.get('/settings', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const category = req.query.category as string | undefined;
    const settings = await appSettingsService.getAll(category);
    res.json({ success: true, data: settings });
  } catch (e) {
    next(e);
  }
});

/**
 * POST /api/settings
 * Update a single setting.
 */
router.post('/settings', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { key, value } = setSchema.parse(req.body);
    await appSettingsService.set(key, value);
    res.json({ success: true, message: `Setting '${key}' updated` });
  } catch (e) {
    next(e);
  }
});

/**
 * POST /api/settings/bulk
 * Update multiple settings at once.
 */
router.post('/settings/bulk', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const settings = setBulkSchema.parse(req.body);
    await appSettingsService.setBulk(settings);
    res.json({ success: true, message: 'Settings updated' });
  } catch (e) {
    next(e);
  }
});

export default router;
