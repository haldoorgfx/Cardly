# KARTA — Engineering Handoff & Implementation Spec
### For Claude Code · turn the built prototypes into a live, scalable platform

> **Status:** The entire product is designed and built as high-fidelity, interactive HTML/React prototypes (see "Prototype inventory"). They are the **source of truth for UI, flows, copy, and the design system**. Your job is to stand up the backend, wire real data + auth + payments, and re-implement the prototype UIs as production React components — pixel-faithful to what exists.

> **Goal:** A working multi-tenant event-management SaaS that can go live quickly and keep scaling. Ship the spine first (auth → org → event → registration → Karta Card → check-in), then layer the rest.

---

## 0. TL;DR for the implementer

- **Stack:** Next.js 14 (App Router, TS) · PostgreSQL · Prisma · Auth.js (NextAuth) · Stripe + Paystack/Flutterwave · Resend (email) · S3-compatible storage (Cloudflare R2) · Upstash Redis (cache/queues/realtime) · Vercel. Supabase is a valid fast alternative (Postgres+Auth+Storage+Realtime+RLS in one) — schema below maps cleanly to it.
- **Design system:** forest/cream/gold, already tokenized. Lift the Tailwind config + tokens verbatim from any prototype `<head>`. Fonts: DM Sans (display), Inter (body), JetBrains Mono (numbers/labels).
- **Multi-tenant:** every row is scoped by `organizationId`. Enforce in every query (and via Postgres RLS if using Supabase).
- **The differentiator:** the **Karta Card** — an auto-generated, personalized, shareable image rendered per attendee at registration from an organizer-designed template. Treat its pipeline as a first-class subsystem (§7).
- **Build order:** §13 milestones. The "day-one" cut is Milestones 1–4.

---

## 1. Surfaces (all built as prototypes)

| Surface | Who | Prototype |
|---|---|---|
| Marketing site | Public | `site/landing-page.html`, `site/pricing-page.html` |
| Event directory | Public | `directory/directory.html` |
| Help / Status / Changelog / Legal | Public | `support/support.html` |
| Auth (sign in/up/forgot/invite) | All | `dashboard/auth.html` |
| Onboarding wizard | New org owner | `onboarding/onboarding.html` |
| Organizer dashboard | Organizer/team | `dashboard/dashboard.html` |
| Card Studio | Organizer | `studio/studio.html` |
| Email template designer | Organizer | `emails/emails.html` |
| Speaker portal | Speaker | `speaker/speaker.html` |
| Attendee app | Attendee | `attendee/att.html` |
| Super-admin / operator console | Karta staff | inside `dashboard/dashboard.html` (Admin + Operations nav, role-gated) |

Hub linking them all: `index.html`.

---

## 2. Recommended architecture

```
karta/  (monorepo, Turborepo or single Next.js app)
├─ app/
│  ├─ (marketing)/            → landing, pricing, directory, support, legal
│  ├─ (auth)/                 → sign-in, sign-up, forgot, invite/[token]
│  ├─ onboarding/             → setup wizard
│  ├─ dashboard/              → organizer + operator (role-gated sections)
│  │   └─ events/[eventId]/   → overview, tickets, registrations, agenda, …
│  ├─ studio/[eventId]/       → card editor
│  ├─ speaker/[eventId]/      → speaker portal
│  ├─ e/[slug]/               → PUBLIC event page + registration (attendee web)
│  ├─ a/                      → attendee app (my tickets, schedule, network…)
│  └─ api/                    → route handlers (or tRPC routers)
├─ packages/
│  ├─ db/        → Prisma schema + client
│  ├─ ui/        → shared components (forest/cream/gold design system)
│  ├─ card/      → Karta Card render engine (template → PNG)
│  └─ jobs/      → background workers (email, card gen, payouts, analytics)
└─ prisma/schema.prisma
```

- **Rendering:** public pages (marketing, event page, attendee app) → SSR/ISR for SEO + speed. Dashboards → client-side under auth.
- **API:** prefer **tRPC** (type-safe, fast to build) for the app; expose a thin **public REST API** (`/api/v1/...`) for the Developer/API-keys feature.
- **State:** server components + React Query (or tRPC's). Avoid a heavy global store.

---

## 3. Data model (Prisma — canonical)

> Conventions: `id` = cuid; every tenant-owned table has `organizationId`; timestamps on all; soft-delete via `deletedAt` where useful. Enums in `UPPER_SNAKE`. Money in **minor units** (`Int` cents) + ISO `currency`. JSON columns for flexible/design payloads.

```prisma
// ───────── Tenancy & identity ─────────
model Organization {
  id            String   @id @default(cuid())
  name          String
  slug          String   @unique
  logoUrl       String?
  region        String?            // e.g. "East Africa"
  currency      String   @default("USD")
  brandKit      Json?              // { colors[], fonts{}, logoUrl, cardAccentId }
  plan          Plan     @default(FREE)
  // subscription
  stripeCustomerId String?
  subscription  Subscription?
  members       Membership[]
  events        Event[]
  apiKeys       ApiKey[]
  webhooks      Webhook[]
  emailTemplates EmailTemplate[]
  cardTemplates CardTemplate[]
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
}

model User {
  id            String   @id @default(cuid())
  email         String   @unique
  name          String?
  avatarUrl     String?
  passwordHash  String?            // null if OAuth-only
  isPlatformAdmin Boolean @default(false)   // Karta staff (operator console)
  memberships   Membership[]
  sessions      Session[]
  createdAt     DateTime @default(now())
}

enum OrgRole { OWNER ADMIN EDITOR CHECKIN_STAFF VIEWER }

model Membership {                  // user ↔ org (RBAC)
  id             String   @id @default(cuid())
  user           User     @relation(fields: [userId], references: [id])
  userId         String
  organization   Organization @relation(fields: [organizationId], references: [id])
  organizationId String
  role           OrgRole  @default(EDITOR)
  eventScope     String[] // empty = all events; else specific eventIds (EDITOR/CHECKIN_STAFF)
  invitedEmail   String?
  status         String   @default("ACTIVE") // ACTIVE | PENDING
  createdAt      DateTime @default(now())
  @@unique([userId, organizationId])
}

enum Plan { FREE PRO STUDIO }

model Subscription {
  id             String   @id @default(cuid())
  organization   Organization @relation(fields: [organizationId], references: [id])
  organizationId String   @unique
  plan           Plan
  status         String   // active | past_due | canceled | trialing
  interval       String   // monthly | yearly
  currentPeriodEnd DateTime?
  stripeSubId    String?
  seats          Int      @default(1)
}

// ───────── Events ─────────
enum EventStatus { DRAFT LIVE ENDED CANCELED }
enum EventVisibility { PUBLIC UNLISTED PRIVATE }

model Event {
  id             String   @id @default(cuid())
  organization   Organization @relation(fields: [organizationId], references: [id])
  organizationId String
  name           String
  slug           String   @unique          // → /e/[slug]
  category       String?                    // Tech, Music, NGO, …
  status         EventStatus @default(DRAFT)
  visibility     EventVisibility @default(PUBLIC)
  startsAt       DateTime?
  endsAt         DateTime?
  timezone       String   @default("UTC")
  venueName      String?
  venueAddress   String?
  city           String?
  isOnline       Boolean  @default(false)
  coverImageUrl  String?
  description    String?
  pageConfig     Json?       // public page sections/order/theme (Event Page editor)
  settings       Json?       // registration/privacy/capacity toggles (Settings page)
  capacity       Int?
  ticketTypes    TicketType[]
  registrations  Registration[]
  orders         Order[]
  tracks         Track[]
  sessions       Session2[]
  speakers       Speaker[]
  sponsors       Sponsor[]
  cardTemplates  CardTemplate[]
  checkIns       CheckIn[]
  createdAt      DateTime @default(now())
  @@index([organizationId, status])
}

// ───────── Ticketing & registration ─────────
model TicketType {
  id          String  @id @default(cuid())
  event       Event   @relation(fields: [eventId], references: [id])
  eventId     String
  name        String              // Early bird, General, VIP, Student…
  priceMinor  Int     @default(0) // 0 = free
  currency    String  @default("USD")
  quantity    Int?                // null = unlimited
  sold        Int     @default(0)
  salesStart  DateTime?
  salesEnd    DateTime?
  hidden      Boolean @default(false)
  sortOrder   Int     @default(0)
}

model PromoCode {
  id        String @id @default(cuid())
  eventId   String
  code      String
  kind      String   // PERCENT | AMOUNT | FREE
  value     Int
  maxUses   Int?
  used      Int      @default(0)
  @@unique([eventId, code])
}

enum OrderStatus { PENDING PAID REFUNDED FAILED }

model Order {
  id            String  @id @default(cuid())
  event         Event   @relation(fields: [eventId], references: [id])
  eventId       String
  buyerEmail    String
  buyerName     String?
  status        OrderStatus @default(PENDING)
  subtotalMinor Int
  feeMinor      Int     @default(0)
  totalMinor    Int
  currency      String
  provider      String? // stripe | paystack | flutterwave | mpesa
  providerRef   String?
  registrations Registration[]
  refunds       Refund[]
  createdAt     DateTime @default(now())
}

enum RegStatus { REGISTERED CHECKED_IN CANCELED WAITLISTED }

model Registration {                 // = one attendee on one event
  id            String  @id @default(cuid())
  event         Event   @relation(fields: [eventId], references: [id])
  eventId       String
  order         Order?  @relation(fields: [orderId], references: [id])
  orderId       String?
  ticketType    TicketType? @relation(fields: [ticketTypeId], references: [id])
  ticketTypeId  String?
  // attendee identity (lightweight; attendees need not be platform Users)
  attendeeName  String
  attendeeEmail String
  photoUrl      String?
  fieldValues   Json?     // answers to custom registration fields
  status        RegStatus @default(REGISTERED)
  ticketCode    String   @unique     // QR payload / wallet pass id
  generatedCard GeneratedCard?
  checkIn       CheckIn?
  createdAt     DateTime @default(now())
  @@index([eventId, status])
  @@index([attendeeEmail])
}

model CheckIn {
  id             String @id @default(cuid())
  registration   Registration @relation(fields: [registrationId], references: [id])
  registrationId String @unique
  event          Event  @relation(fields: [eventId], references: [id])
  eventId        String
  scannedBy      String?    // membershipId / userId
  scannedAt      DateTime @default(now())
  gate           String?
}

// ───────── The Karta Card ─────────
model CardTemplate {
  id             String  @id @default(cuid())
  organization   Organization @relation(fields: [organizationId], references: [id])
  organizationId String
  event          Event?  @relation(fields: [eventId], references: [id])
  eventId        String?
  name           String              // "Attendee", "Speaker", "Sponsor" (variants)
  canvas         Json                // { w, h, background, texture }
  elements       Json                // [{id,type:text|photo|qr|select|static|shape,
                                      //   x,y,w,h, fieldKey, style:{font,weight,size,
                                      //   align,transform,color,...}, label, placeholder}]
  isPublished    Boolean @default(false)
  generatedCards GeneratedCard[]
  createdAt      DateTime @default(now())
}

model GeneratedCard {
  id             String @id @default(cuid())
  template       CardTemplate @relation(fields: [templateId], references: [id])
  templateId     String
  registration   Registration @relation(fields: [registrationId], references: [id])
  registrationId String @unique
  imageUrl       String?   // rendered PNG in object storage
  status         String  @default("PENDING") // PENDING | READY | FAILED
  shareCount     Int     @default(0)
  shares         Json?   // [{platform, at}]
  createdAt      DateTime @default(now())
}

// ───────── Programme ─────────
model Track   { id String @id @default(cuid()) eventId String name String color String? sortOrder Int @default(0) }
model Speaker {
  id String @id @default(cuid())
  event Event @relation(fields:[eventId],references:[id]) eventId String
  userId String?            // optional link to a User (speaker portal login)
  name String role String? company String? bio String? photoUrl String?
  socials Json? featured Boolean @default(false)
  sessions SessionSpeaker[]
}
model Session2 {            // "Session" name avoided (Auth Session)
  id String @id @default(cuid())
  event Event @relation(fields:[eventId],references:[id]) eventId String
  trackId String? title String description String?
  startsAt DateTime? endsAt DateTime? room String?
  status String @default("CONFIRMED")
  speakers SessionSpeaker[]
  savedBy String[]          // registrationIds who added to personal agenda
}
model SessionSpeaker { sessionId String speakerId String @@id([sessionId, speakerId]) }

// ───────── Engagement (Pro/Studio gated) ─────────
model Connection { id String @id @default(cuid()) eventId String fromRegId String toRegId String status String @default("PENDING") createdAt DateTime @default(now()) }
model Message    { id String @id @default(cuid()) eventId String fromRegId String toRegId String body String createdAt DateTime @default(now()) }
model Question   { id String @id @default(cuid()) sessionId String eventId String regId String? body String votes Int @default(0) status String @default("LIVE") }
model Poll       { id String @id @default(cuid()) sessionId String question String options Json isLive Boolean @default(true) }
model PollVote   { id String @id @default(cuid()) pollId String regId String optionIndex Int @@unique([pollId, regId]) }
model PointsLedger { id String @id @default(cuid()) eventId String regId String points Int reason String createdAt DateTime @default(now()) }

// ───────── Partners (Studio) ─────────
model Sponsor { id String @id @default(cuid()) eventId String name String tier String logoUrl String? booth String? description String? leads Lead[] }
model Lead    { id String @id @default(cuid()) sponsorId String regId String interest String? createdAt DateTime @default(now()) }

// ───────── Communications ─────────
model EmailTemplate {
  id String @id @default(cuid()) organizationId String eventId String?
  type String        // CONFIRMATION | REMINDER | AGENDA_UPDATE | POST_EVENT | TICKET
  subject String preheader String? blocks Json   // ordered blocks incl. ticket/card/agenda
  automated Boolean @default(false)
}
model EmailCampaign {
  id String @id @default(cuid()) eventId String templateId String?
  subject String segment Json? status String @default("DRAFT") // DRAFT|SCHEDULED|SENT
  scheduledAt DateTime? sentCount Int @default(0) openRate Float? createdAt DateTime @default(now())
}

// ───────── Platform: developer, ops, analytics ─────────
model ApiKey   { id String @id @default(cuid()) organizationId String name String prefix String hashedKey String scope String lastUsedAt DateTime? createdAt DateTime @default(now()) revokedAt DateTime? }
model Webhook  { id String @id @default(cuid()) organizationId String url String events String[] secret String status String @default("ACTIVE") }
model AnalyticsEvent { id String @id @default(cuid()) organizationId String eventId String? name String props Json? at DateTime @default(now()) @@index([eventId, name, at]) }
model AuditLog { id String @id @default(cuid()) organizationId String? actorId String? action String target String? ip String? at DateTime @default(now()) }
model ModerationReport { id String @id @default(cuid()) kind String targetId String reason String severity String status String @default("OPEN") createdAt DateTime @default(now()) }
model SupportTicket { id String @id @default(cuid()) organizationId String? subject String body String priority String status String @default("OPEN") channel String assigneeId String? createdAt DateTime @default(now()) }
model Payout  { id String @id @default(cuid()) organizationId String eventId String amountMinor Int currency String method String status String reference String? createdAt DateTime @default(now()) }
model Refund  { id String @id @default(cuid()) orderId String amountMinor Int reason String status String @default("PENDING") createdAt DateTime @default(now()) }
model FeatureFlag { id String @id @default(cuid()) key String @unique description String? env String rolloutPct Int @default(0) enabled Boolean @default(false) }
model Notification { id String @id @default(cuid()) userId String type String body String readAt DateTime? createdAt DateTime @default(now()) }

// ───────── Auth (Auth.js) ─────────
model Session { id String @id @default(cuid()) userId String token String @unique expires DateTime }
model VerificationToken { identifier String token String @unique expires DateTime }
```

### Relationship summary
- **Organization 1—N Membership N—1 User** (RBAC join). Org **1—1 Subscription**.
- **Organization 1—N Event**. Event **1—N** TicketType, Registration, Order, Track, Session2, Speaker, Sponsor, CardTemplate, CheckIn.
- **Order 1—N Registration** (one purchase can register several attendees). **Registration 1—1 GeneratedCard 1 CheckIn**.
- **CardTemplate 1—N GeneratedCard** (template instantiated per attendee).
- **Session2 N—N Speaker** via SessionSpeaker. Connections/Messages/Questions/Polls reference `registrationId` (the per-event attendee identity).
- **Sponsor 1—N Lead** (Lead → Registration).

---

## 4. RBAC & multi-tenancy (enforce everywhere)

- **Platform roles:** `User.isPlatformAdmin` → unlocks the **Operator console** (Admin + Operations nav). Everyone else only sees their org.
- **Org roles** (`Membership.role`): `OWNER` (billing + everything), `ADMIN` (everything except billing/delete-org), `EDITOR` (assigned events only — `eventScope`), `CHECKIN_STAFF` (scan only, assigned events), `VIEWER` (read-only).
- **Rule:** every query is filtered by `organizationId` derived from the session's active membership — never from client input. If Supabase: add **RLS policies** keyed on `auth.uid()` → membership. The lock pills/gating in the UI are **UX only**; enforce limits + roles server-side.

---

## 5. Plan gating (server-enforced + UI hints)

| Capability | Free | Pro | Studio |
|---|---|---|---|
| Active events | 1 | ∞ | ∞ |
| Registrations | 50 total | 500/mo | ∞ |
| Agenda, speakers | — | ✓ | ✓ |
| Networking, 1:1 messaging | — | ✓ | ✓ |
| Live Q&A, polls, gamification | — | — | ✓ |
| Sponsor tools, virtual | — | — | ✓ |
| Remove card watermark | — | ✓ | ✓ |
| AI matchmaking, API, webhooks, white-label, team seats | — | partial | ✓ |
| Karta Card (every attendee) | ✓ | ✓ | ✓ |

Implement as a single `can(org, feature)` helper backed by `Plan` + `FeatureFlag`. Block at the API layer; the UI already shows lock pills + the upgrade slide-over.

---

## 6. Core domain logic & invariants

**Registration / checkout**
1. Attendee opens `/e/[slug]` → picks ticket → fills form (custom `fieldValues`) → optional photo upload → pays (if priced).
2. On payment success (webhook): create `Order(PAID)` + `Registration(REGISTERED)` with a unique `ticketCode`; increment `TicketType.sold`; enqueue **card generation** + **confirmation email**.
3. Enforce: capacity, sales window, `sold < quantity`, plan registration caps, promo validity. Free tickets skip payment.
4. Idempotency: dedupe on payment-provider event id; unique `ticketCode`.

**Check-in:** scan `ticketCode` → upsert `CheckIn` (idempotent), flip `Registration.status = CHECKED_IN`, award gamification points, push realtime update to the dashboard feed. Must work offline → queue scans locally, sync on reconnect.

**Plans:** downgrade keeps existing data live (read-only beyond new limits); new registrations honor the new cap. Cards live forever.

---

## 7. The Karta Card pipeline (the differentiator — build carefully)

1. **Design (Studio):** organizer composes a `CardTemplate` — `canvas` + `elements[]`. Element types: `text` (static), `field` (bound to a registration field via `fieldKey`, e.g. name/role), `photo` (attendee photo or initials fallback), `qr` (ticketCode), `select`, `shape`. Each carries position + full typography/style. Variants = multiple templates per event (Attendee/Speaker/Sponsor/VIP). Save versions; `isPublished` gates live use.
2. **Generate (per registration):** on register, resolve the matching variant, merge `fieldValues` + `photoUrl` + QR into the template, render to **PNG** (and optional MP4 for Studio). Use a server renderer: **Satori (HTML→SVG) + resvg/sharp (SVG→PNG)** or headless Chromium (Playwright) against a hidden React render of the card. Store in object storage → `GeneratedCard.imageUrl`, status `READY`.
3. **Deliver & share:** show in the reveal screen + confirmation email + attendee wallet. Share buttons deep-link to socials; track `shareCount`/`shares` for the virality analytics. Free plan stamps a watermark; Pro/Studio remove it.
4. **Scale:** generation is a **background job** (queue), not inline with the HTTP request — return "generating…" then notify when ready. Cache renders; regenerate only on template change or field edit.

The prototype card visuals (forest gradient, gold ring, guilloché texture, QR) in `studio/` and `attendee/att-ui.jsx` (`KartaCard`) define the exact look — port them as the render template.

---

## 8. Public API (Developer feature, Studio plan)

`/api/v1` authenticated by `ApiKey` (Bearer). Resources: `events`, `tickets`, `registrations`, `checkins`, `cards`, `analytics`. Webhooks fire on: `registration.created`, `order.paid`, `checkin.completed`, `card.shared`, `payout.processed` — signed with `Webhook.secret`, with retries + delivery log (see Webhooks page). Rate-limit per key.

---

## 9. User-journey flows (system actions)

**Organizer (first run):** Sign up → Onboarding (event type → org + brand kit → first event → invite team) → Dashboard. Brand kit seeds `Organization.brandKit` and the default `CardTemplate`.

**Organizer (run an event):** Create event → design Event Page → add TicketTypes → build Agenda/Speakers → design Karta Card in Studio → publish (`status=LIVE`, page goes live at `/e/[slug]`) → registrations flow in → run Check-in on the day → watch Analytics → send Communications.

**Attendee:** Discover (`/directory` or `/e/[slug]`) → register + pay → **card generated → reveal/share** → receive confirmation email → use attendee app (`/a`): wallet/QR, schedule + personal agenda, networking + messaging, live Q&A/polls, sponsors, feedback.

**Speaker:** Invited → `/speaker/[eventId]` → complete profile, confirm sessions, upload slides, share speaker card.

**Operator (Karta staff):** `isPlatformAdmin` → Operations console: moderation queue, support tickets, finance/payouts, refunds/disputes, plans & feature flags, system health, audit log.

---

## 10. Integrations & infra

> **Philosophy: integrate, don't rebuild.** Anything that's complex to build but high-value — and already solved well by an external service — should be a **connectable integration the organizer opts into from their account**, not custom code. The in-app **Integrations hub** (`screens-developer.jsx → IntegrationsPage`) is the pattern: categorized catalog, per-service Connect/Disconnect (OAuth), connection state. Build the OAuth/connection framework once; add providers as catalog entries. Lead with: payments (Stripe/Flutterwave/Paystack/M-Pesa), comms (Slack, Twilio SMS, Intercom, Mailchimp), CRM/marketing (HubSpot, Salesforce, GA, Meta Pixel), automation (Zapier, Webhooks, Google Calendar, Notion), streaming (Zoom, YouTube Live). Each is a third-party API/SDK, not a from-scratch build.

- **Payments:** Stripe (cards, subscriptions) + **Paystack/Flutterwave** (African cards) + **M-Pesa/MTN MoMo** (mobile money). Abstract behind a `PaymentProvider` interface; route by org region/currency. Platform takes a service fee on tickets; organizer payouts via `Payout`.
- **Email:** Resend or Postmark. Transactional (confirmation/reminder/ticket) from `EmailTemplate`; campaigns from `EmailCampaign`. Render the branded templates (see `emails/`).
- **Storage:** Cloudflare R2 / S3 — cover images, logos, attendee photos, generated cards. Signed upload URLs.
- **Realtime:** check-in feed, live Q&A/polls, networking — Pusher/Ably or Supabase Realtime.
- **Queues/jobs:** card generation, email sends, payout processing, webhook delivery, analytics rollups — Upstash QStash / BullMQ.
- **Search:** directory + help — Postgres FTS to start; Typesense/Algolia later.
- **Wallet:** Apple/Google Wallet passes from `ticketCode`.

---

## 11. Environment variables (minimum)

```
DATABASE_URL=                  NEXTAUTH_SECRET=   NEXTAUTH_URL=
STRIPE_SECRET_KEY=  STRIPE_WEBHOOK_SECRET=
PAYSTACK_SECRET_KEY=  FLUTTERWAVE_SECRET_KEY=
RESEND_API_KEY=  EMAIL_FROM=
R2_ACCOUNT_ID=  R2_ACCESS_KEY_ID=  R2_SECRET_ACCESS_KEY=  R2_BUCKET=
UPSTASH_REDIS_REST_URL=  UPSTASH_REDIS_REST_TOKEN=
PUSHER_APP_ID=  PUSHER_KEY=  PUSHER_SECRET=
GOOGLE_CLIENT_ID=  GOOGLE_CLIENT_SECRET=   (OAuth, optional)
```

---

## 12. Security & compliance
- Tenant isolation on every query; RLS if Supabase. Validate all input (Zod). 
- Hash passwords (argon2/bcrypt); API keys stored hashed (show once). 
- PCI: never touch raw card data — use provider-hosted fields. 
- GDPR/data rights: export + delete per org/attendee (Settings already designed). 
- Rate-limit auth, registration, API. Audit-log sensitive actions (`AuditLog`).

---

## 13. Go-live plan (milestones)

**M1 — Foundation (day 1 morning):** Next.js app + design system port (Tailwind config + `packages/ui` from prototypes) · Prisma schema + migrate · Auth.js (email + Google) · Organization + Membership + onboarding wizard.

**M2 — Event spine:** Event CRUD + public Event Page (`/e/[slug]`) · TicketTypes · Registration + checkout (Stripe first) · confirmation email.

**M3 — Karta Card:** Studio template editor (load/save `CardTemplate`) · card render job · reveal + share + storage. *(This is the moat — don't cut it.)*

**M4 — Day-of:** QR check-in (online + offline) · live dashboard stats/analytics events. **← shippable MVP for a real event.**

**M5 — Engagement:** agenda/speakers, attendee app, networking, Q&A/polls (plan-gated).

**M6 — Scale/ops:** sponsors, communications campaigns, public API/webhooks, operator console (moderation/finance/refunds/flags/health), white-label, additional payment providers.

Day-one launch = **M1–M4**. Everything else is already designed and can be layered without rework because the schema anticipates it.

---

## 14. Prototype → implementation mapping

- **Design tokens / components:** copy the Tailwind `theme.extend` block + the icon set (`icons.jsx`) and shared primitives (`dashboard/dash-ui.jsx`, `attendee/att-ui.jsx`) into `packages/ui`. Keep class names — they're production-ready.
- **Routing/IA:** `dashboard/data.jsx` (`PLATFORM_NAV`, `EVENT_NAV`, `EVENT_CARDS`, plan logic) is the literal nav map → route structure. `dashboard/app.jsx` shows the context-aware shell (platform ↔ event) + plan/role gating to replicate with `usePathname()` + session.
- **Each screen** in the prototypes = one page/component; the mock data arrays mark exactly which fields each view needs (map them to the Prisma models above). **Strip prototype-only devices:** the demo plan/role switcher, the "show empty state" toggle, and all hardcoded mock arrays.
- **Studio** element schema → `CardTemplate.elements` JSON. **Email designer** blocks → `EmailTemplate.blocks` JSON.

---

## 15. Seed data (for dev + demo)
Seed: 1 org (Pro) + owner user; 1 platform-admin user; the "Africa Tech Festival 2026" event with 4 ticket types, ~250 registrations (varied check-in/card states), 3 tracks + ~12 sessions + 8 speakers, 9 sponsors, 1 published Attendee + Speaker card template, a handful of Q&A/poll rows, and the 5 email templates. This makes every prototype screen light up with real data immediately.

---

### Final notes for Claude Code
- Build **M1–M4 first, vertically** (one working path beats ten half-features). 
- Treat the prototypes as the design contract — match them; don't redesign. 
- Keep everything **org-scoped and plan-gated** from day one so scaling/monetization isn't a retrofit. 
- **States are part of the contract.** Each data view has explicit **loading** (skeleton shimmer — `Skeleton`/`SkeletonPage`/`useLoaded`), **empty** (`EmptyState`), and **error** (`ErrorState`, retry) states in the prototypes — replicate them per page (Registrations is the worked example). All modal forms use **controlled inputs with required/email validation** (`TextInput`/`TextArea` + `FormModal`) — wire these to real mutations.
- The Karta Card pipeline is the product's signature — give it real engineering love.
