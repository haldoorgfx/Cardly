-- ============================================================
-- 124: Financial transactions ledger — the single source of truth
-- for platform fees, organizer payouts, refunds, and payout records.
--
-- Why this exists: registrations.platform_fee/organizer_net/payment_status
-- are mutable columns that get overwritten in place. Everything on the
-- admin Billing page and the organizer Revenue page was a live SUM() over
-- those columns — no history, no reconciliation trail, and refunds handled
-- three inconsistent ways meant the numbers could drift and silently
-- disagree between pages (see docs/MIGRATIONS-PENDING.md for the audit).
--
-- Principle: every money-moving action writes ONE immutable row here.
-- Nothing ever UPDATEs a row — a refund is a new reversing row, never an
-- edit. "Owed to organizer right now" is always a derived SUM(), never a
-- running-balance column (this codebase has already been bitten by that
-- drift-bug class once, on ticket_types.quantity_sold).
--
-- Idempotent: safe to re-run.
-- ============================================================

create table if not exists financial_transactions (
  id              uuid primary key default gen_random_uuid(),
  created_at      timestamptz not null default now(),
  entry_type      text not null check (entry_type in (
                    'platform_fee', 'organizer_net', 'refund_fee', 'refund_net', 'payout_issued'
                  )),
  event_id        uuid references events(id) on delete set null,
  organizer_id    uuid references profiles(id) on delete set null,
  registration_id uuid references registrations(id) on delete set null,
  amount          numeric(12,2) not null,  -- major units — matches lib/payments/currency.ts convention
  currency        text not null,
  provider        text,                    -- 'stripe' | 'flutterwave' | 'waafipay' | 'manual' | 'import' | null
  provider_ref    text,                    -- payment_intent id / tx_ref / payout note
  created_by      uuid references profiles(id),  -- who recorded it; null = system/webhook-initiated
  note            text,
  metadata        jsonb not null default '{}'::jsonb
);

create index if not exists financial_transactions_event_idx
  on financial_transactions(event_id, created_at desc);
create index if not exists financial_transactions_organizer_idx
  on financial_transactions(organizer_id, created_at desc);
create index if not exists financial_transactions_registration_idx
  on financial_transactions(registration_id);

-- Refund reversals are idempotent by construction: a retried refund can only
-- ever insert one refund_fee and one refund_net row per registration.
create unique index if not exists financial_transactions_refund_once_idx
  on financial_transactions(registration_id, entry_type)
  where entry_type in ('refund_fee', 'refund_net');

alter table financial_transactions enable row level security;

-- Same pattern as audit_log: completely locked to clients — every write goes
-- through a service-role client from an API route.
drop policy if exists "financial_transactions: no direct client access" on financial_transactions;
create policy "financial_transactions: no direct client access" on financial_transactions
  for all using (false);

-- ── Backfill (best-effort, opening balance only) ─────────────────────────
-- Reflects what registrations holds TODAY. It is not a restated history —
-- rows created before this migration have no created_at other than "now",
-- and a registration refunded after its fee columns were already cleared
-- elsewhere would backfill with whatever is currently on the row.
insert into financial_transactions (entry_type, event_id, organizer_id, registration_id, amount, currency, provider, provider_ref, note)
select
  'platform_fee', r.event_id, e.user_id, r.id, r.platform_fee, r.currency,
  case when r.stripe_payment_intent_id is not null then 'stripe' else 'manual' end,
  r.stripe_payment_intent_id,
  'Backfilled by migration 124 — opening balance, not restated history.'
from registrations r
join events e on e.id = r.event_id
where r.payment_status in ('paid', 'refunded')
  and r.platform_fee > 0
  -- No unique index backs platform_fee/organizer_net rows (only refunds are
  -- naturally idempotent via the partial unique index above) — this guard is
  -- what makes re-running this migration safe.
  and not exists (
    select 1 from financial_transactions ft
    where ft.registration_id = r.id and ft.entry_type = 'platform_fee'
  )
on conflict do nothing;

insert into financial_transactions (entry_type, event_id, organizer_id, registration_id, amount, currency, provider, provider_ref, note)
select
  'organizer_net', r.event_id, e.user_id, r.id, coalesce(r.organizer_net, r.amount_paid - r.platform_fee), r.currency,
  case when r.stripe_payment_intent_id is not null then 'stripe' else 'manual' end,
  r.stripe_payment_intent_id,
  'Backfilled by migration 124 — opening balance, not restated history.'
from registrations r
join events e on e.id = r.event_id
where r.payment_status in ('paid', 'refunded')
  and r.amount_paid > 0
  and not exists (
    select 1 from financial_transactions ft
    where ft.registration_id = r.id and ft.entry_type = 'organizer_net'
  )
on conflict do nothing;

-- Refunded registrations also get the reversal pair, so the ledger already
-- nets to zero for them instead of showing a phantom fee/net still owed.
insert into financial_transactions (entry_type, event_id, organizer_id, registration_id, amount, currency, provider, provider_ref, note)
select
  'refund_fee', r.event_id, e.user_id, r.id, -r.platform_fee, r.currency,
  case when r.stripe_payment_intent_id is not null then 'stripe' else 'manual' end,
  r.stripe_payment_intent_id,
  'Backfilled by migration 124 — opening balance, not restated history.'
from registrations r
join events e on e.id = r.event_id
where r.payment_status = 'refunded'
  and r.platform_fee > 0
on conflict (registration_id, entry_type) where entry_type in ('refund_fee', 'refund_net') do nothing;

insert into financial_transactions (entry_type, event_id, organizer_id, registration_id, amount, currency, provider, provider_ref, note)
select
  'refund_net', r.event_id, e.user_id, r.id, -coalesce(r.organizer_net, r.amount_paid - r.platform_fee), r.currency,
  case when r.stripe_payment_intent_id is not null then 'stripe' else 'manual' end,
  r.stripe_payment_intent_id,
  'Backfilled by migration 124 — opening balance, not restated history.'
from registrations r
join events e on e.id = r.event_id
where r.payment_status = 'refunded'
  and r.amount_paid > 0
on conflict (registration_id, entry_type) where entry_type in ('refund_fee', 'refund_net') do nothing;
