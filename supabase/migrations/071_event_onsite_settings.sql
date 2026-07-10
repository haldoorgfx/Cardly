-- ============================================================================
-- 071_event_onsite_settings.sql
--
-- On-site / door settings for an event, editable from the mobile organizer app
-- (Organizer → On-site settings). The Flutter screen calls two RPCs directly on
-- Supabase (the mobile app never goes through the Next.js /api routes), so we
-- expose SECURITY DEFINER functions that enforce authorization server-side —
-- mirroring the ownership pattern in 058_checkin_rpc.sql / 062_staff_attendee_list.sql.
--
--   get_event_onsite_settings(p_event_id uuid)              → jsonb   (owner OR active staff may READ)
--   save_event_onsite_settings(p_event_id uuid, p_settings) → jsonb   (event OWNER ONLY may WRITE; merge)
--
-- "Active staff" = the event owner (events.user_id) OR a user_event_roles row
-- (from 055) with role in ('staff','organizer') and status = 'active'.
--
-- Idempotent. Apply in the Supabase SQL editor. Does NOT touch applied migrations.
-- ============================================================================

-- 1. Column: a free-form jsonb blob of on-site settings, defaulting to {}.
alter table public.events
  add column if not exists onsite_settings jsonb not null default '{}'::jsonb;


-- 2. READ — owner OR active staff.
create or replace function public.get_event_onsite_settings(p_event_id uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_uid      uuid := auth.uid();
  v_owner    uuid;
  v_settings jsonb;
begin
  if v_uid is null then
    return jsonb_build_object();
  end if;

  select user_id, onsite_settings into v_owner, v_settings
    from public.events where id = p_event_id;
  if v_owner is null then
    return jsonb_build_object();
  end if;

  -- Owner, OR an active staff member for this event.
  if v_owner <> v_uid and not exists (
    select 1 from public.user_event_roles
    where event_id = p_event_id and user_id = v_uid
      and role in ('staff','organizer') and status = 'active'
  ) then
    return jsonb_build_object();  -- not authorised → empty object
  end if;

  return coalesce(v_settings, '{}'::jsonb);
end;
$$;


-- 3. WRITE — OWNER ONLY. Merge into the existing blob (don't clobber).
create or replace function public.save_event_onsite_settings(p_event_id uuid, p_settings jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid     uuid := auth.uid();
  v_owner   uuid;
  v_merged  jsonb;
begin
  if v_uid is null then
    return jsonb_build_object('error','Not signed in');
  end if;

  select user_id into v_owner from public.events where id = p_event_id;
  if v_owner is null then
    return jsonb_build_object('error','Event not found');
  end if;

  -- Only the event owner may write on-site settings; staff are read-only.
  if v_owner <> v_uid then
    return jsonb_build_object('error','Not authorised for this event');
  end if;

  -- Shallow-merge the incoming keys over the existing blob so partial saves
  -- don't wipe unrelated settings.
  update public.events
    set onsite_settings = coalesce(onsite_settings, '{}'::jsonb) || coalesce(p_settings, '{}'::jsonb)
    where id = p_event_id
    returning onsite_settings into v_merged;

  return coalesce(v_merged, '{}'::jsonb);
end;
$$;


grant execute on function public.get_event_onsite_settings(uuid)         to authenticated;
grant execute on function public.save_event_onsite_settings(uuid, jsonb) to authenticated;
