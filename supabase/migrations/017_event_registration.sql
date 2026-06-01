-- 017_event_registration.sql
-- Phase 1: Event registration, ticketing, QR check-in, promo codes, analytics

-- ─── event_pages ────────────────────────────────────────────────────────────
create table if not exists event_pages (
  id                    uuid primary key default gen_random_uuid(),
  event_id              uuid not null unique references events(id) on delete cascade,
  variant_id            uuid references event_variants(id) on delete set null,
  title                 text not null,
  tagline               text,
  description           text,
  cover_image_url       text,
  venue_name            text,
  venue_address         text,
  venue_lat             numeric,
  venue_lng             numeric,
  starts_at             timestamptz not null,
  ends_at               timestamptz not null,
  timezone              text not null default 'UTC',
  is_online             boolean not null default false,
  online_url            text,
  registration_deadline timestamptz,
  max_capacity          int,
  is_public             boolean not null default true,
  custom_slug           text unique,
  seo_title             text,
  seo_description       text,
  payment_processor     text not null default 'stripe'
                          check (payment_processor in ('stripe','flutterwave','free')),
  organizer_name        text,
  organizer_avatar_url  text,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);

create index if not exists event_pages_event_idx on event_pages(event_id);
create index if not exists event_pages_custom_slug_idx on event_pages(custom_slug) where custom_slug is not null;
create index if not exists event_pages_public_idx on event_pages(is_public, starts_at);

-- ─── ticket_types ────────────────────────────────────────────────────────────
create table if not exists ticket_types (
  id              uuid primary key default gen_random_uuid(),
  event_id        uuid not null references events(id) on delete cascade,
  name            text not null,
  description     text,
  price           numeric not null default 0,
  currency        text not null default 'USD',
  quantity        int,
  quantity_sold   int not null default 0,
  sales_start     timestamptz,
  sales_end       timestamptz,
  min_per_order   int not null default 1,
  max_per_order   int not null default 10,
  is_visible      boolean not null default true,
  position        int not null default 0,
  created_at      timestamptz not null default now()
);

create index if not exists ticket_types_event_idx on ticket_types(event_id);

-- ─── registrations ───────────────────────────────────────────────────────────
create table if not exists registrations (
  id                        uuid primary key default gen_random_uuid(),
  event_id                  uuid not null references events(id) on delete cascade,
  ticket_type_id            uuid references ticket_types(id),
  attendee_name             text not null,
  attendee_email            text not null,
  attendee_phone            text,
  custom_fields             jsonb not null default '{}'::jsonb,
  status                    text not null default 'confirmed'
                              check (status in ('pending','confirmed','checked_in','cancelled','refunded')),
  payment_status            text not null default 'free'
                              check (payment_status in ('free','pending','paid','refunded','failed')),
  stripe_payment_intent_id  text,
  flutterwave_tx_ref        text,
  amount_paid               numeric not null default 0,
  currency                  text not null default 'USD',
  qr_code_token             text unique not null default encode(gen_random_bytes(16), 'hex'),
  checked_in_at             timestamptz,
  checked_in_by             uuid references profiles(id),
  karta_card_url            text,
  karta_card_zone_data      jsonb,
  source                    text default 'web',
  created_at                timestamptz not null default now(),
  updated_at                timestamptz not null default now()
);

create index if not exists registrations_event_idx   on registrations(event_id);
create index if not exists registrations_email_idx   on registrations(attendee_email);
create index if not exists registrations_qr_idx      on registrations(qr_code_token);
create index if not exists registrations_status_idx  on registrations(event_id, status);

-- ─── registration_form_fields ────────────────────────────────────────────────
create table if not exists registration_form_fields (
  id          uuid primary key default gen_random_uuid(),
  event_id    uuid not null references events(id) on delete cascade,
  label       text not null,
  field_type  text not null
                check (field_type in ('text','textarea','select','checkbox','radio','phone','url')),
  options     jsonb,
  is_required boolean not null default false,
  position    int not null default 0
);

create index if not exists reg_form_fields_event_idx on registration_form_fields(event_id);

-- ─── promo_codes ─────────────────────────────────────────────────────────────
create table if not exists promo_codes (
  id             uuid primary key default gen_random_uuid(),
  event_id       uuid not null references events(id) on delete cascade,
  code           text not null,
  discount_type  text not null check (discount_type in ('percent','fixed')),
  discount_value numeric not null,
  max_uses       int,
  uses_count     int not null default 0,
  valid_from     timestamptz,
  valid_until    timestamptz,
  applies_to     jsonb,
  created_at     timestamptz not null default now(),
  unique(event_id, code)
);

create index if not exists promo_codes_event_idx on promo_codes(event_id);

-- ─── check_in_sessions ───────────────────────────────────────────────────────
create table if not exists check_in_sessions (
  id              uuid primary key default gen_random_uuid(),
  event_id        uuid not null references events(id),
  operator_id     uuid references profiles(id),
  started_at      timestamptz not null default now(),
  check_ins_count int not null default 0
);

create index if not exists check_in_sessions_event_idx on check_in_sessions(event_id);

-- ─── RLS ─────────────────────────────────────────────────────────────────────

alter table event_pages              enable row level security;
alter table ticket_types             enable row level security;
alter table registrations            enable row level security;
alter table registration_form_fields enable row level security;
alter table promo_codes              enable row level security;
alter table check_in_sessions        enable row level security;

-- event_pages
do $$ begin
  if not exists (select 1 from pg_policies where tablename='event_pages' and policyname='owner_all') then
    create policy "owner_all" on event_pages for all using (
      event_id in (select id from events where user_id = auth.uid())
    );
  end if;
end $$;

do $$ begin
  if not exists (select 1 from pg_policies where tablename='event_pages' and policyname='public_read') then
    create policy "public_read" on event_pages for select using (is_public = true);
  end if;
end $$;

-- ticket_types
do $$ begin
  if not exists (select 1 from pg_policies where tablename='ticket_types' and policyname='owner_all') then
    create policy "owner_all" on ticket_types for all using (
      event_id in (select id from events where user_id = auth.uid())
    );
  end if;
end $$;

do $$ begin
  if not exists (select 1 from pg_policies where tablename='ticket_types' and policyname='public_read') then
    create policy "public_read" on ticket_types for select using (
      event_id in (select id from event_pages where is_public = true)
    );
  end if;
end $$;

-- registrations
do $$ begin
  if not exists (select 1 from pg_policies where tablename='registrations' and policyname='owner_all') then
    create policy "owner_all" on registrations for all using (
      event_id in (select id from events where user_id = auth.uid())
    );
  end if;
end $$;

do $$ begin
  if not exists (select 1 from pg_policies where tablename='registrations' and policyname='attendee_read') then
    create policy "attendee_read" on registrations for select using (
      attendee_email = (select email from profiles where id = auth.uid())
    );
  end if;
end $$;

do $$ begin
  if not exists (select 1 from pg_policies where tablename='registrations' and policyname='public_insert') then
    create policy "public_insert" on registrations for insert with check (true);
  end if;
end $$;

-- registration_form_fields
do $$ begin
  if not exists (select 1 from pg_policies where tablename='registration_form_fields' and policyname='owner_all') then
    create policy "owner_all" on registration_form_fields for all using (
      event_id in (select id from events where user_id = auth.uid())
    );
  end if;
end $$;

do $$ begin
  if not exists (select 1 from pg_policies where tablename='registration_form_fields' and policyname='public_read') then
    create policy "public_read" on registration_form_fields for select using (
      event_id in (select id from event_pages where is_public = true)
    );
  end if;
end $$;

-- promo_codes (no public read — codes are secret)
do $$ begin
  if not exists (select 1 from pg_policies where tablename='promo_codes' and policyname='owner_all') then
    create policy "owner_all" on promo_codes for all using (
      event_id in (select id from events where user_id = auth.uid())
    );
  end if;
end $$;

-- check_in_sessions
do $$ begin
  if not exists (select 1 from pg_policies where tablename='check_in_sessions' and policyname='owner_all') then
    create policy "owner_all" on check_in_sessions for all using (
      event_id in (select id from events where user_id = auth.uid())
    );
  end if;
end $$;

-- ─── Helper function: atomic quantity guard ──────────────────────────────────
create or replace function increment_ticket_quantity_sold(ticket_id uuid, qty int default 1)
returns void
language plpgsql security definer as $$
begin
  update ticket_types
  set    quantity_sold = quantity_sold + qty
  where  id = ticket_id
  and    (quantity is null or quantity_sold + qty <= quantity);

  if not found then
    raise exception 'TICKET_SOLD_OUT' using errcode = 'P0001';
  end if;
end;
$$;

-- ─── Helper function: atomic promo code usage increment ──────────────────────
create or replace function increment_promo_code_uses(code_id uuid)
returns void
language plpgsql security definer as $$
begin
  update promo_codes
  set    uses_count = uses_count + 1
  where  id = code_id
  and    (max_uses is null or uses_count < max_uses);

  if not found then
    raise exception 'PROMO_MAX_USES_REACHED' using errcode = 'P0001';
  end if;
end;
$$;

-- ─── Trigger: updated_at ─────────────────────────────────────────────────────
create or replace function set_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end;
$$;

do $$ begin
  if not exists (select 1 from pg_trigger where tgname='set_event_pages_updated_at') then
    create trigger set_event_pages_updated_at
      before update on event_pages
      for each row execute function set_updated_at();
  end if;
end $$;

do $$ begin
  if not exists (select 1 from pg_trigger where tgname='set_registrations_updated_at') then
    create trigger set_registrations_updated_at
      before update on registrations
      for each row execute function set_updated_at();
  end if;
end $$;
