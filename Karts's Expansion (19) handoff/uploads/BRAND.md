# BRAND.md — Cardly Brand System

**This is the single source of truth for all visual decisions.**
**If something in the codebase or design files conflicts with this file, this file wins.**

---

## Brand Direction

- **Tone:** Designer-native, premium, African-modern, editorial.
- **Mood:** Quiet confidence. Earth tones. Like reading a well-set magazine, not a startup landing page.
- **What it must do:** Frame the user's event designs without competing with them.
- **What it must NOT do:** Look like a fintech, an NGO, or a generic SaaS template.

---

## Color Tokens

### Brand

| Token | Hex | Notes |
|---|---|---|
| `primary` | `#1F4D3A` | Deep forest green. Main brand. |
| `primary-dark` | `#163828` | Hover for primary surfaces. |
| `primary-soft` | `#E8EFEB` | Tinted surface, badge backgrounds, hover rows. |
| `accent` | `#E8C57E` | Warm cream-gold. For "look here" moments. |
| `accent-dark` | `#C9A45E` | Hover for accent surfaces. |

### Neutral

| Token | Hex | Notes |
|---|---|---|
| `ink` | `#0F1F18` | Primary text. Slightly green-tinted black, not pure black. |
| `ink-soft` | `#3A4A42` | Secondary text. |
| `muted` | `#6B7A72` | Captions, metadata, placeholders. |
| `cream` | `#FAF6EE` | Default app background. Replaces pure off-white. |
| `surface` | `#FFFFFF` | Cards, modals, inputs sit on cream. |
| `border` | `#E5E0D4` | Hairlines and input borders (warm, not grey). |
| `border-strong` | `#C9C3B1` | Active or selected borders. |

### Functional

| Token | Hex | Notes |
|---|---|---|
| `success` | `#2D7A4F` | Saved, published, online. |
| `warning` | `#C97A2D` | Drafts, attention needed. |
| `danger` | `#B8423C` | Errors, destructive actions. |
| `info` | `#3A6B8C` | Tooltips, neutral notices. |

---

## Gradient

```css
linear-gradient(135deg, #1F4D3A 0%, #2A6A50 60%, #E8C57E 100%)
```

Use only:
- Hero section background or accent shapes
- Landing page illustrations
- Premium tier badge
- Empty-state decorative elements

Never use on:
- Buttons (use solid primary)
- Body cards
- Modals
- Form inputs

---

## Shadows

```css
--shadow-soft: 0 1px 2px rgba(15, 31, 24, 0.04), 0 8px 24px rgba(15, 31, 24, 0.06);
--shadow-lift: 0 4px 12px rgba(15, 31, 24, 0.08), 0 24px 60px rgba(31, 77, 58, 0.12);
--shadow-focus: 0 0 0 3px rgba(31, 77, 58, 0.15);
```

---

## Typography

- **Display:** DM Sans, weight 600–700, letter-spacing -0.02em. Used for h1, h2.
- **Sans:** Inter, weight 400–600. Body, UI, labels.
- **Mono:** JetBrains Mono. Slugs, IDs, code blocks, technical labels.

Type scale:
- Display XL: 64px / 1.05
- Display L: 48px / 1.1
- Display M: 36px / 1.15
- H1: 32px / 1.2
- H2: 24px / 1.3
- H3: 20px / 1.4
- Body L: 18px / 1.55
- Body: 16px / 1.6
- Body S: 14px / 1.5
- Caption: 12px / 1.4 (often `muted` color)

---

## Component Application

### Buttons
- **Primary:** `bg-primary` text `cream`. Hover `bg-primary-dark`.
- **Secondary:** `bg-cream` text `ink`, `border-border`. Hover `bg-primary-soft`.
- **Accent (rare):** `bg-accent` text `ink`. For Publish, Upgrade. Hover `bg-accent-dark`.
- **Ghost:** transparent, text `ink-soft`. Hover `bg-primary-soft`.
- **Destructive:** `bg-danger` text `cream`. Hover deeper red.
- **Rounded:** `rounded-xl` standard, `rounded-2xl` for hero CTAs.
- **Padding:** px-5 py-3 standard, px-6 py-4 for hero.

### Inputs
- `bg-surface`, `border-border`, focus `border-primary` + `shadow-focus`.
- Placeholder `muted`.
- Error state: `border-danger`.

### Cards
- `bg-surface`, `rounded-2xl`, `shadow-soft`.
- Hover: `shadow-lift`.
- Border optional: `border-border`.

### Nav
- `bg-cream/80` with `backdrop-blur-md`.
- Active link: `text-primary`, optional underline.
- Inactive link: `text-ink-soft`.

### Badges / Tags
- `bg-primary-soft` text `primary` for default.
- `bg-accent/30` text `accent-dark` for premium.
- `bg-success/15` text `success` for status.

### Editor zones (D2)
- Zone outline: dashed `border-primary` with `zonePulse` animation.
- Selected zone: solid `border-primary-dark` 2px + corner handles in `primary`.
- Snap guides: `accent` (cream-gold) 1px lines.

---

## Mobile (Attendee Page) Notes

- Background: `cream`.
- The card preview area: `surface` with `shadow-soft`.
- CTA "Generate My Card": `bg-primary` full-width, sticky-bottom on mobile.
- Inputs: large tap targets (min 48px height).

---

## What's Out

The following from the old brand system are **retired** — do not use anywhere in code or design:

- `#6c63ff` (old primary purple)
- `#f8a4d8` (old secondary pink)
- The old purple/pink 135deg gradient
- The cool grey border `#E5E5EA`
- Pure off-white `#fafafa` (replaced by warm cream `#FAF6EE`)
- Any blue/teal accents

---

## Rule

When in doubt, **less color**. Cardly is calm.
