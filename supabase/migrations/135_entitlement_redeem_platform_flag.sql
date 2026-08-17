-- ============================================================================
-- 135_entitlement_redeem_platform_flag.sql
--
-- WHAT WAS WRONG
--   The actual write-path for consuming an entitlement (scanning a meal/swag/
--   session voucher at check-in) is public.redeem_entitlement(...) — most
--   recently redefined in supabase/097_redeem_entitlement_lock_race.sql — and
--   its reversal, public.unredeem_entitlement(...) — most recently redefined
--   in supabase/migrations/115_waitlist_invite_and_unredeem_integrity.sql.
--   Both are called directly via supabase.rpc(...) from an authenticated
--   session — redeem_entitlement only from the mobile app
--   (eventera_mobile/lib/screens/organizer/entitlement_scanner_screen.dart
--   and lib/offline/sync_controller.dart, for offline-queued scans),
--   unredeem_entitlement from the web dashboard
--   (app/(app)/events/[id]/registrations/[regId]/entitlements/page.tsx, which
--   DOES already gate the page itself with
--   isPlatformFeatureEnabled('entitlements') before rendering — but that
--   page-level gate is exactly the kind of check migration 134 already showed
--   is not enough on its own, because the RPC is one direct client call away
--   from anyone with an authenticated session that passes
--   can_manage_event()).
--
--   Neither RPC checked the 'entitlements' platform flag — only
--   can_manage_event(event_id). Same shape as the catering_counts /
--   accessibility_summary bypass migration 134 already fixed: a super_admin
--   turning OFF the 'entitlements' platform feature does not stop check-in
--   staff (web or mobile, online or offline-then-synced) from still redeeming
--   or un-redeeming real entitlements.
--
-- FIX
--   Add one early-exit check for platform:entitlements to each RPC,
--   immediately after their existing auth checks, using the
--   public.is_platform_feature_enabled(text) helper migration 134 already
--   added (reused here, not redefined). Bodies are otherwise BYTE-FOR-BYTE
--   unchanged from their source files named above. Both functions already
--   return jsonb_build_object('status','error','message', ...) for every
--   failure case (never raise) — the new check follows that same convention
--   so the existing Dart/TS callers' 'error' status handling covers it with
--   no client-side changes required.
--
--   Deliberately gated on 'entitlements', not 'catering': the web
--   dashboard's own per-registration entitlements page already treats
--   'entitlements' as the controlling flag for redemption/reversal
--   (registrations/[regId]/entitlements/page.tsx), even though some
--   entitlements are type='meal' and also feed the separate 'catering'-gated
--   aggregate views (catering_counts / accessibility_summary). The scanner
--   and this RPC pair are entitlement-type-agnostic (meal, swag, session all
--   flow through the same redeem_entitlement call), so they follow the same
--   'entitlements' key the dashboard page already uses for this exact action.
--
-- IDEMPOTENT: create or replace function. Safe to re-run.
-- HOW TO APPLY: paste this whole file into the Supabase SQL editor and Run.
-- Requires supabase/097_redeem_entitlement_lock_race.sql,
-- supabase/migrations/115_waitlist_invite_and_unredeem_integrity.sql, and
-- 134_catering_rpc_platform_flag.sql (public.is_platform_feature_enabled) to
-- already be applied.
-- ============================================================================


-- ─────────────────────────────────────────────────────────────────────────────
-- 1. redeem_entitlement(...) — body unchanged from 097, + flag check right
--    after the can_manage_event authorisation check, before the client_uuid
--    idempotency lookup (so a disabled flag is reported even on a replayed
--    offline scan, rather than silently returning a stale success).
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

  if not public.is_platform_feature_enabled('entitlements') then
    return jsonb_build_object('status','error','message','Entitlements is currently unavailable.');
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

revoke all on function public.redeem_entitlement(uuid, uuid, int, text, text, text, timestamptz) from public;
grant execute on function public.redeem_entitlement(uuid, uuid, int, text, text, text, timestamptz) to authenticated;


-- ─────────────────────────────────────────────────────────────────────────────
-- 2. unredeem_entitlement(...) — body unchanged from migrations/115, + flag
--    check right after the can_manage_event authorisation check.
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
  v_uid  uuid := auth.uid();
  v_orig public.entitlement_redemptions%rowtype;
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

  if not public.is_platform_feature_enabled('entitlements') then
    return jsonb_build_object('status','error','message','Entitlements is currently unavailable.');
  end if;

  -- Only a live, successful redemption can be reversed. A 'granted' row, an
  -- 'already'/'not_entitled' attempt, or a row that lost an offline conflict
  -- was never a consumed perk, so reversing it would manufacture a credit.
  if v_orig.action <> 'redeemed' or v_orig.status <> 'redeemed' or v_orig.superseded_by is not null then
    return jsonb_build_object('status','error','message','That entry is not a redemption that can be un-redeemed');
  end if;

  begin
    insert into public.entitlement_redemptions(
      entitlement_id, registration_id, event_id, action, status,
      reason, performed_by, day_index, reverses_id
    ) values (
      v_orig.entitlement_id, v_orig.registration_id, v_orig.event_id, 'un_redeemed', 'ok',
      p_reason, v_uid, v_orig.day_index, v_orig.id
    );
  exception when unique_violation then
    -- Someone else reversed this exact redemption first — not an error, just
    -- already done. Return current state rather than double-crediting.
    return public._entitlement_scan_result(v_orig.registration_id, v_orig.entitlement_id, 'ok');
  end;

  return public._entitlement_scan_result(v_orig.registration_id, v_orig.entitlement_id, 'ok');
end;
$$;

revoke all on function public.unredeem_entitlement(uuid, text) from public;
grant execute on function public.unredeem_entitlement(uuid, text) to authenticated;

-- ─────────────────────────────────────────────────────────────────────────────
-- Sanity check — run after applying, as an event owner/staff, with
-- platform:entitlements set to false in feature_flags:
--
--   select redeem_entitlement('<entitlement-uuid>', '<registration-uuid>');
--   -> should now return {"status":"error","message":"Entitlements is
--      currently unavailable."} instead of redeeming.
--
--   select unredeem_entitlement('<redemption-uuid>', 'test reversal');
--   -> should return the same error shape instead of reversing.
--
-- Flip platform:entitlements back to true and re-run — both should behave
-- exactly as before this migration.
-- ─────────────────────────────────────────────────────────────────────────────
