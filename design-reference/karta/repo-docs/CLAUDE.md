# CLAUDE.md — Karta Project

**Read this file fully at the start of every session before writing any code.**

---

## What Karta Is

Karta is a **full event-management SaaS platform**. Organizers run an entire event on it — public event page, registration & ticketing, agenda, speakers, check-in, attendee networking, live Q&A/polls, sponsors, and analytics — and **every attendee leaves with a personalized "Karta Card"** to share on social. The card is the **signature differentiator**, not the whole product.

**Positioning:** the all-in-one platform (vs Eventbrite/Whova) where registration ends in a shareable moment, not just a confirmation email. Built mobile-first and Africa-first (WhatsApp-native, local payments), but global.

**Two product surfaces + ops:**
- **Organizer dashboard** — create & run events end to end.
- **Attendee experience** — discover, register, get the Karta Card, live event app.
- **Operator/super-admin console** — moderation, support, finance, plans/flags, system health.
- **Card Studio** — the canvas editor for the Karta Card (the old "Cardly" editor — ported, not rebuilt).

> This was formerly **Cardly** (a card-only tool). We are evolving the SAME codebase into the platform. Rename Cardly → **Karta** everywhere; watermark is "Made with Karta". Keep the card editor/render pipeline — it becomes the Card Studio feature.

---

## Design Handoff

New high-fidelity prototypes live in **`design-reference/karta/`** — **the source of truth for LAYOUT, STRUCTURE, SPACING, TYPE, COMPONENTS, FLOWS.** Folders:
`site/` (marketing landing + pricing) · `directory/` (public event browse) · `support/` (help/status/changelog/legal) · `dashboard/` (organizer **+** operator console + auth) · `onboarding/` · `studio/` (Card Studio) · `emails/` · `speaker/` · `attendee/` (full attendee app) · `index.html` (hub).

**Rules:** Read the prototype files directly; match layout/spacing/type/components exactly, no reinterpretation. Pull **all colors from BRAND.md** (prototypes already use the correct forest/cream/gold tokens). Ignore any legacy purple/pink. The retired 13 `cardly-handoff` HTML files are superseded — do not use them.

---

## Brand System (summary — BRAND.md wins)
Forest + cream + gold, editorial/African-modern/premium. `primary #1F4D3A`, `primary-dark #163828`, `primary-soft #E8EFEB`, `accent #E8C57E`, `accent-dark #C9A45E`, `ink #0F1F18`, `ink-soft #3A4A42`, `muted #6B7A72`, `cream #FAF6EE`, `surface #FFFFFF`, `border #E5E0D4`. Success `#2D7A4F` · warning `#C97A2D` · danger `#B8423C` · info `#3A6B8C`. Type: DM Sans (display) · Inter (sans) · JetBrains Mono (mono). Brand tokens are theme-able via CSS vars (for organizer-themed public pages/cards). **Retired:** `#6c63ff`, `#f8a4d8`, `#fafafa`, `#e5e5ea`, all blue/teal, the "Cardly" name. Sources of truth: 1) BRAND.md 2) this summary 3) `tailwind.config.ts`.

---

## Tech Stack (LOCKED — no new dependencies, no conflicts)
- **Framework:** Next.js 14, App Router, TypeScript (strict)
- **Styling:** Tailwind CSS (v3) + shadcn/ui (button, input, card, dialog, dropdown-menu, tabs, badge, toast, avatar, sheet, table, select, switch, tooltip, popover)
- **DB + Auth + Storage:** **Supabase** (Postgres + Auth + Storage + **RLS**)
- **Image rendering:** `sharp` (server-side only, in API routes) — for Karta Card PNGs
- **Forms:** react-hook-form + zod
- **State:** React Context (global) + useState (local). No Redux/Zustand.
- **Payments:** Stripe + Paystack + Flutterwave (server SDKs/REST)
- **Email:** Resend · **QR:** server-side · **Deploy:** Vercel · **pnpm**

**Do not add:** Prisma, Auth.js/NextAuth, another DB/ORM, Tailwind v4, Redis, GraphQL, tRPC, any state-management or CSS-in-JS library, microservices. If a prototype implies one, express it with the stack above. **Switching the data/auth layer is the #1 way to create conflicts — never do it.**

---

## Project Structure (target)
```
app/
├── (marketing)/        page, pricing, how-it-works, use-cases, about, whats-new,
│                       help, status, privacy, terms, dmca, contact, blog, partners
├── (auth)/             login, signup, forgot-password, accept-invite
├── (app)/              ← organizer dashboard (auth + org-scoped)
│   ├── onboarding/                     org → brand → first event wizard
│   ├── dashboard/                      events home + context shell
│   ├── events/[id]/                    overview + tabs:
│   │     registration, tickets, agenda, speakers, check-in,
│   │     networking, qa, polls, sponsors, analytics, card (Studio), settings
│   ├── events/[id]/edit/               Card Studio (canvas editor)
│   ├── analytics, team, templates, brand, settings, speaker
├── (public)/           events/ (directory), e/[slug] (public event page)
├── c/[slug]/           attendee registration → Karta Card reveal → event app
├── admin/              ← operator console (super-admin):
│                       analytics, audit, billing, changelog, content, events,
│                       flags, media, templates, theme, users, moderation,
│                       support, finance, refunds, system
└── api/                events, registrations, tickets, sessions, speakers,
                        render (card PNG), qr, payments, webhooks, billing,
                        teams, keys, admin, v1 (public API), upload, report
components/  ui · shared · marketing · app · events · registration · editor(studio)
             · check-in · networking · qa · polls · sponsors · analytics · admin · cms
lib/         supabase · auth · events · registration · payments · billing · render
             · qr · email · teams · matchmaking · templates · theme · flags · audit
             · api-keys · webhooks · utils
```

---

## Database (Supabase) — extend the existing schema, never replace it
Existing: `profiles`, `events`, `generated_cards`. **Add** (new `supabase/migrations/` files, all with RLS):
- `organizations` (id, name, slug, plan `free|pro|studio`, brand jsonb, created_by) and `organization_members` (org_id, user_id, role `owner|admin|editor|checkin_staff|viewer`).
- Extend `events` with `organization_id`, cover/theme, dates, venue, category, visibility, status.
- `ticket_types` (event_id, name, price, currency, quantity, sales window, hidden) · `orders` (buyer, amount, provider, status) · `registrations` (event_id, attendee fields jsonb, ticket_type_id, order_id, checked_in_at, card_id).
- `sessions` (event_id, title, day, start, duration, track, room) · `session_speakers` · `speakers` (event_id, name, role, org, bio, photo, featured).
- `sponsors` (event_id, name, tier, booth, leads) · `connections` (event_id, a_user, b_user, status) · `messages` (thread, sender, body) · `questions` (session_id, body, votes, status) · `polls` + `poll_votes` · `points`/`badges` (gamification).
- Platform/ops: `api_keys`, `webhooks` + `webhook_deliveries`, `audit_log`, `feature_flags`, `payouts`, `refunds`, `reports` (moderation), `changelog`.
- Reuse `generated_cards` as the Karta Card output table; keep `events.zones` jsonb + the zones shape for the Studio.

**RLS:** every row scoped by `organization_id` / owner; members access by role; public can read `published` events by slug and `insert` registrations/cards. **Enforce plan limits and roles server-side** — UI lock pills are cosmetic.

---

## Plans
- **Free — $0:** 1 event, 50 registrations, Karta Card (with "Made with Karta" watermark), QR check-in, basic page.
- **Pro — $19/mo:** unlimited events, 500 regs/mo, full agenda, speakers, networking + 1:1 messaging, remove watermark, email, basic analytics.
- **Studio — $49/mo:** unlimited regs, AI matchmaking, live Q&A/polls, gamification, sponsor tools, multiple brand kits, 3 team seats, API access, white-label, priority support.

---

## Build Order (vertical, review-gated — do not skip ahead)

### Milestone A — Reposition & shell  *(STOP for review)*
Rewrite this file's framing in code/comments; rename Cardly→Karta + watermark; marketing landing + pricing + nav/footer from `site/`; app shell (sidebar/topbar, context-aware nav, ⌘K, plan lock pills + upgrade slide-over).

### Milestone B — Organizer core  *(STOP)*
`organizations` + members + RLS migrations; onboarding wizard; dashboard events home; event overview + tabs wired to existing `components/{events,registration,…}`; tickets + ticket types.

### Milestone C — Attendee + the Karta Card  *(STOP)*
Public event page + directory; registration → payment → **Karta Card reveal** (keep `sharp` render + zones + Studio); attendee app surfaces (schedule, wallet/QR). End-to-end test.

### Milestone D — Engagement, ops & integrations  *(STOP)*
Networking, Q&A/polls, sponsors, check-in scanner, analytics; operator console (moderation/support/finance/refunds/flags/system); integrations hub; speaker portal; email templates.

Each milestone: **migrations → UI → wire → states (loading/empty/error)**. One branch per milestone.

---

## Critical Rules
1. **Same stack, in place.** No new deps; edit behind existing routes; no parallel `-v2`. Switching DB/auth = forbidden.
2. **Multi-tenant + RLS from day one.** Scope every query by org; enforce roles + plan limits server-side.
3. **Match prototype LAYOUT exactly; colors from BRAND.md.** No UI from memory.
4. **Port the Card Studio editor, don't rewrite.** Keep drag/resize/zoom, 800ms debounced autosave, `zones` jsonb, undo/redo. Re-skin only.
5. **Server-side card render only** (`sharp` in API). Never html2canvas. Watermark "Made with Karta" on free tier.
6. **Integrate, don't rebuild.** Payments, email, CRM, automation, streaming, analytics = connectable third-party integrations the user opts into (Integrations hub), not custom builds.
7. **Mobile is non-negotiable.** Everything responsive; attendee flows test at 375px; tap targets ≥ 48px.
8. **States are part of the contract.** Loading skeletons, empty states, error+retry, validated forms — on every data view.
9. **TypeScript strict.** Type DB rows, zones, API req/res.
10. **Don't run ahead of the Build Order without review at each STOP.** If a prototype conflicts with working code, flag it — don't silently rewrite.

---

## Definition of Done
- Existing flow still works: sign up → create event → Card Studio → publish → attendee personalizes → downloads card.
- Organizer can run a full event: tickets, agenda, speakers, check-in, networking, analytics.
- Attendee gets the platform experience (discover → register → Karta Card → live app).
- Operator console + integrations + plans/billing live. Multi-tenant with RLS. Deployed on Vercel. Responsive throughout.

---

## Communication Style with the Human
The human (Abdalla) is a designer, not a backend engineer. Be direct, no corporate language. Show code, then 1–2 lines explaining it. If something will take >30 min or risks breaking working features, **ask first**. At an architectural fork, give 2 options max + a recommendation. Don't ask permission for routine choices. If a request conflicts with this file, say so before complying.

---

## Things That Will Break the Build (do not do)
- Adding any dependency not in Tech Stack; switching DB/auth/ORM; Tailwind v4; Pages Router.
- Browser-based image rendering (html2canvas/dom-to-image).
- Rewriting the canvas editor or render pipeline instead of porting/reskinning.
- Building UI from memory instead of the `design-reference/karta/` prototypes.
- Using retired colors (`#6c63ff`, `#f8a4d8`, `#fafafa`, `#e5e5ea`) or the "Cardly" name.
- Skipping RLS / org-scoping / server-side plan + role enforcement.
- Running past a STOP gate without human review.
