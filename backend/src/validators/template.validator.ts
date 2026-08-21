import { z } from 'zod';
import { TEMPLATE_CHANNEL_VALUES } from '../types/template.types.js';

export const createTemplateSchema = z.object({
  name: z.string().min(1, 'Template name is required'),
  description: z.string().optional(),
  channel: z.enum(TEMPLATE_CHANNEL_VALUES).default('EMAIL'),
  subject: z.string().optional(),
  body: z.string().min(1, 'Template body is required'),
  isActive: z.boolean().default(true),
});

export const updateTemplateSchema = createTemplateSchema.partial();

export const templateQuerySchema = z.object({
  channel: z.enum(TEMPLATE_CHANNEL_VALUES).optional(),
  search: z.string().optional(),
  isActive: z.coerce.boolean().optional(),
});

export type CreateTemplateInput = z.infer<typeof createTemplateSchema>;
export type UpdateTemplateInput = z.infer<typeof updateTemplateSchema>;
export type TemplateQueryInput = z.infer<typeof templateQuerySchema>;
