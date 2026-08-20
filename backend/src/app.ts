import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { config } from './config/env.js';
import healthRoutes from './routes/health.routes.js';
import leadRoutes from './routes/lead.routes.js';
import discoveryRoutes from './routes/discovery.routes.js';
import integrationsRoutes from './routes/integrations.routes.js';
import docsRoutes from './routes/docs.routes.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';

const app = express();

app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'", "https://cdn.jsdelivr.net"],
        styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
        imgSrc: ["'self'", "data:", "https://redocly.com"],
        fontSrc: ["'self'", "https://fonts.gstatic.com"],
      },
    },
  })
);
app.use(cors({ origin: config.corsOrigin, credentials: true }));
app.use(morgan('dev'));
app.use(express.json());

app.use('/api', healthRoutes);
app.use('/api', leadRoutes);
app.use('/api', discoveryRoutes);
app.use('/api', integrationsRoutes);

// API documentation (ReDoc) — no /api prefix so it's accessible at /api-docs
app.use(docsRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

export default app;
