export type TemperatureStatus = 'HOT' | 'WARM' | 'LOW';

export type LeadStatus =
  | 'NEW'
  | 'RESEARCHED'
  | 'QUALIFIED'
  | 'PENDING_APPROVAL'
  | 'CONTACTED'
  | 'REPLIED'
  | 'INTERESTED'
  | 'CONVERTED'
  | 'DISQUALIFIED';

export type WebsiteStatus = 'UNKNOWN' | 'ONLINE' | 'OFFLINE' | 'INVALID';

export interface Lead {
  id: number;
  businessName: string;
  category: string | null;
  city: string | null;
  address: string | null;
  website: string | null;
  mapsUrl?: string | null;
  phone: string | null;
  email: string | null;
  rating: number | null;
  reviewCount: number | null;
  websiteStatus: WebsiteStatus;
  score: number;
  temperature: TemperatureStatus;
  status: LeadStatus;
  source: string;
  googleProfileLink: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface LeadQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: LeadStatus;
  temperature?: TemperatureStatus;
  city?: string;
  category?: string;
}

export interface PaginatedLeadsResponse {
  leads: Lead[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface CreateLeadPayload {
  businessName: string;
  category?: string;
  city?: string;
  address?: string;
  website?: string;
  phone?: string;
  email?: string;
  rating?: number;
  reviewCount?: number;
  websiteStatus?: WebsiteStatus;
  score?: number;
  temperature?: TemperatureStatus;
  status?: LeadStatus;
  source?: string;
  googleProfileLink?: string;
}

export type UpdateLeadPayload = Partial<CreateLeadPayload>;

export interface BulkDeletePayload {
  ids: number[];
}

export interface BulkUpdatePayload {
  ids: number[];
  data: {
    status?: LeadStatus;
    temperature?: TemperatureStatus;
    category?: string;
    city?: string;
  };
}
