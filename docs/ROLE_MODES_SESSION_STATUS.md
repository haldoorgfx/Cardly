# Role Modes — Session Status (read when you're back)

Honest summary of what got built this session, what's verified, and what's left.

## The one thing to know
I **cannot make the Flutter app "functioning"** from here — there's no Dart toolchain in
my environment and Android Studio isn't installed, so nothing mobile can be compiled or run.
What I produced is **real, structured, drop-in work**, but the mobile parts need one pass
through `flutter run` (which will surface a few compile fixes — first builds always do) before
they're functional. The **web app is already finished and launch-ready** — that part is done.

## ✅ Done + verifiable (apply/test now)
Backend SQL — apply in the Supabase editor, then test:
- `supabase/058_checkin_rpc.sql` — organizer door check-in RPC.
- `supabase/059_sponsor_lead_capture.sql` — `sponsor_members.scan_access` column,
  `capture_lead(...)` RPC (scan → lead), and an RLS policy so sponsors + booth team can
  read their own leads (fixes the previously-empty sponsor leads list).

These close the real backend gaps the designs assumed. They're the prerequisite for the
sponsor/exhibitor scanners.

## ✅ Built as drop-in Flutter drafts (need the build loop)
A complete, coherent **Sponsor role** + the shared building blocks:
- `eventera_mobile/lib/roles/role_widgets.dart` — `RolePill`, `ToolCard`, `RoleBar`
  (the shared pattern every role reuses: pill on the hub card, "… tools" entry, context strip).
- `eventera_mobile/lib/roles/sponsor/lead_scanner_screen.dart` — SPO02 dark scanner +
  SPO03 capture sheet (hot/warm/cold + note → `capture_lead`).
- `eventera_mobile/lib/roles/sponsor/my_leads_screen.dart` — SPO04 leads list + filters.
- `eventera_mobile/lib/roles/sponsor/booth_team_screen.dart` — SPO07 scan-access toggles.

Written against your real UI kit (`AppColors`, `MScaffold`, `MAppBar`, `MBtn`, `EmptyState`)
and Supabase. Unverified — see "first-build checklist" below.

## ⏳ Remaining (planned in `docs/MOBILE_ROLE_MODES_AUDIT.md`, same patterns)
- **Exhibitor mode** (EX01–EX04: booth+products, meeting requests, directory preview).
  ⚠️ Before coding EX02/EX03, confirm product + meeting-request tables exist (migrations
  023/027). If they don't, that's the only remaining backend addition. The lead scanner
  reuses the sponsor one.
- **Speaker mode** extras (SP02 live Q&A read, SP05 green room). These read existing
  `sessions`/`speakers`/`qa_questions` — no new backend.
- **Hub integration** — render `RolePill` + `ToolCard` on `attendee/hub/event_hub_screen.dart`
  from role resolution (`rbac/role_service.dart`). Additive; keep existing content.

I deliberately stopped here rather than churn out more unverified screens — each blind file
just adds surface you'd have to debug. The shared widgets + one complete role flow establish
the pattern; the rest follow it and are best written where they can be built + tested per screen.

## First-build checklist (when Android Studio is set up)
1. Add `mobile_scanner: ^5.2.3` to `eventera_mobile/pubspec.yaml`; `flutter pub get`.
   Add camera permissions (see `docs/MOBILE_CHECKIN_SCANNER_SPEC.md`).
2. Apply `058` + `059` in Supabase.
3. `flutter run`. Expect a few compile fixes in the drafts — likely spots:
   - `mobile_scanner` controller/`onDetect` API if you pin a different major version.
   - `Switch(activeColor:)` may be `activeThumbColor:` on newer Flutter.
   - `MBtn` `onTap` nullability / `EmptyState` param names — match your kit if they differ.
4. Test each sponsor flow against a real event where you're a sponsor: scan a ticket QR →
   rate → save → see it in My Leads; toggle a teammate's scan access.

## What's actually launch-ready today
The **web app** — unified dashboard, tickets/hub, admin, access control, layout, payments
config (verified in Vercel). Your public-launch path is the non-code checklist in
`RELEASE_READINESS.md` (add `GOOGLE_AI_KEY`, verify Resend domain, test payments, run the
Generak SQL). The mobile role modes are the next build once the Flutter loop exists.
