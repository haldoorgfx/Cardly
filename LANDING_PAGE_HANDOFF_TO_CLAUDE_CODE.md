# CARDLY — LANDING PAGE & MARKETING SITE HANDOFF TO CLAUDE CODE

**This prompt redesigns the marketing pages (landing, use cases, pricing, how it works, about) to match the new design language from Claude Design. SCOPED: only marketing pages. Editor, attendee experience, render API, dashboard, auth — all UNTOUCHED.**

---

## How to use this prompt

1. Make sure you're on `master` and clean:
   ```
   cd C:\Users\cabda\cardly
   git checkout master
   git status
   git pull origin master
   ```

2. The new landing page design reference files are already in your project at:
   ```
   C:\Users\cabda\cardly\Cardly-handoff\Cardly\project\
   ```
   The 16+ marketing reference files Claude Code will use (read-only):
   - `landing-page.jsx` (L1 — main landing page)
   - `sections-top.jsx` (L1 sections: nav, hero, social proof, problem)
   - `sections-bottom.jsx` (L1 sections: FAQ, final CTA, footer)
   - `use-cases-page.jsx` and `use-cases-app.jsx` (L2)
   - `pricing-page.jsx` and `pricing-app.jsx` (L3)
   - `how-it-works-page.jsx` and `how-it-works-app.jsx` (L4)
   - `about-page.jsx` and `about-app.jsx` (L5)
   - `L6 Mobile Nav and Footer.html` (shared nav + footer)
   - `footer-showcase.jsx` (footer reference)
   - `icons.jsx` (shared icon definitions)
   - `app.jsx` (shared App wrapper, if applicable)

   The same folder also contains older attendee and editor reference files plus older HTML mockups. Claude Code will be told to IGNORE all non-landing-page files.

3. Open Claude Code and paste the prompt below.

---

## THE PROMPT — PASTE EVERYTHING BELOW THIS LINE INTO CLAUDE CODE

```
We are doing a SCOPED redesign of the MARKETING surface of Cardly — the public pages potential customers see BEFORE signing up. The product (editor + attendee experience) is already shipped and working — we are NOT touching it.

The 6 new marketing pages have been designed in Claude Design and exported as JSX reference files located in `Cardly-handoff/Cardly/project/`. Your job: faithfully reimplement those designs as production Next.js pages while keeping all existing product surfaces untouched.

────────────────────────────────────────────
ABSOLUTE NON-NEGOTIABLE BOUNDARIES
────────────────────────────────────────────

You ARE allowed to touch ONLY:
- `app/(marketing)/page.tsx` — the landing page at `/` (REPLACE)
- `app/(marketing)/pricing/page.tsx` — pricing page (REPLACE)
- `app/(marketing)/layout.tsx` — marketing layout (UPDATE for new nav/footer)
- NEW: `app/(marketing)/use-cases/page.tsx` — create new route
- NEW: `app/(marketing)/how-it-works/page.tsx` — create new route
- NEW: `app/(marketing)/about/page.tsx` — create new route
- NEW component files inside `components/marketing/` for shared marketing components (nav, footer, hero, etc.)

You are FORBIDDEN from touching:
- `app/c/[slug]/**` — the attendee experience (just shipped, do NOT regress)
- `app/api/**` — all API routes (render, events, upload, etc.)
- `app/(app)/**` — dashboard, event detail, event creation, publish flow, editor
- `app/(auth)/**` — signup, login, logout
- `components/editor/**` — the canvas editor (just shipped)
- `middleware.ts` — auth middleware
- `lib/supabase/**` — Supabase client/server helpers
- `supabase/migrations/**` — database schema
- `types/database.ts` — type definitions (READ ONLY)
- `scripts/**`, `vercel.json`, `next.config.mjs`, `tsconfig.json`
- `tailwind.config.ts` — already configured with brand tokens, no changes needed
- `app/globals.css` — already cleaned, no changes needed
- `Cardly-handoff/**` — design reference folder (READ-ONLY)

If you find yourself wanting to "improve" anything outside the allowed list — STOP and ask me first.

────────────────────────────────────────────
STEP 0 — READ FIRST
────────────────────────────────────────────

Read these in order, completely. Do not skip.

1. `CLAUDE.md` (project rules)
2. `BRAND.md` (brand system — locked)
3. `tailwind.config.ts` (confirm brand tokens already in place — do NOT modify)
4. `app/globals.css` (confirm already cleaned — do NOT modify)
5. `app/(marketing)/layout.tsx` (current marketing layout)
6. `app/(marketing)/page.tsx` (current landing page — being REPLACED)
7. `app/(marketing)/pricing/page.tsx` (current pricing page — being REPLACED)
8. Reference files in `Cardly-handoff/Cardly/project/`:
   - `landing-page.jsx`
   - `sections-top.jsx`
   - `sections-bottom.jsx`
   - `use-cases-page.jsx` and `use-cases-app.jsx`
   - `pricing-page.jsx` and `pricing-app.jsx`
   - `how-it-works-page.jsx` and `how-it-works-app.jsx`
   - `about-page.jsx` and `about-app.jsx`
   - `footer-showcase.jsx`
   - `icons.jsx`
   - `L6 Mobile Nav and Footer.html`

IMPORTANT: `Cardly-handoff/Cardly/project/` contains MANY other files (older attendee designs like arrival-card.jsx, arrival-screen.jsx, etc.; editor designs like editor-d21.jsx through editor-d27.jsx; older HTML mockups; design-canvas.jsx, ios-frame.jsx). DO NOT read those — they are out of scope. Only the marketing/landing page files listed above matter for this session.

After reading, produce a written plan with these sections:

A. SUMMARY: 3 sentences describing what will happen in this session.
B. ISOLATION CONFIRMATION: explicitly list what you will and will not touch (mirror the boundaries above).
C. REFERENCE FILE INVENTORY: list every JSX/HTML reference file you read with one-line summary of what each represents. Confirm you ignored the attendee, editor, and historical mockup files.
D. NEW PAGES TO CREATE: list each new route (`/use-cases`, `/how-it-works`, `/about`) with its file path.
E. PAGES TO REPLACE: list each existing page being replaced.
F. NEW COMPONENT ARCHITECTURE: a tree showing the shared marketing components you'll create (nav, footer, hero, section components, etc.) and what each renders.
G. ROUTE NAVIGATION UPDATES: confirm the marketing layout's nav links match the new design (Use Cases · How It Works · Pricing + Sign in + Start free).
H. NEW DEPENDENCIES: list any new packages. Should be NONE unless something specific is required by the designs.
I. RISK LIST: what could break (auth nav links, dashboard nav links pointing to old pages, broken redirects from /pricing) and how you'll prevent each.
J. REGRESSION TEST PLAN: how you'll verify after deploy that (1) the editor still works, (2) the attendee experience still works, (3) signup/login flows still work, (4) all marketing routes load without errors.
K. OPEN QUESTIONS: anything in the design files that's ambiguous when applied to real production.

DO NOT WRITE ANY CODE YET. Wait for my "approved" before moving to Step 1.

────────────────────────────────────────────
STEP 1 — SHARED MARKETING COMPONENTS
────────────────────────────────────────────

Before building pages, extract shared components used across multiple marketing pages.

Suggested structure:

```
components/marketing/
├── MarketingNav.tsx          ← top navigation (used on all marketing pages)
├── MarketingFooter.tsx       ← footer (used on all marketing pages)
├── MobileNav.tsx             ← hamburger menu overlay
├── HeroSection.tsx           ← hero pattern (variants for each page)
├── UseCaseCard.tsx           ← reusable use case card component
├── PricingCard.tsx           ← reusable pricing tier card
├── FeatureCard.tsx           ← feature highlight card
├── FAQAccordion.tsx          ← reusable FAQ component
├── CTABlock.tsx              ← reusable CTA section
├── SocialProofStrip.tsx      ← logos strip
├── HowItWorksStep.tsx        ← reusable how-it-works step
├── TestimonialBlock.tsx      ← reusable testimonial component
├── SectionDivider.tsx        ← soft gradient wash between sections
└── MeshGradientBackground.tsx ← mesh gradient bg component
```

Each shared component receives data and callbacks as props. Strongly typed in TypeScript.

Commit incrementally:
- `feat(marketing): scaffold shared components (nav, footer, hero, cards)`
- `feat(marketing): implement MarketingNav + MobileNav`
- `feat(marketing): implement MarketingFooter`
- `feat(marketing): implement UseCaseCard + PricingCard + FeatureCard primitives`
- `feat(marketing): implement FAQAccordion + CTABlock + SectionDivider`

After scaffolding, verify shared components render correctly on a test page.

────────────────────────────────────────────
STEP 2 — IMPLEMENT THE 5 MARKETING PAGES
────────────────────────────────────────────

Build pages in this order. Commit after each.

2A — Landing Page (`/`):
- File: `app/(marketing)/page.tsx`
- Reference: `landing-page.jsx`, `sections-top.jsx`, `sections-bottom.jsx`
- Use all 13 sections from the design: Nav, Hero, Social Proof, Problem, Solution, Use Cases Grid, How It Works, Feature Highlights, Pricing Teaser, Testimonial, FAQ, Final CTA, Footer
- Realistic content: "5th Pan-African Youth Forum", Aisha Ahmed, real African event names
- Commit: `feat(marketing): implement landing page with all 13 sections`

2B — Use Cases Page (`/use-cases`):
- File: `app/(marketing)/use-cases/page.tsx`
- Reference: `use-cases-page.jsx`, `use-cases-app.jsx`
- Tab navigation: Conferences · NGOs · Political · Religious · Brand · Education
- Each tab shows detailed use case with examples
- Commit: `feat(marketing): implement use cases page with tabbed categories`

2C — Pricing Page (`/pricing`):
- File: `app/(marketing)/pricing/page.tsx` (REPLACE)
- Reference: `pricing-page.jsx`, `pricing-app.jsx`
- Free / Pro / Studio tiers
- Monthly / Yearly toggle (20% off yearly)
- Full feature comparison table
- Pricing-specific FAQ
- Commit: `feat(marketing): redesign pricing page with new tiers + comparison table`

2D — How It Works Page (`/how-it-works`):
- File: `app/(marketing)/how-it-works/page.tsx`
- Reference: `how-it-works-page.jsx`, `how-it-works-app.jsx`
- 4-step walkthrough with screenshots of editor + attendee
- Video placeholder for product demo
- Commit: `feat(marketing): implement how-it-works walkthrough page`

2E — About Page (`/about`):
- File: `app/(marketing)/about/page.tsx`
- Reference: `about-page.jsx`, `about-app.jsx`
- Founder story, mission, values
- Made in Djibouti positioning
- Commit: `feat(marketing): implement about page with founder story`

────────────────────────────────────────────
STEP 3 — KEY DESIGN DETAILS TO MATCH
────────────────────────────────────────────

From the reference files, match these specific treatments:

VISUAL LANGUAGE:
- Mesh gradient backgrounds in hero sections (forest + cream + gold, subtle, 25-35% opacity, blurred 80-120px)
- Subtle dotted grid pattern as page background (0.04 opacity, 24px spacing)
- Edge-lit card borders on hover (1px gradient border + soft outer glow)
- Bolder CTAs with multi-layer shadows
- Hero card glow halo (radial gradient behind hero card preview)
- Confident typography scale (Display L 60-64px on desktop)
- Section dividers as soft gradient washes between major sections

BRAND TOKENS (must use, do not invent new colors):
- Primary: #1F4D3A (forest green)
- Primary dark: #163828
- Primary soft: #E8EFEB
- Accent: #E8C57E (cream-gold) — sparingly
- Accent dark: #C9A45E
- Ink: #0F1F18
- Ink soft: #3A4A42
- Muted: #6B7A72
- Cream: #FAF6EE (page bg)
- Surface: #FFFFFF
- Border: #E5E0D4
- Hero gradient: linear-gradient(135deg, #1F4D3A 0%, #2A6A50 60%, #E8C57E 100%)

TYPOGRAPHY:
- Display: DM Sans 700, letter-spacing -0.02em (headlines)
- Body: Inter 400/500/600
- Mono: JetBrains Mono (labels, small caps, captions)

ICONS:
- Lucide-react only. Convert any inline SVGs from references to Lucide equivalents.

RESPONSIVE:
- Mobile-first 375px
- Tablet 640-1023px
- Desktop ≥1024px (max content width 1280px)

────────────────────────────────────────────
STEP 4 — NAVIGATION & LINK INTEGRITY
────────────────────────────────────────────

Confirm all links work across the marketing site:

Marketing Nav (top of every marketing page):
- Logo → / (landing)
- Use Cases → /use-cases
- How It Works → /how-it-works
- Pricing → /pricing
- Sign in → /login
- Start free → /signup

Marketing Footer (bottom of every marketing page):
- Product: Use cases / How it works / Pricing / What's new
- Company: About / Blog (#) / Contact (mailto) / Partners (#)
- Resources: Help center (#) / Privacy (#) / Terms (#) / Status (#)
- Use `#` placeholders for routes that don't exist yet — do NOT create new routes for placeholder links.

Internal CTAs (across all pages):
- All "Start free" buttons → /signup
- All "Sign in" links → /login
- All "See example" links on use case cards → relevant `/c/[slug]` of a real published event (use placeholder slug for now if unsure)

If a link target doesn't exist, ASK before creating new pages.

────────────────────────────────────────────
STEP 5 — REGRESSION TESTING
────────────────────────────────────────────

After all marketing pages are built, you MUST verify:

5A — PRODUCT SURFACES UNCHANGED:
- Open the editor on an existing event → drag, resize, undo, save all still work
- Open the public attendee page on a published event → E0 → E3 flow works
- Open dashboard → events list loads
- Sign out → log back in → flow works

If ANY product surface broke, STOP and revert. The marketing redesign must not affect product surfaces.

5B — MARKETING ROUTES:
- Visit `/` — landing page renders
- Visit `/use-cases` — use cases page renders
- Visit `/pricing` — pricing page renders
- Visit `/how-it-works` — how-it-works page renders
- Visit `/about` — about page renders
- Click every nav link, every CTA, every footer link — confirm no 404s except intentional `#` placeholders
- Test mobile breakpoint (375px) — all pages render correctly
- Test tablet breakpoint (768px) — all pages render correctly
- Test desktop (1280px+) — all pages render correctly

5C — AUTH FLOWS:
- Visit `/signup` from a marketing CTA → signup flow works
- Visit `/login` from nav → login flow works
- After login, redirect lands on dashboard correctly

5D — BUILD VERIFICATION:
- Run `pnpm build` locally
- Confirm zero TypeScript errors
- Confirm zero ESLint errors that block the build
- Confirm bundle size hasn't ballooned (check Next.js build output)

────────────────────────────────────────────
STEP 6 — DEPLOY & REPORT
────────────────────────────────────────────

When all local tests pass:
- Commit any final fixes
- `git push origin master`
- Wait for Vercel auto-deploy (~2-3 minutes)
- Verify on `https://cardly-two.vercel.app`

Then give me:
1. List of all files changed (count + paths)
2. Confirmation that nothing forbidden was touched
3. Confirmation that all editor + attendee + auth flows still work (test results from 5A and 5C)
4. Confirmation that all 5 marketing routes load without errors (test 5B)
5. Live URLs to test each page
6. Any decisions made on ambiguous parts

────────────────────────────────────────────
HARD CONSTRAINTS — DO NOT VIOLATE
────────────────────────────────────────────

1. Stay on `master` branch. Do NOT merge from `main` or open PRs to `main`.
2. Do NOT install any new packages without my approval.
3. Do NOT modify ANY file in the forbidden list (re-read the boundaries at the top).
4. Do NOT change the editor, attendee experience, render API, dashboard, auth, or middleware.
5. Do NOT change the database schema or RLS policies.
6. Do NOT change `tailwind.config.ts` or `app/globals.css` — they are already configured.
7. Do NOT change types in `types/database.ts`.
8. Use TypeScript strict mode. Type every prop.
9. Lucide-react icons only. Convert inline SVGs from reference designs to Lucide.
10. Mobile-first responsive. All pages must look great at 375px before scaling up.
11. NO buzzwords in copy: synergy, leverage, ecosystem, holistic, seamless, robust, cutting-edge, revolutionary, game-changing, "AI-powered", "enterprise-grade", "10x".
12. Test by visiting every route locally before pushing.

────────────────────────────────────────────
START
────────────────────────────────────────────

Begin with Step 0 (read files + produce written plan with ALL 11 sections A-K). Do not write any code until I explicitly approve the plan.
```

---

## End of prompt — what to look for in Claude Code's plan

When Claude Code returns its plan, verify it includes all 11 sections (A-K) and check for:

### ✅ Good signs
- ISOLATION CONFIRMATION lists CanvasEditor.tsx, AttendeeFlow.tsx, render API, auth as FORBIDDEN
- REFERENCE FILE INVENTORY lists only landing page files — confirms it's ignoring attendee/editor references
- NEW PAGES TO CREATE includes exactly: `/use-cases`, `/how-it-works`, `/about`
- PAGES TO REPLACE includes only `/` and `/pricing`
- NEW DEPENDENCIES says "none" or just minor utilities
- RISK LIST mentions broken nav links from dashboard to pricing
- REGRESSION TEST PLAN tests editor + attendee + auth + marketing routes

### 🚫 Red flags — push back
- Wants to touch editor, attendee, or API files
- Plans to change `tailwind.config.ts` or `globals.css`
- Wants to add many new dependencies
- Plans to "improve" the dashboard or auth pages
- Plans to redirect old routes without asking
- Plans to change database schema

When the plan looks right, reply:
```
Approved. Begin Step 1 (shared marketing components). Show me the diff before committing each phase.
```

---

## After Claude Code completes Steps 1–6

Same merge pattern as the editor work:
1. Claude Code likely commits to a worktree branch (or directly to master — both fine)
2. If on a worktree: `git merge --ff-only claude/[branch-name]`
3. `git push origin master`
4. Vercel auto-deploys (~2-3 minutes)
5. Test on live URL

---

## Your sequence from here

1. **Save** `LANDING_PAGE_HANDOFF_TO_CLAUDE_CODE.md` in your project root (`C:\Users\cabda\cardly\`)
2. **Open Claude Code** (desktop app, fresh session)
3. **Paste** the one-line instruction:
   ```
   Read LANDING_PAGE_HANDOFF_TO_CLAUDE_CODE.md fully and follow its instructions exactly. Start with Step 0 — produce the written plan with all 11 sections (A through K). Do not write any code until I approve the plan.
   ```
4. **Wait for the plan** (3-5 minutes)
5. **Screenshot the plan**, send it to me before approving anything
6. I review with you — approve or push back
7. You approve, Claude Code implements
8. Test, merge, push, deploy

---

This is now the third major surface getting the same surgical treatment. By now you know the rhythm.
