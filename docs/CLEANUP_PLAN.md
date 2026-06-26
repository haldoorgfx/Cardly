# EVENTERA — CLEANUP & IMPLEMENTATION PLAN
## For Claude Code to implement
Source: `docs/AUDIT_REPORT.md` (2026-06-26). Reference blueprint: `docs/EVENTERA_PRD.md`.

> Sequencing: do Priority 1 in order — items 1 and 2 unblock everything else (the app 500s and ERA is dead until they're done).

---

### Priority 1 — Critical (do first)

**1. Apply pending migrations 041 → 042 → 043 to production Supabase**
- Issue: Until 043 runs, code reads `eventera_card_url` / `eventera_card_zone_data` columns that don't exist → 500s. 042 unblocks refunds/status changes; 041 unblocks form field types.
- Files: `supabase/pending_migrations_to_run.sql` (run as-is in Supabase SQL editor, order 041→042→043), `supabase/migrations/041_*`, `042_*`, `043_*`.
- Fix: Run the batch, then verify columns/constraints exist. Also confirm `003_roles_and_rls` and all of `001`–`045` are applied (query `information_schema` / Supabase migration history). Add a real migration-tracking mechanism (Supabase CLI `supabase migration list`) so "applied vs pending" is never guesswork again.
- Complexity: **Low** (DB ops) but launch-blocking.

**2. Configure & consolidate AI (ERA)**
- Issue: `lib/ai/era.ts` needs `GOOGLE_AI_KEY` (absent from `.env.local`); `api/events/[id]/copilot/route.ts` uses `ANTHROPIC_API_KEY`. Two providers, one undocumented.
- Files: `.env.local` / Vercel env, `lib/ai/era.ts`, `lib/ai/gate.ts`, `app/api/events/[id]/copilot/route.ts`, `docs/EVENTERA_PRD.md` (Part 16).
- Fix: Decide the provider strategy (keep Gemini for ERA + Anthropic for copilot, or unify). Set the chosen key(s) in env. Make ERA fail gracefully — replace `process.env.GOOGLE_AI_KEY!` non-null assertion with a guarded check returning the PRD's "friendly fallback, never raw error." Update PRD to reflect both providers.
- Complexity: **Low–Medium**.

**3. Finish the domain migration off `karta.cre8so.com`**
- Issue: Old domain + a stale `app.karta.co` are hardcoded in user-facing strings, PDF footers, the developer API base URL, white-label CNAME, and DMCA emails.
- Files (non-exhaustive — grep `karta.cre8so.com` and `app.karta.co` across `app/`):
  `app/(app)/events/[id]/promoter-links/page.tsx:50`, `.../revenue/print/page.tsx:151`, `.../roster/print/page.tsx:145`, `app/(app)/settings/DeveloperTab.tsx:63`, `app/(app)/settings/WhiteLabelTab.tsx:207`, `app/(marketing)/about/page.tsx:12,843`, `app/(marketing)/dmca/page.tsx:46–61`, `app/(marketing)/features/*`, plus `lib/email/*` and `app/layout.tsx` metadata/canonical.
- Fix: Centralize the base URL on `process.env.NEXT_PUBLIC_APP_URL` (already referenced) and a single `SITE_DOMAIN` constant; replace all hardcoded strings. Set the env to the final domain (`eventera.app` or whichever is live). Update email from-address/links and `RESEND_FROM_EMAIL` to a verified Eventera domain. Fix the mojibake flag in `about/page.tsx:843`.
- Complexity: **Medium** (many files, but mechanical).

**4. Configure and verify payments end-to-end**
- Issue: No `STRIPE_*`/`FLUTTERWAVE_*`/`WAAFIPAY_*`/`UPSTASH_*` keys in env; PRD says test mode.
- Files: env (Vercel), `app/api/payments/*`, `app/api/webhooks/stripe/route.ts`, `lib/payments/*`, `lib/billing/*`, `lib/ratelimit.ts`.
- Fix: Add live keys, verify webhook signature handling for each provider, run one real transaction per provider, confirm Upstash rate-limiter has credentials (or a no-op fallback) so middleware doesn't error.
- Complexity: **Medium** (external setup + testing).

**5. Confirm a clean build**
- Issue: `node_modules` not installed in audited workspace; `@google/generative-ai` declared but not present.
- Fix: `pnpm install && pnpm build` from a clean checkout; resolve any errors; then `pnpm audit` and address high/critical advisories.
- Complexity: **Low** (assuming no hidden breakage).

---

### Priority 2 — Important

**6. Spot-audit auth on service-role routes**
- Issue: ~247 files use `createAdminClient()`/service role, bypassing RLS; security rests on manual guards.
- Files: prioritize `app/api/admin/*`, `app/api/billing/*`, `app/api/events/[id]/registrations/*`, `app/api/export-data`, `app/api/events/[id]/export`, `app/api/keys/*`, `app/api/webhooks/*`.
- Fix: Confirm each does an explicit auth + ownership/role check before touching data. Extract a shared guard (`lib/auth/guards.ts` already exists — ensure it's used everywhere).
- Complexity: **Medium–High** (surface size).

**7. Fix the middleware public-route allowlist**
- Issue: PRD-public routes (`/discover`, `/search`, `/o/[userId]`, `/s/`, `/x/`, `/my-tickets`, `/saved`, `/events/cities`) aren't whitelisted → may force login.
- Files: `middleware.ts` (the `isPublicRoute` block), cross-check with `lib/supabase/middleware.ts` redirect logic.
- Fix: Add the missing public prefixes (or invert to an auth-required allowlist). Test each route logged-out.
- Complexity: **Low**.

**8. Replace the stale root `CLAUDE.md`**
- Issue: It documents the old single-feature MVP and forbids features that now exist — misleads future agents.
- Files: `CLAUDE.md`.
- Fix: Regenerate from the PRD (scope, stack, route map, build order). Keep the BRAND.md forest+cream system; remove the "MVP scope: cards only / no teams / no Redis" rules.
- Complexity: **Low**.

**9. Build the REST API v1 surface (or scope it down)**
- Issue: API keys + webhooks exist, but only `/api/v1/render` is implemented vs the full PRD v1 list.
- Files: create `app/api/v1/events/route.ts`, `.../events/[id]/route.ts`, `.../events/[id]/registrations/route.ts`, `.../registrations/[regId]/checkin/route.ts`, `.../sessions`, `.../speakers`, `.../analytics`. Reuse `lib/api-keys` for auth + `lib/ratelimit`.
- Fix: Implement key-authenticated, scoped, rate-limited endpoints — or explicitly mark v1 as "render-only for launch" in the PRD.
- Complexity: **Medium–High**.

**10. WhatsApp notifications (Africa-critical)**
- Issue: Not built; only email exists.
- Files: new `lib/whatsapp/`, hook into `lib/registration/email.ts` send points and reminder automations.
- Fix: Integrate WhatsApp Business Cloud API (or Twilio) for `registration_confirmed`, `event_reminder_24h`, `event_reminder_1h`. Gate behind env/feature-flag.
- Complexity: **High** (external provider + templates approval).

---

### Priority 3 — Nice to Have

**11. Remove unused dependency** `flutterwave-node-v3` (0 imports). Complexity: Low.
**12. Tighten `: any` (~43)** in API response shapes / handlers. Complexity: Low, incremental.
**13. Gitignore housekeeping** — add `.clone/`, `.claire/`, `tsconfig.tsbuildinfo` to `.gitignore`; remove from tracking. Complexity: Low.
**14. Sentry config modernization** — migrate deprecated `sentry.client.config.ts` per current SDK guidance. Complexity: Low.
**15. Verify offline check-in** on a real device; fix caching if needed. Complexity: Medium.
**16. Marketing mockup domains** — replace `app.karta.co` placeholders in `features/*` with real Eventera URLs. Complexity: Low (rolled into #3).

---

### Missing Features to Build

| Feature | What to build | Files | Dependencies |
|---|---|---|---|
| WhatsApp notifications (F14) | Provider integration + 3 templates + send hooks | `lib/whatsapp/`, reminder automations | WhatsApp Cloud API / Twilio |
| REST API v1 (F17) | events/registrations/check-in/sessions/speakers/analytics endpoints | `app/api/v1/*` | `lib/api-keys`, `lib/ratelimit` |
| Virtual/hybrid depth (F12) | Confirm embeds, live viewer count, recording flow | `events/[id]/virtual`, `e/[slug]/sessions/[id]/watch` | Supabase Realtime |
| Offline check-in (F10) | Verify/finish attendee-list caching + sync | `components/check-in/*`, `e/[slug]/check-in` | Service worker / local cache |

---

### Database Changes Needed
- **Apply** `041`, `042`, `043` (and verify `003`+ all of `001`–`045`) — Priority 1 #1.
- **Add** a migration-tracking workflow (Supabase CLI) instead of the manual `pending_migrations_to_run.sql`.
- **Verify** RLS `rowsecurity = true` on every table and that indexes exist on `event_id`, `user_id`, `status`, `slug`, `starts_at`.
- **Clean up** ambiguous migration numbering (duplicate `002_*`, `010_*`, `011_*` prefixes) — document the true apply order; do not renumber already-applied files.

### Recommended Refactors
- Centralize the site/base URL (kill hardcoded domains) — #3.
- Route all data access through shared auth guards; reduce gratuitous service-role usage where RLS would suffice — #6.
- Consolidate or clearly document the two AI providers — #2.
- Replace stale `CLAUDE.md` — #8.
- Remove dead dependency + committed build artifacts — #11, #13.
