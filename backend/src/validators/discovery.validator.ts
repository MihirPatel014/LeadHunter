import { z } from 'zod';

export const discoverySearchSchema = z.object({
  city: z.string().min(1, 'City is required'),
  category: z.string().min(1, 'Category is required'),
  limit: z.coerce.number().int().min(1).max(100).optional().default(50),
});

export type DiscoverySearchInput = z.infer<typeof discoverySearchSchema>;
