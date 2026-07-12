# Eventera — Attendee Journey Audit

**Date:** 2026-07-07
**Auditor role:** Demanding attendee, merciless end-to-end test
**Method:** Static code walk (web + Flutter) + live backend verification against production Supabase (`qhjvetcawsaswfkufzee`) and `karta.cre8so.com`. Test writes tagged `[E2E-TEST]`; nothing deleted.

---

## Benchmark: what attendees expect in 2026 (Luma / Eventbrite / Eventee)

1. **Near-frictionless registration** — guest checkout, prefilled fields, one-tap. (Luma, Eventbrite)
2. **Ticket in a wallet + Apple/Google Wallet pass** — QR accessible without opening the app, offline-ready. (Luma "Mobile Wallet Passes", Eventbrite "save to phone wallet in one tap")
3. **Fast QR check-in** with an express/already-checked-in path. (Luma Express Mode)
4. **Personalized discovery** — local events, recommendations, "friends going," photos/video for vibe-check. (Eventbrite)
5. **Automatic change notifications** — email/push when organizer changes date/time/venue. (Eventbrite roadmap)
6. **Live engagement** — agenda builder w/ reminders, live Q&A with upvotes, polls, feedback. (Eventee)
7. **Networking** — attendee directory, matchmaking, private messaging for matches, meeting scheduler. (Eventee)
8. **Follow + save** — follow organizers, save events, get notified when tickets drop. (Eventbrite, Luma)

Sources: [Luma Help](https://help.luma.com/), [Luma Wallet Passes](https://help.luma.com/p/mobile-wallet-passes), [Eventbrite App](https://www.eventbrite.com/l/eventbrite-app/), [Eventbrite Roadmap 2026](https://www.eventbrite.com/product-updates/roadmap-2026/), [Eventee](https://eventee.com/).

---

## What actually works (verified live)

- **Free registration** end-to-end on production: `POST /api/events/{id}/register` → 201 with `qr_code_token`, `variant_id`. Verified against "AI Ethics Webinar."
- **Double-submit / duplicate guard**: second identical POST → `409 "You are already registered for this event."`
- **Input validation**: bad email → `400 "Please enter a valid email address"` with field details.
- **Promo validation server-side**: bogus code → `400 "That promo code isn't valid for this event."`
- **Paid (Stripe) init**: returns real `client_secret` (`pi_..._secret_...`) and `payment_required: true`.
- **QR image**: `GET /api/qr/{token}` → 200 `image/png` (3.5KB).
- **Ticket transfer, ICS calendar export, Eventera Card render** exist and are correctly built server-side (see agent detail).

---

## BLOCKERS

### B1. Anonymous users can read the entire `registrations` table (attendee PII) — VERIFIED LIVE
- **Severity:** CRITICAL (data breach / GDPR-class)
- **Flow / evidence:** Using only the public anon key, `GET /rest/v1/registrations?select=attendee_name,attendee_email` returned real rows (e.g. real names + gmail/other addresses). Count via `Prefer: count=exact` = **68 rows readable by anon**. This is a straight RLS misconfiguration — the table has no policy restricting SELECT to the owner/organizer.
- **Impact:** Every attendee's name, email, phone, `qr_code_token` (which is the check-in credential and QR payload), amount paid, and status is scrapeable by anyone with the shipped mobile anon key. QR-token exposure additionally enables **check-in impersonation** (the check-in API keys off `qr_code_token`).
- **Solution:** Add RLS to `registrations`: SELECT only where `user_id = auth.uid()` OR the caller owns the parent event; block anon SELECT entirely. Never expose `qr_code_token` to non-owners. Rotate leaked tokens if this is treated as a real breach at launch. Audit all API reads that rely on the admin client (they bypass RLS and are fine) vs. any client-side reads.

### B2. Other engagement tables also world-readable by anon — VERIFIED LIVE
- **Severity:** HIGH
- **Evidence:** anon count: `qa_questions` = 8, `attendee_agendas` = 4 readable. (Good: `messages`, `message_threads`, `notifications`, `saved_events` returned 0 — correctly locked.)
- **Impact:** Q&A content and individual attendees' personal agendas leak to the public. `attendee_agendas` reveals who is attending which sessions.
- **Solution:** RLS scope reads to event context / own registration.

### B3. Engagement write APIs trust client-supplied identity
- **Severity:** HIGH (impersonation)
- **File:** `components/qa/QandAClient.tsx:34`, `components/messaging/MessagingClient.tsx:106`, `components/polls/PollsClient.tsx:28`, and their `app/api/events/[id]/{q-and-a,messages,polls}` routes.
- **Evidence:** `registration_id` / `sender_id` / `recipient_id` are read from the request body and used verbatim; the route never checks they belong to the authenticated caller.
- **Impact:** One attendee can post Q&A, cast poll votes, or send DMs **as another attendee**.
- **Solution:** Resolve the caller's own registration from the auth session server-side; ignore body-supplied IDs.

### B4. Mobile cannot pay with Stripe or Flutterwave
- **Severity:** HIGH (revenue dead-end on mobile)
- **File:** `eventera_mobile/lib/attendee/register/` — only `waafipay_payment_screen.dart` exists; no Stripe/Flutterwave screen. `registration_screen.dart` sends `preferred_processor` but has nowhere to hand off a `client_secret` or redirect URL.
- **Impact:** Any paid event using Stripe or Flutterwave (the majority of live events — 13 of 15 upcoming events are `stripe`) is unbuyable in the mobile app. Attendee hits a dead end after submitting.
- **Solution:** Add a WebView-based Stripe (3DS) and Flutterwave checkout screen, or redirect mobile paid checkout to the web flow.

### B5. Notifications inbox never receives anything for most events
- **Severity:** HIGH (core 2026 expectation missing)
- **File:** `app/api/notifications/route.ts` (read/mark-read only); `lib/notifications` `createNotification` is only called on ticket confirmation. No triggers on **event date/time/venue change, Q&A answer, new message, waitlist promotion, poll result**. Mobile FCM push is scaffolded but not configured.
- **Impact:** Fails Eventbrite's headline 2026 feature (auto event-change notifications). Attendees who registered are not told when an event moves. Realtime UI exists on mobile but the table stays empty.
- **Solution:** Emit `createNotification` on event edits, Q&A answers, messages, waitlist promotion; finish FCM wiring.

### B6. Dead notification link — `/account/my-tickets` 404s in production — VERIFIED LIVE
- **Severity:** MEDIUM-HIGH (every ticket-confirmed notification is a broken link)
- **File:** `actionUrl: '/account/my-tickets'` in `app/api/events/[id]/register/route.ts:492`, `app/api/payments/webhook/route.ts:84`, `waafipay/route.ts:103`, `flutterwave-confirm/route.ts:100`, `flutterwave-webhook/route.ts:103`, `confirm-intent/route.ts:64`.
- **Evidence:** `GET https://karta.cre8so.com/account/my-tickets` → **404**. The real wallet lives at `/my-tickets` (302 to login when unauthenticated).
- **Impact:** Clicking "You're in — ticket confirmed" lands on a 404 for every attendee with an account, across all 6 payment/registration paths.
- **Solution:** Change all six `actionUrl`s to `/my-tickets`.

### B7. No attendee self-service cancel / refund
- **Severity:** MEDIUM-HIGH (support burden, trust)
- **File:** `components/tickets/TicketDetailClient.tsx:600` — comment: "No cancel/refund route exists on the platform yet." Refund exists only at `app/api/admin/billing/refund/route.ts` (super_admin only). No refund email template.
- **Impact:** Attendees who can't attend have no path but to email the organizer; paid attendees cannot get money back self-serve. Below Luma/Eventbrite baseline.
- **Solution:** Add `app/api/tickets/[id]/cancel` (owner-scoped) that flips status, calls Stripe/Flutterwave refund for paid tickets per an organizer refund policy, and emails confirmation.

### B8. "Works offline" copy is false; no PWA / Wallet passes
- **Severity:** MEDIUM
- **File:** `components/tickets/MyTicketsClient.tsx:103` ("Brightness raised automatically · works offline"); `MyTicketsClient.tsx:231` uses non-standard `screen.brightness` (unsupported in all standard browsers). No `public/manifest.json`, no service worker. No `.pkpass` / Google Wallet generation anywhere.
- **Impact:** QR is not guaranteed available offline at the venue door (only browser HTTP cache, `max-age=86400`), contradicting the on-screen promise. No Apple/Google Wallet pass — a table-stakes Luma/Eventbrite feature.
- **Solution:** Either implement a service worker that caches ticket + QR and remove the brightness stub, or delete the false copy. Add `.pkpass`/Google Wallet generation as a fast-follow.

---

## FRICTION

### F1. Abandoned / stuck payments give the attendee no closure
- **Severity:** HIGH friction
- **File:** `components/registration/ConfirmPage.tsx` (verify phase); webhooks are fire-and-forget with no timeout fallback UI.
- **Evidence:** If the Stripe/Flutterwave/WaafiPay webhook never fires (or amount/currency mismatch causes a silent `return NextResponse.json({received:true})` in `flutterwave-webhook/route.ts:68-76` and `waafipay-webhook/route.ts:53-56`), the registration stays `pending` forever and the attendee sees "verifying…" then nothing. No "check your email / contact support in 10 min" message.
- **Solution:** After a polling timeout, show a clear pending-state message with support contact; alert on repeated webhook mismatches.

### F2. Pending-approval attendees have no status page
- **Severity:** MEDIUM
- **File:** `app/api/events/[id]/register/route.ts:331-354` returns `awaiting_approval` and emails the attendee, but there is no attendee-facing screen to see "pending" status, and `/my-tickets` filters may not surface it clearly.
- **Solution:** Show pending-approval registrations in the wallet with an "Awaiting organizer approval" badge.

### F3. Add-to-calendar and Eventera Card not in the confirmation email
- **Severity:** MEDIUM
- **File:** `lib/registration/email.ts` — confirmation email includes QR but no ICS/calendar link; card download link only appears if `eventeraCardUrl` is non-null, but the card isn't generated until the attendee visits the confirm page. Chicken-and-egg → most confirmation emails never show a card link.
- **Solution:** Include an "Add to calendar" link in the email; generate/attach the card link post-generation or add a "Get your card" CTA.

### F4. Card render errors shown raw to attendees
- **Severity:** LOW-MEDIUM
- **File:** `app/api/render/route.ts:85` throws `NO_BACKGROUND: …`; `ConfirmPage.tsx:174` surfaces `err.message` directly.
- **Impact:** Attendee sees "NO_BACKGROUND: This card variant has no background image" — a problem only the organizer can fix.
- **Solution:** Friendly copy + "we'll email your card shortly" fallback.

### F5. No realtime on messages / community / Q&A (web)
- **Severity:** MEDIUM
- **File:** `components/messaging/MessagingClient.tsx`, community client — no Supabase realtime subscription; load-once. Mobile polls every ~10s.
- **Impact:** Conversations look dead; replies invisible until manual refresh. Below Eventee live-engagement bar.
- **Solution:** Add `postgres_changes` subscriptions.

### F6. Client-side promo/PWYW validation doesn't block submit
- **Severity:** LOW
- **File:** `components/registration/RegistrationClient.tsx` — client shows an error but still POSTs; server correctly rejects (`register/route.ts:124`). Extra round-trip and confusing double error.
- **Solution:** Early-return on client validation failure.

### F7. Duplicate tickets in wallet for guest-then-signed-in same email
- **Severity:** LOW
- **File:** `app/(app)/my-tickets/page.tsx` matches by `attendee_email OR user_id`; a guest reg + account reg with same email both show.
- **Solution:** De-dupe by email in the wallet list.

---

## GAPS (vs competitors)

### G1. No Apple/Google Wallet passes — see B8. (Luma, Eventbrite baseline.)

### G2. No web map view for discovery
- **File:** `app/(public)/events/page.tsx` vs mobile `discover_screen.dart` (which reads `venue_lat/lng`). Web has no geographic browse.
- **Impact:** Below Eventbrite/Luma local-discovery expectation on the primary (web) surface.

### G3. No "friends going" / social proof in discovery
- No follower-graph surfacing on event pages or discovery. Eventbrite and Luma both lead with this.

### G4. Personal agenda has no reminders/notifications
- `attendee_agendas` persists saved sessions, but no "your session starts in 15 min" reminder. Eventee ships this.

### G5. Attendee privacy toggles not enforced in the directory
- **File:** people/directory query has no `directory_visible = true` filter; dietary/accessibility fields not shielded by RLS. Private info can leak to other attendees. (Overlaps B1/B2 severity if these columns are anon-readable.)

### G6. Saved/Following not surfaced or actionable
- `saved_events` and `organizer_follows` persist (APIs exist), but there's no visible "Save" button on `PublicEventPageClient`, and following triggers no notifications when a followed organizer publishes/opens ticket sales.

### G7. Waitlist promotion is one-at-a-time; no bulk promote
- **File:** `app/api/events/[id]/waitlist` PATCH accepts a single `entry_id`. Organizers can't promote the top N. Attendee-facing waitlist join works.

### G8. No batch/express check-in path surfaced for attendees; QR contract is fine
- Check-in API correctly handles `already_checked_in`, cancelled, payment-pending states (`app/api/events/[id]/checkin/route.ts`). Good. But there's no Luma-style Express Mode toggle.

---

## Mobile vs web parity (summary)

| Capability | Web | Mobile | Note |
|---|---|---|---|
| Free registration | ✅ | ✅ | |
| Paid — WaafiPay | ✅ | ✅ | |
| Paid — Stripe / Flutterwave | ✅ | ❌ | **B4 dead-end** |
| Wallet / QR display | ✅ | ✅ | |
| Q&A / polls / feedback | ✅ | ✅ | both trust client identity (B3) |
| Messages / community | ✅ (no realtime) | ✅ (polling) | F5 |
| Notifications | table empty (B5) | realtime ready, empty | B5 |
| Guest engagement after app restart | n/a | ❌ in-memory only | `event_context.dart` loses `registrationId` |
| Onboarding | `/account/setup` | unclear/missing | |

---

## Top fixes, in order
1. **B1** — lock down `registrations` RLS (PII + QR-token breach). Do this before anything else.
2. **B2/B3** — RLS + server-side identity on engagement tables.
3. **B4** — mobile Stripe/Flutterwave checkout (or web redirect).
4. **B6** — one-line fix: `/account/my-tickets` → `/my-tickets` in 6 routes.
5. **B5** — wire notification triggers (event-change especially) + FCM.
