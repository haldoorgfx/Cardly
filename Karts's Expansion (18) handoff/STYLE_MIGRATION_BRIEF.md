# Karta — Typography Migration Brief

**Goal:** roll the new type style from `directory/directory.html` and `site/landing-page.html` out across every surface of the platform (dashboard, attendee app, studio, speaker/exhibitor portals, onboarding, support, emails, auth, etc.).

**Scope:** this is a **typography-only** change. Colors, spacing, radii, elevation, buttons, and all components are unchanged — they continue to come from `karta/karta.css`. Do **not** touch the color or component layers.

---

## 1. What actually changed

The rebuild introduced **one new typeface** as the editorial/display face: **Plus Jakarta Sans**. It is used for large marketing/editorial headings only. Everything else in the type system is unchanged:

| Role | Font | Status |
|------|------|--------|
| **Editorial / display headings** (hero H1, section H2, big CTA headings, pull-quotes) | **Plus Jakarta Sans** | ⬅ NEW |
| **Functional UI display** (buttons, nav links, card titles, stat values, labels, logo) | DM Sans (`--display`) | unchanged |
| **Body / paragraphs / meta / inputs** | Inter (`--body`) | unchanged |
| **Numbers / codes / timestamps / copyright** | JetBrains Mono (`--mono`) | unchanged |

The mental model: **Plus Jakarta Sans = the "voice"** (headlines that sell), **DM Sans = the "interface"** (buttons, labels, controls). Don't replace DM Sans wholesale — only promote the big headings.

---

## 2. The new token

Add a `--title` token to `:root` in `karta/karta.css` (right next to the existing `--display` / `--body` / `--mono`):

```css
--title: 'Plus Jakarta Sans', sans-serif;
```

And load the font wherever the existing Google Fonts `<link>` / `@import` lives. Add this family to the request:

```
Plus+Jakarta+Sans:wght@400;500;600;700;800
```

Full combined import string (matches what the rebuilt pages use):

```html
<link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,600&family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">
```

---

## 3. Where to apply `--title`

Apply `font-family: var(--title)` to **editorial headings** — the large, attention-grabbing text. Concretely, the rebuilt pages use it on:

- Hero `h1` / page-title headlines
- Section headers (`h2` — the "Trending events", "Explore by category" style headers)
- Large CTA / banner headings (`h3` inside CTA bands)
- Pull-quotes / testimonial quotes

Each gets a **bold weight** and **tight tracking**. Recommended rules:

```css
/* Big editorial headline */
.hero h1, .page-title {
  font-family: var(--title);
  font-weight: 700;          /* 800 acceptable for top-level marketing hero */
  letter-spacing: -0.035em;
  line-height: 1.02;
}

/* Section header */
h2.section-title, .sh h2 {
  font-family: var(--title);
  font-weight: 700;
  letter-spacing: -0.025em;
  line-height: 1.18;
}

/* CTA / banner heading */
.cta-heading {
  font-family: var(--title);
  font-weight: 700;
  letter-spacing: -0.025em;
}

/* Pull-quote (lighter weight, less tracking) */
.pull-quote {
  font-family: var(--title);
  font-weight: 500;
  letter-spacing: -0.01em;
  line-height: 1.45;
}
```

**Tracking scale to follow** (larger text = tighter):
- 60px+ hero → `-0.035em` to `-0.045em`
- 24–32px section/CTA → `-0.025em`
- pull-quote / 20px → `-0.01em`

**Weight rule:** marketing/landing hero → `800`; in-app and section headings → `700`; quotes → `500`.

---

## 4. Where to LEAVE DM Sans (`--display`)

Do **not** convert these to `--title` — they stay on DM Sans:

- Button labels (`.btn`)
- Nav links, the logo wordmark
- Card titles inside list/grid cards (event card `.ti`, etc.)
- Stat **labels** and numeric values, tags, pills, chips
- Form field labels, table headers, any small UI text ≤ ~16px

Rule of thumb: if the text is part of a **control or a dense data UI**, keep DM Sans. If it's a **headline meant to be read first**, use Plus Jakarta Sans.

---

## 5. Reference implementations

Three source-of-truth files already implement this — pick the one matching the page's stack:

- **Plain CSS + tokens** → `directory/directory.html`. Defines `:root { --title:'Plus Jakarta Sans', sans-serif; }` and applies it to `.hero h1`, `.sh h2`, `.cta-quote`, `.cta-right h3`. Everything else uses `--display` / `--body` / `--mono`.
- **Plain CSS, tweakable** → `site/landing-page.html`. Sets `.font-display { font-family:'Plus Jakarta Sans'; letter-spacing:-0.035em; }` with tweakable `--title-weight: 800`, `--title-tracking: -0.045em`.
- **Tailwind + React app** → `dashboard/` (worked example, already migrated). See §5a for the exact pattern.

When in doubt about a given heading, open the matching reference and copy the corresponding rule.

### 5a. Tailwind / React pages (dashboard, attendee, studio, portals, onboarding, auth, emails)

These don't use `karta.css` tokens — they declare fonts in a `tailwind.config` block and `.font-*` CSS classes. Apply the migration like this (all already done in `dashboard/dashboard.html`):

1. **Font import** — add `Plus+Jakarta+Sans:wght@400;500;600;700;800` to the page's Google Fonts `<link>`.
2. **Tailwind config** — add a `title` family above `display` in `fontFamily`:
   ```js
   fontFamily: {
     title: ['"Plus Jakarta Sans"', "sans-serif"],
     display: ['"DM Sans"', "sans-serif"],
     sans: ['"Inter"', "sans-serif"],
     mono: ['"JetBrains Mono"', "monospace"],
   },
   ```
3. **CSS class** — add next to the existing `.font-display`:
   ```css
   .font-title { font-family: "Plus Jakarta Sans", sans-serif; letter-spacing: -0.025em; }
   ```
4. **Swap the headings** — on **page/section title `<h1>`s only**, change `font-display` → `font-title` and tighten the Tailwind tracking utility:
   - 22–26px titles: `tracking-[-0.02em]` → `tracking-[-0.025em]`
   - 28–32px hero titles: `tracking-[-0.02em]` → `tracking-[-0.03em]`

   The reliable selector to find them: an `<h1>` whose class starts with `font-display text-[NNpx] … text-primary` (or `text-cream` on dark hero bands). The shared `PageHeader` component (`dash-ui.jsx`) covers most screens at once.

5. **Leave alone:** every `font-display` that is NOT a page/section `<h1>` — button labels, pills, table headers, avatar initials, stat captions, sidebar items. Those stay DM Sans.

**Files migrated in the dashboard worked example:** `dashboard.html` (infra), `dash-ui.jsx` (PageHeader + 404), `screens-home.jsx`, `screens-subpages.jsx`, `screens-details.jsx`, `screens-event.jsx`.

> ⚠️ `dashboard/auth.html` is a **separate entry point** with its own font import + tailwind config — it was intentionally left for the rollout. Apply steps 1–4 to it too (its one page title is the `{v.title}` `<h1>`).

---

## 6. Migration checklist (per page)

1. Add `Plus+Jakarta+Sans:wght@400;500;600;700;800` to the page's font import.
2. Make sure the page imports `karta/karta.css` (so `--title` resolves). If a page hard-codes fonts inline instead of using tokens, add the `--title` token locally.
3. Find the **largest headings** (hero/page title, section H2s, CTA headings, quotes) → switch to `var(--title)`, apply the weight + tracking from §3.
4. Leave all buttons, nav, card titles, labels, and numeric UI on DM Sans / Inter / JetBrains Mono.
5. Verify no `var(--title)` resolves to the browser default (i.e. the token is defined and the font loaded).
