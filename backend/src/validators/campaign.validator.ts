import { z } from 'zod';

export const createCampaignSchema = z.object({
  name: z.string().min(1, 'Campaign name is required').max(200),
  description: z.string().max(1000).optional(),
  city: z.string().max(100).optional(),
  category: z.string().max(100).optional(),
  templateId: z.number().int().positive('Template ID must be a positive integer'),
  channel: z.enum(['EMAIL', 'WHATSAPP']).default('EMAIL'),
  dailyLimit: z.number().int().min(1).max(500).default(20),
  status: z.enum(['DRAFT', 'ACTIVE', 'PAUSED', 'COMPLETED']).default('DRAFT'),
});

export const updateCampaignSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  description: z.string().max(1000).optional(),
  city: z.string().max(100).optional(),
  category: z.string().max(100).optional(),
  templateId: z.number().int().positive().optional(),
  channel: z.enum(['EMAIL', 'WHATSAPP']).optional(),
  dailyLimit: z.number().int().min(1).max(500).optional(),
  status: z.enum(['DRAFT', 'ACTIVE', 'PAUSED', 'COMPLETED']).optional(),
});

export const listCampaignQuerySchema = z.object({
  status: z.enum(['DRAFT', 'ACTIVE', 'PAUSED', 'COMPLETED']).optional(),
  city: z.string().optional(),
  category: z.string().optional(),
});

export type CreateCampaignInput = z.infer<typeof createCampaignSchema>;
export type UpdateCampaignInput = z.infer<typeof updateCampaignSchema>;
export type ListCampaignQueryInput = z.infer<typeof listCampaignQuerySchema>;
