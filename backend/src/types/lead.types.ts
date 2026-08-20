export const TEMPERATURE_VALUES = ['HOT', 'WARM', 'LOW'] as const;
export type Temperature = (typeof TEMPERATURE_VALUES)[number];

export const LEAD_STATUS_VALUES = [
  'NEW',
  'RESEARCHED',
  'QUALIFIED',
  'PENDING_APPROVAL',
  'CONTACTED',
  'REPLIED',
  'INTERESTED',
  'CONVERTED',
  'DISQUALIFIED',
] as const;
export type LeadStatus = (typeof LEAD_STATUS_VALUES)[number];

export const WEBSITE_STATUS_VALUES = ['UNKNOWN', 'ONLINE', 'OFFLINE', 'INVALID'] as const;
export type WebsiteStatus = (typeof WEBSITE_STATUS_VALUES)[number];

export interface LeadFilterQuery {
  page?: number;
  limit?: number;
  search?: string;
  status?: LeadStatus;
  temperature?: Temperature;
  city?: string;
  category?: string;
}

export interface PaginatedResult<T> {
  leads: T[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}
