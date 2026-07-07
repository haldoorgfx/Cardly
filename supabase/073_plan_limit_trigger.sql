-- 073_plan_limit_trigger.sql
-- ─────────────────────────────────────────────────────────────────────────────
-- Enforce the Free-plan "1 event" limit at the DATABASE level.
--
-- WHY: the limit was only checked in app/api/events/create/route.ts. The mobile
-- app creates events by writing the `events` table DIRECTLY via the Supabase
-- client (eventera_mobile/lib/eventera_api.dart createEvent), which never calls
-- that route — so a Free user could create unlimited events from the phone.
-- A BEFORE INSERT trigger enforces it for every client, no matter the path.
--
-- Free = 1 non-archived event. Pro/Studio = unlimited (profiles.plan).
-- Safe + idempotent. Paste into the Supabase SQL editor and run once.
-- ─────────────────────────────────────────────────────────────────────────────

create or replace function public.enforce_free_event_limit()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_plan  text;
  v_count integer;
begin
  select plan into v_plan from profiles where id = new.user_id;

  -- Only the Free plan is capped. Missing plan defaults to 'free' (fail-safe).
  if coalesce(v_plan, 'free') <> 'free' then
    return new;
  end if;

  select count(*) into v_count
  from events
  where user_id = new.user_id
    and status <> 'archived';

  if v_count >= 1 then
    raise exception 'PLAN_LIMIT: The Free plan includes 1 event. Upgrade to Pro for unlimited events.'
      using errcode = 'P0001';
  end if;

  return new;
end;
$$;

drop trigger if exists trg_enforce_free_event_limit on public.events;
create trigger trg_enforce_free_event_limit
  before insert on public.events
  for each row execute function public.enforce_free_event_limit();
