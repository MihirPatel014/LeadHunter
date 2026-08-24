export interface AnalyticsOverview {
  leads: {
    total: number;
    new: number;
    contacted: number;
    replied: number;
    interested: number;
    converted: number;
    disqualified: number;
  };
  outreach: {
    totalSent: number;
    pendingApprovals: number;
  };
  campaigns: {
    total: number;
    active: number;
  };
  rates: {
    conversionRate: number;
    responseRate: number;
  };
}

export interface PipelineStage {
  status: string;
  count: number;
}

export interface CityStat {
  city: string;
  count: number;
}

export interface CategoryStat {
  category: string;
  count: number;
}

export interface SourceStat {
  source: string;
  count: number;
}

export interface TemperatureStat {
  temperature: string;
  count: number;
}

export interface CampaignStat {
  id: number;
  name: string;
  status: string;
  channel: string;
  city?: string | null;
  category?: string | null;
  dailyLimit: number;
  createdAt: string;
  messagesSent: number;
}
