-- ============================================================================
-- Eventera expansion features — migrations 080 through 092
-- Paste this ENTIRE file into the Supabase SQL editor and Run ONCE.
-- Order matters: 080 defines helper functions the rest depend on.
-- All statements are idempotent (safe to re-run).
-- Generated 2026-07-12 for branch integrate-expansion.
-- ============================================================================


-- ####################################################################
-- ## 080_entitlements.sql
-- ####################################################################
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


-- ####################################################################
-- ## 081_multi_day.sql
-- ####################################################################
-- ============================================================================
-- 066_multi_day.sql   (Group G5 — multi-day events)
--
-- WHAT THIS DOES
--   Adds per-day structure to a SINGLE event: each day can have its own
--   check-in toggle, capacity, and set of entitlements (M01). The scanner's
--   day selector (M02) and the attendance-by-day grid (M03) read from here, and
--   entitlement_redemptions.day_index (added in 065) ties a redemption to a day.
--
--     event_days             — one row per day of an event
--     event_day_entitlements — which entitlements apply on which day
--
-- 030_waitlist_series CHECK  (per the brief: extend a series concept if it
--   already models days)
--   030 defines `event_series` + links `event_pages.series_id`. That is a
--   grouping of SEPARATE events (a recurring/related-events SERIES sharing a
--   slug + organizer), NOT multiple days WITHIN one event. There is no existing
--   per-day concept anywhere in the schema, so `event_days` is a genuinely new
--   structure and does NOT duplicate `event_series`. (An event that belongs to a
--   series can still have its own multiple days — the two are orthogonal.)
--
-- DEPENDS ON
--   • 017_event_registration  → events
--   • 055_user_event_roles    → is_event_organizer() / can_manage_event()
--   • 065_entitlements        → entitlements, can_manage_event(), is_event_attendee(),
--                               is_public_event() (from 054)
--
-- IDEMPOTENT: create table if not exists / drop policy if exists + create policy.
--   Safe to re-run. HOW TO APPLY: paste this whole file into the Supabase SQL
--   editor and Run (after 065). Does NOT modify any already-applied migration.
-- ============================================================================


-- ─────────────────────────────────────────────────────────────────────────────
-- 1. event_days — per-day settings for a single event.
-- ─────────────────────────────────────────────────────────────────────────────
create table if not exists public.event_days (
  id              uuid primary key default gen_random_uuid(),
  event_id        uuid not null references public.events(id) on delete cascade,
  day_index       int  not null,
  date            date,
  checkin_enabled boolean not null default true,
  capacity        int,
  created_at      timestamptz not null default now(),
  unique (event_id, day_index)
);
create index if not exists event_days_event_idx on public.event_days(event_id, day_index);


-- ─────────────────────────────────────────────────────────────────────────────
-- 2. event_day_entitlements — which entitlements are valid on which day (M01).
-- ─────────────────────────────────────────────────────────────────────────────
create table if not exists public.event_day_entitlements (
  event_day_id   uuid not null references public.event_days(id) on delete cascade,
  entitlement_id uuid not null references public.entitlements(id) on delete cascade,
  primary key (event_day_id, entitlement_id)
);
create index if not exists ede_entitlement_idx on public.event_day_entitlements(entitlement_id);


-- ─────────────────────────────────────────────────────────────────────────────
-- 3. Row-Level Security — same pattern as 065:
--    owner/active-staff manage; attendees + public event pages may read.
-- ─────────────────────────────────────────────────────────────────────────────

-- event_days
alter table public.event_days enable row level security;

drop policy if exists "event_days: manage" on public.event_days;
create policy "event_days: manage" on public.event_days
  for all
  using (public.can_manage_event(event_id))
  with check (public.can_manage_event(event_id));

drop policy if exists "event_days: read" on public.event_days;
create policy "event_days: read" on public.event_days
  for select
  using (
    public.can_manage_event(event_id)
    or public.is_event_attendee(event_id)
    or public.is_public_event(event_id)
  );

-- event_day_entitlements (event derived via the joined day)
alter table public.event_day_entitlements enable row level security;

drop policy if exists "ede: manage" on public.event_day_entitlements;
create policy "ede: manage" on public.event_day_entitlements
  for all
  using (
    exists (
      select 1 from public.event_days d
      where d.id = event_day_id and public.can_manage_event(d.event_id)
    )
  )
  with check (
    exists (
      select 1 from public.event_days d
      where d.id = event_day_id and public.can_manage_event(d.event_id)
    )
  );

drop policy if exists "ede: read" on public.event_day_entitlements;
create policy "ede: read" on public.event_day_entitlements
  for select
  using (
    exists (
      select 1 from public.event_days d
      where d.id = event_day_id
        and (
          public.can_manage_event(d.event_id)
          or public.is_event_attendee(d.event_id)
          or public.is_public_event(d.event_id)
        )
    )
  );


-- ####################################################################
-- ## 082_dietary_accessibility.sql
-- ####################################################################
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


-- ####################################################################
-- ## 083_offline_sync.sql
-- ####################################################################
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


-- ####################################################################
-- ## 084_whatsapp.sql
-- ####################################################################
-- ============================================================================
-- 069_whatsapp.sql   (Group G3)
--
-- PURPOSE
--   WhatsApp Business notifications: connect a WABA, keep a template library,
--   build a per-event journey automation, and send/track broadcasts.
--     • register 'whatsapp' as a provider in 047_integrations (extend, no fork)
--     • whatsapp_connections   — connected WABA phone numbers (W01)
--     • message_templates      — template library w/ approval status (W01/W03)
--     • notification_automations — per-event journey steps + channels (W02)
--     • broadcasts             — announcement history (W04)
--
-- DEPENDS ON
--   • 047_integrations     → user_integrations.provider CHECK (extended here)
--   • 055_user_event_roles → user_event_roles (staff auth)
--   • 067 (this batch)     → can_manage_event() (redefined here, self-contained)
--
-- IDEMPOTENT: drop+recreate constraint, create table if not exists,
--   drop policy if exists + create policy, create or replace function.
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
-- 1. Register 'whatsapp' as a provider on the existing 047 integrations table
--    rather than inventing a parallel concept. The paste-credential config
--    (waba_id, phone_number_id, access token, etc.) lives in the shared jsonb.
-- ─────────────────────────────────────────────────────────────────────────────
alter table public.user_integrations
  drop constraint if exists user_integrations_provider_check;

alter table public.user_integrations
  add constraint user_integrations_provider_check
  check (provider in (
    'slack', 'zapier', 'google_sheets', 'mailchimp', 'hubspot', 'whatsapp'
  ));


-- ─────────────────────────────────────────────────────────────────────────────
-- 2. whatsapp_connections — a connected WhatsApp Business phone number.
--    event_id nullable so an org can connect once and reuse across events.
-- ─────────────────────────────────────────────────────────────────────────────
create table if not exists public.whatsapp_connections (
  id            uuid primary key default gen_random_uuid(),
  event_id      uuid references public.events(id) on delete cascade,
  owner_id      uuid not null references auth.users(id) on delete cascade,
  phone_number  text not null,
  waba_id       text,
  status        text not null default 'pending'
                  check (status in ('connected','pending','disconnected')),
  created_at    timestamptz not null default now()
);

create index if not exists whatsapp_connections_event_idx on public.whatsapp_connections(event_id);
create index if not exists whatsapp_connections_owner_idx on public.whatsapp_connections(owner_id);

alter table public.whatsapp_connections enable row level security;

drop policy if exists "wa_conn_manage" on public.whatsapp_connections;
create policy "wa_conn_manage" on public.whatsapp_connections
  for all
  using (owner_id = auth.uid() or (event_id is not null and public.can_manage_event(event_id)))
  with check (owner_id = auth.uid() or (event_id is not null and public.can_manage_event(event_id)));


-- ─────────────────────────────────────────────────────────────────────────────
-- 3. message_templates — WhatsApp template library (W01/W03).
--    event_id nullable → org-level templates reusable across events; owner_id
--    scopes those org-level rows when event_id is null.
-- ─────────────────────────────────────────────────────────────────────────────
create table if not exists public.message_templates (
  id               uuid primary key default gen_random_uuid(),
  event_id         uuid references public.events(id) on delete cascade,
  owner_id         uuid not null references auth.users(id) on delete cascade,
  name             text not null,
  category         text not null default 'utility'
                     check (category in ('utility','marketing','authentication')),
  approval_status  text not null default 'pending'
                     check (approval_status in ('approved','pending','rejected')),
  body             text,
  buttons          jsonb not null default '[]'::jsonb,
  created_at       timestamptz not null default now()
);

create index if not exists message_templates_event_idx on public.message_templates(event_id);
create index if not exists message_templates_owner_idx on public.message_templates(owner_id);

alter table public.message_templates enable row level security;

drop policy if exists "msg_tpl_manage" on public.message_templates;
create policy "msg_tpl_manage" on public.message_templates
  for all
  using (owner_id = auth.uid() or (event_id is not null and public.can_manage_event(event_id)))
  with check (owner_id = auth.uid() or (event_id is not null and public.can_manage_event(event_id)));


-- ─────────────────────────────────────────────────────────────────────────────
-- 4. notification_automations — per-event journey steps (W02).
--    One row per (event, step); channels toggles email/whatsapp/sms.
-- ─────────────────────────────────────────────────────────────────────────────
create table if not exists public.notification_automations (
  id          uuid primary key default gen_random_uuid(),
  event_id    uuid not null references public.events(id) on delete cascade,
  step        text not null
                check (step in ('registration','d7','d1','h1','during','post')),
  enabled     boolean not null default false,
  channels    jsonb not null default '{"email":true,"whatsapp":false,"sms":false}'::jsonb,
  created_at  timestamptz not null default now(),
  unique (event_id, step)
);

create index if not exists notification_automations_event_idx on public.notification_automations(event_id);

alter table public.notification_automations enable row level security;

drop policy if exists "notif_auto_manage" on public.notification_automations;
create policy "notif_auto_manage" on public.notification_automations
  for all
  using (public.can_manage_event(event_id))
  with check (public.can_manage_event(event_id));


-- ─────────────────────────────────────────────────────────────────────────────
-- 5. broadcasts — announcement send history (W04).
-- ─────────────────────────────────────────────────────────────────────────────
create table if not exists public.broadcasts (
  id          uuid primary key default gen_random_uuid(),
  event_id    uuid not null references public.events(id) on delete cascade,
  body        text not null,
  audience    jsonb not null default '{}'::jsonb,
  channels    jsonb not null default '{}'::jsonb,
  sent_count  int not null default 0,
  status      text not null default 'draft'
                check (status in ('draft','queued','sending','sent','failed')),
  created_by  uuid references auth.users(id) on delete set null,
  created_at  timestamptz not null default now()
);

create index if not exists broadcasts_event_idx on public.broadcasts(event_id);

alter table public.broadcasts enable row level security;

drop policy if exists "broadcasts_manage" on public.broadcasts;
create policy "broadcasts_manage" on public.broadcasts
  for all
  using (public.can_manage_event(event_id))
  with check (public.can_manage_event(event_id));


-- ####################################################################
-- ## 085_cash_reconciliation.sql
-- ####################################################################
-- ============================================================================
-- 070_cash_reconciliation.sql   (Group G4)
--
-- PURPOSE
--   Walk-in cash / door sales + per-staff and organizer reconciliation.
--     • add 'cash' to the payment-processor enum (event-level default method)
--     • record how a door registration was paid (payment_method on registrations)
--     • cash_shifts — an open→reconciled cash-handling session per staff (C02)
--     • link each cash registration to a shift (cash_shift_id)
--     • open_cash_shift / close_cash_shift / cash_reconciliation RPCs (C02/C03)
--
-- EXISTING SHAPE VERIFIED
--   • The payment-method CHECK lives on event_pages.payment_processor,
--     constraint `event_pages_payment_processor_check` — created in 017,
--     last set by 018_waafipay to ('stripe','flutterwave','waafipay','free').
--     045 added event_pages.payment_processors text[] (no CHECK). We extend the
--     single-value CHECK to add 'cash'.
--   • There is NO separate `orders` table — payment is recorded on
--     `registrations` (payment_status, amount_paid). So the shift link and the
--     per-registration method go on `registrations`.
--
-- DEPENDS ON
--   • 017_event_registration → registrations, event_pages.payment_processor
--   • 055_user_event_roles    → user_event_roles (staff auth)
--   • 067 (this batch)        → can_manage_event() (redefined here, self-contained)
--
-- IDEMPOTENT: drop+recreate constraint, add column/table if not exists,
--   create or replace function. HOW TO APPLY: paste into Supabase SQL editor + Run.
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
-- 1. Extend the payment-processor enum with 'cash' (event-level door-sales mode).
--    Matches 018's drop+recreate approach on the exact same constraint name.
-- ─────────────────────────────────────────────────────────────────────────────
alter table public.event_pages
  drop constraint if exists event_pages_payment_processor_check;

alter table public.event_pages
  add constraint event_pages_payment_processor_check
  check (payment_processor in ('stripe', 'flutterwave', 'waafipay', 'cash', 'free'));


-- ─────────────────────────────────────────────────────────────────────────────
-- 2. cash_shifts — a staff member's cash-handling session for one event.
--    Created before the registrations FK below.
-- ─────────────────────────────────────────────────────────────────────────────
create table if not exists public.cash_shifts (
  id             uuid primary key default gen_random_uuid(),
  event_id       uuid not null references public.events(id) on delete cascade,
  staff_user_id  uuid not null references auth.users(id) on delete cascade,
  started_at     timestamptz not null default now(),
  ended_at       timestamptz,
  status         text not null default 'open' check (status in ('open','reconciled')),
  reconciled_at  timestamptz,
  expected_total numeric(12,2),
  counted_total  numeric(12,2),
  created_at     timestamptz not null default now()
);

create index if not exists cash_shifts_event_idx on public.cash_shifts(event_id);
create index if not exists cash_shifts_staff_idx on public.cash_shifts(staff_user_id);
create index if not exists cash_shifts_open_idx on public.cash_shifts(event_id, staff_user_id) where status = 'open';

alter table public.cash_shifts enable row level security;

drop policy if exists "cash_shifts_manage" on public.cash_shifts;
create policy "cash_shifts_manage" on public.cash_shifts
  for all
  using (public.can_manage_event(event_id))
  with check (public.can_manage_event(event_id));


-- ─────────────────────────────────────────────────────────────────────────────
-- 3. Link cash registrations to a shift + record the door-sale method.
--    registrations is the payment-of-record table (no orders table exists).
--    payment_method is nullable — online registrations leave it null.
-- ─────────────────────────────────────────────────────────────────────────────
alter table public.registrations
  add column if not exists cash_shift_id  uuid references public.cash_shifts(id) on delete set null,
  add column if not exists payment_method text;

do $$ begin
  if not exists (
    select 1 from pg_constraint where conname = 'registrations_payment_method_check'
  ) then
    alter table public.registrations
      add constraint registrations_payment_method_check
      check (payment_method is null or payment_method in ('cash','mobile_money','card'));
  end if;
end $$;

create index if not exists registrations_cash_shift_idx
  on public.registrations(cash_shift_id) where cash_shift_id is not null;


-- ─────────────────────────────────────────────────────────────────────────────
-- 4. open_cash_shift(p_event_id)
--    Returns the caller's existing OPEN shift for this event, or opens a new one.
--    Owner/staff only. Returns jsonb of the shift row.
-- ─────────────────────────────────────────────────────────────────────────────
create or replace function public.open_cash_shift(p_event_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid   uuid := auth.uid();
  v_shift public.cash_shifts%rowtype;
begin
  if v_uid is null then
    raise exception 'NOT_SIGNED_IN' using errcode = 'P0001';
  end if;
  if not public.can_manage_event(p_event_id) then
    raise exception 'NOT_AUTHORISED' using errcode = 'P0001';
  end if;

  select * into v_shift
  from public.cash_shifts
  where event_id = p_event_id and staff_user_id = v_uid and status = 'open'
  order by started_at desc
  limit 1;

  if not found then
    insert into public.cash_shifts (event_id, staff_user_id)
    values (p_event_id, v_uid)
    returning * into v_shift;
  end if;

  return to_jsonb(v_shift);
end;
$$;

revoke all on function public.open_cash_shift(uuid) from public;
grant execute on function public.open_cash_shift(uuid) to authenticated;


-- ─────────────────────────────────────────────────────────────────────────────
-- 5. close_cash_shift(p_shift_id, p_counted_total)
--    Marks the shift reconciled, stamps counted_total, and computes
--    expected_total = SUM(amount_paid) of the cash registrations on the shift.
--    Owner/staff of the shift's event only. Returns jsonb of the closed shift.
-- ─────────────────────────────────────────────────────────────────────────────
create or replace function public.close_cash_shift(p_shift_id uuid, p_counted_total numeric)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_event_id uuid;
  v_expected numeric(12,2);
  v_shift    public.cash_shifts%rowtype;
begin
  select event_id into v_event_id from public.cash_shifts where id = p_shift_id;
  if v_event_id is null then
    raise exception 'SHIFT_NOT_FOUND' using errcode = 'P0001';
  end if;
  if not public.can_manage_event(v_event_id) then
    raise exception 'NOT_AUTHORISED' using errcode = 'P0001';
  end if;

  select coalesce(sum(amount_paid), 0)
  into v_expected
  from public.registrations
  where cash_shift_id = p_shift_id;

  update public.cash_shifts
    set status         = 'reconciled',
        reconciled_at  = now(),
        ended_at       = coalesce(ended_at, now()),
        counted_total  = p_counted_total,
        expected_total = v_expected
    where id = p_shift_id
    returning * into v_shift;

  return to_jsonb(v_shift);
end;
$$;

revoke all on function public.close_cash_shift(uuid, numeric) from public;
grant execute on function public.close_cash_shift(uuid, numeric) to authenticated;


-- ─────────────────────────────────────────────────────────────────────────────
-- 6. cash_reconciliation(p_event_id)
--    Per-staff cash totals + grand total (C03 organizer overview). Owner/staff.
--
--    Returns jsonb:
--      { grand_total, staff: [ { staff_user_id, staff_name, transactions,
--          collected, open_shifts, reconciled_shifts, counted_total } ] }
-- ─────────────────────────────────────────────────────────────────────────────
create or replace function public.cash_reconciliation(p_event_id uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_staff jsonb;
  v_grand numeric(12,2);
begin
  if not public.can_manage_event(p_event_id) then
    raise exception 'NOT_AUTHORISED' using errcode = 'P0001';
  end if;

  select coalesce(sum(amount_paid), 0)
  into v_grand
  from public.registrations r
  join public.cash_shifts s on s.id = r.cash_shift_id
  where s.event_id = p_event_id;

  -- Aggregate at the shift level first (per-shift registration totals via a
  -- lateral), then roll up per staff so counted_total is counted once per shift.
  -- NOTE: `row` and `rows` are reserved words in Postgres — aliasing with them
  -- makes this parse as a ROW constructor / FETCH clause. Use plain names.
  select coalesce(jsonb_agg(sr.staff_row order by sr.staff_row->>'staff_name'), '[]'::jsonb)
  into v_staff
  from (
    select jsonb_build_object(
      'staff_user_id',      s.staff_user_id,
      'staff_name',         coalesce(p.full_name, 'Staff'),
      'transactions',       coalesce(sum(rt.txn), 0),
      'collected',          coalesce(sum(rt.collected), 0),
      'open_shifts',        count(*) filter (where s.status = 'open'),
      'reconciled_shifts',  count(*) filter (where s.status = 'reconciled'),
      'counted_total',      coalesce(sum(s.counted_total) filter (where s.status = 'reconciled'), 0)
    ) as staff_row
    from public.cash_shifts s
    left join lateral (
      select count(*) as txn, coalesce(sum(r.amount_paid), 0) as collected
      from public.registrations r
      where r.cash_shift_id = s.id
    ) rt on true
    left join public.profiles p on p.id = s.staff_user_id
    where s.event_id = p_event_id
    group by s.staff_user_id, p.full_name
  ) sr;

  return jsonb_build_object(
    'grand_total', coalesce(v_grand, 0),
    'staff',       v_staff
  );
end;
$$;

revoke all on function public.cash_reconciliation(uuid) from public;
grant execute on function public.cash_reconciliation(uuid) to authenticated;


-- ####################################################################
-- ## 086_event_onsite_settings.sql
-- ####################################################################
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


-- ####################################################################
-- ## 087_announcements.sql
-- ####################################################################
-- ============================================================================
-- 072_announcements.sql
--
-- Event announcements sent by the organizer from the mobile app
-- (Organizer → Announcements). The Flutter screen records each broadcast and
-- lists the history via two SECURITY DEFINER RPCs (the mobile app talks to
-- Supabase directly, so authorization is enforced server-side — same ownership
-- pattern as 058_checkin_rpc.sql / 062_staff_attendee_list.sql).
--
--   record_announcement(p_event_id, p_title, p_body, p_sent_count) → jsonb  (owner ONLY; returns inserted row)
--   list_event_announcements(p_event_id)                           → rows   (owner OR active staff; newest first)
--
-- "Active staff" = the event owner (events.user_id) OR a user_event_roles row
-- (from 055) with role in ('staff','organizer') and status = 'active'.
--
-- Idempotent. Apply in the Supabase SQL editor. Does NOT touch applied migrations.
-- ============================================================================

-- 1. Table.
create table if not exists public.announcements (
  id          uuid primary key default gen_random_uuid(),
  event_id    uuid not null references public.events(id) on delete cascade,
  title       text,
  body        text not null,
  audience    text default 'everyone',
  sent_count  int  default 0,
  created_by  uuid,
  created_at  timestamptz default now()
);

create index if not exists announcements_event_idx on public.announcements(event_id, created_at desc);

-- 1b. Compatibility with any earlier `announcements` table shape.
--     An older revision of this feature used `subject` instead of `title`. If that
--     column is present, relax it and backfill so the RPC below can insert cleanly.
alter table public.announcements add column if not exists title      text;
alter table public.announcements add column if not exists body       text;
alter table public.announcements add column if not exists audience   text default 'everyone';
alter table public.announcements add column if not exists sent_count int  default 0;
alter table public.announcements add column if not exists created_by uuid;
alter table public.announcements add column if not exists created_at timestamptz default now();

do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'announcements' and column_name = 'subject'
  ) then
    execute 'alter table public.announcements alter column subject drop not null';
    execute 'update public.announcements set title = subject where title is null';
  end if;
end $$;


-- 2. RLS: owner OR active staff may READ; owner may WRITE.
alter table public.announcements enable row level security;

-- (a) Owner / active staff read.
drop policy if exists "announcements: owner or staff read" on public.announcements;
create policy "announcements: owner or staff read" on public.announcements
  for select using (
    exists (select 1 from public.events e where e.id = event_id and e.user_id = auth.uid())
    or exists (
      select 1 from public.user_event_roles
      where event_id = announcements.event_id and user_id = auth.uid()
        and role in ('staff','organizer') and status = 'active'
    )
  );

-- (b) Owner writes (insert/update/delete). RPCs run SECURITY DEFINER, but these
--     policies keep any direct authed writes owner-scoped.
drop policy if exists "announcements: owner insert" on public.announcements;
create policy "announcements: owner insert" on public.announcements
  for insert with check (
    exists (select 1 from public.events e where e.id = event_id and e.user_id = auth.uid())
  );

drop policy if exists "announcements: owner update" on public.announcements;
create policy "announcements: owner update" on public.announcements
  for update using (
    exists (select 1 from public.events e where e.id = event_id and e.user_id = auth.uid())
  );

drop policy if exists "announcements: owner delete" on public.announcements;
create policy "announcements: owner delete" on public.announcements
  for delete using (
    exists (select 1 from public.events e where e.id = event_id and e.user_id = auth.uid())
  );


-- 2b. Drop ANY pre-existing version of these functions, whatever the signature.
--     `create or replace` cannot rename an input parameter (42P13) or change a
--     return type (42P16), so an older revision must be removed outright.
do $$
declare r record;
begin
  for r in
    select p.oid::regprocedure as sig
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public'
      and p.proname in ('record_announcement', 'list_event_announcements')
  loop
    execute format('drop function if exists %s cascade', r.sig);
  end loop;
end $$;


-- 3. record_announcement — OWNER ONLY. Inserts and returns the row as jsonb.
create or replace function public.record_announcement(
  p_event_id   uuid,
  p_title      text,
  p_body       text,
  p_sent_count int
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid   uuid := auth.uid();
  v_owner uuid;
  v_row   public.announcements%rowtype;
begin
  if v_uid is null then
    return jsonb_build_object('error','Not signed in');
  end if;

  select user_id into v_owner from public.events where id = p_event_id;
  if v_owner is null then
    return jsonb_build_object('error','Event not found');
  end if;

  -- Only the event owner may broadcast announcements.
  if v_owner <> v_uid then
    return jsonb_build_object('error','Not authorised for this event');
  end if;

  insert into public.announcements (event_id, title, body, sent_count, created_by)
  values (p_event_id, p_title, p_body, coalesce(p_sent_count, 0), v_uid)
  returning * into v_row;

  return jsonb_build_object(
    'id',          v_row.id,
    'event_id',    v_row.event_id,
    'title',       v_row.title,
    'body',        v_row.body,
    'audience',    v_row.audience,
    'sent_count',  v_row.sent_count,
    'created_by',  v_row.created_by,
    'created_at',  v_row.created_at
  );
end;
$$;


-- 4. list_event_announcements — owner OR active staff. Newest first.
create or replace function public.list_event_announcements(p_event_id uuid)
returns table (
  id          uuid,
  event_id    uuid,
  title       text,
  body        text,
  audience    text,
  sent_count  int,
  created_by  uuid,
  created_at  timestamptz
)
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_uid   uuid := auth.uid();
  v_owner uuid;
begin
  if v_uid is null then return; end if;
  select user_id into v_owner from public.events where id = p_event_id;
  if v_owner is null then return; end if;

  -- Owner, OR an active staff member for this event.
  if v_owner <> v_uid and not exists (
    select 1 from public.user_event_roles
    where event_id = p_event_id and user_id = v_uid
      and role in ('staff','organizer') and status = 'active'
  ) then
    return;  -- not authorised → empty set
  end if;

  return query
    select a.id, a.event_id, a.title, a.body, a.audience,
           a.sent_count, a.created_by, a.created_at
    from public.announcements a
    where a.event_id = p_event_id
    order by a.created_at desc;
end;
$$;


grant execute on function public.record_announcement(uuid, text, text, int) to authenticated;
grant execute on function public.list_event_announcements(uuid)             to authenticated;


-- ####################################################################
-- ## 088_session_checkins.sql
-- ####################################################################
-- ============================================================================
-- 073_session_checkins.sql
--
-- Per-session (agenda-session) check-in for the mobile organizer app
-- (Organizer → Session check-in / scanner). Where 058_checkin_rpc.sql checks an
-- attendee into the EVENT, this records that a registration attended a specific
-- SESSION (talk/workshop). Same ownership + token-resolution pattern as 058:
-- SECURITY DEFINER enforces "event owner OR active staff" server-side.
--
--   checkin_session_by_token(p_event_id, p_session_id, p_qr_token) → jsonb
--       { status, attendee_name, ticket, checked_in_at, message }
--       status ∈ 'ok' | 'already' | 'invalid' | 'error'
--       Resolves the registration by qr_code_token (mirrors 058), records a
--       session check-in (idempotent → 'already' on duplicate), AND performs the
--       normal event check-in if the attendee isn't already checked in.
--   session_checkin_count(p_session_id) → int   (owner OR active staff; else 0)
--
-- "Active staff" = the event owner (events.user_id) OR a user_event_roles row
-- (from 055) with role in ('staff','organizer') and status = 'active'.
--
-- Idempotent. Apply in the Supabase SQL editor. Does NOT touch applied migrations.
-- ============================================================================

-- 1. Table.
create table if not exists public.session_checkins (
  id               uuid primary key default gen_random_uuid(),
  session_id       uuid not null references public.sessions(id)       on delete cascade,
  event_id         uuid not null references public.events(id)         on delete cascade,
  registration_id  uuid not null references public.registrations(id)  on delete cascade,
  checked_in_at    timestamptz default now(),
  checked_in_by    uuid,
  unique (session_id, registration_id)
);

create index if not exists session_checkins_session_idx on public.session_checkins(session_id);
create index if not exists session_checkins_event_idx   on public.session_checkins(event_id);


-- 2. RLS: owner OR active staff read; owner writes (RPCs run SECURITY DEFINER).
alter table public.session_checkins enable row level security;

drop policy if exists "session_checkins: owner or staff read" on public.session_checkins;
create policy "session_checkins: owner or staff read" on public.session_checkins
  for select using (
    exists (select 1 from public.events e where e.id = event_id and e.user_id = auth.uid())
    or exists (
      select 1 from public.user_event_roles
      where event_id = session_checkins.event_id and user_id = auth.uid()
        and role in ('staff','organizer') and status = 'active'
    )
  );

drop policy if exists "session_checkins: owner or staff write" on public.session_checkins;
create policy "session_checkins: owner or staff write" on public.session_checkins
  for insert with check (
    exists (select 1 from public.events e where e.id = event_id and e.user_id = auth.uid())
    or exists (
      select 1 from public.user_event_roles
      where event_id = session_checkins.event_id and user_id = auth.uid()
        and role in ('staff','organizer') and status = 'active'
    )
  );


-- 2b. Drop ANY pre-existing version of these functions, whatever the signature.
--     `create or replace` cannot rename an input parameter (42P13) or change a
--     return type (42P16), so an older revision must be removed outright.
do $$
declare r record;
begin
  for r in
    select p.oid::regprocedure as sig
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public'
      and p.proname in ('checkin_session_by_token', 'session_checkin_count')
  loop
    execute format('drop function if exists %s cascade', r.sig);
  end loop;
end $$;


-- 3. checkin_session_by_token — resolve by QR token, record session check-in,
--    and roll up into the normal event check-in. Mirrors 058_checkin_rpc.sql.
create or replace function public.checkin_session_by_token(
  p_event_id   uuid,
  p_session_id uuid,
  p_qr_token   text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid       uuid := auth.uid();
  v_owner     uuid;
  v_sess_evt  uuid;
  v_reg       registrations%rowtype;
  v_ticket    text;
  v_existing  timestamptz;
  v_now       timestamptz := now();
begin
  if v_uid is null then
    return jsonb_build_object('status','error','message','Not signed in');
  end if;

  -- Ownership: caller must own the event OR be assigned active event staff.
  select user_id into v_owner from public.events where id = p_event_id;
  if v_owner is null then
    return jsonb_build_object('status','error','message','Event not found');
  end if;
  if v_owner <> v_uid and not exists (
    select 1 from public.user_event_roles
    where event_id = p_event_id and user_id = v_uid
      and role in ('staff','organizer') and status = 'active'
  ) then
    return jsonb_build_object('status','error','message','Not authorised for this event');
  end if;

  -- The session must belong to this event.
  select event_id into v_sess_evt from public.sessions where id = p_session_id;
  if v_sess_evt is null or v_sess_evt <> p_event_id then
    return jsonb_build_object('status','invalid','message','Session not found for this event');
  end if;

  -- Resolve the registration by token within this event (same as 058).
  select * into v_reg from public.registrations
    where qr_code_token = p_qr_token and event_id = p_event_id;
  if not found then
    return jsonb_build_object('status','invalid',
      'message','QR not recognised — no registration for this event');
  end if;

  select name into v_ticket from public.ticket_types where id = v_reg.ticket_type_id;

  -- Block entry for cancelled/refunded or unpaid registrations (same as 058).
  if v_reg.status in ('cancelled','refunded') then
    return jsonb_build_object('status','invalid',
      'attendee_name', v_reg.attendee_name, 'ticket', v_ticket,
      'message','Registration is '|| v_reg.status ||' — entry not allowed');
  end if;
  if v_reg.payment_status in ('pending','failed') and coalesce(v_reg.amount_paid,0) > 0 then
    return jsonb_build_object('status','invalid',
      'attendee_name', v_reg.attendee_name, 'ticket', v_ticket,
      'message','Payment not completed — entry not allowed');
  end if;

  -- Roll up into the normal EVENT check-in if not already checked in.
  if v_reg.status <> 'checked_in' then
    update public.registrations
      set status = 'checked_in', checked_in_at = v_now, checked_in_by = v_uid
      where id = v_reg.id;
  end if;

  -- Has this registration already been checked into THIS session?
  select checked_in_at into v_existing
    from public.session_checkins
    where session_id = p_session_id and registration_id = v_reg.id;

  if v_existing is not null then
    return jsonb_build_object('status','already',
      'attendee_name', v_reg.attendee_name, 'ticket', v_ticket,
      'checked_in_at', v_existing, 'message','Already checked into this session');
  end if;

  -- Record the session check-in (idempotent guard on the unique constraint).
  insert into public.session_checkins (session_id, event_id, registration_id, checked_in_at, checked_in_by)
  values (p_session_id, p_event_id, v_reg.id, v_now, v_uid)
  on conflict (session_id, registration_id) do nothing;

  return jsonb_build_object('status','ok',
    'attendee_name', v_reg.attendee_name, 'ticket', v_ticket,
    'checked_in_at', v_now, 'message','Checked into session');
end;
$$;


-- 4. session_checkin_count — how many attendees checked into a session.
create or replace function public.session_checkin_count(p_session_id uuid)
returns int
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_uid     uuid := auth.uid();
  v_event   uuid;
  v_owner   uuid;
  v_count   int;
begin
  if v_uid is null then return 0; end if;

  select event_id into v_event from public.sessions where id = p_session_id;
  if v_event is null then return 0; end if;

  select user_id into v_owner from public.events where id = v_event;
  if v_owner is null then return 0; end if;

  -- Owner, OR an active staff member for this event.
  if v_owner <> v_uid and not exists (
    select 1 from public.user_event_roles
    where event_id = v_event and user_id = v_uid
      and role in ('staff','organizer') and status = 'active'
  ) then
    return 0;  -- not authorised → 0
  end if;

  select count(*)::int into v_count
    from public.session_checkins
    where session_id = p_session_id;

  return coalesce(v_count, 0);
end;
$$;


grant execute on function public.checkin_session_by_token(uuid, uuid, text) to authenticated;
grant execute on function public.session_checkin_count(uuid)                to authenticated;


-- ####################################################################
-- ## 089_entitlement_redemptions_realtime.sql
-- ####################################################################
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


-- ####################################################################
-- ## 090_walkin_registration_rpc.sql
-- ####################################################################
-- ============================================================================
-- 075_walkin_registration_rpc.sql   (Group G4 — hardening)
--
-- WHY THIS EXISTS
--   The mobile door-sales screen (C01) needs to create a PAID, CHECKED-IN
--   registration. Doing that with a direct client insert is unsafe: the
--   `registrations` insert policy is `with check (true)` (it must be, so the
--   public can register), which means any holder of the anon key could insert a
--   row with payment_status='paid' and amount_paid of their choosing.
--
--   This RPC moves the whole door sale server-side:
--     • authorises the caller with can_manage_event() (owner or active staff)
--     • reads the price from ticket_types — the client NEVER supplies it
--     • opens (or reuses) the caller's cash shift for cash sales
--     • inserts the registration as paid, links the shift, records the method
--     • checks the attendee in
--     • is IDEMPOTENT on p_client_uuid, so a double-tapped Confirm or a retried
--       request after a lost response can never take money twice
--
-- DEPENDS ON
--   • 017_event_registration  → registrations, ticket_types
--   • 055_user_event_roles    → user_event_roles (staff auth)
--   • 070_cash_reconciliation → cash_shifts, registrations.cash_shift_id,
--                               registrations.payment_method, open_cash_shift
--
-- IDEMPOTENT: add column/index if not exists, create or replace function.
--   Safe to re-run. Apply in the Supabase SQL editor AFTER 070.
-- ============================================================================


-- ─────────────────────────────────────────────────────────────────────────────
-- 1. Idempotency key for door sales. One row per client_uuid, ever.
-- ─────────────────────────────────────────────────────────────────────────────
alter table public.registrations
  add column if not exists walkin_client_uuid text;

create unique index if not exists registrations_walkin_client_uuid_uidx
  on public.registrations (walkin_client_uuid)
  where walkin_client_uuid is not null;


-- ─────────────────────────────────────────────────────────────────────────────
-- 2. create_walkin_registration — the whole door sale, server-authoritative.
--
--    Returns jsonb:
--      { status: 'ok' | 'already',
--        registration_id, qr_code_token, attendee_name, ticket_name,
--        amount_paid, payment_method, cash_shift_id, checked_in }
--    or { status: 'error', message }
--
--    status='already' means this client_uuid was already processed — the caller
--    should treat it as success and show the SAME receipt, not charge again.
-- ─────────────────────────────────────────────────────────────────────────────
create or replace function public.create_walkin_registration(
  p_event_id       uuid,
  p_ticket_type_id uuid,
  p_name           text,
  p_email          text,
  p_phone          text    default null,
  p_payment_method text    default 'cash',
  p_client_uuid    text    default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid      uuid := auth.uid();
  v_tt       public.ticket_types%rowtype;
  v_existing public.registrations%rowtype;
  v_reg      public.registrations%rowtype;
  v_shift_id uuid;
  v_email    text;
  v_now      timestamptz := now();
begin
  if v_uid is null then
    return jsonb_build_object('status','error','message','Not signed in');
  end if;

  if p_payment_method is null or p_payment_method not in ('cash','mobile_money','card') then
    return jsonb_build_object('status','error','message','Invalid payment method');
  end if;

  if coalesce(btrim(p_name), '') = '' then
    return jsonb_build_object('status','error','message','Attendee name is required');
  end if;

  if not public.can_manage_event(p_event_id) then
    return jsonb_build_object('status','error','message','Not authorised for this event');
  end if;

  -- Idempotency: a replayed sale returns the ORIGINAL receipt, never a new row.
  if p_client_uuid is not null then
    select * into v_existing from public.registrations
      where walkin_client_uuid = p_client_uuid limit 1;
    if found then
      return jsonb_build_object(
        'status',          'already',
        'registration_id', v_existing.id,
        'qr_code_token',   v_existing.qr_code_token,
        'attendee_name',   v_existing.attendee_name,
        'amount_paid',     v_existing.amount_paid,
        'payment_method',  v_existing.payment_method,
        'cash_shift_id',   v_existing.cash_shift_id,
        'checked_in',      v_existing.status = 'checked_in'
      );
    end if;
  end if;

  -- The price is the SERVER's. The client never supplies an amount.
  select * into v_tt from public.ticket_types
    where id = p_ticket_type_id and event_id = p_event_id;
  if not found then
    return jsonb_build_object('status','error','message','Ticket type not found for this event');
  end if;

  -- Cash sales belong to the selling staff member's open drawer.
  if p_payment_method = 'cash' then
    select id into v_shift_id from public.cash_shifts
      where event_id = p_event_id and staff_user_id = v_uid and status = 'open'
      order by started_at desc limit 1;
    if v_shift_id is null then
      insert into public.cash_shifts (event_id, staff_user_id)
        values (p_event_id, v_uid)
        returning id into v_shift_id;
    end if;
  end if;

  -- attendee_email is NOT NULL + unique per event. A walk-in without an email
  -- gets a non-deliverable placeholder derived from the idempotency key, so a
  -- retry collides on walkin_client_uuid rather than creating a second sale.
  v_email := nullif(btrim(lower(coalesce(p_email, ''))), '');
  if v_email is null then
    v_email := 'walkin-' || coalesce(p_client_uuid, gen_random_uuid()::text)
               || '@no-reply.eventera';
  end if;

  insert into public.registrations (
    event_id, ticket_type_id, attendee_name, attendee_email, attendee_phone,
    status, payment_status, amount_paid, payment_method, cash_shift_id,
    walkin_client_uuid, checked_in_at, checked_in_by, created_at
  ) values (
    p_event_id, v_tt.id, btrim(p_name), v_email, nullif(btrim(coalesce(p_phone,'')), ''),
    'checked_in', 'paid', v_tt.price, p_payment_method, v_shift_id,
    p_client_uuid, v_now, v_uid, v_now
  )
  returning * into v_reg;

  return jsonb_build_object(
    'status',          'ok',
    'registration_id', v_reg.id,
    'qr_code_token',   v_reg.qr_code_token,
    'attendee_name',   v_reg.attendee_name,
    'ticket_name',     v_tt.name,
    'amount_paid',     v_reg.amount_paid,
    'payment_method',  v_reg.payment_method,
    'cash_shift_id',   v_reg.cash_shift_id,
    'checked_in',      true
  );

exception
  when unique_violation then
    -- Concurrent replay of the same client_uuid — return the winner's receipt.
    if p_client_uuid is not null then
      select * into v_existing from public.registrations
        where walkin_client_uuid = p_client_uuid limit 1;
      if found then
        return jsonb_build_object(
          'status',          'already',
          'registration_id', v_existing.id,
          'qr_code_token',   v_existing.qr_code_token,
          'attendee_name',   v_existing.attendee_name,
          'amount_paid',     v_existing.amount_paid,
          'payment_method',  v_existing.payment_method,
          'cash_shift_id',   v_existing.cash_shift_id,
          'checked_in',      v_existing.status = 'checked_in'
        );
      end if;
    end if;
    return jsonb_build_object('status','error','message','That attendee is already registered for this event');
end;
$$;

revoke all on function public.create_walkin_registration(uuid, uuid, text, text, text, text, text) from public;
grant execute on function public.create_walkin_registration(uuid, uuid, text, text, text, text, text) to authenticated;


-- ####################################################################
-- ## 091_seen_entitlements_migration.sql
-- ####################################################################
-- ============================================================================
-- 076_seen_entitlements_migration.sql   (Group G8 — G01 migration notice)
--
-- WHAT THIS DOES
--   Adds a single per-user boolean flag used to show the one-time "your existing
--   events now support entitlements" reassurance card (G01) exactly once. Once the
--   organizer dismisses the card we set this to true and never show it again.
--
--   Follows the EXACT pattern of 024_onboarding_completed.sql — a boolean column
--   on profiles, not-null, default false. No data is backfilled; every existing
--   organizer starts at false (unseen) and is shown the card on their next
--   dashboard visit, then flips to true on dismiss.
--
-- IDEMPOTENT: add column if not exists. Safe to re-run.
-- HOW TO APPLY: paste this whole file into the Supabase SQL editor and Run.
--   It does NOT modify any already-applied migration.
-- ============================================================================

alter table public.profiles
  add column if not exists seen_entitlements_migration boolean not null default false;

comment on column public.profiles.seen_entitlements_migration is
  'True once the organizer has dismissed the one-time entitlements migration notice (G01).';


-- ####################################################################
-- ## 092_cash_shift_transactions.sql
-- ####################################################################
-- ============================================================================
-- 077_cash_shift_transactions.sql   (Group G4 — hardening)
--
-- WHY THIS EXISTS
--   The mobile end-of-shift screen (C02) lists the registrations on a cash shift
--   by reading `registrations` directly with the staff member's SESSION client.
--   But `registrations` has NO row-level SELECT policy for event STAFF — only the
--   event OWNER (017's owner_all) and the attendee themselves (attendee_read) can
--   read rows. A non-owner staffer — exactly who this screen is for — gets ZERO
--   rows back: the transaction list is empty and the pre-handover collected /
--   expected figures read as 0, so the drawer variance is computed against
--   nothing. (The final close_cash_shift RPC is SECURITY DEFINER, so the
--   reconciled total is still correct — but every figure the operator sees before
--   handing over is wrong.)
--
--   Fix, matching 062_staff_attendee_list's pattern: expose the shift's
--   transactions through a SECURITY DEFINER RPC that authorises with
--   can_manage_event() and returns only the columns the C02 screen needs.
--
-- DEPENDS ON
--   • 017_event_registration  → registrations
--   • 070_cash_reconciliation → cash_shifts, registrations.cash_shift_id
--   • can_manage_event()      → owner OR active staff (defined in 065/067/070)
--
-- IDEMPOTENT: create or replace function. Apply in the Supabase SQL editor.
-- ============================================================================

-- cash_shift_transactions(p_shift_id)
--   Owner/staff of the shift's event only. Newest first.
--   Returns jsonb array of:
--     { attendee_name, amount_paid, currency, created_at, ticket_name }
create or replace function public.cash_shift_transactions(p_shift_id uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_event_id uuid;
  v_result   jsonb;
begin
  select event_id into v_event_id from public.cash_shifts where id = p_shift_id;
  if v_event_id is null then
    raise exception 'SHIFT_NOT_FOUND' using errcode = 'P0001';
  end if;
  if not public.can_manage_event(v_event_id) then
    raise exception 'NOT_AUTHORISED' using errcode = 'P0001';
  end if;

  select coalesce(jsonb_agg(t order by t->>'created_at' desc), '[]'::jsonb)
  into v_result
  from (
    select jsonb_build_object(
      'attendee_name', r.attendee_name,
      'amount_paid',   r.amount_paid,
      'currency',      r.currency,
      'created_at',    r.created_at,
      'ticket_name',   tt.name
    ) as t
    from public.registrations r
    left join public.ticket_types tt on tt.id = r.ticket_type_id
    where r.cash_shift_id = p_shift_id
  ) s;

  return coalesce(v_result, '[]'::jsonb);
end;
$$;

revoke all on function public.cash_shift_transactions(uuid) from public;
grant execute on function public.cash_shift_transactions(uuid) to authenticated;

