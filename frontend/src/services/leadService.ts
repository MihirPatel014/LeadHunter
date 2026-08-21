import { fetchApi } from './api';
import { Lead, LeadQueryParams, PaginatedLeadsResponse, CreateLeadPayload, UpdateLeadPayload, WebsiteStatus, LeadStatus, TemperatureStatus } from '../types/lead';

export interface ValidationResponse {
  lead: Lead;
  validation: {
    url: string | null;
    status: WebsiteStatus;
    dnsReachable: boolean;
    httpStatus?: number;
    isHttps: boolean;
    reachable: boolean;
    error?: string;
  };
}

export interface BulkValidationResponse {
  total: number;
  online: number;
  offline: number;
  invalid: number;
  results: Array<{ leadId: number; businessName: string; status: WebsiteStatus }>;
}

export interface ScoringReason {
  rule: string;
  points: number;
}

export interface ScoringResponse {
  lead: Lead;
  score: number;
  temperature: TemperatureStatus;
  reasons: ScoringReason[];
}

export interface BulkScoringResponse {
  total: number;
  hot: number;
  warm: number;
  low: number;
  results: Array<{ leadId: number; businessName: string; score: number; temperature: TemperatureStatus; reasons: ScoringReason[] }>;
}

export const leadService = {
  getLeads: async (params: LeadQueryParams = {}): Promise<PaginatedLeadsResponse> => {
    const query = new URLSearchParams();
    if (params.page) query.append('page', params.page.toString());
    if (params.limit) query.append('limit', params.limit.toString());
    if (params.search) query.append('search', params.search);
    if (params.status) query.append('status', params.status);
    if (params.temperature) query.append('temperature', params.temperature);
    if (params.city) query.append('city', params.city);
    if (params.category) query.append('category', params.category);
    if (params.websiteStatus) query.append('websiteStatus', params.websiteStatus);
    if (params.websiteType && params.websiteType !== 'ALL') query.append('websiteType', params.websiteType);

    const res = await fetchApi<PaginatedLeadsResponse>(`/api/leads?${query.toString()}`);

    return res.data!;
  },

  getLeadById: async (id: number): Promise<Lead> => {
    const res = await fetchApi<Lead>(`/api/leads/${id}`);
    return res.data!;
  },

  createLead: async (payload: CreateLeadPayload): Promise<Lead> => {
    const res = await fetchApi<Lead>('/api/leads', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    return res.data!;
  },

  updateLead: async (id: number, payload: UpdateLeadPayload): Promise<Lead> => {
    const res = await fetchApi<Lead>(`/api/leads/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
    return res.data!;
  },

  deleteLead: async (id: number): Promise<void> => {
    await fetchApi(`/api/leads/${id}`, {
      method: 'DELETE',
    });
  },

  validateLead: async (id: number): Promise<ValidationResponse> => {
    const res = await fetchApi<ValidationResponse>(`/api/leads/${id}/validate`, {
      method: 'POST',
    });
    return res.data!;
  },

  bulkValidateLeads: async (leadIds?: number[]): Promise<BulkValidationResponse> => {
    const res = await fetchApi<BulkValidationResponse>('/api/leads/validate', {
      method: 'POST',
      body: JSON.stringify({ leadIds }),
    });
    return res.data!;
  },

  scoreLead: async (id: number): Promise<ScoringResponse> => {
    const res = await fetchApi<ScoringResponse>(`/api/leads/${id}/score`, {
      method: 'POST',
    });
    return res.data!;
  },

  getScoringBreakdown: async (id: number): Promise<{ score: number; temperature: TemperatureStatus; reasons: ScoringReason[] }> => {
    const res = await fetchApi<{ score: number; temperature: TemperatureStatus; reasons: ScoringReason[] }>(`/api/leads/${id}/score`);
    return res.data!;
  },

  bulkScoreLeads: async (leadIds?: number[]): Promise<BulkScoringResponse> => {
    const res = await fetchApi<BulkScoringResponse>('/api/leads/score', {
      method: 'POST',
      body: JSON.stringify({ leadIds }),
    });
    return res.data!;
  },

  bulkDelete: async (payload: { ids: number[] }): Promise<{ deleted: number }> => {
    const results = await Promise.all(payload.ids.map((id) => leadService.deleteLead(id)));
    return { deleted: results.length };
  },

  bulkUpdate: async (payload: { ids: number[]; data: { status?: LeadStatus; temperature?: TemperatureStatus } }): Promise<{ updated: number }> => {
    const results = await Promise.all(payload.ids.map((id) => leadService.updateLead(id, payload.data)));
    return { updated: results.length };
  },

  previewCsvImport: async (csvContent: string): Promise<{
    total: number;
    newLeads: number;
    duplicates: number;
    items: Array<{
      tempId: string;
      businessName: string;
      category: string | null;
      city: string | null;
      address: string | null;
      website: string | null;
      mapsUrl: string | null;
      phone: string | null;
      email: string | null;
      rating: number | null;
      reviewCount: number | null;
      isDuplicate: boolean;
      duplicateReason?: string;
      existingId?: number;
      selected?: boolean;
    }>;
  }> => {
    const res = await fetchApi<{
      total: number;
      newLeads: number;
      duplicates: number;
      items: any[];
    }>('/api/leads/import/preview', {
      method: 'POST',
      body: JSON.stringify({ csvContent }),
    });
    return res.data!;
  },

  confirmCsvImport: async (leads: Array<{
    businessName: string;
    category?: string | null;
    city?: string | null;
    address?: string | null;
    website?: string | null;
    mapsUrl?: string | null;
    phone?: string | null;
    email?: string | null;
    rating?: number | null;
    reviewCount?: number | null;
    updateIfExisting?: boolean;
  }>): Promise<{
    created: number;
    updated: number;
    total: number;
  }> => {
    const res = await fetchApi<{
      created: number;
      updated: number;
      total: number;
    }>('/api/leads/import/confirm', {
      method: 'POST',
      body: JSON.stringify({ leads }),
    });
    return res.data!;
  },
};

