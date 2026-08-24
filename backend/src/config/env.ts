import dotenv from 'dotenv';
import path from 'path';

dotenv.config();

export const config = {
  port: parseInt(process.env.PORT || '5000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  databaseUrl: process.env.DATABASE_URL || 'file:./dev.db',
  serpApiKey: process.env.SERPAPI_API_KEY || '',
  aiProvider: process.env.AI_PROVIDER || (process.env.GEMINI_API_KEY || process.env.AI_API_KEY ? 'gemini' : 'mock'),
  aiApiKey: process.env.GEMINI_API_KEY || process.env.AI_API_KEY || '',
  geminiApiKey: process.env.GEMINI_API_KEY || process.env.AI_API_KEY || '',
  aiModel: process.env.AI_MODEL || 'gemini-2.5-flash',
  googleClientId: process.env.GOOGLE_CLIENT_ID || '',
  googleClientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
  googleRedirectUri: process.env.GOOGLE_REDIRECT_URI || 'http://localhost:5000/api/integrations/gmail/callback',
  gmailRefreshToken: process.env.GMAIL_REFRESH_TOKEN || '',
  openWaBaseUrl: process.env.OPENWA_BASE_URL || '',
  openWaApiKey: process.env.OPENWA_API_KEY || '',
  openWaSessionId: process.env.OPENWA_SESSION_ID || '',
  openWaPrecheckContacts: process.env.OPENWA_PRECHECK_CONTACTS === 'true',
  smtpUser: process.env.SMTP_USER || '',
  smtpPass: process.env.SMTP_PASS || '',
};


