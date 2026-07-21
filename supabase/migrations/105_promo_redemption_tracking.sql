-- ─────────────────────────────────────────────────────────────────────────────
-- 105 · Promo redemption tracking
--
-- WHY: promo_codes.uses_count was incremented at registration-CREATE time, but
-- nothing recorded WHICH code a registration used. Two consequences:
--
--   1. A paid attendee who abandons Stripe/Flutterwave and retries has their
--      stale 'pending' registration deleted and a fresh one inserted — which
--      incremented the code a SECOND time. A max_uses = 10 code could be burnt
--      to zero by one person retrying checkout ten times, locking every real
--      buyer out ("This promo code has reached its usage limit") while zero
--      tickets were actually sold.
--   2. There was no audit trail at all — an organizer could not see which
--      registrations a discount was applied to, and finance could not reconcile
--      a discounted amount_paid back to the code that produced it.
--
-- This adds the missing link column plus a floored decrement RPC so the delete
-- side of a retry gives the use back.
--
-- Safe to apply at any time; the app writes promo_code_id defensively and keeps
-- working (minus the retry refund) until this is applied.
-- ─────────────────────────────────────────────────────────────────────────────

ALTER TABLE registrations
  ADD COLUMN IF NOT EXISTS promo_code_id uuid REFERENCES promo_codes(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS registrations_promo_code_idx
  ON registrations(promo_code_id)
  WHERE promo_code_id IS NOT NULL;

-- Mirror of increment_promo_code_uses (migration 017). Atomic, floored at 0 so a
-- double-release can never drive the counter negative, and silent when the row
-- is gone or already at 0 — releasing a use is best-effort cleanup, never fatal
-- to the request that triggered it.
CREATE OR REPLACE FUNCTION decrement_promo_code_uses(code_id uuid)
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  UPDATE promo_codes
  SET    uses_count = uses_count - 1
  WHERE  id = code_id
  AND    uses_count > 0;
END;
$$;
