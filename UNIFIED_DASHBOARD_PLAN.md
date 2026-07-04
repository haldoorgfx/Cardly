# Unified Dashboard Plan — one account, many event-scoped roles

**Status:** Foundation landed (migration `055_user_event_roles.sql` + `lib/rbac/roles.ts`). This doc is the staged plan to fold the four portals into ONE adaptive dashboard. **No portal refactor has happened yet** — this is the map a follow-up wave executes against.

---

## 1. The problem today: four disconnected portals

A single human can be an attendee at one event, a speaker at another, a sponsor at a third, and the organizer of a fourth — but Eventera makes them log into (or token into) four different surfaces to see those hats:

| Portal | Route(s) | Auth model | What it offers |
|---|---|---|---|
| **Organizer** | `app/(app)/dashboard`, `app/(app)/events/[id]/*`, `app/(app)/analytics`, `app/(app)/brand`, `app/(app)/team`, `app/(app)/settings/*`, `app/(app)/white-label`, `app/(app)/templates` | Authenticated, `events.user_id = auth.uid()`. Full sidebar in `components/app/AppShell.tsx`. | Events list + stats, the full per-event workspace (tickets, registrations, agenda, speakers, sponsors, check-in, analytics, revenue, copilot…), portfolio analytics, brand kit, team, billing, white-label, developer/API. |
| **Attendee** | `app/(public)/account/*` (profile, notifications, following, setup, login), `app/(public)/my-tickets/*`, `app/(public)/saved`, `app/(public)/discover` | Authenticated attendee (`profiles.account_type='attendee'`), matched to registrations by **email**. | Ticket wallet + transfer, saved events, followed organizers, discovery, profile, notification prefs (`profiles.notification_prefs`). |
| **Speaker** | `app/(public)/s/[slug]/[speakerId]`, `app/(public)/e/[slug]/speakers/*` | Public profile page; logged-in path keyed off `speakers.email` (migration 039) — surfaces on a `/home`-style "Speaking" section. Also token-reachable. | Public speaker profile, sessions the speaker is on. No real authed workspace yet — this is the thinnest portal. |
| **Sponsor / Exhibitor** | `app/exhibitor/[token]/*` (overview, booth, leads, resources, team), public booth at `app/(public)/x/[slug]/[sponsorId]` and `app/(public)/e/[slug]/sponsors/*` | **Token-gated** via `sponsors.invite_token` (migration 025). No account link at all today. `components/exhibitor/ExhibitorShell.tsx` with tabs: Overview, Booth, Leads, Resources, Team. | Lead scanner + scoring, booth editing, downloadable resources, exhibitor team, lead stats (hot/warm/cold). |

**The wedge that fixes it:** `user_event_roles` gives every account a list of `{event_id, role, status}`. `getUserRoles()` resolves it. The dashboard nav becomes a function of that list.

---

## 2. Target: one adaptive shell

One authenticated home (proposed `app/(app)/home`, or the existing `/dashboard` promoted to a role-aware hub). A single left nav (desktop) / bottom-tab + Account list (mobile). Sections appear **only if the account holds the matching role somewhere**:

| Unified nav section | Lights up when `getUserRoles()` contains… | Folds in today's… |
|---|---|---|
| **My tickets & agenda** | any `attendee` role (or any registration by email) | `/my-tickets`, `/saved`, personal agenda, Eventera Card wallet |
| **Speaking** | any `speaker` role | `/s/[slug]` authed view, sessions, abstract/CFP submissions |
| **Sponsoring** | any `sponsor` role | `/exhibitor/[token]` (overview, booth, leads, resources, team) — now account-reachable |
| **Organizing** | any `organizer` role | current `/dashboard` events list + `/events/[id]/*` workspace + `/analytics` + `/brand` |
| **Admin** | `platform_role in ('admin','super_admin')` | `app/admin/*` |
| **Profile / Settings / Notifications / Card / Resources** | always (one merged surface each) | de-duplicated from `account/*` **and** `settings/*` |

**Shared, merged-to-one:**
- **Profile** — merge `account/profile` + organizer profile bits into one editor writing `profiles`.
- **Settings** — merge `account/*` prefs with `(app)/settings/*` (billing, developer, integrations, white-label stay organizer-gated sub-tabs).
- **Notifications** — one center backed by `profiles.notification_prefs` + `notifications` table (already has mobile RLS from 046). Fold `account/notifications` + `(app)/notifications`.
- **Card** — the Eventera Card wallet/experience (`c/[slug]`), surfaced once under "My tickets".
- **Resources** — merge exhibitor `ResourcesTab` + any event resources into one role-scoped resources view.

---

## 3. Components to reuse (don't rebuild)

- **`components/app/AppShell.tsx`** — the canonical authed shell + nav. Extend its `USER_NAV` with the role-gated sections above; it already has the brand-correct forest sidebar, mobile menu, and search.
- **`components/exhibitor/*Tab.tsx`** (Overview/Booth/Leads/Resources/Team) — reuse verbatim inside "Sponsoring"; only the data-fetch entry changes from `invite_token` → `sponsor_id` resolved via `user_event_roles`.
- **`app/(app)/dashboard/EventCard.tsx` / `EventRow.tsx`** — reuse for the "Organizing" list.
- **`app/(public)/my-tickets` + `saved`** cards — reuse for "My tickets & agenda".
- **shadcn primitives** in `components/ui/*` — tabs/badge/card/dialog as-is.
- **`lib/rbac/roles.ts`** — the ONLY gating source. Nav renders from `getUserRoles(user.id)`; no ad-hoc `role ===` checks scattered in pages.

---

## 4. Nav gating logic

```
const roles = await getUserRoles(user.id);
const kinds = roleKinds(roles);            // Set<EventRole>
show "My tickets & agenda"  if kinds.has('attendee') || hasAnyRegistration
show "Speaking"             if kinds.has('speaker')
show "Sponsoring"           if kinds.has('sponsor')
show "Organizing"           if kinds.has('organizer')
show "Admin"                if roles.platformRole !== 'user'
```

Per-section content is scoped with `eventsWithRole(roles, 'speaker')` etc. Server components call the resolver; the shell receives a plain `visibleSections` prop so the client nav stays dumb.

---

## 5. Migration / rollout order

**Wave 0 — Foundation (DONE):** `055` table + backfill + `platform_role`; `lib/rbac/roles.ts`. No UI change, no behavior change. Ships dark.

**Wave 1 — Write path parity:** make the four flows WRITE `user_event_roles` going forward so the table stays live without depending on backfill:
- Registration confirm → upsert `attendee` role (when the registrant has/creates an account).
- Organizer create event → upsert `organizer` role (belt-and-suspenders; backfill already covers existing).
- Speaker add-with-email → upsert `speaker` role.
- Sponsor invite accept / contact_email match → upsert `sponsor` role.
- `events/[id]/staff` → upsert `staff` role (this is what enables the staff backfill that 055 deliberately deferred).

**Wave 2 — Adaptive shell (read-only):** extend `AppShell` nav from `getUserRoles`. New sections route to *existing* pages first (Organizing → `/dashboard`, Sponsoring → exhibitor components fed by account, etc.). Nothing is deleted yet — old routes still work.

**Wave 3 — Merge shared surfaces:** collapse Profile/Settings/Notifications/Card/Resources to one each; redirect old routes (`account/profile` → unified profile) with 301s.

**Wave 4 — Retire portals:** turn `/exhibitor/[token]` into a thin redirect for logged-in sponsors (keep token path for not-yet-registered exhibitors); fold `account/*` fully; remove dead nav.

**Wave 5 — Mobile parity:** mirror sections as Account sub-lists / bottom tabs (see §7).

---

## 6. Risks

1. **Email-based identity is fuzzy.** Backfill maps attendees/speakers/sponsors by `email`. A person who registered with a different email than their account won't be linked. *Mitigation:* Wave 1 write-path captures the account id at the moment of action; add a "claim this role" flow keyed off verified email.
2. **RLS recursion.** Policies on `user_event_roles` reference `events`. Handled via the `is_event_organizer` / `is_event_published` SECURITY DEFINER helpers (pinned `search_path`). Any new policy that touches another RLS-protected table must use the same pattern.
3. **Two role columns on `profiles`.** `role` (legacy, includes `studio`) vs new `platform_role`. Keep `platform_role` as the authority source for the Admin gate; leave `role` for existing permission code (`lib/auth/permissions.ts`) until a later consolidation. Don't let them drift — a follow-up should make `role` derive from `platform_role` + plan.
4. **Token vs account for exhibitors.** Exhibitors currently need no account. Don't break the token path; the unified "Sponsoring" section is an *addition* for logged-in sponsors, not a replacement of `invite_token` access.
5. **Service-role reliance.** `getUserRoles` uses the admin client (bypasses RLS). Every caller MUST authenticate first. The RLS policies exist so the mobile/client anon path is still safe.
6. **types/database.ts is frozen** for now, so `user_event_roles` queries cast to `any` at the boundary. Regenerate types in a later, isolated PR.

---

## 7. Mobile equivalent

Mobile has no left sidebar; the same `getUserRoles` output drives which **Account list rows / bottom-tab entries** appear:

- **Bottom tabs (max ~5):** Home, Tickets, Discover, Notifications, Account. "Home" becomes the role hub.
- **Account screen sub-lists light up per role:** "Speaking", "Sponsoring", "Organizing", "Admin" render only when the corresponding kind is present — identical predicate to desktop (`kinds.has(...)`, `platformRole !== 'user'`).
- **Notifications** already has mobile RLS (migration 046) and reads own-row directly; reuse as-is.
- Sponsoring on mobile surfaces the lead scanner first (highest-value on-site action); Speaking surfaces "my sessions"; Organizing deep-links into the event workspace.

---

## Executive summary

Eventera currently splits a single person's relationships to events across four disconnected portals — organizer (`/dashboard`), attendee (`/account`, `/my-tickets`), speaker (`/s`), and token-gated exhibitor (`/exhibitor/[token]`) — because roles were never modeled as data on the account. This foundation wave adds a `user_event_roles` table (one account → many `{event_id, role, status}` rows), backfilled from real columns (`events.user_id` for organizers, `registrations.attendee_email` for attendees, `speakers.email` for speakers, `sponsors.contact_email` for sponsors), plus a global `platform_role` on `profiles` for the Admin gate, all behind recursion-safe SECURITY-DEFINER RLS. A new `lib/rbac/roles.ts` resolver (`getUserRoles`, `hasRole`, `isOrganizerOf/SpeakerAt/SponsorAt`, `isAdmin`) is the single source of truth that a follow-up will use to drive one adaptive shell — reusing the existing `AppShell` nav and exhibitor tab components — where "My tickets & agenda", "Speaking", "Sponsoring", "Organizing", and "Admin" each light up only when the account holds that role, on both web (left nav) and mobile (Account sub-lists). Rollout is staged (write-path parity → read-only adaptive nav → merge shared surfaces → retire old portals → mobile), so nothing breaks and every step is independently shippable.
