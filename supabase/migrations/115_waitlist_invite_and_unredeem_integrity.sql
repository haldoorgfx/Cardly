-- ============================================================================
-- 115_waitlist_invite_and_unredeem_integrity.sql
--
-- Two independent integrity fixes found in the waitlist + entitlements audit.
-- IDEMPOTENT (create or replace / if not exists). Safe to re-run.
-- HOW TO APPLY: paste this whole file into the Supabase SQL editor and Run.
--
-- Shipped app code works BEFORE this is applied: the waitlist route falls back
-- to its previous read-then-write path when invite_waitlist_entry() is absent,
-- and unredeem_entitlement() keeps its 080 behaviour until replaced here.
-- ============================================================================


-- ─────────────────────────────────────────────────────────────────────────────
-- 1. Atomic waitlist invite (waiting → invited, capacity-checked in ONE stmt).
--
--    The API route checked capacity with a SELECT count, then UPDATEd the entry
--    in a second statement. Two organizers (or two tabs) inviting at the same
--    instant with one seat left both read "room for one" and both promoted an
--    entry — two people emailed "a spot opened for you" for a single seat, and
--    whoever registers second is turned away at the door.
--
--    Fix uses this repo's established idiom: the precondition lives inside the
--    UPDATE's WHERE clause, so only the first transition returns a row.
--    Seats consumed = confirmed/checked_in registrations PLUS outstanding
--    invites (an unclaimed invite is a promise against a seat; ignoring them
--    is what let the queue be over-promised in the first place).
-- ─────────────────────────────────────────────────────────────────────────────
create or replace function public.invite_waitlist_entry(p_entry_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_page_id   uuid;
  v_event_id  uuid;
  v_cap       int;
  v_updated   uuid;
begin
  select we.event_page_id, ep.event_id, ep.max_capacity
    into v_page_id, v_event_id, v_cap
    from public.waitlist_entries we
    join public.event_pages ep on ep.id = we.event_page_id
   where we.id = p_entry_id;

  if v_page_id is null then
    return jsonb_build_object('status','error','message','Entry not found');
  end if;

  update public.waitlist_entries w
     set status = 'invited',
         notified_at = now()
   where w.id = p_entry_id
     and w.status = 'waiting'
     -- Capacity precondition, evaluated inside the UPDATE so two concurrent
     -- invites cannot both satisfy it against the same free seat.
     and (
       v_cap is null or v_cap <= 0 or v_event_id is null
       or (
         (select count(*) from public.registrations r
           where r.event_id = v_event_id
             and r.status in ('confirmed','checked_in'))
         + (select count(*) from public.waitlist_entries o
             where o.event_page_id = v_page_id
               and o.status = 'invited')
       ) < v_cap
     )
  returning w.id into v_updated;

  if v_updated is null then
    -- Distinguish "already invited/gone" from "no seat" so the UI can say why.
    if exists (select 1 from public.waitlist_entries w
                where w.id = p_entry_id and w.status <> 'waiting') then
      return jsonb_build_object('status','already_invited');
    end if;
    return jsonb_build_object('status','full');
  end if;

  return jsonb_build_object('status','ok');
end;
$$;

-- Service-role only: the API route re-derives and verifies event ownership
-- before calling, and the service role has no auth.uid() for an in-RPC check.
revoke all on function public.invite_waitlist_entry(uuid) from public;
revoke all on function public.invite_waitlist_entry(uuid) from authenticated;
revoke all on function public.invite_waitlist_entry(uuid) from anon;


-- ─────────────────────────────────────────────────────────────────────────────
-- 2. Un-redeem can only reverse a real, un-reversed redemption.
--
--    080's unredeem_entitlement() accepted ANY entitlement_redemptions row id
--    and unconditionally appended an 'un_redeemed' row. The redeem ladder
--    computes  active = count(redeemed) - count(un_redeemed), so:
--      • reversing the same redemption twice (two staff with the page open,
--        both clicking "un-redeem" on the same stale row) drives active to -1
--      • reversing a row that was never a successful redemption (a 'granted'
--        row, or a redeem attempt that came back 'already') does the same
--    A negative count means the next scan of a once-only meal voucher returns
--    'redeemed' again — one free meal per stray reversal, real money.
--
--    Fix: a partial unique index makes a second reversal of the same redemption
--    physically impossible even under a race, and the RPC now refuses rows that
--    are not a live successful redemption.
-- ─────────────────────────────────────────────────────────────────────────────
create unique index if not exists entitlement_redemptions_reverses_uidx
  on public.entitlement_redemptions (reverses_id)
  where reverses_id is not null;

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
