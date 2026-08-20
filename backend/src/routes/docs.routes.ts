import { Router, Request, Response } from 'express';
import { openApiSpec } from '../docs/openapi.js';

const router = Router();

// Serve Swagger HTML UI
router.get('/api-docs', (_req: Request, res: Response) => {
  res.setHeader('Content-Type', 'text/html');
  res.send(`<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>LeadHunter AI — API Docs</title>
    <link rel="icon" type="image/svg+xml" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>🎯</text></svg>" />
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/swagger-ui-dist@5/swagger-ui.css" />
    <style>
      html { box-sizing: border-box; overflow: -margin-y; }
      *, *:before, *:after { box-sizing: inherit; }
      
      /* Dark Theme (Default) */
      body { margin: 0; background: #0f0f13; transition: background 0.25s ease; }
      .swagger-ui { filter: invert(90%) hue-rotate(180deg); }
      .swagger-ui .topbar { display: none; }
      .swagger-ui .info { margin: 30px 0; }
      .swagger-ui .scheme-container { background: transparent; box-shadow: none; border-bottom: 1px solid rgba(0,0,0,0.1); }
      
      /* Light Theme overrides */
      body.light-theme { background: #ffffff; }
      body.light-theme .swagger-ui { filter: none; }
      
      /* Theme Toggle Switch */
      .theme-toggle-container {
        position: fixed;
        top: 15px;
        right: 30px;
        z-index: 999;
      }
      .theme-btn {
        background: #18181b;
        color: #e4e4e7;
        border: 1px solid rgba(255,255,255,0.1);
        padding: 8px 14px;
        border-radius: 8px;
        cursor: pointer;
        font-family: system-ui, sans-serif;
        font-size: 13px;
        font-weight: 500;
        display: flex;
        align-items: center;
        gap: 6px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.25);
        transition: all 0.2s ease;
      }
      .theme-btn:hover {
        background: #27272a;
        border-color: rgba(255,255,255,0.2);
      }
      body.light-theme .theme-btn {
        background: #f4f4f5;
        color: #18181b;
        border-color: rgba(0,0,0,0.1);
        box-shadow: 0 4px 12px rgba(0,0,0,0.08);
      }
      body.light-theme .theme-btn:hover {
        background: #e4e4e7;
      }
    </style>
  </head>
  <body>
    <div class="theme-toggle-container">
      <button id="theme-toggle" class="theme-btn">
        <span id="theme-icon">☀️</span>
        <span id="theme-text">Light Mode</span>
      </button>
    </div>

    <div id="swagger-ui"></div>
    <script src="https://cdn.jsdelivr.net/npm/swagger-ui-dist@5/swagger-ui-bundle.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/swagger-ui-dist@5/swagger-ui-standalone-preset.js"></script>
    <script>
      // Load initial theme preference
      const savedTheme = localStorage.getItem('swagger-theme');
      const body = document.body;
      const themeToggleBtn = document.getElementById('theme-toggle');
      const themeIcon = document.getElementById('theme-icon');
      const themeText = document.getElementById('theme-text');

      if (savedTheme === 'light') {
        body.classList.add('light-theme');
        themeIcon.textContent = '🌙';
        themeText.textContent = 'Dark Mode';
      }

      themeToggleBtn.addEventListener('click', () => {
        if (body.classList.contains('light-theme')) {
          body.classList.remove('light-theme');
          themeIcon.textContent = '☀️';
          themeText.textContent = 'Light Mode';
          localStorage.setItem('swagger-theme', 'dark');
        } else {
          body.classList.add('light-theme');
          themeIcon.textContent = '🌙';
          themeText.textContent = 'Dark Mode';
          localStorage.setItem('swagger-theme', 'light');
        }
      });

      window.onload = () => {
        window.ui = SwaggerUIBundle({
          url: '/api-docs/openapi.json',
          dom_id: '#swagger-ui',
          deepLinking: true,
          presets: [
            SwaggerUIBundle.presets.apis,
            SwaggerUIStandalonePreset
          ],
          layout: "BaseLayout",
        });
      };
    </script>
  </body>
</html>`);
});

// Serve raw OpenAPI JSON spec
router.get('/api-docs/openapi.json', (_req: Request, res: Response) => {
  res.json(openApiSpec);
});

export default router;
