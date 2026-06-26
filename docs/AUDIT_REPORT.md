# EVENTERA — FULL CODEBASE AUDIT REPORT
Date: 2026-06-26
Audited by: Claude (read-only audit, no source modified)
Reference: `docs/EVENTERA_PRD.md` v1.0

---

## Executive Summary

Eventera is a large, genuinely impressive full-stack event-management platform — far beyond the original "Eventera Card" MVP. The codebase contains **176 page routes, 147 API routes, 186 components, 49 SQL migrations, and ~50 lib modules**, and it implements essentially every feature in the PRD (F01–F20): events, ticketing, registration/checkout, the signature card, agenda/sessions, speakers, networking, live engagement, check-in, sponsors/exhibitors, analytics, ERA AI, admin panel, teams, and white-label. Code hygiene is good: TypeScript `strict` is on, there are **zero `console.log` and zero TODO/FIXME** left in `app/lib/components`, and RLS is broadly applied (57 `ENABLE ROW LEVEL SECURITY` statements, ~88 policies across ~63 tables).

The platform is **not broken structurally, but it is not launch-ready.** The blockers are operational rather than architectural: three database migrations (041/042/043) are unapplied and *will throw 500s at runtime* (the brand-rename migration 043 is explicitly required), the ERA AI key is absent from the environment, the old domain `karta.cre8so.com` is still hardcoded across user-facing strings and emails, and payment providers are unconfigured/test-mode. Note also that `CLAUDE.md` in the repo root describes the *old, narrow MVP scope* and is now stale relative to the PRD — the PRD is the correct blueprint.

> ⚠️ **Verification caveat:** `node_modules` is not installed in the audited workspace (even `next` is absent), so I could not run `pnpm build`, `pnpm audit`, or execute the app. All findings are from static reading of source, migrations, config, and env-key presence. Build-passing and live-mode payment claims must be re-verified in a real environment.

---

## Critical Issues (must fix before launch)

1. **Unapplied migrations 041 → 042 → 043 cause runtime 500s.** `supabase/pending_migrations_to_run.sql` states this directly: until 043 runs, the app reads `eventera_card_url` / `eventera_card_zone_data` columns that don't exist; 042 is needed so refunds/status changes stop failing a check constraint; 041 expands form field types. There is no migration-tracking table visible, so applied state is unknown and must be confirmed against production Supabase.
2. **ERA AI is unconfigured.** `lib/ai/era.ts` instantiates Gemini with `process.env.GOOGLE_AI_KEY!` (non-null asserted), but `GOOGLE_AI_KEY` is **not** present in `.env.local`. Every ERA call will fail. Separately, `app/api/events/[id]/copilot/route.ts` uses Anthropic (`ANTHROPIC_API_KEY`), so there are now **two** AI providers — the PRD only documents Gemini.
3. **Domain migration incomplete — `karta.cre8so.com` hardcoded in user-facing text and emails.** Appears in marketing footers, print/PDF footers ("Generated with Eventera · karta.cre8so.com"), the API base URL shown to developers (`https://karta.cre8so.com/api/v1`), the white-label CNAME target, and DMCA contact emails (`dmca@karta.cre8so.com`). Marketing feature pages also show a third stale domain `app.karta.co`.
4. **Payments cannot be verified / not configured.** No `STRIPE_*`, `FLUTTERWAVE_*`, `WAAFIPAY_*`, or `UPSTASH_*` keys in `.env.local`. PRD lists payments as "test mode, needs live verification." A third processor — **Waafipay (Somali mobile money)** — exists in code (`lib/payments/waafipay.ts`, `api/payments/waafipay*`) but is **not in the PRD**, so the PRD payment section is out of date.
5. **Build not verified.** With `node_modules` absent and `@google/generative-ai` declared in `package.json` but not installed here, a clean `pnpm install && pnpm build` must be run and confirmed green before launch (PRD launch checklist item #1).

---

## Important Issues (fix soon)

6. **Heavy service-role usage bypasses RLS.** ~247 files in `app/lib` reference `createAdminClient()` / service role. RLS is well-defined, but if most reads/writes go through the admin client, security depends almost entirely on **manual per-route guards**, not RLS. With 147 API routes this is a large, hard-to-verify surface. Spot-audit the most sensitive routes (admin, billing, registrations, exports) for explicit auth/role checks.
7. **Public-route allowlist in `middleware.ts` looks incomplete.** Whitelisted public prefixes are `/c/`, `/e/`, `/exhibitor/`, `/events`, `/`, `/pricing`, `/whats-new`, `/auth`, `/api/`. But PRD-public routes such as `/discover`, `/search`, `/o/[userId]` (organizer profiles), `/s/`, `/x/`, `/my-tickets`, `/saved`, `/events/cities` are **not** listed — depending on `updateSession`, unauthenticated visitors may be redirected to login on pages that should be public. Verify each renders for logged-out users.
8. **Stale `CLAUDE.md` / handoff docs.** Root `CLAUDE.md` still describes the old single-feature "Cardly" MVP (forbids Redis, teams, marketplace, etc. — all of which now exist). This actively misleads any future Claude Code session. It should be replaced/regenerated from the PRD.
9. **REST API v1 is essentially absent.** PRD Part 11 lists a full `/api/v1/*` surface (events, registrations, check-in, sessions, speakers, analytics). Only `app/api/v1/render/route.ts` exists. API keys + webhooks infrastructure is built, but there's nothing for keys to call.
10. **WhatsApp notifications not built.** PRD flags this as critical for the Africa market; only email (Resend) exists. Expected, but still a launch gap for the target market.
11. **Encoding/mojibake in marketing copy.** e.g. `Made in Djibouti ðŸ‡©ðŸ‡¯` in `about/page.tsx` — the flag emoji is double-encoded. Sweep for `Ã`/`ð` artifacts.
12. **`.clone` and `.claire` directories** are present in the repo root (PRD known gap #9) and should be gitignored.

---

## Minor Issues (nice to have)

13. **`flutterwave-node-v3` appears unused** — 0 imports in `app/lib/components` (a custom `lib/payments/flutterwave.ts` is used instead). Candidate for removal.
14. **~43 `: any` annotations** across `app/lib/components`. Strict mode is on, so these are deliberate escapes; worth tightening over time, especially in API response shapes.
15. **Sentry config files** — PRD notes a deprecation/rename pending (`sentry.client.config.ts` → instrumentation client). Low priority.
16. **Offline check-in** is claimed but unverified — needs a real device/network test.
17. **`tsconfig.tsbuildinfo` (3.4 MB) is committed** — should be gitignored.

---

## Route Inventory (summary)

Counts: **176 pages, 147 API routes, 11 layouts**, plus loading/error/not-found boundaries throughout. Full file lists were enumerated during the audit; grouped by route group:

| Group | Path prefix | Auth | Purpose | Status |
|---|---|---|---|---|
| Marketing | `app/(marketing)/` | No | Landing, pricing, about, how-it-works, use-cases, 10 feature pages, blog, careers, contact, help, status, partners, terms, privacy, dmca, whats-new | Working (brand/domain strings stale) |
| Auth | `app/(auth)/` | No | login, signup, signup/check-email, forgot-password | Working |
| Auth callback | `app/auth/callback` | No | OAuth/magic-link callback | Working |
| Organizer app | `app/(app)/` | Yes | dashboard, analytics, brand, templates, team, settings (billing, api-keys, developer, integrations, white-label, webhooks, reset-password), onboarding, studio, notifications | Working |
| Event workspace | `app/(app)/events/[id]/` | Yes | ~55 sub-routes: overview, event-page, tickets, registrations, agenda, sessions, speakers, sponsors, check-in (+kiosk/walk-in), analytics, source-analytics, promo-codes, promoter-links, waitlist, communications, engagement, q-and-a, polls, community, newsfeed, photos, gamification, meetings, networking, revenue, orders, reports, downloads, badges, embed, series, staff, approvals, abstracts, virtual, live, copilot, edit (Card Studio), publish, setup, settings | Built (Card Studio depends on migration 043) |
| Public event | `app/(public)/e/[slug]/` | No | event page, register (+checkout/confirm/group), schedule, speakers, people, q-and-a, polls, community, my-agenda, messages, leaderboard, feedback, cfp, apply, waitlist, workshops, sessions, speed-networking, lead-scanner, leads, check-in, sponsors | Built |
| Marketplace/public | `app/(public)/` | No (intended) | discover (+categories/cities), events (search/city/category/cities/series), o/[userId] organizer profiles, s/ speaker, x/ sponsor, my-tickets (+transfer), saved, account (login/profile/setup/following/notifications), search | Built — **verify middleware lets these load logged-out (see #7)** |
| Card (signature) | `app/c/[slug]` | No | public personalized card, variant, card/[cardId] | Built (needs 043) |
| Exhibitor portal | `app/exhibitor/[token]/` | Token | booth, leads, resources, team | Built |
| Admin | `app/admin/` | Role | users, events, analytics, audit, changelog, content CMS, media, theme, flags, billing, templates, collections | Built |
| API | `app/api/` | Mixed | 147 routes: events/*, era/* (7), payments/* (stripe/flutterwave/waafipay/webhooks), billing/*, admin/*, teams/*, exhibitor/*, keys/*, webhooks/*, render, qr, notifications, account/*, sessions/*, speakers/*, sponsors/* | Built — auth enforced per-route (see #6) |

---

## Component Inventory (summary)

186 components across 25 domains. Largest groups: `events/` (59), `cms/` (23), `discovery/` (13), `editor/` (8 — Card Studio), `marketing/` (11), `registration/` (11), `ui/` (11 — shadcn primitives). Others: account, admin, ai, analytics, app, abstracts, check-in, exhibitor, messaging, networking, polls, qa, sessions, settings, shared, speaker, studio, tickets. No components live loose at the root — all namespaced by domain (good).

---

## Feature Status (PRD F01–F20)

Legend: ✅ built · 🟡 partial/unverified · ❌ missing

- **F01 Authentication** — ✅ email+password, ✅ password reset (`forgot-password` + `settings/reset-password`), ✅ email verification (`signup/check-email`), ✅ role system (middleware enforces super_admin/admin), 🟡 Google OAuth / magic link (callback route exists; provider config unverified).
- **F02 Event Management** — ✅ create (`events/new`, `api/events/create` + `create-basic`), ✅ edit, ✅ publish/unpublish, ✅ duplicate (`api/events/[id]/duplicate`), ✅ categories, ✅ series/recurring, ✅ templates.
- **F03 Tickets** — ✅ multiple types, ✅ free + paid, ✅ promo codes, ✅ promoter codes, ✅ waitlist, ✅ capacity, ✅ group/bulk (`031_ticketing_depth`).
- **F04 Registration & Checkout** — ✅ form (custom fields, `041` field types), ✅ Stripe, ✅ Flutterwave, ✅ Waafipay (extra), ✅ confirmation, ✅ QR (`lib/qr`, `api/qr`).
- **F05 Eventera Card** — ✅ auto-generation (`api/render`, `api/v1/render`), ✅ Card Studio editor (`events/[id]/edit`, `components/editor`), ✅ download/public card (`/c/[slug]`), ✅ badges/print. **Depends on migration 043.**
- **F06 Agenda & Sessions** — ✅ sessions, tracks, rooms, booking, ✅ personal agenda (`my-agenda`), ✅ ratings (`020`, `021`).
- **F07 Speakers** — ✅ CRUD, ✅ session assignment (`session_speakers`), ✅ speaker portal (`s/[slug]/[speakerId]`).
- **F08 Networking** — ✅ profiles, ✅ connections, ✅ messaging (threads), ✅ AI matchmaking (`era/match-attendees`, `lib/matchmaking`, `022_match_suggestions`), ✅ meetings/speed-networking.
- **F09 Live Engagement** — ✅ Q&A, ✅ polls, ✅ community threads, ✅ newsfeed, ✅ photo wall (`037`), ✅ gamification/leaderboard.
- **F10 Check-in** — ✅ QR scanner (`@zxing/browser`), ✅ kiosk, ✅ walk-in, ✅ session-level (`019`), 🟡 offline (claimed, untested).
- **F11 Sponsors/Exhibitor** — ✅ sponsors, tiers, ✅ exhibitor portal (token), ✅ lead retrieval/scanner, ✅ CSV export (`api/export-data`, `events/[id]/export`).
- **F12 Virtual/Hybrid** — 🟡 virtual page, watch embed, live page exist; depth unverified.
- **F13 Analytics** — ✅ per-event, ✅ source tracking (`api/view`, UTM), ✅ portfolio (`app/analytics`), ✅ admin platform analytics.
- **F14 Communications** — ✅ email (Resend, `lib/email`, `lib/registration/email`), ✅ campaigns (`communicate`), ✅ notifications, ❌ WhatsApp (planned).
- **F15 Marketplace/Discovery** — ✅ discover feed, categories, cities, search, organizer profiles, follows, saved, my-tickets (more complete than PRD's "partial"). Verify public access (#7).
- **F16 ERA AI** — ✅ `lib/ai/era.ts`, ✅ `lib/ai/gate.ts`, ✅ 7 `api/era/*` routes, ✅ UI (`components/ai`). **Non-functional without `GOOGLE_AI_KEY` (#2).**
- **F17 Developer/API** — 🟡 API keys (`lib/api-keys`, scoped+hashed) ✅, webhooks (HMAC, `lib/webhooks`) ✅, but **`/api/v1/*` only implements `render`** — the documented v1 surface is missing.
- **F18 White-Label** — ✅ settings + `api/white-label` + `white_label_settings`; CNAME target still `karta.cre8so.com` (#3).
- **F19 Admin Panel** — ✅ users (suspend/delete/role/impersonate), analytics, events, audit log, changelog, theme CMS, feature flags, content pages, media, billing, templates.
- **F20 Teams** — ✅ teams, invites, members, per-event staff roles (`036_event_staff`, `008_teams`).

**Net:** ~17 of 20 feature areas fully built; gaps are WhatsApp (F14), full REST API v1 (F17), and some virtual-event/offline depth — plus AI/payment/migration configuration.

---

## Brand Issues (Step 4)

- ✅ **No `Karta` (capitalized product name) or `Cardly` strings** remain in `app/components/lib` — the product-name rename is effectively complete.
- ❌ **Domain `karta.cre8so.com` still hardcoded** in user-facing strings/emails. Representative hits:
  - `app/(app)/events/[id]/promoter-links/page.tsx:50` — fallback `'https://karta.cre8so.com'`
  - `app/(app)/events/[id]/revenue/print/page.tsx:151` & `roster/print/page.tsx:145` — PDF footer
  - `app/(app)/settings/DeveloperTab.tsx:63` — `BASE_URL = 'https://karta.cre8so.com/api/v1'`
  - `app/(app)/settings/WhiteLabelTab.tsx:207` — CNAME target
  - `app/(marketing)/about/page.tsx:12,843` — canonical URL + footer (plus mojibake flag)
  - `app/(marketing)/dmca/page.tsx:46,47,60,61` — `dmca@karta.cre8so.com`
  - `app/(marketing)/features/*` — `karta.cre8so.com/...` and `app.karta.co/...` in mockups
- **Metadata (Step 4B):** `app/layout.tsx` title/description/OG should be confirmed to say "Eventera" and use the final domain (canonical URLs currently point at `karta.cre8so.com`).
- **Email templates (Step 4C):** `lib/email` and `lib/registration/email` should be confirmed to use Eventera branding and a non-`karta.cre8so.com` from/links; `RESEND_FROM_EMAIL` must point at a verified Eventera domain.

---

## Schema Issues (Step 5)

- **Migrations:** 49 files, `001`–`045`. Two `002_*` and three `010_*`/`011_*` prefixes are duplicated (`002_add_event_variants` + `002c_brand_kit`; `010_api_keys_webhooks` + `010_attendee_accounts` + `010c_logo_variants`; `011_discovery_columns` + `011_logo_light_url`). Idempotent but the numbering collision makes ordering ambiguous — fine if already applied, risky for fresh setups.
- **Pending/unapplied:** `041`, `042`, `043` per `pending_migrations_to_run.sql` (Critical #1). PRD also flagged `003_roles_and_rls` as possibly unapplied — confirm.
- **RLS coverage:** Strong — **57 `ENABLE ROW LEVEL SECURITY`** statements and **~88 `CREATE POLICY`** across ~63 tables. (An earlier case-sensitive count of "4" was a false alarm.) Recommend a one-time query against production to confirm every table has `rowsecurity = true`.
- **Tables vs PRD:** All core PRD tables present (profiles, events, ticket_types, registrations, attendee_accounts, sessions, speakers, sponsors, connections→`attendee_connections`, messages, session_questions→`qa_questions`, session_polls→`polls`, api_keys, webhooks) plus many beyond the PRD (cms_*, feature_flags, teams, abstracts, call_for_papers, leaderboard_points, promoter_codes, event_staff, etc.). The PRD schema section is a subset of reality.
- **Indexes:** ~73 `CREATE INDEX` statements incl. a dedicated `015_hot_indexes`. Good coverage; confirm presence on `event_id`, `user_id`, `status`, `slug`, `starts_at`.
- **FK/cascade:** FKs defined throughout; `028_validation_constraints` and `042` add check constraints. Cascade-delete behavior on junction tables should be spot-checked.

---

## Dependency Issues (Step 6)

- **Not installed in this workspace** — `node_modules` absent (`next`, `stripe`, `@google/generative-ai` all missing). Cannot run `pnpm audit` / `pnpm build` here.
- **Likely unused:** `flutterwave-node-v3` (0 imports; custom `lib/payments/flutterwave.ts` used instead).
- **Two AI SDKs:** `@google/generative-ai` (ERA) and `@anthropic-ai/sdk` (copilot) — intentional? PRD documents only Gemini. Decide on one or document both.
- **Duplicate-functionality watch:** three payment integrations (Stripe, Flutterwave, Waafipay) — intentional regional split, not a bug, but a lot of surface to maintain/test.
- **Critical package currency** (from `package.json`, versions not runtime-verified): `next@14.2.35`, `react@^18`, `@supabase/supabase-js@^2.105`, `@supabase/ssr@^0.10.3`, `stripe@^17.7`, `typescript@^5` — all reasonable for the stated stack; `next 14` is intentional per PRD (not 15).

---

## Code Quality Issues (Step 7)

- **Consistency:** API routes and Supabase client usage follow consistent patterns (`createClient()` server/browser, `createAdminClient()` for service role). Good.
- **Dead code / TODOs:** **0 TODO/FIXME**, **0 `console.log`** in `app/lib/components`. **32 `console.error`** (appropriate). Clean.
- **`any` usage:** ~43 occurrences — minor under strict mode.
- **Loading/error states:** broad coverage — many `loading.tsx`/`error.tsx`/`not-found.tsx` boundaries present across route groups.
- **`tsconfig.tsbuildinfo`** committed (3.4 MB) — gitignore it.

---

## What's Working Well

1. **Breadth and completeness** — nearly the entire PRD (F01–F20) is actually implemented, not stubbed. This is a serious, full platform.
2. **Clean code hygiene** — strict TypeScript, zero stray `console.log`/TODO, consistent client/route patterns, namespaced components.
3. **Strong security scaffolding** — middleware does rate-limiting + session refresh + suspension + admin-role gating; RLS is broadly enabled with ~88 policies; API keys are hashed/scoped; webhooks are HMAC-signed.
4. **Thoughtful regionalization** — Stripe + Flutterwave + Waafipay covers international, pan-African, and Somali mobile-money payments; Africa-first is real in the code.
5. **Good migration discipline** — 49 versioned migrations, dedicated hot-index and validation-constraint migrations, idempotent pending-migration batch with clear warnings.
