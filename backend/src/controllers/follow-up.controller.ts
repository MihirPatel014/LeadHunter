import { Request, Response, NextFunction } from 'express';
import { FollowUpService } from '../services/follow-up.service.js';
import {
  listFollowUpsQuerySchema,
  updateFollowUpConfigSchema,
  scheduleFollowUpSchema,
} from '../validators/follow-up.validator.js';

const followUpService = new FollowUpService();

export const listFollowUps = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const query = listFollowUpsQuerySchema.parse(req.query);
    const schedules = await followUpService.list(query);
    res.json({ success: true, data: schedules });
  } catch (err) {
    next(err);
  }
};

export const skipFollowUp = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = Number(req.params['id']);
    if (isNaN(id)) {
      res.status(400).json({ success: false, message: 'Invalid follow-up ID' });
      return;
    }
    const result = await followUpService.skipFollowUp(id);
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
};

export const processDueFollowUps = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await followUpService.processDueFollowUps();
    res.json({
      success: true,
      message: `Processed ${result.processed} due follow-ups (${result.queuedForApproval} queued for approval, ${result.stopped} stopped).`,
      data: result,
    });
  } catch (err) {
    next(err);
  }
};

export const scheduleFollowUp = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = scheduleFollowUpSchema.parse(req.body);
    const schedule = await followUpService.scheduleFollowUp(data);
    res.status(201).json({ success: true, data: schedule });
  } catch (err) {
    next(err);
  }
};

export const getFollowUpConfig = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const config = await followUpService.getConfig();
    res.json({ success: true, data: config });
  } catch (err) {
    next(err);
  }
};

export const updateFollowUpConfig = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = updateFollowUpConfigSchema.parse(req.body);
    const config = await followUpService.updateConfig(data);
    res.json({ success: true, message: 'Follow-up sequence configuration updated', data: config });
  } catch (err) {
    next(err);
  }
};
