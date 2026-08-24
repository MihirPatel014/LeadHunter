import { z } from 'zod';

export const messagePreviewSchema = z.object({
  leadId: z.number().int().positive('Lead ID must be a positive integer'),
  templateId: z.number().int().positive('Template ID must be a positive integer'),
});

export type MessagePreviewInput = z.infer<typeof messagePreviewSchema>;
