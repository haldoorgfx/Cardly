-- ============================================================================
-- 067_dietary_accessibility.sql   (Group G6)
--
-- PURPOSE
--   Make dietary + accessibility REAL registration-form field kinds (extends
--   041_form_field_types) instead of a bolt-on, store the answers on
--   `registrations`, and expose two owner/staff-only read RPCs:
--     • catering_counts(p_event_id)        → per meal-entitlement dietary counts
--     • accessibility_summary(p_event_id)  → counts + private per-attendee list
--
-- DEPENDS ON
--   • 017_event_registration  → registrations, registration_form_fields
--   • 041_form_field_types     → registration_form_fields_field_type_check
--   • 055_user_event_roles     → user_event_roles (staff auth), is_event_organizer
--   • 065_entitlements         → entitlements(type='meal'), entitlement_redemptions
--     (authored in parallel; referenced at CALL time via plpgsql, not at create)
--
-- IDEMPOTENT: drop+recreate constraint, add column if not exists,
--   create or replace function. Safe to re-run.
-- HOW TO APPLY: paste this whole file into the Supabase SQL editor and Run.
-- ============================================================================


-- ─────────────────────────────────────────────────────────────────────────────
-- 0. Shared auth helper — owner OR active event staff (mirrors 058/064 logic).
--    SECURITY DEFINER + pinned search_path so RLS policies never recurse.
-- ─────────────────────────────────────────────────────────────────────────────
create or replace function public.can_manage_event(p_event_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.events e
    where e.id = p_event_id and e.user_id = auth.uid()
  ) or exists (
    select 1 from public.user_event_roles r
    where r.event_id = p_event_id
      and r.user_id = auth.uid()
      and r.role in ('staff','organizer')
      and r.status = 'active'
  );
$$;

revoke all on function public.can_manage_event(uuid) from public;
grant execute on function public.can_manage_event(uuid) to authenticated;


-- ─────────────────────────────────────────────────────────────────────────────
-- 1. Extend the registration-form field kinds (from 041) with dietary +
--    accessibility. These render as calm multi-select groups on the reg form.
-- ─────────────────────────────────────────────────────────────────────────────
alter table public.registration_form_fields
  drop constraint if exists registration_form_fields_field_type_check;

alter table public.registration_form_fields
  add constraint registration_form_fields_field_type_check
  check (field_type in (
    'text', 'textarea', 'select', 'checkbox', 'radio', 'phone', 'url',
    'date', 'number', 'section',
    'dietary', 'accessibility'
  ));


-- ─────────────────────────────────────────────────────────────────────────────
-- 2. Store the answers on `registrations` (D02/D03/D04 read from here).
-- ─────────────────────────────────────────────────────────────────────────────
alter table public.registrations
  add column if not exists dietary            text[],
  add column if not exists dietary_note       text,
  add column if not exists accessibility      text[],
  add column if not exists accessibility_note text;


-- ─────────────────────────────────────────────────────────────────────────────
-- 3. catering_counts(p_event_id)
--    Per meal-entitlement dietary breakdown, powering D02 (catering summary).
--    Joins entitlement_redemptions (status='redeemed') for entitlements of
--    type='meal' to registrations.dietary. Owner/staff only.
--
--    Returns jsonb:
--      { meals: [ { entitlement_id, entitlement_name, total_redeemed,
--                   dietary: [ { tag, count } ] } ] }
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
-- 4. accessibility_summary(p_event_id)
--    Counts + a PRIVATE per-attendee list (owner/staff only) powering D03.
--    Respectful framing: a list of needs to prepare for, not "problems".
--
--    Returns jsonb:
--      { total_with_needs, by_tag: [ { tag, count } ],
--        attendees: [ { registration_id, name, email, phone,
--                       accessibility: [...], note } ] }
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
