# BRAND SWAP PROMPT — Run AFTER Phase 1 is verified, BEFORE Phase 2 starts

Paste the prompt below into Claude Code as a single message. Do not run any other instructions in the same session until this is complete and reviewed.

---

```
We are swapping Cardly's brand system from purple/pink to forest green + cream. This is a one-time, project-wide migration.

STEP 0 — READ THESE FILES FIRST, IN ORDER:
1. BRAND.md (the new brand system — this is the source of truth)
2. CLAUDE.md (project rules)
3. tailwind.config.ts (current config)
4. app/globals.css (any CSS variables)
5. Every file in cardly-handoff/cardly/project/ (the 13 HTML mockups)

After reading, confirm you understand:
- The new color tokens from BRAND.md
- That cream (#FAF6EE) replaces pure off-white as the app background
- That the old purple #6c63ff and pink #f8a4d8 are completely retired
- That borders must be warm (#E5E0D4), not grey

DO NOT WRITE CODE YET. Reply with a one-paragraph summary of what you will change, and the list of files you will touch. Wait for my "approved" before continuing.

STEP 1 — UPDATE TAILWIND CONFIG
Update tailwind.config.ts so the theme.extend.colors block matches BRAND.md exactly. Add all tokens: primary, primary-dark, primary-soft, accent, accent-dark, ink, ink-soft, muted, cream, surface, border, border-strong, success, warning, danger, info.

Also update:
- Box shadows: shadow-soft, shadow-lift to the new values from BRAND.md
- Background image utility for the gradient (1F4D3A → 2A6A50 → E8C57E)

STEP 2 — UPDATE GLOBAL CSS
- Set body bg to `bg-cream`, text to `text-ink`
- Update any CSS custom properties (--shadow-soft, --shadow-lift, --shadow-focus)
- Remove any references to #6c63ff, #f8a4d8, #e5e5ea, #fafafa
- Keep DM Sans, Inter, JetBrains Mono — typography is unchanged

STEP 3 — SEARCH AND REPLACE ACROSS THE CODEBASE
Find every occurrence of the old tokens and replace with the new ones:

Color hex replacements:
- #6c63ff → #1F4D3A
- #f8a4d8 → #E8C57E
- #0f0f1a → #0F1F18 (ink shift)
- #fafafa → #FAF6EE (cream)
- #e5e5ea → #E5E0D4 (warm border)

Tailwind class replacements:
- bg-primary stays bg-primary (now resolves to new green) — verify no inline #6c63ff exists
- text-primary same logic
- Replace any hardcoded `bg-[#6c63ff]` or `text-[#f8a4d8]` with `bg-primary` / `text-accent`
- Replace `bg-white` used as page bg with `bg-cream` (KEEP `bg-white` only for cards, modals, inputs — surfaces that sit on cream)
- Replace any `bg-fafafa` or `bg-[#fafafa]` with `bg-cream`

DO NOT change:
- Typography
- Spacing
- Shadows structure (just the rgba values)
- Component logic
- Any animation keyframes (floatA, floatB, zonePulse, marquee, blink)

STEP 4 — UPDATE COMPONENTS THAT NEED MANUAL ATTENTION

Buttons:
- Primary CTA: `bg-primary text-cream hover:bg-primary-dark`
- Secondary: `bg-cream text-ink border border-border hover:bg-primary-soft`
- Accent (Publish, Upgrade only): `bg-accent text-ink hover:bg-accent-dark`
- Ghost: `text-ink-soft hover:bg-primary-soft`
- Destructive: `bg-danger text-cream`

Nav: `bg-cream/80 backdrop-blur-md`. Active link `text-primary`. Inactive `text-ink-soft`.

Inputs:
- `bg-white border-border` 
- Focus: `border-primary` + custom ring `shadow-[0_0_0_3px_rgba(31,77,58,0.15)]`
- Error: `border-danger`

Cards: `bg-white border border-border rounded-2xl shadow-soft hover:shadow-lift`

Badges:
- Default: `bg-primary-soft text-primary`
- Premium: `bg-accent/30 text-[#9A7A2E]` (darker for accessibility)
- Status: `bg-success/15 text-success`

Editor canvas zones (D2):
- Dashed outline: `border-primary` (still uses zonePulse animation)
- Selected: solid `border-primary-dark` 2px
- Snap guides: 1px lines in `accent` color
- Handles: small `bg-primary` squares at corners

STEP 5 — UPDATE THE LANDING PAGE GRADIENT
The hero gradient must use the new direction:
`linear-gradient(135deg, #1F4D3A 0%, #2A6A50 60%, #E8C57E 100%)`

Floating shapes in the hero use `bg-primary/20` and `bg-accent/30` instead of the old purple/pink.

STEP 6 — VERIFY
After all changes, run:
- `pnpm dev`
- Open every page that exists so far (landing, login, signup, dashboard if built)
- Confirm:
  - No purple anywhere
  - No pink anywhere
  - No pure white page backgrounds (cream instead, except inside cards)
  - No cool grey borders (warm beige instead)
  - DM Sans / Inter / JetBrains Mono still load
  - The hero gradient is forest-to-cream-gold
  - Buttons feel right (solid green primary, never gradient)

STEP 7 — REPORT
Show me:
1. The diff summary (which files changed, how many lines)
2. Screenshots or a description of: landing page hero, primary button states, a card, an input focus state
3. Anything you noticed that didn't translate cleanly and needs my decision

DO NOT TOUCH:
- The HTML files in cardly-handoff/cardly/project/ — those are reference, not source. Leave them as-is.
- Any feature behavior — this is a pure visual swap.
- Phase 2 work — we are not building new screens in this session.

When done, commit with the message: `feat: brand swap to forest + cream`
```

---

## How to use this file

1. **Finish Phase 1 first.** Auth works. Landing page exists. You've verified everything per the Phase 1 checklist in CLAUDE.md.
2. **Make sure BRAND.md is saved in the project root** next to CLAUDE.md.
3. **Open a fresh Claude Code session** (don't continue an old polluted one).
4. **Paste the full prompt above** — from "We are swapping" to "feat: brand swap to forest + cream".
5. **Approve the plan step.** Don't let it skip to writing code without showing you the plan first.
6. **Review screenshots.** Verify no purple, no pink, no grey borders, cream backgrounds, green CTAs.
7. **Commit and move to Phase 2.**

## Why this discipline matters

- **Single-shot migration:** All visual changes happen in one focused session. No drift over time.
- **Reference HTML untouched:** The 13 HTML mockups stay as visual reference for layout, not color. Color is locked in BRAND.md.
- **Phase 1 verified first:** You don't repaint a house that isn't built yet.

## What this prompt does NOT do

- Doesn't change layouts or features
- Doesn't touch the canvas editor's drag/resize/zoom logic
- Doesn't redesign anything from scratch
- Doesn't add or remove screens

It is a surgical color migration. Nothing else.
