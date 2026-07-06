-- 060_exhibitor_products_meetings.sql
-- Backend for Exhibitor mode (design_handoff_role_modes EX02 products + EX03 meetings).
-- These tables don't exist yet; the rest of exhibitor mode reuses sponsors/sponsor_leads.
-- Apply in the Supabase SQL editor.

-- EX02 · product showcase
create table if not exists exhibitor_products (
  id           uuid primary key default gen_random_uuid(),
  sponsor_id   uuid not null references sponsors(id) on delete cascade,
  event_id     uuid not null references events(id) on delete cascade,
  name         text not null,
  description  text,
  image_url    text,
  is_featured  boolean not null default false,
  position     int not null default 0,
  created_at   timestamptz not null default now()
);
create index if not exists exhibitor_products_sponsor_idx on exhibitor_products(sponsor_id);

-- EX03 · meeting requests (attendee -> exhibitor)
create table if not exists meeting_requests (
  id              uuid primary key default gen_random_uuid(),
  sponsor_id      uuid not null references sponsors(id) on delete cascade,
  event_id        uuid not null references events(id) on delete cascade,
  registration_id uuid references registrations(id) on delete set null,
  requester_name  text,
  requester_email text,
  requested_time  timestamptz,
  scheduled_time  timestamptz,
  status          text not null default 'pending' check (status in ('pending','scheduled','declined')),
  message         text,
  created_at      timestamptz not null default now()
);
create index if not exists meeting_requests_sponsor_idx on meeting_requests(sponsor_id);

alter table exhibitor_products enable row level security;
alter table meeting_requests  enable row level security;

-- Helper predicate: is auth.uid() an owner/member/organizer for this sponsor?
-- (Inlined into each policy to avoid a separate function dependency.)

-- Products: anyone can read (public directory EX04); exhibitor team/owner write.
drop policy if exists exhibitor_products_read on exhibitor_products;
create policy exhibitor_products_read on exhibitor_products for select using (true);

drop policy if exists exhibitor_products_write on exhibitor_products;
create policy exhibitor_products_write on exhibitor_products for all to authenticated
  using (exists (select 1 from sponsors s where s.id = exhibitor_products.sponsor_id and (
      lower(coalesce(s.contact_email,'')) = lower(coalesce((select email from profiles where id = auth.uid()),''))
   or exists (select 1 from sponsor_members m where m.sponsor_id = s.id and m.user_id = auth.uid())
   or exists (select 1 from events e where e.id = s.event_id and e.user_id = auth.uid()))))
  with check (exists (select 1 from sponsors s where s.id = exhibitor_products.sponsor_id and (
      lower(coalesce(s.contact_email,'')) = lower(coalesce((select email from profiles where id = auth.uid()),''))
   or exists (select 1 from sponsor_members m where m.sponsor_id = s.id and m.user_id = auth.uid())
   or exists (select 1 from events e where e.id = s.event_id and e.user_id = auth.uid()))));

-- Meeting requests: the exhibitor team/owner read + update; an attendee inserts their own.
drop policy if exists meeting_requests_read on meeting_requests;
create policy meeting_requests_read on meeting_requests for select to authenticated
  using (exists (select 1 from sponsors s where s.id = meeting_requests.sponsor_id and (
      lower(coalesce(s.contact_email,'')) = lower(coalesce((select email from profiles where id = auth.uid()),''))
   or exists (select 1 from sponsor_members m where m.sponsor_id = s.id and m.user_id = auth.uid())
   or exists (select 1 from events e where e.id = s.event_id and e.user_id = auth.uid())))
   or lower(coalesce(meeting_requests.requester_email,'')) = lower(coalesce((select email from profiles where id = auth.uid()),'')));

drop policy if exists meeting_requests_insert on meeting_requests;
create policy meeting_requests_insert on meeting_requests for insert to authenticated
  with check (true);  -- any signed-in attendee may request; requester_email is stamped client-side

drop policy if exists meeting_requests_update on meeting_requests;
create policy meeting_requests_update on meeting_requests for update to authenticated
  using (exists (select 1 from sponsors s where s.id = meeting_requests.sponsor_id and (
      lower(coalesce(s.contact_email,'')) = lower(coalesce((select email from profiles where id = auth.uid()),''))
   or exists (select 1 from sponsor_members m where m.sponsor_id = s.id and m.user_id = auth.uid())
   or exists (select 1 from events e where e.id = s.event_id and e.user_id = auth.uid()))));
