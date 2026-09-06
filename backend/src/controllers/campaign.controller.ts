import { Request, Response, NextFunction } from 'express';
import { CampaignService } from '../services/campaign.service.js';
import {
  createCampaignSchema,
  updateCampaignSchema,
  listCampaignQuerySchema,
} from '../validators/campaign.validator.js';

const campaignService = new CampaignService();

export const listCampaigns = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const query = listCampaignQuerySchema.parse(req.query);
    const campaigns = await campaignService.list(query);
    res.json({ success: true, data: campaigns });
  } catch (err) {
    next(err);
  }
};

export const getCampaign = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = Number(req.params['id']);
    if (isNaN(id)) {
      res.status(400).json({ success: false, message: 'Invalid campaign ID' });
      return;
    }
    const campaign = await campaignService.getById(id);
    res.json({ success: true, data: campaign });
  } catch (err) {
    next(err);
  }
};

export const createCampaign = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = createCampaignSchema.parse(req.body);
    const campaign = await campaignService.create(data);
    res.status(201).json({ success: true, data: campaign });
  } catch (err) {
    next(err);
  }
};

export const updateCampaign = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = Number(req.params['id']);
    if (isNaN(id)) {
      res.status(400).json({ success: false, message: 'Invalid campaign ID' });
      return;
    }
    const data = updateCampaignSchema.parse(req.body);
    const campaign = await campaignService.update(id, data);
    res.json({ success: true, data: campaign });
  } catch (err) {
    next(err);
  }
};

export const deleteCampaign = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = Number(req.params['id']);
    if (isNaN(id)) {
      res.status(400).json({ success: false, message: 'Invalid campaign ID' });
      return;
    }
    await campaignService.delete(id);
    res.json({ success: true, message: `Campaign #${id} deleted` });
  } catch (err) {
    next(err);
  }
};

export const runCampaign = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = Number(req.params['id']);
    if (isNaN(id)) {
      res.status(400).json({ success: false, message: 'Invalid campaign ID' });
      return;
    }
    const leadIds = Array.isArray(req.body?.leadIds) ? req.body.leadIds.map(Number).filter((n: number) => !isNaN(n)) : undefined;
    const result = await campaignService.run(id, leadIds);
    res.json({
      success: true,
      message: `Campaign run complete: ${result.enqueued} enqueued, ${result.skipped} skipped`,
      data: result,
    });
  } catch (err) {
    next(err);
  }
};

