# Handoff: Eventera — Tickets Redesign

## Overview
A redesign of the **attendee tickets experience** in the Eventera mobile app, built around a **real, tear-off ticket** the attendee can flash at the door. Replaces the previous plain wallet + ticket-detail screens with a ticket-stub metaphor: cover header, perforated tear line with cut-out notches, a framed QR, and a prominent ticket code.

Covers: the wallet (Upcoming / Past / Empty), ticket detail in three statuses (Confirmed / Payment pending / Checked-in), and all ticket subpages (fullscreen QR, actions sheet, transfer flow, add-to-calendar, order receipt).

This bundle is a **visual spec**, not production code — the notes below and the design files show intended look, spacing, and behavior. Recreate in the target codebase (existing Flutter app per the product owner) reusing the existing Supabase/API data contracts; the change is visual only.

## About the Design Files
`Eventera Tickets Redesign.html` lays out every ticket screen as 375px phone frames on a pannable canvas, grouped into 3 rows. `mobile.css` holds the reusable primitives (including the new ticket-stub component); `karta.css` is the brand token source of truth. Do not ship the HTML — use it as the reference and rebuild with the codebase's UI primitives.

## Fidelity
**High-fidelity.** Colors, type, spacing, radii, shadows, and states are final. Placeholders to replace with real data:
- **Photos** — `.ph` mesh-gradient placeholders (event covers). Use real event cover imagery.
- **QR codes** — deterministic pseudo-pattern for looks. Replace with backend-generated QR encoding the ticket code / validation token.
- **Ticket codes** — sample values (`TKT-4F9A-2201` etc). Use real codes from backend.

## Brand tokens (exact)
Full palette/type/shape in `karta.css`. Key values used here:
- **forest** `#1F4D3A` (primary), **forest-dark** `#0D1F17` (dark QR screen), **forest-soft** `#E8EFEB`
- **gold** `#E8C57E` / **gold-hover** `#C9A45E` / **gold-soft** `#F5E9CC` (used sparingly)
- **cream-canvas** `#FAF6EE` (bg, NOT white), **cream-surface** `#FFFFFF`, **cream-soft** `#F0EDE8`, **cream-border** `#E5E0D4`, **border-strong** `#C9C3B1`
- **ink** `#0F1F18` / **ink-soft** `#3A4A42` / **ink-muted** `#6B7A72`
- **success** `#2D7A4F` (Confirmed), **warning** `#C97A2D` (Payment pending), **danger** `#B8423C` (Cancel/destructive)
- Type: DM Sans (display/headings, −0.02em), Inter (body/UI), JetBrains Mono (ticket codes, dates, amounts, order IDs)
- Radius: ticket 18, cards 15, buttons/inputs 12, pills 999. Screen padding 20.
- Shadows: `--sh-soft`, `--sh-lift`, `--sh-ring` (in mobile.css).

## The ticket-stub component (new)
Defined in `mobile.css`. This is the centerpiece — build it as a reusable widget.

**Full ticket (`.ticket`)** — white surface, radius 18, `--sh-lift`, structure top→bottom:
1. **`.ticket-cover`** (132px) — event cover image + bottom scrim (`.scrim-b`), event title (`.ev`) + venue line (`.sub`) overlaid; status ribbon (`.ticket-ribbon`, blurred pill) top-left.
2. **`.tear`** — the perforation: a 2px dashed top border inset by `--notch` (20px), with two cut-out **notches** rendered as `::before`/`::after` — cream-canvas circles (forest-dark on dark screens) half-clipped and pulled outside each edge, giving the torn-ticket silhouette.
3. **`.ticket-stub`** — centered `.qr-frame` (white, bordered, soft shadow) wrapping the QR, then `.ticket-code-lab` ("Ticket code") + `.ticket-code` (mono, letter-spaced).
4. **`.ticket-grid`** — 2-col key/value grid (Attendee, Type, When, Gate/Amount/etc).

**Status ribbon variants:** `.rb-success` (Confirmed), `.rb-warning` (Payment pending), `.rb-check` (Checked-in, forest w/ gold text).

**Wallet stub (`.wt`)** — list-item version: colored left `.wt-accent` strip (status color), `.wt-top` (cover thumb + title + when + status tag), and a mini perforated `.wt-foot` (dashed + small notches) with ticket type and "Show QR". `.wt.past` dims + desaturates used tickets.

## Screens
Numbering matches on-canvas labels.

### Row 1 · Wallet
- **My tickets — Upcoming** — ticket stubs with status accents (Payment pending / Confirmed), tabbar (Tickets active), Upcoming/Past segmented control.
- **My tickets — Past** — dimmed/desaturated stubs, "Checked in" / "Expired", footer shows "Receipt" instead of "Show QR".
- **Wallet — Empty** — tilted ticket icon, explanatory copy, "Discover events" CTA.

### Row 2 · Ticket detail (the real ticket)
- **Confirmed** — full ticket, live QR (tap → fullscreen), Calendar + Transfer actions. Overflow (⋯) opens actions sheet.
- **Payment pending** — QR **locked**: blurred behind a lock overlay ("QR unlocks after payment"), amount due shown in the grid, "Reserved for 24h" note, "Pay $X now" CTA. *(Product decision: QR is intentionally hidden until payment clears so a pending ticket can't be scanned. Flip if the door flow needs otherwise.)*
- **Checked-in** — QR overlaid with a rotated "ADMITTED" stamp, check-in time + scanning gate, "Leave feedback" CTA.

### Row 3 · Subpages
- **QR — Fullscreen** — dark screen, brightness-boost affordance, large QR, attendee + type header, ticket code, "Screen brightened for scanning" note. Close (✕) top-left.
- **Ticket actions (sheet)** — Transfer / Add to calendar / View receipt / Share / Cancel (danger).
- **Transfer ticket** — shows the ticket being sent, recipient email + optional note, warning that it's irreversible on accept, "Send transfer".
- **Add to calendar (sheet)** — Google / Apple / download .ics.
- **Order receipt** — success header + order #, line-item summary (with promo discount + total), paid-with / date / billed-to rows, download action.

## Interactions & behavior
- **Show QR** (wallet) / tap ticket → ticket detail; tap QR → fullscreen scan mode (raise screen brightness while open, restore on close).
- **Status drives the stub:** accent strip color, ribbon variant, and QR availability all keyed off ticket status (confirmed / pending / checked-in / expired / cancelled).
- **Payment pending:** QR locked; primary action is Pay → hands to the existing payment flow; on success, ticket flips to Confirmed and QR unlocks.
- **Transfer:** removes ticket from sender wallet, sends to recipient email (must be an Eventera account); irreversible once accepted; pending-transfer state on both sides.
- **Add to calendar:** builds event with title/date/venue; .ics fallback.
- Tap feedback: `scale(0.98)`.

## State
Ticket: `status` (confirmed | pending | checked_in | expired | cancelled), type/tier, quantity, ticket code, QR token, gate, check-in timestamp + scanner, amount due, order/receipt ref, transfer state. Wallet: upcoming vs past partition. Per the product owner these map to existing Supabase/API contracts — reuse them; QR + validation come from backend.

## Assets & files
In `design_handoff_tickets_redesign/`:
- `Eventera Tickets Redesign.html` — all ticket screens (main reference)
- `mobile.css` — mobile primitives + the ticket-stub component
- `karta.css` — brand tokens (source of truth)
- `eventera-logo.png` — wordmark
- `README.md` — this doc

Icons are inline stroke SVG (1.7–2 width) — map to your icon set. Fonts via Google Fonts (bundle/self-host in prod). To view: open the HTML and pan the canvas across rows 1–3.
