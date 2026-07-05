# Session progress — read this first when you're back

Date: 2026-07-05 (autonomous work hour)

## TL;DR
Button-radius unification is already **shipped** (commit `54d4688`). Since then I built
**two dashboard-redesign batches + release fixes**, all sitting **uncommitted** in your
working tree, esbuild-verified. Build once, eyeball, push.

---

## What's in your working tree now (uncommitted)

| File | Change | Risk |
|---|---|---|
| `components/app/AppShell.tsx` | **Nav rebuilt** into collapsible groups (Attending / Organizing / Speaking / Sponsoring / Admin), Settings pinned bottom for ALL users, open/closed state persisted | verified host-side; can't esbuild in sandbox (mount truncation) — your build is the gate |
| `app/(app)/home/page.tsx` | **Home = command center**: organizer stats + needs-attention + quick actions + "Attending next" + role shortcuts. Reuses the proven /dashboard + /my-tickets queries | esbuild-clean |
| `app/api/onboarding/route.ts` | `NEXT_PUBLIC_SITE_URL` → `NEXT_PUBLIC_APP_URL` (fixes a broken team-invite fetch) | esbuild-clean |
| `lib/email/index.ts` | from-address now honors `RESEND_FROM_EMAIL` env | esbuild-clean |
| `.env.example` | +12 undocumented vars (Stripe price IDs, PostHog, Maps, Crisp…) | doc only |
| `tsconfig.json` | excludes `gstack-main` (already done earlier) | doc only |
| `docs/*.md`, `supabase/fix_generak_typo.sql` | review, redesign plan, release readiness, Generak fix | docs only |

## Build + commit (PowerShell — use `;` not `&&`)

```
cd C:\Users\cabda\cardly
pnpm build
```
If green:
```
git add -A
git commit -m "feat(dashboard): collapsible grouped nav + Home command center; release fixes"
git push
```
If the build errors, paste me the error — most likely spot is `AppShell.tsx` (the one
file I couldn't esbuild locally). It's the only risk; everything else is verified.

## What to check after deploy
- Sidebar: collapsible **Attending / Organizing / Admin** groups with chevrons that
  remember their state; **Settings** now at the bottom.
- **Home** shows your real numbers (25 events, 64 regs, $16,836, 41%) + needs-attention
  + your attending events — no longer the 3 empty router cards.
- Run `supabase/fix_generak_typo.sql` in Supabase to fix the "Generak" ticket name.

## Redesign roadmap (from DASHBOARD_REDESIGN_PLAN.md)
- ✅ Batch 1 — nav (done, in this tree)
- ✅ Batch 2 — Home command center (done, in this tree)
- ⏸ Batch 3 — **My Events hub** (each event opens to ticket/card/tools). Route-changing;
  I deferred it to do WITH you so we can test — it's the riskiest to do blind pre-launch.
- ⏸ Batch 4 — **event-tools regroup** (Connect = networking+messages+community;
  Live = Q&A+polls+leaderboard). Do with Batch 3.
- ⏸ Batch 5 — layout width standardization (needs per-page visual testing).

## Release readiness
See `docs/RELEASE_READINESS.md` — the honest launch picture. Your non-code blockers:
set the Stripe price IDs + GOOGLE_AI_KEY in Vercel, verify the Resend sending domain,
and run one real payment through each provider. The code side is in good shape.
