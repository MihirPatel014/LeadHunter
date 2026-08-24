/**
 * OpenAPI 3.0 specification for LeadHunter AI backend.
 * All current endpoints (Chunks 01–08) are documented here.
 */
export const openApiSpec = {
  openapi: '3.0.3',
  info: {
    title: 'LeadHunter AI API',
    version: '1.0.0',
    description:
      'REST API for LeadHunter AI — discover local business leads, manage them, run discovery, validate websites, and generate message previews.',
    contact: { email: 'mihirbuilds@gmail.com' },
  },
  servers: [{ url: 'http://localhost:5000', description: 'Local development server' }],
  tags: [
    { name: 'Health', description: 'API health check' },
    { name: 'Leads', description: 'Lead CRUD and management' },
    { name: 'Discovery', description: 'SerpAPI-powered lead discovery' },
    { name: 'Messages', description: 'Message generation and preview' },
    { name: 'Integrations', description: 'Third-party integration status' },
  ],
  components: {
    schemas: {
      Lead: {
        type: 'object',
        properties: {
          id: { type: 'integer', example: 1 },
          businessName: { type: 'string', example: 'Aura Salon Surat' },
          category: { type: 'string', example: 'salon' },
          city: { type: 'string', example: 'Surat' },
          address: { type: 'string', nullable: true },
          website: { type: 'string', nullable: true, example: 'https://aurasalon.in' },
          phone: { type: 'string', nullable: true },
          email: { type: 'string', nullable: true },
          rating: { type: 'number', nullable: true, example: 4.3 },
          reviewCount: { type: 'integer', nullable: true, example: 82 },
          websiteStatus: {
            type: 'string',
            enum: ['UNKNOWN', 'ONLINE', 'OFFLINE', 'INVALID'],
            example: 'UNKNOWN',
          },
          score: { type: 'integer', example: 0 },
          temperature: { type: 'string', enum: ['HOT', 'WARM', 'LOW'], example: 'LOW' },
          status: {
            type: 'string',
            enum: [
              'NEW', 'RESEARCHED', 'QUALIFIED', 'PENDING_APPROVAL',
              'CONTACTED', 'REPLIED', 'INTERESTED', 'CONVERTED', 'DISQUALIFIED',
            ],
            example: 'NEW',
          },
          source: { type: 'string', enum: ['MANUAL', 'SERPAPI'], example: 'SERPAPI' },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' },
        },
      },
      Pagination: {
        type: 'object',
        properties: {
          total: { type: 'integer', example: 124 },
          page: { type: 'integer', example: 1 },
          limit: { type: 'integer', example: 20 },
          totalPages: { type: 'integer', example: 7 },
        },
      },
      RenderedMessage: {
        type: 'object',
        properties: {
          subject: { type: 'string', nullable: true, example: 'Quick question about Aura Salon Surat' },
          body: { type: 'string', example: 'Hi there, I noticed your salon in Surat...' },
        },
      },
      SuccessResponse: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: true },
          message: { type: 'string' },
        },
      },
      ErrorResponse: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: false },
          error: { type: 'string', example: 'Validation failed' },
          details: { type: 'array', items: { type: 'string' }, nullable: true },
        },
      },
      SerpApiStatus: {
        type: 'object',
        properties: {
          accountStatus: { type: 'string', example: 'Active' },
          planName: { type: 'string', example: 'Free Plan' },
          planId: { type: 'string', example: 'free' },
          planRenewalDate: { type: 'string', example: '2026-09-20' },
          searchesPerMonth: { type: 'integer', example: 250 },
          planSearchesLeft: { type: 'integer', example: 250 },
          extraCredits: { type: 'integer', example: 0 },
          totalSearchesLeft: { type: 'integer', example: 250 },
          thisMonthUsage: { type: 'integer', example: 0 },
          thisHourSearches: { type: 'integer', example: 0 },
          lastHourSearches: { type: 'integer', example: 0 },
          accountRateLimitPerHour: { type: 'integer', example: 250 },
        },
      },
    },
  },
  paths: {
    '/api/health': {
      get: {
        tags: ['Health'],
        summary: 'Health check',
        description: 'Returns 200 when the API is up and database is reachable.',
        responses: {
          '200': {
            description: 'API is running',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    message: { type: 'string', example: 'LeadHunter API is running' },
                  },
                },
              },
            },
          },
        },
      },
    },
    '/api/leads': {
      get: {
        tags: ['Leads'],
        summary: 'List leads',
        description: 'Returns a paginated, filterable list of leads.',
        parameters: [
          { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
          { name: 'limit', in: 'query', schema: { type: 'integer', default: 20, maximum: 100 } },
          { name: 'search', in: 'query', schema: { type: 'string' }, description: 'Search in businessName, category, city' },
          { name: 'status', in: 'query', schema: { type: 'string', enum: ['NEW','RESEARCHED','QUALIFIED','PENDING_APPROVAL','CONTACTED','REPLIED','INTERESTED','CONVERTED','DISQUALIFIED'] } },
          { name: 'temperature', in: 'query', schema: { type: 'string', enum: ['HOT','WARM','LOW'] } },
          { name: 'city', in: 'query', schema: { type: 'string' } },
          { name: 'category', in: 'query', schema: { type: 'string' } },
        ],
        responses: {
          '200': {
            description: 'Leads list',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean' },
                    data: {
                      type: 'object',
                      properties: {
                        leads: { type: 'array', items: { $ref: '#/components/schemas/Lead' } },
                        pagination: { $ref: '#/components/schemas/Pagination' },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
      post: {
        tags: ['Leads'],
        summary: 'Create a lead',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['businessName'],
                properties: {
                  businessName: { type: 'string', example: 'Aura Salon' },
                  category: { type: 'string', example: 'salon' },
                  city: { type: 'string', example: 'Surat' },
                  address: { type: 'string' },
                  website: { type: 'string' },
                  phone: { type: 'string' },
                  email: { type: 'string' },
                  rating: { type: 'number' },
                  reviewCount: { type: 'integer' },
                  status: { type: 'string', enum: ['NEW','RESEARCHED','QUALIFIED','PENDING_APPROVAL','CONTACTED','REPLIED','INTERESTED','CONVERTED','DISQUALIFIED'] },
                  temperature: { type: 'string', enum: ['HOT','WARM','LOW'] },
                },
              },
            },
          },
        },
        responses: {
          '201': { description: 'Lead created', content: { 'application/json': { schema: { $ref: '#/components/schemas/SuccessResponse' } } } },
          '400': { description: 'Validation error', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
        },
      },
    },
    '/api/leads/{id}': {
      get: {
        tags: ['Leads'],
        summary: 'Get lead by ID',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
        responses: {
          '200': { description: 'Lead details', content: { 'application/json': { schema: { type: 'object', properties: { success: { type: 'boolean' }, data: { $ref: '#/components/schemas/Lead' } } } } } },
          '404': { description: 'Not found', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
        },
      },
      patch: {
        tags: ['Leads'],
        summary: 'Update a lead',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
        requestBody: {
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  businessName: { type: 'string' },
                  category: { type: 'string' },
                  city: { type: 'string' },
                  website: { type: 'string' },
                  phone: { type: 'string' },
                  email: { type: 'string' },
                  status: { type: 'string' },
                  temperature: { type: 'string' },
                },
              },
            },
          },
        },
        responses: {
          '200': { description: 'Lead updated' },
          '404': { description: 'Not found' },
        },
      },
      delete: {
        tags: ['Leads'],
        summary: 'Delete a lead',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
        responses: {
          '200': { description: 'Lead deleted' },
          '404': { description: 'Not found' },
        },
      },
    },
    '/api/discovery/search': {
      post: {
        tags: ['Discovery'],
        summary: 'Discover leads via SerpAPI',
        description: 'Searches Google Local via SerpAPI, deduplicates, and saves new leads.',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['city', 'category'],
                properties: {
                  city: { type: 'string', example: 'Surat' },
                  category: { type: 'string', example: 'salon' },
                  limit: { type: 'integer', default: 50, minimum: 1, maximum: 100 },
                },
              },
            },
          },
        },
        responses: {
          '200': {
            description: 'Discovery summary',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean' },
                    data: {
                      type: 'object',
                      properties: {
                        discovered: { type: 'integer', example: 50 },
                        newLeads: { type: 'integer', example: 43 },
                        duplicates: { type: 'integer', example: 7 },
                      },
                    },
                  },
                },
              },
            },
          },
          '400': { description: 'Validation failed' },
          '502': { description: 'SerpAPI call failed' },
        },
      },
    },
    '/api/messages/preview': {
      post: {
        tags: ['Messages'],
        summary: 'Preview a rendered message',
        description: 'Combines a Lead and a Template to produce a rendered message preview with all variables substituted.',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['leadId', 'templateId'],
                properties: {
                  leadId: { type: 'integer', example: 123, description: 'ID of the lead to use for variable substitution' },
                  templateId: { type: 'integer', example: 5, description: 'ID of the template to render' },
                },
              },
            },
          },
        },
        responses: {
          '200': {
            description: 'Rendered message preview',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    data: {
                      type: 'object',
                      properties: {
                        lead: {
                          type: 'object',
                          properties: {
                            id: { type: 'integer', example: 123 },
                            businessName: { type: 'string', example: 'Aura Salon Surat' },
                            category: { type: 'string', nullable: true, example: 'salon' },
                            city: { type: 'string', nullable: true, example: 'Surat' },
                          },
                        },
                        template: {
                          type: 'object',
                          properties: {
                            id: { type: 'integer', example: 5 },
                            name: { type: 'string', example: 'Cold Outreach v1' },
                            channel: { type: 'string', example: 'EMAIL' },
                          },
                        },
                        rendered: { $ref: '#/components/schemas/RenderedMessage' },
                      },
                    },
                  },
                },
              },
            },
          },
          '400': { description: 'Validation error', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
          '404': { description: 'Lead or template not found', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
        },
      },
    },
    '/api/integrations/serpapi/status': {
      get: {
        tags: ['Integrations'],
        summary: 'SerpAPI account status',
        description: 'Returns live SerpAPI account info including searches remaining, plan details, and renewal date.',
        responses: {
          '200': {
            description: 'SerpAPI account status',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean' },
                    data: { $ref: '#/components/schemas/SerpApiStatus' },
                  },
                },
              },
            },
          },
          '502': { description: 'Failed to reach SerpAPI' },
        },
      },
    },
    '/api/personalization/status': {
      get: {
        tags: ['Personalization'],
        summary: 'AI Provider configuration status',
        description: 'Returns the current AI provider configuration, model, and availability.',
        responses: {
          '200': {
            description: 'AI provider status',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    data: {
                      type: 'object',
                      properties: {
                        provider: { type: 'string', example: 'mock' },
                        isConfigured: { type: 'boolean', example: true },
                        model: { type: 'string', example: 'local-heuristic-v1' },
                        availableProviders: {
                          type: 'array',
                          items: { type: 'string' },
                          example: ['mock', 'gemini', 'openai'],
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
    '/api/personalization/generate': {
      post: {
        tags: ['Personalization'],
        summary: 'Generate AI personalized message',
        description: 'Generates an AI personalized outreach message combining structured lead facts and templates without hallucinations.',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['leadId', 'templateId'],
                properties: {
                  leadId: { type: 'integer', example: 123 },
                  templateId: { type: 'integer', example: 5 },
                  customInstructions: { type: 'string', nullable: true, example: 'Emphasize mobile responsiveness.' },
                  provider: { type: 'string', enum: ['mock', 'gemini', 'openai'], example: 'mock' },
                },
              },
            },
          },
        },
        responses: {
          '200': {
            description: 'Personalized message result',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    data: {
                      type: 'object',
                      properties: {
                        lead: { type: 'object' },
                        template: { type: 'object' },
                        baseRendered: { $ref: '#/components/schemas/RenderedMessage' },
                        personalized: { $ref: '#/components/schemas/RenderedMessage' },
                        metadata: {
                          type: 'object',
                          properties: {
                            provider: { type: 'string', example: 'mock' },
                            model: { type: 'string', example: 'local-heuristic-v1' },
                            aiEnhanced: { type: 'boolean', example: true },
                            reasoning: { type: 'string' },
                            usedFallback: { type: 'boolean', example: false },
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
          '400': { description: 'Validation error' },
          '404': { description: 'Lead or template not found' },
        },
      },
    },
    '/api/integrations/gmail/status': {
      get: {
        tags: ['Outreach & Gmail'],
        summary: 'Get Gmail integration connection status',
        description: 'Returns connection health, authenticated Gmail address, and credential configuration status.',
        responses: {
          '200': {
            description: 'Gmail status payload',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    data: {
                      type: 'object',
                      properties: {
                        isConnected: { type: 'boolean', example: true },
                        email: { type: 'string', example: 'outreach@company.com' },
                        provider: { type: 'string', example: 'GMAIL' },
                        mode: { type: 'string', example: 'oauth' },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
    '/api/integrations/gmail/connect': {
      post: {
        tags: ['Outreach & Gmail'],
        summary: 'Initiate Gmail OAuth connection',
        description: 'Generates Google OAuth consent URL for connecting a sender Gmail account.',
        responses: {
          '200': {
            description: 'OAuth URL',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    data: {
                      type: 'object',
                      properties: {
                        authUrl: { type: 'string', example: 'https://accounts.google.com/o/oauth2/v2/auth?...' },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
    '/api/outreach/email/send': {
      post: {
        tags: ['Outreach & Gmail'],
        summary: 'Backend-controlled single email dispatch',
        description: 'Dispatches an email message via Gmail/Mock provider, logs sent record, and advances lead status.',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['recipient', 'subject', 'body'],
                properties: {
                  leadId: { type: 'integer', example: 123 },
                  recipient: { type: 'string', example: 'owner@business.com' },
                  subject: { type: 'string', example: 'Question regarding your salon website' },
                  body: { type: 'string', example: 'Hi there...' },
                },
              },
            },
          },
        },
        responses: {
          '200': {
            description: 'Email dispatched successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    message: { type: 'string' },
                    data: { type: 'object' },
                  },
                },
              },
            },
          },
          '400': { description: 'Validation error' },
          '502': { description: 'Dispatch provider error' },
        },
      },
    },
    '/api/outreach/sent': {
      get: {
        tags: ['Outreach & Gmail'],
        summary: 'Sent messages history',
        description: 'Returns sent outreach email records logged in database.',
        responses: {
          '200': {
            description: 'List of sent messages',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean' },
                    data: {
                      type: 'array',
                      items: { type: 'object' },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
    '/api/personalization/test': {
      post: {
        tags: ['Personalization'],
        summary: 'Direct AI Chat & Prompt Test',
        description: 'Sends a direct prompt to the active AI provider (Gemini / OpenAI) to test connectivity and output.',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['prompt'],
                properties: {
                  prompt: { type: 'string', example: 'Hello Gemini! Give me a 1-line hook for a local salon.' },
                  provider: { type: 'string', example: 'gemini' },
                  model: { type: 'string', example: 'gemini-2.5-flash' },
                },
              },
            },
          },
        },
        responses: {
          '200': {
            description: 'AI model reply',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    data: {
                      type: 'object',
                      properties: {
                        success: { type: 'boolean', example: true },
                        reply: { type: 'string' },
                        provider: { type: 'string' },
                        model: { type: 'string' },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
    '/api/integrations/whatsapp/status': {
      get: {
        tags: ['Integrations'],
        summary: 'OpenWA WhatsApp gateway status',
        description: 'Returns OpenWA gateway reachability and configured session status without exposing the API key.',
        responses: {
          '200': {
            description: 'WhatsApp integration status',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    data: {
                      type: 'object',
                      properties: {
                        isConnected: { type: 'boolean' },
                        provider: { type: 'string' },
                        mode: { type: 'string', enum: ['openwa', 'unconfigured'] },
                        baseUrl: { type: 'string', nullable: true },
                        sessionId: { type: 'string', nullable: true },
                        sessionStatus: { type: 'string', nullable: true },
                        gatewayReachable: { type: 'boolean' },
                        precheckContacts: { type: 'boolean' },
                        error: { type: 'string', nullable: true },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
    '/api/outreach/whatsapp/send': {
      post: {
        tags: ['Outreach & Gmail'],
        summary: 'Send WhatsApp text message via OpenWA',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['recipient', 'body'],
                properties: {
                  leadId: { type: 'integer', example: 123 },
                  recipient: { type: 'string', example: '+919876543210' },
                  body: { type: 'string', maxLength: 4096, example: 'Hi! Quick question about your website.' },
                },
              },
            },
          },
        },
        responses: {
          '200': { description: 'WhatsApp message dispatched successfully' },
        },
      },
    },
    '/api/campaigns': {
      get: {
        tags: ['Campaigns'],
        summary: 'List outreach campaigns',
        responses: { '200': { description: 'List of campaigns' } },
      },
      post: {
        tags: ['Campaigns'],
        summary: 'Create outreach campaign',
        responses: { '201': { description: 'Campaign created' } },
      },
    },
    '/api/campaigns/{id}/run': {
      post: {
        tags: ['Campaigns'],
        summary: 'Execute campaign and fan out to approval queue',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
        responses: { '200': { description: 'Run completed and approvals enqueued' } },
      },
    },
    '/api/follow-ups': {
      get: {
        tags: ['Follow-Ups'],
        summary: 'List scheduled and historical follow-ups',
        responses: { '200': { description: 'Follow-ups list' } },
      },
    },
    '/api/follow-ups/process-now': {
      post: {
        tags: ['Follow-Ups'],
        summary: 'Process due follow-ups into approval queue',
        responses: { '200': { description: 'Due items processed' } },
      },
    },
    '/api/messages/replies': {
      get: {
        tags: ['Replies & Inbox'],
        summary: 'List inbound replies from outreach emails',
        responses: { '200': { description: 'Replies list' } },
      },
    },
    '/api/messages/replies/sync': {
      post: {
        tags: ['Replies & Inbox'],
        summary: 'Sync Gmail threads and advance lead status to REPLIED',
        responses: { '200': { description: 'Sync completed' } },
      },
    },
  },
};

