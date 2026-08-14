-- ============================================================================
-- 134_catering_rpc_platform_flag.sql
--
-- WHAT WAS WRONG
--   Both web (app/(app)/events/[id]/catering/page.tsx and
--   .../catering/accessibility/page.tsx) and mobile
--   (eventera_mobile/lib/screens/organizer/catering_screen.dart via
--   organizer_api.dart) gate access to catering ONLY at the page/screen level
--   with `isPlatformFeatureEnabled('catering')` before calling the RPCs. The
--   RPCs themselves — public.catering_counts(uuid) and
--   public.accessibility_summary(uuid), both defined in
--   supabase/082_dietary_accessibility.sql (not present under
--   supabase/migrations/ — see that repo-wide gap noted in prior migration
--   headers) — only ever checked public.can_manage_event(p_event_id), never
--   the platform flag. Calling supabase.rpc('catering_counts', ...) or
--   supabase.rpc('accessibility_summary', ...) directly from an authenticated
--   session (any owner/staff of the event, on either platform) bypassed the
--   page-level gate entirely — the super_admin's kill-switch for catering
--   could be flipped off and the data was still one client-side RPC call away.
--
-- FIX
--   1. Add a small SQL-side mirror of lib/features/platform.ts's
--      isPlatformFeatureEnabled(): public.is_platform_feature_enabled(text).
--      Reads the SAME feature_flags table, same "platform:<key>" row naming
--      (platformFlagName() in lib/features/platformFeatureMeta.ts), and
--      reproduces its "missing row defaults to enabled = true" behaviour
--      exactly — a kill-switch key with no row yet (migration not pasted in,
--      or a brand-new key) must never silently break a live feature. No SQL
--      helper for this existed anywhere in the repo before this migration
--      (checked lib/flags and every prior migration).
--   2. Recreate catering_counts(uuid) and accessibility_summary(uuid) with
--      their EXACT existing bodies from 082_dietary_accessibility.sql,
--      unchanged, plus one new early-exit check for platform:catering
--      immediately after the existing can_manage_event authorisation check.
--      Both still raise with errcode P0001 (same code the page-level catch
--      blocks in catering/page.tsx and catering/accessibility/page.tsx
--      already handle as a caught, non-500 error), just with a distinct
--      message so it's identifiable in logs.
--   3. Deliberately does NOT touch public.can_manage_event(uuid) — that
--      function's own definition has moved since 082 (Teams access work in
--      116/126/131) and this migration must not regress it. The two RPCs
--      below still just call public.can_manage_event(p_event_id) as-is.
--   4. catering-at-registration (the dietary/accessibility answer fields
--      captured on the registration form itself) folds into this SAME
--      platform:catering key — no separate key was added for it, per the
--      Part A scope of this round of work.
--
-- IDEMPOTENT: create or replace function. Safe to re-run.
-- HOW TO APPLY: paste this whole file into the Supabase SQL editor and Run.
-- Requires 082_dietary_accessibility.sql (catering_counts,
-- accessibility_summary, can_manage_event) and 122_platform_feature_flags.sql
-- (feature_flags 'platform:*' rows) to already be applied.
-- ============================================================================


-- ─────────────────────────────────────────────────────────────────────────────
-- 0. SQL-side mirror of isPlatformFeatureEnabled() — reusable by any future
--    RPC that needs the same platform-flag check without a round trip through
--    the Next.js API layer.
-- ─────────────────────────────────────────────────────────────────────────────
create or replace function public.is_platform_feature_enabled(p_key text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (select enabled from public.feature_flags where flag = 'platform:' || p_key),
    true
  );
$$;

revoke all on function public.is_platform_feature_enabled(text) from public;
grant execute on function public.is_platform_feature_enabled(text) to authenticated;


-- ─────────────────────────────────────────────────────────────────────────────
-- 1. catering_counts(p_event_id) — body unchanged from 082, + flag check.
-- ─────────────────────────────────────────────────────────────────────────────
create or replace function public.catering_counts(p_event_id uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_result jsonb;
begin
  if not public.can_manage_event(p_event_id) then
    raise exception 'NOT_AUTHORISED' using errcode = 'P0001';
  end if;

  if not public.is_platform_feature_enabled('catering') then
    raise exception 'FEATURE_DISABLED: Catering & dietary is currently unavailable.' using errcode = 'P0001';
  end if;

  -- A meal counts ONCE, and only if it still stands. A redemption row is LIVE when
  -- it is an actual redeem, was not later un-redeemed (065 writes an 'un_redeemed'
  -- row whose reverses_id points back at it), and did not lose an offline conflict
  -- (068 sets superseded_by on the losing row). Anything else would inflate the
  -- caterer's numbers.
  select jsonb_build_object('meals', coalesce(jsonb_agg(m order by m->>'entitlement_name'), '[]'::jsonb))
  into v_result
  from (
    select jsonb_build_object(
      'entitlement_id',   e.id,
      'entitlement_name', e.name,
      -- Servings, not people: a once_per_day meal over 3 days is 3 servings.
      'total_redeemed',   count(er.id),
      'dietary',          coalesce(
        (
          select jsonb_agg(jsonb_build_object('tag', d.tag, 'count', d.cnt) order by d.cnt desc)
          from (
            select tag, count(*) as cnt   -- servings carrying this tag
            from public.entitlement_redemptions er2
            join public.registrations r2 on r2.id = er2.registration_id
            cross join lateral unnest(coalesce(r2.dietary, array[]::text[])) as tag
            where er2.entitlement_id = e.id
              and er2.action = 'redeemed'
              and er2.status = 'redeemed'
              and er2.superseded_by is null
              and not exists (
                select 1 from public.entitlement_redemptions rev
                where rev.reverses_id = er2.id and rev.action = 'un_redeemed'
              )
            group by tag
          ) d
        ),
        '[]'::jsonb
      )
    ) as m
    from public.entitlements e
    left join public.entitlement_redemptions er
      on er.entitlement_id = e.id
     and er.action = 'redeemed'
     and er.status = 'redeemed'
     and er.superseded_by is null
     and not exists (
       select 1 from public.entitlement_redemptions rev
       where rev.reverses_id = er.id and rev.action = 'un_redeemed'
     )
    where e.event_id = p_event_id
      and e.type = 'meal'
    group by e.id, e.name
  ) meals;

  return coalesce(v_result, jsonb_build_object('meals', '[]'::jsonb));
end;
$$;

revoke all on function public.catering_counts(uuid) from public;
grant execute on function public.catering_counts(uuid) to authenticated;


-- ─────────────────────────────────────────────────────────────────────────────
-- 2. accessibility_summary(p_event_id) — body unchanged from 082, + flag check.
-- ─────────────────────────────────────────────────────────────────────────────
create or replace function public.accessibility_summary(p_event_id uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_by_tag    jsonb;
  v_attendees jsonb;
  v_total     int;
begin
  if not public.can_manage_event(p_event_id) then
    raise exception 'NOT_AUTHORISED' using errcode = 'P0001';
  end if;

  if not public.is_platform_feature_enabled('catering') then
    raise exception 'FEATURE_DISABLED: Catering & dietary is currently unavailable.' using errcode = 'P0001';
  end if;

  select count(*)
  into v_total
  from public.registrations r
  where r.event_id = p_event_id
    and r.status in ('confirmed','checked_in')
    and (
      (r.accessibility is not null and array_length(r.accessibility, 1) > 0)
      or coalesce(r.accessibility_note, '') <> ''
    );

  select coalesce(jsonb_agg(jsonb_build_object('tag', t.tag, 'count', t.cnt) order by t.cnt desc), '[]'::jsonb)
  into v_by_tag
  from (
    select tag, count(*) as cnt
    from public.registrations r
    cross join lateral unnest(coalesce(r.accessibility, array[]::text[])) as tag
    where r.event_id = p_event_id
      and r.status in ('confirmed','checked_in')
    group by tag
  ) t;

  select coalesce(jsonb_agg(jsonb_build_object(
    'registration_id', r.id,
    'name',            r.attendee_name,
    'email',           r.attendee_email,
    'phone',           r.attendee_phone,
    'accessibility',   coalesce(r.accessibility, array[]::text[]),
    'note',            r.accessibility_note
  ) order by r.attendee_name), '[]'::jsonb)
  into v_attendees
  from public.registrations r
  where r.event_id = p_event_id
    and r.status in ('confirmed','checked_in')
    and (
      (r.accessibility is not null and array_length(r.accessibility, 1) > 0)
      or coalesce(r.accessibility_note, '') <> ''
    );

  return jsonb_build_object(
    'total_with_needs', coalesce(v_total, 0),
    'by_tag',           v_by_tag,
    'attendees',        v_attendees
  );
end;
$$;

revoke all on function public.accessibility_summary(uuid) from public;
grant execute on function public.accessibility_summary(uuid) to authenticated;

-- ─────────────────────────────────────────────────────────────────────────────
-- Sanity check — run after applying, as an event owner, with platform:catering
-- set to false in feature_flags:
--
--   select catering_counts('<your-event-uuid>');
--   -> should now raise "FEATURE_DISABLED: ..." instead of returning data.
--
-- Flip platform:catering back to true and re-run — should return real data
-- again, unchanged from before this migration.
-- ─────────────────────────────────────────────────────────────────────────────
