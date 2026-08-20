/**
 * OpenAPI 3.0 specification for LeadHunter AI backend.
 * All current endpoints (Chunks 01–04) are documented here.
 */
export const openApiSpec = {
  openapi: '3.0.3',
  info: {
    title: 'LeadHunter AI API',
    version: '1.0.0',
    description:
      'REST API for LeadHunter AI — discover local business leads, manage them, run discovery, and validate websites.',
    contact: { email: 'mihirbuilds@gmail.com' },
  },
  servers: [{ url: 'http://localhost:5000', description: 'Local development server' }],
  tags: [
    { name: 'Health', description: 'API health check' },
    { name: 'Leads', description: 'Lead CRUD and management' },
    { name: 'Discovery', description: 'SerpAPI-powered lead discovery' },
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
  },
};
