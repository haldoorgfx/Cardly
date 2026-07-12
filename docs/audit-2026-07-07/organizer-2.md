# Eventera — Organizer Journey QA Audit

Auditor role: merciless QA / real organizer. Repo: `suspicious-sutherland-534ac5`.
Web = Next.js (`app/`), Mobile = Flutter (`eventera_mobile/`). Verified against **live production**
Supabase as the test organizer `cabdalla005@gmail.com` (uid `c94e0432…`, plan = **studio**, 25 events).
Date: 2026-07-07. All prod queries were READ-ONLY.

---

## TL;DR — the mobile Organize side undercounts registrations, cannot approve guests, cannot do walk-ins, and lets Free users bypass every plan limit.

The newly-built mobile "Organize" experience is visually polished but has **three data-integrity bugs** that make its core numbers wrong, plus a **revenue-critical plan-limit bypass**. The scanner and manual check-in themselves work correctly against prod.

---

## Prioritized findings

| # | Sev | Area | File:line | What's broken | Fix | Verified how |
|---|-----|------|-----------|---------------|-----|--------------|
| 1 | **CRITICAL** | Plan limits / revenue | `eventera_mobile/lib/eventera_api.dart:88-173` (`createEvent`) vs `app/api/events/create/route.ts:17-20` | Mobile creates events by writing **directly to `events`** via the authed Supabase client. It never calls `canCreateEvent()`. That check lives ONLY in the Next.js API route; there is **no plan-aware RLS policy** on `events` insert (RLS only checks ownership). A **Free user (limit = 1 event) can create unlimited events from the phone.** Same class of bypass applies to any limit enforced only in an API route. | Enforce event-count in a `SECURITY DEFINER` RPC / RLS trigger the mobile insert must go through, OR route mobile create through `/api/events/create`. Don't trust the client. | Read both files. `lib/billing/can.ts:33-46` + `plans.ts:13` confirm `free.events=1`. Prod: profile is `studio` so the write path isn't gated for this user, but code path is unambiguous. |
| 2 | **HIGH** | Attendees / Stats counts | `supabase/070_fix_checkin_rpcs.sql:44` + `062_staff_attendee_list.sql:43` (`list_event_attendees` filters `status in ('confirmed','checked_in')`) | The RPC **silently drops** every `pending`, `pending_approval`, `cancelled`, `refunded` registration. The mobile Attendees tab, Stats "Registered" number, and Events-list card counts all read this RPC → **they undercount real registrations.** | Return all non-cancelled statuses (or add a status column and let the client group), and surface pending/pending_approval distinctly. | Prod: **Pan-African Youth Forum** has 14 raw regs (`{pending:1, checked_in:5, confirmed:6, pending_approval:2}`) but RPC returns **11**. **Nairobi Tech Summit 2026** has 3 `pending` → RPC returns **0** ("No one has registered yet"). |
| 3 | **HIGH** | Approvals unreachable on mobile | `list_event_attendees` (above) + no approvals UI in `eventera_mobile/lib/organize/**` | "Require approval" is a real checkout mode (`checkout_require_approval`, web `POST /api/registrations/[id]/approve`), producing `pending_approval` rows. Those rows are filtered out of the only attendee RPC mobile has, and there is **no approve/deny screen in the app at all.** An organizer running an approval-gated event **cannot approve anyone from mobile.** Luma & Eventbrite both approve/decline from the phone. | Add an "Awaiting approval" segment fed by a status-aware RPC + approve/deny actions calling the existing approve route/RPC. | Prod: Youth Forum has 2 `pending_approval` rows invisible to mobile. Web route confirmed at `app/api/registrations/[id]/approve/route.ts`. |
| 4 | **HIGH** | Day-of walk-ins | No walk-in path in `eventera_mobile/**` (grep for `walk.?in|onsite|manual regist` → 0 hits); web-only at `app/api/events/[id]/registrations/route.ts:47-141` | The scanner only checks in **existing** QR codes; the attendee tab only checks in **existing** rows. A walk-in with no prior registration **cannot be added on mobile**. The capability exists on the platform (web `POST .../registrations` with capacity check) but is unreachable from the Organize app — exactly where the organizer stands at the door. | Add "Add walk-in" that calls the existing manual-registration route/RPC (name + ticket type), then check them in. | Read scanner + attendee tab; grep; confirmed web route is the only add-attendee path. Benchmark: Eventbrite/Luma both register at the door. |
| 5 | **MED** | Mobile-created events are schedule-less & mis-filtered | `create_event_screen.dart` (no date/venue fields) + `eventera_api.dart:88-173` (never writes `event_pages`) + `models.dart:160-175` | The mobile create flow collects **only a name + card image** — no date, time, venue, capacity, or tickets. `event_pages.starts_at` is never set, so `isToday`/`daysUntil` are always false/null. Result: mobile-created events **never appear under "Live & upcoming" or "Today"**, never trigger the Attendees/Stats auto-select, and never show the "Live" pulse. Also can't be published meaningfully (no schedule for attendees). | Add date/venue (min) to create, write an `event_pages` row like the web route does (`app/api/events/create/route.ts:127`). | Read create screen + api + models. Prod events store date on `event_pages.starts_at` (confirmed: `event_pages` sample has `starts_at`). |
| 6 | **MED** | N+1 over-fetch of PII for counts | `eventera_mobile/lib/organize/event_counts.dart:17-31` | To render count strips, the Events tab calls `list_event_attendees` **once per event** (25 events → 25 RPCs), each returning the **full attendee row list** (names) just to `list.length`/count checked-in. Heavy, and pulls attendee PII for **draft** events with no reason. | Add a lightweight `event_counts(event_ids[])` RPC returning `{registered, checked_in}` aggregates only. | Read `event_counts.dart`; each card stat comes from `_counts[e.id]`. Prod: this user has 25 events → 25 parallel PII-returning RPCs on tab open. |
| 7 | **MED** | Misleading "Pending" filter label | `attendees_tab.dart:296` & `attendee_list_screen.dart:170` | The "Pending" segment counts `!checkedIn` **among confirmed attendees** (i.e. "not yet arrived"), but reads as "pending approval/registration." Combined with #2, the organizer sees "Pending · N" that excludes the people actually pending approval. Semantically wrong and confusing. | Rename to "Not arrived" / "Expected", and add a real approval segment (see #3). | Read both files: `_filter==2 → where(!checkedIn)`. |
| 8 | **LOW** | Realtime reload does nothing for pending | `stats_tab.dart:84-101` | The Stats realtime channel fires `_loadList` on **any** `registrations` change for the event, but because `list_event_attendees` drops pending rows, a brand-new (pending) registration triggers a reload that shows **no change** — looks like the live feed is broken. | Fix #2; then new registrations actually move the numbers. | Read `_subscribe`; the callback reloads a filtered RPC. |
| 9 | **LOW** | `checkin_registration_by_id` omits `checked_in_at` on success | `supabase/064_checkin_by_id.sql:75-77` | On `success` the by-id RPC returns no `checked_in_at` (only the QR-token RPC and the `already_checked_in` branch do). Mobile falls back to `DateTime.now()` — usually fine but the displayed "in at HH:MM" is client-clock, not server truth. | Add `'checked_in_at', now()` to the success payload, matching the QR RPC. | Read migration 064 vs 070's `checkin_registration`. |
| 10 | **LOW** | Scan picker only offers published events, silently | `organize_shell.dart:56-57` | `_openScan` filters to published events and, if none, treats it as "no events." An organizer with only **draft** events that they want to test-scan gets pushed toward "create an event" instead of a clear "publish first" message. Minor, but the fallback `scannable = published.isNotEmpty ? published : events` then lets you scan a draft anyway — inconsistent with the detail screen which blocks check-in until published. | Make the published-vs-draft rule consistent across scan entry points. | Read `organize_shell.dart:56` and `event_detail_screen.dart:219`. |

---

## Capability gaps (missing table-stakes vs Luma / Eventbrite / Eventee, 2026)

The mobile **Organize** side exposes only: Edit fields (zones) · Check-in · Share · Delete · Publish
(`event_detail_screen.dart:202-248`). The web app has ~40 management tabs
(`app/(app)/events/[id]/`: agenda, approvals, tickets, promo-codes, communications, waitlist,
sponsors, speakers, exhibitors, orders, revenue, reports, roster…). Mobile has **none** of the manage-side tooling. Against competitors:

- **Walk-in / at-the-door registration** — Eventbrite & Luma both add a guest on the spot; Eventera can't on mobile (finding #4), and has no on-site ticket sales anywhere.
- **Guest approval / status change from the phone** — Luma approves/declines and changes status (Going/Waitlist) from the guest list; Eventera mobile can't (finding #3).
- **Order lookup / refund / reissue ticket on mobile** — Eventbrite Organizer does all three from the device; Eventera mobile has zero order/payment tooling.
- **Ticket-type management on mobile** — no create/edit of free/paid/PWYW/hidden tickets, capacity, sales windows, or promo codes in the app (web-only).
- **CSV import/export of attendees on mobile** — export/import exists on web registrations page only; not in the app.
- **Communications / announcements / bulk email from mobile** — web-only.
- **Waitlist** — web has a `waitlist` tab; mobile has no concept of it, and capacity/waitlist promotion isn't surfaced.
- **Bulk status update** — Luma bulk-updates via CSV/paste; Eventera has no bulk actions on mobile.

Sources: [Eventbrite Organizer app](https://www.eventbrite.com/organizer/features/organizer-check-in-app/) · [Eventbrite check-in help](https://www.eventbrite.com/help/en-us/articles/741083/%5Bslug%5D/) · [Luma guest list](https://help.luma.com/p/managing-your-guest-list) · [Luma registration](https://help.luma.com/p/event-registration-process)

---

## Janky UX

- **Create-event requires a card image before you can even name a real event** (`create_event_screen.dart:61`). Organizers who just want to open registration must first design a card — inverted priority vs every competitor (name/date first, design later).
- **"Live stats" / "Attendees" auto-pick "today's live event," but nothing is ever "today"** for mobile-created events (#5), so the app defaults to the first published event, which may not be the one at the door. No way to pin the active event.
- **Event picker is a horizontal chip strip of full event names** (`attendees_tab.dart:238`, `stats_tab.dart:234`) — with 20+ published events (this user has ~15 published) the strip is unusable; no search, no "today" grouping.
- **Rate shows `—` when 0 registered but the ring still renders at 0%** — mild inconsistency between the card stat and the ring.
- **Manual check-in confirm sheet warns "use only when QR won't scan"** but there is no other way to check in someone whose registration exists without a QR handy — the copy discourages the only tool the tab offers.
- **Profile always shows "Organizer" hat even for accounts that have never organized** (`profile_tab.dart:249` force-inserts it), so the role chips lie for pure attendees who flipped the mode toggle.
- **Delete event has a confirm dialog but no undo and no "type to confirm"** for an irreversible action that cascades cards (`event_detail_screen.dart:54`). On a live event this is a footgun.

---

## What actually works (verified against prod)

- **QR check-in RPC** (`checkin_registration`) — returns correct `invalid` for bad tokens, is deployed in the fixed (migration 070) form; the older broken `event_staff`/ambiguous-`id` versions are no longer live. Verified: bogus token → `{"result":"invalid",…}`; the list RPC returns the correct 5-column shape.
- **Manual check-in by id** (`checkin_registration_by_id`) — returns correct `invalid` for a bogus id; ownership enforced server-side (SECURITY DEFINER).
- **RLS ownership** on `events`/`registrations` reads — the attendee RPCs and `myEvents` are scoped to the owner; staff limited view (name/ticket only, no email/revenue) is enforced in the RPC, not just the UI.
- **Error/empty/loading states** across the Organize tabs are genuinely careful (never dress an error as "no data").

---

## Severity counts

- CRITICAL: **1** (plan-limit bypass via direct mobile write)
- HIGH: **3** (undercount RPC, approvals unreachable, no walk-ins)
- MEDIUM: **3** (schedule-less mobile events, N+1 PII fetch, misleading "Pending")
- LOW: **3** (realtime no-op, missing `checked_in_at`, scan-picker inconsistency)
- Total findings: **10** + large capability-gap set + 7 UX issues.
