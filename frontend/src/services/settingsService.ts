import { fetchApi } from './api';
import { AppSettingItem } from '../types/settings';

export const settingsService = {
  async getSettings(category?: string): Promise<AppSettingItem[]> {
    const endpoint = category ? `/api/settings?category=${category}` : '/api/settings';
    const res = await fetchApi<AppSettingItem[]>(endpoint);
    return res.data!;
  },

  async updateSetting(key: string, value: string): Promise<void> {
    await fetchApi('/api/settings', {
      method: 'POST',
      body: JSON.stringify({ key, value }),
    });
  },

  async updateSettingsBulk(settings: Record<string, string>): Promise<void> {
    await fetchApi('/api/settings/bulk', {
      method: 'POST',
      body: JSON.stringify(settings),
    });
  },

  async rescoreAllLeads(): Promise<{ total: number; hot: number; warm: number; low: number }> {
    const res = await fetchApi<{ total: number; hot: number; warm: number; low: number }>('/api/leads/score', {
      method: 'POST',
      body: JSON.stringify({}),
    });
    return res.data!;
  },
};
