# Eventera — Security & Access Audit (Pass 1)

**Date:** 2026-07-11
**Scope:** All API routes, RLS, service-role usage, IDOR, webhooks, uploads, secrets, rate limiting.
**Method:** Static scan of all 169 route handlers + manual read of representative routes in every flagged cluster.
**Status:** Investigation complete. **No fixes applied yet — awaiting approval.**

---

## Headline

The platform is in **materially better shape than a generic checklist assumes.** The dominant pattern is correct: routes authenticate with the session client, verify resource ownership, then use the service-role client only for the scoped work. Payments webhooks are signature-verified, no secrets leak to the client, and rate limiting covers the sensitive endpoints.

There is **one coherent class of real bug**: a handful of *attendee-facing* engagement routes trust a `registration_id` supplied in the request instead of verifying the caller actually owns that registration. The codebase already has the right tool for this (`assertOwnsRegistration` in `lib/attendee-identity.ts`) and uses it correctly in some routes (e.g. `connections` writes) but **skips it in others** (private messaging, the people directory). That inconsistency is the main thing to fix.

**Nothing here is a "stop the launch" catastrophe, but F1–F3 should be fixed before opening to the public.**

---

## Scan results

- **169** total API route files.
- **131** use the service-role (`createAdminClient`) client.
- Automated flags: 26 "no-auth + admin", 22 "auth-but-no-ownership".
- After manual review, **most flags are false positives** (alternate auth mechanisms the regex can't see): API-key auth (`authenticateApiKey`) on all `v1/*` routes, token-gated portals (`invite_token`) on exhibitor/sponsor routes, provider-verified payment confirms, and self-scoped routes (profile/account/onboarding/billing act on `user.id`).

---

## CONFIRMED GOOD (verified by reading the code)

| Area | Finding |
|---|---|
| Organizer routes | Consistent `auth.getUser()` → `events.eq('user_id', user.id)` ownership check → scoped admin query. `events/[id]/registrations` is exemplary (auth, ownership, capacity checks, status enum validation, search input sanitized against injection). |
| Attendee write actions | Use `assertOwnsRegistration()` identity guard — verified in `connections` POST/PATCH. |
| Developer API (`v1/*`) | `authenticateApiKey(req, scope)` with per-scope checks, scoped to `auth.userId`. |
| Exhibitor / sponsor leads | Token-gated (`invite_token`), scoped by `sponsor_id`, Zod-validated input. |
| Payment confirm | `payments/confirm-intent` retrieves the PaymentIntent from Stripe, binds it to the registration (`.eq('stripe_payment_intent_id', …)`), only updates `pending` rows → idempotent and correct. |
| Webhooks | Stripe (`constructEvent`), Flutterwave (`timingSafeEqual`), WaafiPay (`verifyWaafiPayWebhook`) — all verify signatures before trusting the event. |
| Secrets | No service-role/secret keys in client or `NEXT_PUBLIC_*`. Only legitimate public keys (Supabase anon, Stripe publishable, PostHog, Google Maps). |
| Rate limiting | Active on 17 sensitive endpoints incl. `register`, `checkin`, `promo`, `live/questions`, `community`, `connections`, `matches`. |
| RLS / SQLi | RLS hardening migration 078 applied; parameterized queries throughout; free-text search sanitized. |
| Admin routes | `admin/impersonate`, `admin/flags` use `requireAdmin()` / `requirePermission()` server-side role checks (not just hidden UI). |

---

## FINDINGS TO FIX (priority order)

### F1 — HIGH — Private messaging has no identity check
**File:** `app/api/threads/route.ts` (and likely `app/api/events/[id]/messages/route.ts` — to confirm).
`GET` returns any registration's DM threads **and message contents** given only its UUID. `POST` sends a message as **any** `sender_id`. Unlike `connections`, it never calls `assertOwnsRegistration`. Combined with F2 (which leaks registration IDs), an attacker can read and impersonate attendees' private messages.
**Fix:** call `assertOwnsRegistration(event_id, registration_id)` on read and on send (`sender_id`). Add a 403 test.

### F2 — MEDIUM-HIGH — Attendee email leak in the people directory
**File:** `app/api/events/[id]/people/route.ts`.
No auth. Returns `attendee_email` and `custom_fields` for up to 200 confirmed attendees to **anyone** who knows the event ID. It strips `user_id` and respects the directory opt-out, but still exposes emails to unauthenticated callers and to other attendees.
**Fix:** require `assertOwnsRegistration` for the caller's `reg`; stop returning `attendee_email` and `custom_fields` to peers (return name, card URL, ticket label only). Add a test.

### F3 — MEDIUM — Unauthenticated sponsor asset upload
**Files:** `app/api/sponsors/upload-logo/route.ts`, `app/api/sponsors/upload-resource/route.ts`.
Accept a `sponsorId` with **no auth or token**. Anyone can overwrite any sponsor's logo and write arbitrary images into the storage bucket. Type (image/*) and size (5 MB) are validated — good — but ownership is not.
**Fix:** require the sponsor `invite_token` (as the leads route does) and verify it maps to `sponsorId` before uploading.

### F4 — LOW-MEDIUM — Networking read endpoints are open by design
**Files:** `events/[id]/connections` (GET), `matches`, `community`, `leaderboard`.
Return attendee **names + card URLs** (no email) without auth. Writes are guarded. Acceptable for a public networking wall, but should still be confirmed not to leak email/PII and ideally gated to confirmed attendees.
**Fix (optional for launch):** gate reads behind `assertOwnsRegistration` for consistency; confirm no PII beyond name/card.

### F5 — LOW — Hardening
- Restrict the Google Maps API key to your domains (HTTP-referrer restriction) in Google Cloud console.
- Confirm login/signup rate limits (currently rely on Supabase defaults) are acceptable for a public launch.
- Spot-check the 22 "auth-but-no-ownership" routes (profile, account, onboarding, billing) confirm all are strictly self-scoped to `user.id` (expected: yes).

---

## Proposed fix order (one commit per group, 403 test per access fix)
1. **F1** — add `assertOwnsRegistration` to `threads` + `messages`.
2. **F2** — auth-gate `people`, drop email/custom_fields from peer payload.
3. **F3** — token-gate sponsor uploads.
4. **F4/F5** — consistency + hardening.
5. Re-run static scan + `pnpm build` → confirm green.

---

## FIXES APPLIED (2026-07-11)

| Finding | Status | Files changed |
|---|---|---|
| **F1** — private messaging identity | ✅ Fixed | `app/api/threads/route.ts` (GET+POST now call `assertOwnsRegistration`), `app/api/events/[id]/messages/route.ts` (list-threads GET + PATCH now guarded; POST/thread-GET already were) |
| **F2** — attendee email leak | ✅ Fixed | `app/api/events/[id]/people/route.ts` — now requires the caller's confirmed registration (`assertOwnsRegistration`) and no longer selects/returns `attendee_email` |
| **F3** — unauth sponsor uploads | ✅ Fixed | `app/api/sponsors/upload-logo/route.ts`, `app/api/sponsors/upload-resource/route.ts` — now require ownership via new `lib/sponsors/authorize.ts` (`canManageSponsor`: event-owner **or** sponsor-owner **or** valid invite token). Resource uploads also block script/executable extensions. |

**New file:** `lib/sponsors/authorize.ts`.

### Follow-ups (not blocking, tracked)
- **custom_fields exposure (LOW):** `/people` still returns raw registration `custom_fields` to fellow confirmed attendees (needed for the networking subtitle). Now gated to confirmed attendees only, but a future pass should whitelist only display fields (role/company/bio) rather than all form answers.
- **F4** — networking read endpoints (`connections` GET, `matches`, `community`, `leaderboard`) return name + card only (no email). Accepted for launch; optional consistency gate later.
- **F5** — restrict Google Maps key by referrer; confirm login/signup rate limits.
- **Tests:** repo has no unit-test runner (only `next build`/`lint`). The 403 behaviour of F1–F3 will be verified live during Pass 8 QA rather than via unit tests.

### Verification
- Sandbox has no installed `node_modules`, so `tsc`/`build` can't run here. Changes are type-safe by inspection (the `IdentityCheck` union narrows on `!identity.ok`). **Authoritative gate: the Vercel production build on push.**

