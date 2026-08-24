LeadHunter + OpenWA implementation plan

We'll build this in 8 practical stages.

Stage 1  → OpenWA running locally
Stage 2  → Connect WhatsApp account
Stage 3  → Test OpenWA independently
Stage 4  → Create WhatsAppProvider in LeadHunter
Stage 5  → Connect Express → OpenWA
Stage 6  → Connect React → WhatsApp
Stage 7  → Connect WhatsApp to Approval system
Stage 8  → Connect WhatsApp to Campaigns + Follow-ups

Don't jump directly to Stage 8.

Stage 1: Run OpenWA locally

First, get OpenWA working without LeadHunter.

You have two choices.

Option A: Docker

I'd recommend this if you already have Docker installed.

OpenWA's current quick-start supports Docker Compose and exposes the API/dashboard on port 2785.

git clone https://github.com/rmyndharis/OpenWA.git
cd OpenWA

docker compose -f docker-compose.dev.yml up -d

Then open:

http://localhost:2785

API:

http://localhost:2785/api

Swagger:

http://localhost:2785/api/docs

OpenWA's documentation currently lists these exact development endpoints.

Option B: Run directly with Node

Since you're already using Node:

git clone https://github.com/rmyndharis/OpenWA.git
cd OpenWA

npm ci
cp .env.minimal .env

mkdir -p data/sessions data/media

npm run start:dev

The current minimal setup uses SQLite and doesn't require Docker services.

Stage 2: Get the OpenWA API key

When OpenWA starts, it generates an API key.

Current OpenWA documentation says the development key is stored in:

data/.api-key

and the startup logs also show the initial key.

You'll eventually have:

OPENWA_URL=http://localhost:2785
OPENWA_API_KEY=xxxxxxxx

Do not put this in React.

Only the Express backend should know this key.

Stage 3: Create a WhatsApp session

OpenWA's current API works around sessions.

Think:

Session = one WhatsApp account/number

Create one:

POST /api/sessions

with:

{
  "name": "leadhunter-main"
}

OpenWA's current API example creates a session, starts it, obtains its QR, and then sends messages through that session.

You can test this through Swagger first.

Stage 4: Connect your WhatsApp account

After creating the session:

OpenWA
   ↓
Start session
   ↓
QR generated
   ↓
WhatsApp on phone
   ↓
Linked Devices
   ↓
Scan QR

The API exposes a QR endpoint for the session.

Once scanned:

Session
   ↓
AUTHENTICATING
   ↓
READY

The important thing is to persist the authentication state.

OpenWA stores session authentication state on disk. With whatsapp-web.js, the profile is under the session data directory; with Baileys, credentials are stored separately.

Don't delete these directories.

If you delete the auth state, you'll need to scan the QR again.

Stage 5: Test sending a message

Before connecting LeadHunter, test:

OpenWA → WhatsApp

OpenWA's current API exposes:

POST /api/sessions/{sessionId}/messages/send-text

with a payload like:

{
  "chatId": "91XXXXXXXXXX@c.us",
  "text": "Hello from LeadHunter test"
}

The current OpenWA documentation uses the same send-text endpoint and JID format.

Your first test should be:

Your WhatsApp
        ↓
Another phone you control
        ↓
"Hello from OpenWA"

Don't test with a bulk list.

Stage 6: Add OpenWA to LeadHunter

Now modify our LeadHunter backend.

Create:

backend/src/services/outreach/

Structure:

outreach/
├── outreach.service.ts
├── providers/
│   ├── gmail.provider.ts
│   ├── whatsapp.provider.ts
│   └── types.ts

The important interface is:

interface WhatsAppProvider {
    getStatus(): Promise<WhatsAppStatus>;

    createSession(): Promise<WhatsAppSession>;

    getQrCode(sessionId: string): Promise<string>;

    sendText(
        sessionId: string,
        phone: string,
        message: string
    ): Promise<SendMessageResult>;
}

Then:

WhatsAppProvider
       ↓
OpenWAProvider
       ↓
OpenWA REST API
Stage 7: OpenWA configuration inside LeadHunter

Backend .env:

OPENWA_URL=http://localhost:2785
OPENWA_API_KEY=
OPENWA_SESSION_NAME=leadhunter-main

Create:

backend/src/config/openwa.config.ts

Don't scatter:

process.env.OPENWA_URL

throughout the application.

Use a configuration service/object.

Stage 8: Create OpenWA API client

Create:

backend/src/services/outreach/providers/openwa/

Structure:

openwa/
├── openwa.client.ts
├── openwa.provider.ts
├── openwa.types.ts
└── openwa.errors.ts
openwa.client.ts

This is responsible only for HTTP communication:

LeadHunter
     ↓
OpenWAClient
     ↓
HTTP
     ↓
OpenWA

It should handle:

GET
POST
errors
timeouts
authentication
response parsing
openwa.provider.ts

This is responsible for LeadHunter's WhatsApp business operations:

createSession()
getStatus()
getQr()
sendMessage()

That separation is important.

Stage 9: Add LeadHunter API endpoints

Now expose your own API.

Connection status
GET /api/integrations/whatsapp/status

Response:

{
  "success": true,
  "data": {
    "provider": "openwa",
    "session": "leadhunter-main",
    "status": "CONNECTED"
  }
}

Possible states:

NOT_CONFIGURED
DISCONNECTED
CONNECTING
QR_REQUIRED
CONNECTED
ERROR
Stage 10: QR endpoint

Create:

GET /api/integrations/whatsapp/qr

Flow:

React
 ↓
GET /api/integrations/whatsapp/qr
 ↓
Express
 ↓
OpenWA
 ↓
QR
 ↓
Express
 ↓
React

The React frontend displays the QR.

So your Integrations page can eventually show:

┌──────────────────────────────────┐
│ WhatsApp                         │
│                                  │
│ Status: Not Connected            │
│                                  │
│       ┌──────────────┐           │
│       │              │           │
│       │   QR CODE    │           │
│       │              │           │
│       └──────────────┘           │
│                                  │
│ Scan using WhatsApp              │
│                                  │
│ [ Refresh QR ]                   │
└──────────────────────────────────┘
Stage 11: React WhatsApp Integration page

Our existing:

/integrations

should have:

Gmail
WhatsApp
AI Provider
SerpAPI

WhatsApp card:

WhatsApp
OpenWA

● Connected

+91 XXXXX XXXXX

[Disconnect]

Or:

WhatsApp
OpenWA

● QR Required

[Connect WhatsApp]

Use shadcn:

Card
Badge
Dialog
Button
Skeleton
Alert

Use Motion for the connection state transition.

Stage 12: Send a message through LeadHunter

Now create:

POST /api/outreach/whatsapp/send

Request:

{
  "leadId": 123,
  "message": "Hi, I came across your business..."
}

The backend does:

LeadHunter
    ↓
Find Lead
    ↓
Get phone
    ↓
Validate phone
    ↓
WhatsAppProvider
    ↓
OpenWAProvider
    ↓
OpenWA
    ↓
WhatsApp
Stage 13: Don't allow direct sending from the Leads page

This is important.

Don't make:

Lead
 ↓
Send WhatsApp
 ↓
Message immediately sent

Instead:

Lead
 ↓
Select Template
 ↓
Generate Message
 ↓
Preview
 ↓
Create Draft
 ↓
Approval
 ↓
Approve
 ↓
Send

Same architecture as Gmail.

Stage 14: Extend the Message model

Your Message table should support:

channel
provider
recipient
content
status
externalMessageId
createdAt
sentAt
error

Example:

channel:
WHATSAPP

provider:
OPENWA

status:
SENT

So the same message system handles both:

GMAIL
WHATSAPP
Stage 15: Unified Outreach Service

Now we get the architecture we really want:

                  OutreachService
                        │
            ┌───────────┴───────────┐
            │                       │
       EmailProvider          WhatsAppProvider
            │                       │
       GmailProvider           OpenWAProvider
            │                       │
         Gmail API                OpenWA
                                    │
                                 WhatsApp

The campaign doesn't care about implementation.

It simply says:

await outreachService.send({
    channel: "WHATSAPP",
    lead,
    message
});

The service chooses OpenWA.

Stage 16: Connect it to Templates

Now our template system can have:

Template
│
├── Channel: EMAIL
│
└── Channel: WHATSAPP

Example WhatsApp template:

Hi {{contact_name}},

I came across {{business_name}} while looking for
{{category}} businesses in {{city}}.

I noticed {{personalization_point}}.

I work with businesses to improve their online presence
and generate more enquiries.

Would you be open to a quick conversation?

The template engine renders this without AI.

Then optionally:

Template
   ↓
AI personalization
   ↓
Human approval
Stage 17: Connect OpenWA to campaigns

Now a campaign can choose:

Campaign

Name:
Surat Salon Outreach

Channel:
WhatsApp

Template:
Website Missing

Daily limit:
10

Flow:

Campaign
    ↓
Find matching leads
    ↓
Generate messages
    ↓
Approval queue
    ↓
Human approves
    ↓
OpenWA
    ↓
WhatsApp
Stage 18: Follow-ups

Now WhatsApp can use the same follow-up engine.

Example:

Day 0
Initial message

Day 3
Follow-up

Day 7
Final follow-up

But:

Reply received
     ↓
STOP

or:

Interested
     ↓
STOP

or:

Do Not Contact
     ↓
STOP
Stage 19: Webhooks

This is where OpenWA becomes particularly useful.

Instead of constantly asking:

"Did we receive a WhatsApp reply?"

we can have OpenWA notify LeadHunter.

Current OpenWA documentation supports session webhooks including events such as message.received and session.status.

Architecture:

WhatsApp
    ↓
OpenWA
    ↓
Webhook
    ↓
LeadHunter Express
    ↓
/api/webhooks/openwa
    ↓
Process event
    ↓
Update Message
    ↓
Update Lead

For example:

Customer:
"Yes, tell me more."

        ↓

OpenWA webhook

        ↓

LeadHunter

        ↓

Lead status:
REPLIED

Later we can optionally send the reply to the AI agent for classification.

Stage 20: Security

This part is very important.

Never do:

React
 ↓
OpenWA

Instead:

React
 ↓
LeadHunter API
 ↓
OpenWA

Your OpenWA API key stays on the server.

Also protect the OpenWA instance itself.

OpenWA's current docs recommend API-key authentication and least-privilege keys for consumers.

Stage 21: Session persistence

This is something you absolutely need to test before production.

Test:

1. Connect WhatsApp
2. Send message
3. Stop OpenWA
4. Start OpenWA
5. Check session
6. Send another message

Expected:

WhatsApp
    ↓
Still connected

You shouldn't need to scan the QR every time.

OpenWA's documentation specifically explains persistent auth state and warns that the auth state is effectively a secret because it can act as the linked WhatsApp account.

Stage 22: Production deployment

Only after everything works locally.

I'd deploy:

                    VPS
                     │
          ┌──────────┴──────────┐
          │                     │
      LeadHunter             OpenWA
       Backend
          │                     │
          │                WhatsApp
          │
       Database

For the first production deployment:

Node/Express
OpenWA
SQLite

is enough for a small single-user setup.

Later:

PostgreSQL
Redis
Docker
Reverse Proxy
Monitoring
Backups