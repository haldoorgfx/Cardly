-- ============================================================================
-- 054_fix_rls_recursion.sql
--
-- FIX for a bug introduced by 053: the public_attendee_wall (registrations) and
-- public_profile_read (profiles) policies referenced each other's tables inside
-- their USING clauses. Postgres then evaluated registrations' RLS while checking
-- profiles' RLS and vice-versa → 42P17 "infinite recursion detected in policy".
-- Result: anon (mobile) SELECTs on registrations and profiles returned HTTP 500.
-- (Web is unaffected because it reads with the service-role client.)
--
-- FIX: move the membership checks into SECURITY DEFINER functions. A SECURITY
-- DEFINER function runs with the definer's rights and does NOT re-apply the
-- caller's RLS on the tables it reads, so the policy no longer recurses.
--
-- Idempotent. Paste into the Supabase SQL editor and Run. Safe to run after 053.
-- ============================================================================

-- Remove the recursive policies from 053.
drop policy if exists public_attendee_wall on public.registrations;
drop policy if exists public_profile_read  on public.profiles;

-- Helper: is this event public? (reads event_pages WITHOUT the caller's RLS)
create or replace function public.is_public_event(evt uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from event_pages ep
    where ep.event_id = evt and ep.is_public = true
  );
$$;

-- Helper: is this user a public identity — an organizer of a published event,
-- or a confirmed/checked-in attendee of a public event? (bypasses RLS)
create or replace function public.is_public_identity(uid uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from events e
    where e.user_id = uid and e.status = 'published'
  )
  or exists (
    select 1
    from registrations r
    join event_pages ep on ep.event_id = r.event_id
    where r.user_id = uid
      and r.status in ('confirmed','checked_in')
      and ep.is_public = true
  );
$$;

grant execute on function public.is_public_event(uuid)    to anon, authenticated;
grant execute on function public.is_public_identity(uuid) to anon, authenticated;

-- Recreate the two public-read policies using the SECURITY DEFINER helpers.
-- These are additive SELECT-only policies (RLS OR's them with existing ones).

do $$ begin
  if to_regclass('public.registrations') is not null then
    drop policy if exists public_attendee_wall on public.registrations;
    create policy public_attendee_wall on public.registrations
      for select
      using (
        status in ('confirmed','checked_in')
        and public.is_public_event(event_id)
      );
  end if;
end $$;

do $$ begin
  if to_regclass('public.profiles') is not null then
    drop policy if exists public_profile_read on public.profiles;
    create policy public_profile_read on public.profiles
      for select
      using ( public.is_public_identity(id) );
  end if;
end $$;
