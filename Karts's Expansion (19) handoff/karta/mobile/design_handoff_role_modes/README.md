# Handoff: Eventera — Speaker, Sponsor & Exhibitor modes (mobile)

## Overview
These are the **role modes** layered on top of the existing Eventera attendee mobile app. The same person can be an **attendee** and *also* a **speaker**, **sponsor**, or **exhibitor** at the same event — so a role is never a separate app or a separate login. When you have a role at an event, a **role badge** appears on that event's card in the hub and unlocks an extra **"… tools"** section. Everything else (tickets, cards, discovery, account) stays exactly as it is in the attendee app.

This bundle is the peer to `design_handoff_attendee_mobile_app/`. It reuses the **same brand tokens, phone frame, and component primitives** (`karta.css` + `mobile.css`) — read that handoff's README for the full brand system; this document only covers the role-specific screens.

Contains **15 numbered screens** across 3 roles, laid out as 375px phone frames on a pannable canvas, grouped into role rows.

## About the design files
Authored in **HTML/CSS** as a high-fidelity visual spec — **not production code to copy directly**. Recreate each screen in the target codebase (the existing Flutter app) using its widgets + the shared tokens; keep the existing Supabase/API data layer untouched. Do not ship the HTML.

## Fidelity
**High-fidelity.** Colors, type, spacing, radii, shadows, and states are final. Placeholders only: **photos** (`.ph` mesh-gradient, `--h` hue) and **QR patterns** — both come from the backend.

## The core model: roles are additive, not separate

```
Event hub card ──► has role? ──► role pill on card  +  "<Role> tools" entry card
                                        │
        ┌───────────────────────────────┼───────────────────────────────┐
     SPEAKER                          SPONSOR                         EXHIBITOR
   present sessions                fund + booth + leads         expo-hall booth + products
   audience Q&A (read)             lead retrieval scanner       meetings + directory listing
   speaker profile                 my booth / booth team        products showcase
   green room / run of show        my leads (hot/warm/cold)     meeting requests
```

- **A person can hold more than one role** at the same event (e.g. attendee + speaker). Each role that applies adds its own pill + tools entry to that event's hub card. Don't build separate accounts or separate navigation trees.
- **Role tools live *inside* the event context**, reached from the event hub — never from the app-level bottom tab bar (which stays Discover · Tickets · Cards · Account).
- **Camera screens go dark** (`.screen.cam`, `#0A0F0C`) for scanner clarity; everything else stays on cream.
- **Heavy management stays on the web** (`eventera.so`): slide/rider uploads, logo & collateral, rich product pages, CSV export / CRM sync. The mobile role tools are the *on-the-day* surface. Each screen states this with a `.whynote`.

## Role entry pattern (shared across all three)
Every role reuses the same two building blocks, so build them once and theme per role:

- **`.rolepill`** — gold pill on the event hub card cover (`Speaker` / `Sponsor` / `Exhibitor`), with a role icon. Multiple pills stack if the user has multiple roles.
- **`.toolcard`** — forest-gradient entry card ("Speaker tools" / "Sponsor tools" / "Exhibitor tools") with icon, one-line summary of what's inside, and a chevron. Tapping it opens that role's tool section.
- **`.rolebar`** — forest-gradient context strip pinned at the top of every tool screen: role icon + event name + role/tier line, so the user always knows which event + role they're acting in.

## Screens / Views
Numbering matches the on-canvas labels.

### Row 1 · Speaker mode (unlocked when you're presenting)
- **SP04 · Speaker badge in event hub** — event card with `Speaker` pill, "Speaker tools" entry (2 sessions · profile · audience Q&A), at-a-glance stats (Sessions / Attending / Questions).
- **SP01 · My Sessions** — list of the sessions you're presenting; time, room tag, track chip; keynote flagged gold. `.sess` rows.
- **SP02 · Session detail + live Q&A** — description, co-speakers, and the **audience Q&A read-only** for speakers: `.live` indicator, questions sorted by upvotes (`.qrow` / `.qvote`, top question gold). Speakers *read* questions, they don't moderate here.
- **SP03 · Speaker profile** — profile as attendees see it, light inline edit (bio, company, social links); full management punts to web.
- **SP05 · Green room / logistics** — call time / on-stage / length stat trio, stage + AV-contact rows, timeline "run of show"; slide upload punts to web.
- **SP06 · Audience Q&A — empty** — pre-questions empty state.
- **SP01 (loading)** — skeleton state for My Sessions.

### Row 2 · Sponsor mode (unlocked when your company sponsors — lead retrieval is the workhorse)
- **SPO05 · Sponsor badge in event hub** — `Sponsor` pill, "Sponsor tools" entry (Lead scanner · my booth · my leads), booth-performance stats (Leads / Hot / Booth).
- **SPO01 · My Booth** — booth identity, Booth-info / Team segmented control, tier, description; logo/collateral punt to web.
- **SPO02 · Lead retrieval (scanner)** — **dark full-screen QR scanner** (`.scanbox` corners + animated `.scanline`), running "N leads today" counter chip. This is the core sponsor action.
- **SPO03 · Lead captured** — bottom sheet over dimmed camera: captured contact, **Hot / Warm / Cold** rating (`.rate`), note field, Save.
- **SPO04 · My Leads** — searchable/filterable list, `.lead` rows with hot/warm/cold tags + capture date; CSV/CRM punts to web. Includes an **empty** variant (before first scan).
- **SPO06 · Lead detail** — full contact (email/phone/LinkedIn), rating, note, capture time + booth stamp.
- **SPO07 · Booth team** — teammates with **scan-access toggles** (turn a teammate's scanner on/off); shared lead pool.

### Row 3 · Exhibitor mode (unlocked when you have a booth in the expo hall)
Exhibitors differ from sponsors: they're in the **attendee-facing expo directory**, so the emphasis is **products & meetings**, not only leads. Lead scanning **reuses the sponsor scanner (SPO02/SPO03)** rather than duplicating it.
- **EX01 · Exhibitor badge in event hub** — storefront `Exhibitor` pill, "Exhibitor tools" entry (Booth · products · meetings · leads), stats (Leads / Meetings / Booth).
- **EX02 · My Booth & products** — Booth-info / **Products** segmented control; product showcase list (`.mrow` with thumb, featured tag), "Add product"; rich product pages sync from web.
- **EX03 · Meeting requests** — the exhibitor workhorse: **Requests / Scheduled** segmented; attendee meeting requests with requested time, **Accept / Propose time**. Accepted meetings drop into both agendas.
- **EX04 · Directory preview** — how the booth appears to attendees browsing the expo hall: cover + logo, category chips, description, **Request meeting** CTA, product list. (`Preview` tag makes clear this is the public-facing view.)

## Interactions & behavior
- **Enter a role:** event hub card → tap the "… tools" `.toolcard` → role tool section (with `.rolebar` context strip). Back chevron returns to the hub.
- **Scan a lead (sponsor/exhibitor):** open scanner → detect QR → captured sheet → rate hot/warm/cold + note → Save → counter increments; lead appears in My Leads.
- **Rate a lead:** `.rate` segmented hot/warm/cold, single-select, colors = danger/warning/info.
- **Speaker Q&A:** read-only, upvote-sorted; no post/moderate from the speaker view.
- **Meeting request (exhibitor):** Accept confirms + schedules; Propose time opens a time picker (not drawn); both parties get a reminder.
- **Booth team access:** `.tgl` per teammate toggles their scanner access instantly against the shared pool.
- **Tap feedback:** `transform: scale(0.98)` on `.mbtn:active`.
- **Loading / empty:** skeleton (`.skl`) mirrors final layout; empty states are per-screen (SP06, SPO04-empty).

## State & data
- **Role resolution:** per (user, event) — which of speaker/sponsor/exhibitor apply, plus tier (e.g. Headline) and booth id. Drives which pills/tools render.
- **Speaker:** my sessions, session detail + co-speakers, live Q&A stream (read), editable profile subset, green-room logistics.
- **Sponsor/exhibitor shared:** booth profile, booth team + scan-access flags, lead pool (contact + hot/warm/cold + note + capture stamp).
- **Exhibitor extra:** product catalog, meeting requests (pending/scheduled), public directory listing.
- All of the above map to **existing Supabase/API contracts** per the product owner — reuse them; the change is visual + IA, not new backend.

## Design tokens
Identical to the attendee app — defined in **`karta.css`** (brand tokens, type scale, buttons, `.ph` placeholder) and **`mobile.css`** (phone frame + mobile primitives). Forest `#1F4D3A`, forest-dark `#0D1F17`, gold `#E8C57E`, cream-canvas `#FAF6EE`, cream-surface `#FFFFFF`, ink `#0F1F18`; DM Sans / Inter / JetBrains Mono; card radius 14–16, gold used once per screen. Never purple/pink/pure-white/cool-grey. See the attendee handoff README for the full table.

### Role-specific classes added in this bundle (in the HTML's `<style>`)
`.rolebar` (+ `.rb-ic` / `.rb-ev` / `.rb-role`), `.rolepill`, `.toolcard` (+ `.tc-ic` / `.tc-t` / `.tc-go`), `.sess` (session row), `.qrow` / `.qvote` / `.qtext` (Q&A), `.live` (+ `.pulse`), `.rate` / `.rp` (hot/warm/cold), `.lead` (lead row), `.camwrap` / `.camtex` / `.scanbox` / `.scanline` / `.camhint` (dark scanner). Promote these into the shared stylesheet if you want them reusable.

## Assets
- `eventera-logo.png` — wordmark (included).
- Icons — inline stroke SVG; map to your icon set.
- Fonts — DM Sans / Inter / JetBrains Mono via Google Fonts; self-host in production.
- Photos / QR — placeholders; source from backend.

## Files
In this bundle (`design_handoff_role_modes/`):
- `Eventera Role Modes.html` — all 15 role screens on the canvas (main reference).
- `mobile.css` — mobile primitives + phone-frame chrome.
- `karta.css` — brand tokens (shared source of truth).
- `eventera-logo.png` — wordmark.
- `README.md` — this document.

To view: open `Eventera Role Modes.html` in a browser; pan/scroll between role rows (Speaker → Sponsor → Exhibitor).
