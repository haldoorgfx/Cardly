# Organizer Journey Audit — 2026-07-07

**Scope:** Full organizer journey — signup → event creation → Card Studio → ticketing → promo codes → forms → publish → registrations → comms → agenda/speakers/sponsors → team/staff → day-of (web + Flutter mobile) → analytics → billing limits → payouts.
**Method:** Code audit of the worktree + live verification against the production Supabase backend (`qhjvetcawsaswfkufzee.supabase.co`) and live site (`karta.cre8so.com`) using the test organizer account. Live writes tagged `[E2E-TEST]` (2 registrations, 1 check-in on "Auto/GA" test event — nothing deleted).
**Benchmark:** Organizer expectations set by Luma, Eventbrite, and Eventee in 2026.

---

## Benchmark: what organizers expect in 2026

1. **Sub-2-minute event creation** — Luma's signature; template quick-starts and event duplication for recurring events.
2. **Money flows to the organizer automatically** — Luma pays out to the organizer's own Stripe account *as tickets sell*; Eventbrite pays 3–5 days post-event with Instant Payouts available. Nobody accepts "we'll be in touch."
3. **Transparent fees with a fee-passing toggle** — Eventbrite: 3.7% + $1.79 + 2.9% processing, organizer chooses who pays; Luma: flat 5% (0% on Plus).
4. **Ticket depth** — free/paid/donation (PWYW), hidden tickets, sales windows, per-order limits, capacity with automatic waitlist overflow.
5. **Door ops that survive bad Wi-Fi** — Eventbrite Organizer app and Eventee both do offline-tolerant scanning, instant sync, walk-in registration at the door, badge printing.
6. **Self-serve refunds** — organizers issue refunds themselves from the registration row.
7. **Segmented, schedulable comms** — email blasts by ticket type/status, scheduled sends, automatic reminders.
8. **Team roles that are actually enforced** — a door scanner can't see revenue.

---

## Verdict up front

The core loop **works live end-to-end**: create → publish → free registration (verified live: returned `registration_id` + QR token) → QR check-in (verified live: `success` then `already_checked_in` on duplicate scan) → real-time stats. Overselling protection, promo validation, and custom form fields are server-authoritative and solid.

What breaks organizer trust: **the money never reaches them**, **the live database is missing at least four schema pieces the code depends on**, and **every "invite" (team, speaker, sponsor) is a silent dead end**.

---

## BLOCKERS

### B1. An organizer cannot receive money — the entire payout leg is missing
- **Severity:** Critical — this is the revenue promise of the platform.
- **Where:** `lib/payments/stripe.ts:22-34`, `app/api/events/[id]/register/route.ts:422-428`, `components/events/RevenueView.tsx:141`
- **Evidence:**
  - `stripe.paymentIntents.create()` passes no `transfer_data` / `on_behalf_of` / `application_fee_amount`. Zero matches for `transfer_data` in app code. Every paid ticket lands in the **platform's** Stripe/Flutterwave/WaafiPay account.
  - Stripe Connect onboarding exists (`lib/integrations/stripe-connect.ts:33-57`, stores `profiles.stripe_connect_account_id`) and the settings UI promises "Funds settle to your own Stripe account" (`components/settings/IntegrationsClient.tsx:185`) — but the connect account ID is **never read during checkout**. The promise in the UI is false.
  - `RevenueView.tsx:141`: "Payouts are processed manually for now — we'll be in touch to settle." No withdrawal endpoint, no payout table (live probe: `payouts` table does not exist), no transfer job.
- **Fix:** At intent creation, look up the event owner's `stripe_connect_account_id`; if onboarded, create the intent with `transfer_data: { destination }` + `application_fee_amount` = `split.platformFee`. Fall back to platform-account + manual ledger only when not onboarded, and change the IntegrationsClient copy until then. Add a `payouts` table + admin "mark settled" flow as the interim.

### B2. Live production is running Flutterwave SANDBOX — and misroutes USD to it
- **Severity:** Critical — a real attendee paying $250 today reaches a dev checkout; no real money can be collected.
- **Where:** Live `POST /api/events/{id}/register` on karta.cre8so.com; routing logic `app/api/events/[id]/register/route.ts:361-370`, `lib/payments/flutterwave.ts:4`
- **Evidence (live test, 2026-07-07):** Paid registration for the $250 USD "VIP Pass" returned `"payment_processor":"flutterwave","redirect_url":"https://checkout-v2.dev-flutterwave.com/v3/hosted/pay/…"` — `dev-flutterwave.com` is the sandbox host. Also note `isFlutterwaveCurrency` lists NGN/KES/GHS/ZAR/UGX/TZS — USD is not a Flutterwave currency here, yet the event's processor preference forced it anyway.
- **Fix:** Set production `FLUTTERWAVE_SECRET_KEY` (live keys) on Vercel; validate ticket currency against the chosen processor's supported list at registration time and fall back to Stripe for USD; add a startup warning when any payment env key is a test/sandbox key in production.

### B3. Live DB has drifted from the code — four schema pieces the code needs are missing
- **Severity:** Critical — whole tabs 500 or silently no-op on production.
- **Where:** Live Supabase vs `supabase/migrations/` + orphaned fix files in `supabase/` root
- **Evidence (all verified live via PostgREST):**
  1. **Migration 040 (platform fees) NOT applied:** `column registrations.platform_fee does not exist`, `column events.fee_bearer does not exist`. The register route reads fee_bearer "defensively" (`register/route.ts:221-227`) so registration survives, but the fee-split update at `register/route.ts:286` fails silently → **no `organizer_net` ledger is being written for any live sale**. Revenue tab and admin "owed" math (`app/admin/billing/page.tsx:48-66`) run on empty columns. Also `app/(app)/events/[id]/settings/page.tsx:42` selects `fee_bearer` → error swallowed, toggle can't persist.
  2. **`event_staff` table missing live** (`PGRST205`), though `036_event_staff.sql` exists in migrations/. Staff invite POST (`app/api/events/[id]/staff/route.ts:22-68`) writes to it → **the Staff tab is broken on production**.
  3. **`integrations` table + Connect columns missing live** (047_integrations.sql unapplied) → Stripe Connect onboarding and the integrations settings page fail against prod.
  4. **`teams` / `team_members` RLS infinite recursion live:** `SELECT` on either returns `42P17 infinite recursion detected in policy` → any team feature crashes. Fix files exist (`supabase/054_fix_rls_recursion.sql`, `supabase/RUN_ALL_TICKETING_FIXES.sql`, `supabase/052…`, `058/062/064/070` RPC files) but they sit in `supabase/` **root, outside `migrations/`**, with no applied/not-applied tracking.
- **Fix:** Reconcile now: apply 040, 036 (or its equivalent), 047, and the teams-RLS fix in the SQL editor; then move every root-level SQL file into `supabase/migrations/` with sequential numbers and keep a single applied-through marker in CLAUDE.md. (Note: check-in RPCs `checkin_registration`, `checkin_registration_by_id`, `list_event_attendees` and `user_event_roles` ARE live — verified by direct RPC calls.)

### B4. Organizers cannot refund a ticket — refunds are status theater
- **Severity:** Critical for paid events (chargebacks, trust, legal in some markets).
- **Where:** `app/api/events/[id]/registrations/route.ts:163-178`, `app/api/admin/billing/refund/route.ts:9-16`, `app/api/payments/webhook/route.ts:119-130`
- **Evidence:** The organizer-facing path only flips `status='refunded'` in the DB — no `stripe.refunds.create()` anywhere in organizer scope. The only real refund endpoint is super_admin-gated (`BILLING_MANAGE`) and targets SaaS subscription payment intents, not ticket registrations. `charge.refunded` webhook is passive (reacts if a refund happens in the Stripe dashboard). Flutterwave/WaafiPay have no refund path at all.
- **Fix:** Add `POST /api/registrations/[id]/refund` (owner or finance-role): call the gateway refund API keyed off `stripe_payment_intent_id`/`flutterwave_tx_ref`, then set status from the webhook, not optimistically. Disable the button for gateways without refund support with an honest tooltip.

### B5. Every invite flow is a silent dead end — no email is ever sent
- **Severity:** High — team/staff/speaker/sponsor onboarding all stall at "pending" with no signal to anyone.
- **Where:** `app/api/events/[id]/staff/route.ts:53` (insert only, no send), `:123-125` ("resend" updates `invited_at` only — a stub); speakers `app/api/events/[id]/speakers/route.ts` (role granted only if email already matches an account); sponsors invite_token generated but never delivered (`app/(app)/events/[id]/sponsors/page.tsx:28`)
- **Evidence:** No Resend call in any of these routes; there is no acceptance route for staff invites. An invited scanner who has never used Eventera has no way to discover the invite.
- **Fix:** One `sendInviteEmail(kind, email, acceptUrl)` helper in `lib/email/`; send on create and on resend; add `/invite/accept?token=` route that upserts `user_event_roles`. Until then, at minimum surface a copyable invite link in each UI (sponsors already has the token — expose it as "copy invite link" everywhere).

### B6. Staff roles exist in the UI but are enforced nowhere
- **Severity:** High — security: a `check_in` scanner can read revenue and export attendee PII by calling the API; on mobile, a staff-only user can open the full Organize shell.
- **Where:** Web: `app/api/events/[id]/checkin/route.ts:6-12` and every `api/events/[id]/*` route (ownership check `eq('user_id', user.id)` only, no role scoping); role matrix defined but unused in `components/events/StaffRolesClient.tsx:16-21` and `lib/rbac/roles.ts:25`. Mobile: `eventera_mobile/lib/app_mode.dart` + `organize_shell.dart:43-47` — no role gate at shell entry.
- **Evidence:** Zero middleware/guard references the `check_in|moderator|finance|manager` role values on any organizer API route.
- **Fix:** `requireEventRole(eventId, ...allowedRoles)` helper used by every organizer route; scanner endpoints allow `check_in`, registrations/export/revenue require `manager|finance|owner`. Mobile: gate Organize shell on `hasOrganizing || isAdmin`; staff lands on EventControlScreen only.

### B7. Event time is stored without timezone — international events show the wrong time
- **Severity:** High — Eventera's primary markets span EAT/GST/UTC; a Nairobi organizer's 2 PM event renders wrong for everyone.
- **Where:** `app/(app)/events/new/page.tsx:140-160` (`<input type="datetime-local">`, no TZ selector), `app/api/events/create-basic/route.ts:64-77` (accepts `starts_at/ends_at`, never sets `event_pages.timezone`)
- **Evidence:** `event_pages.timezone` column exists (types/database.ts:905) but create-basic never writes it; no timezone UI anywhere in the wizard or event-page editor.
- **Fix:** Capture `Intl.DateTimeFormat().resolvedOptions().timeZone` as the default, show an editable TZ picker in the wizard, convert to UTC on save, and render event pages in the event's timezone with the attendee's local time as secondary.

### B8. Event name has two sources of truth and they drift — live public page shows the wrong event
- **Severity:** High — a shared link that renders a different event's content is an instant trust-killer.
- **Where:** `events.name` vs `event_pages.title`; render path `app/(public)/e/[slug]/page.tsx:57-69`
- **Evidence (live):** `events` row `slug=volta-gaming-expo-hud6, name="Volta Gaming Expo"` has `event_pages.title="Afritech config 26"`. The live page `https://karta.cre8so.com/e/volta-gaming-expo-hud6` renders `<title>Afritech config 26 — Eventera</title>` and matching OG tags. Dashboard lists show `events.name`; the public page shows `event_pages.title` — editing one never syncs the other.
- **Fix:** Make `events.name` canonical: event-page editor title edits update both (or drop `event_pages.title` and always join). Add a one-off data-repair script for drifted rows.

---

## FRICTION

### F1. Door scanning loses scans on network failure; no session refresh mid-shift
- **Severity:** Medium-high on event day.
- **Where:** `eventera_mobile/lib/screens/organizer/checkin_scanner_screen.dart:95-102` (catch → toast → scan lost), `components/check-in/QRScanner.tsx:94-97` (same on web); no re-auth handling on 401 in either scanner.
- **Evidence:** No local queue, no retry-on-reconnect; RPC uses the session token with no refresh path — a 4-hour door shift dies silently when the JWT expires. Benchmark: Eventbrite Organizer queues offline scans.
- **Fix:** Queue failed/offline scans locally (registration token + timestamp), replay on reconnect (the RPC is already idempotent — verified live: duplicate returns `already_checked_in`); call `supabase.auth.refreshSession()` on 401 and retry once.

### F2. Card Studio autosave can silently lose work
- **Where:** `components/editor/CanvasEditor.tsx:399-419` (3 retries then `setSaveError(true)`; zones updated optimistically), `:418` (800ms debounce — closing the tab within it drops the last edit).
- **Fix:** Persistent "Unsaved changes — retry" banner on `saveError`; `beforeunload` guard while dirty; flush save on visibilitychange.

### F3. PWYW and fee-passing are fully built server-side but have no organizer UI
- **Where:** PWYW: `ticket_types.min_price` (031_ticketing_depth.sql:6) + validation `register/route.ts:119-128` exist; `components/events/TicketTypesManager.tsx` has zero `min_price` references. Fee bearer: `fee_bearer 'pass'` accepted by `app/api/events/[id]/checkout-settings/route.ts:21`, no toggle rendered in settings.
- **Fix:** Add "Pay what you want (minimum X)" to the ticket modal and a fee-bearer radio in checkout settings. Both are UI-only changes over working APIs.

### F4. Publishing an event with zero tickets produces a dead-end register page
- **Where:** `register/route.ts:19` (`ticket_type_id: z.string().uuid()` required); live evidence: published events `volta-gaming-expo-hud6` and `auto-test-event-2027-b2d93e87` both have **no ticket_types rows** — their live /register pages have nothing to select and the API cannot accept anyone.
- **Fix:** On publish, warn hard if no visible ticket exists and offer one-click "Add free General Admission" (Luma auto-creates a default ticket).

### F5. Publish page reads as "already live" before publishing
- **Where:** `app/(app)/events/[id]/publish/page.tsx:28-32` — share URL, QR poster and stats render while status is still `draft`; nothing prevents sharing a link that 404s for attendees.
- **Fix:** Gate share/QR blocks behind `status==='published'` with a clear "Not live yet" state.

### F6. Comms: no segmentation, no scheduling, no bounce visibility
- **Where:** `app/api/events/[id]/communicate/route.ts:34-70` — sends immediately to all confirmed+checked-in via Resend in 100-batches (500 attendees fine), but no ticket-type/status audience filter, no scheduled send, fire-and-forget (no failure tracking), and no per-event send throttle.
- **Fix:** Audience filter param (ticket_type_id, status), `scheduled_at` column + cron, store Resend message ids.

### F7. Walk-ins and kiosk exist on web only, and kiosk is unreachable
- **Where:** Walk-in: `app/api/events/[id]/walk-in/route.ts` + `components/check-in/WalkInClient.tsx` (works: dedupe, capacity, auto-check-in) — no mobile equivalent; kiosk `app/(app)/events/[id]/check-in/kiosk/page.tsx` has no entry link in the check-in UI.
- **Fix:** Link kiosk mode from CheckInDashboard; add a minimal walk-in form to the mobile Scan tab.

### F8. Plan-limit failures and onboarding failures are silent
- **Where:** `app/api/events/create/route.ts:17-20` returns 402 `PLAN_LIMIT` but the wizard shows generic "Something went wrong" (`app/(app)/events/new/page.tsx:71`); onboarding fire-and-forgets `/api/onboarding` + `/api/brand/logo` with empty catch and always redirects (`OnboardingClient.tsx:152-168`).
- **Fix:** Map 402 → upgrade modal with plan comparison; toast on onboarding save failure.

### F9. Analytics cap at 1,000 registrations
- **Where:** `app/(app)/events/[id]/analytics/page.tsx:40` (`limit(1000)`) — larger events get silently wrong numbers.
- **Fix:** Use `count: 'exact'` aggregates / SQL group-by instead of row fetch.

### F10. Registrations CSV keys custom fields fragilely; no bulk approve/reject
- **Where:** `components/events/RegistrationsTable.tsx:90-120` (export works, includes custom fields; bulk check-in exists at :1236-1242) — but no bulk approve/reject, and no import.
- **Fix:** Bulk actions on selection; label-keyed CSV columns.

---

## GAPS (vs Luma / Eventbrite / Eventee)

| # | Gap | Evidence | Benchmark |
|---|-----|----------|-----------|
| G1 | **No event duplication / templates in the wizard** | No clone endpoint under `app/api/events/`; wizard is a blank form (`app/(app)/events/new/page.tsx:18-74`; template picker only appears inside the editor) | Luma: duplicate event; both: template quick-start |
| G2 | **No automatic waitlist overflow** | Full event returns flat `EVENT_FULL` 409 (`register/route.ts:176`); waitlist is manual-release only (`app/api/events/[id]/waitlist/route.ts` — works, verified stub-free) | Luma/Eventbrite: "join waitlist" offered at sold-out |
| G3 | **Free-tier registration cap not enforced** | Pricing promises 50 registrations on Free; only card generation is metered (`lib/billing/can.ts:62-98`); no check in register route → unlimited free registrations | Self-consistency: CLAUDE.md/pricing page vs code |
| G4 | **No session room-conflict detection** | `app/api/events/[id]/sessions/route.ts` has no overlap query — double-booking a room is silent | Eventee agenda tooling |
| G5 | **No reserved seating / seat maps** | No schema | Eventbrite differentiator — acceptable gap for launch |
| G6 | **No badge printing** | No print pipeline (roster print exists: `app/(app)/events/[id]/roster/print`) | Eventee/Luma badge printing |
| G7 | **No "preview as attendee" button** | Preview requires hand-building `?preview=1` URL (`app/(public)/e/[slug]/page.tsx:204-226`) | Both competitors inline it |
| G8 | **Mobile Attendees/Events tabs show no capacity context** | `attendees_tab.dart` has counts but no capacity bar; Events list has no per-event check-in rate | Eventbrite Organizer inline stats |
| G9 | **Soft-404 on unknown event slugs** | Live: `/e/nonexistent-event-zzzz` returns HTTP 200 with "not found" copy — bad for SEO/link hygiene | — |

---

## What verifiably works (keep and market these)

- **Live end-to-end core loop** — free registration → QR token → scan → duplicate-scan rejection, all verified against production on 2026-07-07.
- **Overselling protection is genuinely atomic** — `increment_ticket_quantity_sold` RPC guards in the UPDATE WHERE clause (017:236-249); capacity double-checked pre/post insert; paid decrements idempotent in webhook.
- **Promo codes are server-authoritative** — expiry/usage/discount computed server-side and baked into the charged amount (`register/route.ts:141-165`); atomic use-count RPC.
- **Custom registration forms** — 10 field types (041), builder UI, responses stored in JSONB and included in CSV export.
- **Webhooks are done right** — signature verification on all three gateways, constant-time compare on Flutterwave, amount validation, idempotent status flips.
- **Real-time day-of stats** — mobile Stats tab subscribes to registrations via Realtime (`stats_tab.dart:84-101`); check-in RPCs live and role-aware.
- **Waitlist, walk-in (web), approval flow, manual add, resend confirmation, CSV export** — all functional with capacity re-checks.
- **Plan gates for event count and card generation** — enforced server-side with 402s (`lib/billing/can.ts`).

---

## Fix order (if only five things get done this week)

1. **Apply the missing SQL to production** (040, event_staff, 047, teams-RLS fix) and fold `supabase/*.sql` strays into `migrations/` — B3 unblocks Staff, Teams, Integrations, and the revenue ledger in one sitting.
2. **Swap Flutterwave to live keys + currency-validate processor routing** (B2) — nothing else about revenue matters while checkout is a sandbox.
3. **Wire Stripe Connect into intent creation + interim manual-payout ledger** (B1).
4. **Send the invite emails + one accept route** (B5) — three dead features come alive with one helper.
5. **Real refunds for organizers** (B4).
