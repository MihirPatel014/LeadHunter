export interface SerpApiAccountInfo {
  accountStatus: string;
  planName: string;
  planId: string;
  planRenewalDate: string;
  searchesPerMonth: number;
  planSearchesLeft: number;
  extraCredits: number;
  totalSearchesLeft: number;
  thisMonthUsage: number;
  thisHourSearches: number;
  lastHourSearches: number;
  accountRateLimitPerHour: number;
}

export class SerpApiAccountService {
  private readonly apiKey: string;
  private readonly accountUrl = 'https://serpapi.com/account';

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async getAccountInfo(): Promise<SerpApiAccountInfo> {
    const url = new URL(this.accountUrl);
    url.searchParams.set('api_key', this.apiKey);

    const response = await fetch(url.toString(), {
      signal: AbortSignal.timeout(10000),
    });

    if (!response.ok) {
      const body = await response.text();
      throw new Error(`SerpAPI account request failed (${response.status}): ${body}`);
    }

    const raw = await response.json() as Record<string, unknown>;

    return {
      accountStatus: String(raw.account_status ?? 'Unknown'),
      planName: String(raw.plan_name ?? 'Unknown'),
      planId: String(raw.plan_id ?? 'unknown'),
      planRenewalDate: String(raw.plan_renewal_date ?? ''),
      searchesPerMonth: Number(raw.searches_per_month ?? 0),
      planSearchesLeft: Number(raw.plan_searches_left ?? 0),
      extraCredits: Number(raw.extra_credits ?? 0),
      totalSearchesLeft: Number(raw.total_searches_left ?? 0),
      thisMonthUsage: Number(raw.this_month_usage ?? 0),
      thisHourSearches: Number(raw.this_hour_searches ?? 0),
      lastHourSearches: Number(raw.last_hour_searches ?? 0),
      accountRateLimitPerHour: Number(raw.account_rate_limit_per_hour ?? 250),
    };
  }
}
