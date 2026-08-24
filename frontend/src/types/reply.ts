import { Lead } from './lead';

export interface Reply {
  id: number;
  leadId?: number | null;
  sentMessageId?: number | null;
  threadId: string;
  messageId: string;
  sender: string;
  subject?: string | null;
  body: string;
  replyAt: string;
  createdAt: string;
  lead?: Lead | null;
}

export interface SyncRepliesResult {
  threadsChecked: number;
  repliesFound: number;
  leadsUpdated: number;
  source: 'imap' | 'gmail_api' | 'mock_or_unconfigured';
}

export interface SimulateReplyPayload {
  leadId: number;
  sender?: string;
  subject?: string;
  body: string;
}
