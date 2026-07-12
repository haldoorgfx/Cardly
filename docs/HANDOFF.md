# HANDOFF — Eventera session state (2026-07-05)

Read this + CLAUDE.md + docs/SYSTEM_MAP.md at session start.

## Where things stand

Everything below is DEPLOYED and LIVE on eventera.so (Vercel, production
branch `master`, tip commit `9e496bc`). `next-improvements` is synced to the
same commit. Verified live in the browser, page by page.

### Shipped this campaign (14 commits, bff8a68..9e496bc)

1. **Unified role-based dashboard.** One shell (AppShell) for attendee /
   speaker / sponsor / organizer / admin. Moved into (app): /my-tickets,
   /my-cards (new), /saved, /attending/[slug]/* (agenda, messages,
   networking, community, q-and-a, polls, leaderboard, feedback),
   /speaking/[speakerId] (speaker workspace), /sponsoring/[sponsorId]/*
   (sponsor workspace). Guests keep token access via /e/[slug]/* and
   /exhibitor/[token] — do not break those.
2. **Role resolution:** lib/rbac/context.ts getUserContext(),
   lib/rbac/ownership.ts ownedSpeaker/ownedSponsor. Roles live in
   user_event_roles (migration 055); write-paths complete.
3. **Security fixes:** /api/speakers/[id]/profile and
   /api/sponsors/[id]/profile were open to anyone — now ownership-gated.
   /e/[slug]/leads dumped all booth leads publicly — now organizer/sponsor
   only. Public /s/ and /x/ profile routes are read-only (owners are
   redirected into their dashboard workspaces).
4. **Shared UI library — components/dash/index.tsx:** PageShell, PageHeader,
   Card, StatRow, SegmentedTabs, EmptyState, Primary/SecondaryButton, tokens.
   RULE: every dashboard page composes these; never hand-roll headers,
   containers, tabs, empty states. Standard h1 = font-display font-semibold
   text-[26px] sm:text-[30px] ink #0F1F18. 35+ organizer-page h1s normalized.
5. **Shared skeletons:** components/shared/Skeletons.tsx + loading.tsx on all
   unified routes.
6. **Server-rendered shell:** app/(app)/layout.tsx resolves sections +
   profile + event count + logo before paint → no sidebar flash, no
   plan-box inconsistency. AppShell client fetch is only a refresher.
7. **Embedded variants:** MessagingClient, CommunityChatClient,
   SpeedNetworkingClient, SpeakerPortalClient, ExhibitorShell,
   SavedFollowingClient, ProfileSettings all take `embedded`/`hrefBase`
   props — full-viewport chrome for public/token surfaces, contained cards
   inside the dashboard. Reuse this pattern for any future dual-surface tool.
8. **Settings:** one layout (app/(app)/settings/layout.tsx) provides header +
   tabs for all subpages.
9. **Dead code removed:** ExhibitorPortalClient, mock lead-scanner page.

### Reference docs (in docs/)
- SYSTEM_MAP.md — every route, API, table, journey (the master reference)
- DASHBOARD_UNIFICATION_AUDIT.md — Phase 1 audit
- CONSISTENCY_AUDIT.md — Phase 2 audit + deferred items

## Immediate to-dos (user, non-code)
- [ ] Add GOOGLE_AI_KEY in Vercel env → enables ERA AI features in prod
- [ ] Fix "Generak" ticket-type typo (Pan-African Youth Forum 2026)
- [ ] Add cover images to events (most show gradient fallback)

## Next fronts (pick one per session)
1. **Flutter mobile app** (eventera_mobile/) — v1 build; blocked on Android
   Studio install (see MOBILE_SETUP.md). Talks directly to same Supabase.
2. **Domain migration** eventera.so → eventera.so — change
   NEXT_PUBLIC_APP_URL (everything already reads the env var) + DNS + Vercel
   domain.
3. **Deferred consistency work** (see CONSISTENCY_AUDIT.md): fonts →
   next/font/google (needs build where fonts.googleapis is reachable);
   <img> → next/image on card lists; inline brand-hex → tokens
   (opportunistic only, no big-bang).
4. **Launch checklist** — LAUNCH_CHECKLIST.md predates this campaign; re-run.

## Working notes for the agent (important)
- METHOD THAT WORKS: audit LIVE in the browser (Claude in Chrome on
  eventera.so or localhost:3000), screenshot, then fix. Static code
  review misses what rendering reveals.
- Windows/pnpm repo: agent sandbox cannot run the user's node_modules or
  push to GitHub (credentials live in Windows). User runs `pnpm build` and
  `git push` in PowerShell; Vercel deploys master.
- Sandbox FUSE mount serves STALE reads for files edited via host-side file
  tools (truncation/NUL padding). Prefer editing via sandbox bash/python
  directly on the mount; if committing from the sandbox, build a clean
  work-tree copy and use GIT_INDEX_FILE outside the mount; verify each
  commit's tree file count (~1645). If git says HEAD/branch broken, check
  .git/HEAD for trailing NUL bytes and rewrite it.
- One commit per logical group; never commit without green tsc + build.
