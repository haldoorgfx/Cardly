-- 074_entitlement_redemptions_realtime.sql
-- Enable Supabase realtime for the E09 live redemption dashboard.
-- The entitlement_redemptions ledger (065) is append-only; the dashboard subscribes
-- to INSERT events filtered by event_id and updates counts live. Nothing streams
-- until the table is in the `supabase_realtime` publication, so add it here.
-- Mirrors 061_realtime_publication.sql. REPLICA IDENTITY FULL keeps eq-filters on
-- non-PK columns (event_id) working for any future UPDATE/DELETE, matching 061.
-- Apply in the Supabase SQL editor. Safe to re-run.

do $$
begin
  begin
    execute 'alter publication supabase_realtime add table public.entitlement_redemptions';
  exception when duplicate_object then null;
  end;
end $$;

alter table public.entitlement_redemptions replica identity full;
