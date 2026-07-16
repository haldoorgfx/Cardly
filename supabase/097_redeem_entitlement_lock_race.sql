-- 097_redeem_entitlement_lock_race.sql
-- Closes a narrow double-redemption race in redeem_entitlement(): the
-- once/once_per_day check counted existing redemptions, then inserted the new
-- row as two separate statements with no lock between them. Two staff devices
-- scanning the same attendee at the exact same instant while both offline
-- (or just two concurrent requests) could both read v_active=0 before either
-- commits, and both insert a 'redeemed' row for a limit that should allow only
-- one. client_uuid dedup does NOT catch this — each device generates its own
-- client_uuid per scan, so this is a genuinely different race, not a replay.
--
-- Fix: take a per-(registration, entitlement) advisory transaction lock before
-- the validation ladder runs. Concurrent calls for the SAME registration+
-- entitlement now serialize (the second waits for the first's transaction to
-- commit, then sees the up-to-date count); calls for different
-- registrations/entitlements are completely unaffected. Released automatically
-- at transaction end (function runs in an implicit single-statement
-- transaction), so no explicit unlock is needed and it can't deadlock this way.

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

  -- Serialize concurrent redeem attempts for this exact registration+
  -- entitlement pair so the once/once_per_day count check below can never
  -- race against another in-flight redeem for the same attendee+perk.
  perform pg_advisory_xact_lock(hashtextextended(v_reg.id::text || ':' || v_ent.id::text, 0));

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
