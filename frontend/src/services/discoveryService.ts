import { fetchApi } from './api';

export interface DiscoverySearchPayload {
  city: string;
  category: string;
  limit?: number;
}

export interface DiscoveryItem {
  businessName: string;
  category?: string;
  city?: string;
  address?: string;
  website?: string;
  mapsUrl?: string;
  phone?: string;
  rating?: number;
  reviewCount?: number;
  source: string;
  raw?: any;
}

export interface DiscoverySummary {
  discovered: number;
  newLeads: number;
  duplicates: number;
  items: DiscoveryItem[];
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
