# EVENTERA — PRODUCT REQUIREMENTS DOCUMENT
## The Complete System Blueprint
### Version 1.0 | Built from ground up documentation

---

## TABLE OF CONTENTS

1. Executive Summary
2. Product Vision & Strategy
3. User Personas
4. Feature Set & Requirements
5. User Flows
6. Information Architecture
7. Database Schema
8. System Architecture
9. Tech Stack
10. App Modules
11. API Design
12. Data Models & Relationships
13. Authentication & Authorization
14. Payment Architecture
15. Real-time Systems
16. AI Integration (ERA)
17. Email & Communication System
18. File Storage Architecture
19. Security Requirements
20. Performance Requirements
21. Known Gaps & Issues
22. Product Roadmap
23. Launch Checklist

---

# PART 1 — EXECUTIVE SUMMARY

**Product Name:** Eventera
**Tagline:** A new era of events.
**Type:** B2B2C SaaS — Event Management Platform + Marketplace
**Stage:** Built, pre-launch
**Stack:** Next.js 14 / Supabase / Vercel / Stripe + Flutterwave
**Repository:** github.com/haldoorgfx/Cardly (master branch)
**Live URL:** eventera.so (pending domain migration to eventera.so)
**Company:** Wyoming LLC, founder based in Djibouti

**What Eventera is:**
A complete event management platform where organizers create and manage events of any type, and attendees discover events in their city and the world. The platform's signature differentiator is the **Eventera Card** — a personalized, branded card generated automatically for every registered attendee. No other event platform offers this.

**Who it's for:**
- Primary: Event organizers in Africa (Djibouti, Ethiopia, Kenya, Somalia, UAE)
- Secondary: NGOs, political campaigns, corporate events, tech conferences globally
- Tertiary: Attendees who discover and attend events

**Three-sided marketplace:**
1. Organizers — create events, manage attendees, collect revenue
2. Attendees — discover events, register, receive their Eventera Card
3. Speakers/Sponsors — manage their presence at events

---

# PART 2 — PRODUCT VISION & STRATEGY

## Vision
To become the marketplace where the world finds its events — starting with Africa.

## Mission
Make every event unforgettable for the organizer who runs it and the attendee who lives it.

## Positioning
Eventera sits between:
- **Eventbrite** (scale/marketplace) — but Eventera has the Eventera Card
- **Whova** (engagement) — but Eventera is WhatsApp-first for Africa
- **Luma** (design/community) — but Eventera has full event management

## The Five Brand Values
1. Presence — every attendee is a person, not a number
2. Precision — craft in every detail (JetBrains Mono on numbers)
3. Warmth — forest green and gold, Africa-rooted
4. Forward — a new era of how events are run
5. Rootedness — Africa-first is identity, not limitation

## Revenue Model
- **Free plan:** $0 — 1 event, 50 registrations, Eventera watermark on cards
- **Pro plan:** $19/month — unlimited events, 500 registrations/month, full features
- **Studio plan:** $49/month — unlimited everything + AI (ERA) + API + white-label
- **Marketplace fee:** % on paid tickets sold via discovery (future)
- **Featured listings:** promoted event placement (future)

---

# PART 3 — USER PERSONAS

## Persona 1: The Organizer (Primary)
**Name:** Amina — NGO Events Coordinator, Djibouti
**Age:** 32
**Tech level:** Intermediate — uses WhatsApp, Canva, Google Sheets
**Pain points:**
- Spends hours on attendee registration spreadsheets
- No way to give attendees something memorable
- Sends event reminders manually via WhatsApp
- No analytics on who actually showed up
**Wants:**
- One place to manage everything
- Professional-looking event pages
- Automatic WhatsApp reminders to attendees
- A card attendees are proud to share

## Persona 2: The Attendee (Secondary)
**Name:** Khalid — Tech professional, Nairobi
**Age:** 28
**Tech level:** High — uses apps daily
**Pain points:**
- Can't find events relevant to him in his city
- Forgets which events he attended
- No way to connect with other attendees
**Wants:**
- Discover events in his city
- Register quickly
- Get a personalized card to share on LinkedIn
- Connect with other attendees

## Persona 3: The Speaker
**Name:** Dr. Sarah — Keynote speaker, Dubai
**Age:** 45
**Pain points:**
- Receives event info via email attachments
- No professional portal for her sessions
- Has to email organizers for schedule updates
**Wants:**
- Self-service portal with all her session info
- Upload bio and slides in one place
- See her session's Q&A live

## Persona 4: The Sponsor/Exhibitor
**Name:** Ahmed — Marketing Director, MTN Group
**Pain points:**
- No ROI data from events they sponsor
- Manual lead collection at booths
- No way to see who visited their booth
**Wants:**
- Digital exhibitor profile
- QR-based lead capture at the booth
- Export leads as CSV

---

# PART 4 — FEATURE SET & REQUIREMENTS

## Core Features (Built)

### F01 — Authentication
- Email + password signup/login
- Magic link (passwordless)
- Google OAuth
- Password reset flow
- Email verification
- Role-based: super_admin, admin, studio, pro, user (free)
- Session management via Supabase Auth

### F02 — Event Management
- Create event (name, date, venue, description, cover photo)
- Event status: draft → published → ended → archived
- Event categories: tech, culture, business, NGO, religious, political, sports
- Event format: in-person, virtual, hybrid
- Cover photo upload (stored in Supabase Storage)
- Event duplication
- Event templates (save and reuse)
- Recurring events / event series
- Public event URL: `/e/[slug]`

### F03 — Ticket Management
- Multiple ticket types per event (free + paid)
- Early bird pricing with auto-switch at date/quantity
- Promo codes (% or fixed discount)
- Group/bulk tickets
- Hidden tickets (access code required)
- Approval-required registration
- Waitlist with auto-promotion
- Capacity management
- Add-to-calendar (Google/Apple/Outlook/ICS)

### F04 — Registration & Checkout
- Custom registration form builder
- Required/optional fields
- File upload fields
- Multi-step checkout flow
- Stripe payments (international)
- Flutterwave payments (Africa)
- Order confirmation
- Ticket QR code generation
- Registration management (approve/reject/refund/transfer)

### F05 — The Eventera Card (Signature Feature)
- Auto-generated for every registrant
- Attendee photo + name + event branding
- Downloadable PNG
- Shareable via WhatsApp, Instagram, X, LinkedIn
- Printable as a badge (A6/A7/lanyard)
- Organizer designs the card template using Card Studio
- Card Studio: drag-and-drop zones, background, fonts, colors
- Gold glow treatment — the premium moment

### F06 — Agenda & Sessions
- Multi-track agenda builder (Cal.com time-grid)
- Drag-and-drop sessions
- Session types: talk, panel, workshop, keynote, break
- Session capacity with seat booking
- Personal agenda (attendee saves sessions)
- Session feedback and ratings

### F07 — Speaker Management
- Speaker profiles (photo, bio, social links, company)
- Assign speakers to sessions
- Featured speakers
- Public speaker directory
- Speaker portal (self-service)

### F08 — Attendee Networking
- Attendee profiles (interests, role, bio)
- Connection requests
- 1:1 messaging
- AI matchmaking (ERA — powered by Gemini Flash)
- Suggested connections with reasons
- Ice-breaker prompts
- Meeting scheduler (book a 15-min slot)

### F09 — Live Engagement
- Live Q&A (submit, upvote, anonymous)
- Q&A moderation (organizer hides/features questions)
- Live polls (organizer launches, attendees vote, live results)
- Community board (topic threads)
- Event newsfeed (organizer posts + attendee posts)
- Photo wall
- Gamification (points, leaderboard)

### F10 — QR Check-in
- QR code on each ticket
- Scanner (mobile browser, camera)
- Offline-tolerant (caches attendee list)
- Session-level check-in
- Walk-in registration (no prior registration needed)
- Kiosk mode (tablet at the door, self check-in)
- Live display screens (Q&A wall, schedule, sponsor loop)

### F11 — Sponsor & Exhibitor Tools
- Sponsor tiers (gold/silver/bronze with benefits)
- Exhibitor profiles
- Lead retrieval (QR scan at booth → capture contact)
- Exhibitor access code (no Karta account needed)
- Sponsor showcase on public event page
- Lead export (CSV)

### F12 — Virtual & Hybrid
- Virtual session embed (Zoom/Meet/YouTube/RTMP)
- Recording URL
- Hybrid events (in-person + virtual attendance)
- Live viewer count

### F13 — Analytics
- Per-event: registrations over time, revenue, check-in rate, session attendance
- Registration funnel (visited → started → completed → paid)
- Source tracking (UTM, card shares)
- Card virality metrics (unique to Eventera)
- Post-event survey results
- Portfolio analytics (cross-event, organizer-level)

### F14 — Communications
- Email campaigns (send to segments)
- WhatsApp notifications (registration, reminder, day-of)
- Automated sequences (confirm → 7d reminder → 24h → 1h → post-event)
- In-app announcements / broadcasts
- Web push notifications

### F15 — Marketplace & Discovery
- Public event discovery feed
- City/region pages
- Category pages
- Map view
- Search with filters (date, price, format, category)
- Featured events (operator-curated)
- Follow organizers
- Attendee accounts (ticket wallet, saved events)
- Organizer public profile pages

### F16 — ERA (AI Assistant — Gemini Flash)
- Free: locked
- Pro: improve description, FAQ bot, matchmaking, analytics narrator
- Studio: report generator, campaign writer, translator
- Plan gating enforced server-side
- Fails silently — never shows raw errors to users

### F17 — Developer & API
- REST API v1 (events, registrations, check-in)
- API keys (scoped, prefix+hash, rotatable)
- Outbound webhooks (HMAC-signed)
- Webhook delivery log + retry
- Zapier integration

### F18 — White Label (Studio)
- Custom domain (CNAME setup)
- Custom brand name + logo
- Remove Eventera branding
- Custom email from-name
- Domain verification

### F19 — Admin Panel
- Platform analytics (users, events, revenue, cards)
- User management (impersonate, suspend, change plan)
- Event moderation (approve listings, feature events)
- Audit log
- Changelog management
- Feature flags
- Theme/appearance CMS
- Content pages (terms, privacy, about)

### F20 — Team Management
- Invite team members
- Per-event staff roles (check-in only, moderator, finance)
- Workspace settings

---

# PART 5 — USER FLOWS

## Flow 1: Organizer Creates and Publishes an Event
```
Sign up / Log in
  → Dashboard home (events list)
    → "New event" button
      → Event creation wizard:
          Step 1: Name, date, venue, format
          Step 2: Cover photo upload
          Step 3: Choose setup type (full / simple / later)
        → Event overview page (/events/[id])
          → Event Page tab → edit public page
          → Tickets tab → add ticket types
          → Agenda tab → build schedule
          → Speakers tab → add speakers
          → Karta Card tab → design the card
          → "Publish event" → event goes live
            → Public URL: /e/[slug]
            → Organizer shares link
```

## Flow 2: Attendee Discovers and Registers
```
Visits eventera.so (or direct link)
  → Discovery feed or direct event URL
    → Public event page (/e/[slug])
      → Views event details, agenda, speakers
        → "Register" CTA
          → Registration form (name, email, photo, custom fields)
            → Ticket selection
              → Checkout (Stripe/Flutterwave if paid)
                → Registration confirmed
                  → Eventera Card generated
                    → Confirmation page (card + QR code)
                      → Email + WhatsApp confirmation sent
                        → Attendee shares card to social media
```

## Flow 3: Day of Event Check-in
```
Organizer opens check-in page (/events/[id]/registrations → Check-in tab)
  OR opens Kiosk mode on tablet
    → Attendee arrives with QR code
      → Organizer scans QR (or attendee self-scans at kiosk)
        → Attendee found → check-in confirmed
          → Check-in count updates in real-time on dashboard
            → Attendee's ticket shows "Checked in" status
```

## Flow 4: Live Event Engagement
```
Attendee opens event URL on phone during event
  → Event app (mobile-optimized /e/[slug])
    → Schedule tab → personal agenda
    → People tab → networking, connect
    → Q&A tab → submit question, upvote
    → Polls tab → vote on active polls
    → Community tab → post in discussion threads
```

## Flow 5: Post-Event
```
Event ends → status changes to "ended"
  → Organizer gets automated survey email to attendees
    → Attendees rate sessions, give feedback
      → Organizer views analytics
        → ERA generates post-event report (Studio)
          → Organizer downloads/shares report
```

---

# PART 6 — INFORMATION ARCHITECTURE

## URL Structure

### Public / Marketing
```
/                           Homepage (marketplace)
/events                     Event discovery feed
/events/[city]              City page
/events/category/[cat]      Category page
/events/search              Search results
/e/[slug]                   Public event page
/e/[slug]/register          Registration flow
/e/[slug]/schedule          Public agenda
/e/[slug]/speakers          Speaker directory
/e/[slug]/people            Attendee networking
/e/[slug]/qa                Live Q&A
/e/[slug]/polls             Live polls
/organizers/[slug]          Organizer public profile
/pricing                    Pricing page
/use-cases                  Use cases
/how-it-works               How it works
/about                      About Eventera
/terms                      Terms of service
/privacy                    Privacy policy
```

### Authenticated (Organizer Dashboard)
```
/dashboard                  Events list + stats
/events/new                 Create event wizard
/events/[id]                Event overview
/events/[id]/event-page     Edit public page
/events/[id]/tickets        Ticket management
/events/[id]/registrations  Attendee list
/events/[id]/agenda         Agenda builder
/events/[id]/speakers       Speaker management
/events/[id]/sessions       Session management
/events/[id]/networking     Matchmaking settings
/events/[id]/q-and-a        Q&A moderation
/events/[id]/polls          Polls management
/events/[id]/sponsors       Sponsor management
/events/[id]/check-in       Check-in scanner
/events/[id]/analytics      Event analytics
/events/[id]/edit           Card Studio (card editor)
/events/[id]/publish        Publish & share
/settings                   Account settings
/settings/billing           Billing & plans
/settings/developer         API keys + webhooks
/settings/integrations      Third-party integrations
/settings/white-label       White label settings
/templates                  Event templates
/brand-kit                  Brand kit
/team                       Team management
/analytics                  Portfolio analytics
```

### Admin Panel
```
/admin                      Admin dashboard
/admin/users                User management
/admin/events               All events
/admin/analytics            Platform analytics
/admin/changelog            Changelog CMS
/admin/appearance           Theme/appearance
/admin/audit                Audit log
/admin/feature-flags        Feature flags
```

### Special Routes
```
/lead-retrieval/[code]      Exhibitor lead scanner
/embed/[slug]               Embeddable widget
/e/[slug]/display/[type]    Live display screens
```

---

# PART 7 — DATABASE SCHEMA

## Core Tables

### profiles
```sql
id              uuid PK (references auth.users)
email           text unique not null
full_name       text
avatar_url      text
role            text (super_admin/admin/studio/pro/user)
plan            text (free/pro/studio)
plan_expires_at timestamptz
stripe_customer_id text
created_at      timestamptz
updated_at      timestamptz
```

### events
```sql
id              uuid PK
user_id         uuid FK → profiles
name            text not null
slug            text unique not null
description     text
cover_url       text
status          text (draft/published/ended/archived)
format          text (in_person/virtual/hybrid)
category        text
starts_at       timestamptz
ends_at         timestamptz
venue_name      text
venue_address   text
city            text
country         text
lat             numeric
lng             numeric
timezone        text
is_listed       boolean (marketplace visibility)
is_featured     boolean (operator-curated)
max_capacity    int
created_at      timestamptz
```

### ticket_types
```sql
id              uuid PK
event_id        uuid FK → events
name            text
description     text
price           numeric
currency        text (USD/DJF/KES/ETB)
capacity        int
sold_count      int
starts_at       timestamptz
ends_at         timestamptz
is_free         boolean
requires_approval boolean
is_hidden       boolean
access_code     text
min_price       numeric (sliding scale)
max_per_order   int
waitlist_enabled boolean
position        int
```

### registrations
```sql
id              uuid PK
event_id        uuid FK → events
ticket_type_id  uuid FK → ticket_types
attendee_name   text not null
attendee_email  text not null
attendee_phone  text
photo_url       text
custom_fields   jsonb
status          text (pending/confirmed/checked_in/cancelled)
amount_paid     numeric
currency        text
payment_provider text (stripe/flutterwave)
payment_id      text
karta_card_url  text
qr_code         text unique
checked_in_at   timestamptz
created_at      timestamptz
attendee_account_id uuid FK → attendee_accounts
```

### attendee_accounts
```sql
id              uuid PK
auth_user_id    uuid (nullable — can exist without auth account)
email           text unique
full_name       text
photo_url       text
phone           text
city            text
country         text
interests       text[]
language        text
created_at      timestamptz
```

### sessions
```sql
id              uuid PK
event_id        uuid FK → events
track_id        uuid FK → event_tracks
room_id         uuid FK → event_rooms
title           text
description     text
session_type    text (talk/panel/workshop/keynote/break)
starts_at       timestamptz
ends_at         timestamptz
capacity        int
booking_enabled boolean
is_published    boolean
recording_url   text
slides_url      text
position        int
```

### speakers
```sql
id              uuid PK
event_id        uuid FK → events
name            text
title           text
company         text
bio             text
photo_url       text
twitter_url     text
linkedin_url    text
website_url     text
is_featured     boolean
position        int
```

### sponsors
```sql
id              uuid PK
event_id        uuid FK → events
tier_id         uuid FK → sponsor_tiers
name            text
logo_url        text
website_url     text
booth_description text
contact_email   text
is_published    boolean
position        int
```

### connections
```sql
id              uuid PK
event_id        uuid FK → events
requester_id    uuid FK → registrations
requestee_id    uuid FK → registrations
status          text (pending/accepted/declined/blocked)
message         text
created_at      timestamptz
```

### messages
```sql
id              uuid PK
event_id        uuid FK → events
sender_id       uuid FK → registrations
recipient_id    uuid FK → registrations
body            text
is_read         boolean
created_at      timestamptz
```

### session_questions
```sql
id              uuid PK
session_id      uuid FK → sessions
registration_id uuid FK → registrations
question        text
upvotes         int
is_answered     boolean
is_anonymous    boolean
is_hidden       boolean
is_featured     boolean
created_at      timestamptz
```

### session_polls
```sql
id              uuid PK
session_id      uuid FK → sessions
question        text
options         jsonb [{id, text}]
status          text (draft/active/closed)
created_at      timestamptz
```

### api_keys
```sql
id              uuid PK
user_id         uuid FK → profiles
name            text
key_hash        text unique
key_prefix      text
scopes          text[]
last_used       timestamptz
expires_at      timestamptz
is_active       boolean
created_at      timestamptz
```

### webhooks
```sql
id              uuid PK
user_id         uuid FK → profiles
event_id        uuid FK → events (nullable)
url             text
secret          text
events          text[]
is_active       boolean
created_at      timestamptz
```

---

# PART 8 — SYSTEM ARCHITECTURE

## Overview
```
┌─────────────────────────────────────────────────┐
│                   EVENTERA                       │
│                                                  │
│  ┌──────────────┐    ┌─────────────────────┐    │
│  │  Next.js 14  │    │      Supabase        │    │
│  │  App Router  │◄──►│  PostgreSQL + Auth   │    │
│  │  TypeScript  │    │  Storage + Realtime  │    │
│  │  Tailwind    │    │  Edge Functions      │    │
│  │  shadcn/ui   │    └─────────────────────┘    │
│  └──────────────┘                                │
│         │                                        │
│         ▼                                        │
│  ┌──────────────────────────────────────────┐   │
│  │            External Services             │   │
│  │  Stripe │ Flutterwave │ Resend │ Gemini  │   │
│  │  Sentry │ Upstash     │ Vercel           │   │
│  └──────────────────────────────────────────┘   │
└─────────────────────────────────────────────────┘
```

## Deployment Architecture
```
GitHub (master branch)
    → Vercel (auto-deploy on push)
        → Next.js App (Edge + Node.js runtime)
        → Environment variables (production)
        → Custom domain: eventera.so
            → eventera.so (current)
```

## Data Flow
```
Client (Browser/App)
    → Next.js Server Components (SSR)
    → Next.js API Routes (REST)
    → Supabase Client (direct for realtime)
    → Supabase PostgreSQL
    → Supabase Storage (images/files)
```

## Authentication Flow
```
User submits email/password
    → Supabase Auth validates
    → Returns JWT token
    → Stored in httpOnly cookie
    → Server components read via createServerClient()
    → Client components read via createBrowserClient()
    → Row Level Security enforces data access
```

---

# PART 9 — TECH STACK

## Frontend
```
Next.js 14          App Router, TypeScript strict, SSR + SSG
Tailwind CSS        Utility-first styling
shadcn/ui           Component library (built on Radix UI)
React Hook Form     Form management
Zod                 Schema validation
Lucide React        Icon library
```

## Backend
```
Next.js API Routes  REST API endpoints
Supabase            PostgreSQL + Auth + Storage + Realtime
Edge Runtime        Middleware, rate limiting
```

## Database
```
PostgreSQL          Via Supabase (hosted)
Row Level Security  Data access control
Database Migrations Versioned SQL migrations (supabase/migrations/)
```

## Payments
```
Stripe              International payments, subscriptions
Flutterwave         Africa-first payments (mobile money, cards)
```

## Communications
```
Resend              Transactional email
React Email         Email templates
WhatsApp API        Registration confirmations, reminders (planned)
```

## AI
```
Google Gemini Flash ERA AI assistant
@google/generative-ai Node.js SDK
```

## Storage
```
Supabase Storage    Event covers, speaker photos, card renders
CDN                 Via Supabase's built-in CDN
```

## Monitoring
```
Sentry              Error tracking (frontend + backend)
Vercel Analytics    Web vitals, performance
```

## Rate Limiting
```
Upstash Redis       API rate limiting (Edge-compatible)
```

## Package Manager
```
pnpm                Fast, disk-efficient
```

---

# PART 10 — APP MODULES

## Module 1: Auth Module
**Location:** `app/(auth)/`
**Responsibilities:** Sign up, login, logout, password reset, email verification, Google OAuth
**Dependencies:** Supabase Auth, Resend (verification emails)
**Status:** Built

## Module 2: Marketing Module
**Location:** `app/(marketing)/`
**Responsibilities:** Landing page, pricing, use cases, how it works, about, terms, privacy
**Dependencies:** CMS (admin-editable content)
**Status:** Built — needs Eventera brand update

## Module 3: Dashboard Module
**Location:** `app/(app)/`
**Responsibilities:** Organizer workspace — events, settings, billing, team, analytics
**Dependencies:** All other modules
**Status:** Built — sidebar reorganized

## Module 4: Event Management Module
**Location:** `app/(app)/events/`
**Responsibilities:** CRUD events, manage all sub-features per event
**Dependencies:** Supabase, Storage, Stripe
**Status:** Built

## Module 5: Card Studio Module
**Location:** `app/(app)/events/[id]/edit`
**Responsibilities:** Drag-and-drop card designer, zone management, card rendering
**Dependencies:** Canvas/PDF renderer, Storage
**Status:** Built (original core feature)

## Module 6: Public Event Module
**Location:** `app/(public)/e/[slug]/`
**Responsibilities:** Public event page, registration, schedule, speakers, networking, Q&A
**Dependencies:** Supabase Realtime
**Status:** Built

## Module 7: Marketplace Module
**Location:** `app/(public)/events/`
**Responsibilities:** Discovery feed, city pages, category pages, search, organizer profiles
**Dependencies:** Events table, Supabase PostGIS (map)
**Status:** Partially built — needs full implementation

## Module 8: Networking Module
**Location:** `components/networking/`
**Responsibilities:** Profiles, connections, messaging, AI matchmaking
**Dependencies:** ERA (Gemini), Supabase Realtime
**Status:** Built

## Module 9: Engagement Module
**Location:** `components/qa/`, `components/polls/`
**Responsibilities:** Q&A, polls, community board, photo wall, gamification
**Dependencies:** Supabase Realtime
**Status:** Built

## Module 10: Payments Module
**Location:** `app/api/stripe/`, `app/api/flutterwave/`
**Responsibilities:** Checkout, webhooks, refunds, payouts
**Dependencies:** Stripe SDK, Flutterwave SDK
**Status:** Built — needs live mode verification

## Module 11: Communications Module
**Location:** `lib/email/`, `app/api/era/`
**Responsibilities:** Email campaigns, WhatsApp (planned), automations, announcements
**Dependencies:** Resend, WhatsApp Business API (planned)
**Status:** Email built, WhatsApp planned

## Module 12: ERA AI Module
**Location:** `lib/ai/`
**Responsibilities:** All AI features via Gemini Flash
**Dependencies:** @google/generative-ai, plan gating
**Status:** Built

## Module 13: Admin Module
**Location:** `app/admin/`
**Responsibilities:** Platform management, user management, analytics
**Dependencies:** Admin-only RLS policies
**Status:** Built

## Module 14: API Module
**Location:** `app/api/v1/`
**Responsibilities:** Public REST API for developers
**Dependencies:** API key auth, rate limiting (Upstash)
**Status:** Built

---

# PART 11 — API DESIGN

## Authentication
All authenticated endpoints require:
- `Authorization: Bearer <supabase-jwt>` (organizer endpoints)
- `Authorization: Bearer kta_live_<key>` (API key endpoints)

## REST API v1 Endpoints
```
GET    /api/v1/events
POST   /api/v1/events
GET    /api/v1/events/:id
PATCH  /api/v1/events/:id
GET    /api/v1/events/:id/registrations
POST   /api/v1/events/:id/registrations
PATCH  /api/v1/events/:id/registrations/:regId/checkin
GET    /api/v1/events/:id/sessions
GET    /api/v1/events/:id/speakers
GET    /api/v1/events/:id/analytics
```

## Internal API Routes
```
POST   /api/events/create
POST   /api/events/create-basic
POST   /api/events/[id]/publish
POST   /api/registrations/[id]/checkin
POST   /api/era/improve-description
POST   /api/era/answer-question
POST   /api/era/match-attendees
POST   /api/era/narrate-analytics
POST   /api/era/generate-report    (Studio)
POST   /api/era/write-campaign     (Studio)
POST   /api/era/translate          (Studio)
POST   /api/stripe/webhook
POST   /api/stripe/create-checkout
POST   /api/flutterwave/webhook
POST   /api/webhooks/deliver
```

---

# PART 12 — CONNECTED DATA MODELS

## Primary Relationships
```
profiles
  └── events (one organizer → many events)
        ├── ticket_types (one event → many ticket types)
        │     └── registrations (one ticket type → many registrations)
        │           ├── attendee_accounts (many registrations → one account)
        │           ├── connections (registration → registration)
        │           └── messages (registration → registration)
        ├── sessions (one event → many sessions)
        │     ├── speakers (many-to-many via session_speakers)
        │     ├── session_questions (one session → many questions)
        │     ├── session_polls (one session → many polls)
        │     └── attendee_sessions (many-to-many personal agenda)
        ├── event_tracks (one event → many tracks)
        ├── event_rooms (one event → many rooms)
        ├── speakers (one event → many speakers)
        └── sponsors (one event → many sponsors)
```

## Key Business Rules
1. A registration belongs to ONE event and ONE ticket type
2. An Eventera Card (karta_card_url) is generated per registration
3. A QR code is unique per registration — used for check-in
4. Connections are between two registrations within the same event
5. Messages are scoped to an event (two registrants can only message within event context)
6. API keys belong to profiles (organizers), not events
7. Webhooks can be event-scoped or account-scoped

---

# PART 13 — AUTHENTICATION & AUTHORIZATION

## Roles & Permissions
```
super_admin   → everything including destructive platform actions
admin         → everything except billing and super_admin actions
studio        → full organizer features + API + white-label
pro           → full organizer features (no API, no white-label)
user (free)   → 1 event, 50 registrations, basic features
```

## Row Level Security (RLS)
Every table has RLS policies enforcing:
- Organizers can only see/edit their own events
- Registrations are readable by the event organizer
- Attendees can only see their own registration data
- Public events (published) readable by everyone
- Admin/super_admin bypass most restrictions

## Plan Gating
Enforced at two levels:
1. **UI level** — features shown as locked for lower plans
2. **API level** — server checks plan before executing

---

# PART 14 — PAYMENT ARCHITECTURE

## Stripe (International)
```
Customer → Stripe Checkout → Webhook → Registration confirmed
Refund → Stripe API → Registration cancelled
Subscription → Stripe Billing → Plan updated in profiles table
```

## Flutterwave (Africa)
```
Customer → Flutterwave Payment Page → Webhook → Registration confirmed
Supports: Mobile money (M-Pesa, Airtel), bank transfer, cards
```

## Platform Fee (Future)
```
Organizer creates paid event
  → Attendee pays → Stripe Connect splits payment
    → Platform fee retained
    → Remainder sent to organizer's Stripe account
```

---

# PART 15 — REAL-TIME SYSTEMS

## Supabase Realtime Subscriptions
```
Q&A questions     → session_questions table
Poll results      → poll_responses table  
Connections       → connections table
Messages          → messages table
Check-in status   → registrations table (checked_in_at)
Live display      → multiple tables via broadcast channel
```

## Real-time Pattern (Frontend)
```typescript
supabase
  .channel('event-qa')
  .on('postgres_changes', {
    event: '*',
    schema: 'public',
    table: 'session_questions',
    filter: `session_id=eq.${sessionId}`
  }, (payload) => {
    // update UI
  })
  .subscribe()
```

---

# PART 16 — ERA AI INTEGRATION

## Model: Google Gemini 2.0 Flash
**Cost:** ~$0.075 per 1M tokens
**Expected monthly cost at scale:** <$5/month

## Plan Gates
```
Free    → No ERA
Pro     → improve-description, answer-question, match-attendees, narrate-analytics
Studio  → + generate-report, write-campaign, translate
```

## Module Location
```
lib/ai/era.ts       → all ERA functions
lib/ai/gate.ts      → plan gating helpers
app/api/era/        → API routes (one per feature)
```

## Error Handling
- All ERA errors caught and logged
- User sees friendly fallback, never raw API error
- Rate limit errors handled gracefully

---

# PART 17 — EMAIL & COMMUNICATIONS

## Email Provider: Resend
## Templates: React Email

### Email Types
```
1. Registration confirmation    → attendee + QR + Eventera Card
2. Eventera Card delivery       → card image + share buttons
3. Event reminder (24h)         → event details + schedule preview
4. Event reminder (1h)          → QR code prominent
5. Post-event thank you         → survey link + ERA follow-up
6. New registration (organizer) → attendee details + running total
7. Welcome email                → onboarding steps
8. Password reset               → reset link
9. Team invitation              → accept/decline
10. Payment receipt             → order details + invoice
```

### WhatsApp (Planned)
```
Provider: WhatsApp Business Cloud API (Meta) or Twilio
Templates: registration_confirmed, event_reminder_24h, event_reminder_1h
```

---

# PART 18 — FILE STORAGE

## Supabase Storage Buckets
```
event-covers        → event cover images (public)
speaker-photos      → speaker profile photos (public)
card-renders        → generated Eventera Cards (public)
cms-media           → organizer-uploaded media (public)
private-uploads     → secure document uploads (private)
```

## File Naming Convention
```
event-covers/{event_id}/{timestamp}.{ext}
speaker-photos/{event_id}/{speaker_id}.{ext}
card-renders/{event_id}/{registration_id}.png
```

---

# PART 19 — SECURITY REQUIREMENTS

## Critical Requirements
- [ ] All API routes authenticate requests before executing
- [ ] No sensitive data in client-side code or env vars exposed to browser
- [ ] API keys stored as bcrypt hash only — plaintext shown once
- [ ] Stripe webhook signature verification
- [ ] Flutterwave webhook signature verification
- [ ] Rate limiting on all public API routes (Upstash)
- [ ] File upload validation (type + size + virus scan)
- [ ] SQL injection prevention (parameterized queries via Supabase)
- [ ] XSS prevention (React's built-in + CSP headers)
- [ ] CORS properly configured
- [ ] Admin routes protected by role check

---

# PART 20 — PERFORMANCE REQUIREMENTS

## Targets
```
Page load (marketing)     < 2 seconds (LCP)
Page load (dashboard)     < 3 seconds
API response time         < 500ms (95th percentile)
Real-time latency         < 200ms
Image optimization        Next.js Image component everywhere
Database queries          < 100ms (with indexes)
```

## Optimization Checklist
- [ ] Images using next/image everywhere
- [ ] Database indexes on: event_id, user_id, status, starts_at, slug
- [ ] Server components for data-heavy pages
- [ ] Client components only where interactivity needed
- [ ] API routes cached where appropriate

---

# PART 21 — KNOWN GAPS & ISSUES

## Critical (Must fix before launch)
1. **Brand rename incomplete** — "Karta" still appears in some UI strings
2. **Supabase migration 003_roles_and_rls.sql** — may not be applied to production
3. **Payments in test mode** — Stripe and Flutterwave need live mode verification
4. **WhatsApp notifications** — not yet built, critical for Africa market
5. **Upstash Redis in Edge Runtime** — Node.js API warning in build

## Important (Fix soon after launch)
6. **Marketplace discovery** — partially built, needs full implementation
7. **Attendee accounts** — persistent cross-event identity not fully built
8. **Flutter mobile app** — not yet started
9. **.clone and .claire directories** — tracked in git, should be in .gitignore
10. **Domain migration** — still on eventera.so, needs eventera.so

## Nice to Have
11. **Sentry deprecation warnings** — sentry.client.config.ts rename
12. **Bundle size optimization** — some routes are large
13. **Offline check-in** — basic offline support needs testing
14. **Abstract submission** — designed but not fully implemented

---

# PART 22 — PRODUCT ROADMAP

## Phase 0 — Foundation Cleanup (NOW — 2 weeks)
- [ ] Complete brand rename (Karta → Eventera everywhere)
- [ ] Apply all pending Supabase migrations
- [ ] Verify Stripe live mode end-to-end
- [ ] Fix Upstash Edge Runtime issue
- [ ] Clean .gitignore
- [ ] Migrate to eventera.so domain
- [ ] Full end-to-end audit and bug fixes

## Phase 1 — Soft Launch (Month 1)
- [ ] Onboard 5 real organizers personally
- [ ] Run 5 real events on the platform
- [ ] Collect feedback
- [ ] Fix what breaks in real usage
- [ ] WhatsApp notification integration (M-Pesa market critical)

## Phase 2 — Marketplace (Month 2)
- [ ] Complete attendee accounts
- [ ] Event discovery feed
- [ ] City/region pages
- [ ] Organizer public profiles
- [ ] Follow organizers
- [ ] Marketplace fee integration

## Phase 3 — Mobile (Month 2-3)
- [ ] Flutter app (attendee-focused)
- [ ] Apple Developer + Google Play accounts
- [ ] App Store submission

## Phase 4 — Growth (Month 3-6)
- [ ] Promoted listings
- [ ] Advanced analytics
- [ ] Sponsor marketplace
- [ ] Abstract submission
- [ ] Event series / recurring events

## Phase 5 — Scale (Month 6+)
- [ ] White-label offering
- [ ] Enterprise pricing
- [ ] API partner program
- [ ] Regional expansion (UAE, Kenya, Ethiopia)

---

# PART 23 — LAUNCH CHECKLIST

## Technical
- [ ] `pnpm build` passes with zero errors
- [ ] All migrations applied to production Supabase
- [ ] Environment variables set in Vercel
- [ ] Stripe in LIVE mode
- [ ] Flutterwave in LIVE mode
- [ ] GOOGLE_AI_KEY in Vercel
- [ ] Resend domain verified for emails
- [ ] Custom domain eventera.so pointed to Vercel
- [ ] SSL certificate active
- [ ] Error monitoring (Sentry) active

## Legal
- [ ] Terms of Service published
- [ ] Privacy Policy published
- [ ] Cookie consent (if EU users)

## Business
- [ ] Apple Developer account ($99/yr)
- [ ] Google Play Console account ($25)
- [ ] Social media handles secured (@eventera)
- [ ] hello@eventera.so email working
- [ ] support@eventera.so email working
- [ ] Trademark search completed

## Product
- [ ] Brand rename complete
- [ ] 5 test events created and verified
- [ ] Full registration flow tested on mobile
- [ ] Eventera Card generation tested
- [ ] Check-in flow tested on real device
- [ ] Payment flow tested with real card

---

*Document version: 1.0*
*Last updated: June 2026*
*Owner: Abdalla Abdikarim (Haldoorgfx)*
*Status: Living document — update as platform evolves*
