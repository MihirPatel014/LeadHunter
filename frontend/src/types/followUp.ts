import { Lead } from './lead';

export type FollowUpStatus = 'SCHEDULED' | 'QUEUED_FOR_APPROVAL' | 'SKIPPED' | 'CANCELLED';

export interface FollowUpSchedule {
  id: number;
  leadId: number;
  templateId?: number | null;
  step: number;
  scheduledAt: string;
  status: FollowUpStatus;
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
  lead?: Lead | null;
}

export interface FollowUpConfig {
  id: number;
  name: string;
  intervals: string; // e.g. "1,3,7,10"
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface FollowUpProcessResult {
  processed: number;
  queuedForApproval: number;
  stopped: number;
  errors: number;
}
