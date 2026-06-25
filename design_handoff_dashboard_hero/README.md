# Handoff: Karta Dashboard Hero (animated laptop + phone)

## Overview
A marketing **hero composition** for Karta: a light "laptop" browser window showing the
organizer dashboard, with a phone showing the attendee **Karta Card** popping out of the
bottom-right corner. The two screens are meant to **float and move independently** (idle
float + mouse parallax) so the hero feels alive.

There is **no badge** in this design. (An earlier version had a green "Live · 847
registrations" pill — it has been removed. Do not add it.)

## About the Design Files
The files in this bundle are **design references created in HTML/CSS** — a prototype showing
the intended look and motion, **not production code to ship as-is**. Your task is to
**recreate this design in the target codebase's existing environment** (React/Next, Vue,
Svelte, etc.) using its established components, tokens, and animation library. If the project
has no front-end yet, pick the most appropriate framework and implement it there.

Lift exact values (colors, spacing, type, radii, shadows, motion timings) from this README
and from the CSS files included — don't approximate from memory.

## Fidelity
**High-fidelity.** Final colors, typography, spacing, and motion are specified. Recreate the
UI pixel-faithfully using the codebase's own primitives. The `.ph` blocks (avatar + event
thumbnail) are **photo placeholders** — replace them with real imagery in production.

## The key thing being asked for
**Separate the two screens into independent, animatable elements and make them move.**
- The "laptop" (browser window) and the "phone" must be **two sibling elements**, each its
  own component, so each can be transformed/animated on its own.
- They animate **independently** — different float amplitude, duration, and phase — and react
  to the pointer with a **parallax** offset (phone moves more than the laptop, reading as
  "closer" to the viewer).
- All motion must be gated behind `prefers-reduced-motion` and degrade to a static layout.

---

## Layout / Composition

Design canvas: **1120 × 760 px**. Everything is absolutely positioned inside a relative
`#comp` stage which is uniformly `transform: scale()`-d to fit the viewport (capped at 1×),
centered, on a transparent (or light cream `#FAF6EE`) background.

| Element | Position (within 1120×760) | Size |
|---|---|---|
| Laptop / browser (`#laptop`) | left `28`, top `84` | `960 × 612` |
| Phone (`#phone`) | right `8`, bottom `14` | `236 × 452` |

The phone overlaps the browser's bottom-right corner (`z-index` above the browser) so it
"pops out" of the frame.

---

## Screens / Views

### 1. Laptop — Organizer Dashboard (browser window)
**Purpose:** show the Karta organizer dashboard for a single event.

**Browser frame**
- Background `#FFFFFF` (`--cream-surface`), 1px border `#E5E0D4` (`--cream-border`), radius **14px**, `overflow: hidden`.
- Shadow (composition lift, no frame border-shadow):
  `0 1px 0 rgba(255,255,255,0.8) inset, 0 60px 100px -54px rgba(15,31,24,0.34), 0 28px 56px -40px rgba(15,31,24,0.22)`.

**OS chrome bar** (height 48, bg `#F0EDE8`, bottom border `--cream-border`)
- macOS traffic lights: 12px circles `#EC6A5E` / `#F4BF4F` / `#61C554`.
- URL pill: white, 1px `--cream-border`, radius 8, lock icon + text `app.eventera.co/events/pan-african-climate-summit` (host in `--ink-soft` weight 500, rest in `--ink-muted`), 12px Inter.
- A small `+` (new tab) button on the right, 24×24, 1px border, radius 6.

**App shell** — CSS grid `204px | 1fr`, height `calc(100% - 48px)`.

*Sidebar* (bg `#FBFAF6`, right border `--cream-border`, padding `18px 12px`, flex column):
- Wordmark: the **Eventera logo** (`assets/eventera-logo.png`, 343×70 transparent PNG, forest "Event" + gold "era" with a forest/gold mark) rendered at **22px height**, `width:auto`, padding `2px 10px 16px`.
- Nav items: 36px tall, gap 3, radius 7, padding `0 11px`, 13.5px DM Sans, icon 17px stroke 1.7.
  - **Active** item ("Events"): bg `--forest-soft`, text `--forest`, weight 500, 2px left border `--forest`.
  - **The other options are intentionally SKELETON rows** (see Skeletons below) — an 18px rounded square + a pill line, plus one short skeleton "section label" line. In production these become the real nav (Registrations, Agenda, Analytics, Team, Billing) but the hero shows them as skeletons to keep focus.
- Bottom: "Pro plan" pill — `--forest-soft` bg, `--forest` text, JetBrains Mono 500, 11px, radius 999, padding `5px 11px`.

*Main* (padding `22px 26px`, flex column):
- **Header row:** breadcrumb left — "**Events** / Pan-African Climate Summit" (Events in `--forest` DM Sans 600, rest `--ink-muted` 13px Inter); right — bell icon (18px, `--ink-muted`) + 30px circular avatar (`.ph` placeholder, ring).
- **Title row:** h1 "Pan-African Climate Summit" (DM Sans 600, 22px, `-0.02em`, `--forest`, `white-space:nowrap`) + a "Live" status pill (`pill-live`: `--forest-soft` bg, `--forest` text, with a `--success` dot).
- **Stat cards** — 3-col grid, gap 14. Each card: white, 1px `--cream-border`, radius 8, padding `15px 17px`, shadow `--e1`.
  - Label: Inter 500, 10px, `0.08em`, uppercase, `--ink-muted`.
  - Value: DM Sans 600, 28px, `-0.02em`. Colors: **REGISTRATIONS "847"** → `--gold-hover` `#C9A45E`; **CARDS SHARED "1,204"** → `--success` `#2D7A4F`; **CHECK-INS "412"** → `--ink` `#0F1F18`.
  - Below each value: a **skeleton line** (was a "delta" caption; now skeletonized).
- **Chart card** — white, 1px border, radius 8, padding `16px 20px 14px`, shadow `--e1`.
  - Header: label "REGISTRATIONS — LAST 7 DAYS" (Inter 500, 10px, uppercase, `--ink-muted`) + right annotation "Peak · Sat 184" (JetBrains Mono 11px, `--gold-hover`).
  - Bars: 7 equal flex columns, gap 13, container height 82, `align-items:flex-end`, radius `5px 5px 3px 3px`. 6 bars `#E7E2D6`; the 6th bar (**Saturday**, 2nd from right) is the **peak**: `--gold` `#E8C57E`, full height, with `box-shadow:0 4px 10px -4px rgba(201,164,94,0.5)`. Heights (L→R %): 38, 52, 44, 66, 58, **100**, 48.
  - Day labels: M T W T F **S** S (Inter 500, 11px, `--ink-muted`; the peak "S" is `--gold-hover`).
- **Event rows** (two rows, hairline divider `--cream-border` between):
  - Row 1: 38px event thumbnail (`.ph` placeholder, radius 7) + "Pan-African Climate Summit" (DM Sans 500, 14px, `--forest`) over a **skeleton sub-line**; right-aligned "847 reg." (JetBrains Mono 13px, `--ink-soft`).
  - Row 2: **fully skeletonized** — square thumb placeholder + two skeleton lines + a short right-aligned skeleton.

### 2. Phone — Karta Card (attendee credential)
**Purpose:** the shareable digital event card the attendee downloads.

**Phone shell**
- `236 × 452`, bg `#0C1813`, **1.5px border `rgba(232,197,126,0.32)`** (subtle gold), radius **36px**, padding 11.
- Shadow: `0 48px 80px -36px rgba(15,31,24,0.5), 0 0 0 1px rgba(0,0,0,0.18)`.
- Notch: top-center pill `70 × 7`, radius 999, `rgba(255,255,255,0.14)`.

**Card** (fills phone, radius 26, padding `26px 20px 18px`, flex column)
- Background gradient: `linear-gradient(150deg, #163828 0%, #1F4D3A 52%, #2A6A50 100%)`.
- Guilloché texture overlay: `repeating-linear-gradient(115deg, rgba(232,197,126,0.05) 0 2px, transparent 2px 9px)` at opacity 0.5.
- "EVENTERA" wordmark top-right: DM Sans 600, 9px, letter-spacing `0.18em`, `rgba(232,197,126,0.62)`.
- Avatar: 58px circle, 1.5px `--gold` border, glow `0 0 18px rgba(232,197,126,0.22)` (`.ph` placeholder).
- Name "Amara Yusuf": DM Sans 600, 20px, white. Role "Policy Lead · African Union": Inter 13px, `rgba(250,246,238,0.66)`.
- Share row (pushed to bottom with `margin-top:auto`): three pills "IG / WA / X", each flex:1, height 36, radius 999, bg `rgba(255,255,255,0.10)`, white brand glyph (13px) + label (Inter 600, 11px, `rgba(250,246,238,0.85)`).
- "Download card" button: full width, height 42, radius 11, **bg `--gold`**, `--ink` text, download arrow icon, DM Sans 600 13px, shadow `0 6px 16px -6px rgba(201,164,94,0.55)`.
- Footer caption "Ready to share ✓": centered, Inter 11px, `rgba(250,246,238,0.45)`.

---

## Skeletons (loading-placeholder lines)
Used to declutter secondary content. Token: bg `#E7E2D6`, radius 999, height **8px**
(square variant 18×18, radius 5). Apply to: inactive sidebar nav options + section label,
the per-stat caption line, event-row 1 subtitle, and all of event-row 2. In production these
map to real data; keep them as skeletons **only** for the marketing hero, or wire them to a
genuine loading state.

---

## Interactions & Behavior

### Motion (the headline request)
Two **independent** sibling elements, `#laptop` and `#phone`:

1. **Idle float** (continuous, `prefers-reduced-motion: no-preference` only) — uses `transform`:
   - `#laptop`: `floatLaptop` 7s ease-in-out infinite → `translateY` 0 → **−10px** → 0.
   - `#phone`: `floatPhone` 5.5s ease-in-out infinite → `translateY` 0 → **−16px** → 0 **and** `rotate` 0 → **−1.2deg** → 0.
   - Different amplitude + duration + the phone's slight rotation make them feel like separate objects.

2. **Mouse parallax** — applied via the CSS **`translate`** property in JS (so it layers on top
   of the float `transform` without conflict):
   - Compute `x = clientX/innerWidth − 0.5`, `y = clientY/innerHeight − 0.5`.
   - `#laptop.style.translate = (x*7)px (y*7)px`.
   - `#phone.style.translate  = (x*18)px (y*18)px`  ← moves ~2.5× more (depth).
   - Transition `translate .4s ease-out`; reset to `0 0` on `mouseleave`.

> Implementation note for the codebase: if your animation lib (Framer Motion, GSAP, etc.)
> controls `transform`, drive the parallax with a separate transform layer / wrapper element,
> or use the same split (float on transform, parallax on the `translate` property). The point
> is **the two screens are decoupled and individually animatable** — wire them to whatever
> entrance/scroll/hover motion the marketing page needs (e.g. stagger them in on load, or
> parallax on scroll).

### Responsive
The whole `#comp` is a fixed 1120×760 canvas scaled with `transform: scale(min(...,1))` and
centered. For production, decide whether to keep the scale-to-fit hero or rebuild the two
screens as responsive flex/grid that reflow on mobile (recommended: stack phone below or
overlap less on small screens).

## State Management
The hero is presentational — no app state. The only runtime state is pointer position
(for parallax) and the reduced-motion media query. If you later make the dashboard real,
the cards/chart/rows bind to event analytics data.

## Design Tokens
All tokens live in `karta.css` (`:root`). Key values:

**Color**
- Forest: `--forest #1F4D3A`, `--forest-dark #0D1F17`, `--forest-card #162D22`, `--forest-surface #1E3D2D`, `--forest-soft #E8EFEB`
- Gold: `--gold #E8C57E`, `--gold-hover #C9A45E`, `--gold-soft #F5E9CC`
- Cream: `--cream-canvas #FAF6EE`, `--cream-surface #FFFFFF`, `--cream-soft #F0EDE8`, `--cream-border #E5E0D4`
- Ink: `--ink #0F1F18`, `--ink-soft #3A4A42`, `--ink-muted #6B7A72`
- Status: `--success #2D7A4F`, `--warning #C9A45E`, `--error #B8423C`
- Card gradient (phone): `#163828 → #1F4D3A → #2A6A50`
- Skeleton: `#E7E2D6`; chart bar (idle): `#E7E2D6`; chrome bar: `#F0EDE8`; sidebar: `#FBFAF6`; phone body: `#0C1813`
- Traffic lights: `#EC6A5E` / `#F4BF4F` / `#61C554`

**Radius:** `--r-card 8`, `--r-btn 6`, `--r-input 6`, `--r-pill 999`, `--r-modal 12`; browser frame 14, phone 36, phone card 26.

**Shadow:** `--e1 0 1px 3px rgba(15,31,24,0.06)`, `--e2 0 4px 16px rgba(15,31,24,0.1)`. (Frame/phone composition shadows listed per-element above.)

**Type:** `--display 'DM Sans'`, `--body 'Inter'`, `--mono 'JetBrains Mono'`. Sizes are listed per-component above. Type scale utilities live in `karta.css` (`.t-display-*`, `.t-num-*`, etc.).

## Assets
- **Eventera logo** (`assets/eventera-logo.png`) — the brand wordmark used in the sidebar.
  In production use the codebase's existing brand asset/SVG if available.
- **Photo placeholders** (`.ph` system in `karta.css`): a layered radial-gradient mesh that
  reads as photography, hue driven by `--h`. Used for the avatar (`--h:30`) and event
  thumbnail (`--h:152`). **Replace with real photos** in production.
- **Icons** are inline SVG (calendar, people, chart, bell, lock, download, IG/WhatsApp/X
  glyphs). Swap for your icon library.
- No bitmap brand assets are required.

## Files
- `Karta Dashboard Hero — Light.html` — the reference prototype (self-contained except it
  links the two CSS files below). Contains the exact markup, styles, float + parallax JS.
- `karta.css` — Karta design tokens & primitives (fonts, colors, `.ph`, pills, buttons).
- `web.css` — web shell primitives (nav, sidebar, cards, pills, table) for broader context.
- `preview-transparent.png` — rendered preview (transparent background, shadows preserved).
- `assets/eventera-logo.png` — Eventera brand logo (sidebar wordmark).
