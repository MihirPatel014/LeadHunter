import { z } from 'zod';

export const generatePersonalizationSchema = z.object({
  leadId: z.number({
    required_error: 'leadId is required',
    invalid_type_error: 'leadId must be a number',
  }).int().positive(),
  templateId: z.number({
    required_error: 'templateId is required',
    invalid_type_error: 'templateId must be a number',
  }).int().positive(),
  customInstructions: z.string().max(500, 'Custom instructions cannot exceed 500 characters').optional(),
  provider: z.enum(['mock', 'gemini', 'openai']).optional(),
  model: z.string().max(100).optional(),
  apiKey: z.string().max(500).optional(),
});

export const updateAIConfigSchema = z.object({
  provider: z.enum(['mock', 'gemini', 'openai']),
  apiKey: z.string().optional(),
  model: z.string().optional(),
});

export type GeneratePersonalizationInput = z.infer<typeof generatePersonalizationSchema>;
export type UpdateAIConfigInput = z.infer<typeof updateAIConfigSchema>;
