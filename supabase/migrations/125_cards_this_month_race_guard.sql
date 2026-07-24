-- ============================================================================
-- 125_cards_this_month_race_guard.sql
--
-- WHAT THIS FIXES
--   app/api/render/route.ts checks canGenerateCard() (reads profiles.
--   cards_this_month, compares against the plan limit in JS), then runs the
--   multi-second sharp render + storage upload, and only AFTERWARD calls
--   increment_cards_this_month() — a plain unconditional increment (004).
--   Two concurrent render requests near an organizer's monthly card cap both
--   read the same stale count, both pass, both render, and both increment —
--   the cap is "N plus however many requests land in the same window", the
--   same race class already closed for registration caps (121) and ticket
--   quantity (earlier sessions).
--
--   This function makes the check-and-increment one atomic step: a per-user
--   advisory lock serializes concurrent calls for the SAME organizer (unlike
--   other organizers' traffic, which is completely unaffected), then the
--   30-day rollover and the cap comparison happen inside that same lock, so
--   two concurrent callers can never both pass.
--
--   Called BEFORE the render work, not after — a render that fails for an
--   unrelated reason (a bad background fetch, a sharp error) after this
--   returns true still consumes one unit of quota. That is a deliberate,
--   disclosed tradeoff: closing the race requires the check and the
--   increment to be the same operation, and render failures downstream of it
--   are rare relative to the request volume this protects.
--
-- IDEMPOTENT: create or replace. Safe to re-run.
-- HOW TO APPLY: paste into the Supabase SQL editor and Run.
-- ============================================================================

create or replace function public.increment_cards_this_month_if_allowed(
  p_user_id uuid,
  p_limit   int
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_month_start timestamptz;
  v_count       int;
begin
  -- Serialize concurrent calls for the SAME organizer only.
  perform pg_advisory_xact_lock(hashtextextended(p_user_id::text || ':cards_this_month', 0));

  select cards_month_start, cards_this_month into v_month_start, v_count
    from public.profiles
   where id = p_user_id
   for update;

  if not found then
    return false;
  end if;

  -- Lazy monthly rollover — mirrors the JS version in lib/billing/can.ts.
  if v_month_start is null or v_month_start < now() - interval '30 days' then
    update public.profiles
       set cards_this_month = 1,
           cards_month_start = now()
     where id = p_user_id;
    return true;
  end if;

  if v_count >= p_limit then
    return false;
  end if;

  update public.profiles
     set cards_this_month = cards_this_month + 1
   where id = p_user_id;

  return true;
end;
$$;

revoke all on function public.increment_cards_this_month_if_allowed(uuid, int) from public, anon, authenticated;
grant execute on function public.increment_cards_this_month_if_allowed(uuid, int) to service_role;
