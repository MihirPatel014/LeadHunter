import { fetchApi } from './api';

export interface DiscoverySearchPayload {
  city: string;
  category: string;
  limit?: number;
}

export interface DiscoverySummary {
  discovered: number;
  newLeads: number;
  duplicates: number;
}

export const discoveryService = {
  search: async (payload: DiscoverySearchPayload): Promise<DiscoverySummary> => {
    const res = await fetchApi<DiscoverySummary>('/api/discovery/search', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    return res.data!;
  },
};
