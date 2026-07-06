# Eventera — Build Brief for Claude Code

> Paste this whole file to Claude Code as the kickoff prompt. It is written to be executed by **multiple parallel agent teams**. Read `02_ROLES_AND_ACCESS.md`, `03_SCREEN_INVENTORY.md`, and `04_DATA_MODEL_AND_API.md` alongside it; open everything in `design/` in a browser before writing code.

---

## 0. The one-paragraph brief

Build **Eventera**, an all-in-one event management platform. It has three surfaces that share one identity, one database, and one realtime layer: a **mobile app for people at events** (attendees, and — unlocked by role — speakers and sponsors), a **mobile app for people running events** (organizers and their staff), and a **web control plane** (`eventera.so`) for heavy configuration. A person is a single account that can hold several roles at once and see exactly — and only — what each role grants. The attendee experience already exists in design; you are (a) blending Speaker & Sponsor tooling seamlessly into it behind role checks, and (b) building the full organizer app, and (c) wiring both to the shared backend so the whole thing behaves as one connected product.

**Design is fixed.** The hi-fi mocks in `design/` are the source of truth for layout, spacing, type, color, and interaction. Do not redesign; implement. Tokens live in `design/karta.css` + `design/mobile.css` (forest `#1F4D3A`, gold `#E8C57E`, cream `#FAF6EE`, ink `#0F1F18`; DM Sans / Inter / JetBrains Mono; 8px card radius; 1px hairlines; gold used once per screen; every number in JetBrains Mono).

---

## 1. Non-negotiable principles

1. **One app, role-unlocked — not many apps.** At login the user picks *I'm attending* or *I'm organizing*; that chooses a **mode**, not an account. Within the Attend mode, Speaker and Sponsor sections appear only for users who hold those roles **at that event**. A person can be an attendee **and** a speaker **and** a sponsor at the same event simultaneously.
2. **Access control is server-authoritative.** The UI hides what a role can't use, but the **API enforces it**. Never trust the client. Every endpoint checks the caller's role for the specific event/session/booth in question. See `02_ROLES_AND_ACCESS.md` for the full matrix — treat it as acceptance criteria.
3. **Everything is connected & live.** A door scan, a walk-in registration, a lead capture, an announcement — all write to the shared store and propagate over the realtime layer to every other surface within ~1s. The web dashboard and the organizer's Live Stats reflect the same numbers the scanner produces.
4. **Mobile is on-site & light; web is heavy config.** If a screen in the mocks says "manage this on eventera.so," the mobile app deep-links out; it does not reimplement setup UI.
5. **Match the mocks exactly**, including loading skeletons, empty states, error states, dark camera theme for scanners, live indicators, and iOS safe areas.

---

## 2. Recommended stack (adjust if the repo already has a stance)

- **Mobile:** React Native + Expo (single binary, mode switch inside). TypeScript. React Navigation. Camera/QR via `expo-camera` + `expo-barcode-scanner`. Push via Expo Notifications.
- **Web admin:** Next.js (App Router) + TypeScript + the same design tokens ported to CSS variables / Tailwind theme.
- **Shared:** a `packages/` monorepo (pnpm/turborepo) with `@eventera/types` (zod schemas + TS types), `@eventera/api-client`, `@eventera/rbac` (the permission engine, used by BOTH client and server), and `@eventera/ui-tokens`.
- **Backend:** Node (NestJS or Fastify) + PostgreSQL + Prisma. Realtime via a managed pub/sub (Supabase Realtime, Ably, or a WS gateway). Redis for counters/rate-limit. S3-compatible object storage for photos/badges/exports.
- **Auth:** email OTP + Google OAuth (mocks show both). JWT access + refresh; role/permission claims resolved per-event server-side, never baked statically into the token.
- **Offline:** organizer scanner must queue scans locally (SQLite/MMKV) and sync on reconnect — the mocks include an Offline-mode toggle.

If the existing repo already picks a stack, conform to it; the architecture (shared RBAC engine, shared types, realtime) matters more than the specific libraries.

---

## 3. Split the work across parallel agent teams

Spin up the following teams to work **concurrently**. Each owns a vertical slice with a clear contract to the others. The contracts (types + RBAC + API shapes) are defined **first and once**, so everyone can build against stable interfaces in parallel.

### Team 0 — Foundations (must land the contracts before others go wide; then continues on infra)
- Monorepo, CI, lint/test, environments.
- `@eventera/types`: zod schemas for every entity in `04_DATA_MODEL_AND_API.md`.
- `@eventera/rbac`: the permission engine — `can(user, action, resource)` — driven by the matrix in `02_ROLES_AND_ACCESS.md`. **This package is imported by every other team**, client and server.
- `@eventera/ui-tokens`: ports `karta.css`/`mobile.css` to shared tokens + a base component kit (buttons, cards, chips, tags, inputs, avatars, tab bars, sheets, skeletons) matching the mocks.
- Auth service (OTP + Google), session, refresh, per-event claim resolution.
- Realtime gateway + the event bus contract (channel names, payloads).
- **Deliverable that unblocks everyone: published `types`, `rbac`, `ui-tokens`, and stub API endpoints returning typed fixtures.**

### Team A — Attendee core (mobile)
Owns the existing Attend experience end to end: Discover, event pages, ticketing/checkout, tickets wallet, Eventera Card, schedule/agenda, attendee directory & networking, session detail, feedback, account, onboarding/profile. Wire to real data + realtime. This is the substrate the next two teams layer onto.
- Mocks: `design/Eventera Attendee App.html`, `design/Eventera Onboarding.html`, plus the tickets/account/auth redesigns in `design/`.

### Team B — Speaker mode (mobile, layered onto Attend)
Implements the Speaker sections **inside** the attendee app, gated by the `speaker@event` role. **Coordinate tightly with Team A** — you render *within* the event hub, not in a separate shell.
- Speaker role badge on the event card + "Speaker tools" entry point (only rendered when `can(user,'view','speakerTools',event)`).
- My Sessions, Session detail with **live read-only Audience Q&A** (realtime, sorted by upvotes; empty & loading states), My Speaker Profile (light edit, deep-link to web for full), Green room / logistics.
- Mock: `design/Eventera Speaker & Sponsor.html` (SP01–SP06).

### Team C — Sponsor mode (mobile, layered onto Attend)
Implements Sponsor sections inside the attendee app, gated by `sponsor@event`. The workhorse is **Lead Retrieval**.
- Sponsor role badge + "Sponsor tools" entry point.
- My Booth (light edit), **Lead Retrieval QR scanner** (dark theme, gold brackets, scan line), Lead captured (note + hot/warm/cold), My Leads (search, export→web), Lead detail, Booth team & scan-access (revocable per teammate; shared lead pool).
- Mock: `design/Eventera Speaker & Sponsor.html` (SPO01–SPO07).

### Team D — Organizer app (mobile)
Builds the entire Organize mode: bottom nav **Events · Scan · Attendees · Stats · Profile**.
- My Events (live registered/checked-in counts), Event control hub (stat bar + big actions), **QR check-in scanner** (the key screen), scan results (success / already-checked-in / invalid), Attendee list (search + All/Checked-in/Pending filters), Manual check-in, Walk-in registration (register+check-in+card in one flow), Live Stats (realtime dashboard, chart, recent check-ins), **Staff limited view** (scanner + list only), Announcements/push, Session/room check-in, Staff & roles, Event settings (incl. offline mode, badge printing), Profile / mode switch.
- Mocks: `design/Eventera Organize.html` (O01–O16).

### Team E — Realtime & on-site services (backend)
- Check-in service (idempotent scans, double-scan detection, per-door attribution), lead service, announcement/push fan-out, live counters (Redis), offline scan reconciliation, badge-print job.
- Publishes the events the mobile apps subscribe to; guarantees the dashboard and Live Stats read the same source of truth.

### Team F — Web control plane (`eventera.so`)
- Event setup, ticket types & pricing, agenda/session builder, speaker & sponsor management (**assigning these roles here is what unlocks the mobile sections**), staff invitations, comms, orders/payouts, analytics, white-label. Reuses `04`'s API + the mocks under `design/` for the web side where present (`karta/screens/w*.html`, `d*.html`).

### Team G — QA / integration / release
- Cross-surface E2E: "assign speaker on web → tools appear on phone," "scan on door → count ticks on dashboard," "staff account cannot open Stats." Enforces the RBAC matrix as a test suite. Owns store builds & release.

**Coordination rule:** Teams B, C, D render against Team A's shells and Team E's realtime channels; all of them import Team 0's `rbac` + `types`. Land Team 0's contracts first (day 1–2), then everyone runs in parallel against the stubs, swapping stubs for real services as E and F deliver.

---

## 4. The seamless-blend requirement (Speaker & Sponsor into Attend)

This is the part most likely to go wrong, so it's spelled out:

- There is **one navigation shell** for Attend mode. Speaker/Sponsor tools are **sections reachable from the event hub**, not top-level tabs and not a separate app.
- On an event where the user holds an extra role, the **event card and event hub show a role pill** (Speaker / Sponsor) and a single **"Speaker tools" / "Sponsor tools"** entry card. Multiple roles → multiple pills + multiple entry cards, stacked. An attendee-only user sees none of this and the code paths never mount.
- Gate with one call: `can(user, 'view', 'speakerTools', event)` / `'sponsorTools'`. The entry point, the routes, and the API all check the same predicate.
- A user viewing their **own** attendee card, schedule, and networking is unchanged whether or not they're also a speaker. Roles **add**; they never remove or replace the attendee baseline.
- Data isolation: a speaker's read-only Q&A is scoped to *their* sessions; a sponsor's leads are scoped to *their* booth's pool; a sponsor teammate with revoked access loses scanner immediately (realtime permission change).

---

## 5. Milestones

1. **M0 — Contracts (day 1–2):** `types`, `rbac`, `ui-tokens`, auth, realtime gateway, stubbed API. Everyone unblocked.
2. **M1 — Attend core + Organizer check-in path:** register → get card → organizer scans → checked-in count moves live. The spine of the product working end to end.
3. **M2 — Speaker & Sponsor layered in; Organizer full feature set:** all mocks implemented behind RBAC; leads, announcements, live stats, staff view, walk-ins.
4. **M3 — Web control plane parity + white-label + payouts; offline & badge printing; full E2E RBAC suite green.**
5. **M4 — Hardening, store submission, load-test the door (peak concurrent scans).**

---

## 6. Definition of done (per screen)

- Matches the mock (layout, tokens, gold-once, mono numbers, safe areas).
- Loading skeleton + empty state + error state implemented where the mock shows them.
- Reads/writes real data; live-updating screens subscribe to realtime and reflect changes ≤1s.
- Every action authorized server-side against the RBAC matrix; unauthorized calls return 403 and are covered by a test.
- Works offline where specified (organizer scanner) and reconciles on reconnect.
- Accessible: 44px min hit targets, sufficient contrast, dynamic-type friendly.

Build it as one connected platform. When in doubt about who-sees-what, `02_ROLES_AND_ACCESS.md` wins.
