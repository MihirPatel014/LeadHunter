export interface WhatsAppOptions {
  baseUrl?: string;
  apiKey?: string;
  sessionId?: string;
  precheckContacts?: boolean;
}

export interface SendWhatsAppResult {
  success: boolean;
  messageId?: string;
  recipient: string;
  provider: string;
  sentAt: Date;
  error?: string;
}

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

export interface OpenWaSession {
  id: string;
  name: string;
  status:
    | 'created'
    | 'initializing'
    | 'qr_ready'
    | 'authenticating'
    | 'ready'
    | 'disconnected'
    | 'action_required'
    | 'failed';
  phone?: string | null;
  pushName?: string | null;
  connectedAt?: string | null;
  lastActive?: string | null;
  createdAt: string;
  updatedAt: string;
  lastError?: string | null;
  engineLoaded: boolean;
}

export interface OpenWaQrCode {
  qrCode: string;
  status: OpenWaSession['status'];
}

export interface CreateSessionOptions {
  name: string;
  autoRejectCalls?: boolean;
  maxReconnectAttempts?: number | null;
  reconnectBaseDelay?: number;
  proxyUrl?: string;
  proxyType?: 'http' | 'https' | 'socks4' | 'socks5';
}

interface OpenWaSendTextResponse {
  messageId?: string;
  timestamp?: number;
}

interface OpenWaContactCheckResponse {
  exists?: boolean;
  whatsappId?: string;
}

interface OpenWaErrorResponse {
  statusCode?: number;
  message?: string | string[];
  error?: string;
  code?: string;
}

export class WhatsAppProvider {
  readonly providerName = 'openwa';
  private readonly baseUrl: string;
  private readonly apiBaseUrl: string;
  private readonly apiKey: string;
  private readonly sessionId: string;
  private readonly precheckContacts: boolean;

  constructor(options?: WhatsAppOptions) {
    this.baseUrl = (options?.baseUrl || process.env.OPENWA_BASE_URL || '').trim();
    this.apiKey = (options?.apiKey || process.env.OPENWA_API_KEY || '').trim();
    this.sessionId = (options?.sessionId || process.env.OPENWA_SESSION_ID || '').trim();
    this.precheckContacts = options?.precheckContacts ?? process.env.OPENWA_PRECHECK_CONTACTS === 'true';
    this.apiBaseUrl = this.toApiBaseUrl(this.baseUrl);
  }

  isConfigured(): boolean {
    return Boolean(this.baseUrl && this.apiKey && this.sessionId);
  }

  isGatewayConfigured(): boolean {
    return Boolean(this.baseUrl && this.apiKey);
  }

  // ────────────────────────────────────────────────────────────────
  // Connection Status
  // ────────────────────────────────────────────────────────────────

  async getStatus(): Promise<WhatsAppStatus> {
    if (!this.isGatewayConfigured()) {
      return {
        isConnected: false,
        provider: this.providerName,
        mode: 'unconfigured',
        gatewayReachable: false,
        precheckContacts: this.precheckContacts,
        error: 'OpenWA integration not configured. Set OPENWA_BASE_URL, OPENWA_API_KEY, and OPENWA_SESSION_ID.',
      };
    }

    try {
      const session = await this.request<OpenWaSession>(this.sessionPath());
      const sessionStatus = session.status || 'unknown';

      return {
        isConnected: sessionStatus === 'ready',
        provider: this.providerName,
        mode: 'openwa',
        baseUrl: this.maskBaseUrl(this.baseUrl),
        sessionId: session.id || session.name || this.sessionId,
        sessionStatus,
        gatewayReachable: true,
        precheckContacts: this.precheckContacts,
        error: sessionStatus === 'ready' ? undefined : `OpenWA session is ${sessionStatus}.`,
      };
    } catch (err: unknown) {
      return {
        isConnected: false,
        provider: this.providerName,
        mode: 'openwa',
        baseUrl: this.maskBaseUrl(this.baseUrl),
        sessionId: this.sessionId,
        gatewayReachable: false,
        precheckContacts: this.precheckContacts,
        error: this.errorMessage(err),
      };
    }
  }

  // ────────────────────────────────────────────────────────────────
  // Session Lifecycle Management
  // ────────────────────────────────────────────────────────────────

  async listSessions(): Promise<OpenWaSession[]> {
    this.ensureGatewayConfigured();
    return this.request<OpenWaSession[]>('/sessions');
  }

  async getSession(sessionId?: string): Promise<OpenWaSession> {
    this.ensureGatewayConfigured();
    return this.request<OpenWaSession>(`/sessions/${encodeURIComponent(sessionId || this.sessionId)}`);
  }

  async createSession(options: CreateSessionOptions): Promise<OpenWaSession> {
    this.ensureGatewayConfigured();
    const config: Record<string, any> = {};
    if (options.autoRejectCalls !== undefined) config.autoRejectCalls = options.autoRejectCalls;
    if (options.maxReconnectAttempts !== undefined) config.maxReconnectAttempts = options.maxReconnectAttempts;
    if (options.reconnectBaseDelay !== undefined) config.reconnectBaseDelay = options.reconnectBaseDelay;

    const payload: Record<string, any> = { name: options.name };
    if (Object.keys(config).length > 0) payload.config = config;
    if (options.proxyUrl) payload.proxyUrl = options.proxyUrl;
    if (options.proxyType) payload.proxyType = options.proxyType;

    return this.request<OpenWaSession>('/sessions', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  async startSession(sessionId?: string): Promise<OpenWaSession> {
    this.ensureGatewayConfigured();
    return this.request<OpenWaSession>(
      `/sessions/${encodeURIComponent(sessionId || this.sessionId)}/start`,
      { method: 'POST' }
    );
  }

  async stopSession(sessionId?: string): Promise<OpenWaSession> {
    this.ensureGatewayConfigured();
    return this.request<OpenWaSession>(
      `/sessions/${encodeURIComponent(sessionId || this.sessionId)}/stop`,
      { method: 'POST' }
    );
  }

  async restartSession(sessionId?: string): Promise<OpenWaSession> {
    this.ensureGatewayConfigured();
    const sid = sessionId || this.sessionId;
    try {
      await this.request<OpenWaSession>(`/sessions/${encodeURIComponent(sid)}/stop`, { method: 'POST' });
    } catch {
      // Stop may fail if already stopped — continue to start
    }
    return this.request<OpenWaSession>(`/sessions/${encodeURIComponent(sid)}/start`, { method: 'POST' });
  }

  async logoutSession(sessionId?: string): Promise<OpenWaSession> {
    this.ensureGatewayConfigured();
    return this.request<OpenWaSession>(
      `/sessions/${encodeURIComponent(sessionId || this.sessionId)}/logout`,
      { method: 'POST' }
    );
  }

  async deleteSession(sessionId?: string): Promise<void> {
    this.ensureGatewayConfigured();
    await this.request<void>(
      `/sessions/${encodeURIComponent(sessionId || this.sessionId)}`,
      { method: 'DELETE' }
    );
  }

  async forceKillSession(sessionId?: string): Promise<OpenWaSession> {
    this.ensureGatewayConfigured();
    return this.request<OpenWaSession>(
      `/sessions/${encodeURIComponent(sessionId || this.sessionId)}/force-kill`,
      { method: 'POST' }
    );
  }

  // ────────────────────────────────────────────────────────────────
  // QR Code & Pairing
  // ────────────────────────────────────────────────────────────────

  async getQrCode(sessionId?: string): Promise<OpenWaQrCode> {
    this.ensureGatewayConfigured();
    return this.request<OpenWaQrCode>(
      `/sessions/${encodeURIComponent(sessionId || this.sessionId)}/qr`
    );
  }

  async requestPairingCode(
    phoneNumber: string,
    sessionId?: string
  ): Promise<{ pairingCode: string }> {
    this.ensureGatewayConfigured();
    return this.request<{ pairingCode: string }>(
      `/sessions/${encodeURIComponent(sessionId || this.sessionId)}/pairing-code`,
      {
        method: 'POST',
        body: JSON.stringify({ phoneNumber }),
      }
    );
  }

  // ────────────────────────────────────────────────────────────────
  // Message Sending
  // ────────────────────────────────────────────────────────────────

  async sendMessage(options: { to: string; body: string }): Promise<SendWhatsAppResult> {
    const formattedRecipient = this.toChatId(options.to);

    if (!this.isConfigured()) {
      throw new Error('OpenWA integration not configured. Set OPENWA_BASE_URL, OPENWA_API_KEY, and OPENWA_SESSION_ID.');
    }

    try {
      if (this.precheckContacts && formattedRecipient.endsWith('@c.us')) {
        await this.ensureContactExists(formattedRecipient);
      }

      const response = await this.request<OpenWaSendTextResponse>(
        `${this.sessionPath()}/messages/send-text`,
        {
          method: 'POST',
          body: JSON.stringify({
            chatId: formattedRecipient,
            text: options.body,
          }),
        }
      );

      return {
        success: true,
        messageId: response.messageId || `openwa_${Date.now()}`,
        recipient: formattedRecipient,
        provider: this.providerName,
        sentAt: new Date(),
      };
    } catch (err: unknown) {
      return {
        success: false,
        recipient: formattedRecipient,
        provider: this.providerName,
        sentAt: new Date(),
        error: this.errorMessage(err),
      };
    }
  }

  // ────────────────────────────────────────────────────────────────
  // Webhook Management
  // ────────────────────────────────────────────────────────────────

  async listWebhooks(sessionId?: string): Promise<any[]> {
    this.ensureGatewayConfigured();
    const sid = sessionId || this.sessionId;
    return this.request<any[]>(`/sessions/${encodeURIComponent(sid)}/webhooks`);
  }

  async registerWebhook(options: {
    url: string;
    events?: string[];
    secret?: string;
    sessionId?: string;
  }): Promise<any> {
    this.ensureGatewayConfigured();
    const sid = options.sessionId || this.sessionId;
    const payload = {
      url: options.url,
      events: options.events || ['message.received', 'session.status'],
      secret: options.secret,
    };
    return this.request<any>(`/sessions/${encodeURIComponent(sid)}/webhooks`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  async deleteWebhook(webhookId: string, sessionId?: string): Promise<void> {
    this.ensureGatewayConfigured();
    const sid = sessionId || this.sessionId;
    return this.request<void>(`/sessions/${encodeURIComponent(sid)}/webhooks/${encodeURIComponent(webhookId)}`, {
      method: 'DELETE',
    });
  }

  async testWebhook(webhookId: string, sessionId?: string): Promise<any> {
    this.ensureGatewayConfigured();
    const sid = sessionId || this.sessionId;
    return this.request<any>(`/sessions/${encodeURIComponent(sid)}/webhooks/${encodeURIComponent(webhookId)}/test`, {
      method: 'POST',
    });
  }


  // ────────────────────────────────────────────────────────────────
  // Private Helpers
  // ────────────────────────────────────────────────────────────────

  private ensureGatewayConfigured(): void {
    if (!this.isGatewayConfigured()) {
      throw new Error(
        'OpenWA gateway not configured. Set OPENWA_BASE_URL and OPENWA_API_KEY in backend/.env.'
      );
    }
  }

  private async ensureContactExists(chatId: string): Promise<void> {
    const number = chatId.replace('@c.us', '');
    const response = await this.request<OpenWaContactCheckResponse>(
      `${this.sessionPath()}/contacts/check/${encodeURIComponent(number)}`
    );

    if (!response.exists) {
      throw new Error(`Recipient ${number} was not found on WhatsApp.`);
    }
  }

  private async request<T>(path: string, init?: RequestInit): Promise<T> {
    const response = await fetch(`${this.apiBaseUrl}${path}`, {
      ...init,
      headers: {
        'X-API-Key': this.apiKey,
        'Content-Type': 'application/json',
        ...(init?.headers || {}),
      },
      signal: AbortSignal.timeout(120_000),
    });

    if (!response.ok) {
      throw new Error(await this.readError(response));
    }

    // Handle DELETE (204 No Content) and other empty-body responses
    if (response.status === 204) {
      return undefined as T;
    }

    return (await response.json()) as T;
  }

  private async readError(response: Response): Promise<string> {
    const payload = await response.json().catch(() => undefined);

    if (this.isOpenWaError(payload)) {
      const message = Array.isArray(payload.message) ? payload.message.join('; ') : payload.message;
      const suffix = payload.code ? ` [code: ${payload.code}]` : '';
      return message || payload.error || `OpenWA request failed with HTTP ${response.status}${suffix}`;
    }

    return `OpenWA request failed with HTTP ${response.status}`;
  }

  private isOpenWaError(payload: unknown): payload is OpenWaErrorResponse {
    return typeof payload === 'object' && payload !== null;
  }

  private sessionPath(): string {
    return `/sessions/${encodeURIComponent(this.sessionId)}`;
  }

  private toChatId(recipient: string): string {
    const trimmed = recipient.trim();

    if (trimmed.includes('@c.us') || trimmed.includes('@g.us') || trimmed.includes('@newsletter')) {
      return trimmed;
    }

    let digits = trimmed.replace(/[^\d]/g, '');

    // Handle Indian phone numbers:
    // - "096628 60399" → "09662860399" → strip leading 0 → "9662860399" → add 91 → "919662860399"
    // - "+91 96628 60399" → "919662860399" (already correct)
    // - "0261 259 8555" → "02612598555" → strip leading 0 → "2612598555" → add 91 → "912612598555"
    if (digits.startsWith('0')) {
      digits = digits.slice(1);
    }

    // If the number is 10 digits (Indian local), prepend country code 91
    if (digits.length === 10) {
      digits = `91${digits}`;
    }

    return `${digits}@c.us`;
  }

  private toApiBaseUrl(baseUrl: string): string {
    const normalized = baseUrl.replace(/\/+$/, '');
    return normalized.endsWith('/api') ? normalized : `${normalized}/api`;
  }

  private maskBaseUrl(baseUrl: string): string {
    return baseUrl.replace(/\/+$/, '');
  }

  private errorMessage(err: unknown): string {
    return err instanceof Error ? err.message : 'Unknown OpenWA error';
  }
}
