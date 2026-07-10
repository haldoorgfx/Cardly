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
  select coalesce(jsonb_agg(row order by row->>'staff_name'), '[]'::jsonb)
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
    ) as row
    from public.cash_shifts s
    left join lateral (
      select count(*) as txn, coalesce(sum(r.amount_paid), 0) as collected
      from public.registrations r
      where r.cash_shift_id = s.id
    ) rt on true
    left join public.profiles p on p.id = s.staff_user_id
    where s.event_id = p_event_id
    group by s.staff_user_id, p.full_name
  ) rows;

  return jsonb_build_object(
    'grand_total', coalesce(v_grand, 0),
    'staff',       v_staff
  );
end;
$$;

revoke all on function public.cash_reconciliation(uuid) from public;
grant execute on function public.cash_reconciliation(uuid) to authenticated;
