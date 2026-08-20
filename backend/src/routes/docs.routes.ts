import { Router, Request, Response } from 'express';
import { openApiSpec } from '../docs/openapi.js';

const router = Router();

// Serve ReDoc HTML UI
router.get('/api-docs', (_req: Request, res: Response) => {
  res.setHeader('Content-Type', 'text/html');
  res.send(`<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>LeadHunter AI — API Docs</title>
    <link rel="icon" type="image/svg+xml" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>🎯</text></svg>" />
    <style>
      body { margin: 0; padding: 0; }
    </style>
  </head>
  <body>
    <div id="redoc-container"></div>
    <script src="https://cdn.jsdelivr.net/npm/redoc@latest/bundles/redoc.standalone.js"></script>
    <script>
      Redoc.init(
        '/api-docs/openapi.json',
        {
          theme: {
            colors: { primary: { main: '#6366f1' } },
            typography: {
              fontFamily: '"Inter", system-ui, sans-serif',
              headings: { fontFamily: '"Inter", system-ui, sans-serif' },
              code: { fontFamily: '"Fira Code", monospace' },
            },
            sidebar: {
              backgroundColor: '#0f0f13',
              textColor: '#e4e4e7',
            },
            rightPanel: { backgroundColor: '#18181b' },
          },
          hideDownloadButton: false,
          scrollYOffset: 0,
        },
        document.getElementById('redoc-container')
      );
    </script>
  </body>
</html>`);
});

// Serve raw OpenAPI JSON spec
router.get('/api-docs/openapi.json', (_req: Request, res: Response) => {
  res.json(openApiSpec);
});

export default router;
