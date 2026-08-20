import { z } from 'zod';
import { LEAD_STATUS_VALUES, TEMPERATURE_VALUES, WEBSITE_STATUS_VALUES } from '../types/lead.types.js';

export const createLeadSchema = z.object({
  businessName: z.string().min(1, 'Business name is required'),
  category: z.string().optional(),
  city: z.string().optional(),
  address: z.string().optional(),
  website: z.string().url('Invalid URL format').optional().or(z.literal('')),
  phone: z.string().optional(),
  email: z.string().email('Invalid email format').optional().or(z.literal('')),
  rating: z.number().min(0).max(5).optional(),
  reviewCount: z.number().int().min(0).optional(),
  websiteStatus: z.enum(WEBSITE_STATUS_VALUES).optional().default('UNKNOWN'),
  score: z.number().int().min(0).max(100).optional().default(0),
  temperature: z.enum(TEMPERATURE_VALUES).optional().default('LOW'),
  status: z.enum(LEAD_STATUS_VALUES).optional().default('NEW'),
  source: z.string().optional().default('MANUAL'),
});

export const updateLeadSchema = createLeadSchema.partial();

export const leadQuerySchema = z.object({
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(10),
  search: z.string().optional(),
  status: z.enum(LEAD_STATUS_VALUES).optional(),
  temperature: z.enum(TEMPERATURE_VALUES).optional(),
  city: z.string().optional(),
  category: z.string().optional(),
});

export type CreateLeadInput = z.infer<typeof createLeadSchema>;
export type UpdateLeadInput = z.infer<typeof updateLeadSchema>;
export type LeadQueryInput = z.infer<typeof leadQuerySchema>;
