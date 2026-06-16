---
version: alpha
name: Eventera
description: >
  An editorial, African-modern event platform that reads like a well-set magazine
  rather than a startup landing page. Built on deep forest green and warm cream,
  with a single cream-gold accent used only for "look here" moments. The system's
  job is to FRAME the organizer's own event design, never to compete with it —
  so the chrome is quiet, the surfaces are warm-neutral, and decoration is almost
  absent. Depth comes from hairline borders and one restrained shadow, not from
  gradients or glows. Type is DM Sans for display with tight negative tracking,
  Inter for everything else. The result is calm, confident, and unmistakably
  not-generic-SaaS.

colors:
  primary: "#1F4D3A"
  primary-dark: "#163828"
  primary-soft: "#E8EFEB"
  accent: "#E8C57E"
  accent-dark: "#C9A45E"
  ink: "#0F1F18"
  ink-soft: "#3A4A42"
  muted: "#6B7A72"
  cream: "#FAF6EE"
  surface: "#FFFFFF"
  border: "#E5E0D4"
  border-strong: "#C9C3B1"
  success: "#2D7A4F"
  warning: "#C97A2D"
  danger: "#B8423C"
  info: "#3A6B8C"
  on-primary: "#FAF6EE"
  on-accent: "#163828"

typography:
  display-xl:
    fontFamily: "DM Sans"
    fontSize: 64px
    fontWeight: 600
    lineHeight: 1.05
    letterSpacing: -0.02em
  display-lg:
    fontFamily: "DM Sans"
    fontSize: 48px
    fontWeight: 600
    lineHeight: 1.1
    letterSpacing: -0.02em
  display-md:
    fontFamily: "DM Sans"
    fontSize: 36px
    fontWeight: 600
    lineHeight: 1.15
    letterSpacing: -0.02em
  h1:
    fontFamily: "DM Sans"
    fontSize: 32px
    fontWeight: 600
    lineHeight: 1.2
    letterSpacing: -0.02em
  h2:
    fontFamily: "DM Sans"
    fontSize: 24px
    fontWeight: 600
    lineHeight: 1.3
    letterSpacing: -0.015em
  h3:
    fontFamily: "Plus Jakarta Sans"
    fontSize: 20px
    fontWeight: 600
    lineHeight: 1.4
    letterSpacing: -0.01em
  body-lg:
    fontFamily: "Inter"
    fontSize: 18px
    fontWeight: 400
    lineHeight: 1.55
    letterSpacing: 0
  body:
    fontFamily: "Inter"
    fontSize: 16px
    fontWeight: 400
    lineHeight: 1.6
    letterSpacing: 0
  body-sm:
    fontFamily: "Inter"
    fontSize: 14px
    fontWeight: 400
    lineHeight: 1.5
    letterSpacing: 0
  caption:
    fontFamily: "Inter"
    fontSize: 12px
    fontWeight: 400
    lineHeight: 1.4
    letterSpacing: 0
  eyebrow:
    fontFamily: "Inter"
    fontSize: 11px
    fontWeight: 600
    lineHeight: 1.3
    letterSpacing: 0.1em
  numeric:
    fontFamily: "Inter"
    fontSize: 14px
    fontWeight: 600
    lineHeight: 1.4
    letterSpacing: 0
    fontFeature: tnum

rounded:
  sm: 8px
  md: 12px
  lg: 16px
  xl: 24px
  pill: 9999px

spacing:
  xxs: 4px
  xs: 8px
  sm: 12px
  md: 16px
  lg: 24px
  xl: 32px
  xxl: 48px
  section: 96px

motion:
  feedback: 140ms
  content: 200ms
  easing: "cubic-bezier(0.2, 0, 0, 1)"

components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.on-primary}"
    typography: "{typography.body-sm}"
    rounded: "{rounded.md}"
    padding: 12px 20px
  button-primary-hover:
    backgroundColor: "{colors.primary-dark}"
    textColor: "{colors.on-primary}"
  button-secondary:
    backgroundColor: "{colors.cream}"
    textColor: "{colors.ink}"
    typography: "{typography.body-sm}"
    rounded: "{rounded.md}"
    padding: 12px 20px
  button-secondary-hover:
    backgroundColor: "{colors.primary-soft}"
    textColor: "{colors.ink}"
  button-accent:
    backgroundColor: "{colors.accent}"
    textColor: "{colors.on-accent}"
    typography: "{typography.body-sm}"
    rounded: "{rounded.md}"
    padding: 12px 20px
  button-ghost:
    backgroundColor: "{colors.cream}"
    textColor: "{colors.ink-soft}"
    typography: "{typography.body-sm}"
    rounded: "{rounded.md}"
  text-input:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    typography: "{typography.body}"
    rounded: "{rounded.md}"
    padding: 12px 14px
  text-input-focused:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.md}"
  card:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    typography: "{typography.body}"
    rounded: "{rounded.lg}"
    padding: 24px
  badge-default:
    backgroundColor: "{colors.primary-soft}"
    textColor: "{colors.primary}"
    typography: "{typography.caption}"
    rounded: "{rounded.pill}"
    padding: 2px 10px
  badge-status:
    backgroundColor: "{colors.success}"
    textColor: "{colors.cream}"
    typography: "{typography.caption}"
    rounded: "{rounded.pill}"
    padding: 2px 10px
  event-cover-fallback:
    backgroundColor: "{colors.primary-soft}"
    textColor: "{colors.primary}"
    typography: "{typography.display-md}"
    rounded: "{rounded.lg}"
---

## Overview

Eventera is the back-of-house for event organizers — they upload a design, define
the editable zones, publish a link, and attendees personalize and share a card.
The platform's entire visual job is to **frame the organizer's own design without
competing with it.** Everything in this system is built around that restraint.

The reference is a **well-set print magazine** — generous margins, a confident
masthead, warm paper stock, one ink color plus a single gold accent reserved for
pull-quotes. It is emphatically *not* a fintech dashboard, an NGO microsite, or a
generic SaaS template with a purple hero and three glowing feature cards.

**Key characteristics**
- Warm cream canvas (`{colors.cream}`), never pure white. White is reserved for
  surfaces that lift off the canvas (cards, modals, inputs).
- A single brand color — deep forest green (`{colors.primary}`) — carries nearly
  all emphasis. The cream-gold accent (`{colors.accent}`) is scarce by design.
- Depth comes from **hairline borders + one soft shadow**, not from gradients,
  glows, or stacked drop shadows.
- DM Sans display with tight negative tracking (-0.02em); Inter for body and UI.
- No second chromatic accent. No glow. No gradient on any body surface.

## Colors

A one-ink-plus-accent system on warm paper.

- **Primary** `{colors.primary}` — deep forest green. The single brand color:
  primary buttons, active states, links, emphasized numerals, the brand mark.
- **Primary dark** `{colors.primary-dark}` — hover/pressed state of primary surfaces.
- **Primary soft** `{colors.primary-soft}` — tinted surface for badges, hovered
  rows, selected states, and the event-cover fallback. The quiet workhorse.
- **Accent** `{colors.accent}` — warm cream-gold. The ONLY decorative color, and
  it appears rarely: the Publish/Upgrade CTA, the premium badge, a single
  pull-quote moment per page. Its scarcity is what gives it meaning.
- **Accent dark** `{colors.accent-dark}` — hover for accent surfaces only.
- **Ink** `{colors.ink}` — primary text. Green-tinted near-black, never `#000`.
- **Ink soft** `{colors.ink-soft}` — secondary text.
- **Muted** `{colors.muted}` — captions, metadata, placeholders.
- **Cream** `{colors.cream}` — the page. Warm, never off-white-grey.
- **Surface** `{colors.surface}` — white, only for lifted surfaces on cream.
- **Border** `{colors.border}` — warm beige hairline, never a cool grey.
- **Functional** — `{colors.success}` / `{colors.warning}` / `{colors.danger}` /
  `{colors.info}` for status only, never as decoration.

**The gradient exception.** Exactly one gradient exists —
`linear-gradient(135deg, #1F4D3A 0%, #2A6A50 60%, #E8C57E 100%)` — and it is
permitted ONLY on: the marketing hero backdrop, landing illustrations, and the
premium tier badge. It is banned on buttons, body cards, list rows, modals, form
inputs, and any in-app surface.

## Typography

Two families, one voice.

- **DM Sans** — display and headings, weight 600, letter-spacing -0.02em. The
  negative tracking is the typographic signature; it reads as editorial confidence.
- **Plus Jakarta Sans** — `h3` / card titles only, where a slightly humanist cut
  helps mid-level headings.
- **Inter** — everything else: body, UI, labels, eyebrows, numerals.

Numbers that carry meaning (stats, counts, money, percentages) use Inter with
`font-feature-settings: "tnum"` so columns align — a quiet competence signal.

**There is no monospace font in Eventera.** Eyebrows and labels are Inter at weight
600, uppercase, with `0.1em` tracking — that casing alone marks them as taxonomy.
Do not reach for a mono font to make something look "technical"; it reads as a
generic developer-tool tell, which is the opposite of this brand.

## Layout

- **Base unit** 4px. Tokens: `{spacing.xxs}` 4 · `{spacing.xs}` 8 · `{spacing.sm}` 12
  · `{spacing.md}` 16 · `{spacing.lg}` 24 · `{spacing.xl}` 32 · `{spacing.xxl}` 48
  · `{spacing.section}` 96.
- App content centers around 1100–1280px. Marketing bands run to 1280px.
- Card padding `{spacing.lg}` 24px. Section rhythm `{spacing.section}` 96px on
  marketing, 32–48px in-app.
- Let surfaces breathe. A section that ends with whitespace below it is correct,
  not under-filled.

## Elevation & Depth

Depth is carried by the surface lift (cream → white) plus a hairline border, with
a single soft shadow for genuinely floating elements. That's the whole ladder.

| Level | Treatment | Use |
|---|---|---|
| 0 | Flat on `{colors.cream}` | Body text, page chrome |
| 1 | `{colors.surface}` + 1px `{colors.border}` | Default cards, rows, inputs |
| 2 | `shadow-soft` (`0 1px 2px / 0 8px 24px` at 4–6% ink) | Hovered cards |
| 3 | `shadow-lift` (`0 4px 12px / 0 24px 60px`) | Modals, popovers, dropdowns |
| focus | `0 0 0 3px rgba(31,77,58,0.15)` | Focused inputs/buttons |

No element stacks more than one shadow. No glow shadows (colored, spread-only
`0 0 Npx` shadows) anywhere — they are the clearest AI-render tell.

## Shapes

| Token | Value | Use |
|---|---|---|
| `{rounded.sm}` | 8px | Inputs, small buttons, menu items |
| `{rounded.md}` | 12px | Buttons, inputs |
| `{rounded.lg}` | 16px | Cards, modals, panels |
| `{rounded.xl}` | 24px | Hero CTAs, large feature panels |
| `{rounded.pill}` | 9999px | Badges, status pills, avatars only |

Pills are for badges and avatars, not for rectangular content blocks.

## Components

- **`button-primary`** — forest fill, cream text, `{rounded.md}`, 12×20 padding.
  Hover → `{colors.primary-dark}`. The default action everywhere.
- **`button-secondary`** — cream fill, ink text, 1px `{colors.border}`. Hover →
  `{colors.primary-soft}`.
- **`button-accent`** — gold fill, dark-forest text. Reserved for Publish and
  Upgrade. At most one on a screen.
- **`text-input`** — white fill, 1px border, focus → `{colors.primary}` border +
  focus ring. Min 44px tap height on touch.
- **`card`** — white on cream, `{rounded.lg}`, 1px border, optional `shadow-soft`.
  No gradient fill. Ever.
- **`event-cover-fallback`** — when an event has no cover image, the card header
  is a FLAT `{colors.primary-soft}` band carrying the event's initial in
  `{colors.primary}`. It is consistent across all cards — no rotating gradients,
  no decorative glow. The organizer's real cover image, when present, is the
  protagonist and sits unadorned.
- **`badge-default`** — `{colors.primary-soft}` fill, `{colors.primary}` text, pill.
- **Nav** — `{colors.cream}` at 80% with `backdrop-blur`. Active link
  `{colors.primary}`.

## Motion

Quick and mechanical. Nothing bounces, overshoots, or lingers.
- Interactive feedback (hover, toggle): `{motion.feedback}` 140ms, `{motion.easing}`.
- Content transitions (panel, modal, page): `{motion.content}` 200ms, same curve.
- Nothing animates longer than 300ms. The hero floaters and logo marquee are the
  only ambient loops; everything else is a response to an action.
- Respect `prefers-reduced-motion`: collapse durations to 0.

## Do's and Don'ts

### Do
- Treat the organizer's uploaded design as the protagonist. Eventera's chrome is the
  frame around it, set in quiet forest and warm cream.
- Keep `{colors.accent}` gold scarce — one "look here" moment per screen, maximum.
- Carry depth with the cream→white lift and a hairline border first; add
  `shadow-soft` only when an element genuinely floats.
- Use tabular Inter for any number that sits in a column or stat.
- Trust modest type-size steps and tight negative tracking on DM Sans display.
- Let the warm cream canvas be the negative space.

### Don't
- **Don't put a gradient on any body card, row, modal, input, or button.** The
  single sanctioned gradient lives on the marketing hero and premium badge only.
- **Don't use glow shadows** (`0 0 40px`, colored spreads). Real objects don't glow.
- **Don't stack shadows** (drop + inset, or two drops). One shadow, or none.
- **Don't introduce a monospace font** to look technical — Eventera has none.
- **Don't add a second accent color.** No blues, teals, purples, or pinks — those
  retired hues (`#6c63ff`, `#f8a4d8`) are banned.
- **Don't use pure white `#FFFFFF` as the page background** — the canvas is cream.
- **Don't center everything or default to the three-glowing-feature-cards layout.**
  Asymmetry and editorial rhythm read as designed; perfect symmetry reads as a template.
- **Don't decorate empty states with rotating colors or gradients** — keep them
  flat, calm, and consistent.
