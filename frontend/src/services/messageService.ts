import { fetchApi } from './api';
import { MessagePreviewRequest, MessagePreviewResponse } from '../types/message';

export const messageService = {
  async previewMessage(payload: MessagePreviewRequest): Promise<MessagePreviewResponse> {
    const response = await fetchApi<MessagePreviewResponse>('/api/messages/preview', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    return response.data!;
  },
};
