# Consistency Audit (Phase 2 — Step 0)

Date: 2026-07-05
Scope: the authenticated experience after the Phase 1 dashboard unification.

## 1. Design tokens

- Brand colors ARE defined centrally (Tailwind theme + CSS variables) and the
  forbidden legacy colors (#6c63ff, #f8a4d8, #fafafa, #e5e5ea) do NOT appear
  anywhere in app/ or components/. ✓
- However ~238 hardcoded brand-hex values live in inline `style={{}}` props
  across app/(app) and components/ (worst: analytics page, 35+). They all use
  the CORRECT brand values, so this is a maintainability issue, not a visual
  one. Bulk conversion to Tailwind classes touches hundreds of JSX nodes and
  risks regressions for zero visual change — RECOMMENDATION: convert
  opportunistically whenever a file is touched; do not big-bang it.
- Fonts: DM Sans / Inter / JetBrains Mono load via preconnect + Google Fonts
  <link> with display=swap in app/layout.tsx; every page inherits them. A
  migration to next/font/google (self-hosted, zero CLS, one less origin) is
  recommended but must be done where fonts.googleapis.com is reachable at
  build time (Vercel) — it could not be verified in this environment.

## 2. Components

- ONE shadcn Button exists but most pages style their own buttons inline.
  Same trade-off as tokens: correct values, duplicated expression. Convert
  opportunistically.
- Loading states: 32 routes already had consistent animate-pulse skeleton
  loading.tsx files; the Phase 1 routes had NONE. FIXED — shared
  components/shared/Skeletons.tsx now provides Skel/PageHeaderSkel/
  CardListSkel/CardGridSkel/PageSkel, and loading.tsx was added for
  /home, /my-tickets, /my-cards, /saved, /speaking, /sponsoring,
  /attending/[slug]/*, /speaking/[speakerId], /sponsoring/[sponsorId].
- Empty states: ~6 ad-hoc implementations, all visually consistent (white
  card, muted copy). Low priority.
- Settings: all subpages share SettingsTabs — already unified. ✓

## 3. Layout

- Dashboard pages consistently use max-w containers (760/900/1080/1400 by
  content type) inside AppShell; headers use font-display with brand ink.
  15 slightly-divergent h1 patterns exist; visual delta is minor.

## 4. Navigation & loading behavior

- FIXED: app/(app)/layout.tsx is now a server component that resolves the
  user's role sections BEFORE first paint and passes them to AppShell — the
  sidebar no longer flashes "Home only" while /api/me/roles loads. The
  client fetch remains as a background refresher.
- Route changes inside (app) keep the shell mounted (client-side nav, no
  full reload). ✓

## 5. Performance notes

- Data fetching in dashboard pages already uses Promise.all batching. ✓
- `force-dynamic` is (correctly) used for personalised pages; public
  marketing pages remain static. ✓
- ~98 raw <img> tags vs next/image — largest remaining win for mobile
  loading (bandwidth + LCP). RECOMMENDATION: convert cover images and card
  lists first (my-tickets covers already use next/image). Needs real-device
  verification, left as follow-up.
- lucide-react is tree-shaken by Next 14.2's built-in optimizePackageImports. ✓

## 6. Dead code removed

- components/exhibitor/ExhibitorPortalClient.tsx — orphaned after the /x
  route became a read-only showcase (was the open editing portal).
- app/(public)/e/[slug]/lead-scanner — a mock-data demo page with no inbound
  links, shipping fake leads UI on a public URL.

## Verification (this session)

- `tsc --noEmit`: 0 errors. `next build`: ✓ Compiled successfully, 155 routes.
- Smoke tests on the running production build: public pages 200; every
  authenticated route redirects anonymous visitors to login with a correct
  ?next= param; unknown slugs 404; token portal 404s bad tokens.
