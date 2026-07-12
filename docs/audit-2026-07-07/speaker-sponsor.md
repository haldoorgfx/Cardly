# Eventera E2E Audit — SPEAKER & SPONSOR/EXHIBITOR personas

Date: 2026-07-07
Scope: Next.js web app + `eventera_mobile` Flutter app + live Supabase backend
Method: code walk of both journeys + authenticated live-backend probes as `cabdalla005@gmail.com` (user id `c94e0432-6f3c-4469-b9ff-be0812623146`, project `qhjvetcawsaswfkufzee`). Test writes tagged `[E2E-TEST]`; nothing deleted.

> **Verification note (important correction to an easy mistake):** All migrations `049`–`064` live in **`supabase/`** (repo root), NOT `supabase/migrations/` (which stops at `048`). They **are applied to the live database** — I confirmed `user_event_roles`, `sponsor_members`, `sponsor_leads.rating`, `exhibitor_products`, `meeting_requests`, and the RPCs `capture_lead` / `update_speaker_profile` all exist and respond on the live REST/RPC API. Any claim that "migration 055/059/060/063 does not exist" is a repo-layout artifact, not a backend reality. The real risk here is **migration-file organization**, not missing tables (see GAP-DB-1).

---

## What the market expects (research baseline)

**Speakers** (Swapcard, Brella, Eventee, Bizzabo):
1. Self-manage their own profile/bio/photo/socials, with SEO-friendly public page.
2. See their assigned sessions + schedule in one place.
3. Upload slides/materials against each session.
4. Live audience Q&A they can **see and answer/prioritize** (not just read); moderated, upvote-sorted.
5. Green room / backstage: call time, on-stage countdown, AV contact, run-of-show, backstage chat.
6. Post-session ratings & feedback visible to the speaker.
7. Automated comms: invite, CFP accept/reject, session assignment, day-of reminders.

**Sponsors/Exhibitors** (Swapcard Exhibitor Center, Brella, Bizzabo/Klik):
1. Onboarding: get invited, claim a booth, land in a workspace.
2. Booth/company profile (logo, description, products, resources, tiers).
3. Lead capture via badge/QR scan → centralized, qualifiable (tag/rating/note), with **consent**.
4. My Leads list + **export/CRM sync**.
5. Booth **team** management (invite staff, assign scan access, per-rep attribution).
6. Meeting scheduling with attendees (slots, requests, confirmations).
7. ROI/analytics: booth traffic, lead counts, meeting conversions, content views.
8. Automated comms: invite, lead notifications, meeting requests.

Sources: swapcard.com/features/event-content-session-management, swapcard.com/features/exhibitor-center, swapcard.com/features/exhibitor-sponsor-tools, eventee.com/features/live-questions, g2.com/products/brella/features.

---

# PERSONA 1 — SPEAKER

**Overall:** The speaker *workspace* (web `/speaking/[speakerId]`, mobile speaking screens) is polished and largely functional for profile + sessions + read-only Q&A + a lightweight green room. The **funnel into it** (CFP → decision → invite → role link) and the **loop out of it** (feedback/ratings back to the speaker) are the weak points, and there is a hard **role-linkage blocker** that can strand a real speaker.

## BLOCKERS

### BLK-SPK-1 — A speaker with a matching email may still have NO usable role, so mobile hides the speaker UI entirely
- **Severity:** Critical
- **Flow / evidence:**
  - Web add path grants a role only if the email already maps to an account *at add time*: `app/api/events/[id]/speakers/route.ts:64-68` (`if (parsed.data.email) { const id = await resolveAccountIdByEmail(...); if (id) upsertEventRole(... 'speaker') }`). If the person has no account yet (the common case), no role row is written and nothing re-runs later.
  - Mobile role gating reads exclusively from `user_event_roles` by `user_id`: `eventera_mobile/lib/rbac/role_service.dart:100-104`. No `speaker` role → `UserRoles.hasSpeaking == false` → the Account tab never surfaces the speaker section, so the speaker cannot reach their tools on mobile even though a `speakers` row with their email exists.
  - **Live proof:** my account is a speaker (`speakers` row `fb0bea6d…`, `email=cabdalla005@gmail.com`) yet `user_event_roles` for my user returns **only `organizer` rows** — no `speaker`. Across everything RLS lets me see there are just **2 `speaker` role rows total** (vs 24 organizer, 34 attendee), i.e. the role is populated only occasionally.
  - Unlike sponsors, there is **no speaker "claim" endpoint** (sponsors have `app/api/sponsors/claim`; speakers have nothing equivalent) — so there is no self-service recovery.
- **Why it's a wall:** Web `/speaking/[speakerId]` falls back to an email match (`lib/rbac/ownership.ts` `ownedSpeaker`), so web can still work; but **mobile is gated purely on the role row**, so a speaker added-by-email before signing up is invisible on mobile with no way to fix it themselves.
- **Solution:** (a) Add a `POST /api/speakers/claim` mirroring the sponsor claim (match `speakers.email` → upsert `speaker` role), and call it on login/account-load; and/or (b) have the mobile speaking gate also fall back to an email match against `speakers` (as the sponsoring screen already half-does), not solely `user_event_roles`.

## FRICTION

### FRIC-SPK-1 — No speaker emails at any milestone; every handoff is out-of-band
- **Severity:** High
- **Evidence:** `lib/email/index.ts` exports only `sendWelcomeEmail`, `maybeSendDownloadMilestone`, `sendCapReachedEmail`, `sendEventPublishedEmail`, `sendTeamInviteEmail`, `sendConnectionRequest/AcceptedEmail`, `sendNewMessageEmail`, `sendQAAnsweredEmail`. `lib/registration/email.ts` covers attendee/waitlist/approval only. **No** speaker-invite, CFP-received, CFP-accepted/rejected, session-assignment, or day-of-reminder template exists (grep for `speaker|cfp|abstract` in both files = zero).
- **Impact:** Organizer must tell speakers to log in and find `/speaking/[speakerId]` via Slack/WhatsApp/manual email — an undocumented step. Combined with BLK-SPK-1 this is how a speaker "cannot proceed without the organizer doing something undocumented."
- **Solution:** Add `sendSpeakerInviteEmail` (fired from the speakers POST route with a deep link to the workspace) and CFP decision emails (see FRIC-SPK-2).

### FRIC-SPK-2 — CFP submissions dead-end: no confirmation, no decision emails, no promotion to speaker
- **Severity:** High
- **Flow / evidence:** Public CFP `app/(public)/e/[slug]/cfp` → `app/api/events/cfp/route.ts:68-71` inserts into `abstracts` (`status:'pending'`) and returns. No email is sent (UI only says "we'll email decisions" — `components/abstracts/AbstractSubmissionClient.tsx`). The organizer review PATCH updates the abstract status but **does not create a `speakers` row, link an account, or email the applicant**. `abstracts.assigned_session` exists but nothing consumes it to create `session_speakers`.
- **Live proof:** tables `call_for_papers` and `abstracts` exist and respond (both empty under my RLS scope).
- **Solution:** On CFP submit → confirmation email; on accept → create `speakers` row (+ optional session link) and send accept email + workspace link; on reject → rejection email.

### FRIC-SPK-3 — Speakers can READ live Q&A but cannot answer, prioritize, or mark answered
- **Severity:** Medium (this is a headline competitor feature)
- **Evidence:** Web `components/speaker/SpeakerPortalClient.tsx` Q&A tab renders upvote-sorted questions with no reply/feature/answer control. Mobile `eventera_mobile/lib/roles/speaker/session_qa_screen.dart:2` explicitly: "speakers READ, they don't moderate" (real-time subscribe, read-only). The `qa_questions` table has `status` (`pending`/`answered`/`hidden`) and `is_featured` but **no `answer`/`answered_by` column** (verified live), so even the organizer only toggles a status — there's nowhere to store a written answer. `sendQAAnsweredEmail` exists but is triggered by the organizer moderation flow, not the speaker.
- **Solution:** Give speakers (or a session moderator role) the ability to mark answered / feature a question from their session; if written answers are desired, add an `answer_text`/`answered_by` column.

### FRIC-SPK-4 — Green room is informational only (no countdown, no AV contact, no backstage channel)
- **Severity:** Low/Medium
- **Evidence:** Web `SpeakerPortalClient.tsx` Green Room tab and mobile `eventera_mobile/lib/roles/speaker/green_room_screen.dart` both *derive* call time (`starts_at − 30min`), on-stage time and length from the session row; AV contact is a static "see the event team on the web" punt (`green_room_screen.dart:65,74`). No live status, countdown, or backstage chat.
- **Solution:** Add a live countdown + an organizer-set AV/stage-manager contact field surfaced here.

## GAPS

### GAP-SPK-1 — Speakers can never see their session ratings/feedback
- **Severity:** High (retention-critical for speakers)
- **Evidence:** `session_ratings` exists and is being written (live: a 5-star row against a real session). `event_feedback` exists. But there is **no speaker-facing view or query** for either in `SpeakerPortalClient.tsx` or any mobile speaker screen, and no aggregate ("your sessions averaged X"). Attendance counts per session are likewise not surfaced to the speaker.
- **Solution:** Add a "Feedback" tab to the speaker workspace reading `session_ratings`/`event_feedback` scoped to the speaker's sessions, plus attendance from `session_checkins`.

### GAP-SPK-2 — Two divergent mobile speaker-profile editors
- **Severity:** Low
- **Evidence:** `eventera_mobile/lib/rbac/speaker_profile_edit_screen.dart` saves via `PATCH /api/speakers/{id}/profile` (fields: name, role, company, bio, 3 socials). A second editor `eventera_mobile/lib/roles/speaker/speaker_profile_screen.dart` saves via RPC `update_speaker_profile` (fields: headline, bio, company, linkedin only). Both are live and functional (RPC confirmed live), but they diverge in fields and save-path — maintenance debt and parity risk.
- **Solution:** Consolidate to one editor/one save path.

### GAP-SPK-3 — Overly-open Q&A RLS
- **Severity:** Medium (security)
- **Evidence:** `qa_questions` policy is effectively `for all using(true) with check(true)` (migration 021). Any client with the anon key can update/delete any question, not just insert their own.
- **Solution:** Restrict UPDATE/DELETE to organizer/moderator; allow public INSERT + upvote via a scoped RPC only.

---

# PERSONA 2 — SPONSOR / EXHIBITOR

**Overall:** More complete than speakers on the *data* layer — real `sponsor_leads`, `sponsor_members` (with `scan_access`), `exhibitor_products`, `meeting_requests` tables and a `capture_lead` RPC all exist live, and there's a working **claim** flow and CSV export. But there are **two parallel portals** (legacy token `app/exhibitor/[token]` vs new `app/(app)/sponsoring/[sponsorId]`), several **DRAFT/untested** mobile screens with a dead button, **no consent** on lead capture, and **no sponsor-facing emails** — so onboarding still depends on the organizer hand-delivering a link.

## BLOCKERS

### BLK-SPN-1 — Sponsor onboarding has no delivery mechanism; access depends on an undocumented organizer step
- **Severity:** Critical
- **Flow / evidence:**
  - Organizer adds sponsor → `app/api/events/sponsors/route.ts` creates the row with an `invite_token` (UUID) and best-effort role link *only if the email already maps to an account*. **No invite email is ever sent** (no sponsor template in `lib/email/index.ts`).
  - `invite_token` is generated (verified live: every sponsor row has one) but **never surfaced to the sponsor** by any email or organizer-facing "copy invite link" affordance I could find.
  - Access therefore requires the sponsor to (1) already have an Eventera account on the matching email, (2) somehow know to visit `/sponsoring`, and (3) click **Claim** (`app/(app)/sponsoring/ClaimSponsorButton.tsx` → `POST /api/sponsors/claim`, which matches `sponsors.contact_email` → upserts `sponsor` role). The claim endpoint is solid; the problem is nobody tells the sponsor to do it.
  - **Live proof:** I own the "Cre8so (Test Booth)" sponsor by `contact_email` match, yet my `user_event_roles` had **no `sponsor` role** until/unless claim runs; only **2 `sponsor` role rows exist** across my visible scope.
- **Solution:** Send a sponsor-invite email on add (deep link to `/exhibitor/[token]` or the claim flow), and/or add a "Copy invite link" button in the organizer sponsor manager. Auto-run claim on login like a first-class onboarding step.

## FRICTION

### FRIC-SPN-1 — Lead capture has NO attendee consent
- **Severity:** High (legal/GDPR + market-table-stakes)
- **Evidence:** Web `app/api/exhibitor/leads/route.ts` accepts `attendee_name/email/company/role/rating/note` with **no consent field**; `sponsor_leads` schema (verified live) has no consent column. Mobile scanner `eventera_mobile/lib/roles/sponsor/lead_scanner_screen.dart` scans an attendee QR and opens a rating/note sheet with **no consent prompt** before writing via `rpc('capture_lead', …)`.
- **Solution:** Add a consent flag captured at scan time (and shown on the attendee-facing card/QR terms), persisted on `sponsor_leads`.

### FRIC-SPN-2 — Booth team invites send no email; teammate has no join path
- **Severity:** High
- **Evidence:** `app/api/exhibitor/team/route.ts` POST inserts a `sponsor_members` row `status:'invited'` and best-effort grants the event `sponsor` role *if the email already maps to an account* — but **sends no email**. Mobile `booth_team_screen.dart` even punts: "Invite booth staff from the Eventera web dashboard." **Live proof:** the Cre8so booth has an `invited_email=haldoorgfx@gmail.com` member with `user_id=null, status='invited'` that has clearly never been actioned.
- **Solution:** Send a team-invite email (reuse `sendTeamInviteEmail` pattern) with an accept/claim link that populates `user_id` and grants the role.

### FRIC-SPN-3 — Meetings: no attendee-facing request path, no scheduling UI, no notifications
- **Severity:** High
- **Evidence:** `meeting_requests` exists live (RLS blocks anon insert — verified 42501). Exhibitor side `app/api/exhibitor/meetings/route.ts` is PATCH-only (accept/propose/decline); mobile `meeting_requests_screen.dart` can accept/propose a time (works). But there is **no attendee-facing "Request meeting" API or form** — and the mobile booth **preview** has a literally dead button: `eventera_mobile/lib/roles/exhibitor/directory_preview_screen.dart:77` `MButton('Request meeting', … onTap: () {})`. No confirmation emails on either side.
- **Solution:** Build the attendee request form + `POST` endpoint, wire the dead button, and add request/confirm emails.

### FRIC-SPN-4 — Multiple mobile sponsor/exhibitor screens are self-labelled DRAFT / not build-tested
- **Severity:** Medium
- **Evidence:** `lead_scanner_screen.dart:5`, `my_leads_screen.dart:5`, `booth_team_screen.dart:4`, `booth_products_screen.dart:3`, `meeting_requests_screen.dart:3`, `directory_preview_screen.dart:3`, plus speaker `green_room/session_qa/speaker_tools` all carry "DRAFT — not build-tested" headers. Their backing tables/RPCs exist live (so they *should* run), but they've never been compiled/tested against the real schema.
- **Solution:** Run `flutter analyze`/build, exercise each against live data, remove DRAFT headers.

### FRIC-SPN-5 — Stale RLS assumption in mobile sponsoring screen
- **Severity:** Low
- **Evidence:** `eventera_mobile/lib/rbac/sponsoring_screen.dart:119-121` comment says "only the event owner can read sponsor_leads, so on the sponsor path this quietly returns nothing." Migration `059_sponsor_lead_capture.sql` (live) adds sponsor+team read policies, so the comment/behavior is outdated and needlessly hides the lead count from legitimate sponsors.
- **Solution:** Update the query to trust the 059 policy and show lead counts.

## GAPS

### GAP-SPN-1 — No sponsor ROI/analytics anywhere
- **Severity:** Medium/High (this is the sponsor's whole reason to pay)
- **Evidence:** No booth-view counter, lead-count trend, meeting-conversion, or content-view metric in `app/(app)/sponsoring/[sponsorId]/*` or `app/api/exhibitor/*`. Products have an `opens`/traffic notion only on `sponsor_resources` (an `opens` column) but no dashboard reads it. Competitors lead with this.
- **Solution:** A booth analytics tab: profile views, lead count over time, meeting conversions, resource opens.

### GAP-SPN-2 — Resources tab has no upload/management API
- **Severity:** Medium
- **Evidence:** `app/(app)/sponsoring/[sponsorId]/resources/page.tsx` reads `sponsor_resources`, but there is no `POST/PATCH/DELETE` route under `app/api/exhibitor/resources` (dir absent; live table `exhibitor_resources` doesn't exist — resources use `sponsor_resources` from migration 027). Upload flow is not wired.
- **Solution:** Add a resources management API + upload (Supabase Storage) and surface it in the tab.

### GAP-SPN-3 — Two parallel exhibitor systems with no deprecation plan
- **Severity:** Low/Medium
- **Evidence:** Legacy token portal `app/exhibitor/[token]/*` (anonymous, invite_token-gated) and new auth workspace `app/(app)/sponsoring/[sponsorId]/*` (role/email-gated) both exist, share tab components, and both are live. CLAUDE.md still documents an `x/[code]` token portal; the actual public read-only page is `app/(public)/x/[slug]/[sponsorId]`. Three overlapping surfaces invite drift.
- **Solution:** Pick one access model (recommend auth workspace + email/token bridge), redirect the others, update CLAUDE.md.

### GAP-SPN-4 — Public booth page is display-only ("drop your card" missing)
- **Severity:** Low
- **Evidence:** `app/(public)/x/[slug]/[sponsorId]/page.tsx` shows company/tier/products/offerings but offers attendees no "leave my details / I'm interested" action (which would be the inbound lead complement to the scanner).
- **Solution:** Add an attendee "share my card with this booth" button writing a consented `sponsor_leads` row.

---

# CROSS-CUTTING

### GAP-DB-1 — Migration files split across two directories; sequence gap; ad-hoc SQL
- **Severity:** Medium (operational/repro risk)
- **Evidence:** `supabase/migrations/` ends at `048`; migrations `049`–`064` (plus `070`) live loose in `supabase/` root alongside `pending_migrations_to_run.sql`, `RUN_ALL_TICKETING_FIXES.sql`, `fix_generak_typo.sql`, `promo_banners.sql`. `056` is absent from the sequence. All are applied to the live DB, but **a fresh provision from `supabase/migrations/` alone would produce a broken app** missing speaker/sponsor role tables, lead capture, products, meetings and the RPCs. This is exactly what made two of the audit sub-passes wrongly report these tables as "missing."
- **Solution:** Consolidate everything into `supabase/migrations/` in applied order, fill/annotate the 056 gap, and remove/fold the ad-hoc SQL files.

---

# Summary tables

## Blockers
| ID | Persona | Severity | One-line |
|----|---------|----------|----------|
| BLK-SPK-1 | Speaker | Critical | Email-added speaker gets no role → invisible on mobile, no claim to recover |
| BLK-SPN-1 | Sponsor | Critical | No invite email/link delivery; access needs undocumented "Claim" step |

## Friction
| ID | Persona | Severity | One-line |
|----|---------|----------|----------|
| FRIC-SPK-1 | Speaker | High | Zero speaker emails (invite/decision/assignment/reminder) |
| FRIC-SPK-2 | Speaker | High | CFP dead-ends: no confirm/decision email, no promotion to speaker |
| FRIC-SPK-3 | Speaker | Medium | Live Q&A read-only for speakers; no answer/feature; no answer column |
| FRIC-SPK-4 | Speaker | Low/Med | Green room is static info, no countdown/AV contact/backstage chat |
| FRIC-SPN-1 | Sponsor | High | Lead capture has no attendee consent (GDPR) |
| FRIC-SPN-2 | Sponsor | High | Team invites send no email; teammate has no join path |
| FRIC-SPN-3 | Sponsor | High | Meetings: no attendee request path/UI, dead mobile button, no emails |
| FRIC-SPN-4 | Sponsor/Spk | Medium | Many mobile role screens are DRAFT/untested |
| FRIC-SPN-5 | Sponsor | Low | Stale RLS comment hides lead count from valid sponsors |

## Gaps
| ID | Persona | Severity | One-line |
|----|---------|----------|----------|
| GAP-SPK-1 | Speaker | High | Speakers can't see session ratings/feedback/attendance |
| GAP-SPK-2 | Speaker | Low | Two divergent mobile profile editors |
| GAP-SPK-3 | Speaker | Medium | qa_questions RLS is fully open (update/delete) |
| GAP-SPN-1 | Sponsor | Med/High | No booth ROI/analytics at all |
| GAP-SPN-2 | Sponsor | Medium | Resources tab has no upload/management API |
| GAP-SPN-3 | Sponsor | Low/Med | Two/three parallel exhibitor surfaces, no deprecation plan |
| GAP-SPN-4 | Sponsor | Low | Public booth page has no attendee "drop card" |
| GAP-DB-1 | Both | Medium | Migrations split across dirs; fresh provision would break these roles |

## Web ↔ mobile parity
- **Speaker:** profile edit (both), sessions (both), Q&A read-only (both), green room (both, thin). Mobile adds nothing web lacks; web is source of truth (photo, slides, feedback all "on web"). Feedback/ratings absent on both.
- **Sponsor:** booth/products/leads/team/meetings exist on both. Mobile lead **scanner** is the one mobile-only capability (web has no camera scan) but it's DRAFT. Export is web-only. ROI absent on both.
