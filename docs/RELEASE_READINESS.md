# Eventera — Release Readiness (public launch)

Date: 2026-07-05 · Generated during autonomous work session.
Method: gstack `/review` + `/qa` + `/health` discipline applied to Eventera's actual
codebase state. Supersedes the stale root `LAUNCH_CHECKLIST.md` (that one predates the
Cardly→Eventera rebrand and references `cardly.app`).

---

## Green — verified good in code

- **Rebrand is clean** — 0 stale "Cardly" strings in shipped `app/` or `components/`.
- **Legal + marketing pages exist** — privacy, terms, dmca, contact, pricing, about.
- **SEO** — `app/robots.ts` + `app/sitemap.ts` present; `metadataBase`, `openGraph`,
  and `twitter` cards configured in `app/layout.tsx` (uses `NEXT_PUBLIC_APP_URL`).
- **Error resilience** — full boundary coverage: `global-error.tsx`, per-group
  `error.tsx`, `not-found.tsx`.
- **No leaked secrets** — service-role key never referenced in client components.
- **Clean logs** — 0 `console.log` in shipped code.
- **Rate limiting** — middleware wraps all `/api/*` (Upstash or in-memory fallback).

## Fixed this session (safe, in the diff)

- **`NEXT_PUBLIC_SITE_URL` → `NEXT_PUBLIC_APP_URL`** in `app/api/onboarding/route.ts`.
  It was the only file using the undocumented `SITE_URL`; unset, its team-invite
  `fetch` fell back to a relative URL that fails server-side. Now uses the canonical
  var (per CLAUDE.md).
- **`.env.example` completed** — 12 referenced-but-undocumented vars added (Stripe
  price IDs ×4, PostHog ×2, Google Maps, Crisp, Resend audience, WaafiPay sandbox,
  MIGRATION_SECRET). A fresh deploy from the example would previously break checkout
  pricing, analytics, maps, and chat silently.
- **Generak typo** — `supabase/fix_generak_typo.sql` created (data fix; run in Supabase).

## Blockers — you must do before public launch (not code)

1. **Set the missing production env vars in Vercel**, especially the 4 `STRIPE_PRICE_*`
   IDs (subscription checkout is dead without them) and `GOOGLE_AI_KEY` (ERA features).
2. **Domain**: decide `karta.cre8so.com` vs `eventera.so`. Everything reads
   `NEXT_PUBLIC_APP_URL`, so it's a one-var + DNS change. Also update the 3 contact
   emails (`noreply@`, `dmca@`, `support@`) if the email domain moves.
3. **Payments live-mode smoke test** — run one real Stripe, one Flutterwave, and one
   WaafiPay ticket purchase end-to-end; confirm the webhook flips the registration to
   confirmed and the confirmation email sends.
4. **Resend domain verified** — confirm `noreply@…` is a verified sending domain or
   emails will silently fail.

## Pre-launch QA — run these flows on the live site (gstack /qa method)

Test in incognito + on a real phone at 375px. Each is a "must not crash" path.

**Auth** — signup (new email) → email confirm → login → logout → password reset →
post-login redirect lands in the dashboard.

**Organizer** — create event → upload cover → add ticket types (free + paid) → build
registration form → publish → public URL loads.

**Attendee (no account)** — open public event link logged-out → register for a free
ticket → confirmation email arrives with QR → Eventera Card generates.

**Paid** — register for a paid ticket → checkout (Stripe/Flutterwave/WaafiPay) →
webhook confirms → ticket shows in My Events.

**On-site** — QR check-in scanner marks a registration checked_in; walk-in add works.

**Dashboard (new IA — build the pending commits first)** — Home command center shows
real stats; nav groups collapse/expand and persist; Settings reachable as a
non-organizer; My Events opens the attendee event.

## Post-deploy (gstack /canary + /health)

After each deploy: hit the homepage, one public event page, `/discover`, and one
dashboard page; watch for console errors and 500s. Keep an eye on the Sentry dashboard
for the first hour.

## Known deferred (tracked, not blockers)

- **Layout width standardization** — pages hand-roll max-widths (760/900/1100/1400);
  fold onto `PageShell` widths. Needs visual testing per page (see DASHBOARD_REDESIGN_PLAN Batch 5).
- **Event-tools regroup** (Batches 3–4 of the redesign) — My Events hub + Connect/Live
  merges. Route-changing; do with live testing.
- **hex → design tokens** (517 inline values) — maintainability only, no visual change.
- **`<img>` → `next/image`** (61 sites) — mobile LCP win.
- **1 dead `href="#"`** in `settings/DeveloperTab.tsx:123` — point at real docs or remove.
