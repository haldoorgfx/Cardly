# Dashboard Redesign & Reorganization — Blueprint (Step 0)

Date: 2026-07-05
Goal: fix the *information architecture*, not just the pixels. Group what belongs
together, surface what's buried, give Home a real command center, and make every
page use one layout. No features removed. Approve this, then I build it in batches.

My design calls are opinionated on purpose — you asked me to decide what's best.

---

## The 6 problems (your critique, confirmed live)

1. **Home is empty** — it's just 3 router cards. First thing users see, and it says nothing.
2. **Event tools are buried** — attendee tools (agenda, networking, Q&A…) hide inside a per-ticket "Event tools" pill. They're important and should be first-class.
3. **Inconsistent page layouts** — some pages left-aligned max-width, some centered with pill tabs, different box sizes. Reads as different apps.
4. **Admin feels bolted-on** — it's forced into the sidebar but behaves like a separate route.
5. **Flat nav** — one long list, no categories/collapse, hard to scan.
6. **Things scattered** — related tools separated; similar tools duplicated.

---

## Decision 1 — Navigation: two-level, collapsible, grouped by INTENT

Replace the flat list with clear collapsible sections. Icons + section headers.

```
Home                         ← command center (always)

ATTENDING                    ← collapsible group
  My Events                  ← (replaces "My tickets") each event = a hub
  My Cards
  Saved
  Discover

ORGANIZING                   ← collapsible group (shown if you run events)
  Events
  Analytics
  Brand Kit
  Team
  Templates

SPEAKING / SPONSORING        ← each shown only if you have that role
  Speaking
  Sponsoring

ADMIN                        ← collapsible, visually separated (shown to admins)
  Platform Stats
  Accounts
  Revenue
  Activity Log

────────────
Settings · Plan · Sign out   ← pinned bottom
```

Why: groups by what you're *trying to do* (attend / organize / administer), collapses
noise, and makes Admin a deliberate section instead of a bolted-on list. Sections remember
open/closed state (localStorage). Only groups you have a role for appear.

## Decision 2 — "My Events" replaces "My tickets" (attendee hub)

**My Events** = a list of events you're attending. Each row opens an **event hub** with
everything for that event as first-class sections — not hidden in a pill:

```
[Event cover]  AI Ethics Webinar
  Ticket & QR  ·  Eventera Card  ·  Agenda  ·  Connect  ·  Live  ·  Feedback
```

- **Ticket & QR** — your ticket, door QR, transfer.
- **Eventera Card** — your card for this event (pulls from My Cards, scoped to the event).
- **Agenda** — sessions you saved + browse schedule.
- **Connect** — merged: Networking + Messages + Community (they overlap today; one place to meet people).
- **Live** — merged: Q&A + Polls + Leaderboard (things that happen during sessions).
- **Feedback** — post-event.

This regroups 8 scattered tabs into 5 meaningful ones and pulls them OUT of the ticket.
"My Cards" and "Saved" stay as their own top-level lists too (cross-event views).

## Decision 3 — Home becomes a role-aware command center

Home leads with what matters, weighted to how you actually use Eventera (organizer-heavy):

```
Home — "Everything you run and attend, at a glance"

┌ Portfolio stats ──────────────────────────────┐   ← organizer (you)
│ 25 events · 64 registrations · $16,836 · 41%   │
└────────────────────────────────────────────────┘
┌ Needs attention ─────────┐ ┌ Quick actions ────┐
│ unpublished / no-reg      │ │ + Create event    │
│ events (live list)        │ │ Registrations     │
└───────────────────────────┘ │ Check-in scanner  │
┌ Attending next ──────────┐ └───────────────────┘
│ your upcoming events +    │ ┌ Recent activity ──┐
│ cards (attendee side)     │ │ latest regs/sales │
└───────────────────────────┘ └───────────────────┘
```

- Pure attendees see "Attending next" + cards first; organizer blocks hide.
- Reuses data already computed on `/dashboard` (stats) + `/home` role flags — no new backend.

## Decision 4 — One page layout everywhere

Every dashboard page uses `PageShell` (left-aligned, consistent max-width + gutters) +
`PageHeader`. Kills the centered pill-tab pages and the size/box drift. The attendee
event-hub tabs move from centered pills to the same left-aligned `SegmentedTabs` used
elsewhere. One rhythm, one container, one header — across attend, organize, admin.

## Decision 5 — Admin: deliberate, not bolted-on

Keep admin in the shell (so you don't lose context) but as its own collapsed section
with a subtle divider and label, and every admin page uses the same PageShell/PageHeader
as the rest so it stops "feeling like a different route."

## Decision 6 — Consolidations (things that should be together)

- Event tools: 8 tabs → 5 (Agenda / Connect / Live / Feedback / + Ticket&Card). (Decision 2)
- "My tickets" + per-event tools → one **My Events** hub. (Decision 2)
- Nav grouped so related destinations sit together. (Decision 1)
- Nothing deleted — every current page still reachable, just placed sensibly.

---

## Build order (safe batches — you build + push each)

1. **Nav rebuild** — collapsible grouped sidebar in AppShell (no route changes yet). Ship, verify nothing breaks.
2. **Home command center** — rebuild `/home` with stats + needs-attention + attending + quick actions.
3. **My Events hub** — rename/retarget My tickets → My Events; event hub page with first-class sections; keep old routes redirecting.
4. **Event-tools regroup** — merge networking/messages/community → Connect; Q&A/polls/leaderboard → Live; move tabs to left-aligned layout.
5. **Layout pass** — force every remaining dashboard page onto PageShell/PageHeader (fix centered/left drift).
6. **Admin polish** — section divider + PageShell on admin pages.

Each batch: I make edits + esbuild-verify structure, you run `pnpm build` + push, we
check it live before the next. This is a live app — batches keep it safe.

---

## What I need from you
Approve this blueprint, or tell me what to change (e.g., "don't merge Q&A and polls",
or "Home should lead with attending, not organizing"). Once you say go, I start with
Batch 1 (nav).
