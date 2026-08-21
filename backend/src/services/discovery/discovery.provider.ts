export interface DiscoveryResult {
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

export interface LeadDiscoveryProvider {
  search(city: string, category: string, limit: number): Promise<DiscoveryResult[]>;
}
