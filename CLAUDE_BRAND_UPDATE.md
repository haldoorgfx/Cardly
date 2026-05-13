# CLAUDE.md — UPDATED BRAND SECTION

**Replace the "Brand System" section in your existing CLAUDE.md with the block below. Keep the rest of CLAUDE.md unchanged.**

---

## Brand System (see BRAND.md for full details — this is the summary)

**Direction:** Forest + Cream. Editorial, African-modern, designer-grade. Quiet confidence. The brand frames the user's event design — it never competes with it.

**Colors**
- Primary: `#1F4D3A` (deep forest green)
- Primary dark: `#163828`
- Primary soft: `#E8EFEB`
- Accent: `#E8C57E` (warm cream-gold, used sparingly)
- Accent dark: `#C9A45E`
- Ink: `#0F1F18` (text)
- Ink soft: `#3A4A42`
- Muted: `#6B7A72`
- Cream: `#FAF6EE` (app background, NOT pure white)
- Surface: `#FFFFFF` (cards, modals, inputs)
- Border: `#E5E0D4` (warm beige, NOT cool grey)
- Border strong: `#C9C3B1`

**Functional**
- Success: `#2D7A4F`
- Warning: `#C97A2D`
- Danger: `#B8423C`
- Info: `#3A6B8C`

**Gradient (hero, illustrations, premium tier only)**
`linear-gradient(135deg, #1F4D3A 0%, #2A6A50 60%, #E8C57E 100%)`

**Typography (unchanged)**
- Display: DM Sans (headings, letter-spacing -0.02em)
- Sans: Inter (body, UI)
- Mono: JetBrains Mono (labels, IDs, code)

**Shadows**
- soft: `0 1px 2px rgba(15,31,24,0.04), 0 8px 24px rgba(15,31,24,0.06)`
- lift: `0 4px 12px rgba(15,31,24,0.08), 0 24px 60px rgba(31,77,58,0.12)`
- focus: `0 0 0 3px rgba(31,77,58,0.15)`

**Animations (unchanged)**
- `floatA` / `floatB` — hero floaters
- `zonePulse` — editor zone outlines
- `marquee` — logo strip
- `blink` — caret

**Retired (never use again)**
- `#6c63ff` (old purple)
- `#f8a4d8` (old pink)
- `#fafafa` (replaced by warm cream)
- `#e5e5ea` (replaced by warm border)
- Old purple/pink gradient

**Sources of truth (in order of priority)**
1. BRAND.md (most detailed)
2. This section in CLAUDE.md (summary)
3. Tailwind config (implementation)

The HTML files in `cardly-handoff/cardly/project/` are layout/structure reference only. Their colors are OUTDATED — use BRAND.md for all color decisions, not the HTML.
