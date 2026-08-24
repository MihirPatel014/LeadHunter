import { Request, Response, NextFunction } from 'express';
import { MessageService } from '../services/message.service.js';
import { messagePreviewSchema } from '../validators/message.validator.js';

const messageService = new MessageService();

export const previewMessage = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const data = messagePreviewSchema.parse(req.body);
    const preview = await messageService.previewMessage(data.leadId, data.templateId);

    res.json({
      success: true,
      data: preview,
    });
  } catch (error) {
    next(error);
  }
};
