import { LeadDiscoveryProvider, DiscoveryResult } from './discovery.provider.js';

export class SerpApiProvider implements LeadDiscoveryProvider {
  private readonly apiKey: string;
  private readonly baseUrl = 'https://serpapi.com/search.json';

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async search(city: string, category: string, limit: number): Promise<DiscoveryResult[]> {
    const query = `${category} in ${city}`;
    const url = new URL(this.baseUrl);
    url.searchParams.set('engine', 'google_local');
    url.searchParams.set('q', query);
    url.searchParams.set('hl', 'en');
    url.searchParams.set('api_key', this.apiKey);

    const response = await fetch(url.toString(), {
      signal: AbortSignal.timeout(15000),
    });

    if (!response.ok) {
      const body = await response.text();
      throw new Error(`SerpAPI request failed (${response.status}): ${body}`);
    }

    const data = (await response.json()) as { local_results?: any[] };
    const localResults = data.local_results || [];
    const sliced = localResults.slice(0, limit);

    return sliced.map((r: any): DiscoveryResult => {
      // Robust website extraction across different SerpAPI schema formats
      const websiteUrl =
        r.website ||
        r.links?.website ||
        (typeof r.link === 'string' && !r.link.includes('google.com/maps') ? r.link : undefined) ||
        r.website_url;

      // Google Maps URL extraction
      const mapsUrl =
        r.google_maps_url ||
        r.links?.directions ||
        (r.place_id ? `https://www.google.com/maps/place/?q=place_id:${r.place_id}` : undefined) ||
        (r.cid ? `https://maps.google.com/?cid=${r.cid}` : undefined);

      return {
        businessName: r.title || r.name || 'Unknown Business',
        category,
        city,
        address: r.address || undefined,
        website: websiteUrl || undefined,
        mapsUrl: mapsUrl || undefined,
        phone: r.phone || undefined,
        rating: typeof r.rating === 'number' ? r.rating : undefined,
        reviewCount: typeof r.reviews === 'number' ? r.reviews : undefined,
        source: 'SERPAPI',
        raw: r,
      };
    });
  }
}
