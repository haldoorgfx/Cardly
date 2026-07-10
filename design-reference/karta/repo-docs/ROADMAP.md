# ROADMAP.md — Karta Platform Build

Tick through this top to bottom. Build **vertically, one milestone at a time**, on the existing Cardly stack (Next 14 + Supabase + Tailwind + shadcn — no new deps, no fork). **STOP for human review at the end of each milestone.** Source of truth: `CLAUDE.md`, `BRAND.md`, `KARTA_IMPLEMENTATION_BRIEF.md`, prototypes in `design-reference/karta/`.

Acceptance bar for every task: matches the prototype layout; colors from `BRAND.md`; responsive; loading/empty/error states + validated forms where data is involved; no console errors; existing flows still pass.

---

## Milestone 0 — Safety & setup
- [ ] Commit current state; create branch `karta-platform`.
- [ ] Replace root `CLAUDE.md` + `BRAND.md` with the new versions; add `KARTA_IMPLEMENTATION_BRIEF.md`.
- [ ] Place prototypes at `design-reference/karta/`.
- [ ] `pnpm dev` runs clean on the branch before any change.

## Milestone A — Reposition & shell  *(STOP for review)*
- [ ] Rename **Cardly → Karta** across code, copy, metadata/OG, footer; watermark → "Made with Karta".
- [ ] Purge retired tokens (`#6c63ff`, `#f8a4d8`, `#fafafa`, `#e5e5ea`) and confirm Tailwind matches `BRAND.md`.
- [ ] Marketing **landing** from `site/` (platform hero + product shot + Karta Card differentiator).
- [ ] **Pricing** Free $0 / Pro $19 / Studio $49.
- [ ] Marketing **nav + footer** (platform links).
- [ ] Dashboard **app shell**: sidebar (sectioned, context-aware), topbar (⌘K search, notifications, avatar), off-canvas drawer < lg.
- [ ] **Plan lock pills** + upgrade slide-over (cosmetic; gating enforced later server-side).
- [ ] **Acceptance:** landing + pricing + dashboard shell match prototypes; editor/render/auth/payments untouched.

## Milestone B — Organizer core  *(STOP)*
- [ ] Migrations: `organizations`, `organization_members` (roles), extend `events` with `organization_id` + platform fields; **RLS** on all.
- [ ] Server-side **org scoping** + role checks helper in `lib/`.
- [ ] **Onboarding wizard** (org → brand → first event).
- [ ] **Dashboard events home** (empty + populated states).
- [ ] **Event overview** + tab scaffold: registration, tickets, agenda, speakers, check-in, networking, Q&A/polls, sponsors, analytics, card, settings (wire to existing `components/*`).
- [ ] **Tickets**: `ticket_types` CRUD (free/paid, windows, promo, hidden).
- [ ] **Acceptance:** a user creates an org + event, adds ticket types, sees the event shell; everything org-scoped.

## Milestone C — Attendee + the Karta Card  *(STOP)*
- [ ] Public **event directory** (`(public)/events`) + **public event page** (`(public)/e/[slug]`).
- [ ] **Registration flow** (`c/[slug]`): ticket → details + photo → payment (Stripe/Paystack/Flutterwave) → confirm.
- [ ] **Karta Card reveal**: server `sharp` render of `zones`, gold glow + share/download; watermark on free tier. (Port Studio/editor — reskin only.)
- [ ] Migrations: `registrations`, `orders`, reuse `generated_cards`.
- [ ] Attendee app surfaces: schedule/my-agenda, wallet/QR ticket.
- [ ] **Acceptance:** end-to-end — organizer publishes → attendee registers → pays → gets + shares card. Test at 375px.

## Milestone D — Engagement, ops & integrations  *(STOP)*
- [ ] Migrations: `sessions`, `speakers`, `session_speakers`, `sponsors`, `connections`, `messages`, `questions`, `polls`, `poll_votes`, points/badges.
- [ ] **Agenda builder** + **speakers** + **sessions**; **check-in** QR scanner (offline-tolerant).
- [ ] **Networking** (+ AI matchmaking for Studio), **Q&A/polls**, **sponsors/leads**, **analytics** (funnel/donut/bars).
- [ ] **Operator console** (`app/admin/*`): moderation, support, finance, refunds, plans & flags, system health, users, audit — stateful actions.
- [ ] **Integrations hub** (connect-your-account: Stripe/Paystack/Flutterwave, Slack, Zapier, Mailchimp, Google, Zoom…). Integrate, don't rebuild.
- [ ] **Speaker portal**; **email templates** (Resend) from `emails/`.
- [ ] **Plan + role enforcement server-side** across all gated features.
- [ ] **Acceptance:** full event lifecycle + ops + integrations live; limits enforced; multi-tenant RLS verified.

## Launch
- [ ] States/empty/error pass on every page; mobile pass.
- [ ] `.env` set (DB, auth, Stripe/Paystack/Flutterwave, Resend, storage); RLS reviewed; seed/demo org.
- [ ] Deploy to Vercel; smoke-test signup → event → registration → card → check-in.

---

**Rules:** one branch per milestone · migrations → UI → wire → states · don't pass a STOP gate without review · flag prototype/code conflicts, don't silently rewrite · never switch the stack.
