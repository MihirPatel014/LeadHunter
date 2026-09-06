export type CampaignStatus = 'DRAFT' | 'ACTIVE' | 'PAUSED' | 'COMPLETED';
export type CampaignChannel = 'EMAIL' | 'WHATSAPP';

export interface Campaign {
  id: number;
  name: string;
  description?: string | null;
  city?: string | null;
  category?: string | null;
  leadSource?: string | null;
  leadIds?: number[] | null;
  templateId: number;
  channel: CampaignChannel;
  dailyLimit: number;
  status: CampaignStatus;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCampaignPayload {
  name: string;
  description?: string;
  city?: string;
  category?: string;
  leadSource?: string;
  leadIds?: number[];
  templateId: number;
  channel?: CampaignChannel;
  dailyLimit?: number;
  status?: CampaignStatus;
}

export interface UpdateCampaignPayload {
  name?: string;
  description?: string;
  city?: string;
  category?: string;
  leadSource?: string;
  leadIds?: number[];
  templateId?: number;
  channel?: CampaignChannel;
  dailyLimit?: number;
  status?: CampaignStatus;
}

export interface CampaignRunResult {
  enqueued: number;
  skipped: number;
  reasons: {
    noEmail: number;
    alreadyQueued: number;
    ineligibleStatus: number;
  };
}

