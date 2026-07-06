# Mobile Role Modes — Audit + Build Plan

Design source: `Karts's Expansion (19) handoff/design_handoff_role_modes/`
(Speaker / Sponsor / Exhibitor, 15 screens) + `cardly/design_handoff_attendee_mobile_app/`.
Target: the existing Flutter app `eventera_mobile/`. **Reuse existing Supabase data; don't
remove working screens.**

**Verification status:** the backend SQL (below) is applyable + testable now. The Flutter
screens are written as drop-in drafts — **not build-tested** (no Dart toolchain here; Android
Studio not installed). One pass through `flutter run` is required to make them functional.

---

## Core model (from the handoff)
A person is one account with additive roles per (user, event). Roles never replace the
attendee baseline. On an event's hub card: a **role pill** appears, plus a **"… tools"**
entry card that opens that role's tool section (with a **rolebar** context strip).
Role tools live *inside the event*, never on the app-level bottom tab bar
(Discover · Tickets · Cards · Account stays). Camera screens go dark. Heavy management
stays on web.

## Role → existing Flutter → gap

| Role | Exists today | Gap vs handoff |
|---|---|---|
| **Attendee** | Full (`attendee/**`, event_hub 1702 ln) — at parity | Apply role-pill/tool-card pattern on the hub card (small) |
| **Speaker** | `rbac/speaking_screen.dart` (my sessions list) | Session detail + **live Q&A read** (SP02), **green room** (SP05), profile edit subset (SP03), Q&A empty (SP06) |
| **Sponsor** | `rbac/sponsoring_screen.dart` (booth + read-only leads, currently empty due to RLS) | **Lead scanner** (SPO02), **lead capture + hot/warm/cold** (SPO03), **my leads** (SPO04), **booth team scan-access** (SPO07), lead detail (SPO06) |
| **Exhibitor** | ❌ nothing | Entire mode: booth+products (EX02), **meeting requests** (EX03), directory preview (EX04), badge/tools entry (EX01). Lead scan reuses sponsor SPO02/03 |
| **Organizer** | `screens/organizer/*` (create/dashboard/detail/zone-editor) + `checkin_scanner_screen.dart` (draft) | Deep mgmt stays on web (by design) |

## Backend prerequisites — DONE (verifiable, apply in Supabase)
- `supabase/058_checkin_rpc.sql` — `checkin_registration(event_id, qr_token)` (organizer scanner).
- `supabase/059_sponsor_lead_capture.sql` — `sponsor_members.scan_access` column, `capture_lead(sponsor_id, qr_token, rating, note)` RPC (SPO03), and an RLS SELECT policy so sponsors + booth team can read their own leads (fixes the empty `sponsor_leads` list — SPO04).

Everything else in the handoff maps to existing tables (`speakers`, `sessions`, `qa_questions`,
`sponsors`, `sponsor_leads`, `sponsor_members`, plus exhibitor product/meeting tables in
migrations 023/027 — verify those cover EX02/EX03; if a product/meeting table is missing,
that's the only other backend addition).

## Flutter build plan (drop-in files, reuse `ui/tokens.dart`, `ui/components.dart`, `role_service.dart`, `EventeraApi`)
1. **Shared role widgets** — `roles/role_widgets.dart`: `RolePill`, `ToolCard`, `RoleBar`. Built once, themed per role. (Every role screen uses these.)
2. **Sponsor lead flow** (the workhorse) — `roles/sponsor/`: `lead_scanner_screen.dart` (dark `mobile_scanner` + capture sheet → `capture_lead` RPC), `my_leads_screen.dart` (RLS read, hot/warm/cold filters), `booth_team_screen.dart` (scan_access toggles), `lead_detail_screen.dart`.
3. **Exhibitor mode** — `roles/exhibitor/`: `booth_products_screen.dart` (EX02), `meeting_requests_screen.dart` (EX03), `directory_preview_screen.dart` (EX04). Reuses the sponsor scanner.
4. **Speaker mode** — `roles/speaker/`: `green_room_screen.dart` (SP05), `session_qa_screen.dart` (SP02 read-only, upvote-sorted). `speaking_screen.dart` stays; link into these.
5. **Hub integration** — in `attendee/hub/event_hub_screen.dart`, render `RolePill`s + `ToolCard`s from `role_service` role resolution. Additive; don't remove existing content.

## Definition of done per screen (from the handoff)
Matches the mock; loading/empty/error states; reads/writes real Supabase; camera dark theme;
44px hit targets; every write authorized server-side (the RPCs enforce it); scanner works and
the leads list respects the new RLS.

## What to run when Android Studio is set up
1. `flutter pub get` after adding `mobile_scanner` (see MOBILE_CHECKIN_SCANNER_SPEC.md).
2. Apply `058` + `059` in Supabase.
3. `flutter run` — fix any compile errors in the drafts (first build always finds a few), then
   click through each role flow against a real event where you hold that role.
