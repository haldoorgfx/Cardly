# Eventera — Platform Expansion · Implementation Handoff

**Audience:** Claude Code, working **inside the existing `cardly/` repo** (the live Eventera platform).
**Design contract:** `handoff/Eventera Expansion — Design Spec.html` — a pannable canvas of **35 artboards** in 7 feature groups. Match its layout, spacing, type, components, copy and states exactly.
**Mandate:** Build **all 7 groups in one pass**, fully functional, end-to-end, blended into the existing system with **zero conflicts**. This is additive — nothing existing gets redesigned or removed.

---

## 0. Absolute rules (read before touching anything)

1. **Stack is LOCKED.** Web = Next.js 14 App Router · TypeScript · **Supabase** (Postgres + Auth + Storage + RLS) · Tailwind v3 · shadcn/ui · react-hook-form + zod · pnpm. Mobile = the existing **Flutter** app in `eventera_mobile/`. **Add no new dependency, ORM, state lib, or framework.** If a design implies one, express it with what's already here.
2. **Brand = Eventera.** (The repo already ran `043_rename_karta_to_eventera`.) No "Karta" strings in new UI.
3. **Fonts = exactly two: `Plus Jakarta Sans` (headings/display) + `Inter` (everything else). NO monospace font anywhere** — no JetBrains Mono, no DM Sans, no `font-mono`. Numbers, labels, IDs, timestamps all render in Inter. Uppercase + letter-spacing is fine for micro-labels; the *font* stays Inter. Enforce in `tailwind.config.ts` and remove any mono utility from new code.
4. **Colors = existing tokens only.** `primary #1F4D3A`, `primary-dark #163828`, `primary-soft #E8EFEB`, `accent #E8C57E`, `accent-dark #C9A45E`, `ink #0F1F18`, `ink-soft #3A4A42`, `muted #6B7A72`, `cream #FAF6EE`, `surface #FFFFFF`, `border #E5E0D4`, `success #2D7A4F`, `warning #C97A2D`, `danger #B8423C`, `info #3A6B8C`. Pull from `BRAND.md` / `tailwind.config.ts`. Invent no new colors.
5. **Edit in place.** Extend existing routes/components/tables. **No `-v2` parallel files, no forks.** Reuse before you create.
6. **Server-authoritative.** All redemption/limit/window/plan/role checks run **server-side** (RPC + RLS). UI gating is cosmetic only.
7. **Every list/detail screen ships loading + empty + error states** and validated forms — the existing components already show this pattern; keep it.
8. **Dark theme is ONLY for camera/scanner screens** (entitlement scan results, offline scan). Everything else uses the standard Eventera surface.
9. If a design genuinely conflicts with working code, **flag it in your plan — do not silently rewrite.**

---

## 1. What you're building (7 groups, 35 screens)

| Group | Feature | Surfaces |
|---|---|---|
| G1 | **Entitlements engine** — attendees hold many independently-scannable entitlements (entry, meals, sessions, merch, transport, access, parking, certificate) each with its own validity window + redemption limit | web + mobile + scanner |
| G2 | **Offline check-in & reconciliation** — scans queue on-device, sync on reconnect, resolve two-device conflicts | mobile + web |
| G3 | **WhatsApp notifications** — WhatsApp Business connect, template library, journey automation builder, message preview, broadcasts | web + mobile |
| G4 | **Cash payments & door sales** — walk-in cash/mobile-money/card registration + per-staff & organizer cash reconciliation | mobile + web |
| G5 | **Multi-day events** — per-day check-in/capacity/entitlements, day-selector on scanner, attendance-by-day grid | web + mobile |
| G6 | **Dietary & accessibility** — calm registration capture, catering counts per meal, respectful accessibility summary, dietary pill on meal scan | web + mobile + scanner |
| G7 | **Add to calendar** — Google / Apple / Outlook / .ics on confirmation + reminders | web + mobile |
| G8 | **Entitlement management & edge cases** — migration notice for existing events, per-attendee management (grant/revoke/un-redeem/extend), un-redeem confirmation with reason, entitlement transfer, full scan audit log | web + mobile |

The design spec labels every artboard with its ID (E01…, O01…, W01…, C01…, M01…, D01…, K01), name, and surface. Build to those.

---

## 2. Database — extend, never replace (Supabase migrations)

Add new numbered files in `supabase/migrations/` starting at **`065_`**. All new tables get **RLS scoped by event owner / org / event-staff**, following the patterns in `003_roles_and_rls`, `036_event_staff`, `053_rls_consistency_fixes`. Reuse existing tables — do not duplicate.

**065_entitlements.sql**
- `entitlements` — `id, event_id → events, name, type (enum: entry|meal|session|merch|transport|access|parking|certificate), quantity int null (null = unlimited), valid_from timestamptz, valid_until timestamptz, redemption_limit (enum: once|once_per_day|unlimited), created_at`.
- `ticket_type_entitlements` — join `ticket_type_id ↔ entitlement_id` (ticket types live in `031_ticketing_depth` / `044_variant_ticket_link` — reuse them).
- `entitlement_redemptions` — `id, entitlement_id, registration_id → registrations (017/033/035), redeemed_at, redeemed_by (staff user), device_id, day_index int null, status (enum: redeemed|already|not_entitled|outside_window), source (enum: online|offline)`. This is the audit log powering E09 + O04.
- RPC **`redeem_entitlement(entitlement_id, registration_id, day_index)`** → validates entitlement belongs to attendee's ticket type, checks window (now within from/until), checks limit (once / once-per-day via `date_trunc`), inserts redemption, returns `{status, attendee, redemption_history, held_entitlements, dietary}`. Model it on existing `058_checkin_rpc` / `064_checkin_by_id`. **This RPC is the single source of truth for E05–E08.**
  - **Conditional dietary (G6 clarification):** the returned `dietary` is surfaced on the scan-success UI **only when `entitlement.type = 'meal'`**. Entry / shuttle / merch scans must NOT show dietary data — it's irrelevant there and needlessly exposes personal data. See E05 built twice in the spec (Meal → pill shown, Entry → no pill) and D04.

> **Audit ledger:** make `entitlement_redemptions` the append-only ledger for **all** entitlement actions, not just scans. Extend its `action`/`status` to cover `redeemed | un_redeemed | granted | revoked | transferred` with `reason text null`, `performed_by`, `device`. Never hard-delete — an un-redeem or revoke writes a new ledger row. This table powers both E09 and G05 (audit log). Add RPCs `unredeem_entitlement(redemption_id, reason)`, `grant_entitlement(entitlement_id, registration_id)`, `revoke_entitlement(...)`, `extend_validity(...)`, and `transfer_entitlement(entitlement_id, from_registration, to_registration|new_invite)` — each writes a ledger row; transfer refuses if the entitlement is already redeemed. All server-validated, all audited.

**066_multi_day.sql**
- `event_days` — `id, event_id, day_index, date, checkin_enabled bool, capacity int`. (If `030_waitlist_series` already models a series, extend it instead of adding a parallel concept — check first.)
- `event_day_entitlements` — join day ↔ entitlement (M01). Add `day_index` usage to `entitlement_redemptions` (above) for M02/M03.

**067_dietary_accessibility.sql**
- Prefer extending **`041_form_field_types`** — add `dietary` and `accessibility` field kinds so these are real registration form fields, not a bolt-on. Store answers on `registrations` (jsonb `dietary text[]`, `dietary_note`, `accessibility text[]`, `accessibility_note`). D02/D03/D04 read from here; join to meal entitlement redemptions for per-meal counts.

**068_offline_sync.sql**
- Add to `entitlement_redemptions` / check-in: `client_uuid` (idempotency key, dedupes replayed offline scans), `device_id`, `scanned_at` (device clock) vs `synced_at` (server clock). A conflict = two rows, same `(registration_id, entitlement_id[, day_index])`, different `device_id`, both offline. RPC **`resolve_conflict(...)`** with actions `keep_first | keep_both | manual`. Reuse the idempotency approach from `014_render_idempotency` / `029_idempotency_key_text`.

**069_whatsapp.sql**
- `whatsapp_connections` — `event_id/org, phone_number, waba_id, status`. Register the provider in **`047_integrations`** rather than a standalone concept.
- `message_templates` — `id, name, category (utility|marketing|authentication), approval_status (approved|pending|rejected), body, buttons jsonb`.
- `notification_automations` — `event_id, step (registration|d7|d1|h1|during|post), enabled, channels jsonb {email,whatsapp,sms}`. Wire delivery through existing `lib/notifications` + `049_notifications_realtime_and_devices` + `046_mobile_notifications_rls`.

**070_cash_reconciliation.sql**
- Extend orders/payments (`018_waafipay`, `045_payment_processors_multi`, `040_platform_fees`) with a `cash` method. `cash_shifts` — `id, event_id, staff_user_id, started_at, ended_at, status (open|reconciled), reconciled_at`. Link cash orders to a shift. C02/C03 aggregate from here.

> After migrations: update `supabase/pending_migrations_to_run.sql` and regenerate types. Keep every policy consistent with `053`/`054` (no RLS recursion).

---

## 3. Web (Next.js) — routes & components to add/extend

Work behind the existing `app/(app)/events/[id]/*` structure and existing component folders. `[new]` create · `[fill]` extend.

**G1 Entitlements**
- `app/(app)/events/[id]/entitlements/page.tsx` `[new]` → **E01** (empty + populated + add slide-over). New `components/tickets/EntitlementsClient.tsx` + `EntitlementSlideOver.tsx`. Type icons: build one `EntitlementIcon` component (see spec's glyph set — entry/meal/session/merch/transport/access/parking/certificate).
- `components/tickets/*` `[fill]` → **E02**: add an entitlement-checkbox section to the ticket-type editor; render included entitlements as pills below each ticket type.
- **E09** redemption dashboard → `app/(app)/events/[id]/analytics/redemption/page.tsx` `[new]`, realtime via Supabase channel (reuse `061_realtime_publication`). Live progress bar + last-redemption per entitlement.

**G2 Offline** — web side is **O04** conflict resolution: `app/(app)/events/[id]/check-in/conflicts/page.tsx` `[new]`, plus the "all synced" success state. Extend `components/check-in/CheckInDashboard.tsx`.

**G3 WhatsApp**
- `app/(app)/events/[id]/communications/whatsapp/page.tsx` `[new]` → **W01** (connect + template list) — surface it inside the existing communications/integrations area.
- `.../communications/automations/page.tsx` `[new]` → **W02** journey builder (vertical timeline, per-step channel toggles, cost hints).
- `.../communications/preview` → **W03** template previews.
- `.../communications/broadcast` → **W04** announcement composer (audience, channels, char count, estimated cost, send).

**G4 Cash** — **C03** organizer overview: `app/(app)/events/[id]/payments/cash/page.tsx` `[new]` (per-staff table + grand total). Extend `components/check-in/WalkInClient.tsx` for the cash flow shared with mobile.

**G5 Multi-day**
- **M01** setup → `app/(app)/events/[id]/settings/days/page.tsx` `[new]` (day cards: check-in toggle, capacity, entitlements).
- **M03** attendance grid → `app/(app)/events/[id]/registrations/attendance/page.tsx` `[new]` (attendees × days, cell states checked-in/absent/not-entitled, per-day summary row).

**G6 Dietary & accessibility**
- **D01** → add dietary + accessibility field groups to the existing registration form builder + attendee registration flow (`lib/registration`, `components/registration/*`, `041_form_field_types`).
- **D02** catering summary → `app/(app)/events/[id]/catering/page.tsx` `[new]` (counts + per-meal breakdown + export).
- **D03** accessibility summary → `.../catering/accessibility/page.tsx` `[new]` (counts + private per-attendee list + contact). Handle with care — respectful, not "problems".

**G7 Calendar** — **K01**: add the calendar pills (Google/Apple/Outlook/.ics) to the registration confirmation page + reminder emails (`lib/email`). The .ics generator likely already exists (`eventera_mobile/lib/ics_export.dart`) — port/share the same event payload for web.

**G8 Entitlement management & edge cases**
- **G01** migration notice → a one-time dismissible card shown to organizers with existing events when the engine goes live (calm/reassuring; before→after ticket visual; "N events updated · N ticket types · Entry entitlement each"). Gate on a per-org `seen_entitlements_migration` flag (reuse the `024_onboarding_completed` / flags pattern).
- **G02** attendee entitlement management → `app/(app)/events/[id]/registrations/[registrationId]/entitlements/page.tsx` `[new]`: attendee header + entitlement list with per-row actions (Revoke · Un-redeem · Extend validity) and **+ Grant entitlement** picker (entitlements not currently held). Destructive actions require confirmation.
- **G03** un-redeem confirmation → focused modal (shows original scan time/staff/device, **required reason** selector: Scanned by mistake / Duplicate scan / Other). Calls `unredeem_entitlement` — deliberate, audited.
- **G04** transfer → modal (web) + bottom sheet (mobile): pick entitlement → search existing attendees or invite by email → confirm; block if already redeemed; success = "transferred to X. Both attendees notified." Calls `transfer_entitlement`, notifies via `lib/notifications`.
- **G05** scan history / audit log → `app/(app)/events/[id]/analytics/audit/page.tsx` `[new]`: filterable table (time, attendee, entitlement, action, by, device, result) with filters by attendee / entitlement / staff / date range / result; reads the `entitlement_redemptions` ledger. Populated + empty states. Openable pre-filtered for one attendee from G02.

---

## 4. Mobile (Flutter · `eventera_mobile/`) — screens to add/extend

Match the spec's mobile artboards; respect iOS safe areas & 44px min hit targets (the spec's device frame reflects this). Use `lib/ui/tokens.dart`, `lib/ui/components.dart`, `lib/theme.dart` — **Plus Jakarta Sans + Inter, no mono**. All network via `lib/eventera_api.dart` / `lib/net.dart`; models in `lib/models.dart`.

**G1 scanner (the core of the field app)**
- Extend `lib/screens/organizer/checkin_scanner_screen.dart` (or add `lib/screens/organizer/entitlement_scanner_screen.dart`):
  - **E04** mode selector — pick which entitlement you're scanning, with live redemption counters.
  - **E05–E08** result states — success / already-redeemed / not-entitled (show what they DO hold) / outside-window. All **dark**. Each result comes straight from the `redeem_entitlement` RPC response.
- **E03** attendee entitlement view → `lib/attendee/tickets/` — cards with Available / Redeemed(+time, greyed) / Expired states + Show QR.

**G2 offline**
- **O01** persistent connection indicator (online / offline+queued / syncing) — a shared widget in `lib/ui/components.dart`, shown on the scanner.
- **O02** pre-event data download (cache attendee list; progress; "Ready — N cached"; last-synced).
- **O03** dark scanner with `OFFLINE` pill; success reads "Checked in — will sync when online". Queue writes locally (client_uuid) and replay via the RPC on reconnect.
- **O04** mobile conflict card + "all synced" state.

**G4 cash** — **C01** walk-in cash registration (name/phone/email, ticket+price, method, amount received → large auto change-due; one confirm = register + check-in + issue Eventera Card). **C02** end-of-shift reconciliation (totals, transaction list, "Hand over cash" → marks shift reconciled). Build in `lib/roles/staff/` alongside `event_control_screen.dart`.

**G5 multi-day** — **M02** day selector pills on the scanner (today emphasized, per-day counts).

**G6** — **D01** dietary/accessibility on mobile registration; **D04** dietary pill (e.g. `HALAL`) shown large on the **meal** scan-success screen — the single most useful placement of this data for catering staff.

**G7** — **K01** calendar pills on the mobile confirmation screen (reuse `ics_export.dart`, deep links via `links.dart`/`deep_link_handler.dart`).

**G8** — **G04** entitlement transfer as a mobile bottom sheet (search attendees / invite by email → transfer). The per-attendee management, un-redeem and audit surfaces are organizer-web-primary; expose read-only ledger on mobile if trivial, otherwise web-only.

---

## 5. States & realtime (do not skip)

- **Loading:** skeletons on every table/list (E09, C03, M03, W01) and a "camera initializing" frame on scanners.
- **Empty:** first-run empty states — E01 (built), plus W01 (no templates), C03 (no cash), D03 (no needs), M03 (no attendance), E09 (no redemptions).
- **Error:** camera/permission denied; payment declined (C01); broadcast/template send failure (W04); offline download interrupted (O02); generic "couldn't load" + retry on web tables.
- **Realtime:** E09, W04 delivery, C03, and all scanners show a live indicator and update via Supabase realtime channels (`061_realtime_publication`).

---

## 6. Definition of done

- Every existing flow still works unchanged.
- Organizer can: define entitlements → attach to ticket types → scan each entitlement in its own mode → watch live redemption; run a multi-day event with per-day check-in; connect WhatsApp, build the journey, broadcast; take cash at the door and reconcile per-staff and overall; hand caterers accurate per-meal counts and prep accessibility needs; attendees add the event to their calendar.
- Organizers with existing events see the calm migration notice once; per-attendee entitlement management, un-redeem (with reason), transfer, and a filterable audit log all work and are recorded in the ledger. Dietary appears on meal scans only.
- Check-in works fully offline and reconciles (incl. two-device conflicts) with no double-redemptions.
- All server-enforced (RPC + RLS), Eventera-branded, two fonts only, no mono, existing tokens only, dark theme only on scanners. Deployed on Vercel; mobile builds clean.

---

## 7. Suggested one-pass order (vertical, so each slice is shippable)

1. **Migrations 065–070** + RPCs + type regen + RLS.
2. **G1** end-to-end (setup → ticket attach → scanner modes → results → redemption dashboard) — it's the spine everything else references.
3. **G5** multi-day (adds `day_index` to scanning/attendance — do right after G1).
4. **G2** offline + reconciliation (wraps the G1 scanner).
5. **G6** dietary/accessibility (feeds D04 into the G1 meal scan).
6. **G4** cash + reconciliation.
7. **G3** WhatsApp + **G7** calendar.
8. **G8** management & edge cases (migration notice, per-attendee management, un-redeem, transfer, audit log) — it reads the ledger G1 already writes, so it lands last.
9. States + realtime pass across all of the above.

Build it all, wire it all, ship it working.
