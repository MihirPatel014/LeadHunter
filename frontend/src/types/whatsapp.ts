export type WaSessionStatus =
  | 'created'
  | 'initializing'
  | 'qr_ready'
  | 'authenticating'
  | 'ready'
  | 'disconnected'
  | 'action_required'
  | 'failed';

export interface WhatsAppStatus {
  isConnected: boolean;
  provider: string;
  mode: 'openwa' | 'unconfigured';
  baseUrl?: string;
  sessionId?: string;
  sessionStatus?: string;
  gatewayReachable: boolean;
  precheckContacts: boolean;
  error?: string;
}

export interface WaSession {
  id: string;
  name: string;
  status: WaSessionStatus;
  phone?: string | null;
  pushName?: string | null;
  connectedAt?: string | null;
  lastActive?: string | null;
  createdAt: string;
  updatedAt: string;
  lastError?: string | null;
  engineLoaded: boolean;
}

export interface WaQrCode {
  qrCode: string;
  status: WaSessionStatus;
}

export interface WaCreateSession {
  name: string;
  autoRejectCalls?: boolean;
  maxReconnectAttempts?: number | null;
  reconnectBaseDelay?: number;
  proxyUrl?: string;
  proxyType?: 'http' | 'https' | 'socks4' | 'socks5';
}

export interface SendWhatsAppPayload {
  leadId?: number;
  recipient: string;
  body: string;
}

export interface SendWhatsAppResponse {
  success: boolean;
  message: string;
  data: {
    success: boolean;
    sentMessage: {
      id: number;
      leadId?: number | null;
      recipient: string;
      subject: string;
      body: string;
      channel: string;
      provider: string;
      messageId?: string | null;
      status: string;
      sentAt: string;
    };
  };
}
