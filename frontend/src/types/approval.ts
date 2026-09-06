export type ApprovalStatus =
  | 'DRAFT'
  | 'PENDING_APPROVAL'
  | 'APPROVED'
  | 'REJECTED'
  | 'SENT'
  | 'FAILED';

export type ApprovalChannel = 'EMAIL' | 'WHATSAPP';

import { Lead } from './lead';

export interface Approval {
  id: number;
  leadId: number | null;
  templateId: number | null;
  channel: ApprovalChannel;
  recipient: string;
  subject: string | null;
  body: string;
  status: ApprovalStatus;
  reviewNote: string | null;
  sentMessageId: number | null;
  createdAt: string;
  updatedAt: string;
  lead?: Lead | null;
  template?: {
    id: number;
    name: string;
    channel: string;
  } | null;
}

export interface CreateApprovalPayload {
  leadId?: number;
  templateId?: number;
  channel?: ApprovalChannel;
  recipient: string;
  subject?: string;
  body: string;
  status?: 'DRAFT' | 'PENDING_APPROVAL';
}

export interface UpdateApprovalPayload {
  subject?: string;
  body?: string;
}

export interface RejectApprovalPayload {
  note?: string;
}
