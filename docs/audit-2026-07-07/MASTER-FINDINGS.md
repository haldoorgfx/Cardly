# Eventera — Master Audit (2026-07-07)

Merciless end-to-end audit from every stakeholder angle (attendee, organizer, speaker, sponsor/exhibitor, payments/security), verified against **live production** with the real anon key + test account, and benchmarked against Luma / Eventbrite / Eventee / Swapcard / Brella.

Full per-role reports live beside this file. This is the consolidated, deduped, severity-ranked list with **fix status**.

Legend: ✅ fixed this pass · 🟡 SQL written, needs paste in Supabase · ⬜ backlog.

---

## 🔴 CRITICAL — data breach / money / integrity (fix immediately)

| # | Finding | Where | Status |
|---|---------|-------|--------|
| C1 | **Anon PII + QR-token breach.** With only the public anon key (no login) anyone reads the entire `registrations` table — names, emails, phones, custom fields, `amount_paid`, and `qr_code_token` (a working check-in credential). Confirmed live: 68–79 rows. | RLS policy `public_attendee_wall` (054) | 🟡 `072_rls_lockdown.sql` |
| C2 | **Anon reads every `profiles` row** — email, phone, `plan`, `role` (incl. `super_admin`), `stripe_customer_id`. Enables admin enumeration + phishing. Confirmed live. | RLS policy `public_profile_read` (053) | 🟡 `072_rls_lockdown.sql` |
| C3 | **Anon reads every booth's `sponsors.invite_token`** — the bearer credential for the exhibitor lead portal. Confirmed live (11 tokens). Booth + lead takeover. | RLS `public_read` (023) | 🟡 `072_rls_lockdown.sql` |
| C4 | **`sponsor_members` / `sponsor_resources` fully public read+write** (`using(true)`). Anyone reads booth-team PII and can grant themselves scan access. | RLS `public_all` (027) | 🟡 `072_rls_lockdown.sql` |
| C5 | **Free-plan limit bypass.** Mobile `createEvent` writes `events` directly, skipping `canCreateEvent()` (API-route-only). A Free user makes unlimited events from the phone. | `eventera_mobile/lib/eventera_api.dart:88` | 🟡 `073_plan_limit_trigger.sql` (DB trigger — enforces for every client) |
| C6 | **Mobile paid checkout is a dead end.** Stripe events (13/15 live) can't be paid in-app (told to "use web"); Flutterwave shows a raw URL to copy. Orphaned pending regs, massive drop-off. | `registration_screen.dart:388,398` | ⬜ needs in-app Stripe/FW flow |
| C7 | **Production checkout runs Flutterwave SANDBOX** — a live USD registration redirected to `checkout-v2.dev-flutterwave.com`. No real money can be collected today. | `lib/payments/flutterwave.ts` env | ⬜ verify prod keys/env |

## 🟠 HIGH

| # | Finding | Where | Status |
|---|---------|-------|--------|
| H1 | `list_event_attendees` drops `pending`/`pending_approval` → Attendees tab, Stats "Registered", card counts all undercount; approvals impossible on mobile. Verified live (14→11, 3→0). | `070_fix_checkin_rpcs.sql:44` | ✅ `074_...sql` (broadened + `status` col) |
| H2 | Engagement write APIs trust client `registration_id`/`sender_id` → post Q&A / vote / DM as another attendee. | `051`, `021` insert checks | ⬜ bind to caller |
| H3 | `/api/render` unauthenticated → billable card render + webhooks charged to any published event's owner via arbitrary `variantId` (quota theft / IDOR). | `app/api/render/route.ts` | ⬜ owner/rate check |
| H4 | Paid-event capacity **oversell** — capacity counts only confirmed/checked_in; post-insert recheck is free-only, so concurrent paid buyers exceed `max_capacity`. | `register/route.ts:168,290` | ⬜ atomic capacity guard |
| H5 | Ticket transfer doesn't rotate the QR token → old holder still scans in; `user.email` interpolated raw into a PostgREST `.or()` (injection class). | `tickets/[id]/transfer/route.ts:47,69` | ⬜ rotate token + sanitize |
| H6 | Organizers **can't receive money** — payment intents never route to their Stripe Connect account; refunds are a status-flip only, no gateway call. | `lib/payments/stripe.ts:22` | ⬜ Connect + real refund |
| H7 | No self-serve **cancel/refund** anywhere (attendee or organizer). Table stakes vs Luma/Eventbrite. | — | ⬜ feature |
| H8 | Wrong **service fee at checkout** — client hardcodes 3.5% and shows a total the server never charges (server uses plan-based 5/2/0%). Trust-killer. | `RegistrationClient.tsx:244` | ⬜ compute server-side, render that |
| H9 | Speaker/sponsor/staff **invites never send email** → permanent "pending" dead ends; a speaker added by email is invisible on mobile with no "claim". | invite flows | ⬜ send invites + claim |
| H10 | Lead capture writes attendee PII with **no consent field** (GDPR). | lead scanner (web+mobile) | ⬜ add consent |
| H11 | `teams` / `team_members` RLS **infinite recursion** (HTTP 500 live). Staff/Teams broken in prod. | `008`/`012` | ⬜ fix recursive policy |
| H12 | Live DB drift — migrations 040 (fees), `event_staff`, 047 (Connect cols) unapplied; loose fix files sit outside `supabase/migrations/`. | repo layout | ⬜ apply + reorganize |

## 🟡 MEDIUM (selected — full list in per-role reports)

- Mobile-created events are schedule-less (`createEvent` never writes `event_pages` → null `starts_at`, never "upcoming"/"today"). ⬜
- No **walk-in / at-the-door registration** on mobile (web-only). ⬜
- No mobile **guest approval** screen. ⬜
- `community_messages` insert impersonation; WaafiPay concurrent double-charge; Stripe confirm skips amount recheck (defense-in-depth). ⬜
- N+1 PII over-fetch in `event_counts.dart` (one full-row RPC per event incl. drafts). ⬜
- Notifications never fire for event changes / messages / Q&A; several ticket links point to `/account/my-tickets` (404 — real path `/my-tickets`). ⬜
- `qr_code_token` returned in read-scope public API v1 responses. ⬜

## 🟢 LOW / polish

- Realtime reload no-op for pending regs; `checkin_registration_by_id` omits `checked_in_at`; scan-picker publishes-vs-drafts inconsistency; "works offline" copy with no service worker; discovery pagination capped at 48; booth products add-only; dead "Request meeting" CTA; meeting Accept swallows errors, no Decline. All ⬜.

---

## Capability gaps vs 2026 competitors (backlog themes)
Apple/Google **Wallet passes**; self-serve **cancel/refund**; **paid waitlist + auto-promotion**; **walk-in** + mobile approvals + order lookup/refund on mobile; **Stripe Connect payouts**; lead **export/CRM sync** + business-card OCR + consent; speaker **Q&A answering** + rating visibility; sponsor **ROI analytics**; in-app **invite emails** for all roles.

---

## ✅ Verified working (do not re-flag)
Free registration + duplicate-guard (409); email/promo validation; Stripe PI init w/ real client_secret; QR PNG render; ICS export; QR + by-id check-in RPCs (SECURITY DEFINER, correct ownership + invalid handling); staff limited-view (no email/revenue); all 5 webhook **signature** checks; server-side amount/fee/split computation (no client-amount path); billing checkout/portal authz; all 25 admin routes (impersonate = super_admin only); API-key hashing + scope on v1 read/checkin; `notifications`/`sponsor_leads`/`promo_codes`/`saved_events` isolation.

---

## Fixes applied this pass
- `supabase/072_rls_lockdown.sql` — closes C1–C4: drops the leaky public policies, locks base tables to owner/own-row, adds safe-column views `public_profiles` + `public_sponsors` and a safe `event_public_attendees()` wall RPC. **Mobile repointed** to the views/RPC (following, organizer profile, event hub avatars + sponsors + attendee wall, sponsor detail).
- `supabase/073_plan_limit_trigger.sql` — closes C5 at the DB level (BEFORE INSERT trigger; every client).
- `supabase/074_attendee_list_include_pending.sql` — fixes H1; counts now correct, `status` column added for future approvals.
- Mobile: batch-removed unsafe `currentUserId as Object` casts (silent-null RLS risk).

**To activate the security fixes, paste `072`, `073`, `074` into the Supabase SQL editor (in order) and rebuild the app.** Until `072` runs, the production data breach (C1–C4) is live.
