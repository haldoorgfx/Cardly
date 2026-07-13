# Eventera — Marketing Site Redesign Brief (for Claude design)

> Paste this whole document into Claude design as the master brief. It defines **who Eventera is**, the **calm/editorial visual system**, the **exact type + color tokens**, and a **page-by-page screen spec** for every marketing page. Design all screens as one coherent system. Do **not** invent a new brand — refine the existing forest + cream identity into something calmer and more realistic (less "AI-generated SaaS", more design-led African-modern editorial).

---

## 0. The one-paragraph brief

Eventera is a full event-management platform and marketplace for Africa and beyond (Djibouti, Ethiopia, Kenya, Somalia, UAE, global). Organizers create any kind of event — conferences, NGO gatherings, corporate events, festivals — and manage registration, tickets, agenda, speakers, sponsors, check-in, live engagement, and analytics in one place. The **signature differentiator** is the **Eventera Card**: a personalized, branded card auto-generated for every registered attendee, made to be shared on social. There is also a native **Eventera mobile app** (iOS + Android) for attendees (ticket wallet, card, offline check-in, biometric login) and organizers (on-site scanning). Design the marketing site to feel **calm, confident, real, and premium** — the way a design studio's own site feels, not a template.

---

## 1. Design north star (READ FIRST — this is the whole point)

We are removing "AI slop" and making the site feel like a **real, human-designed product**. Reference feeling: **cre8so.com** and **dugsiiye.com** (both are our sister brands — study their restraint, their big bold tightly-tracked headings, their calm neutral canvases, their single accent colour, their generous whitespace).

**Do:**
- **Big, bold, tightly-tracked headings.** Display type at 700–800 weight, negative letter-spacing (−0.02 to −0.04em), large sizes. Confident, not timid.
- **Calm neutral canvas.** Warm paper background, white surfaces, near-black ink. Lots of breathing room.
- **One accent, used once per screen.** Forest green is the brand; gold is a rare highlight ("one look-here moment"). Never a second accent (no blue/teal/purple/pink).
- **Real content.** Real event names, real feature descriptions, real African cities. No lorem, no fabricated metrics ("87% avg check-in" style invented stats are banned).
- **Big, tactile buttons.** Generous padding, clear hierarchy — one primary CTA per section.
- **Depth by restraint.** Elevation = paper→white lift + a 1px warm hairline border + at most one soft shadow. Never glows.
- **Editorial layout.** Asymmetry is welcome. Avoid the default "three glowing feature cards in a centered row."

**Don't (these are the AI-slop tells we're killing):**
- ❌ Coloured glow shadows (`0 0 40px rgba(gold)`), stacked shadows, neon halos.
- ❌ Gradient fills on body cards, list rows, buttons, badges. (One sanctioned brand gradient exists — see §3 — used only on the hero canvas / premium moments.)
- ❌ Blurred radial "atmospheric light source" blobs behind headings.
- ❌ Emoji used as UI icons. Use a single line-icon set (Lucide) at consistent stroke.
- ❌ Pure black (#000) or pure cold white (#fafafa). Use warm ink + warm paper.
- ❌ Decorative monospace / "developer-tool" mono labels.
- ❌ Fake testimonials or invented statistics.
- ❌ Centered-symmetry everything; identical rotating gradient cards.

---

## 2. Typography — strict TWO-font system

Only two families across the entire site. (This replaces the old DM Sans / JetBrains Mono setup.)

| Role | Font | Usage |
|---|---|---|
| **Display / headings** | **Plus Jakarta Sans** | All H1–H3, big numbers, wordmark, section titles, CTAs. Weights 600 / 700 / 800. Tight tracking: −0.03em at large sizes, −0.02em mid. |
| **Body / UI** | **Inter** | Paragraphs, labels, nav, captions, table text, form fields, eyebrows. Weights 400 / 500 / 600. Normal tracking; eyebrows use +0.08em uppercase at 500. |

**Type scale (desktop; scale down ~15–20% on mobile):**
- Hero H1: 64–80px, Jakarta 800, tracking −0.03em, line-height 1.02–1.05
- Section H2: 40–52px, Jakarta 700, tracking −0.025em, line-height 1.08
- Sub-head H3: 22–28px, Jakarta 700, tracking −0.02em
- Lead paragraph: 18–20px, Inter 400, line-height 1.6, colour ink-soft
- Body: 16px, Inter 400, line-height 1.65
- Eyebrow / label: 12–13px, Inter 600, uppercase, tracking +0.08em, colour muted or forest
- Caption / meta: 13–14px, Inter 400/500, colour muted

Body text minimum 16px. Line length 60–75 characters. Never body text below 14px.

---

## 3. Colour system (Eventera brand — keep, but apply calmly)

Semantic tokens (design to these, not raw hex in your head):

| Token | Hex | Use |
|---|---|---|
| **Forest (primary)** | `#1F4D3A` | Primary buttons, links, active states, the brand |
| Forest dark | `#163828` | Hover, deep gradient stop |
| Forest soft | `#E8EFEB` | Tint fills, active nav backgrounds, quiet chips |
| **Gold (accent)** | `#E8C57E` | RARE highlight — one moment per screen (a peak bar, a premium badge, an underline). Never a fill for whole cards. |
| Gold deep | `#C9A45E` | Gold text on light, gold hover |
| **Ink (text)** | `#0F1F18` | Headings, primary text (warm near-black, never #000) |
| Ink soft | `#3A4A42` | Body text, secondary |
| Muted | `#6B7A72` | Captions, meta, placeholders |
| **Cream (canvas)** | `#FAF6EE` | Page background (warm paper — never pure white for the page) |
| Surface | `#FFFFFF` | Cards, modals, inputs (lift off the cream) |
| Border | `#E5E0D4` | Hairline borders (warm beige, 1px) |
| Success `#2D7A4F` · Warning `#C97A2D` · Danger `#B8423C` | | Status only, always paired with an icon/label |

**The one sanctioned gradient** (hero canvas / premium card / app-badge only, never on buttons or body cards):
`linear-gradient(135deg, #1F4D3A 0%, #2A6A50 60%, #E8C57E 100%)`

**Skeleton bars in product mockups:** `#E7E2D6` (warm) — used to imply secondary UI content without fake paragraphs.

---

## 4. Layout, spacing, components

- **Grid:** 12-col, max content width 1200–1280px, generous gutters. Full-bleed section backgrounds, contained content.
- **Spacing scale:** 4 / 8 / 12 / 16 / 24 / 32 / 48 / 64 / 96. Section vertical padding 96–128px desktop, 64px mobile.
- **Radius:** inputs/buttons 12px, cards 16px, big panels 20–24px, pills 999px.
- **Shadows (only two):** `soft` = `0 1px 2px rgba(15,31,24,.04), 0 8px 24px rgba(15,31,24,.06)`; `lift` (hover) slightly stronger. No third shadow, no coloured shadow.
- **Buttons:** Primary = forest fill, white text, 48–56px tall, 20–28px horizontal padding, Jakarta 600, 12px radius, subtle lift on hover (translateY −1px, no glow). Secondary = white surface, 1px border, ink text. Big and tactile.
- **Icons:** Lucide, 1.7–2px stroke, consistent sizes (16 / 20 / 24). One icon language.
- **Nav:** sticky top bar on cream, wordmark left, links center/right, one primary CTA ("Start free"). Mobile = clean full-screen menu. Include a **"Discover events"** entry and a **"Get the app"** entry.
- **Footer:** calm multi-column (Product / Solutions / Company / Developers / Legal), app-store badges, brand line. No gradient, no glow.
- **Motion:** 140–220ms, ease `cubic-bezier(0.2,0,0,1)`. Only meaningful motion (the live-dot pulse, subtle device float, reveal-on-scroll). Respect prefers-reduced-motion.

---

## 5. Reuse the product mockups (IMPORTANT)

We already built six high-fidelity, on-brand product-UI illustrations. **Reuse these exact scenes** as the site's hero and section visuals — do not redraw them in a different style. Improve their placement/framing only.

1. **Dashboard hero** — organizer dashboard in a browser window + an attendee Eventera Card on a phone (registrations 847, cards shared 1,204, check-ins 412, a 7-day chart with a gold Saturday peak).
2. **Registration** — mobile registration flow on a dark forest panel ("Register & get your Eventera Card", card generated in 2 seconds).
3. **Analytics** — analytics dashboard (total registrations, revenue, cards shared, check-in rate; registrations-over-time chart; session engagement table).
4. **The Eventera Card** — three branded cards fanned (initials avatar, name, role, social pills, "Download card").
5. **Live Q&A** — live Q&A + polls dashboard with a companion phone.
6. **How it works** — a horizontal strip: Create event → Add tickets → Build agenda → Attendees register → Track live.

They use forest + one gold per scene, `#E7E2D6` skeleton bars, Lucide icons, `eventera.so` URLs, and only a live-dot pulse animates. Match new illustrations to this language if you need more.

---

## 6. The Eventera mobile app — must be told across the site

We have a native **Eventera app** (iOS + Android). Weave it into the marketing site so both **attendees** and **organizers** know it exists. Required placements:

- **A dedicated "Eventera app" landing section** (and ideally a standalone `/app` or `/mobile` page) — phone mockups, App Store + Google Play badges, a short feature list.
- **A slim "Get the app" band** in the nav and footer (store badges).
- **A callout on the Discover page and the attendee/ticket story** ("Your tickets, cards, and check-in live in the app").

**Attendee app features to show:** ticket wallet with QR, the Eventera Card (reveal / personalize / share), event agenda & community, entitlements (meal/access passes), offline check-in, biometric (Face/Touch ID) sign-in, push reminders, add-to-calendar.
**Organizer app features to show:** on-site QR check-in scanner, entitlement/meal scanning with offline queue, live attendee counts, lead scanning for sponsors.

Design phone mockups in the same calm forest+cream language as the web scenes (light theme, one gold moment).

---

## 7. Pages to design (screen-by-screen)

Design each at **desktop (1440) and mobile (390)**. Order = priority.

### A. Home / Landing (`/`)
The flagship. Sections, in order:
1. **Hero** — eyebrow ("The complete event platform"), big Jakarta H1 (e.g. *"Run the event. Give every attendee a card worth sharing."*), one-line lead, two CTAs (primary "Start free", secondary "See the platform"), trust row ("Free for 1 event · No credit card · Setup in 10 minutes"). Visual = **Mockup 1 (dashboard + phone card)** bleeding to the right edge on cream.
2. **Logo/trust strip** — "Built for every kind of event" with real event-type chips (Conferences, NGO & summits, Corporate, Festivals, Workshops, Community).
3. **Platform overview** — one calm feature grid (Registration, Tickets, Agenda, Speakers, Check-in, Analytics, Live Q&A, Networking, Sponsors, The Card). Line icons, short real descriptions, NO gradient card headers.
4. **The Eventera Card** — the signature story. Big statement + **Mockup 4 (card fan)** + 3 supporting points (auto-generated on registration · branded to your event · built to be shared).
5. **Registration that feels like the event** — copy + **Mockup 2**.
6. **Analytics you'll actually read** — copy + **Mockup 3**.
7. **Live engagement** — Q&A / polls / networking — copy + **Mockup 5**.
8. **From idea to live in minutes** — **Mockup 6** how-it-works strip, expanded into 5 real steps.
9. **Get the Eventera app** — §6 app section (phone mockups + store badges).
10. **Pricing preview** — Free / Pro / Studio three-up (link to full pricing). Popular = solid forest card (not gradient).
11. **Social proof** — real, attributable quotes OR, if none exist yet, an honest "Trusted by organizers across East Africa" with logos/placeholders clearly meant to be filled. **Do not fabricate testimonials.**
12. **FAQ teaser** (3–4 questions) → link to full FAQ.
13. **Final CTA** — big forest panel (sanctioned gradient allowed here), "Start free", secondary "Talk to us". No radial glow.

### B. About us (`/about`)
Mission (events + the Card, African-modern, designer-grade), the story, what we believe (a short principles list), the markets we serve (Djibouti, Ethiopia, Kenya, Somalia, UAE + global), team/founder section (Cre8so family), and a closing CTA. Editorial, photo-forward, calm.

### C. FAQ (`/faq`) — NEW page (currently only a home section)
Categorized accordion: Getting started · Pricing & billing · The Eventera Card · Registration & tickets · Check-in & on-site · The mobile app · Data & privacy · Developers/API. Big searchable header, clean accordion (hairline dividers, no cards-with-glows), "still need help?" → Help/Contact.

### D. Help Center (`/help`)
Support hub: search bar hero, category tiles (Account, Events, Registration, The Card, Payments, Check-in, Mobile app, API), popular articles list, contact/section for "can't find it?". Calm docs feel — think a well-designed knowledge base, not a marketing page. Article template too (sidebar nav + readable 65-char measure).

### E. Discover events (`/discover`)
The attendee-facing marketplace. Hero search ("Find events in your city"), category chips (real categories), city chips (Nairobi, Addis, Djibouti, Mogadishu, Dubai…), a clean **event card grid** (cover image, title, date, city, host, price/Free), filters (date, category, price, city), and an **"Get the app to save & register faster"** band. Event card = image top, hairline border, ink title, muted meta, small forest price pill. No gradient cards, no glow.

### F. Pricing (`/pricing`)
Free ($0) / Pro ($19/mo) / Studio ($49/mo) with an honest feature matrix (events, cards/month, variants, brand kits, seats, watermark, ERA AI, API, white-label). Toggle monthly/annual. FAQ about billing. Popular tier = solid forest. Calm comparison table below.

### G. Features index (`/features`) — NEW
A hub linking the 10 existing feature pages (Registration, Tickets, Agenda, Speakers, Check-in, Analytics, Q&A/Polls, Networking, Sponsors, The Eventera Card, Gamification). Each = tile with line icon + one real sentence. Keep the individual feature-page template consistent (hero statement + one mockup + 3 proof points + CTA).

### H. Contact (`/contact`)
Simple: a real form (name, email, org, message, reason), calm layout, response-time note, alternate channels (email, socials), and an org/enterprise "Talk to sales" path. One column, big inputs, no gradient.

### I. The Eventera app (`/app` or `/mobile`) — NEW standalone
Full landing for the mobile app per §6 — hero phone, attendee vs organizer split, feature grid, store badges, "scan to download" QR.

### (Also keep consistent, lower priority) Use-cases, individual feature pages, Blog, What's-new/changelog, Careers, Developers/API, Legal (Privacy/Terms/DMCA), Status. Same system, same two fonts, same calm.

---

## 8. Deliverable format

For each page: desktop + mobile frames, using the exact tokens above, reusing the six product mockups where noted. Annotate the type scale and spacing. Keep every screen inside the two-font, one-accent, no-glow system. When in doubt, choose the calmer, more editorial, more real option.
