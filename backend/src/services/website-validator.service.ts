import dns from 'node:dns/promises';
import { prisma } from '../config/prisma.js';
import { WebsiteStatus } from '../types/lead.types.js';

export interface ValidationResult {
  url: string | null;
  status: WebsiteStatus;
  dnsReachable: boolean;
  httpStatus?: number;
  isHttps: boolean;
  reachable: boolean;
  error?: string;
}

export class WebsiteValidatorService {
  /**
   * Validate a single website URL
   */
  async validateUrl(rawUrl: string | null | undefined): Promise<ValidationResult> {
    if (!rawUrl || !rawUrl.trim()) {
      return {
        url: null,
        status: 'INVALID',
        dnsReachable: false,
        isHttps: false,
        reachable: false,
        error: 'No website URL provided',
      };
    }

    let urlString = rawUrl.trim();
    if (!/^https?:\/\//i.test(urlString)) {
      urlString = `https://${urlString}`;
    }

    let parsedUrl: URL;
    try {
      parsedUrl = new URL(urlString);
    } catch {
      return {
        url: rawUrl,
        status: 'INVALID',
        dnsReachable: false,
        isHttps: false,
        reachable: false,
        error: 'Invalid URL syntax',
      };
    }

    const hostname = parsedUrl.hostname;
    const isHttps = parsedUrl.protocol === 'https:';

    // 1. DNS Resolution
    let dnsReachable = false;
    try {
      await dns.lookup(hostname);
      dnsReachable = true;
    } catch (err: any) {
      return {
        url: urlString,
        status: 'OFFLINE',
        dnsReachable: false,
        isHttps,
        reachable: false,
        error: `DNS resolution failed for ${hostname}`,
      };
    }

    // 2. HTTP Request check
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 7000);

      let response: Response;
      try {
        // Try HEAD request first
        response = await fetch(urlString, {
          method: 'HEAD',
          signal: controller.signal,
          headers: {
            'User-Agent': 'LeadHunter-WebsiteValidator/1.0',
          },
          redirect: 'follow',
        });
      } catch {
        // Fallback to GET request
        response = await fetch(urlString, {
          method: 'GET',
          signal: controller.signal,
          headers: {
            'User-Agent': 'LeadHunter-WebsiteValidator/1.0',
          },
          redirect: 'follow',
        });
      } finally {
        clearTimeout(timeoutId);
      }

      const isSuccess = response.status >= 200 && response.status < 400;
      const status: WebsiteStatus = isSuccess ? 'ONLINE' : 'OFFLINE';

      return {
        url: urlString,
        status,
        dnsReachable,
        httpStatus: response.status,
        isHttps,
        reachable: isSuccess,
      };
    } catch (err: any) {
      return {
        url: urlString,
        status: 'OFFLINE',
        dnsReachable,
        isHttps,
        reachable: false,
        error: err.name === 'AbortError' ? 'Request timed out' : err.message || 'Network error',
      };
    }
  }

  /**
   * Validate a lead's website by lead ID and update its websiteStatus in DB
   */
  async validateLead(leadId: number) {
    const lead = await prisma.lead.findUnique({ where: { id: leadId } });
    if (!lead) {
      const error: any = new Error(`Lead with ID ${leadId} not found`);
      error.statusCode = 404;
      throw error;
    }

    const result = await this.validateUrl(lead.website);

    const updatedLead = await prisma.lead.update({
      where: { id: leadId },
      data: {
        websiteStatus: result.status,
      },
    });

    return {
      lead: updatedLead,
      validation: result,
    };
  }

  /**
   * Bulk validate leads (by list of lead IDs or all leads)
   */
  async bulkValidateLeads(leadIds?: number[]) {
    const where = leadIds && leadIds.length > 0 ? { id: { in: leadIds } } : {};
    const leads = await prisma.lead.findMany({ where });

    let online = 0;
    let offline = 0;
    let invalid = 0;
    const results: Array<{ leadId: number; businessName: string; status: WebsiteStatus }> = [];

    for (const lead of leads) {
      const val = await this.validateUrl(lead.website);

      await prisma.lead.update({
        where: { id: lead.id },
        data: { websiteStatus: val.status },
      });

      if (val.status === 'ONLINE') online++;
      else if (val.status === 'OFFLINE') offline++;
      else invalid++;

      results.push({
        leadId: lead.id,
        businessName: lead.businessName,
        status: val.status,
      });
    }

    return {
      total: leads.length,
      online,
      offline,
      invalid,
      results,
    };
  }
}
