import { Router, Request, Response } from 'express';
import { openApiSpec } from '../docs/openapi.js';

const router = Router();

// Serve Root Landing Page with Redirect to Swagger Docs
router.get('/', (_req: Request, res: Response) => {
  res.setHeader('Content-Type', 'text/html');
  res.send(`<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>LeadHunter API — Server Root</title>
    <link rel="icon" type="image/svg+xml" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>🎯</text></svg>" />
    <style>
      * { box-sizing: border-box; margin: 0; padding: 0; }
      body {
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
        background: #09090b;
        color: #f4f4f5;
        display: flex;
        align-items: center;
        justify-content: center;
        min-height: 100vh;
        padding: 20px;
      }
      .card {
        background: #18181b;
        border: 1px solid rgba(255, 255, 255, 0.1);
        border-radius: 16px;
        padding: 40px;
        max-width: 480px;
        width: 100%;
        text-align: center;
        box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.5), 0 8px 10px -6px rgba(0, 0, 0, 0.5);
      }
      .badge {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        background: rgba(34, 197, 94, 0.15);
        color: #4ade80;
        padding: 6px 12px;
        border-radius: 20px;
        font-size: 13px;
        font-weight: 600;
        margin-bottom: 20px;
      }
      .dot {
        width: 8px;
        height: 8px;
        background-color: #4ade80;
        border-radius: 50%;
        display: inline-block;
        box-shadow: 0 0 8px #4ade80;
      }
      h1 { font-size: 24px; font-weight: 700; margin-bottom: 8px; color: #ffffff; }
      p { color: #a1a1aa; font-size: 14px; margin-bottom: 28px; line-height: 1.5; }
      .actions { display: flex; flex-direction: column; gap: 12px; }
      .btn {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
        padding: 12px 24px;
        border-radius: 10px;
        font-weight: 600;
        font-size: 15px;
        text-decoration: none;
        transition: all 0.2s ease;
        cursor: pointer;
      }
      .btn-primary {
        background: #6366f1;
        color: #ffffff;
        box-shadow: 0 4px 14px rgba(99, 102, 241, 0.4);
      }
      .btn-primary:hover {
        background: #4f46e5;
        transform: translateY(-1px);
        box-shadow: 0 6px 20px rgba(99, 102, 241, 0.5);
      }
      .btn-secondary {
        background: rgba(255, 255, 255, 0.05);
        color: #d4d4d8;
        border: 1px solid rgba(255, 255, 255, 0.1);
      }
      .btn-secondary:hover {
        background: rgba(255, 255, 255, 0.1);
        color: #ffffff;
      }
    </style>
  </head>
  <body>
    <div class="card">
      <div class="badge">
        <span class="dot"></span> Backend Active
      </div>
      <h1>LeadHunter AI API</h1>
      <p>The backend server is running smoothly. Click below to view the interactive API documentation and test endpoints.</p>
      <div class="actions">
        <a href="/api-docs" class="btn btn-primary">
          🚀 Open Swagger API Docs
        </a>
        <a href="/api/health" class="btn btn-secondary">
          ❤️ Check Health Status
        </a>
      </div>
    </div>
  </body>
</html>`);
});

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
