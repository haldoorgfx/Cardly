# Paste this to Claude Code (run inside the `cardly/` repo)

---

You are working **inside the existing `cardly/` repo** — the live **Eventera** event-management platform (Next.js 14 App Router + TypeScript + Supabase + Tailwind v3 + shadcn on web; a Flutter app in `eventera_mobile/`). Your job is to implement an **8-group platform expansion** across web **and** mobile, **all in one pass**, fully functional end-to-end, blended into the existing system with **zero conflicts**. This is purely additive — do not redesign or remove anything that exists.

**Design contract (match exactly):** `handoff/Eventera Expansion — Design Spec.html` — a pannable canvas of 35 labeled artboards.
**Full spec (follow precisely):** `handoff/EVENTERA_EXPANSION_HANDOFF.md` — routes, components, migrations, RPCs, states, acceptance criteria.

**Non-negotiables:**
- **Do not change the stack or add any dependency.** Extend existing routes, components, tables, RPCs **in place** — no `-v2` forks.
- **Brand = Eventera.** No "Karta" in new UI.
- **Exactly two fonts: Plus Jakarta Sans (headings) + Inter (everything else). NO monospace anywhere** — no JetBrains Mono / DM Sans / `font-mono`. Enforce in `tailwind.config.ts`.
- **Only the existing color tokens** (forest/cream/gold — from `BRAND.md`/`tailwind.config.ts`). Invent no colors.
- **Server-authoritative:** all entitlement redemption / validity-window / limit / plan / role checks run in Supabase RPC + RLS. UI gating is cosmetic. Model new RPCs on `058_checkin_rpc` / `064_checkin_by_id`; new migrations start at `065_` with RLS scoped by owner/org/event-staff.
- **Every screen ships loading + empty + error states.** **Dark theme only on camera/scanner screens.** Realtime screens (redemption dashboard, broadcasts, scanners) update live via Supabase channels.

**The 8 groups:** (1) Entitlements engine — many independently-scannable entitlements per attendee, each with its own validity window + redemption limit, own scanner mode, live redemption dashboard; (2) Offline check-in + reconciliation with two-device conflict resolution; (3) WhatsApp Business — templates, journey automation builder, previews, broadcasts; (4) Cash door sales + per-staff & organizer reconciliation; (5) Multi-day events — per-day check-in/capacity/entitlements, day selector on scanner, attendance grid; (6) Dietary & accessibility — calm capture, catering counts, respectful accessibility summary, dietary pill on meal scan **(shown only when the scanned entitlement is a Meal — never on entry/shuttle/merch)**; (7) Add to calendar; (8) Entitlement management & edge cases — migration notice for existing events, per-attendee grant/revoke/un-redeem/extend, un-redeem-with-reason, transfer, and a full audit log backed by an append-only ledger.

**Deliver:**
1. First, read `handoff/EVENTERA_EXPANSION_HANDOFF.md` in full, skim `CLAUDE.md`, `BRAND.md`, `tailwind.config.ts`, `supabase/migrations/`, `components/{tickets,check-in,registration,events}`, `lib/{notifications,payments,registration,integrations,email,qr}`, and `eventera_mobile/lib/screens/organizer/checkin_scanner_screen.dart`.
2. Then implement **all 8 groups** end-to-end in the vertical order in §7 of the handoff (migrations → G1 → G5 → G2 → G6 → G4 → G3+G7 → G8 → states/realtime pass) — web (Next.js) and mobile (Flutter) both.
3. Keep every existing flow working. Anything where a design truly conflicts with working code: flag it, don't silently rewrite.

Build it all, wire it all — it must work from end to end.
