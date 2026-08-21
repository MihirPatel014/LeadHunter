import { fetchApi } from './api';
import { Template, TemplateChannel, TemplateVariable, CreateTemplatePayload, UpdateTemplatePayload } from '../types/template';

export const templateService = {
  getTemplates: async (params: { channel?: TemplateChannel; search?: string; isActive?: boolean } = {}): Promise<Template[]> => {
    const query = new URLSearchParams();
    if (params.channel) query.append('channel', params.channel);
    if (params.search) query.append('search', params.search);
    if (params.isActive !== undefined) query.append('isActive', String(params.isActive));

    const res = await fetchApi<Template[]>(`/api/templates?${query.toString()}`);
    return res.data!;
  },

  getTemplateById: async (id: number): Promise<Template> => {
    const res = await fetchApi<Template>(`/api/templates/${id}`);
    return res.data!;
  },

  createTemplate: async (payload: CreateTemplatePayload): Promise<Template> => {
    const res = await fetchApi<Template>('/api/templates', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    return res.data!;
  },

  updateTemplate: async (id: number, payload: UpdateTemplatePayload): Promise<Template> => {
    const res = await fetchApi<Template>(`/api/templates/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
    return res.data!;
  },

  deleteTemplate: async (id: number): Promise<void> => {
    await fetchApi(`/api/templates/${id}`, {
      method: 'DELETE',
    });
  },

  getVariables: async (): Promise<TemplateVariable[]> => {
    const res = await fetchApi<TemplateVariable[]>('/api/templates/variables');
    return res.data!;
  },
};
