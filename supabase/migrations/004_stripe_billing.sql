-- Migration 004: Stripe billing columns
-- Idempotent — safe to re-run

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS stripe_customer_id       text UNIQUE,
  ADD COLUMN IF NOT EXISTS stripe_subscription_id   text,
  ADD COLUMN IF NOT EXISTS subscription_status      text NOT NULL DEFAULT 'none'
    CHECK (subscription_status IN ('active','trialing','past_due','canceled','incomplete','none')),
  ADD COLUMN IF NOT EXISTS billing_cycle            text NOT NULL DEFAULT 'none'
    CHECK (billing_cycle IN ('monthly','annual','none')),
  ADD COLUMN IF NOT EXISTS current_period_end       timestamptz,
  ADD COLUMN IF NOT EXISTS cancel_at_period_end     boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS cards_this_month         int NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS cards_month_start        timestamptz NOT NULL DEFAULT now();

-- Index for webhook upsert lookups
CREATE UNIQUE INDEX IF NOT EXISTS profiles_stripe_customer_id_idx
  ON profiles (stripe_customer_id)
  WHERE stripe_customer_id IS NOT NULL;

-- Atomic counter increment (avoids read-modify-write race)
CREATE OR REPLACE FUNCTION increment_cards_this_month(user_id uuid)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
AS $$
  UPDATE profiles
  SET cards_this_month = cards_this_month + 1
  WHERE id = user_id;
$$;
