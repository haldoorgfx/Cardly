-- ============================================================================
-- EVENTERA — RUN ALL TICKETING FIXES (single paste)
-- ----------------------------------------------------------------------------
-- Paste this ENTIRE file into Supabase → SQL Editor → New query → Run.
-- It applies the un-run migrations (041–046) and the ticketing integrity fixes
-- (047) in the correct order. Every block is idempotent — safe to run once or
-- many times. Fixes both the web app and the mobile app (they share this DB).
-- ============================================================================


-- ==== 0  DATA CLEANUP — invalid event_pages rows ============================
-- Some events predate the validation rules migration 028 added as NOT VALID,
-- so they hold invalid dates/capacity. Any UPDATE to those rows re-checks the
-- constraints and fails (this broke migration 045). Bulletproof approach: DROP
-- the three event_pages check constraints first so nothing can trip, fix the
-- bad data, run the migrations, then re-add the constraints (NOT VALID) at the
-- very end so future writes are still validated.
alter table event_pages drop constraint if exists chk_event_page_date_order;
alter table event_pages drop constraint if exists chk_event_page_deadline_before_start;
alter table event_pages drop constraint if exists chk_event_page_capacity_positive;

-- registration_deadline must be BEFORE start → clear invalid ones
-- (null = registration open until the event starts).
update event_pages set registration_deadline = null
  where registration_deadline is not null and starts_at is not null
    and registration_deadline >= starts_at;

-- ends_at must be AFTER start → give zero/negative-length events a 2h end.
update event_pages set ends_at = starts_at + interval '2 hours'
  where ends_at is not null and starts_at is not null and ends_at <= starts_at;

-- max_capacity must be >= 1 → clear invalid values (null = unlimited).
update event_pages set max_capacity = null
  where max_capacity is not null and max_capacity < 1;


-- ==== 041  form field types =================================================
alter table registration_form_fields
  drop constraint if exists registration_form_fields_field_type_check;
alter table registration_form_fields
  add constraint registration_form_fields_field_type_check
  check (field_type in (
    'text', 'textarea', 'select', 'checkbox', 'radio', 'phone', 'url',
    'date', 'number', 'section'
  ));


-- ==== 042  registrations status check (fixes "registered → no ticket") =======
alter table registrations drop constraint if exists registrations_status_check;
alter table registrations add constraint registrations_status_check
  check (status in (
    'pending', 'confirmed', 'checked_in', 'cancelled', 'refunded',
    'waitlisted', 'pending_approval'
  ));


-- ==== 043  rename karta_* → eventera_* (REQUIRED; app 500s without it) ========
do $$
begin
  if exists (select 1 from information_schema.columns
             where table_name='registrations' and column_name='karta_card_url') then
    alter table registrations rename column karta_card_url to eventera_card_url;
  end if;
  if exists (select 1 from information_schema.columns
             where table_name='registrations' and column_name='karta_card_zone_data') then
    alter table registrations rename column karta_card_zone_data to eventera_card_zone_data;
  end if;
end $$;
alter table site_settings alter column brand_name set default 'Eventera';
update site_settings set brand_name = 'Eventera' where brand_name = 'Karta';


-- ==== 044  link event_variants → ticket_types ================================
alter table event_variants
  add column if not exists ticket_type_id uuid references ticket_types(id) on delete set null;
create index if not exists idx_event_variants_ticket_type_id on event_variants(ticket_type_id);


-- ==== 045  multiple payment processors per event ============================
alter table event_pages
  add column if not exists payment_processors text[] default null;
update event_pages
  set payment_processors = array[payment_processor]
  where payment_processor is not null and payment_processors is null;


-- ==== 046  mobile: own-row notifications RLS ================================
do $$
begin
  if exists (select 1 from information_schema.tables
             where table_schema='public' and table_name='notifications') then
    alter table public.notifications enable row level security;
    drop policy if exists "notifications: own select" on public.notifications;
    create policy "notifications: own select" on public.notifications
      for select using (auth.uid() = user_id);
    drop policy if exists "notifications: own update" on public.notifications;
    create policy "notifications: own update" on public.notifications
      for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
  end if;
end $$;


-- ==== 047  TICKETING INTEGRITY FIXES ========================================

-- (a) Re-assert the full status set (idempotent safety net for 042).
alter table registrations drop constraint if exists registrations_status_check;
alter table registrations add constraint registrations_status_check
  check (status in (
    'pending', 'confirmed', 'checked_in', 'cancelled', 'refunded',
    'waitlisted', 'pending_approval'
  ));

-- (b) OWNERSHIP / MISSING TICKETS: read your own registrations by user_id OR a
--     case-insensitive email match (old policy matched email exactly, hiding
--     tickets linked by user_id or a differently-cased email).
drop policy if exists attendee_read on registrations;
create policy attendee_read on registrations
  for select
  using (
    (user_id is not null and user_id = auth.uid())
    or lower(attendee_email) = lower(coalesce(
         (select email from profiles where id = auth.uid()), '')
       )
  );

-- (c) DUPLICATES: make per-event email uniqueness case-insensitive.
--     If this errors, you have real case-duplicate rows — see the audit doc to
--     merge them, then re-run this block.
alter table registrations drop constraint if exists registrations_event_email_unique;
create unique index if not exists registrations_event_email_lower_uniq
  on registrations (event_id, lower(attendee_email));

-- (d) Non-negative money / inventory guards (new rows only; history untouched).
alter table registrations drop constraint if exists chk_registration_amount_non_negative;
alter table registrations add constraint chk_registration_amount_non_negative
  check (amount_paid >= 0) not valid;
alter table ticket_types drop constraint if exists chk_ticket_quantity_sold_non_negative;
alter table ticket_types add constraint chk_ticket_quantity_sold_non_negative
  check (quantity_sold >= 0) not valid;

-- ==== Re-add the event_pages validation constraints (NOT VALID) =============
-- Restored so new writes are still validated; NOT VALID tolerates any remaining
-- legacy rows (the cleanup above already corrected the known bad ones).
alter table event_pages add constraint chk_event_page_date_order
  check (ends_at is null or starts_at is null or ends_at > starts_at) not valid;
alter table event_pages add constraint chk_event_page_deadline_before_start
  check (registration_deadline is null or starts_at is null or registration_deadline < starts_at) not valid;
alter table event_pages add constraint chk_event_page_capacity_positive
  check (max_capacity is null or max_capacity >= 1) not valid;


-- ============================================================================
-- Done. Both apps now inherit correct ticket ownership, de-dup, and statuses.
-- No app rebuild needed for the DB changes to take effect.
-- ============================================================================
