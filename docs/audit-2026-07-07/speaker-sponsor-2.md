# Eventera QA Audit — SPEAKER & SPONSOR/EXHIBITOR Journeys

Auditor: merciless QA, role-playing a Speaker and a Sponsor/Exhibitor.
Repo: `C:\Users\cabda\cardly\.claude\worktrees\suspicious-sutherland-534ac5`
Live prod: Supabase behind `karta.cre8so.com`, authed as `cabdalla005@gmail.com` (user `c94e0432-...`, holds Organizer/Speaker/Sponsor roles). All prod probes were READS ONLY.

---

## TL;DR — the platform's exhibitor/sponsor security model is broken at the root

The exhibitor portal treats `sponsors.invite_token` as a bearer credential (whoever has it gets the booth's leads). But **the `sponsors` table has an RLS policy `public_read USING (is_visible = true)` that returns the FULL row — including `invite_token` — to anonymous users.** Confirmed live: an unauthenticated request with only the public anon key dumped every visible sponsor's token. Anyone on the internet can scrape all booth tokens and take over every booth's lead PII. This is the headline finding (SPON-1). Two more tables (`sponsor_members`, `sponsor_resources`) are `USING(true)` fully public read+write.

---

## Prioritized findings

| # | Sev | Role | Area | File:line | What's broken | Fix | Verified how |
|---|-----|------|------|-----------|---------------|-----|--------------|
| SPON-1 | **CRITICAL** | Sponsor/Exhibitor | RLS / auth bypass | `supabase/migrations/023_sponsors_whitelabel_cfp.sql:112` | `create policy public_read on sponsors for select using (is_visible = true)` returns the entire row, incl. `invite_token`. That token is the sole credential for `/exhibitor/[token]` and every `/api/exhibitor/*` route (service-role, RLS-bypassing). So any anon user scrapes all tokens → full portal + lead PII takeover for every booth. | Never expose `invite_token` to public. Either drop the column from the public policy via a column-restricted view / GRANT, or add `SELECT` column privileges excluding `invite_token`, or serve public sponsor data through an API that omits it. Rotate all existing tokens after fix. | Live: anon key only, no login — `curl .../rest/v1/sponsors?select=id,company_name,invite_token&is_visible=eq.true` returned 11 rows WITH tokens (HTTP 200). |
| SPON-2 | **CRITICAL** | Sponsor | Token = permanent bearer, no expiry/rotation/revocation | `app/exhibitor/[token]/page.tsx:18-24`; `app/api/exhibitor/leads/route.ts:38-44,81-82,110-111` | Every exhibitor API resolves the sponsor purely by `.eq('invite_token', token)` via `createAdminClient()` (service role). No auth, no expiry, no rate limit, no revocation. Combined with SPON-1, an anon holder can POST/PATCH/DELETE leads and read all booth data. Even without SPON-1, a leaked link (shared in a group chat, email fwd) is game-over forever. | Add token expiry + rotation + an is_revoked flag; consider requiring login for lead PII. At minimum stop leaking the token (SPON-1). | Code read (all 5 exhibitor API routes use `createAdminClient` + `.eq('invite_token', token)`; confirmed via grep). |
| SPON-3 | **CRITICAL** | Sponsor | `sponsor_members` fully public read+write | `supabase/migrations/027_exhibitor_tables.sql:53` | `create policy public_all on sponsor_members for all using (true) with check (true)` — anyone can read booth-team PII (invited emails, roles, scan_access) AND insert/update/delete any row (grant themselves scan_access, add themselves to any booth). | Replace with owner/team-scoped policy tied to the sponsor's event owner + authed member. | Live: authed read `sponsor_leads`... actually `sponsor_members?select=*` returned rows with `invited_email` (haldoorgfx@gmail.com etc.) and `scan_access` for booths across events (HTTP 200). Policy is `using(true)`. |
| SPON-4 | **High** | Sponsor | `sponsor_resources` fully public read+write | `supabase/migrations/027_exhibitor_tables.sql:46` | `create policy public_all on sponsor_resources for all using (true) with check (true)` — anyone can read every booth's resources and insert/delete arbitrary rows (spam, defacement, malicious links). | Scope to sponsor owner for writes; public read is acceptable if intended, but writes must be gated. | Live: `sponsor_resources?select=*` returned rows across booths (HTTP 200). |
| SPON-5 | **High** | Sponsor | Mobile: booth resolves to a STRANGER'S booth (first row) | `eventera_mobile/lib/roles/sponsor/sponsor_tools_screen.dart:36-49` | `_resolveBooth()` — if the user's email doesn't match a sponsor, it returns `rows.first`, i.e. an arbitrary sponsor's booth for that event, with no team-membership check. That sponsorId flows into Lead scanner, My leads (attendee PII), Booth team, Products, Meetings. Cross-tenant PII leak inside the app. | Only return a booth the user actually owns or is a `sponsor_members` teammate of; otherwise show "no booth." | Mobile agent code read (line-cited). |
| SPON-6 | **High** | Sponsor | Mobile: lead scanner has no camera-permission handling | `eventera_mobile/lib/roles/sponsor/lead_scanner_screen.dart:67` | `MobileScanner(...)` has no `errorBuilder` (the check-in scanner does). `permission_handler` isn't even in `pubspec.yaml`. On a fresh install with camera denied/unavailable → broken black screen, no prompt. The primary sponsor tool (scan leads) fails silently. | Add camera permission request + `errorBuilder` fallback UI, matching `checkin_scanner_screen.dart`. | Mobile agent code read + confirmed no `permission_handler` dep. |
| SPON-7 | **High** | Sponsor | Mobile: booth team toggle silently reverts | `eventera_mobile/lib/roles/sponsor/booth_team_screen.dart:54-61` | `_toggle` writes `sponsor_members.scan_access` via anon client; file header admits RLS may block it. On any error it reverts state (line 61) with NO user message — toggle appears to work, then snaps back. (Note SPON-3 means it actually succeeds for anyone — a different bug.) | Route write through an authorized RPC; surface errors. | Mobile agent code read. |
| SPON-8 | **High** | Exhibitor | Mobile: dead "Request meeting" CTA + mock directory preview | `eventera_mobile/lib/roles/exhibitor/directory_preview_screen.dart:77` | `MButton('Request meeting', onTap: () {})` — empty callback, does nothing, looks tappable. Also description/category/logo never populated → preview shows almost no real booth data. | Wire the CTA or disable+label it "(preview)"; fetch real sponsor row. | Mobile agent code read. |
| SPON-9 | **High** | Exhibitor | Mobile: meeting Accept swallows all errors; no Decline | `eventera_mobile/lib/roles/exhibitor/meeting_requests_screen.dart:55-62` | `_accept` has `catch (_) {}` — RLS/network failure = silent no-op, request stays pending. There is NO Decline/Reject action at all. | Surface errors; add a Decline action. | Mobile agent code read. |
| SPON-10 | **High** | Exhibitor | Mobile: products are add-only | `eventera_mobile/lib/roles/exhibitor/booth_products_screen.dart` | No edit, delete, reorder, image upload, or featured toggle despite the model carrying `is_featured`/`imageUrl`. Controllers leaked; insert has no try/catch or `mounted` check (line 96). | Add edit/delete/reorder; dispose controllers; guard insert. | Mobile agent code read. |
| SPK-1 | **Medium** | Speaker | Mobile: two contradictory profile editors | `eventera_mobile/lib/roles/speaker/speaker_profile_screen.dart:59` vs `rbac/speaker_profile_edit_screen.dart` | One saves via `rpc('update_speaker_profile')`; the other documents that speakers CAN'T write their row via anon client (RLS) and uses `PATCH /api/speakers/{id}/profile`. If the RPC isn't deployed/SECURITY DEFINER, every Save silently fails. Two divergent editors = correctness hazard. | Delete one; standardize on the API route path. | Mobile agent code read. |
| SPK-2 | **Medium** | Speaker | Mobile: speaker Q&A is read-only | `eventera_mobile/lib/roles/speaker/session_qa_screen.dart:95` | Header literally says `Speaker · read-only`. Speaker can't mark answered, dismiss, or moderate. A "live audience Q&A" tool a speaker can't act on is hollow (table-stakes on Swapcard/Brella). | Add mark-answered / dismiss / pin for speakers. | Mobile agent code read. |
| SPK-3 | **Medium** | Speaker | Mobile: empty-state masks all load errors | `speaker_tools_screen.dart:39,81`; `session_qa_screen.dart:68,100`; and ~6 sponsor screens | Nearly every `FutureBuilder` role screen omits `_load()` try/catch AND never checks `snap.hasError`; failures render `snap.data ?? []` → "No sessions / No leads / No teammates yet." Network drops and RLS denials look identical to "you have nothing." Systemic. | Add hasError branches with retry. | Mobile agent code read (multi-file pattern). |
| SPK-4 | **Medium** | Speaker | Mobile: green room fabricates data | `eventera_mobile/lib/roles/speaker/green_room_screen.dart:38,65` | "Call time" = `startsAt - 30min` presented as real; AV contact hardcoded to `'See event team on the web'`. Placeholder masquerading as logistics data. | Pull real call time / AV contact or label as estimate. | Mobile agent code read. |
| CFP-1 | **Medium** | Speaker | CFP: no auth, no rate limit → spam | `app/api/events/cfp/route.ts:22-85` | POST accepts any submission to any open CFP with no auth and no `ratelimit` call. Anyone can flood `abstracts` for any event. Contrast with CLAUDE.md rule 6 (rate limiting expected). | Add `lib/ratelimit.ts` (IP-scoped) + optional captcha; the insert uses service role so there's no natural throttle. | Code read; no ratelimit import in the route. |
| CFP-2 | **Low** (mitigated) | Speaker | CFP: stored-XSS surface | `app/api/events/cfp/route.ts` → `app/(app)/events/[id]/abstracts/page.tsx` | Submitted `title`/`abstract`/author names are stored raw (no sanitization server-side). Mitigated because they render through React JSX (auto-escaped) and NOT via `dangerouslySetInnerHTML` in the abstract/CFP views. Risk if any future consumer (email, PDF, CSV) renders raw. | Keep escaping; sanitize on any non-JSX render path (email/PDF export). | Code read: `dangerouslySetInnerHTML` only in agenda/revenue/roster print pages + layout/editor, none in CFP/abstracts path. |
| SPON-11 | **Low** | Exhibitor | Mobile: lead detail lies about phone; unguarded mailto | `eventera_mobile/lib/roles/sponsor/lead_detail_screen.dart:2,57` | Header claims it refetches registration phone — no phone field exists. `launchUrl('mailto:')` not awaited, no `canLaunchUrl`, throws on devices w/o mail app. | Remove false claim or add phone; guard launchUrl. | Mobile agent code read. |
| SPK-5 | **Low** | Speaker | Web: `twitter_url` fetched but never rendered | `app/(public)/s/[slug]/[speakerId]/page.tsx:32,104-114` | Query selects `twitter_url` but only linkedin+website links are rendered. Dead fetch / missing social link. | Render twitter link or drop from select. | Code read. |

---

## Live prod evidence (reads only)

- **SPON-1 (anon token dump):** `curl .../rest/v1/sponsors?select=id,company_name,invite_token,is_visible&limit=6` with only the anon apikey (no bearer) → HTTP 200, returned tokens e.g. `Paystack 2167fcdd-...`, `Safaricom 3da24b8d-...`, `Cre8so aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee`. `?select=count&is_visible=eq.true` → 11.
- **Cross-tenant reach with authed user:** I can read the `Haldoor Academy` sponsor row (event `b43af1ce`) and its invite_token `d0bf4bd0-...` even though `user_event_roles?event_id=eq.b43af1ce` → `[]` (no role). Public policy, not role-scoped.
- **SPON-3:** `sponsor_members?select=*` → rows with `invited_email`, `scan_access` across booths (HTTP 200); policy `using(true)`.
- **SPON-4:** `sponsor_resources?select=*` → rows across booths (HTTP 200).
- **sponsor_leads scoping (the one good part):** `sponsor_leads?select=*` returned only leads for events I organize (1 row, "Amara Diallo" on my event `dcacc4d0`); `owner_read` policy is correctly `event_id in (events where user_id=auth.uid())`. BUT this protection is nullified in practice because the lead API reads via service role gated only by the leakable token (SPON-1/2).
- **abstracts/CFP:** `abstracts?select=...` and `call_for_papers?select=...` returned `[]` for my user (owner-scoped read looks OK); CFP privacy of submissions is fine at the DB layer.

---

## Capability gaps vs. table-stakes (Swapcard / Brella 2026)

Competitors ship these; Eventera's speaker/sponsor tooling is missing or half-built:

1. **Lead export / CRM sync** — promised in-app ("on the web") but zero mobile implementation; leads can't leave the app. Swapcard/Brella both export + CRM sync.
2. **Business-card / OCR lead capture** — Swapcard does AI OCR of business cards; Eventera only scans Eventera ticket QRs (and silently ignores any other QR — `lead_scanner_screen.dart:36`).
3. **Speaker Q&A moderation** — mark-answered, dismiss, pin. Eventera speaker Q&A is read-only (SPK-2).
4. **Decline meeting request** — no reject path (SPON-9). Brella has full 1-1 meeting accept/decline/reschedule.
5. **Booth team invite from app** — view/toggle only; "invite from the web." (`booth_team_screen.dart` empty state.)
6. **Product management** — add-only, no edit/delete/image (SPON-10).
7. **Sponsor matchmaking / meet-at-booth / AI prospecting** — Brella core features, entirely absent.
8. **Lead phone capture** — claimed in code header, not implemented (SPON-11).
9. **Co-author entry on CFP** — payload supports it, mobile hardcodes `coAuthors: []` (`cfp_screen.dart:147`).

---

## Janky-UX list

- Silent-failure epidemic: ~8 mobile role screens turn every load error into an empty state (SPK-3). Single most pervasive defect.
- Speaker profile save: transient inline "Saved"/"Could not save" string that never clears, no toast/haptic (`speaker_profile_screen.dart`).
- Speaker tools / my-leads / booth-team infinite spinner on thrown load (no try/catch resets `_loading`).
- My-leads: client-only search + no pagination — loads all leads into memory (`my_leads_screen.dart`).
- Unpadded-hour timestamps ("9/5 9:5") in `lead_detail_screen.dart:71` and `meeting_requests_screen.dart:189`.
- Likely compile error: `Switch.activeThumbColor` (`booth_team_screen.dart:117`) is not a valid API — consistent with every `roles/` file being self-labeled `DRAFT — not build-tested`.
- Exhibitor portal `layout.tsx` does zero auth — relies entirely on the (leaked) token in the page component.
- CFP abstract char counter turns red past 500 but `_submit` doesn't block over-length; server may 500 with a raw error (`cfp_screen.dart:99,278`).

---

## Systemic notes

- **`createAdminClient()` (service role) used liberally in public-facing exhibitor/CFP/sponsor routes.** Every such route must do its OWN authorization because it bypasses RLS. The exhibitor routes' only check is the leakable token; the CFP route has none beyond "is CFP open."
- **RLS policies written as `USING(true)`** (`sponsor_members`, `sponsor_resources`) are not access control. Combined with a public `SELECT *` that includes secrets (`sponsors.invite_token`), the whole sponsor subsystem is effectively public.
- **Mobile `roles/` code is uniformly `DRAFT — not build-tested`.** Treat all of it as unshipped until `flutter analyze` passes.

Sources: [Swapcard features](https://www.swapcard.com/features), [Brella](https://www.brella.io/), [Brella vs Swapcard (G2)](https://www.g2.com/compare/brella-vs-swapcard)
