# LeadHunter AI

You are a senior full-stack engineer working on **LeadHunter AI**, a SaaS platform for freelancers and agencies to discover business leads, analyze them, personalize outreach, obtain human approval, send messages, and track follow-ups.

## Global Architecture

Use:

### Frontend

- React
- TypeScript
- Vite
- Tailwind CSS
- shadcn/ui
- React Router
- TanStack Query
- React Hook Form
- Zod
- Lucide React
- Motion for animations

### Backend

- Node.js
- Express
- TypeScript
- Prisma
- SQLite initially
- Zod
- dotenv
- Helmet
- CORS
- Morgan or equivalent request logging

### Architecture

```text
React
  ↓
API Client
  ↓
Express REST API
  ↓
Controllers
  ↓
Services
  ↓
Repositories
  ↓
Prisma
  ↓
SQLite
```

External services must always be accessed by the backend.

Never expose API keys to the frontend.

Future integrations:

```text
Lead Discovery
    └── SerpAPI

AI Personalization
    └── Pluggable AI Provider

Outreach
    ├── Gmail
    └── WhatsApp Cloud API

Database
    └── SQLite → PostgreSQL later
```

## Global Rules

Follow these rules for every chunk:

1. Do not rewrite working code unnecessarily.
2. Do not introduce new frameworks unless required.
3. Do not use NestJS.
4. Do not introduce microservices.
5. Do not introduce Redis or queues yet.
6. Use TypeScript strict mode.
7. Avoid `any`.
8. Use Zod for external/API input validation.
9. Keep controllers thin.
10. Put business logic in services.
11. Put database access in repositories.
12. Keep external integrations isolated.
13. Never expose secrets to the frontend.
14. Use environment variables.
15. Use shadcn/ui instead of recreating common components.
16. Use Motion for meaningful UI animation.
17. Keep animations subtle and fast.
18. Provide loading, empty, success, and error states.
19. Use consistent API response structures.
20. Do not build future features early unless explicitly required by the current chunk.
21. Preserve backward compatibility with completed chunks.
22. After each chunk, run the appropriate tests/build/type checks.
23. Do not automatically continue to the next chunk.
24. At the end of each chunk, report:

- files created
- files modified
- dependencies added
- database changes
- APIs added
- tests performed
- known issues
- recommended next step

---

# CHUNK 01: Project Foundation

Build the initial LeadHunter AI project.

Create:

```text
leadhunter-ai/
├── frontend/
├── backend/
├── README.md
└── .gitignore
```

## Frontend

Initialize:

```text
React
TypeScript
Vite
Tailwind
shadcn/ui
React Router
TanStack Query
React Hook Form
Zod
Lucide React
Motion
```

Create:

```text
frontend/src/
├── components/
├── components/ui/
├── layouts/
├── pages/
├── routes/
├── services/
├── hooks/
├── lib/
├── types/
└── App.tsx
```

Create the main application layout with:

- Sidebar
- Header
- Content area
- Responsive mobile navigation

Sidebar:

```text
Dashboard
Leads
Discovery
Templates
Campaigns
Approvals
Messages
Follow-ups
Analytics

Integrations
Settings
```

Use shadcn/ui and Lucide icons.

## Backend

Initialize:

```text
Node.js
Express
TypeScript
Prisma
SQLite
dotenv
cors
helmet
request logging
zod
```

Create:

```text
backend/src/
├── config/
├── controllers/
├── middleware/
├── routes/
├── services/
├── repositories/
├── validators/
├── utils/
├── types/
├── app.ts
└── server.ts
```

Create:

```text
GET /api/health
```

Return:

```json
{
  "success": true,
  "message": "LeadHunter API is running"
}
```

Create centralized error handling and 404 handling.

Create:

```text
.env
.env.example
```

Do not implement lead discovery, Gmail, WhatsApp, or AI yet.

Stop after this chunk.

---

# CHUNK 02: Database + Lead CRUD

Implement the first database module.

Use Prisma + SQLite.

Create the `Lead` model.

Fields:

```text
id
businessName
category
city
address
website
phone
email
rating
reviewCount
websiteStatus
score
temperature
status
source
createdAt
updatedAt
```

Use enums where appropriate.

Suggested:

```text
temperature:
HOT
WARM
LOW
```

```text
status:
NEW
RESEARCHED
QUALIFIED
PENDING_APPROVAL
CONTACTED
REPLIED
INTERESTED
CONVERTED
DISQUALIFIED
```

Create repository:

```text
lead.repository.ts
```

Create service:

```text
lead.service.ts
```

Create controller:

```text
lead.controller.ts
```

Create routes:

```text
GET    /api/leads
GET    /api/leads/:id
POST   /api/leads
PATCH  /api/leads/:id
DELETE /api/leads/:id
```

Validate requests with Zod.

Support pagination in:

```text
GET /api/leads
```

Support:

```text
page
limit
search
status
temperature
city
category
```

Return consistent responses.

Do not build the complete frontend yet.

---

# CHUNK 03: Frontend Lead Management

Build the Leads page using the API from Chunk 02.

Route:

```text
/leads
```

Create a professional shadcn/ui data table.

Columns:

```text
Business
Category
City
Website
Score
Temperature
Status
Created
Actions
```

Add:

- Search
- Pagination
- Status filter
- Temperature filter
- Category filter
- City filter
- Sorting
- View
- Edit
- Delete

Create:

```text
/leads/:id
```

Lead details page should show:

```text
Business Information
Contact Information
Website Information
Lead Score
Status
Activity
```

Use TanStack Query for server state.

Use skeleton loaders.

Use empty states.

Use Sonner for success/error notifications.

Use Motion for subtle table/page transitions.

Do not add discovery yet.

---

# CHUNK 04: Lead Discovery with SerpAPI

Implement lead discovery.

Create:

```text
backend/src/services/discovery/
```

Create a provider abstraction:

```text
LeadDiscoveryProvider
```

Implement:

```text
SerpApiProvider
```

Environment:

```env
SERPAPI_API_KEY=
```

Create:

```text
POST /api/discovery/search
```

Request:

```json
{
  "city": "Surat",
  "category": "salon",
  "limit": 50
}
```

The backend should:

1. Validate input.
2. Query SerpAPI.
3. Normalize results.
4. Extract business information.
5. Check for duplicates.
6. Save new leads.
7. Return a summary.

Response should include:

```text
discovered
newLeads
duplicates
```

Build the Discovery frontend page.

Fields:

```text
City
Business Category
Number of Results
```

Show progress/loading state.

After completion show:

```text
50 discovered
43 new
7 duplicates
```

Do not implement AI.

---

# CHUNK 05: Website Validation

Implement website validation.

Create:

```text
website-validator.service.ts
```

For each website determine:

```text
DNS reachable
HTTP status
HTTPS
Website reachable
```

Add:

```text
POST /api/leads/:id/validate
```

Also add bulk validation:

```text
POST /api/leads/validate
```

Update:

```text
websiteStatus
```

Possible values:

```text
UNKNOWN
ONLINE
OFFLINE
INVALID
```

Frontend:

Add a validation action to the lead details page.

Add bulk validation to the Leads page.

Show:

```text
Online
Offline
Unknown
```

Do not perform aggressive crawling.

Use sensible request timeouts.

---

# CHUNK 06: Lead Scoring

Create an independent scoring service.

Example scoring:

```text
No website          +30
Broken website      +25
Phone available     +5
Email available     +5
High review count   +10
Target category     +10
```

Make scoring rules configurable in code for now.

Calculate:

```text
score
temperature
```

Example:

```text
70+ = HOT
40-69 = WARM
<40 = LOW
```

Add:

```text
POST /api/leads/:id/score
POST /api/leads/score
```

Show scoring reasons on the lead details page.

Example:

```text
82 / 100

Reasons:
+30 No website
+10 High review count
+10 Target category
+5 Phone available
```

Keep the scoring service independent so rules can later move to the database.

---

# CHUNK 07: Template System

Implement the reusable outreach template system.

Create:

```text
Template
```

Fields:

```text
id
name
description
channel
subject
body
isActive
createdAt
updatedAt
```

Channels:

```text
EMAIL
WHATSAPP
```

Create APIs:

```text
GET    /api/templates
GET    /api/templates/:id
POST   /api/templates
PATCH  /api/templates/:id
DELETE /api/templates/:id
```

Build:

```text
/templates
/templates/new
/templates/:id
```

Template editor should support variables:

```text
{{business_name}}
{{contact_name}}
{{city}}
{{category}}
{{website}}
{{rating}}
{{review_count}}
{{sender_name}}
```

Create a variable picker.

Create a live preview.

Templates must work without AI.

This is an important requirement.

---

# CHUNK 08: Message Generation

Create the message generation system.

Flow:

```text
Lead
 +
Template
 ↓
Template Engine
 ↓
Rendered Message
```

Create:

```text
POST /api/messages/preview
```

Request:

```json
{
  "leadId": 123,
  "templateId": 5
}
```

Return:

```json
{
  "subject": "Quick question about ABC Salon",
  "body": "Hi..."
}
```

Implement variable replacement safely.

If a required variable is missing, handle it gracefully.

Create a message preview UI.

Allow:

```text
Select Lead
Select Template
Preview
```

Do not send anything yet.

Do not use AI yet.

---

# CHUNK 09: AI Agent Connector

Now introduce AI personalization.

Important:

Do not hard-code a specific AI provider into the business logic.

Create:

```text
AgentProvider
```

with a generic interface such as:

```text
generatePersonalization()
```

Architecture:

```text
PersonalizationService
        ↓
AgentProvider
        ↓
Selected AI provider
```

Support configuration such as:

```env
AI_PROVIDER=
AI_API_KEY=
```

The provider must be replaceable.

Possible future providers:

```text
OpenAI
Gemini
Claude
Custom Agent
Local Model
```

Do not assume which provider we will permanently use.

Implement a personalization endpoint:

```text
POST /api/personalization/generate
```

Input:

```text
lead
template
```

AI should receive structured facts about the lead.

Do not allow the AI to invent business facts.

The AI should personalize the existing template rather than completely changing the sales strategy.

Important architecture:

```text
Lead
 ↓
Template
 ↓
Template variables
 ↓
Optional AI enhancement
 ↓
Human approval
```

AI must be optional.

If AI fails, the system should still be able to generate the normal template message.

---

# CHUNK 10: Gmail Integration

Implement Gmail API integration.

Use OAuth.

Create:

```text
gmail.service.ts
```

Keep credentials in environment variables.

Architecture:

```text
OutreachService
      ↓
GmailProvider
```

Create APIs for:

```text
POST /api/integrations/gmail/connect
GET  /api/integrations/gmail/status
POST /api/outreach/email/send
```

Do not allow arbitrary frontend code to send emails.

The backend must control sending.

Store:

```text
messageId
threadId
recipient
subject
sentAt
status
```

Do not implement automatic bulk sending yet.

The approval system must be completed before automated campaigns can send.

---

# CHUNK 11: Human Approval System

Create the approval workflow.

Message statuses:

```text
DRAFT
PENDING_APPROVAL
APPROVED
REJECTED
SENT
FAILED
```

Create:

```text
Approval
```

or extend the Message model appropriately.

Create APIs:

```text
GET  /api/approvals
POST /api/approvals/:id/approve
POST /api/approvals/:id/reject
```

Frontend:

```text
/approvals
```

Display:

```text
Lead
Channel
Template
Subject
Message
Created
Status
```

Actions:

```text
Edit
Preview
Approve
Reject
```

Important:

**Approval must happen before Gmail sends the message.**

Do not bypass this.

---

# CHUNK 12: Campaigns

Create campaign management.

Model:

```text
Campaign
```

Fields:

```text
id
name
description
city
category
templateId
channel
dailyLimit
status
createdAt
updatedAt
```

Create:

```text
GET    /api/campaigns
GET    /api/campaigns/:id
POST   /api/campaigns
PATCH  /api/campaigns/:id
DELETE /api/campaigns/:id
```

Frontend:

```text
/campaigns
/campaigns/new
/campaigns/:id
```

Campaign creation:

```text
Campaign Name
City
Category
Lead Filter
Template
Channel
Daily Limit
```

Do not automatically send messages yet.

The campaign should initially generate messages into the approval queue.

---

# CHUNK 13: Follow-Up Engine

Create configurable follow-up sequences.

Default:

```text
Day 1
Day 3
Day 7
Day 10
```

Do not hard-code these permanently.

Create a follow-up configuration model.

Track:

```text
followUpStep
nextFollowUpAt
lastContactedAt
```

Create:

```text
GET  /api/follow-ups
POST /api/follow-ups/:id/skip
```

Create a scheduler service.

Initially use a simple Node scheduler.

Do not introduce Redis or a queue.

Rules:

```text
If replied:
    stop follow-ups

If interested:
    stop follow-ups

If converted:
    stop follow-ups

If do-not-contact:
    stop follow-ups

Otherwise:
    schedule next step
```

Follow-up messages must also pass through approval.

---

# CHUNK 14: Gmail Reply Detection

Implement reply tracking.

Use Gmail API to identify replies.

Store:

```text
threadId
messageId
replyAt
```

Match replies to leads.

Update lead status:

```text
CONTACTED
 →
REPLIED
```

Create:

```text
GET /api/messages/replies
```

Frontend:

```text
/messages/replies
```

Display:

```text
Lead
Subject
Reply
Received At
Status
```

Do not use AI for reply classification yet.

---

# CHUNK 15: WhatsApp Architecture

Now implement the WhatsApp provider placeholder.

Create:

```text
WhatsAppProvider
```

Architecture:

```text
OutreachService
   ├── GmailProvider
   └── WhatsAppProvider
```

Environment:

```env
WHATSAPP_ACCESS_TOKEN=
WHATSAPP_PHONE_NUMBER_ID=
```

Create:

```text
GET /api/integrations/whatsapp/status
POST /api/outreach/whatsapp/send
```

Initially the endpoint may return:

```text
WhatsApp integration not configured
```

Do not break Gmail functionality.

Frontend Integrations page should show:

```text
Gmail
Connected

WhatsApp
Not Connected
```

Keep WhatsApp isolated so it can be fully implemented later.

---

# CHUNK 16: Analytics Dashboard

Implement analytics.

Track:

```text
Total Leads
Hot Leads
Contacted
Replies
Interested
Converted
```

Create:

```text
GET /api/analytics/overview
GET /api/analytics/pipeline
GET /api/analytics/sources
GET /api/analytics/campaigns
```

Dashboard should contain:

```text
KPI Cards

Pipeline Overview

Lead Source Distribution

Activity Feed

Recent Leads

Top Campaigns
```

Use a proper React chart library.

Do not build chart components from scratch.

Add filters:

```text
City
Date Range
Campaign
Category
```

---

# CHUNK 17: Integrations + Settings

Build:

```text
/integrations
/settings
/settings/profile
/settings/scoring
```

Integrations:

```text
Gmail
WhatsApp
SerpAPI
AI Provider
```

Settings:

```text
Profile
Sender Information
Default Templates
Scoring Rules
Outreach Preferences
```

Move lead scoring rules from hard-coded values toward configurable settings.

For example:

```text
No website:
30 points

Broken website:
25 points

Phone:
5 points
```

Do not expose secret API keys in the frontend.

Show connection status instead.

---

# CHUNK 18: Authentication

Only now introduce authentication.

Create:

```text
User
Session/Auth
```

Add:

```text
/login
```

Protect application routes.

Backend middleware:

```text
authenticate
```

Protect APIs.

Do not store passwords in plain text.

Use a secure password hashing strategy.

Add logout.

Add frontend protected routes.

Do not add team management yet unless necessary.

---

# CHUNK 19: Testing + Error Handling

Perform a complete reliability pass.

## Backend

Add tests for:

```text
Lead CRUD
Lead scoring
Template rendering
Discovery normalization
Deduplication
Message generation
Approval workflow
Follow-up rules
```

Test errors:

```text
Invalid input
Missing lead
Missing template
External API failure
Database failure
Gmail failure
AI failure
```

## Frontend

Add:

```text
Error Boundary
API error handling
Loading states
Empty states
Retry actions
Toast notifications
```

Verify no component crashes because an API returns an error.

Use proper HTTP status codes.

Do not expose stack traces to clients.

---

# CHUNK 20: Production Hardening

Perform a complete production-readiness review.

Check:

```text
Environment variables
Secrets
CORS
Helmet
Input validation
Rate limiting
Logging
Error handling
Database migrations
API security
Frontend error boundaries
API timeouts
External API failures
Gmail token handling
AI provider failures
WhatsApp failures
```

Add sensible rate limits.

Add request IDs for easier debugging.

Improve structured logging.

Review all API endpoints.

Remove:

```text
console.log()
debug code
unused dependencies
temporary mock data
```

Run:

```text
npm run build
npm run typecheck
npm test
```

for frontend and backend.

Create production setup documentation.

---

# Final Architecture After All Chunks

The completed application should follow this structure:

```text
                         LeadHunter AI
                              │
                    ┌─────────┴─────────┐
                    │                   │
                 React              Express
                    │                   │
               shadcn/ui            REST API
                    │                   │
             TanStack Query       Controllers
                    │                   │
                    │                Services
                    │                   │
                    │              Repositories
                    │                   │
                    │                Prisma
                    │                   │
                    │                SQLite
                    │
                    │
                    └──────────────────────────────┐
                                                   │
                                     External Services
                                                   │
                     ┌─────────────────────────────┼──────────────────────────┐
                     │                             │                          │
                  SerpAPI                      AI Agent                   Gmail
                     │                             │                          │
              Lead Discovery               Personalization                Email
                                                   │
                                                   │
                                              WhatsApp
                                              Cloud API
```

## Core business flow

```text
1. Discover Leads
       ↓
2. Store Leads
       ↓
3. Deduplicate
       ↓
4. Validate Website
       ↓
5. Score Lead
       ↓
6. Select Template
       ↓
7. Render Template
       ↓
8. Optional AI Personalization
       ↓
9. Human Approval
       ↓
10. Gmail / WhatsApp
       ↓
11. Detect Reply
       ↓
12. Follow-Up
       ↓
13. Analytics
```

## Most important design principle

The system must **not depend on AI for everything**.

Use:

```text
                 Lead
                  │
                  ▼
             Template Engine
                  │
          ┌───────┴────────┐
          │                │
       Enough?           Need AI?
          │                │
         YES              YES
          │                │
          ▼                ▼
      Send to           AI Agent
      Approval             │
          │                ▼
          │          Personalized
          │             Message
          │                │
          └────────┬───────┘
                   ▼
             Human Approval
                   │
                   ▼
              Gmail/WhatsApp
```

This keeps your AI costs low while still giving you the ability to produce highly personalized outreach when it is actually useful.

## Development discipline

After every chunk:

```text
Build
 ↓
Typecheck
 ↓
Test
 ↓
Run application
 ↓
Manually verify
 ↓
Git commit
 ↓
Next chunk
```

Do not let the coding agent silently move through multiple chunks.

Each chunk should be a stable checkpoint.
