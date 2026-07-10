-- ============================================================================
-- 065_user_devices_claim_policy.sql
-- Fix: signing in on a device where another user already registered its FCM
-- token failed with an RLS error (42501). user_devices.fcm_token is UNIQUE, so
-- the client upsert becomes an ON CONFLICT UPDATE against a row owned by the
-- previous user — which the old "for all USING (auth.uid() = user_id)" policy
-- forbids. Split into per-command policies and make UPDATE a "claim": USING is
-- permissive so the on-conflict update can proceed, WITH CHECK still guarantees
-- the row ends up owned by the caller (they can never assign it to someone else).
-- Idempotent — paste into Supabase → SQL Editor → Run.
-- ============================================================================

drop policy if exists "user_devices own" on public.user_devices;
drop policy if exists "user_devices select own" on public.user_devices;
drop policy if exists "user_devices insert own" on public.user_devices;
drop policy if exists "user_devices claim" on public.user_devices;
drop policy if exists "user_devices delete own" on public.user_devices;

create policy "user_devices select own" on public.user_devices
  for select using (auth.uid() = user_id);

create policy "user_devices insert own" on public.user_devices
  for insert with check (auth.uid() = user_id);

-- Claim: take over a device-token row (e.g. after an account switch on a shared
-- device). Permissive USING lets the on-conflict update run; WITH CHECK forces
-- the resulting row to be owned by the caller.
create policy "user_devices claim" on public.user_devices
  for update using (true) with check (auth.uid() = user_id);

create policy "user_devices delete own" on public.user_devices
  for delete using (auth.uid() = user_id);
