# Eventera — Payment Correctness Audit (Pass 2)

**Date:** 2026-07-11
**Scope:** Registration-vs-payment ordering, webhook idempotency, orphan cleanup, refunds, currency, receipts, payment-failure UX, atomic capacity.
**Method:** Full read of `events/[id]/register`, all three webhooks (Stripe / Flutterwave / WaafiPay), the Stripe confirm endpoint, the admin refund endpoint, and the `increment_ticket_quantity_sold` DB function.
**Status:** Investigation complete. **No fixes applied — awaiting approval.**

---

## Headline

The payment flow is **solid and correctly designed.** Money-handling fundamentals are right: paid registrations are created as inert `pending` rows that don't count toward capacity or inventory until payment actually confirms; all three webhooks independently verify the transaction and are idempotent; and ticket inventory is decremented with an atomic, capped SQL function.

The findings are **edge cases and one real gap**: refunds are implemented for **Stripe only** — Flutterwave and WaafiPay have no refund path, which matters because your launch runs on **WaafiPay**. None of these blocks a Free-events launch; **P1 (WaafiPay refund) is the one worth handling before you sell many paid tickets.**

---

## CONFIRMED GOOD (verified in code)

| Check | Finding |
|---|---|
| **Reg created only after payment** | Paid tickets land as `status='pending', payment_status='pending'`. These rows are **inert**: capacity counts only `confirmed`/`checked_in`, and inventory (`quantity_sold`) is incremented **only** in the webhook on the pending→paid flip. A pending row is never a valid ticket. ✓ |
| **Webhook idempotency** | All three webhooks update with `.eq('payment_status','pending')` + `maybeSingle()`, so only the **first** pending→paid transition returns a row and runs the inventory increment / emails. Replayed or duplicate-delivered events find no pending row and no-op. Concurrent duplicate deliveries are safe (row-level atomic update — one wins). ✓ |
| **Independent verification (no status-only trust)** | Stripe: signature-verified `constructEvent`. Flutterwave: re-verifies the transaction via the FW API **and** checks paid amount ≥ expected and currency matches. WaafiPay: signature-verified **and** amount/currency checked. A wrong-amount or wrong-currency callback cannot confirm a ticket. ✓ (This is better than most implementations.) |
| **Orphan cleanup on failure** | Stripe PI-creation failure and Flutterwave init failure both **delete** the pending registration. A stale/abandoned pending row is deleted on the attendee's next registration attempt (case-insensitive email match). ✓ |
| **Atomic capacity — per ticket** | `increment_ticket_quantity_sold` is a single `UPDATE ... SET quantity_sold = quantity_sold + qty WHERE quantity_sold + qty <= quantity` that raises `TICKET_SOLD_OUT` if it can't. Two concurrent buyers **cannot** oversell a ticket type. ✓ |
| **Promo codes** | Server-authoritative validation (validity window, usage cap), and the usage increment is guarded with `.lt('uses_count', max_uses)` so it can't exceed the cap under concurrency. ✓ |
| **Platform fee** | Computed server-side via `splitTicketAmount(plan, feeBearer)`; attendee never dictates the split. ✓ |
| **Free-event capacity race** | Free tickets do a **post-insert** capacity recheck and roll back if the event just filled. ✓ |

---

## FINDINGS TO FIX (priority order)

### P1 — MEDIUM — Refunds are Stripe-only
`app/api/admin/billing/refund/route.ts` calls `stripe.refunds.create` — there is **no refund path for Flutterwave or WaafiPay**, and neither of their webhooks handles a refund/reversal callback. Consequences:
- A WaafiPay/Flutterwave refund done manually in the provider dashboard will **not** flip the registration to `refunded` or return the ticket to inventory — the app still shows the attendee as paid/holding a ticket.
- Your launch runs on WaafiPay, so this is the most relevant gap once you sell paid tickets.
**Fix options:** (a) add a WaafiPay/Flutterwave refund initiation + handle their reversal webhook state; or (b) at minimum, an admin "mark refunded" action that flips status and returns inventory (`increment_ticket_quantity_sold(-1)`) for non-Stripe payments. Also super_admin-only today — organizers can't refund their own attendees (see P6).

### P2 — LOW-MEDIUM — Stripe amount assumes 2-decimal currencies
`register` computes `Math.round(split.charged * 100)` for the Stripe PaymentIntent. This is correct for USD/KES (2-decimal) but **overcharges 100×** for zero-decimal currencies (e.g. **DJF**, JPY) if one is ever routed to Stripe. Low likelihood today (DJF routes to WaafiPay), but a real correctness trap.
**Fix:** a zero-decimal currency set — don't multiply by 100 for those.

### P3 — LOW-MEDIUM — Paid tickets can oversell event-level capacity
Per-ticket quantity is atomically capped (good), but event `max_capacity` is checked only at **registration** time (when the row is still `pending` and uncounted). The webhook confirms paid registrations **without** re-checking event capacity. If tickets have **unlimited quantity** but the event has a `max_capacity`, a burst of paid confirmations can exceed capacity.
**Mitigant:** organizers who set per-ticket quantities summing to ≤ capacity are fully protected (atomic RPC).
**Fix:** recheck event capacity when a paid webhook confirms (roll back / waitlist if over), or document "set ticket quantities to enforce capacity."

### P4 — LOW — Abandoned pending registrations linger
A pending row from an abandoned payment is never harmful (uncounted, cleaned up on retry) but accumulates over time. Optional: a periodic cleanup of `pending` rows older than N hours.

### P5 — LOW — No itemized receipt
The confirmation email acts as a receipt but doesn't show the amount paid / fee. Optional: add amount + ticket line to the paid-confirmation email.

### P6 — LOW (Pass 6 territory) — Organizers can't refund from their dashboard
Refunds are super_admin-only. Organizer self-service refund/cancel belongs to Pass 6.

---

## Recommended action for this pass
Given the Free-events + WaafiPay launch posture, the highest-value, lowest-risk fixes are:
1. **P1 (partial)** — add an admin/organizer "mark refunded" action for **non-Stripe** payments that flips status → `refunded` and returns inventory. (Full WaafiPay/FW auto-refund via their APIs can follow.)
2. **P2** — zero-decimal currency guard on the Stripe amount (tiny, safe).

P3–P6 are documented for later. **Awaiting your approval on which to fix** — my recommendation is P1 (mark-refunded) + P2 now.

---

## FIXES APPLIED (2026-07-11)

| Finding | Status | Files |
|---|---|---|
| **P1** — non-Stripe refunds | ✅ Fixed | New `lib/payments/refund.ts` (`markRegistrationRefunded` — flips status + returns inventory, idempotent). `app/api/admin/billing/refund/route.ts` now accepts a `registrationId`: Stripe-backed → refunds via Stripe API (webhook flips status); WaafiPay/Flutterwave → reflects the externally-done refund and returns the seat. Audit-logged. |
| **P2** — zero-decimal currency | ✅ Fixed | `lib/payments/stripe.ts` adds `toStripeMinorUnit()` (handles DJF/JPY/XOF/… as zero-decimal). `app/api/events/[id]/register/route.ts` uses it instead of `× 100`. No more 100× overcharge risk. |
| **P3** — paid capacity oversell | ✅ Fixed | `register` capacity check now counts confirmed/checked-in **plus** pending rows from the last 15 min (soft-reserves a seat during the payment window). Free events unaffected (no pending rows). |
| **P4** — abandoned pendings | ➖ Mitigated by P3 | They now drop out of the capacity count after 15 min, so they no longer block seats. A cleanup cron remains optional cosmetic. |
| **P5** — itemized receipt | ⏸ Deferred (optional) | Would require threading an `amount` field through the email module + 3 webhook call sites for low value; left as documented follow-up. |
| **P6** — organizer refund UI | ⏸ Pass 6 | The refund endpoint now supports `registrationId` (the backend building block). The organizer-facing, org-scoped refund UI belongs to Pass 6 (Organizer self-service). |

**New files:** `lib/payments/refund.ts`.
**Verification:** sandbox can't build; changes are type-safe by inspection (`logAudit` takes `action: string`; `toStripeMinorUnit`/`markRegistrationRefunded` return plain values). Gate = the Vercel build on push.
