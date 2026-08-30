import { fetchApi } from './api';
import { MessagePreviewRequest, MessagePreviewResponse } from '../types/message';

export interface SendEmailPayload {
  leadId?: number;
  recipient: string;
  subject: string;
  body: string;
  isHtml?: boolean;
}

export interface SendWhatsAppPayload {
  leadId?: number;
  recipient: string;
  body: string;
}

export const messageService = {
  async previewMessage(payload: MessagePreviewRequest): Promise<MessagePreviewResponse> {
    const response = await fetchApi<MessagePreviewResponse>('/api/messages/preview', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    return response.data!;
  },

  async sendEmail(payload: SendEmailPayload) {
    const response = await fetchApi('/api/outreach/email/send', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    return response;
  },

  async sendWhatsApp(payload: SendWhatsAppPayload) {
    const response = await fetchApi('/api/outreach/whatsapp/send', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    return response;
  },
};
