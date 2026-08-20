export interface DiscoveryResult {
  businessName: string;
  category?: string;
  city?: string;
  address?: string;
  website?: string;
  phone?: string;
  rating?: number;
  reviewCount?: number;
  source: string;
  googleProfileLink?: string;
}

export interface LeadDiscoveryProvider {
  search(city: string, category: string, limit: number): Promise<DiscoveryResult[]>;
}
