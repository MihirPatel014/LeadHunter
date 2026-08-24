import { config } from '../config/env.js';
import { AppSettingsRepository } from '../repositories/app-settings.repository.js';

const repo = new AppSettingsRepository();

interface GmailCredentials {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  refreshToken: string;
  connectedEmail: string;
}

// In-memory cache (populated from DB + env on startup, updated at runtime)
let runtimeGmailConfig: GmailCredentials = {
  clientId: config.googleClientId,
  clientSecret: config.googleClientSecret,
  redirectUri: config.googleRedirectUri,
  refreshToken: config.gmailRefreshToken,
  connectedEmail: '',
};

/**
 * Load persisted Gmail credentials from DB into memory.
 * Call this on startup (server.ts / app bootstrap).
 */
export async function loadGmailCredentialsFromDB(): Promise<void> {
  try {
    const [clientId, clientSecret, redirectUri, refreshToken, connectedEmail] = await Promise.all([
      repo.get('gmail_client_id'),
      repo.get('gmail_client_secret'),
      repo.get('gmail_redirect_uri'),
      repo.get('gmail_refresh_token'),
      repo.get('gmail_connected_email'),
    ]);
    // DB values take precedence over .env for refresh token & email (they reflect actual auth state)
    runtimeGmailConfig = {
      clientId: clientId || config.googleClientId || runtimeGmailConfig.clientId,
      clientSecret: clientSecret || config.googleClientSecret || runtimeGmailConfig.clientSecret,
      redirectUri: redirectUri || config.googleRedirectUri || runtimeGmailConfig.redirectUri,
      refreshToken: refreshToken || config.gmailRefreshToken || runtimeGmailConfig.refreshToken,
      connectedEmail: connectedEmail || runtimeGmailConfig.connectedEmail,
    };
  } catch {
    // DB not ready — fall back to env-only defaults
  }
}

export class GmailService {
  /**
   * Generates Google OAuth consent screen URL.
   * ALSO ensures redirectUri exactly matches the configured one (fixes 400 redirect_uri_mismatch).
   */
  getAuthUrl(): string {
    const { clientId, redirectUri } = runtimeGmailConfig;

    if (!clientId) {
      throw new Error('Google Client ID is not configured. Paste it in Integrations → Gmail → Manual Credentials.');
    }
    if (!redirectUri) {
      throw new Error('Google Redirect URI is not configured. It must match the value in Google Cloud Console exactly.');
    }

    const rootUrl = 'https://accounts.google.com/o/oauth2/v2/auth';
    const options = {
      redirect_uri: redirectUri,
      client_id: clientId,
      access_type: 'offline',
      response_type: 'code',
      prompt: 'consent',
      scope: [
        'https://www.googleapis.com/auth/gmail.send',
        'https://www.googleapis.com/auth/gmail.readonly',
        'https://www.googleapis.com/auth/userinfo.email',
      ].join(' '),
    };

    const qs = new URLSearchParams(options);
    return `${rootUrl}?${qs.toString()}`;
  }

  /**
   * Exchanges authorization code for access & refresh tokens.
   * Reads client_id/client_secret/redirect_uri from the SAME runtime config that generated the auth URL
   * (this eliminates the "client_secret is missing" error caused by config sources diverging).
   */
  async handleCallback(code: string): Promise<{ email: string; refreshToken?: string }> {
    const { clientId, clientSecret, redirectUri } = runtimeGmailConfig;

    if (!clientId) throw new Error('client_id is missing. Save credentials before completing OAuth.');
    if (!clientSecret) throw new Error('client_secret is missing. Save credentials before completing OAuth.');
    if (!redirectUri) throw new Error('redirect_uri is missing. Save credentials before completing OAuth.');

    const url = 'https://oauth2.googleapis.com/token';
    const values = {
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
      grant_type: 'authorization_code',
    };

    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams(values).toString(),
    });

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`Google OAuth exchange failed: ${err}`);
    }

    const data = await res.json();
    const accessToken = data.access_token;
    const refreshToken = data.refresh_token;

    if (refreshToken) {
      runtimeGmailConfig.refreshToken = refreshToken;
    }

    // Fetch user profile to get connected email address
    const userRes = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    let email = 'connected-user@gmail.com';
    if (userRes.ok) {
      const userInfo = await userRes.json();
      email = userInfo.email || email;
      runtimeGmailConfig.connectedEmail = email;
    }

    // PERSIST credentials & tokens to DB so they survive server restarts
    try {
      const bulk: Record<string, string> = {};
      if (runtimeGmailConfig.clientId) bulk['gmail_client_id'] = runtimeGmailConfig.clientId;
      if (runtimeGmailConfig.clientSecret) bulk['gmail_client_secret'] = runtimeGmailConfig.clientSecret;
      if (runtimeGmailConfig.redirectUri) bulk['gmail_redirect_uri'] = runtimeGmailConfig.redirectUri;
      if (refreshToken) bulk['gmail_refresh_token'] = refreshToken;
      if (email) bulk['gmail_connected_email'] = email;
      await repo.setBulk(bulk);
    } catch {
      // Best-effort persistence; don't fail the OAuth flow
    }

    return { email, refreshToken };
  }

  /**
   * Update credentials at runtime AND persist them to DB.
   * Now async so callers MUST await it before initiating OAuth.
   */
  async updateCredentials(params: { clientId?: string; clientSecret?: string; redirectUri?: string; refreshToken?: string }) {
    if (params.clientId) runtimeGmailConfig.clientId = params.clientId;
    if (params.clientSecret) runtimeGmailConfig.clientSecret = params.clientSecret;
    if (params.redirectUri) runtimeGmailConfig.redirectUri = params.redirectUri;
    if (params.refreshToken) runtimeGmailConfig.refreshToken = params.refreshToken;

    // Persist to DB immediately
    try {
      const bulk: Record<string, string> = {};
      if (params.clientId) bulk['gmail_client_id'] = params.clientId;
      if (params.clientSecret) bulk['gmail_client_secret'] = params.clientSecret;
      if (params.redirectUri) bulk['gmail_redirect_uri'] = params.redirectUri;
      if (params.refreshToken) bulk['gmail_refresh_token'] = params.refreshToken;
      if (Object.keys(bulk).length > 0) {
        await repo.setBulk(bulk);
      }
    } catch {
      // Best-effort persistence
    }
  }

  getCredentials() {
    return { ...runtimeGmailConfig };
  }

  /**
   * Reload credentials from DB (useful after cross-process updates).
   */
  async reloadCredentials() {
    await loadGmailCredentialsFromDB();
  }
}
