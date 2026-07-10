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

## 5. Reference implementation

The two source-of-truth files already implementing this:

- `directory/directory.html` — defines `:root { --title:'Plus Jakarta Sans', sans-serif; }` and applies it to `.hero h1`, `.sh h2`, `.cta-quote`, `.cta-right h3`. Everything else uses `--display` / `--body` / `--mono`.
- `site/landing-page.html` — sets `.font-display { font-family:'Plus Jakarta Sans'; letter-spacing:-0.035em; }` with tweakable `--title-weight: 800`, `--title-tracking: -0.045em`.

Match those exactly. When in doubt about a given heading, open `directory.html` and copy the corresponding rule.

---

## 6. Migration checklist (per page)

1. Add `Plus+Jakarta+Sans:wght@400;500;600;700;800` to the page's font import.
2. Make sure the page imports `karta/karta.css` (so `--title` resolves). If a page hard-codes fonts inline instead of using tokens, add the `--title` token locally.
3. Find the **largest headings** (hero/page title, section H2s, CTA headings, quotes) → switch to `var(--title)`, apply the weight + tracking from §3.
4. Leave all buttons, nav, card titles, labels, and numeric UI on DM Sans / Inter / JetBrains Mono.
5. Verify no `var(--title)` resolves to the browser default (i.e. the token is defined and the font loaded).
