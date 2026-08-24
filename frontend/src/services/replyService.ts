import { fetchApi } from './api';
import {
  Reply,
  SyncRepliesResult,
  SimulateReplyPayload,
} from '../types/reply';

export const replyService = {
  list: async (params: { leadId?: number; sender?: string } = {}): Promise<Reply[]> => {
    const query = new URLSearchParams();
    if (params.leadId) query.append('leadId', String(params.leadId));
    if (params.sender) query.append('sender', params.sender);

    const qs = query.toString() ? `?${query.toString()}` : '';
    const res = await fetchApi<Reply[]>(`/api/messages/replies${qs}`);
    return res.data ?? [];
  },

  sync: async (): Promise<SyncRepliesResult> => {
    const res = await fetchApi<SyncRepliesResult>('/api/messages/replies/sync', {
      method: 'POST',
    });
    return res.data!;
  },

  simulate: async (payload: SimulateReplyPayload): Promise<Reply> => {
    const res = await fetchApi<Reply>('/api/messages/replies/simulate', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    return res.data!;
  },
};
