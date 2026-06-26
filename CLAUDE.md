# CLAUDE.md — Eventera

**Read this file fully at the start of every session before writing any code.**

---

## What Eventera Is

Eventera is a full event management platform and marketplace. Organizers create and manage events of any type — conferences, NGO gatherings, corporate events, festivals. Attendees discover events in their city and register. The signature differentiator is the **Eventera Card**: a personalized, branded card auto-generated for every registered attendee. No other event platform does this.

**Stage:** Built, pre-launch. Live at `karta.cre8so.com` (pending migration to `eventera.so`).

**Primary markets:** Africa — Djibouti, Ethiopia, Kenya, Somalia, UAE. Globally available.

**Revenue model:**
- Free: $0 — 1 event, 50 registrations, Eventera watermark on cards
- Pro: $19/month — unlimited events, 500 registrations/month, full features
- Studio: $49/month — unlimited + ERA AI + API + white-label

---

## Tech Stack (locked)

- **Framework:** Next.js 14, App Router, TypeScript strict mode
- **Styling:** Tailwind CSS
- **UI primitives:** shadcn/ui (button, input, card, dialog, dropdown-menu, tabs, badge, toast, avatar)
- **Database + Auth + Storage:** Supabase (Postgres + RLS + Storage + Realtime)
- **Image rendering:** `sharp` (server-side, in API route only — never html2canvas)
- **PDF generation:** `pdf-lib` or `jsPDF` (server-side)
- **QR codes:** `qrcode` package (server-side)
- **Email:** Resend
- **Payments:** Stripe (international) + Flutterwave (Africa) + WaafiPay (Somalia/Djibouti)
- **AI (ERA):** Google Gemini Flash (`@google/generative-ai`) for ERA features; Claude (`@anthropic-ai/sdk`) for AI Copilot
- **Rate limiting:** Upstash Redis (optional — app works without it)
- **Forms:** react-hook-form + zod
- **State:** React Context for global, useState for local
- **Deployment:** Vercel
- **Package manager:** pnpm

**Do not add:** Redis beyond Upstash ratelimit, edge functions, microservices, GraphQL, tRPC, any state-management library, any CSS-in-JS library.

---

## Brand System

**Direction:** Forest + Cream. Editorial, African-modern, designer-grade.

**Colors:**
- Primary: `#1F4D3A` (deep forest green)
- Primary dark: `#163828`
- Primary soft: `#E8EFEB`
- Accent: `#E8C57E` (warm cream-gold — use sparingly)
- Ink: `#0F1F18` (text)
- Ink soft: `#3A4A42`
- Muted: `#6B7A72`
- Cream: `#FAF6EE` (app background)
- Surface: `#FFFFFF` (cards, modals, inputs)
- Border: `#E5E0D4` (warm beige)
- Danger: `#B8423C` / Warning: `#C97A2D` / Success: `#2D7A4F`

**Hero gradient:** `linear-gradient(135deg, #1F4D3A 0%, #2A6A50 60%, #E8C57E 100%)`

**Typography:**
- Display: DM Sans (headings, `letter-spacing: -0.02em`)
- Body/UI: Inter
- Mono: JetBrains Mono (numbers, IDs, labels)

**Never use:** `#6c63ff` (old purple), `#f8a4d8` (old pink), `#fafafa` (use cream), `#e5e5ea` (use warm border). No black heroes — use forest gradient.

**Anti-slop rules (enforced):** No glows, no card-gradients, no decorative mono text. See `BRAND.md` and `DESIGN.md` for the full system.

---

## Domain & Environment

The app domain is set via `NEXT_PUBLIC_APP_URL`. **Never hardcode domain strings in runtime code.** When the domain migrates from `karta.cre8so.com` to `eventera.so`, one env var change updates everything.

```env
NEXT_PUBLIC_APP_URL=https://karta.cre8so.com   # current; change to eventera.so when ready
```

All runtime references to the domain must use `process.env.NEXT_PUBLIC_APP_URL`.

---

## Project Structure

```
app/
├── (marketing)/          → Landing, pricing, feature pages, about, terms
├── (auth)/               → login, signup, password reset
├── (app)/                → Organizer dashboard (auth-required)
│   ├── dashboard/        → Events list + stats
│   ├── events/
│   │   ├── new/          → Event creation wizard
│   │   ├── [id]/         → Event overview + all tabs
│   │   │   ├── edit/     → Card Studio (canvas editor)
│   │   │   ├── publish/  → Publish & share
│   │   │   ├── tickets/  → Ticket management
│   │   │   ├── registrations/ → Attendee list
│   │   │   ├── agenda/   → Agenda builder
│   │   │   ├── speakers/ → Speaker management
│   │   │   ├── check-in/ → QR scanner
│   │   │   ├── analytics/→ Event analytics
│   │   │   └── ...
│   ├── settings/         → Account, billing, developer, white-label
│   ├── analytics/        → Portfolio analytics
│   └── admin/            → Platform admin (super_admin/admin only)
├── e/[slug]/             → Public event page (attendee-facing)
├── c/[slug]/             → Eventera Card attendee experience (legacy route)
├── o/[slug]/             → Organizer public profile
├── s/[slug]/             → Speaker public profile
├── x/[code]/             → Exhibitor portal (token-gated)
├── discover/             → Event discovery
├── my-tickets/           → Attendee ticket wallet
├── saved/                → Saved events
└── api/
    ├── events/           → CRUD + register, communicate, copilot
    ├── render/           → sharp-based Eventera Card PNG generation
    ├── payments/         → Stripe + Flutterwave + WaafiPay webhooks
    ├── upload/           → File upload
    ├── billing/          → Subscription management
    ├── calendar/         → ICS export
    ├── check-in/         → QR check-in
    └── ...

components/
├── ui/                   → shadcn primitives
├── editor/               → Card Studio canvas editor
├── events/               → Event page components
├── landing/              → Marketing page sections
├── marketing/            → Nav, footer
└── shared/               → Reusable cross-feature components

lib/
├── supabase/             → client + server + middleware helpers
├── ai/                   → ERA (era.ts, gate.ts) + copilot
├── billing/              → Plans, limits
├── email/                → Resend email templates
├── registration/         → Registration email helpers
├── ratelimit.ts          → Upstash rate limiting (no-op if unconfigured)
├── qr/                   → QR code generation
├── pdf/                  → PDF helpers
└── utils.ts

types/
└── database.ts           → Supabase-generated types
```

---

## Key Rules

1. **Domain references:** Always `process.env.NEXT_PUBLIC_APP_URL`. Never a hardcoded domain string.
2. **Image rendering:** Server-side `sharp` only. Never html2canvas, dom-to-image, or browser-based rendering.
3. **Mobile-first, always.** Every file touched must be mobile-responsive. Test critical flows at 375px.
4. **ERA AI fails gracefully.** Missing `GOOGLE_AI_KEY` → friendly fallback message, no crash. See `lib/ai/era.ts`.
5. **AI Copilot:** Check for `ANTHROPIC_API_KEY` before calling; return 503 if missing.
6. **Rate limiting:** `lib/ratelimit.ts` silently allows all requests if Upstash is unconfigured.
7. **TypeScript strict mode.** Type everything — zones, database rows, API request/response shapes.
8. **Auto-save in Card Studio:** 800ms debounce after last change. Keep undo/redo.
9. **Watermark logic:** "Made with Eventera" bottom-center, semi-transparent. Free tier output only.
10. **Slug format:** `lowercase-event-name-xxxx` (4-char random suffix).
11. **No premature optimization.** No caching layers, no SSG where SSR works fine.
12. **Unified modals:** All create/edit forms use centered modal popups. No side drawers, no inline cards.
13. **Brand consistency:** Never black heroes (use forest gradient). Shared nav/footer never change.
14. **No new libraries** beyond what's listed in Tech Stack.

---

## Build Commands

```bash
pnpm install          # install dependencies
pnpm dev              # local dev server
pnpm build            # production build (must pass zero errors)
pnpm lint             # ESLint
pnpm type-check       # tsc --noEmit
```

---

## Database Schema (summary)

Core tables: `profiles`, `events`, `ticket_types`, `registrations`, `sessions`, `speakers`, `sponsors`, `exhibitors`, `generated_cards`, `api_keys`, `webhooks`, `teams`, `team_members`, `cms_pages`, `changelog_entries`.

RLS is enforced on all tables. Users read/write their own rows. Public can read published events by slug. Public can insert registrations.

Migrations live in `supabase/migrations/`. Migrations 001–043 have been applied. **Do not re-run applied migrations.**

---

## Supabase

No `exec_sql` access from this environment. Abdalla pastes migration SQL directly into the Supabase SQL editor. Generate migration files; Abdalla applies them.

---

## AI Features (ERA)

ERA is Eventera's AI assistant, powered by Google Gemini Flash. Plan gating:
- Free: ERA locked
- Pro: improve description, FAQ bot, matchmaking, analytics narrator
- Studio: report generator, campaign writer, translator

Gate checks are in `lib/ai/gate.ts`. ERA implementation is in `lib/ai/era.ts`. Missing API key → graceful fallback, never a crash or raw error to users.

The AI Copilot (organizer chat assistant) uses Claude via `@anthropic-ai/sdk` at `app/api/events/[id]/copilot/route.ts`. It streams responses and is gated behind `ANTHROPIC_API_KEY`.

---

## Communication Style

Abdalla is a designer, not a backend engineer. When explaining:

- Be direct. No hedging. No corporate language.
- Show code, then 1–2 lines explaining what it does.
- If something will take >30 minutes or break working features, ask first.
- Present 2 options max at architectural forks, with a recommendation.
- Don't ask permission for routine implementation choices.
- If a request conflicts with this CLAUDE.md, point it out before complying.

---

## Things That Will Break the Build

- Hardcoding `karta.cre8so.com` or any domain in runtime TypeScript/TSX
- Using browser-based image rendering (html2canvas, dom-to-image)
- Switching to Pages Router
- Adding libraries not in the Tech Stack
- Using old colors (`#6c63ff`, `#f8a4d8`, `#fafafa`, `#e5e5ea`)
- Black hero sections (use forest gradient)
- Re-running already-applied migrations (001–043)
- Skipping mobile-responsive design on any screen
- Letting ERA or Copilot crash when API keys are missing
