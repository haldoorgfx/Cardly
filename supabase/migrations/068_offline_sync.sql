-- ============================================================================
-- 068_offline_sync.sql   (Group G2)
--
-- PURPOSE
--   Make entitlement redemptions safe to queue offline and replay on reconnect,
--   and give organizers a way to detect + resolve two-device conflicts.
--     • guarantee the offline columns exist on entitlement_redemptions
--     • idempotent replay: unique index on client_uuid (dedupes replayed scans)
--     • never hard-delete: a `superseded_by` pointer marks a losing/undone row
--     • list_sync_conflicts(p_event_id)  → conflicting pairs for O04
--     • resolve_conflict(...)            → server-authoritative resolution
--
-- CONFLICT DEFINITION
--   Two rows with the same (registration_id, entitlement_id,
--   coalesce(day_index,-1)) from DIFFERENT device_id, both source='offline'.
--
-- DEPENDS ON
--   • 065_entitlements  → entitlement_redemptions (authored in parallel; this
--     file only ADDS columns/indexes idempotently, safe even if 065 added them).
--   • 067 (this batch)  → can_manage_event() auth helper. Redefined here too so
--     the file is self-contained for paste-into-editor.
--   • 014_render_idempotency / 029_idempotency_key_text → idempotency-key pattern.
--
-- IDEMPOTENT: add column/index if not exists, create or replace function.
-- HOW TO APPLY: paste this whole file into the Supabase SQL editor and Run.
-- ============================================================================


-- ─────────────────────────────────────────────────────────────────────────────
-- 0. Auth helper (self-contained; identical to 067's definition).
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
-- 1. Offline columns on entitlement_redemptions (safe if 065 already added them).
--    • client_uuid — idempotency key generated on-device per scan (replay-safe)
--    • device_id   — which physical device recorded the scan
--    • scanned_at  — device clock (when the attendee was actually scanned)
--    • synced_at   — server clock (when the row reached the server)
--    • source      — 'online' | 'offline'
--    • superseded_by — ledger pointer; set when this row is undone/loses a
--                      conflict. NEVER hard-delete — write/point instead.
-- ─────────────────────────────────────────────────────────────────────────────
alter table public.entitlement_redemptions
  add column if not exists client_uuid   text,
  add column if not exists device_id      text,
  add column if not exists scanned_at      timestamptz,
  add column if not exists synced_at       timestamptz,
  add column if not exists source          text,
  add column if not exists superseded_by   uuid references public.entitlement_redemptions(id);


-- ─────────────────────────────────────────────────────────────────────────────
-- 2. Idempotent replay — one row per client_uuid. Replayed offline scans that
--    carry the same client_uuid are rejected (dedup) rather than double-counted.
-- ─────────────────────────────────────────────────────────────────────────────
create unique index if not exists entitlement_redemptions_client_uuid_uidx
  on public.entitlement_redemptions (client_uuid)
  where client_uuid is not null;

-- Helps list_sync_conflicts group same-slot rows quickly.
create index if not exists entitlement_redemptions_conflict_slot_idx
  on public.entitlement_redemptions (registration_id, entitlement_id, day_index);


-- ─────────────────────────────────────────────────────────────────────────────
-- 3. list_sync_conflicts(p_event_id)
--    Returns conflicting PAIRS: same slot, different device, both offline, and
--    neither already superseded. Owner/staff only. Powers O04.
--
--    Returns jsonb array of:
--      { registration_id, attendee_name, entitlement_id, entitlement_name,
--        day_index, rows: [ { redemption_id, device_id, scanned_at, synced_at,
--                             redeemed_by } ] }
-- ─────────────────────────────────────────────────────────────────────────────
create or replace function public.list_sync_conflicts(p_event_id uuid)
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

  select coalesce(jsonb_agg(c order by c->>'attendee_name'), '[]'::jsonb)
  into v_result
  from (
    select jsonb_build_object(
      'registration_id',  er.registration_id,
      'attendee_name',    r.attendee_name,
      'entitlement_id',   er.entitlement_id,
      'entitlement_name', e.name,
      'day_index',        er.day_index,
      'rows',             jsonb_agg(jsonb_build_object(
                            'redemption_id', er.id,
                            'device_id',     er.device_id,
                            'scanned_at',    er.scanned_at,
                            'synced_at',     er.synced_at,
                            -- 065 names this column `performed_by` (not redeemed_by).
                            'redeemed_by',   er.performed_by
                          ) order by er.scanned_at)
    ) as c
    from public.entitlement_redemptions er
    join public.entitlements  e on e.id = er.entitlement_id
    left join public.registrations r on r.id = er.registration_id
    where e.event_id = p_event_id
      and er.source = 'offline'
      and er.superseded_by is null
      and er.status = 'redeemed'
    group by er.registration_id, r.attendee_name, er.entitlement_id, e.name, er.day_index
    having count(distinct er.device_id) > 1
       and count(*) > 1
  ) c;

  return coalesce(v_result, '[]'::jsonb);
end;
$$;

revoke all on function public.list_sync_conflicts(uuid) from public;
grant execute on function public.list_sync_conflicts(uuid) to authenticated;


-- ─────────────────────────────────────────────────────────────────────────────
-- 4. resolve_conflict(...)
--    Server-authoritative resolution of a two-device conflict for one slot.
--    NEVER hard-deletes: losing rows are pointed at the winner via superseded_by
--    (an audit-preserving update), never removed.
--
--    Actions:
--      • keep_first — keep the earliest-scanned row; supersede the rest.
--      • keep_both  — legitimate double redemption (e.g. two meals); no-op,
--                     just acknowledges the pair. Returns kept = all rows.
--      • manual     — keep the caller-chosen row (p_keep_redemption_id);
--                     supersede the rest.
--
--    Returns jsonb: { resolved, action, kept_redemption_id, superseded_ids[] }
-- ─────────────────────────────────────────────────────────────────────────────
create or replace function public.resolve_conflict(
  p_registration_id  uuid,
  p_entitlement_id   uuid,
  p_day_index        int,
  p_action           text,
  p_keep_redemption_id uuid default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_event_id  uuid;
  v_keep_id   uuid;
  v_superseded uuid[];
begin
  if p_action not in ('keep_first','keep_both','manual') then
    raise exception 'INVALID_ACTION' using errcode = 'P0001';
  end if;

  -- Resolve the owning event from the entitlement, then authorise.
  select e.event_id into v_event_id
  from public.entitlements e
  where e.id = p_entitlement_id;

  if v_event_id is null then
    raise exception 'ENTITLEMENT_NOT_FOUND' using errcode = 'P0001';
  end if;

  if not public.can_manage_event(v_event_id) then
    raise exception 'NOT_AUTHORISED' using errcode = 'P0001';
  end if;

  -- keep_both: acknowledge, supersede nothing.
  if p_action = 'keep_both' then
    return jsonb_build_object(
      'resolved', true,
      'action', 'keep_both',
      'kept_redemption_id', null,
      'superseded_ids', '[]'::jsonb
    );
  end if;

  -- Determine the winner.
  if p_action = 'manual' then
    if p_keep_redemption_id is null then
      raise exception 'KEEP_ID_REQUIRED' using errcode = 'P0001';
    end if;
    v_keep_id := p_keep_redemption_id;
  else
    -- keep_first: earliest device scan wins (fallback to synced_at, then id).
    select er.id into v_keep_id
    from public.entitlement_redemptions er
    where er.registration_id = p_registration_id
      and er.entitlement_id  = p_entitlement_id
      and coalesce(er.day_index, -1) = coalesce(p_day_index, -1)
      and er.superseded_by is null
    order by er.scanned_at asc nulls last, er.synced_at asc nulls last, er.id asc
    limit 1;
  end if;

  if v_keep_id is null then
    raise exception 'NO_ROWS_TO_RESOLVE' using errcode = 'P0001';
  end if;

  -- Point every other live row in the slot at the winner (audit-preserving).
  update public.entitlement_redemptions er
    set superseded_by = v_keep_id
  where er.registration_id = p_registration_id
    and er.entitlement_id  = p_entitlement_id
    and coalesce(er.day_index, -1) = coalesce(p_day_index, -1)
    and er.id <> v_keep_id
    and er.superseded_by is null;

  -- Collect the ids we just superseded.
  select coalesce(array_agg(er.id), array[]::uuid[])
  into v_superseded
  from public.entitlement_redemptions er
  where er.registration_id = p_registration_id
    and er.entitlement_id  = p_entitlement_id
    and coalesce(er.day_index, -1) = coalesce(p_day_index, -1)
    and er.superseded_by = v_keep_id;

  return jsonb_build_object(
    'resolved', true,
    'action', p_action,
    'kept_redemption_id', v_keep_id,
    'superseded_ids', to_jsonb(v_superseded)
  );
end;
$$;

revoke all on function public.resolve_conflict(uuid, uuid, int, text, uuid) from public;
grant execute on function public.resolve_conflict(uuid, uuid, int, text, uuid) to authenticated;
