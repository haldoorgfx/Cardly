# Eventera — Attendee Mobile App · Developer Handoff Package

This package contains **three design handoffs** for the Eventera attendee mobile app, in build order. Each subfolder is self-contained (its own `README.md`, design HTML, `mobile.css`, `karta.css`, logo) and opens standalone in a browser.

All three share the same brand system and component library, so the two redesigns are drop-in replacements for their sections of the full app — **not** parallel forks. Where they overlap (tickets, account), **the redesign is the current source of truth**.

## What's inside

**`01 Full App/`** — the complete attendee app: 36 screens across 12 flow sections (onboarding, discovery, event page, tickets, cards, agenda, speakers/sponsors, live engagement, networking, feedback, account, system states). The baseline and the place to see how everything fits together.
→ open `Eventera Attendee App.html`

**`02 Tickets Redesign/`** — supersedes the tickets screens in the full app. Real tear-off ticket (perforated stub, framed QR, ticket code); wallet (Upcoming/Past/Empty); ticket detail in 3 statuses (Confirmed / Payment pending / Checked-in); subpages (fullscreen QR, actions, transfer, add-to-calendar, receipt).
→ open `Eventera Tickets Redesign.html`

**`03 Account Redesign/`** — supersedes the account screens in the full app. Profile header with stats, colored icon-tile grouped menus, richer Following / Saved / Notifications, and a settings screen with wrapping interest chips.
→ open `Eventera Account Redesign.html`

## Read order for a developer
1. Read this file.
2. Read `01 Full App/README.md` — brand system (exact hex, type, spacing, shadows), navigation model, and the full component library. This is the foundation.
3. Build the shared foundation once: brand tokens, type scale, and the reusable components (app bar, buttons, cards, chips, inputs, bottom sheet, avatars, tab bar, section nav, toggles, skeletons, toast, plus the ticket-stub and account menu/icon-tile components introduced in the redesigns).
4. Implement screens section by section from `01 Full App`, but for **Tickets** use `02` and for **Account** use `03`.

## Ground rules (apply to all three)
- The HTML files are **hi-fi visual specs, not code to ship.** Recreate in the target codebase — the existing Flutter app — reusing current Supabase/API data contracts. The change is **visual only**; data models stay.
- **High fidelity:** reproduce colors, type, spacing, radii, shadows, and states faithfully.
- Replace placeholders with real data: `.ph` mesh gradients → real images; the drawn QR → backend-generated QR + validation token; sample ticket codes / counts / lists → real data; the watermarked attendee-card render comes from the backend.
- Product rule to preserve (tickets): **QR stays locked until payment clears** for pending tickets. Flip only if the door flow requires otherwise.
- Keep tap targets ≥ 44px. Icons are inline stroke SVG — map to your icon set (Lucide/Phosphor-style). Fonts (DM Sans / Inter / JetBrains Mono) via Google Fonts — bundle or self-host in production.

## Shared brand tokens (quick reference; full detail in `01 Full App/README.md` + `karta.css`)
- forest `#1F4D3A` · forest-dark `#0D1F17` · forest-soft `#E8EFEB`
- gold `#E8C57E` · gold-hover `#C9A45E` · gold-soft `#F5E9CC` (sparingly)
- cream-canvas `#FAF6EE` (bg, NOT white) · cream-surface `#FFFFFF` · cream-soft `#F0EDE8` · cream-border `#E5E0D4`
- ink `#0F1F18` · ink-soft `#3A4A42` · ink-muted `#6B7A72`
- success `#2D7A4F` · warning `#C97A2D` · info `#3A6B8C` · danger `#B8423C`
- Type: DM Sans (headings, −0.02em), Inter (body/UI), JetBrains Mono (codes/dates/amounts)
- Navigation: bottom tabs (Discover · Tickets · Cards · Account) at app level; sticky segmented section nav inside an event.

Note: `mobile.css` and `karta.css` are identical across all three subfolders — the redesigns only add components, they don't change existing tokens.
