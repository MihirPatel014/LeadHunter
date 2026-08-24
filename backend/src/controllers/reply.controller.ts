import { Request, Response, NextFunction } from 'express';
import { ReplyDetectionService } from '../services/reply-detection.service.js';
import { z } from 'zod';

const replyService = new ReplyDetectionService();

const simulateReplySchema = z.object({
  leadId: z.number().int().positive('Lead ID must be positive'),
  sender: z.string().optional(),
  subject: z.string().optional(),
  body: z.string().min(1, 'Reply message body is required'),
});

export const listReplies = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const leadId = req.query.leadId ? Number(req.query.leadId) : undefined;
    const sender = req.query.sender as string | undefined;

    const replies = await replyService.listReplies({ leadId, sender });
    res.json({ success: true, data: replies });
  } catch (err) {
    next(err);
  }
};

export const syncReplies = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await replyService.syncGmailReplies();
    const sourceLabel = result.source === 'imap' ? 'IMAP (App Password)' : result.source === 'gmail_api' ? 'Gmail OAuth API' : 'Simulation';
    res.json({
      success: true,
      message: `Reply sync via ${sourceLabel} completed: ${result.repliesFound} new replies found, ${result.leadsUpdated} leads moved to REPLIED.`,
      data: result,
    });
  } catch (err) {
    next(err);
  }
};

export const simulateReply = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = simulateReplySchema.parse(req.body);
    const reply = await replyService.simulateReply(data);
    res.status(201).json({
      success: true,
      message: `Simulated reply created and Lead #${data.leadId} status transitioned to REPLIED.`,
      data: reply,
    });
  } catch (err) {
    next(err);
  }
};
