# Eventera — Dashboard Unification Audit (Step 0)
Date: 2026-07-05 · Read-only, no source modified · Reference: `docs/AUDIT_REPORT.md`, `docs/CLEANUP_PLAN.md`

> Place this file at `docs/DASHBOARD_UNIFICATION_AUDIT.md` in the repo (I can only read your local folder, not write into it — copy this in, or hand it to Claude Code with the "Handoff" package).

## Executive summary

The unification is **partially done already**. A real foundation exists:
- `user_event_roles` (migration 055) — one account, many event-scoped roles (attendee/speaker/sponsor/organizer/staff), plus `profiles.platform_role` for admin.
- `lib/rbac/roles.ts` → `getUserRoles()` and `lib/rbac/sections.ts` → `getVisibleSections()` — this **is** the `getUserContext`-style single source of truth the brief asks for. It already returns booleans + event-id lists per role.
- `/api/me/roles` + `AppShell.tsx` already build **adaptive, role-gated nav** (`ROLE_NAV_ITEMS`) — Home always shown, Speaking/Sponsoring/Organizing/Admin appear only when the role flag is true.
- `/home`, `/speaking`, `/sponsoring` are genuinely native dashboard routes: inside `app/(app)/`, wrapped by `AppShell`, using `getUserRoles`/`getVisibleSections` server-side.

So Phase 2 isn't "build role resolution from scratch" — it's **finish moving the pages that were never migrated, and cut the two remaining link-outs to non-dashboard shells.**

## 1. Authenticated pages — inventory & placement

| Page | Path | Role | Status |
|---|---|---|---|
| Home (role hub) | `app/(app)/home/page.tsx` | any | ✅ Correct — native dashboard route |
| Speaking | `app/(app)/speaking/page.tsx` | speaker | ✅ Correct — native dashboard route |
| Sponsoring | `app/(app)/sponsoring/page.tsx` | sponsor | 🟡 Correct shell, but "Open portal" links to `/exhibitor/[token]` (separate shell, see §3) |
| Organizer dashboard + all `/events/[id]/*` (~55 routes) | `app/(app)/events/[id]/*`, `app/(app)/dashboard` | organizer | ✅ Correct |
| Settings (billing, api-keys, developer, integrations, white-label, webhooks) | `app/(app)/settings/*` | organizer/any | ✅ Correct |
| Notifications | `app/(app)/notifications/page.tsx` | any | ✅ Correct — and `/account/notifications` already redirects here (good precedent) |
| Team | `app/(app)/team/*` | organizer | ✅ Correct |
| Brand kit, Analytics, Templates, White-label, Studio | `app/(app)/*` | organizer | ✅ Correct |
| **My tickets** | `app/(public)/my-tickets/page.tsx` | attendee | ❌ **Misplaced.** Auth-required (`redirect('/account/login')` if no session) but lives in `(public)` group with its own `<PublicNav>` + `<MarketingFooter>` — not `AppShell`. This is the exact page named in your bug report. |
| **Saved & following** | `app/(public)/saved/page.tsx` | attendee | ❌ **Misplaced.** Auth-required, no shared shell at all (renders `SavedFollowingClient` directly, no nav/footer even). |
| **Account: profile & preferences** | `app/(public)/account/profile/page.tsx` | any | ❌ **Misplaced.** Auth-required, own `<PublicNav>`. Duplicates the concept of `(app)/settings` — should merge in as `/settings/profile` or similar, not stay a separate "account" surface. |
| **Account: onboarding setup** | `app/(public)/account/setup/page.tsx` | any | 🟡 Borderline — post-signup wizard, minimal custom nav (not `PublicNav`, not `AppShell`). Arguably fine to stay a full-screen wizard outside the shell (similar to `/onboarding` in `(app)` which is already full-screen-excepted in `AppShell`), but it should live under the dashboard group for consistency, not `(public)`. |
| Account: notifications | `app/(public)/account/notifications/page.tsx` | any | ✅ Already a redirect shim → `/notifications`. Delete once no external links remain; not blocking. |
| Account: following | `app/(public)/account/following/page.tsx` | any | ✅ Already a redirect shim → `/saved`. Same as above. |
| Attendee: my agenda | `app/(public)/e/[slug]/my-agenda/page.tsx` | attendee | ❌ **Misplaced.** Requires a resolved registration (`resolveViewerRegistrationId`); this is the attendee's own per-event schedule, currently a same-shell child of the **public** event site (`e/[slug]/layout.tsx`), not the dashboard. |
| Attendee: messages | `app/(public)/e/[slug]/messages/page.tsx` | attendee | ❌ **Misplaced.** Same pattern — per-event personal messaging thread, sits under the public event route group. |
| Attendee: networking (people, speed-networking) | `app/(public)/e/[slug]/people`, `.../speed-networking` | attendee | 🟡 Needs per-file check, same pattern as messages/my-agenda expected — resolve on approval. |
| **Speaker portal (booth/session workspace)** | *(none — speaker's own management already lives at `/speaking`, correctly placed)* | speaker | ✅ No separate speaker portal to move; `/s/[slug]/[speakerId]` is the **public-facing** profile strangers see, correctly public. |
| **Sponsor/exhibitor workspace** | `app/exhibitor/[token]/{booth,leads,resources,team}` | sponsor | ❌ **Misplaced — the core bug.** Token-gated, own layout (`ExhibitorLayout`), completely outside `AppShell`. `Sponsoring` page's "Open portal" button (`app/(app)/sponsoring/page.tsx:~line 220`) sends a logged-in sponsor here via `<Link href={/exhibitor/${inviteToken}}>` — bouncing them out of the dashboard into a separate shell, exactly like "My tickets" does. |
| Admin (`/admin/*`) | `app/admin/*` | admin/super_admin | 🟡 Structurally separate route group + own layout, but role-gated correctly by middleware. Not in scope to move per your brief (you didn't list admin as broken) — flag for a decision: fold into `(app)` with `AppShell` too, or leave as its own top-level surface? Currently NOT reachable via the adaptive sidebar's "Admin" section links going anywhere but `/admin/...` (outside `AppShell`), so admins DO get bounced out of the unified shell today. Recommend including in the move for true consistency. |

**Not yet checked file-by-file** (same public-event-route-group pattern almost certainly applies — confirm during implementation): `e/[slug]/leaderboard`, `feedback`, `waitlist` (attendee's own waitlist entry vs. public waitlist page — need to check for auth-required personal data).

## 2. KEEP-PUBLIC list — confirmed

Verified genuinely public (no auth requirement in the page itself):
- `e/[slug]` event page, `register`, `cfp`/apply flow, `schedule`, `speakers`, `sponsors`, `check-in` (public kiosk), `polls`/`q-and-a` (public view), `workshops`, `waitlist` (public join) — checkout/registration confirmed guest-safe (`assertOwnsRegistration` in `lib/attendee-identity.ts` explicitly supports unauthenticated guest registrations).
- `discover`, `events`, `events/search`, `events/city/*`, `events/cities`, `events/category/*` — marketplace discovery.
- `o/[userId]`, `s/[slug]/[speakerId]`, `x/[slug]/[sponsorId]` — public organizer/speaker/sponsor profile pages, as seen by strangers. Correct to keep public.
- `(marketing)/*`, `(auth)/*` — marketing + login/signup.
- `c/[slug]` — public personalized Eventera Card flow.

One nuance to flag: **`/exhibitor/[token]/*` is token-gated, not stranger-public** — a random visitor can't reach a specific booth's leads without the token, but it's also not the sponsor's authenticated dashboard identity. Per your principle ("stranger's view = public, logged-in user managing their own = dashboard"), the sponsor's OWN management of their booth should move into the dashboard; the token mechanism should be repurposed only for the case of inviting booth staff who don't have (or haven't created) an Eventera account — same shape as how a guest can register without an account.

## 3. Current dashboard shell — how it works

- Layout: `app/(app)/layout.tsx` → wraps all `(app)` routes in `<AppShell>` (`components/app/AppShell.tsx`, 1259 lines, client component).
- Role read: on mount, `AppShell` calls `supabase.auth.getUser()`, loads `profiles` (name/email/plan/legacy `role`), event count, site logo — then separately fetches **`/api/me/roles`** to populate `VisibleSections` (`{tickets, speaking, sponsoring, organizing, admin}` + event-id lists), which drives `ROLE_NAV_ITEMS` visibility and the organizer-only `PLATFORM_SECTIONS`.
- `/api/me/roles` (route not yet inspected line-by-line, but consumed shape matches `getVisibleSections()` 1:1) is presumably a thin wrapper calling `lib/rbac/sections.ts`.
- Sidebar swaps entirely to a **per-event nav** (`EventNavContent`, the ~55-item `EVENT_NAV_SECTIONS`) whenever the path matches `/events/[id]/...` — this is the organizer workspace pattern the brief wants attendee/speaker/sponsor pages to match structurally (they don't need the event-nav variant, just the shell + fetch pattern).
- Roles live in Postgres: `public.user_event_roles(user_id, event_id, role, status)` (migration 055) + `profiles.platform_role`. RLS present (own-row read, organizer read/manage, public directory read for published events' speaker/sponsor rows). Backfilled from existing tables by email match (registrations→attendee, speakers.email→speaker, sponsors.contact_email→sponsor, events.user_id→organizer).

**This means: no new role infrastructure is needed.** `getUserRoles`/`getVisibleSections` already are the "one role-resolution source of truth" the brief calls for.

## 4. The exact bug trace

Two confirmed link-outs from inside the dashboard to a non-dashboard shell:

1. **`my-tickets`**: `AppShell`'s `ROLE_NAV_ITEMS` has `{ href: '/my-tickets', label: 'My tickets', flag: 'tickets' }` (`components/app/AppShell.tsx`). `/my-tickets` resolves to `app/(public)/my-tickets/page.tsx`, which renders its own `<PublicNav>` + `<MarketingFooter>`, not `AppShell`. Clicking the sidebar item does a normal Next `<Link>` navigation to a page outside the `(app)` route group and its layout — the whole app chrome (sidebar, header, command palette) disappears and is replaced by the marketing-site chrome for one page, then the user has no way back except browser back or re-navigating to another `(app)` route (which reloads `AppShell`).
2. **`sponsoring` → exhibitor portal**: `app/(app)/sponsoring/page.tsx` renders correctly inside `AppShell`, but its "Open portal" button links to `/exhibitor/${inviteToken}` — a completely separate top-level route (`app/exhibitor/[token]/layout.tsx`), no sidebar, no header, token-resolved identity instead of session-resolved. Same category of bug, one level deeper (from a correctly-placed page, not the nav itself).

Contributing middleware confusion: `middleware.ts`'s `isPublicRoute` allowlist includes `/my-tickets`, `/saved`, `/home`, `/speaking`, `/sponsoring` — but per its own comment this list means "skip suspension/admin-role checks," not "no auth needed" (each page still does its own `redirect('/login')` if no session). This is not itself the navigation bug, but it does mean the middleware can't be used as a signal for "this route is dashboard vs public" — route-group membership is the only reliable signal, and `my-tickets`/`saved`/`account/*` are on the wrong side of it.

No other dashboard nav links were found pointing at `/account/*` or `/exhibitor/*` besides the two above (searched `AppShell.tsx`, `home/page.tsx`, `speaking/page.tsx`, `sponsoring/page.tsx`, `my-tickets/page.tsx` itself which also links to `/s/` and `/x/` — those are correctly-public profile links, not workspace links, so leave them).

## 5. Data model check

- **Can the system return ALL roles for a user across all events?** Yes — `getUserRoles(userId)` returns every active `user_event_roles` row plus `platformRole`; `getVisibleSections(userId)` derives the five boolean flags + per-role event-id arrays from it in one call. This already satisfies "multi-role in one place."
- **Identity linking:** attendee↔account via `registrations.attendee_email` (no `user_id` column on `registrations` — email is the only link, per migration 055's own comment) OR `attendee-identity.ts`'s ownership check at read time; speaker↔account via `speakers.email`; sponsor↔account via `sponsors.contact_email`. All three are **email-match, not FK-enforced** — an account whose email changes, or a registration under a different email than the profile's current one, silently falls out of role resolution. Not a blocker, but worth a callout: this is a soft link, not a hard one.
- **Gap:** `user_event_roles` has no confirmed path for **staff** (per-event team members) — migration 055 explicitly skips backfilling staff roles pending `events/[id]/staff` writing account-linked rows. Not in your MOVE list, so not blocking, but the `role` enum already includes `'staff'` for whenever that lands.
- **Gap:** exhibitor booth **team members** (`app/exhibitor/[token]/team/page.tsx`) — need to confirm whether booth staff who aren't the sponsor contact (i.e., invited via token, no account) are meant to keep working post-move. Recommend keeping the token flow alive as a fallback identity path (mirroring how guest registration works) while adding session-based access for the sponsor's own account.

## Proposed move list (pending your approval)

1. `app/(public)/my-tickets/*` → `app/(app)/my-tickets/*` (drop `PublicNav`/`MarketingFooter`, rely on `AppShell`).
2. `app/(public)/saved/*` → `app/(app)/saved/*`.
3. `app/(public)/account/profile/*` → fold into `app/(app)/settings/` (e.g. `/settings/profile`) — avoid keeping a parallel "account" concept once it's inside the dashboard.
4. `app/(public)/account/setup/*` → `app/(app)/onboarding-setup/*` (or merge with existing `/onboarding` if scope overlaps — needs a quick compare before deciding).
5. Delete `app/(public)/account/notifications` and `app/(public)/account/following` once confirmed nothing external links to them directly (they're already just redirects).
6. `app/(public)/e/[slug]/my-agenda`, `messages`, and (pending file check) `people`/`speed-networking` → become dashboard routes, likely `app/(app)/my-tickets/[eventId]/{agenda,messages,people}` or similar, keyed by event — needs a routing-shape decision since today they're keyed by public `slug` not the account's registration.
7. Sponsor/exhibitor workspace (`booth`, `leads`, `resources`, `team`) → `app/(app)/sponsoring/[eventId]/*`, session-resolved by role instead of token; keep `/exhibitor/[token]` alive **only** as a no-account fallback (mirrors guest checkout).
8. Fix `sponsoring/page.tsx`'s "Open portal" link to point at the new native route instead of `/exhibitor/${token}`.
9. Decide on Admin: fold `/admin/*` into `(app)`+`AppShell` for true one-shell consistency, or explicitly keep it a separate top-level surface (your call — flagging since it's currently also a link-out from the sidebar).

Nothing above touches `/e/[slug]` public pages, checkout, discovery, or marketing.

**Waiting for your approval before any code changes.**
