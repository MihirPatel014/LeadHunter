import { fetchApi } from './api';
import {
  FollowUpSchedule,
  FollowUpConfig,
  FollowUpStatus,
  FollowUpProcessResult,
} from '../types/followUp';

export const followUpService = {
  list: async (params: { status?: FollowUpStatus; leadId?: number; isDue?: boolean } = {}): Promise<FollowUpSchedule[]> => {
    const query = new URLSearchParams();
    if (params.status) query.append('status', params.status);
    if (params.leadId) query.append('leadId', String(params.leadId));
    if (params.isDue !== undefined) query.append('isDue', String(params.isDue));

    const qs = query.toString() ? `?${query.toString()}` : '';
    const res = await fetchApi<FollowUpSchedule[]>(`/api/follow-ups${qs}`);
    return res.data ?? [];
  },

  skip: async (id: number): Promise<{ success: boolean; message: string }> => {
    const res = await fetchApi<{ success: boolean; message: string }>(`/api/follow-ups/${id}/skip`, {
      method: 'POST',
    });
    return res.data!;
  },

  processDueNow: async (): Promise<FollowUpProcessResult> => {
    const res = await fetchApi<FollowUpProcessResult>('/api/follow-ups/process-now', {
      method: 'POST',
    });
    return res.data!;
  },

  getConfig: async (): Promise<FollowUpConfig> => {
    const res = await fetchApi<FollowUpConfig>('/api/follow-ups/config');
    return res.data!;
  },

  updateConfig: async (intervals: string, name?: string): Promise<FollowUpConfig> => {
    const res = await fetchApi<FollowUpConfig>('/api/follow-ups/config', {
      method: 'PATCH',
      body: JSON.stringify({ intervals, name }),
    });
    return res.data!;
  },

  schedule: async (data: {
    leadId: number;
    templateId?: number;
    step?: number;
    daysFromNow?: number;
    notes?: string;
  }): Promise<FollowUpSchedule> => {
    const res = await fetchApi<FollowUpSchedule>('/api/follow-ups/schedule', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return res.data!;
  },
};
