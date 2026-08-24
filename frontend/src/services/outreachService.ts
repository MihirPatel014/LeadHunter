import { fetchApi } from './api';
import {
  GmailStatus,
  ConnectGmailRequest,
  SendEmailRequest,
  SentMessageItem,
  SendTestEmailRequest,
  TestEmailResult,
  SaveGmailCredentialsRequest,
  SaveGmailCredentialsResponse,
} from '../types/outreach';
import {
  WhatsAppStatus,
  SendWhatsAppPayload,
  WaSession,
  WaQrCode,
  WaCreateSession,
} from '../types/whatsapp';

export const outreachService = {
  async getGmailStatus(): Promise<GmailStatus> {
    const response = await fetchApi<GmailStatus>('/api/integrations/gmail/status');
    return response.data!;
  },

  /**
   * Save Gmail OAuth credentials (client ID, secret, redirect URI, refresh token) directly to the DB.
   * No OAuth consent flow required — useful for pasting tokens from OAuth Playground.
   */
  async saveGmailCredentials(
    data: SaveGmailCredentialsRequest
  ): Promise<SaveGmailCredentialsResponse> {
    const response = await fetchApi<SaveGmailCredentialsResponse>(
      '/api/integrations/gmail/save-credentials',
      {
        method: 'POST',
        body: JSON.stringify(data),
      }
    );
    return response.data!;
  },

  async connectGmail(data?: ConnectGmailRequest): Promise<{ authUrl: string }> {
    const response = await fetchApi<{ authUrl: string }>('/api/integrations/gmail/connect', {
      method: 'POST',
      body: JSON.stringify(data || {}),
    });
    return response.data!;
  },

  async getWhatsAppStatus(): Promise<WhatsAppStatus> {
    const response = await fetchApi<WhatsAppStatus>('/api/integrations/whatsapp/status');
    return response.data!;
  },

  // ─── WhatsApp Session Management (OpenWA) ─────────────────────

  async listWaSessions(): Promise<WaSession[]> {
    const response = await fetchApi<WaSession[]>('/api/integrations/whatsapp/sessions');
    return response.data!;
  },

  async getWaSession(sessionId: string): Promise<WaSession> {
    const response = await fetchApi<WaSession>(`/api/integrations/whatsapp/sessions/${encodeURIComponent(sessionId)}`);
    return response.data!;
  },

  async createWaSession(data: WaCreateSession): Promise<WaSession> {
    const response = await fetchApi<WaSession>('/api/integrations/whatsapp/sessions', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return response.data!;
  },

  async startWaSession(sessionId: string): Promise<WaSession> {
    const response = await fetchApi<WaSession>(
      `/api/integrations/whatsapp/sessions/${encodeURIComponent(sessionId)}/start`,
      { method: 'POST' }
    );
    return response.data!;
  },

  async stopWaSession(sessionId: string): Promise<WaSession> {
    const response = await fetchApi<WaSession>(
      `/api/integrations/whatsapp/sessions/${encodeURIComponent(sessionId)}/stop`,
      { method: 'POST' }
    );
    return response.data!;
  },

  async restartWaSession(sessionId: string): Promise<WaSession> {
    const response = await fetchApi<WaSession>(
      `/api/integrations/whatsapp/sessions/${encodeURIComponent(sessionId)}/restart`,
      { method: 'POST' }
    );
    return response.data!;
  },

  async logoutWaSession(sessionId: string): Promise<WaSession> {
    const response = await fetchApi<WaSession>(
      `/api/integrations/whatsapp/sessions/${encodeURIComponent(sessionId)}/logout`,
      { method: 'POST' }
    );
    return response.data!;
  },

  async deleteWaSession(sessionId: string): Promise<void> {
    await fetchApi<void>(`/api/integrations/whatsapp/sessions/${encodeURIComponent(sessionId)}`, {
      method: 'DELETE',
    });
  },

  async forceKillWaSession(sessionId: string): Promise<WaSession> {
    const response = await fetchApi<WaSession>(
      `/api/integrations/whatsapp/sessions/${encodeURIComponent(sessionId)}/force-kill`,
      { method: 'POST' }
    );
    return response.data!;
  },

  async getWaQrCode(sessionId?: string): Promise<WaQrCode> {
    const qs = sessionId ? `?sessionId=${encodeURIComponent(sessionId)}` : '';
    const response = await fetchApi<WaQrCode>(`/api/integrations/whatsapp/qr${qs}`);
    return response.data!;
  },

  async requestWaPairingCode(
    phoneNumber: string,
    sessionId?: string
  ): Promise<{ pairingCode: string }> {
    const qs = sessionId ? `?sessionId=${encodeURIComponent(sessionId)}` : '';
    const response = await fetchApi<{ pairingCode: string }>(
      `/api/integrations/whatsapp/pairing-code${qs}`,
      { method: 'POST', body: JSON.stringify({ phoneNumber }) }
    );
    return response.data!;
  },

  // ─── Message Dispatch ──────────────────────────────────────────

  async sendEmail(data: SendEmailRequest): Promise<{ sentMessage: SentMessageItem }> {
    const response = await fetchApi<{ sentMessage: SentMessageItem }>('/api/outreach/email/send', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return response.data!;
  },

  /**
   * Send a diagnostic test email to any custom address.
   * Returns provider used + credential state for debugging Gmail vs Mock fallback.
   */
  async sendTestEmail(data: SendTestEmailRequest): Promise<TestEmailResult> {
    const response = await fetchApi<TestEmailResult>('/api/outreach/email/test', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return response.data!;
  },

  async sendWhatsApp(data: SendWhatsAppPayload): Promise<{ sentMessage: SentMessageItem }> {
    const response = await fetchApi<{ sentMessage: SentMessageItem }>('/api/outreach/whatsapp/send', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return response.data!;
  },

  async getSentHistory(leadId?: number): Promise<SentMessageItem[]> {
    const endpoint = leadId ? `/api/outreach/sent?leadId=${leadId}` : '/api/outreach/sent';
    const response = await fetchApi<SentMessageItem[]>(endpoint);
    return response.data!;
  },
};
