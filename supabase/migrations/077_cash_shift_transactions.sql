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
