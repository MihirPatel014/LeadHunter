export type TemplateChannel = 'EMAIL' | 'WHATSAPP';

export interface TemplateVariable {
  key: string;
  label: string;
  description: string;
  example: string;
}

export interface Template {
  id: number;
  name: string;
  description: string | null;
  channel: TemplateChannel;
  subject: string | null;
  body: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateTemplatePayload {
  name: string;
  description?: string;
  channel: TemplateChannel;
  subject?: string;
  body: string;
  isActive?: boolean;
}

export type UpdateTemplatePayload = Partial<CreateTemplatePayload>;
