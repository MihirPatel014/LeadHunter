import { prisma } from '../../config/prisma.js';
import { LeadDiscoveryProvider, DiscoveryResult } from './discovery.provider.js';
import { SerpApiProvider } from './serpapi.provider.js';

export interface DiscoverySummary {
  discovered: number;
  newLeads: number;
  duplicates: number;
  items: DiscoveryResult[];
}

export class DiscoveryService {
  private provider: LeadDiscoveryProvider;

  constructor() {
    const apiKey = process.env.SERPAPI_API_KEY;
    if (!apiKey) {
      throw new Error('SERPAPI_API_KEY environment variable is not set');
    }
    this.provider = new SerpApiProvider(apiKey);
  }

  async search(city: string, category: string, limit: number): Promise<DiscoverySummary> {
    // 1. Query provider
    const results: DiscoveryResult[] = await this.provider.search(city, category, limit);

    let newLeads = 0;
    let duplicates = 0;

    // 2. Deduplicate and save
    for (const result of results) {
      const existing = await prisma.lead.findFirst({
        where: {
          businessName: { equals: result.businessName },
          city: result.city ? { equals: result.city } : undefined,
        },
      });

      if (existing) {
        duplicates++;
        // Update mapsUrl if previously missing
        if (result.mapsUrl && !existing.mapsUrl) {
          await prisma.lead.update({
            where: { id: existing.id },
            data: { mapsUrl: result.mapsUrl },
          });
        }
        continue;
      }

      await prisma.lead.create({
        data: {
          businessName: result.businessName,
          category: result.category ?? null,
          city: result.city ?? null,
          address: result.address ?? null,
          website: result.website ?? null,
          mapsUrl: result.mapsUrl ?? null,
          phone: result.phone ?? null,
          rating: result.rating ?? null,
          reviewCount: result.reviewCount ?? null,
          source: result.source,
          websiteStatus: result.website ? 'UNKNOWN' : 'INVALID',
          score: 0,
          temperature: 'LOW',
          status: 'NEW',
        },
      });

      newLeads++;
    }

    return {
      discovered: results.length,
      newLeads,
      duplicates,
      items: results,
    };
  }
}
