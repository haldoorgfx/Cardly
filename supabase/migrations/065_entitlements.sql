-- ============================================================================
-- 065_entitlements.sql   (Group G1 — the ENTITLEMENTS ENGINE spine)
--
-- WHAT THIS DOES
--   Introduces the entitlements engine: attendees hold many independently
--   scannable entitlements (entry, meal, session, merch, transport, access,
--   parking, certificate), each with its own validity window + redemption
--   limit. Ships three tables and every server-authoritative RPC:
--
--     entitlements               — the entitlement definitions per event
--     ticket_type_entitlements   — which ticket tiers include which entitlements
--     entitlement_redemptions    — APPEND-ONLY LEDGER for EVERY entitlement
--                                  action (redeem / un-redeem / grant / revoke /
--                                  transfer / extend). Nothing is ever hard
--                                  deleted; an un-redeem or revoke writes a NEW
--                                  row. This one table powers E09 (redemption
--                                  dashboard) and G05 (audit log).
--
--   RPCs (all SECURITY DEFINER, search_path=public, owner-or-active-staff auth,
--   each appends a ledger row, all validation server-side):
--     redeem_entitlement, unredeem_entitlement, grant_entitlement,
--     revoke_entitlement, extend_validity, transfer_entitlement,
--     list_entitlement_audit (read).
--
-- DEPENDS ON (all already applied)
--   • 017_event_registration  → registrations, ticket_types, event_pages
--   • 031/044                  → ticket_types shape + variant link
--   • 035_registrations_user_id→ registrations.user_id (nullable)
--   • 054_fix_rls_recursion    → is_public_event() SECURITY DEFINER helper
--   • 055_user_event_roles     → user_event_roles (staff auth), is_event_organizer()
--
-- COMPATIBILITY NOTE
--   can_manage_event(uuid) is (re)defined here IDENTICALLY to 067's definition
--   so 065's RLS works before 067 runs, and 067's `create or replace` is a no-op
--   change. Do not diverge the two bodies.
--
-- IDEMPOTENT: create table if not exists / create or replace function /
--   add column if not exists / drop policy if exists + create policy.
--   Safe to re-run. HOW TO APPLY: paste this whole file into the Supabase SQL
--   editor and Run. Does NOT modify any already-applied migration.
-- ============================================================================


-- ─────────────────────────────────────────────────────────────────────────────
-- 0. SECURITY DEFINER auth helpers (avoid RLS recursion; mirror 054/055/058).
-- ─────────────────────────────────────────────────────────────────────────────

-- Owner OR active event staff. IDENTICAL to 067_dietary_accessibility.sql so the
-- two `create or replace` calls agree regardless of apply order.
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
-- anon is granted too: RLS policies below reference this helper and are evaluated
-- as the querying role (anon on public event pages). auth.uid() is null for anon
-- so the helper returns false — safe. 067's later revoke-from-public does not
-- touch this explicit anon grant.
grant execute on function public.can_manage_event(uuid) to anon, authenticated;

-- Does the CURRENT user hold a registration for this event (as account or email)?
-- Powers the attendee-read RLS path (E03 attendee entitlement view on mobile/anon).
create or replace function public.is_event_attendee(p_event_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.registrations r
    where r.event_id = p_event_id
      and (
        r.user_id = auth.uid()
        or lower(r.attendee_email) = lower((select email from public.profiles where id = auth.uid()))
      )
  );
$$;
revoke all on function public.is_event_attendee(uuid) from public;
grant execute on function public.is_event_attendee(uuid) to anon, authenticated;

-- Does the CURRENT user own this registration (account or matching email)?
-- Powers "attendees read their OWN redemptions".
create or replace function public.owns_registration(p_registration_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.registrations r
    where r.id = p_registration_id
      and (
        r.user_id = auth.uid()
        or lower(r.attendee_email) = lower((select email from public.profiles where id = auth.uid()))
      )
  );
$$;
revoke all on function public.owns_registration(uuid) from public;
grant execute on function public.owns_registration(uuid) to anon, authenticated;


-- ─────────────────────────────────────────────────────────────────────────────
-- 1. Tables
-- ─────────────────────────────────────────────────────────────────────────────

-- 1a. entitlements — the definitions.
create table if not exists public.entitlements (
  id              uuid primary key default gen_random_uuid(),
  event_id        uuid not null references public.events(id) on delete cascade,
  name            text not null,
  type            text not null
                    check (type in ('entry','meal','session','merch','transport','access','parking','certificate')),
  quantity        int,                              -- null = unlimited stock
  valid_from      timestamptz,
  valid_until     timestamptz,
  redemption_limit text not null default 'once'
                    check (redemption_limit in ('once','once_per_day','unlimited')),
  created_at      timestamptz not null default now()
);
create index if not exists entitlements_event_idx on public.entitlements(event_id);

-- 1b. ticket_type_entitlements — which ticket tiers include which entitlements.
create table if not exists public.ticket_type_entitlements (
  ticket_type_id uuid not null references public.ticket_types(id) on delete cascade,
  entitlement_id uuid not null references public.entitlements(id) on delete cascade,
  primary key (ticket_type_id, entitlement_id)
);
create index if not exists tte_entitlement_idx on public.ticket_type_entitlements(entitlement_id);
create index if not exists tte_ticket_type_idx on public.ticket_type_entitlements(ticket_type_id);

-- 1c. entitlement_redemptions — the APPEND-ONLY LEDGER for ALL actions.
--     NEVER hard-delete. An un-redeem / revoke / transfer inserts a NEW row.
--     registration_id is NULLABLE so entitlement-level actions (extend_validity)
--     can also be recorded here.
create table if not exists public.entitlement_redemptions (
  id              uuid primary key default gen_random_uuid(),
  entitlement_id  uuid not null references public.entitlements(id) on delete cascade,
  registration_id uuid references public.registrations(id) on delete cascade,
  event_id        uuid not null references public.events(id) on delete cascade,
  action          text not null default 'redeemed'
                    check (action in ('redeemed','un_redeemed','granted','revoked','transferred','extended')),
  status          text not null default 'ok'
                    check (status in ('redeemed','already','not_entitled','outside_window','ok')),
  reason          text,
  performed_by    uuid references public.profiles(id) on delete set null,
  device_id       text,
  client_uuid     text,                             -- offline idempotency key
  day_index       int,
  source          text not null default 'online'
                    check (source in ('online','offline')),
  reverses_id     uuid references public.entitlement_redemptions(id) on delete set null,
  scanned_at      timestamptz,                      -- device clock (offline)
  redeemed_at     timestamptz not null default now(),
  synced_at       timestamptz not null default now(),
  created_at      timestamptz not null default now()
);
create index if not exists er_event_idx        on public.entitlement_redemptions(event_id);
create index if not exists er_entitlement_idx   on public.entitlement_redemptions(entitlement_id);
create index if not exists er_registration_idx  on public.entitlement_redemptions(registration_id);
create index if not exists er_reg_ent_idx       on public.entitlement_redemptions(registration_id, entitlement_id);
create index if not exists er_time_idx          on public.entitlement_redemptions(event_id, redeemed_at desc);

-- Offline idempotency: a replayed offline scan carrying the same client_uuid can
-- never double-insert. (A partial-unique on (registration,entitlement,day) is
-- deliberately NOT used — it would break 'unlimited' entitlements.)
create unique index if not exists er_client_uuid_uidx
  on public.entitlement_redemptions(client_uuid) where client_uuid is not null;


-- ─────────────────────────────────────────────────────────────────────────────
-- 2. Internal helpers (NOT granted to clients — only callable from the
--    SECURITY DEFINER RPCs below, which run as the function owner).
-- ─────────────────────────────────────────────────────────────────────────────

-- Does this registration currently HOLD this entitlement?
--   held = (included by ticket type ? 1 : 0) + grants - revokes - transfers-away > 0
-- Ticket inclusion counts as a base +1 so a transfer-away or revoke can cancel it.
create or replace function public._entitlement_held(p_registration_id uuid, p_entitlement_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  with base as (
    select case when exists (
      select 1 from public.ticket_type_entitlements tte
      join public.registrations r on r.id = p_registration_id
      where tte.entitlement_id = p_entitlement_id
        and tte.ticket_type_id = r.ticket_type_id
    ) then 1 else 0 end as inc
  ),
  led as (
    select
      count(*) filter (where action = 'granted')     as g,
      count(*) filter (where action = 'revoked')      as rv,
      count(*) filter (where action = 'transferred')  as tr
    from public.entitlement_redemptions
    where registration_id = p_registration_id
      and entitlement_id  = p_entitlement_id
  )
  select (base.inc + led.g - led.rv - led.tr) > 0 from base, led;
$$;
revoke all on function public._entitlement_held(uuid, uuid) from public;

-- Build the full scan/action response for a registration + entitlement + status.
-- Returns { status, attendee:{name,ticket}, redemption_history:[...],
--           held_entitlements:[...], dietary:{dietary,dietary_note} }.
-- dietary is ALWAYS returned; the UI shows it only when entitlement.type='meal'.
-- Reads dietary defensively via to_jsonb() so it works whether 067 has added the
-- dedicated columns yet or the answers still live in custom_fields.
create or replace function public._entitlement_scan_result(
  p_registration_id uuid,
  p_entitlement_id  uuid,
  p_status          text
)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_reg          public.registrations%rowtype;
  v_reg_json     jsonb;
  v_ticket       text;
  v_history      jsonb;
  v_held         jsonb;
  v_dietary      jsonb;
  v_dietary_note text;
begin
  select * into v_reg from public.registrations where id = p_registration_id;
  if not found then
    return jsonb_build_object('status', p_status);
  end if;
  v_reg_json := to_jsonb(v_reg);

  select name into v_ticket from public.ticket_types where id = v_reg.ticket_type_id;

  -- Scan history for THIS entitlement on THIS registration (most recent first).
  select coalesce(jsonb_agg(jsonb_build_object(
           'id',           er.id,
           'action',       er.action,
           'status',       er.status,
           'day_index',    er.day_index,
           'redeemed_at',  er.redeemed_at,
           'performed_by', er.performed_by,
           'device_id',    er.device_id,
           'source',       er.source,
           'reason',       er.reason
         ) order by er.redeemed_at desc), '[]'::jsonb)
    into v_history
    from public.entitlement_redemptions er
    where er.registration_id = p_registration_id
      and er.entitlement_id  = p_entitlement_id;

  -- Everything this attendee currently holds (for E07 "what they DO hold").
  select coalesce(jsonb_agg(jsonb_build_object(
           'id',               e.id,
           'name',             e.name,
           'type',             e.type,
           'redemption_limit', e.redemption_limit,
           'valid_from',       e.valid_from,
           'valid_until',      e.valid_until
         ) order by e.type), '[]'::jsonb)
    into v_held
    from public.entitlements e
    where e.event_id = v_reg.event_id
      and public._entitlement_held(p_registration_id, e.id);

  -- Dietary — defensive: dedicated columns (067) or custom_fields fallback.
  v_dietary      := coalesce(
                      nullif(v_reg_json->'dietary', 'null'::jsonb),
                      nullif(v_reg.custom_fields->'dietary', 'null'::jsonb),
                      '[]'::jsonb);
  v_dietary_note := coalesce(v_reg_json->>'dietary_note', v_reg.custom_fields->>'dietary_note');

  return jsonb_build_object(
    'status',             p_status,
    'attendee',           jsonb_build_object('name', v_reg.attendee_name, 'ticket', v_ticket),
    'redemption_history', v_history,
    'held_entitlements',  v_held,
    'dietary',            jsonb_build_object('dietary', v_dietary, 'dietary_note', v_dietary_note)
  );
end;
$$;
revoke all on function public._entitlement_scan_result(uuid, uuid, text) from public;


-- ─────────────────────────────────────────────────────────────────────────────
-- 3. RPC: redeem_entitlement — the single source of truth for E05–E08.
-- ─────────────────────────────────────────────────────────────────────────────
create or replace function public.redeem_entitlement(
  p_entitlement_id  uuid,
  p_registration_id uuid,
  p_day_index       int         default null,
  p_client_uuid     text        default null,
  p_device_id       text        default null,
  p_source          text        default 'online',
  p_scanned_at      timestamptz default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid    uuid := auth.uid();
  v_ent    public.entitlements%rowtype;
  v_reg    public.registrations%rowtype;
  v_prior  public.entitlement_redemptions%rowtype;
  v_status text;
  v_active int;
  v_now    timestamptz := now();
  v_source text := coalesce(p_source, 'online');
begin
  if v_uid is null then
    return jsonb_build_object('status','error','message','Not signed in');
  end if;

  select * into v_ent from public.entitlements where id = p_entitlement_id;
  if not found then
    return jsonb_build_object('status','error','message','Entitlement not found');
  end if;

  if not public.can_manage_event(v_ent.event_id) then
    return jsonb_build_object('status','error','message','Not authorised for this event');
  end if;

  -- Idempotency: a replayed offline scan (same client_uuid) returns the prior
  -- result and does NOT insert again.
  if p_client_uuid is not null then
    select * into v_prior from public.entitlement_redemptions
      where client_uuid = p_client_uuid limit 1;
    if found then
      return public._entitlement_scan_result(v_prior.registration_id, v_ent.id, v_prior.status);
    end if;
  end if;

  select * into v_reg from public.registrations where id = p_registration_id;
  if not found then
    return jsonb_build_object('status','error','message','Registration not found');
  end if;

  -- ── Server-side validation ladder ──
  if v_reg.event_id <> v_ent.event_id then
    v_status := 'not_entitled';
  elsif not public._entitlement_held(v_reg.id, v_ent.id) then
    v_status := 'not_entitled';
  elsif (v_ent.valid_from  is not null and v_now < v_ent.valid_from)
     or (v_ent.valid_until is not null and v_now > v_ent.valid_until) then
    v_status := 'outside_window';
  else
    if v_ent.redemption_limit = 'unlimited' then
      v_status := 'redeemed';
    elsif v_ent.redemption_limit = 'once_per_day' then
      -- Active redemptions within the same day (by day_index if given, else date).
      select count(*) filter (where action = 'redeemed' and status = 'redeemed')
           - count(*) filter (where action = 'un_redeemed')
        into v_active
        from public.entitlement_redemptions er
        where er.registration_id = v_reg.id
          and er.entitlement_id  = v_ent.id
          and (
            (p_day_index is not null and er.day_index = p_day_index)
            or (p_day_index is null and date_trunc('day', er.redeemed_at) = date_trunc('day', v_now))
          );
      v_status := case when coalesce(v_active,0) > 0 then 'already' else 'redeemed' end;
    else  -- 'once'
      select count(*) filter (where action = 'redeemed' and status = 'redeemed')
           - count(*) filter (where action = 'un_redeemed')
        into v_active
        from public.entitlement_redemptions er
        where er.registration_id = v_reg.id
          and er.entitlement_id  = v_ent.id;
      v_status := case when coalesce(v_active,0) > 0 then 'already' else 'redeemed' end;
    end if;
  end if;

  -- Append the ledger row (records ALL attempts — success or not — for audit).
  begin
    insert into public.entitlement_redemptions(
      entitlement_id, registration_id, event_id, action, status,
      performed_by, device_id, client_uuid, day_index, source, scanned_at, redeemed_at, synced_at
    ) values (
      v_ent.id, v_reg.id, v_ent.event_id, 'redeemed', v_status,
      v_uid, p_device_id, p_client_uuid, p_day_index, v_source,
      coalesce(p_scanned_at, v_now), v_now, v_now
    );
  exception when unique_violation then
    -- Concurrent replay of the same client_uuid → return the prior result.
    select * into v_prior from public.entitlement_redemptions
      where client_uuid = p_client_uuid limit 1;
    if found then
      return public._entitlement_scan_result(v_prior.registration_id, v_ent.id, v_prior.status);
    end if;
    raise;
  end;

  return public._entitlement_scan_result(v_reg.id, v_ent.id, v_status);
end;
$$;
revoke all on function public.redeem_entitlement(uuid, uuid, int, text, text, text, timestamptz) from public;
grant execute on function public.redeem_entitlement(uuid, uuid, int, text, text, text, timestamptz) to authenticated;


-- ─────────────────────────────────────────────────────────────────────────────
-- 4. RPC: unredeem_entitlement — requires a reason; appends an 'un_redeemed' row
--    referencing the original redemption. Deliberate + audited (G03).
-- ─────────────────────────────────────────────────────────────────────────────
create or replace function public.unredeem_entitlement(
  p_redemption_id uuid,
  p_reason        text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid   uuid := auth.uid();
  v_orig  public.entitlement_redemptions%rowtype;
begin
  if v_uid is null then
    return jsonb_build_object('status','error','message','Not signed in');
  end if;
  if coalesce(btrim(p_reason), '') = '' then
    return jsonb_build_object('status','error','message','A reason is required to un-redeem');
  end if;

  select * into v_orig from public.entitlement_redemptions where id = p_redemption_id;
  if not found then
    return jsonb_build_object('status','error','message','Redemption not found');
  end if;
  if not public.can_manage_event(v_orig.event_id) then
    return jsonb_build_object('status','error','message','Not authorised for this event');
  end if;

  insert into public.entitlement_redemptions(
    entitlement_id, registration_id, event_id, action, status,
    reason, performed_by, day_index, reverses_id
  ) values (
    v_orig.entitlement_id, v_orig.registration_id, v_orig.event_id, 'un_redeemed', 'ok',
    p_reason, v_uid, v_orig.day_index, v_orig.id
  );

  return public._entitlement_scan_result(v_orig.registration_id, v_orig.entitlement_id, 'ok');
end;
$$;
revoke all on function public.unredeem_entitlement(uuid, text) from public;
grant execute on function public.unredeem_entitlement(uuid, text) to authenticated;


-- ─────────────────────────────────────────────────────────────────────────────
-- 5. RPC: grant_entitlement — give an attendee an entitlement they don't hold.
-- ─────────────────────────────────────────────────────────────────────────────
create or replace function public.grant_entitlement(
  p_entitlement_id  uuid,
  p_registration_id uuid
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_ent public.entitlements%rowtype;
  v_reg public.registrations%rowtype;
begin
  if v_uid is null then
    return jsonb_build_object('status','error','message','Not signed in');
  end if;

  select * into v_ent from public.entitlements where id = p_entitlement_id;
  if not found then
    return jsonb_build_object('status','error','message','Entitlement not found');
  end if;
  if not public.can_manage_event(v_ent.event_id) then
    return jsonb_build_object('status','error','message','Not authorised for this event');
  end if;

  select * into v_reg from public.registrations where id = p_registration_id;
  if not found or v_reg.event_id <> v_ent.event_id then
    return jsonb_build_object('status','error','message','Registration not found for this event');
  end if;

  insert into public.entitlement_redemptions(
    entitlement_id, registration_id, event_id, action, status, performed_by
  ) values (
    v_ent.id, v_reg.id, v_ent.event_id, 'granted', 'ok', v_uid
  );

  return public._entitlement_scan_result(v_reg.id, v_ent.id, 'ok');
end;
$$;
revoke all on function public.grant_entitlement(uuid, uuid) from public;
grant execute on function public.grant_entitlement(uuid, uuid) to authenticated;


-- ─────────────────────────────────────────────────────────────────────────────
-- 6. RPC: revoke_entitlement — take an entitlement away (optional reason).
-- ─────────────────────────────────────────────────────────────────────────────
create or replace function public.revoke_entitlement(
  p_entitlement_id  uuid,
  p_registration_id uuid,
  p_reason          text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_ent public.entitlements%rowtype;
  v_reg public.registrations%rowtype;
begin
  if v_uid is null then
    return jsonb_build_object('status','error','message','Not signed in');
  end if;

  select * into v_ent from public.entitlements where id = p_entitlement_id;
  if not found then
    return jsonb_build_object('status','error','message','Entitlement not found');
  end if;
  if not public.can_manage_event(v_ent.event_id) then
    return jsonb_build_object('status','error','message','Not authorised for this event');
  end if;

  select * into v_reg from public.registrations where id = p_registration_id;
  if not found or v_reg.event_id <> v_ent.event_id then
    return jsonb_build_object('status','error','message','Registration not found for this event');
  end if;

  insert into public.entitlement_redemptions(
    entitlement_id, registration_id, event_id, action, status, reason, performed_by
  ) values (
    v_ent.id, v_reg.id, v_ent.event_id, 'revoked', 'ok', p_reason, v_uid
  );

  return public._entitlement_scan_result(v_reg.id, v_ent.id, 'ok');
end;
$$;
revoke all on function public.revoke_entitlement(uuid, uuid, text) from public;
grant execute on function public.revoke_entitlement(uuid, uuid, text) to authenticated;


-- ─────────────────────────────────────────────────────────────────────────────
-- 7. RPC: extend_validity — push out an entitlement's valid_until, ledger row.
--    Ledger action = 'extended' (registration_id null = an entitlement-level
--    action). NOTE: 'extended' is intentionally part of the ledger's action
--    CHECK so this event can be recorded without misrepresenting it as a grant.
-- ─────────────────────────────────────────────────────────────────────────────
create or replace function public.extend_validity(
  p_entitlement_id uuid,
  p_valid_until    timestamptz
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_ent public.entitlements%rowtype;
begin
  if v_uid is null then
    return jsonb_build_object('status','error','message','Not signed in');
  end if;

  select * into v_ent from public.entitlements where id = p_entitlement_id;
  if not found then
    return jsonb_build_object('status','error','message','Entitlement not found');
  end if;
  if not public.can_manage_event(v_ent.event_id) then
    return jsonb_build_object('status','error','message','Not authorised for this event');
  end if;

  update public.entitlements
    set valid_until = p_valid_until
    where id = v_ent.id;

  insert into public.entitlement_redemptions(
    entitlement_id, registration_id, event_id, action, status, reason, performed_by
  ) values (
    v_ent.id, null, v_ent.event_id, 'extended', 'ok',
    'valid_until -> ' || coalesce(p_valid_until::text, 'null'), v_uid
  );

  return jsonb_build_object(
    'status',         'ok',
    'entitlement_id', v_ent.id,
    'valid_until',    p_valid_until
  );
end;
$$;
revoke all on function public.extend_validity(uuid, timestamptz) from public;
grant execute on function public.extend_validity(uuid, timestamptz) to authenticated;


-- ─────────────────────────────────────────────────────────────────────────────
-- 8. RPC: transfer_entitlement — move an entitlement between attendees (G04).
--    REFUSES if the entitlement has already been redeemed on the source
--    registration → returns { status: 'already_redeemed' }. On success writes a
--    'transferred' row on the source (removes the hold) and a 'granted' row on
--    the target (adds the hold).
-- ─────────────────────────────────────────────────────────────────────────────
create or replace function public.transfer_entitlement(
  p_entitlement_id   uuid,
  p_from_registration uuid,
  p_to_registration   uuid
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid    uuid := auth.uid();
  v_ent    public.entitlements%rowtype;
  v_from   public.registrations%rowtype;
  v_to     public.registrations%rowtype;
  v_active int;
begin
  if v_uid is null then
    return jsonb_build_object('status','error','message','Not signed in');
  end if;

  select * into v_ent from public.entitlements where id = p_entitlement_id;
  if not found then
    return jsonb_build_object('status','error','message','Entitlement not found');
  end if;
  if not public.can_manage_event(v_ent.event_id) then
    return jsonb_build_object('status','error','message','Not authorised for this event');
  end if;

  select * into v_from from public.registrations where id = p_from_registration;
  if not found or v_from.event_id <> v_ent.event_id then
    return jsonb_build_object('status','error','message','Source registration not found for this event');
  end if;
  select * into v_to from public.registrations where id = p_to_registration;
  if not found or v_to.event_id <> v_ent.event_id then
    return jsonb_build_object('status','error','message','Target registration not found for this event');
  end if;

  -- Refuse if already redeemed on the source (net active redemptions > 0).
  select count(*) filter (where action = 'redeemed' and status = 'redeemed')
       - count(*) filter (where action = 'un_redeemed')
    into v_active
    from public.entitlement_redemptions er
    where er.registration_id = v_from.id
      and er.entitlement_id  = v_ent.id;
  if coalesce(v_active,0) > 0 then
    return jsonb_build_object('status','already_redeemed');
  end if;

  -- Remove from source.
  insert into public.entitlement_redemptions(
    entitlement_id, registration_id, event_id, action, status, reason, performed_by
  ) values (
    v_ent.id, v_from.id, v_ent.event_id, 'transferred', 'ok',
    'transferred to ' || v_to.id::text, v_uid
  );
  -- Add to target.
  insert into public.entitlement_redemptions(
    entitlement_id, registration_id, event_id, action, status, reason, performed_by
  ) values (
    v_ent.id, v_to.id, v_ent.event_id, 'granted', 'ok',
    'transferred from ' || v_from.id::text, v_uid
  );

  return jsonb_build_object(
    'status',            'ok',
    'entitlement_id',    v_ent.id,
    'from_registration', v_from.id,
    'to_registration',   v_to.id,
    'to_attendee',       v_to.attendee_name
  );
end;
$$;
revoke all on function public.transfer_entitlement(uuid, uuid, uuid) from public;
grant execute on function public.transfer_entitlement(uuid, uuid, uuid) to authenticated;


-- ─────────────────────────────────────────────────────────────────────────────
-- 9. RPC: list_entitlement_audit — filterable read over the ledger (G05).
--    Owner/staff only. All filters optional. Newest first, capped at 1000 rows.
-- ─────────────────────────────────────────────────────────────────────────────
create or replace function public.list_entitlement_audit(
  p_event_id        uuid,
  p_registration_id uuid        default null,
  p_entitlement_id  uuid        default null,
  p_performed_by    uuid        default null,
  p_action          text        default null,
  p_status          text        default null,
  p_from            timestamptz default null,
  p_to              timestamptz default null,
  p_limit           int         default 200
)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_uid  uuid := auth.uid();
  v_rows jsonb;
begin
  if v_uid is null then
    return jsonb_build_object('error','Not signed in');
  end if;
  if not public.can_manage_event(p_event_id) then
    return jsonb_build_object('error','Not authorised for this event');
  end if;

  select coalesce(jsonb_agg(row_to_json(t)), '[]'::jsonb)
    into v_rows
    from (
      select
        er.id,
        er.redeemed_at,
        er.scanned_at,
        er.synced_at,
        er.action,
        er.status,
        er.day_index,
        er.source,
        er.device_id,
        er.reason,
        er.performed_by,
        er.registration_id,
        r.attendee_name,
        r.attendee_email,
        er.entitlement_id,
        e.name as entitlement_name,
        e.type as entitlement_type
      from public.entitlement_redemptions er
      left join public.registrations r on r.id = er.registration_id
      left join public.entitlements   e on e.id = er.entitlement_id
      where er.event_id = p_event_id
        and (p_registration_id is null or er.registration_id = p_registration_id)
        and (p_entitlement_id  is null or er.entitlement_id  = p_entitlement_id)
        and (p_performed_by    is null or er.performed_by    = p_performed_by)
        and (p_action          is null or er.action          = p_action)
        and (p_status          is null or er.status          = p_status)
        and (p_from            is null or er.redeemed_at     >= p_from)
        and (p_to              is null or er.redeemed_at     <= p_to)
      order by er.redeemed_at desc
      limit greatest(1, least(coalesce(p_limit, 200), 1000))
    ) t;

  return v_rows;
end;
$$;
revoke all on function public.list_entitlement_audit(uuid, uuid, uuid, uuid, text, text, timestamptz, timestamptz, int) from public;
grant execute on function public.list_entitlement_audit(uuid, uuid, uuid, uuid, text, text, timestamptz, timestamptz, int) to authenticated;


-- ─────────────────────────────────────────────────────────────────────────────
-- 10. Row-Level Security
--     Pattern: owner/active-staff manage; attendees read their own; public read
--     of definitions for public events (so previews show included entitlements).
-- ─────────────────────────────────────────────────────────────────────────────

-- entitlements
alter table public.entitlements enable row level security;

drop policy if exists "entitlements: manage" on public.entitlements;
create policy "entitlements: manage" on public.entitlements
  for all
  using (public.can_manage_event(event_id))
  with check (public.can_manage_event(event_id));

drop policy if exists "entitlements: read" on public.entitlements;
create policy "entitlements: read" on public.entitlements
  for select
  using (
    public.can_manage_event(event_id)
    or public.is_event_attendee(event_id)
    or public.is_public_event(event_id)
  );

-- ticket_type_entitlements (event derived via the joined entitlement)
alter table public.ticket_type_entitlements enable row level security;

drop policy if exists "tte: manage" on public.ticket_type_entitlements;
create policy "tte: manage" on public.ticket_type_entitlements
  for all
  using (
    exists (
      select 1 from public.entitlements e
      where e.id = entitlement_id and public.can_manage_event(e.event_id)
    )
  )
  with check (
    exists (
      select 1 from public.entitlements e
      where e.id = entitlement_id and public.can_manage_event(e.event_id)
    )
  );

drop policy if exists "tte: read" on public.ticket_type_entitlements;
create policy "tte: read" on public.ticket_type_entitlements
  for select
  using (
    exists (
      select 1 from public.entitlements e
      where e.id = entitlement_id
        and (
          public.can_manage_event(e.event_id)
          or public.is_event_attendee(e.event_id)
          or public.is_public_event(e.event_id)
        )
    )
  );

-- entitlement_redemptions (the ledger)
alter table public.entitlement_redemptions enable row level security;

drop policy if exists "redemptions: manage" on public.entitlement_redemptions;
create policy "redemptions: manage" on public.entitlement_redemptions
  for all
  using (public.can_manage_event(event_id))
  with check (public.can_manage_event(event_id));

drop policy if exists "redemptions: attendee reads own" on public.entitlement_redemptions;
create policy "redemptions: attendee reads own" on public.entitlement_redemptions
  for select
  using (registration_id is not null and public.owns_registration(registration_id));

-- NOTE: the service-role client (createAdminClient) bypasses RLS entirely; the
-- RPCs above run SECURITY DEFINER so writes never depend on the caller's RLS.
-- These policies guard the anon/authed (mobile + browser) direct-read paths.
