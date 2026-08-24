import { z } from 'zod';

export const createApprovalSchema = z.object({
  leadId: z.number().int().positive().optional(),
  templateId: z.number().int().positive().optional(),
  channel: z.enum(['EMAIL', 'WHATSAPP']).default('EMAIL'),
  recipient: z.string().email('Recipient must be a valid email address'),
  subject: z.string().max(255).optional(),
  body: z.string().min(1, 'Body is required'),
  status: z.enum(['DRAFT', 'PENDING_APPROVAL']).default('PENDING_APPROVAL'),
});

export const updateApprovalSchema = z.object({
  subject: z.string().max(255).optional(),
  body: z.string().min(1).optional(),
});

export const rejectApprovalSchema = z.object({
  note: z.string().max(1000).optional(),
});
