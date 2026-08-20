import { fetchApi } from './api';
import { Lead, LeadQueryParams, PaginatedLeadsResponse, CreateLeadPayload, UpdateLeadPayload } from '../types/lead';

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
};
