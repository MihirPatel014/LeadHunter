import { fetchApi } from './api';
import { Approval, CreateApprovalPayload, UpdateApprovalPayload, RejectApprovalPayload } from '../types/approval';

export const approvalService = {
  async list(status?: string): Promise<Approval[]> {
    const qs = status ? `?status=${status}` : '';
    const res = await fetchApi<Approval[]>(`/api/approvals${qs}`);
    return res.data ?? [];
  },

  async getById(id: number): Promise<Approval> {
    const res = await fetchApi<Approval>(`/api/approvals/${id}`);
    return res.data!;
  },

  async create(payload: CreateApprovalPayload): Promise<Approval> {
    const res = await fetchApi<Approval>('/api/approvals', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    return res.data!;
  },

  async update(id: number, payload: UpdateApprovalPayload): Promise<Approval> {
    const res = await fetchApi<Approval>(`/api/approvals/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
    return res.data!;
  },

  async approve(id: number): Promise<{ status: string; sentMessage: object }> {
    const res = await fetchApi<{ status: string; sentMessage: object }>(`/api/approvals/${id}/approve`, {
      method: 'POST',
    });
    return res.data!;
  },

  async reject(id: number, payload: RejectApprovalPayload): Promise<Approval> {
    const res = await fetchApi<Approval>(`/api/approvals/${id}/reject`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    return res.data!;
  },

  async bulkApprove(ids: number[]): Promise<{ approved: number; failed: number; errors: Array<{ id: number; error: string }> }> {
    const res = await fetchApi<{ approved: number; failed: number; errors: Array<{ id: number; error: string }> }>('/api/approvals/bulk-approve', {
      method: 'POST',
      body: JSON.stringify({ ids }),
    });
    return res.data!;
  },

  async bulkReject(ids: number[], note?: string): Promise<{ rejected: number }> {
    const res = await fetchApi<{ rejected: number }>('/api/approvals/bulk-reject', {
      method: 'POST',
      body: JSON.stringify({ ids, note }),
    });
    return res.data!;
  },
};

