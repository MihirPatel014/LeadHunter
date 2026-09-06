import { z } from 'zod';

export const createApprovalSchema = z.object({
  leadId: z.number().int().positive().optional(),
  templateId: z.number().int().positive().optional(),
  channel: z.enum(['EMAIL', 'WHATSAPP']).default('EMAIL'),
  recipient: z.string().min(1, 'Recipient is required'),
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

export const bulkApproveSchema = z.object({
  ids: z.array(z.number().int().positive()).min(1, 'At least one approval ID is required'),
});

export const bulkRejectSchema = z.object({
  ids: z.array(z.number().int().positive()).min(1, 'At least one approval ID is required'),
  note: z.string().max(1000).optional(),
});

