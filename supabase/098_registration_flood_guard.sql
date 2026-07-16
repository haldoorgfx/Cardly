-- 098_registration_flood_guard.sql
-- Closes the flagged "raw-REST registration spam" gap: registrations' RLS
-- insert policy is `with check (true)` by design (guest registration needs
-- no auth), so a script with the public anon key can hit Supabase's REST
-- endpoint directly, skipping both the app and the Upstash-rate-limited
-- Next.js /api/events/[id]/register route entirely.
--
-- Deliberately NOT a tight limit. A wrong (too-low) threshold would break a
-- legitimate registration burst or a busy walk-in check-in desk (same table)
-- on someone's actual event day — a worse, silent failure than the abuse
-- this prevents. This is a circuit breaker, not a per-user rate limit: it
-- only fires at a volume no real event or check-in desk could ever produce
-- (300 inserts/event/60s — a single desk scanning as fast as physically
-- possible is a few per minute; even 20 concurrent desks going flat-out
-- doesn't approach this), so it can only ever catch a genuine automated
-- flood, never a real burst of interest or a busy door.
create or replace function public.check_registration_flood_guard()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_recent_count int;
begin
  select count(*) into v_recent_count
    from public.registrations
    where event_id = new.event_id
      and created_at >= now() - interval '60 seconds';

  if v_recent_count >= 300 then
    -- Default P0001 (not 23505/unique_violation) so the API route's existing
    -- "you're already registered" duplicate-race branch doesn't misfire —
    -- this falls through to its generic error-message passthrough instead,
    -- surfacing this exact message to the caller.
    raise exception 'Too many registrations for this event in a short window. Please try again in a minute.';
  end if;

  return new;
end;
$$;

drop trigger if exists registration_flood_guard on public.registrations;
create trigger registration_flood_guard
  before insert on public.registrations
  for each row
  execute function public.check_registration_flood_guard();
