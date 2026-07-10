# BRAND.md — Karta Brand System

**This is the single source of truth for all visual decisions.**
**If something in the codebase or design files conflicts with this file, this file wins.**

> Karta is a full **event-management platform**. The brand must feel like premium, dependable software an organizer runs their whole event on — while staying warm, editorial, and African-modern. The personalized **Karta Card** is the signature flourish, not the whole identity.

---

## Brand Direction

- **Tone:** Premium, editorial, African-modern, designer-grade. Confident software, not a toy.
- **Mood:** Quiet confidence. Earth tones. A well-set magazine that also happens to be a powerful dashboard.
- **What it must do:** Make a solo organizer feel they have an enterprise-grade platform; make the attendee experience feel delightful and shareable.
- **What it must NOT do:** Look like a generic fintech, a purple SaaS template, or a clip-art NGO site. No AI-slop gradients-everywhere.
- **Signature moment:** The **Karta Card** — every attendee leaves with a personalized, branded card. Treat it as the brand's hero object.

---

## Color Tokens

### Brand
| Token | Hex | Notes |
|---|---|---|
| `primary` | `#1F4D3A` | Deep forest green. Main brand. |
| `primary-dark` | `#163828` | Hover for primary surfaces; dark panels (scanner, metrics band). |
| `primary-soft` | `#E8EFEB` | Tinted surface, badge bg, active nav, hover rows. |
| `accent` | `#E8C57E` | Warm cream-gold. "Look here" + the Karta Card. Used sparingly. |
| `accent-dark` | `#C9A45E` | Hover for accent surfaces. |

### Neutral
| Token | Hex | Notes |
|---|---|---|
| `ink` | `#0F1F18` | Primary text. Green-tinted black, not pure black. |
| `ink-soft` | `#3A4A42` | Secondary text. |
| `muted` | `#6B7A72` | Captions, metadata, placeholders, mono micro-labels. |
| `cream` | `#FAF6EE` | Default app background. Never pure white. |
| `surface` | `#FFFFFF` | Cards, modals, inputs, table rows. |
| `border` | `#E5E0D4` | Hairlines and input borders (warm, not grey). |
| `border-strong` | `#C9C3B1` | Active or selected borders. |

### Functional
| Token | Hex | Notes |
|---|---|---|
| `success` | `#2D7A4F` | Saved, published, live, checked-in, paid. |
| `warning` | `#C97A2D` | Drafts, pending, attention. |
| `danger` | `#B8423C` | Errors, destructive, suspended, removed. |
| `info` | `#3A6B8C` | Tooltips, neutral notices. |

> **Theme-ability:** brand tokens are exposed as CSS vars (`--theme-primary`, etc.) so organizers can re-theme their public event pages + Karta Cards. Functional + neutral tokens are **not** theme-able.

---

## Gradient & decorative washes

```css
/* brand gradient */
linear-gradient(135deg, #1F4D3A 0%, #2A6A50 60%, #E8C57E 100%)
/* forest panel (metrics band, CTA, scanner, card backs) */
linear-gradient(150deg, #0D1F17 0%, #1F4D3A 60%, #235741 110%)
```
**Use only on:** hero/CTA backgrounds, the metrics band, event-cover art, Karta Card backs, premium badges, empty-state decoration.
**Never on:** buttons (solid `primary`), body cards, modals, inputs, tables.
Optional textures (sparingly, low opacity): dotted grid on `cream` page bg; gold topographic lines on covers; gold radial halo behind the Karta Card.

---

## Shadows
```css
--shadow-soft: 0 1px 2px rgba(15,31,24,0.04), 0 8px 24px rgba(15,31,24,0.06);
--shadow-lift: 0 4px 12px rgba(15,31,24,0.08), 0 24px 60px rgba(31,77,58,0.12);
--shadow-focus: 0 0 0 3px rgba(31,77,58,0.15);
--shadow-card-glow: 0 0 40px rgba(232,197,126,0.32), 0 18px 50px rgba(13,31,23,0.4); /* Karta Card reveal only */
```

---

## Typography
- **Display:** DM Sans, 600–700, letter-spacing −0.02em → h1/h2, stat numbers, card names.
- **Sans:** Inter, 400–600 → body, UI, labels.
- **Mono:** JetBrains Mono → slugs, IDs, metrics, micro-labels (uppercase, letter-spacing 0.1–0.22em), code, ticket numbers.

Type scale: Display XL 64/1.05 · Display L 48/1.1 · Display M 36/1.15 · H1 32/1.2 · H2 24/1.3 · H3 20/1.4 · Body L 18/1.55 · Body 16/1.6 · Body S 14/1.5 · Caption 12/1.4 (`muted`). Slides/marketing may go larger; never below 12px.

---

## Component Application

### Buttons
- **Primary:** `bg-primary` text `cream`; hover `bg-primary-dark`.
- **Secondary/ghost:** `bg-surface`/transparent, `border-border`, text `ink-soft`; hover `border-primary/40` + `text-primary`.
- **Accent (rare):** `bg-accent` text `primary-dark`; for Publish, Upgrade, Go-live, card share. Hover `bg-accent-dark`.
- **Destructive:** `bg-danger` text white; secondary destructive = `border-red-300 text-red-700 hover:bg-red-50`.
- **Radius:** `rounded-lg`/`rounded-xl` standard, `rounded-2xl` hero CTAs. Sizes: sm `px-3 py-1.5`, md `px-4 py-2.5`, lg `px-6 py-3.5`.

### Inputs & forms
- `bg-surface`, `border-border`, focus `border-primary` + `shadow-focus`; placeholder `muted`; error `border-danger` + 11px danger helper text.
- Real controlled inputs; **required + email/zod validation blocks submit** and shows inline errors. Toggles, segmented controls, radio cards, sliders all in brand tokens.

### Cards / panels
- `bg-surface`, `rounded-2xl`, `border-border`, `shadow-soft`; hover `shadow-lift`. Panel header: 14px display semibold + hairline divider.

### App shell (dashboard + operator)
- Left sidebar on `cream`, hairline border, sectioned nav with mono section labels; active item `bg-primary text-cream`, inactive `text-ink-soft` + `primary/70` icon. Collapses to an off-canvas drawer + hamburger under `lg`.
- Topbar: `bg-cream/80 backdrop-blur`, search (⌘K), notifications bell, avatar menu.
- Plan-gated items stay visible with a gold **lock pill**; clicking opens the upgrade slide-over (UX only — enforce limits server-side).

### Data display
- **Stat cards:** mono number (24–28px primary), mono uppercase label; optional accent variant (gold tint) + delta (success/danger).
- **Tables:** `cream/60` header with mono uppercase labels, hairline row dividers, hover `cream/40`; wrap in a rounded-2xl card; horizontal-scroll on mobile.
- **Charts:** dependency-free inline SVG (area/donut/bars/funnel) in forest→sage→gold ramp: `#1F4D3A #2A6A50 #3E7E5E #E8C57E #C9A45E #A8C2B5`, track `#E8EFEB`.

### Pills / badges / status
- Default `bg-primary-soft text-primary`; premium `bg-accent/20 text-accent-dark`; status: green=`success/15`, amber=`warning`, red=`danger`, with a leading dot for live/online.

### Tabs, toasts, modals, states
- **Tabs:** underline (primary) for page tabs; segmented pill group for sub-filters.
- **Toasts:** dark `ink` pill, bottom-center, gold/red icon chip; ~2.8s.
- **Modals:** `surface` `rounded-2xl`, header + body + footer (Cancel + primary/destructive); confirm modal supports a reason textarea.
- **Loading:** shimmer **skeletons**. **Empty:** dashed card + icon + title + body + CTA. **Error:** red-tinted dashed card + retry. All three are required per data view.

### The Karta Card (signature object)
- Portrait 4:5, `rounded-[14px]`, forest/gradient back, gold hairline framing + ring, guilloché texture, attendee photo/initials, name (display), role, tier + ticket #, event + date. On the reveal: `--shadow-card-glow` + gold radial halo + confetti (respect `prefers-reduced-motion`).

### Editor zones (Studio)
- Zone outline: dashed `border-primary` + `zonePulse`; selected: solid `border-primary-dark` 2px + `primary` corner handles; snap guides: `accent` 1px. Floating text toolbar in `surface`.

### Mobile / attendee
- `cream` bg; sticky bottom CTA `bg-primary` full-width; tap targets ≥ 48px; phone-framed but responsive.

---

## What's Out (retired — never use)
- `#6c63ff` (old purple), `#f8a4d8` (old pink), the old purple/pink gradient.
- Cool grey border `#E5E5EA`; pure off-white `#fafafa` (use `cream`).
- Any blue/teal accents (except functional `info`).
- "Cardly" wordmark/strings, "card tool" framing, "Made with Cardly" watermark → now **Karta** / "Made with Karta".

---

## Rule
When in doubt, **less color, more space**. Karta is calm, premium, and confident. Gold is a spice, not a sauce.
