# Eventera — Roles & Access Model (RBAC)

This is the correctness spec. Every screen is gated by it; every endpoint enforces it. Ship it as `@eventera/rbac` and import it on **both** client (to hide UI) and server (to authorize). The client hides; the server decides.

## 1. Core idea

- An **account** is one identity (email/Google). It is not "an attendee" or "an organizer" — it can be several things at once.
- A **mode** is a view choice made at login / in Profile: `attend` or `organize`. It changes which shell you see, not who you are.
- A **role** is a grant scoped to a **resource** (usually an event, sometimes a session or booth). Roles are additive. Assigning most roles happens on the web (`eventera.so`); the mobile app reflects them.

## 2. Roles

| Role | Scope | Granted by | Unlocks |
|---|---|---|---|
| `attendee` | event | self (registration) | Attend baseline: card, schedule, networking, feedback |
| `speaker` | event (+ their sessions) | organizer, on web | Speaker tools section inside Attend |
| `sponsor` | event (+ their booth) | organizer, on web | Sponsor tools section inside Attend |
| `sponsor_teammate` | booth | sponsor owner (mobile) | Lead scanner into that booth's shared pool (revocable) |
| `staff` | event (+ assigned door) | organizer, on web/mobile | Organize mode, **limited**: scanner + attendee list only |
| `organizer` | event | owner | Organize mode, full on-site feature set |
| `owner` | event / workspace | account that created it | Everything, incl. staff & role management, settings |

A single person at one event can simultaneously be `attendee` + `speaker` + `sponsor` + `staff`. The UI stacks their entry points; nothing is mutually exclusive.

## 3. Permission matrix (mobile)

`can(user, action, resource)` — resource carries the eventId (and sessionId/boothId where relevant).

### Attend mode
| Capability | attendee | speaker | sponsor | notes |
|---|:--:|:--:|:--:|---|
| Browse/register/checkout | ✅ | ✅ | ✅ | baseline for anyone |
| Own Eventera Card, schedule, networking, feedback | ✅ | ✅ | ✅ | roles never remove baseline |
| See **Speaker** role pill + "Speaker tools" | — | ✅ | — | only if `speaker@event` |
| My Sessions / Session detail / **read-only** Audience Q&A | — | ✅ | — | Q&A scoped to *their* sessions |
| Edit own speaker profile (light) | — | ✅ | — | full mgmt on web |
| Green room / logistics | — | ✅ | — | their sessions only |
| See **Sponsor** role pill + "Sponsor tools" | — | — | ✅ | only if `sponsor@event` |
| My Booth (light edit) | — | — | ✅ | full mgmt on web |
| **Lead Retrieval** scanner | — | — | ✅ | writes to booth pool |
| My Leads / Lead detail (their booth) | — | — | ✅ | scoped to booth |
| Manage booth team & scan access | — | — | owner only | teammate can scan, not manage |

### Organize mode
| Capability | staff | organizer | owner |
|---|:--:|:--:|:--:|
| Enter Organize mode | ✅ | ✅ | ✅ |
| QR check-in scanner | ✅ | ✅ | ✅ |
| Scan results (success/dupe/invalid) | ✅ | ✅ | ✅ |
| Attendee list + search + manual check-in | ✅ | ✅ | ✅ |
| Session/room check-in | ✅ | ✅ | ✅ |
| **Live stats dashboard** | ❌ | ✅ | ✅ |
| **Walk-in registration** | ❌ | ✅ | ✅ |
| **Announcements / push** | ❌ | ✅ | ✅ |
| **Event settings** (offline, badges, windows) | ❌ | ✅ | ✅ |
| **Staff & roles** management | ❌ | ✅* | ✅ |
| Assign organizer / transfer ownership | ❌ | ❌ | ✅ |

\* organizers can invite staff; only owner manages other organizers/ownership.

**Staff limited view is a real, tested state** (mock O11): the two organizer-only actions render as locked rows, and the Stats tab is disabled. The API must 403 a staff token hitting `/stats`, `/walk-in`, `/announcements`, `/settings`, `/staff` even if the client is tampered with.

## 4. Gating rules for the UI

1. Resolve the caller's roles **per event** on entry to any event context; cache with a short TTL and invalidate on realtime `role.changed`.
2. Never mount a section's routes/components if `can(...)` is false — don't render-then-hide.
3. Entry points (role pills, tool cards, action buttons, tabs) are individually gated by the exact permission they lead to.
4. Revocation is immediate: a `sponsor_teammate` whose access is toggled off receives `permission.revoked` and the scanner unmounts on the spot.

## 5. Server enforcement

- Every request carries the account's session; the server resolves roles for the target resource and calls the same `rbac.can()`.
- Deny by default. Unknown/expired role → 403.
- Log authz decisions for the door (audit trail: who checked in whom, from which device/door).
- Rate-limit scan endpoints; make check-in **idempotent** (re-scanning the same ticket returns "already checked in at T," never double-counts).

## 6. Test as acceptance criteria (Team G)

- Assign `speaker` on web → within 1s the phone shows the Speaker pill + tools; un-assign → they disappear.
- `staff` token → 403 on stats/walk-in/announcements/settings/staff; 200 on scan/list.
- Two sponsor teammates scanning → both leads land in one pool; revoke one → their next scan is rejected.
- Multi-role user at one event sees attendee baseline + Speaker tools + Sponsor tools together, with no bleed between scopes.
