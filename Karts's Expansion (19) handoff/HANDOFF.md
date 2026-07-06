# Eventera — Unified Dashboard Redesign · Implementation Handoff

**Design source of truth:** `Eventera Unified Dashboard.html` (+ `dash-system.css`, `dash-chrome.js`)
**Target codebase:** the existing Next.js 14 / App Router app in `karta/` (Supabase, Tailwind, shadcn/ui)
**Brand source of truth:** `BRAND.md` + `components/dash/index.tsx` (the `dash` atom layer). This redesign does **not** introduce new tokens — it reuses them.

This is a **refactor of information architecture + a visual sweep**, not new features. Every current page stays reachable. Match the design HTML exactly for layout, spacing, and component anatomy; pull all colors/radii from `BRAND.md` and `components/dash`.

---

## 0. The design file, decoded

The HTML is a **static canvas** of 14 screens grouped into 5 columns (Home, Attending, Organizing, Admin, Settings). It is a spec, not runnable app code. It uses three files:

- `dash-system.css` — every component's exact CSS (tokens, PageShell, PageHeader, Card, StatRow, tables, ticket, event hub, card editor). **Port these values into Tailwind classes / the `dash` layer.** Class names map 1:1 to `components/dash/index.tsx` primitives where they exist.
- `dash-chrome.js` — the shared sidebar + topbar generator and the icon set. The `NAV` object at the top is the **final nav model** — copy it into `AppShell`.
- `Eventera Unified Dashboard.html` — the 14 assembled screens.

Icons in the design are simple inline SVGs; in the app use your existing lucide-react set (mapping given per screen below).

---

## 1. Navigation (AppShell) — the final model

Replace the flat sidebar list with this grouped, collapsible structure. Source: `NAV` in `dash-chrome.js`.

```
Home                         ← standalone, always visible

ATTENDING                    ← collapsible <details>, remember open state in localStorage
  Tickets      (ticket icon) ← was "My tickets"; route (app)/my-tickets
  My Cards     (card icon)
  Saved        (heart icon)
  Discover     (globe icon)

ORGANIZING                   ← shown only if user has an organizer role
  Events       (grid icon)
  Analytics    (trending icon)
  Team         (users icon)

ADMIN                        ← shown only to admins; visual divider above, own section
  Platform Stats (bar-chart)
  Accounts       (shield)     ← was "Users"
  Revenue        (credit-card)← was "Billing"
  Activity Log   (file-text)  ← was "Audit"

─────────────
Events usage (25 / ∞) · ✓ Studio plan · Settings · Sign out   ← pinned bottom
```

**Removed from nav on purpose:** `Brand Kit` and `Templates`. They are no longer standalone dashboard pages — see §6.

**Group visibility** comes from `getVisibleSections()` / `getUserContext()` (already exists in `lib/rbac`). Only render a group if the user has that role. Groups are `<details>` elements; persist open/closed per group key in `localStorage`.

**Rename map (nav + page titles + breadcrumbs):**
| Old | New |
|---|---|
| My tickets | **Tickets** |
| Users (admin) | **Accounts** |
| Billing (admin) | **Revenue** |
| Audit (admin) | **Activity Log** |

---

## 2. One layout everywhere — PageShell + PageHeader

Every `app/(app)` page (including admin) must render inside `PageShell` + `PageHeader` from `components/dash/index.tsx`. No more centered pill-tab pages, no per-page max-width drift.

- `PageShell width="default|wide|full"` — 900 / 1200 / 1400px. Tickets, Events, Analytics, Brand-in-editor, admin tables = `wide`/`full`; My Cards, Saved, Settings, Event hub = `default`/`wide`.
- `PageHeader` = eyebrow (section name, uppercase muted) → title (DM Sans 600, 30px, `-0.02em`) → subtitle (muted) + optional right-aligned actions slot.
- Header title wrapper must be `flex:1 1 auto; min-width:0` and the actions slot `flex:none` so long titles never collide with the subtitle (this bit us — see `.page-header-main` in the CSS).

Screen → shell width and header content are spelled out in each artboard of the HTML.

---

## 3. Home — role-aware command center  (artboard 01)

Route: `app/(app)/home/page.tsx`. Replace the 3 router cards with:

1. **Portfolio StatRow** (organizer only): Events total 25 · Registrations 64 · Revenue $16,836 · Check-in 41%. Reuse the numbers already computed for `/dashboard`.
2. **Two-column body:**
   - Left: `Needs attention` card (unpublished / no-registration events, live list) + `Attending next` card (upcoming tickets, compact rows).
   - Right: `Quick actions` card (Create event / View registrations / Check-in scanner) + `Recent activity` card (latest regs / sales / card downloads).
3. Pure attendees: hide organizer blocks, lead with `Attending next` + cards. Drive off `getUserContext()` role flags — no new backend.

---

## 4. Tickets + Event hub — the big IA change (artboards 02–03)

### 4a. Tickets list — `app/(app)/my-tickets` (moved out of the public shell)
Each ticket is a **clean ticket**, not a tool tray:
- 16px forest stub, event name, ticket-type badge (`General Admission`…), meta row (date, location, holder), `Eventera Card №XXXX` (mono), perforated QR stub ("Tap for door QR").
- Actions, in this order: **Open event** (primary) · **Eventera Card / Generate card** (secondary) · **Transfer** · **Download** (ghost).
- `.ticket-qr` uses a 2px dashed left border + two cream circle notches (`::before`/`::after`) for the perforation. Exact CSS in `dash-system.css`.

**No event tools on the ticket.** "Open event" is the only path to them.

### 4b. Event hub — NEW route `app/(app)/my-tickets/[eventId]` (attendee, logged-in)
This is where the 8 event tools become first-class. Per the unification audit: **reuse the existing client components** behind `/e/[slug]/my-agenda|messages|networking|q-and-a|polls|leaderboard|community|feedback`; the `/e/[slug]/*` guest-token paths stay public and untouched. The hub just gives logged-in attendees a native, in-shell home for them.

Layout: event banner → "Your event tools" header (with Ticket & QR / Eventera Card actions) → **grid of 8 tool cards**: Agenda, Networking, Messages, Community, Q&A, Polls, Leaderboard, Feedback — each icon + one-line description, linking to the tool.

> Tools were kept **separate** (not merged into Connect/Live) per the product decision — they simply moved from a hidden ticket pill to standalone cards.

---

## 5. Organizing — Events / Analytics / Team (artboards 05, 06, 08)
Pure visual sweep onto PageShell/PageHeader/Card/StatRow/table. Content unchanged from today:
- **Events** (`(app)/dashboard`): inline stat bar, quick-action row, Needs-attention grid, `Your events` with segmented tabs (All/Active/Draft/Archived) + sort, 3-col event card grid.
- **Analytics**: 4-tile StatRow (Cards shared = accent/gold tile), Registrations bar chart, Revenue line, Event-performance table.
- **Team**: filters row, member table, empty state, roles info box.

---

## 6. Brand Kit + Templates → moved INTO the Card Editor (artboard 07)  ⚠️ key change
Delete the standalone `(app)/brand` and `(app)/templates` **pages from the dashboard nav**. Their functionality now lives **only** inside the Eventera Card editor, scoped to an event:

Route: `app/(app)/events/[id]/eventera-card` (the existing D2 canvas editor).
- Left icon rail → panels: **Templates** (gallery), **Brand Kit** (logo + palette, auto-pulled from the workspace brand), Elements, Text, Photo.
- Center: dot-grid canvas with the live card + editable zones (dashed gold outlines = `zonePulse`; selected zone = solid gold + corner handles; snap guides gold — per `BRAND.md` editor spec).
- Right: zone inspector (font / size / align / color).
- Top: Undo/Redo + **Publish**.

**Requirement from the owner:** this editor must be **100% functional** and wired end-to-end to card creation — templates apply to the canvas, brand kit colors/logo apply automatically, zones save (800ms debounce per CLAUDE.md), publish generates the slug + shareable link. Keep the existing D2 drag/resize/zoom logic; only re-skin + fold Brand Kit/Templates in as panels.

---

## 7. Admin — deliberate, in-shell (artboards 09–12)
Keep admin in the sidebar as its own divider-separated section. Every admin page uses the same PageShell/PageHeader as the rest so it stops feeling like a separate app.
- **Platform Stats** (`/admin/analytics`): two StatRows + User-growth line chart.
- **Accounts** (`/admin/users`): filters row + users table (role select + suspend/delete actions).
- **Revenue** (`/admin/billing`): filters + billing table (comp plan / invoice actions).
- **Activity Log** (`/admin/audit`): filters + audit table; action strings color-coded (role_change = warning, suspended/deleted = danger).

---

## 8. Settings (artboard 13)
`app/(app)/settings` — underline tabs (General / Billing / Developer / Integrations / White Label). General = profile card (avatar, email, display name, phone, bio) + Work section (job title, company, industry). Fold the old `account/profile` fields in here (per audit §1a).

---

## 9. Build order (safe batches — build + `pnpm build` + push each, verify live before next)
1. **Nav rebuild** — grouped collapsible AppShell from the `NAV` model. No route changes yet.
2. **Home command center**.
3. **Tickets move + Event hub** — move `my-tickets`/`saved`/`account/profile` into `(app)`; new `my-tickets/[eventId]` hub reusing existing tool components; old public routes → redirects for logged-in users.
4. **Card Editor** — fold Brand Kit + Templates in; remove their standalone nav items/pages; verify card creation works 100%.
5. **Layout sweep** — force every remaining page (incl. admin) onto PageShell/PageHeader; rename Users/Billing/Audit → Accounts/Revenue/Activity Log.
6. **Access control** — server-side role guards on moved routes; fix the API ownership holes flagged in `DASHBOARD_UNIFICATION_AUDIT.md` §6.

See `DASHBOARD_UNIFICATION_AUDIT.md` and `DASHBOARD_REDESIGN_PLAN.md` (already in `docs/`) for the route-by-route inventory, the "keep public" list, guest-token rules, and security findings — this handoff is the visual + IA layer on top of them.

---

## 10. Do / Don't
**Do:** reuse `components/dash` primitives; pull colors from `BRAND.md`; keep guest-token public paths working; keep every current page reachable.
**Don't:** invent new colors/tokens; use retired `#6c63ff`/`#f8a4d8`/`#fafafa`/`#e5e5ea`; break registration/checkout; re-add Brand Kit/Templates as standalone nav; merge the 8 event tools; ship a non-functional card editor.
