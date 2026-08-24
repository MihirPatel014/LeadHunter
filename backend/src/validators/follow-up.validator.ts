import { z } from 'zod';

export const listFollowUpsQuerySchema = z.object({
  status: z.enum(['SCHEDULED', 'QUEUED_FOR_APPROVAL', 'SKIPPED', 'CANCELLED']).optional(),
  leadId: z.string().transform((v) => Number(v)).refine((v) => !isNaN(v) && v > 0, 'Invalid leadId').optional(),
  isDue: z.string().transform((v) => v === 'true').optional(),
});

export const updateFollowUpConfigSchema = z.object({
  intervals: z
    .string()
    .min(1, 'Intervals cannot be empty')
    .refine(
      (val) => {
        const parts = val.split(',').map((p) => Number(p.trim()));
        return parts.length > 0 && parts.every((n) => !isNaN(n) && n > 0);
      },
      { message: 'Intervals must be comma-separated positive integers (e.g. "1,3,7,10")' }
    ),
  name: z.string().max(100).optional(),
});

export const scheduleFollowUpSchema = z.object({
  leadId: z.number().int().positive('Lead ID must be positive'),
  templateId: z.number().int().positive().optional(),
  step: z.number().int().min(1).default(1),
  daysFromNow: z.number().int().min(0).default(1),
  notes: z.string().max(500).optional(),
});

export type ListFollowUpsQueryInput = z.infer<typeof listFollowUpsQuerySchema>;
export type UpdateFollowUpConfigInput = z.infer<typeof updateFollowUpConfigSchema>;
export type ScheduleFollowUpInput = z.infer<typeof scheduleFollowUpSchema>;
