# CLAUDE.md — Cardly Project

**Read this file fully at the start of every session before writing any code.**

---

## What Cardly Is

Cardly is a SaaS tool that lets event organizers and designers create personalized "I'm Attending" social cards for event attendees.

**Flow:**
1. Designer uploads an event design (PNG/JPG)
2. Designer defines editable zones (name, title, photo, role)
3. Designer publishes → gets a public shareable link
4. Attendee opens the link on a phone, fills in info, uploads a photo
5. Attendee downloads a personalized PNG to share on social media

**MVP scope:** static image cards only. No video, no animation, no team accounts, no marketplace.

**Edge over competitors (Premagic, CrowdCard):** designer-native. The designer uploads their own design — no template constraints. Built for event organizers and designers worldwide.

---

## Design Handoff

The folder `cardly-handoff/cardly/project/` contains 13 HTML prototypes exported from Claude Design. **These are the source of truth for LAYOUT, STRUCTURE, SPACING, TYPE SIZES, ANIMATIONS, AND COMPONENT ANATOMY.**

Files to read:
- A1 Landing Page.html
- A2 Pricing Page.html
- B1 Auth.html
- C1 Empty Dashboard.html
- C2 Events List.html
- C3 Event Detail.html
- D1 Upload Design.html
- D2 Canvas Editor.html (already a working React component with drag/resize/zoom — port carefully)
- D3 Publish and Share.html
- E1 Attendee Public Page.html (mobile-first, 375px viewport target)
- E2 Preview State.html
- E3 Success.html

**Rule:** Read the HTML files directly. Match layout, spacing, type sizes, animations, component structure exactly. No reinterpretation.

**IMPORTANT — Colors in the HTML files are OUTDATED.** The HTML uses an old purple/pink palette (`#6c63ff` / `#f8a4d8`). Ignore those colors. The current brand is forest + cream (see Brand System section below and BRAND.md).

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

**Animations (unchanged — keep keyframes from HTML)**
- `floatA` / `floatB` — hero floaters
- `zonePulse` — editor zone outlines
- `marquee` — logo strip
- `blink` — caret

**Retired (never use again)**
- `#6c63ff` (old purple)
- `#f8a4d8` (old pink)
- `#fafafa` (replaced by warm cream `#FAF6EE`)
- `#e5e5ea` (replaced by warm border `#E5E0D4`)
- Old purple/pink 135deg gradient

**Sources of truth (in order of priority)**
1. BRAND.md (most detailed)
2. This section in CLAUDE.md (summary)
3. Tailwind config (implementation)

The HTML files in `cardly-handoff/cardly/project/` are layout/structure reference only. Their colors are OUTDATED — use BRAND.md for all color decisions, not the HTML.

---

## Tech Stack (locked)

- **Framework:** Next.js 14, App Router, TypeScript (strict)
- **Styling:** Tailwind CSS
- **UI primitives:** shadcn/ui (button, input, card, dialog, dropdown-menu, tabs, badge, toast, avatar)
- **Database + Auth + Storage:** Supabase
- **Image rendering:** `sharp` (server-side, in API route only)
- **Forms:** react-hook-form + zod
- **State:** React Context for global, useState for local. No Redux, no Zustand.
- **Deployment:** Vercel
- **Package manager:** pnpm

**Do not add:** Redis, edge functions, microservices, GraphQL, tRPC, any state-management library, any CSS-in-JS library.

---

## Project Structure

```
cardly/
├── app/
│   ├── (marketing)/
│   │   ├── page.tsx                 → A1 Landing
│   │   └── pricing/page.tsx         → A2 Pricing
│   ├── (auth)/
│   │   ├── login/page.tsx           → B1 Auth (login)
│   │   └── signup/page.tsx          → B1 Auth (signup)
│   ├── (app)/
│   │   ├── dashboard/page.tsx       → C1 or C2 (conditional)
│   │   ├── events/
│   │   │   ├── new/page.tsx         → D1 Upload Design
│   │   │   ├── [id]/page.tsx        → C3 Event Detail
│   │   │   ├── [id]/edit/page.tsx   → D2 Canvas Editor
│   │   │   └── [id]/publish/page.tsx → D3 Publish & Share
│   ├── c/[slug]/page.tsx            → E1 Attendee (public, no auth)
│   ├── api/
│   │   ├── events/route.ts
│   │   ├── events/[id]/route.ts
│   │   ├── render/route.ts          → POST: generate personalized PNG
│   │   └── upload/route.ts
├── components/
│   ├── ui/                          → shadcn primitives
│   ├── editor/                      → canvas editor parts from D2
│   ├── landing/                     → A1 sections
│   └── shared/                      → nav, footer, logo
├── lib/
│   ├── supabase/                    → client + server helpers
│   ├── render/                      → sharp-based composition
│   └── utils.ts
├── types/
│   └── database.ts                  → generated from Supabase
└── tailwind.config.ts
```

---

## Database Schema (Supabase)

```sql
create table profiles (
  id uuid primary key references auth.users on delete cascade,
  email text unique,
  full_name text,
  plan text default 'free',           -- free | pro | studio
  created_at timestamptz default now()
);

create table events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade,
  name text not null,
  slug text unique not null,
  background_url text,
  background_width int,
  background_height int,
  zones jsonb not null default '[]'::jsonb,
  status text default 'draft',        -- draft | published | archived
  view_count int default 0,
  download_count int default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table generated_cards (
  id uuid primary key default gen_random_uuid(),
  event_id uuid references events(id) on delete cascade,
  attendee_name text,
  attendee_data jsonb,
  output_url text,
  created_at timestamptz default now()
);
```

**Zones JSON shape:**
```json
[
  {
    "id": "z1",
    "type": "text",
    "label": "Full Name",
    "x": 100, "y": 200, "w": 400, "h": 60,
    "font": "Inter", "size": 32, "weight": 600,
    "color": "#0F1F18", "align": "center",
    "required": true,
    "placeholder": "Your name"
  },
  {
    "id": "z2",
    "type": "photo",
    "label": "Photo",
    "x": 200, "y": 400, "w": 200, "h": 200,
    "shape": "circle",
    "required": true
  }
]
```

**RLS policies:**
- Users can read/write only their own rows in `events` and `generated_cards`.
- Public can `select` from `events` where `status = 'published'` filtered by `slug`.
- Public can `insert` into `generated_cards`.

---

## Build Order (do not skip ahead)

### Phase 1 — Foundation
1. `pnpm create next-app` with TypeScript + Tailwind + App Router
2. Port the Tailwind config — USE COLORS FROM BRAND.md, NOT FROM THE HTML FILES. Pull the layout, spacing, fonts, keyframes from the HTML; pull all colors from BRAND.md.
3. Set up Supabase project; output `.env.local.example`
4. Install shadcn primitives listed above
5. Write the migration SQL
6. Build auth (signup, login, logout, protected routes via middleware)
7. Build the marketing nav + footer (forest green primary, cream background)
8. Build A1 Landing Page (re-skin in forest+cream, NOT the old purple/pink from the HTML)

**STOP. Wait for human review before continuing.**

### Phase 2 — Designer App
9. Dashboard (C1 empty + C2 list, conditional on event count)
10. D1 Upload Design → upload to Supabase storage → create event row
11. C3 Event Detail page
12. D2 Canvas Editor — port the existing React component from the HTML. Wire it to save `zones` to the database with **800ms debounced auto-save**. Keep undo/redo. Re-skin zone outlines and handles to forest green.
13. D3 Publish & Share — generate slug (`event-name-xxxx`), mark as published, show link + QR

**STOP. Wait for human review.**

### Phase 3 — Attendee Experience (mobile-first, 375px first)
14. Public route `/c/[slug]` (E1) — load event, render background + zones, mobile form
15. `/api/render` — `sharp`-based image composition:
    - Load background from Supabase storage
    - Composite text zones with correct font, size, color, alignment
    - Composite photo cropped to shape (circle / square / rounded)
    - Return final PNG
    - Apply "Made with Cardly" watermark if user.plan === 'free'
16. E2 Preview — rendered card + download + share buttons
17. E3 Success — confirmation, suggested caption, share prompts

**STOP. End-to-end test: designer creates → attendee personalizes → downloads.**

### Phase 4 — Pricing & Polish
18. A2 Pricing
19. Plan limits: free = 1 event + watermark, pro = 10 events, studio = unlimited
20. View + download analytics on event detail page
21. Error states, loading states, empty states across all screens

---

## Critical Rules

1. **Match LAYOUT exactly, REPLACE COLORS.** Pull spacing, font sizes, animations, component structure from the HTML files. Pull all colors from BRAND.md only.
2. **Mobile attendee experience is non-negotiable.** Test E1 at 375px viewport. One-thumb operable. No tiny tap targets.
3. **Port the canvas editor, do not rewrite.** D2 already has working drag/resize/zoom logic in React. Re-skin colors only.
4. **Server-side image rendering only.** Never use html2canvas or browser-based rendering. Use `sharp` in API route.
5. **Watermark logic:** "Made with Cardly" bottom-center, small, semi-transparent. Only on free tier output.
6. **Slug format:** `lowercase-event-name-xxxx` where `xxxx` is a 4-char random suffix.
7. **Auto-save:** 800ms debounce after last change in the editor.
8. **TypeScript strict mode.** Type zones, database rows, API request/response.
9. **No premature optimization.** No caching layers, no edge runtime, no SSG where SSR works fine.
10. **Don't ask design questions.** The designs are final. Just implement.

---

## Definition of Done (MVP)

- A new user can sign up, upload a design, define zones, publish, and get a shareable link.
- An attendee can open the link on a phone, fill in info, upload a photo, and download a personalized PNG.
- The downloaded PNG visually matches the live preview.
- Free tier shows watermark; paid tier doesn't.
- Deployed on Vercel.
- Works on mobile Safari + Chrome.

---

## Communication Style with the Human

The human (Abdalla) is a designer, not a backend engineer. When you explain things:

- Be direct. No hedging.
- No corporate language.
- Show code. Then explain in 1–2 lines what it does.
- If something will take >30 minutes or break working features, **ask first**.
- If you hit an architectural fork, present 2 options max with a recommendation.
- Don't ask permission for routine implementation choices.
- If a request conflicts with this CLAUDE.md, point it out before complying.

---

## Things That Will Break the Build (do not do)

- Adding any library not listed in Tech Stack above
- Switching to Pages Router
- Using browser-based image rendering (html2canvas, dom-to-image, etc.)
- Skipping the design files and "improving" the UI from memory
- Using the OLD colors from the HTML files (#6c63ff, #f8a4d8, #fafafa, #e5e5ea) anywhere in the codebase
- Adding features beyond MVP scope (templates marketplace, team accounts, video output, AI features)
- Running ahead of the Build Order without human review at each STOP point
