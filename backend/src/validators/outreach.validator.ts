import { z } from 'zod';

export const sendEmailSchema = z.object({
  leadId: z.number().int().positive().optional(),
  recipient: z.string().email('Valid recipient email address is required'),
  subject: z.string().min(1, 'Subject line cannot be empty'),
  body: z.string().min(1, 'Message body cannot be empty'),
  isHtml: z.boolean().optional(),
});

export const updateGmailCredentialsSchema = z.object({
  clientId: z.string().optional(),
  clientSecret: z.string().optional(),
  redirectUri: z.string().optional(),
  refreshToken: z.string().optional(),
});

export type SendEmailInput = z.infer<typeof sendEmailSchema>;
export type UpdateGmailCredentialsInput = z.infer<typeof updateGmailCredentialsSchema>;
