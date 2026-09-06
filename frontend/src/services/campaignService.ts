import { fetchApi } from './api';
import {
  Campaign,
  CampaignStatus,
  CreateCampaignPayload,
  UpdateCampaignPayload,
  CampaignRunResult,
} from '../types/campaign';

export const campaignService = {
  list: async (params: { status?: CampaignStatus; city?: string; category?: string } = {}): Promise<Campaign[]> => {
    const query = new URLSearchParams();
    if (params.status) query.append('status', params.status);
    if (params.city) query.append('city', params.city);
    if (params.category) query.append('category', params.category);

    const qs = query.toString() ? `?${query.toString()}` : '';
    const res = await fetchApi<Campaign[]>(`/api/campaigns${qs}`);
    return res.data ?? [];
  },

  getById: async (id: number): Promise<Campaign> => {
    const res = await fetchApi<Campaign>(`/api/campaigns/${id}`);
    return res.data!;
  },

  create: async (payload: CreateCampaignPayload): Promise<Campaign> => {
    const res = await fetchApi<Campaign>('/api/campaigns', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    return res.data!;
  },

  update: async (id: number, payload: UpdateCampaignPayload): Promise<Campaign> => {
    const res = await fetchApi<Campaign>(`/api/campaigns/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
    return res.data!;
  },

  delete: async (id: number): Promise<void> => {
    await fetchApi(`/api/campaigns/${id}`, {
      method: 'DELETE',
    });
  },

  run: async (id: number, leadIds?: number[]): Promise<CampaignRunResult> => {
    const res = await fetchApi<CampaignRunResult>(`/api/campaigns/${id}/run`, {
      method: 'POST',
      body: leadIds && leadIds.length > 0 ? JSON.stringify({ leadIds }) : undefined,
    });
    return res.data!;
  },
};

