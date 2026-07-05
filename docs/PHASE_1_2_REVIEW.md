# Phase 1 + Phase 2 Review — did the unification actually happen?

Date: 2026-07-05
Reviewer method: gstack `/review` + `/investigate` discipline — no verdict without
code evidence; every claim grepped/read against `HEAD` before it was written down.

**Verdict in one line:** Phase 1 (the structural move) is real and done well.
Phase 2 (the consistency pass) is where "I don't see much difference" comes from —
the shared component library was *built* but never *adopted*, so the app still
looks like two products stitched together.

---

## Phase 1 — structural move: PASS (≈95%)

What you asked: every authenticated own-data page becomes a true native dashboard
route; nothing bounces to a public shell; one role resolver; server-side access control.

Verified against the code:

| Requirement | Evidence | Status |
|---|---|---|
| `my-tickets`, `saved`, `my-cards` native in dashboard | present in `app/(app)/`, gone from `app/(public)/` | ✅ |
| Attendee event tools native | `app/(app)/attending/[slug]/{agenda,community,feedback,leaderboard,messages,networking,polls,q-and-a}` | ✅ |
| Speaker workspace native | `app/(app)/speaking` + `/speaking/[speakerId]` | ✅ |
| Sponsor workspace native | `app/(app)/sponsoring/[sponsorId]/{booth,leads,resources,team}` | ✅ |
| "My tickets" bounce bug fixed | `AppShell.tsx:171` → `/my-tickets` now resolves to the `(app)` route; the `(public)` duplicate is deleted | ✅ |
| Old URLs don't 404 | `(public)/account/profile` + `/following` are redirect stubs → `/settings`, `/saved` | ✅ |
| One role resolver | `lib/rbac/context.ts` `getUserContext` returns roles grouped `asOrganizer/asAttendee/asSpeaker/asSponsor` | ✅ |
| Security holes gated | speaker/sponsor profile PATCH now ownership-gated; `/e/[slug]/leads` restricted (per handoff + ownership.ts) | ✅ |

Small residuals (not blockers): `account/setup` is still a real onboarding page
(fine); guest-token `/e/[slug]/*` paths intentionally kept public (correct — that's
the no-account attendee flow).

**Bottom line:** the move you asked for happened. If prod "looks the same," it is
NOT because Phase 1 didn't ship — it's Phase 2.

---

## Phase 2 — consistency: PARTIAL (≈30%) — this is the gap

What you asked, verbatim: *"consolidate every duplicated component into a single
shared version… Replace all duplicates with the shared component. Every page imports
from the same component library."*

What actually happened: the shared library was created (`components/dash/index.tsx`
— PageShell, PageHeader, Card, StatRow, SegmentedTabs, EmptyState, Buttons) and the
**8 new Phase-1 pages** were built with it. Then adoption stopped. The rest of the
app — most importantly the entire 54-page organizer suite — was left on its old
hand-rolled patterns.

Hard numbers from `HEAD`:

| Metric | Count | Meaning |
|---|---|---|
| `(app)` pages importing `components/dash` | **8 / 94** (~9%) | The shared library is barely used. |
| Organizer `events/**` pages using it | **0 / 54** | The biggest, most-visited surface never got unified. |
| Lines with hardcoded brand hex in `(app)` | **517** | Tokens exist; pages ignore them and inline `style={{ color:'#0F1F18' }}`. |
| Files with raw `<button>` (not shared Button) | 22 | Multiple button expressions, exactly what you asked to kill. |
| Raw `<img>` (not next/image) | 61 | Inconsistent image loading. |

Even the "adopted" pages are half-migrated: `analytics/page.tsx` imports `PageHeader`
but *still* hand-rolls its headings with `font-display text-[36px] ... style={{color:'#0F1F18'}}`.

The previous session's own `CONSISTENCY_AUDIT.md` is honest about this — it repeatedly
says "convert opportunistically; do not big-bang it" for tokens, buttons, and images.
That is a reasonable *engineering* instinct (mass find-replace risks regressions), but
it is **not what the brief asked for**, and it's the precise reason the product still
feels like separate apps. The consistency you can *see* was deferred; the consistency
you can't see (loading skeletons, server-resolved nav, settings tabs) was done.

What *was* genuinely completed in Phase 2:
- Shared skeleton loaders + `loading.tsx` on all new routes (no more blank flashes). ✅
- Server-rendered role sections before paint (no sidebar "Home-only" flash). ✅
- Settings subpages unified under one `SettingsTabs` layout. ✅
- Dead code removed (ExhibitorPortalClient, mock lead-scanner). ✅

---

## What "finish Phase 2 properly" means (scoped, no new features)

Ordered by visible impact per unit of risk:

1. **Migrate the organizer suite to `components/dash`** — `PageShell` + `PageHeader`
   on all 54 `events/**` pages. This is the single change that makes the two halves
   look like one product. Do it page-group by page-group, `pnpm build` between each.
2. **One Button, one Card, one Badge** — replace the 22 raw-button files and inline
   cards with the shared components. Mechanical, high visual payoff.
3. **Hex → tokens** — the 517 inline hex values become Tailwind brand classes
   (`text-ink`, `bg-forest`, etc.). Do it file-by-file as each page is touched in 1–2
   so it's not a blind global replace.
4. **`<img>` → `next/image`** on card/cover lists (61 sites) — mobile LCP win.
5. **Fonts → `next/font/google`** — needs a build where `fonts.googleapis.com` is
   reachable (your Vercel build, not this sandbox).

Each is a clean commit; none adds a feature; all are "consolidate and correct."

---

## Honest caveat on my own review

I verified structure, routing, role wiring, and component adoption by reading the
code at `HEAD`. I did **not** click through the live site at `karta.cre8so.com` in a
browser this pass — the handoff's own method note says rendering reveals things static
review misses. If you want, the next step is a live `/design-review`-style walk of
5–6 key pages (organizer dashboard vs. my-tickets vs. speaking) side-by-side to
confirm the visual gap matches these numbers. My prediction: they'll look like two
different apps, and the numbers above say exactly why.
