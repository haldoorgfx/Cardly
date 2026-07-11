# Eventera — 3-Day Launch Runbook

**Target:** Web live on **eventera.so** · Mobile **submitted** to App Store + Play · **Free events + WaafiPay** live at launch (Stripe/Flutterwave later).

**Reality check on "app go live":** the web platform can be fully live in 3 days. The mobile app can be **built, signed, and submitted** in 3 days — but Apple/Google review takes days to weeks, so the app becomes *publicly* available after they approve it, not on day 3. Plan the announcement around the web launch; the app follows.

**Recommended launch style:** soft / invite beta first (share eventera.so quietly with a small group for 24–48h), then announce publicly once it's held up. Everything below works for either.

---

## Pre-flight — already done (in code, on branch `expansion-work`)

- All 8 expansion feature groups built (entitlements, multi-day, offline check-in, dietary/accessibility, cash door sales, WhatsApp, add-to-calendar, management + audit).
- 15 bugs fixed across two audits, including the security holes: forged-registration RLS, Flutterwave payment reuse, unguarded API check-in, staff cash-read, mislabeled paid door sales.
- Domain references swept from `karta.cre8so.com` → `eventera.so` (env-driven; fallbacks updated).
- Mobile bundle IDs fixed to `so.eventera.app`, iOS permission strings added, Android deep-link host set to eventera.so.
- Web hardened: branded error/404 boundaries, env-missing diagnostics, `/api/health`, free-events + WaafiPay-only path verified clean.

**Before anything else, commit + push the current work from PowerShell:**
```
cd C:\Users\cabda\cardly
git add -A
git commit -m "chore: launch prep — domain migration, security fixes, hardening, mobile store config"
git push
```

---

## DAY 1 — Database, domain, and environment (get eventera.so serving the app)

### 1.1 Apply all outstanding migrations (Supabase SQL editor)
Run in order. All are idempotent — safe to re-run:
```
067_dietary_accessibility.sql      (re-run — catering overcount fix)
068_offline_sync.sql               (re-run — column fix)
070_cash_reconciliation.sql        (re-run — reserved-word fix)
074_entitlement_redemptions_realtime.sql
075_walkin_registration_rpc.sql
076_seen_entitlements_migration.sql
077_cash_shift_transactions.sql
078_rls_hardening.sql              ← SECURITY: locks the open registration insert
```
If any errors, **stop and fix that one before continuing** — later files depend on earlier tables.

### 1.2 Back up the schema (do this — it's a real risk)
Migrations **049–064 are missing from the repo** but applied to your live DB. That means you can't rebuild the database from git, and the RLS-recursion + role-system fixes aren't backed up. Capture the live schema as a baseline:
- In Supabase → **Database → Backups**, confirm automated backups are on (they are on paid plans).
- Export the current schema: `supabase db dump --schema public -f supabase/baseline_schema.sql` (via the Supabase CLI with your project linked), OR Database → **Schema Visualizer / SQL** → dump. Commit that file so the repo is rebuildable.
- This is a today task, not a someday one — if the DB is ever lost, the missing migrations can't be reconstructed from memory.

### 1.3 Point eventera.so at the app (Vercel)
- Vercel project → **Settings → Domains** → add `eventera.so` (and `www.eventera.so`).
- At your DNS provider, add the records Vercel shows (usually an A/ALIAS for the apex + CNAME for www).
- **Keep `karta.cre8so.com` attached as an alias** — older installed mobile apps and existing shared links still hit it during transition.
- Vercel → **Settings → Git → Production Branch**: confirm which branch is production (it's ambiguous in your repo — `main` vs a broken `master`). You'll merge into that branch on Day 3.

### 1.4 Set production environment variables (Vercel → Settings → Environment Variables, "Production")

**Required for the app to work at all:**
| Var | Value |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | your Supabase URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | service-role key (server only) |
| `NEXT_PUBLIC_APP_URL` | `https://eventera.so` |

**Required for launch features:**
| Var | For |
|---|---|
| `RESEND_API_KEY` | sending email |
| `RESEND_FROM_EMAIL` | `noreply@eventera.so` (must be a verified sender — see 2.1) |
| `WAAFIPAY_MERCHANT_UID`, `WAAFIPAY_API_USER_ID`, `WAAFIPAY_API_KEY`, `WAAFIPAY_WEBHOOK_SECRET` | live paid tickets |
| `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` | venue maps |
| `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN` | rate limiting (recommended for a public launch) |

Leave Stripe/Flutterwave/WhatsApp/AI vars unset for now — those features degrade gracefully. Do **not** set `WAAFIPAY_SANDBOX` (live mode).

### 1.5 Update Supabase Auth for the new domain
- Supabase → **Authentication → URL Configuration**: set **Site URL** to `https://eventera.so`, and add `https://eventera.so/**` (and keep `https://karta.cre8so.com/**`) to **Redirect URLs**.
- If Google sign-in is on: in the **Google Cloud console** OAuth client, add `https://eventera.so/auth/callback` to Authorized redirect URIs.

### 1.6 First deploy to the new domain
- Trigger a preview deploy of `expansion-work` (a push does this). Once green, open `https://eventera.so` — but note it won't be *production* until Day 3's merge. Use the preview URL + eventera.so domain to smoke-test.
- Hit `https://<preview>/api/health` — confirm `config.ok: true` and every env var reads present. This is your fastest "is prod wired right" check.

---

## DAY 2 — Email, payments, and the mobile build

### 2.1 Verify the sending domain in Resend
- Resend → **Domains** → add `eventera.so`, add the DKIM/SPF/return-path DNS records it gives you. Until verified, emails either don't send or land in spam.
- Set `RESEND_FROM_EMAIL=noreply@eventera.so` in Vercel (Day 1) to match.
- Test: register for a free test event on the preview → confirm the confirmation email arrives and links point to eventera.so.

### 2.2 WaafiPay live
- Put your **live** WaafiPay merchant credentials in the Vercel env (Day 1 table).
- Point the WaafiPay webhook at `https://eventera.so/api/payments/waafipay-webhook` in your WaafiPay dashboard.
- Test one real low-value paid ticket end-to-end: register → pay via WaafiPay → confirm the registration flips to paid → scan the QR at check-in (should admit; an unpaid one should be blocked).

### 2.3 Free-events launch posture
- The free path needs no payment provider and is verified clean. If you want **zero** paid risk on day one, simply don't enable Stripe/Flutterwave on any event — organizers can still run free events and WaafiPay events. A paid ticket with no live provider now fails gracefully (honest inline message, no crash), but cleanest is to keep events free/WaafiPay until you're ready.

### 2.4 Mobile build + signing (the real submission blockers)
Fixed in code already: bundle IDs (`so.eventera.app`), iOS permission strings, deep-link host. Remaining are **manual and yours**:

**Android (Play):**
- Generate an upload keystore, add `key.properties`, wire a real `release` signingConfig in `android/app/build.gradle.kts` (currently debug-signed — Play rejects that).
- `flutter build appbundle --release` → produces the `.aab`.
- Create the app in **Play Console** with application id `so.eventera.app`.

**iOS (App Store) — needs a Mac:**
- Register App ID `so.eventera.app` in the Apple Developer portal; create a distribution certificate + provisioning profile.
- Open `ios/Runner.xcworkspace` in Xcode on a Mac, set the team, `flutter build ipa --release`, upload via Xcode/Transporter.
- iOS builds cannot be produced on Windows — you'll need Mac access (or a Mac cloud/CI service) for this step.

**Confirm `eventera.so` is live and serving `/api/render`, `/api/payments/waafipay`, `/privacy` before you submit** — the app hardcodes that domain, so if it isn't resolving, the app is dead on open.

### 2.5 Store listing prep (parallel, console work)
- Privacy policy URL: `https://eventera.so/privacy` (page already exists).
- Data-safety / privacy-nutrition forms — the app collects: email + name (auth), photos (card image), camera (QR scan, not stored), precise location (events-near-me), a mobile-money phone number (WaafiPay). Declare these.
- Screenshots (2–3 per device class), app description, category, content rating.

---

## DAY 3 — Final QA, go live, submit

### 3.1 Build gate + final smoke test (on the preview)
```
cd C:\Users\cabda\cardly
pnpm run build          # must pass clean
cd eventera_mobile ; flutter analyze | Select-String "error"   # 0 errors
```
Smoke-test on eventera.so (see checklist below). Do the soft-beta here: share with a few people for a few hours.

### 3.2 Promote to production
Two options — the **Vercel Promote** path avoids your repo's broken `master` ref entirely and is safest:
- **Recommended:** Vercel → Deployments → the green `expansion-work` build → **⋯ → Promote to Production**.
- **Or via git:** confirm your production branch (Settings → Git), merge `expansion-work` into it, push. Fix the broken `master` ref first if that's your production branch.

### 3.3 Submit the apps
- Upload the signed `.aab` to Play, the `.ipa` to App Store Connect, complete the listings, hit **Submit for review**. Then it's in Apple/Google's hands.

### 3.4 Announce
- Soft first, then public once the beta group hasn't hit anything. Web is live immediately; say the app is "coming to the stores."

---

## Smoke-test checklist (run on eventera.so before promoting)

1. Marketing home loads; shared link preview looks right.
2. Sign up → email arrives → log in. Google sign-in works.
3. Create an event → publish → the public `/e/<slug>` page loads for a logged-out visitor.
4. Register for a **free** ticket → confirmation shows + email arrives with eventera.so links.
5. Register + pay a **WaafiPay** ticket → flips to paid.
6. Add an **entitlement** (e.g. Lunch, meal) → attach to a ticket → open `/events/<id>/analytics/redemption`.
7. On the phone (debug build is fine for this): switch to organizing → **Scan** → scan the attendee QR → dark success screen; scan again → "already". Unpaid/refunded/unapproved → blocked.
8. Check-in an approval-required registration → it's blocked until approved; the attendee sees "awaiting approval," not a fake confirmed ticket.
9. `/api/health` → `config.ok: true`.
10. Open a couple of the new tool cards on an event overview (Catering, Cash, Audit, Multi-day) — each loads.

---

## Post-launch (week 1, not blocking)

- Event pages currently share with title-only social metadata — add per-event OG image/description so shared event links look rich.
- WhatsApp: add Meta Business API credentials to light up that channel.
- Turn on Stripe + Flutterwave (live keys + webhook secrets) when ready for international/African card payments.
- Decide whether registration counts are a hard plan cap (today only card generation is metered).
- Reconstruct/commit migrations 049–064 as a baseline if you didn't in 1.2.
