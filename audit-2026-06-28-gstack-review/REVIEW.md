# Eventera/Cardly — Deep gstack-style Review (2026-06-28)

Applied gstack's `/cso` (security) and `/review` methodology against the real
top-level app (146 API routes). Verdict: **the foundations are stronger than
you fear — admin auth, payment signatures, and plan limits are done right — but
there are 3 real public-surface holes worth fixing before you scale, plus repo
hygiene problems.**

Scope note: audited the real `app/`, `components/`, `lib/`. Excluded the stale
`.claude/ .clone/ .claire/` worktree copies. Did not run full `tsc`/`eslint`
(too slow here) — run those locally.

---

## Top 3 risks

1. **Outbound webhook SSRF** — a logged-in user can register a webhook URL
   pointing at internal/cloud-metadata hosts and the server will POST to it.
2. **Rate limiting fails OPEN** — if Upstash env vars are missing, *all* rate
   limiting (including the expensive public `/api/render`) silently turns off.
3. **JSON render path skips photo validation** — the multipart upload checks
   size + type, but the `photoDataUrl` JSON path feeds an unbounded buffer
   straight to sharp.

---

## HIGH — fix before scaling

**1. Outbound webhook SSRF**
`lib/webhooks/index.ts:99` posts to `hook.url`; registration only validates with
`new URL()` (`app/api/webhooks/route.ts` ~line 38). An authed user can target
`http://169.254.169.254/…` or internal hosts.
Fix: at registration *and* before each fetch, reject non-https and any URL that
resolves to private/loopback/link-local IPs (RFC1918, 169.254.x, ::1).

**2. Rate limiting fails open**
`lib/ratelimit.ts:80` returns `{ allowed: true }` when no limiter is configured.
`/api/render` (sharp compositing) is then unthrottled for anonymous users — a
cheap way to burn your compute bill.
Fix: fail closed (or use an in-memory fallback) for the `render`, `auth`, and
`billing` tiers, and assert the Upstash env vars exist in production.

**3. JSON render path bypasses photo size & MIME checks**
`app/api/render/route.ts:287` decodes `photoDataUrl` with no cap; the 10 MB +
MIME allowlist at `:377-383` only covers the multipart path. Reachable via
`/api/v1/render` and any direct JSON POST.
Fix: enforce a max byte length on the decoded buffer and sniff magic bytes before
handing it to sharp.

---

## MEDIUM

**4. Payment webhooks don't verify the amount paid**
`app/api/payments/flutterwave-webhook/route.ts:39-66` and
`waafipay-webhook/route.ts:33-51` mark a registration paid on status alone — they
never compare the paid `amount` to the ticket price. An underpayment or
zero-amount "success" callback confirms a paid ticket.
Fix: load the ticket price server-side and reject if amount/currency mismatch.
(Note: signatures *are* verified — this is the amount check, separately.)

**5. Stale worktrees tracked in git (bloat + possible env leak)**
`git ls-files` shows ~10 files under `.claude/ .clone/ .claire/`, including a
`settings.local.json` and full app duplicates. `.gitignore` only covers
`.claude/worktrees/` and has **malformed entries** (a `. c l o n e /` line with
spaces — that pattern doesn't work).
Fix: `git rm -r --cached .claude .clone .claire`, then fix the `.gitignore` lines.

**6. `upload-zone-image` doesn't verify event ownership**
`app/api/upload-zone-image/route.ts:12,26` trusts `eventId` from the form without
checking the caller owns it. Low blast radius (path is prefixed with user id) but
still untrusted input. Fix: verify ownership of `eventId`.

**7. 271 `as any` casts in real code**
Mostly on Supabase queries (e.g. `(admin as any).from(...)`). Defeats the typed
`Database` and hides schema drift. Fix: regenerate `types/database.ts` and drop
the casts on DB calls.

---

## LOW

- **XFF spoofing for rate-limit keys** (`middleware.ts:13`) — fine behind Vercel's
  proxy; pin to the trusted hop if you ever self-host.
- **Impersonation cookie is `httpOnly:false`** (`app/api/admin/impersonate/route.ts:82`)
  — not exploitable (role is re-checked server-side every call) but needlessly
  XSS-exposed. Make it httpOnly.
- **`/api/admin/migrate` runs arbitrary SQL** via `exec_sql` RPC
  (`app/api/admin/migrate/route.ts:40`) — gated by `MIGRATION_SECRET`, but a
  service-role arbitrary-SQL endpoint in prod is a standing liability. Remove
  after migrations are applied.
- **Scope creep** — CLAUDE.md says "static image cards only, no team accounts, no
  marketplace," but there are 146 routes incl. Stripe/Flutterwave/WaafiPay, AI,
  analytics, check-in, impersonation. Each route is attack surface your own scope
  says shouldn't exist. Decide what's actually in the launch.

---

## Done right (don't waste time "fixing" these)

- **Admin routes are consistently guarded** with DB-read roles (not JWT),
  self-action guards, escalation prevention, and audit logging
  (`lib/auth/guards.ts:39-59`). No unguarded admin route found.
- **Payment webhook signatures are verified** — Stripe `constructEvent`,
  Flutterwave constant-time hash + server re-verify, WaafiPay HMAC-SHA256 +
  `timingSafeEqual` that fails closed.
- **Plan limits + watermark are enforced server-side** (`canCreateEvent`,
  `canGenerateCard`, watermark at `app/api/render/route.ts:347-359, 416-418`).
  No revenue leak from client-only checks.
- **Main render route is hardened** — SSRF allowlist to the Supabase host,
  HTTPS-only, Pango markup escaping, color sanitization, field caps, idempotency,
  EXIF normalization.
- **No browser rendering** (sharp only). **No hardcoded secrets**; `.env.local`
  untracked. **Redis** only in the one documented rate-limit exception.
  **Retired brand colors** appear only inside an intentional denylist.
  **TS strict on**, eslint not gutted.

---

## Run it for real in Claude Code

```
npm run lint
npx tsc --noEmit
# after installing gstack globally on Windows:
#   /cso       ← full security audit with trend tracking
#   /review    ← reviews your live diff before you merge
```
