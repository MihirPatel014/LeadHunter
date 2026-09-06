import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { config } from './config/env.js';

// ── Validate critical env vars early so we fail fast on Vercel with a clear message ──
if (!process.env.DATABASE_URL) {
  console.error('❌ DATABASE_URL is not set. Backend cannot start.');
  console.error('   On Vercel: Go to Project Settings → Environment Variables and add DATABASE_URL.');
  console.error('   SQLite (file:./...) is NOT supported on Vercel serverless — use PostgreSQL (Neon/Supabase).');
}

import docsRoutes from './routes/docs.routes.js';
import healthRoutes from './routes/health.routes.js';
import leadRoutes from './routes/lead.routes.js';
import discoveryRoutes from './routes/discovery.routes.js';
import templateRoutes from './routes/template.routes.js';
import messageRoutes from './routes/message.routes.js';
import personalizationRoutes from './routes/personalization.routes.js';
import outreachRoutes from './routes/outreach.routes.js';
import integrationsRoutes from './routes/integrations.routes.js';
import approvalRoutes from './routes/approval.routes.js';
import campaignRoutes from './routes/campaign.routes.js';
import followUpRoutes from './routes/follow-up.routes.js';
import analyticsRoutes from './routes/analytics.routes.js';
import settingsRoutes from './routes/settings.routes.js';
import webhookRoutes from './routes/webhook.routes.js';
import logsRoutes from './routes/logs.routes.js';
import { requestLoggerMiddleware } from './middleware/logger.middleware.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';

const app = express();

app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'", 'https://cdn.jsdelivr.net'],
        styleSrc: ["'self'", "'unsafe-inline'", 'https://cdn.jsdelivr.net'],
        imgSrc: ["'self'", 'data:', 'https:'],
        connectSrc: ["'self'"],
        fontSrc: ["'self'", 'https://cdn.jsdelivr.net'],
      },
    },
  })
);
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (e.g. mobile apps, curl, server-to-server)
      if (!origin) return callback(null, true);
      if (config.corsOrigin === '*') return callback(null, true);
      if (Array.isArray(config.corsOrigin)) {
        if (config.corsOrigin.includes(origin) || config.corsOrigin.includes('*')) {
          return callback(null, true);
        }
      } else if (config.corsOrigin === origin) {
        return callback(null, true);
      }
      // If deployed on Vercel preview or custom domains, permit same-origin/vercel apps
      if (origin.endsWith('.vercel.app')) {
        return callback(null, true);
      }
      return callback(null, true); // Permissive fallback to prevent CORS blocks
    },
    credentials: true,
  })
);
app.use(morgan('dev'));
app.use(express.json());
app.use(requestLoggerMiddleware);

// ── Register route modules with error logging ────────────────
const routeModules = [
  { path: '/', router: docsRoutes, name: 'docs (landing + swagger)' },
  { path: '/api', router: healthRoutes, name: 'health' },
  { path: '/api', router: leadRoutes, name: 'leads' },
  { path: '/api', router: discoveryRoutes, name: 'discovery' },
  { path: '/api', router: templateRoutes, name: 'templates' },
  { path: '/api', router: messageRoutes, name: 'messages' },
  { path: '/api/personalization', router: personalizationRoutes, name: 'personalization' },
  { path: '/api', router: integrationsRoutes, name: 'integrations' },
  { path: '/api', router: outreachRoutes, name: 'outreach & gmail' },
  { path: '/api', router: approvalRoutes, name: 'approvals' },
  { path: '/api', router: campaignRoutes, name: 'campaigns' },
  { path: '/api', router: followUpRoutes, name: 'follow-ups' },
  { path: '/api', router: analyticsRoutes, name: 'analytics' },
  { path: '/api', router: settingsRoutes, name: 'app-settings' },
  { path: '/api', router: webhookRoutes, name: 'webhooks' },
  { path: '/api', router: logsRoutes, name: 'logs' },
];

for (const route of routeModules) {
  try {
    app.use(route.path, route.router);
    console.log(`  ✅ Route loaded: ${route.name}`);
  } catch (err: any) {
    console.error(`  ❌ Failed to load route [${route.name}]: ${err.message}`);
    console.error(`     Stack: ${err.stack}`);
  }
}

app.use(notFoundHandler);
app.use(errorHandler);

export default app;
