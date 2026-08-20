import { LeadDiscoveryProvider, DiscoveryResult } from './discovery.provider.js';

export class SerpApiProvider implements LeadDiscoveryProvider {
  private readonly apiKey: string;
  private readonly baseUrl = 'https://serpapi.com/search.json';

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async search(city: string, category: string, limit: number): Promise<DiscoveryResult[]> {
    const query = category;
    const url = new URL(this.baseUrl);
    url.searchParams.set('engine', 'google_local');
    url.searchParams.set('q', query);
    url.searchParams.set('location', city);
    url.searchParams.set('hl', 'en');
    url.searchParams.set('api_key', this.apiKey);

    const response = await fetch(url.toString(), {
      signal: AbortSignal.timeout(15000),
    });

    if (!response.ok) {
      const body = await response.text();
      throw new Error(`SerpAPI request failed (${response.status}): ${body}`);
    }

    const data = await response.json() as { local_results?: any[] };
    const localResults = data.local_results || [];
    const sliced = localResults.slice(0, limit);

    return sliced.map((r: any): DiscoveryResult => ({
      businessName: r.title || 'Unknown Business',
      category,
      city,
      address: r.address || undefined,
      website: r.website || undefined,
      phone: r.phone || undefined,
      rating: typeof r.rating === 'number' ? r.rating : undefined,
      reviewCount: typeof r.reviews === 'number' ? r.reviews : undefined,
      source: 'SERPAPI',
    }));
  }
}
