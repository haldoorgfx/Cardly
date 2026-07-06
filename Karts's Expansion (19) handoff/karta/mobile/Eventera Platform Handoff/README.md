# Eventera — Platform Build Handoff

One product. One app for the people at the event (attendees, speakers, sponsors, staff), one app for the people running it (organizers), and one web control plane behind both. This package is the brief for building all of it.

## What's here

| File | What it's for |
|---|---|
| **`01_CLAUDE_CODE_BRIEF.md`** | **The message to paste into Claude Code.** Vision, the parallel agent/team plan, tech stack, milestones, acceptance criteria. Start here. |
| `02_ROLES_AND_ACCESS.md` | The role & access-control model. Who sees what. The single most important correctness spec — every screen is gated by it. |
| `03_SCREEN_INVENTORY.md` | Every designed screen mapped to a feature, a role, and the HTML mock it came from. Your build checklist. |
| `04_DATA_MODEL_AND_API.md` | Entities, relationships, REST + realtime surface, and how mobile ↔ web stay in sync. |
| `design/` | The approved hi-fi mocks (open in a browser) + the design tokens (`karta.css`, `mobile.css`). Pixel/behavior source of truth. |

## The three surfaces

1. **Eventera (mobile) — Attend side.** Already designed. Discover → register → attend. Speaker & Sponsor sections are *layered onto* this same app and unlocked by role — not a second app.
2. **Eventera (mobile) — Organize side.** Event-day command center. Check-in, QR scan, validation, walk-ins, live stats. Same login, a mode switch.
3. **eventera.so (web) — Admin.** The heavy lifting: event setup, ticketing, agenda, comms, payouts, analytics, white-label. Mobile links out to it for anything configuration-heavy.

They are **one system** with one identity, one data model, one realtime layer. Build them so a change on the door (a check-in) shows up on the web dashboard in real time, and a speaker added on the web unlocks Speaker tools on that person's phone.

## How to run the build
Read `01_CLAUDE_CODE_BRIEF.md` — it tells you how to split the work across parallel agent teams and in what order to land it.
