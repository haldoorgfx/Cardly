# Dashboard Unification Audit (Step 0)

Date: 2026-07-05
Scope: Consolidate all authenticated user pages into ONE role-based dashboard. Refactor only — no new features.

---

## 1. Inventory of authenticated pages

### 1a. Misplaced — authenticated own-data pages living OUTSIDE `app/(app)` → MOVE into dashboard

| Route | File | Auth today | Role | Verdict |
|---|---|---|---|---|
| `/my-tickets` | `app/(public)/my-tickets/page.tsx` | `getUser()` + redirect to login | attendee | **MOVE** → `app/(app)/my-tickets`. Own tickets, login required, but renders in the public shell (PublicNav, no sidebar). |
| `/my-tickets/[id]/transfer` | `app/(public)/my-tickets/[id]/transfer/` | login required | attendee | **MOVE** with parent. (No `[id]/page.tsx` — detail lives inside the list page.) |
| `/saved` | `app/(public)/saved/page.tsx` | `getUser()` + redirect | attendee | **MOVE** → `app/(app)/saved` ("My events / saved events"). |
| `/account/profile` | `app/(public)/account/profile/page.tsx` | `getUser()` + redirect | all | **MOVE** → merge into `app/(app)/settings` (profile section). |
| `/account/setup` | `app/(public)/account/setup/page.tsx` | login required | all | **MOVE** → dashboard onboarding (or fold into `(app)/onboarding` which already exists). |
| `/account/notifications` | `app/(public)/account/notifications/page.tsx` | redirect stub | — | Already redirects to `(app)/notifications`. Keep stub, no work. |
| `/account/following` | `app/(public)/account/following/page.tsx` | redirect stub | — | Already redirects to `/saved`. Retarget stub to the new dashboard route. |
| `/exhibitor/[token]/*` (booth, leads, resources, team) | `app/exhibitor/[token]/` | invite **token only**, no login | sponsor | **MOVE the workspace** → `app/(app)/sponsoring/*` for logged-in sponsors. Keep the token route as a thin entry that (a) still works for tokenholders without accounts, or (b) redirects logged-in sponsors of that event into the dashboard. Decision needed — see Open Questions. |
| `/e/[slug]/leads`, `/e/[slug]/lead-scanner` | `app/(public)/e/[slug]/leads`, `.../lead-scanner` | **none / client-side** — leads page fetches with admin client, no viewer check found | sponsor | **MOVE** → sponsor section of dashboard. Also a security gap today (see §6). |
| `/e/[slug]/check-in` | `app/(public)/e/[slug]/check-in/page.tsx` | `getUser()` + redirect | organizer/staff | **MOVE** → it's a staff tool, not a stranger page. Note organizer check-in already exists at `(app)/events/[id]/check-in` — likely consolidate. |

### 1b. Hybrid — attendee in-event tools under `/e/[slug]/*` (guest-token OR session)

These resolve the viewer via `lib/attendee/resolveViewerRegistration.ts`: accepts a `?reg=` registration UUID or `qr_code_token` **guest link** (no account), else falls back to the logged-in user's registration.

Routes: `/e/[slug]/my-agenda`, `messages`, `speed-networking`, `community`, `q-and-a`, `polls`, `leaderboard`, `feedback`, `workshops`, plus the `?tab=network|schedule|speakers|sponsors` tabs of the event hub.

Verdict: **HYBRID — keep the public guest-token path** (guests register without accounts and access via QR/guest link; breaking this violates the "never break checkout/registration" rule). **Add native dashboard routes for logged-in attendees** (e.g. `app/(app)/my-tickets/[eventId]/agenda|messages|networking`) that reuse the same client components, and rewire all dashboard/logged-in links to the dashboard versions. The `/e/` versions remain for guests.

### 1c. Already correctly placed in `app/(app)`

`/home`, `/dashboard`, `/events/*` (full organizer suite, ~40 subpages), `/analytics`, `/brand`, `/team`, `/templates`, `/studio`, `/white-label`, `/notifications`, `/onboarding`, `/settings/*` (api-keys, billing, developer, integrations, reset-password, webhooks, white-label), `/speaking`, `/sponsoring`, admin pages (permission-guarded).

Note: `(app)/speaking` and `(app)/sponsoring` exist but are **summary cards that link OUT** — speaking links to public `/s/[slug]/[speakerId]` and `/e/[slug]/cfp`; sponsoring links to `/exhibitor/[token]`. The shells are in the right place; the workspaces behind them are not.

### 1d. "My Eventera Cards"

- Attendee card designer: `app/c/[slug]` + `app/c/[slug]/card/[cardId]` — **public, no auth**, guest-accessible by design (invitees personalize a card from a shared link). KEEP the public designer.
- Organizer card editor: `(app)/events/[id]/eventera-card` — already in dashboard. ✓
- **There is currently NO "my cards" collection page anywhere.** A logged-in attendee has no list of their own cards. Creating one is arguably a new surface, not a move. Flagged in Open Questions — recommend deferring or treating as the thinnest possible list linking to existing `/c/` card URLs.

---

## 2. KEEP-PUBLIC list — confirmed

| Page | Route | Confirmed public? |
|---|---|---|
| Public event page | `/e/[slug]` | ✓ Admin-client fetch of published event, no auth. |
| Registration/checkout | `/e/[slug]/register`, `waitlist`, `apply` | ✓ No auth; pre-fills for logged-in users but works logged out. **Do not touch.** |
| Discovery/marketplace | `/discover/*`, `/events/*`, `/search` | ✓ Public. |
| Marketing | `(marketing)/*` | ✓ Public. |
| Public speaker directory | `/s/[slug]/[speakerId]` and event-hub speakers tab | ✓ Read-only public view. Stays. |
| Public sponsor showcase | `/x/[slug]/[sponsorId]` and event-hub sponsors tab | ✓ Read-only public view. Stays. |
| Card designer (invite link) | `/c/[slug]`, `/c/[slug]/card/[cardId]` | ✓ Guest flow. Stays. |
| CFP submission | `/e/[slug]/cfp` | ✓ Public form (prospective speakers may have no account). Stays. |
| Login/signup | `(auth)/*`, `/account/login` | ✓ Stays. |
| Organizer public profile | `/o/[userId]` | ✓ Stays. |

Guest-token attendee tools (§1b) also stay reachable publicly — that's the "stranger with a guest QR link" path.

---

## 3. Current dashboard map

- **Layout:** `app/(app)/layout.tsx` (7 lines) → renders `components/app/AppShell.tsx` (~1,259 lines, client component). Desktop fixed 240px sidebar; mobile drawer; event-context nav when inside `/events/[id]/*`.
- **Nav visibility:** `AppShell` fetches `GET /api/me/roles` → `VisibleSections` flags `{ tickets, speaking, sponsoring, organizing, admin }`. `ROLE_NAV_ITEMS` (AppShell.tsx ~line 171) filters on these flags. Platform/Workspace sections require `organizing`; admin section requires `admin` or legacy `profiles.role`.
- **Role resolution:** `lib/rbac/roles.ts` → `getUserRoles(userId)` returns `{ platformRole, eventRoles: [{event_id, role, status}] }`. `lib/rbac/sections.ts` → `getVisibleSections()` adds email-fallback for pre-migration attendees and legacy-admin fallback. Uses `createAdminClient()` (service role) — callers must authenticate first.
- **DB:** `supabase/055_user_event_roles.sql` — `user_event_roles (user_id, event_id, role ∈ attendee|speaker|sponsor|organizer|staff, status)`, unique per (user,event,role), RLS enabled. `profiles.platform_role ∈ user|admin|super_admin`. Backfilled from `events.user_id`, `registrations.attendee_email`, `speakers.email`, `sponsors.contact_email`.
- **Data-loading pattern (organizer pages):** async server component → `createClient()` + `getUser()` → redirect if no user → `getUserRoles()` → `createAdminClient()` for parallel `Promise.all` fetches → render. `export const dynamic = 'force-dynamic'`. Moved pages must follow this pattern.
- **Prior work:** `UNIFIED_DASHBOARD_PLAN.md` — Wave 0 (roles foundation) done; Wave 1 (write-path parity) partial; Waves 2–5 (adaptive shell, merge surfaces, retire portals, mobile) not done. This refactor executes Waves 2–4.

---

## 4. The "My tickets" bug — exact trace

The nav item is a **cross-shell link**: it points at a route in the `(public)` route group, which has a different layout (`app/(public)/layout.tsx` is a bare `<main>` and the page renders `PublicNav`/MarketingNav). Clicking it unmounts AppShell entirely. The page itself requires login — it's an authenticated page wearing the public shell.

Full bug list (dashboard links to own-data pages outside the dashboard):

| # | Source | Target | Fix |
|---|---|---|---|
| 1 | `components/app/AppShell.tsx:171` — nav item "My tickets" | `/my-tickets` (public group) | Point to new `(app)/my-tickets` |
| 2 | `app/(app)/home/page.tsx:33` — "My tickets & agenda" card | `/my-tickets` | Same |
| 3 | `app/(app)/sponsoring/page.tsx:236` — "Open portal" | `/exhibitor/[token]` (bare token portal, no shell, no login check) | Render sponsor workspace natively under `(app)/sponsoring/[...]` |
| 4 | `app/(app)/speaking/page.tsx:301` | `/s/[slug]/[speakerId]` public profile | Speaker profile *management* becomes a dashboard route; keep a secondary "view public profile" link |
| 5 | `app/(app)/speaking/page.tsx:381` | `/e/[slug]/cfp` | Legitimate (public form) — keep, but label as external/public |
| 6 | Any logged-in-attendee links into `/e/[slug]/my-agenda|messages|...` from tickets/home | public hybrid pages | Point logged-in users to new dashboard equivalents |

Legitimate external links (keep): "View public event page", public speaker/sponsor profile *view* links, CFP form.

---

## 5. Data model check — multi-role support

**Can the system return ALL roles for a user across all events? Yes.** `getUserRoles(userId)` already returns every active `(event_id, role)` pair in one call — attendee at A, speaker at B, organizer of D simultaneously. Foundation is solid.

**Gaps (must fix in implementation):**

1. **Registration confirm does NOT upsert `user_event_roles(attendee)`** — logged-in attendees are still found via email fallback in `sections.ts`. Fix in the role-resolution commit (this is correction, not a feature).
2. **Staff assignments not written** to `user_event_roles`.
3. **Sponsor identity is fuzzy** — matched by `sponsors.contact_email` ilike + token. Exhibitor portal is token-only, no user link. Moving the sponsor workspace in-dashboard requires the role row (backfill exists; write-path on sponsor claim/invite-accept is partial).
4. **Speaker identity** — `speakers.email` match + role upsert on add-with-email exists. OK.
5. `types/database.ts` doesn't include `user_event_roles` (queries cast to `any`). Acceptable for now, noted.

**Proposed `getUserContext(userId)`** (implementation step 1) wraps `getUserRoles` + event details into `{ roles, asOrganizer[], asAttendee[], asSpeaker[], asSponsor[], platformRole }` — one server-side call feeding shell + pages. `lib/rbac/` is the natural home.

---

## 6. Security findings (fix during access-control commit)

- `/api/speakers/[speakerId]/profile` and `/api/sponsors/[sponsorId]/profile` — **no ownership/auth validation found**; any caller can modify any speaker/sponsor profile. Must gate by session + role.
- `/e/[slug]/leads` fetches with the admin client and no visible viewer check — sponsor leads may be exposed. Must gate.
- `/exhibitor/[token]` — bearer-token portal with no expiry/user binding. Acceptable only if intentionally kept for account-less sponsors; otherwise bind to login.
- Server-side role checks on every new dashboard route (attendee can't open `/sponsoring/...` by URL, etc.) — implementation step 8.

---

## 7. Proposed commit sequence (post-approval)

1. **Role resolution** — `getUserContext()` in `lib/rbac/`; fix registration-confirm attendee-role write; extend `/api/me/roles` payload. `pnpm build`.
2. **Attendee pages** — move `my-tickets`, `saved`, `account/profile→settings`, `account/setup`; dashboard routes for logged-in attendee event tools (agenda/messages/networking) reusing existing client components; `/e/` guest paths untouched. Old routes become redirects for logged-in users.
3. **Speaker** — native `(app)/speaking` workspace (sessions, profile edit, speaking events); public `/s/` view untouched.
4. **Sponsor** — native `(app)/sponsoring` workspace (booth, leads, resources, team) reusing exhibitor components; token portal kept as thin entry/redirect (pending Open Question 1).
5. **Settings** — consolidate account controls under `(app)/settings`.
6. **Navigation** — AppShell nav generated from `getUserContext`; rewire every own-data link to internal routes.
7. **Access control** — server-side role guards on all moved routes; fix §6 API holes.

Each commit: `pnpm build` must pass; report what moved + what to test.

---

## 8. Open questions (need your call before implementation)

1. **Exhibitor token portal** — keep token access working for sponsors without accounts (recommended: keep, redirect logged-in sponsors to dashboard), or kill tokens and force login?
2. **"My Eventera Cards"** — no such page exists today. Build a minimal list page in the dashboard (thin, links to existing `/c/` cards), or defer as out-of-scope (new feature)?
3. **`/e/[slug]/check-in`** — consolidate into the existing organizer `(app)/events/[id]/check-in`, or keep as a separate staff-lite route moved into `(app)`?
4. **Old public URLs after the move** (`/my-tickets`, `/saved`, `/account/profile`) — permanent redirects to the new dashboard routes (recommended), or 404?

**STOPPING HERE. Awaiting approval before any code changes.**
