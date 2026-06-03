-- Migration 023: Sponsors, White Label, Call for Papers, Abstracts
-- Idempotent — all CREATE TABLE IF NOT EXISTS

-- ─── sponsors ─────────────────────────────────────────────────────────────────
-- Exhibitors/sponsors attached to an event
create table if not exists sponsors (
  id               uuid primary key default gen_random_uuid(),
  event_id         uuid not null references events(id) on delete cascade,
  company_name     text not null,
  tagline          text,
  description      text,
  logo_url         text,
  cover_url        text,
  website_url      text,
  contact_email    text,
  meeting_url      text,
  booth_location   text,         -- e.g. "Hall B · Booth 14"
  booth_hours      text,         -- e.g. "09:00 – 18:00"
  offerings        jsonb not null default '[]'::jsonb,   -- string[]
  team_members     jsonb not null default '[]'::jsonb,   -- {name, role, avatar_url}[]
  tier             text not null default 'standard'
                     check (tier in ('platinum','gold','silver','standard')),
  position         int not null default 0,
  is_visible       boolean not null default true,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);
create index if not exists sponsors_event_idx on sponsors(event_id, is_visible);

-- ─── sponsor_leads ────────────────────────────────────────────────────────────
-- Leads captured by exhibitors via lead scanner (w25)
create table if not exists sponsor_leads (
  id               uuid primary key default gen_random_uuid(),
  sponsor_id       uuid not null references sponsors(id) on delete cascade,
  event_id         uuid not null references events(id) on delete cascade,
  registration_id  uuid references registrations(id) on delete set null,
  attendee_name    text,
  attendee_email   text,
  note             text,
  rating           text check (rating in ('hot','warm','cold')),
  created_at       timestamptz not null default now()
);
create index if not exists leads_sponsor_idx on sponsor_leads(sponsor_id);
create index if not exists leads_event_idx   on sponsor_leads(event_id);

-- ─── white_label_settings ─────────────────────────────────────────────────────
-- Per-organizer white-label brand overrides (w29)
create table if not exists white_label_settings (
  user_id          uuid primary key references profiles(id) on delete cascade,
  brand_name       text,
  primary_color    text not null default '#1F4D3A',
  logo_url         text,
  favicon_url      text,
  custom_domain    text,
  domain_verified  boolean not null default false,
  from_name        text,
  reply_to_email   text,
  hide_powered_by  boolean not null default false,
  updated_at       timestamptz not null default now()
);

-- ─── call_for_papers ──────────────────────────────────────────────────────────
-- CFP configuration per event (w30)
create table if not exists call_for_papers (
  id               uuid primary key default gen_random_uuid(),
  event_id         uuid not null references events(id) on delete cascade,
  is_open          boolean not null default true,
  deadline_at      timestamptz,
  categories       text[] not null default '{}',
  max_words        int not null default 400,
  allow_pdf        boolean not null default true,
  instructions     text,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  unique (event_id)
);
create index if not exists cfp_event_idx on call_for_papers(event_id);

-- ─── abstracts ────────────────────────────────────────────────────────────────
-- Speaker abstract submissions (w30 public form → w31 organizer review)
create table if not exists abstracts (
  id               uuid primary key default gen_random_uuid(),
  event_id         uuid not null references events(id) on delete cascade,
  cfp_id           uuid references call_for_papers(id) on delete cascade,
  title            text not null,
  body             text not null,
  authors          text,                         -- denormalized: "Name (Org) · Name (Org)"
  authors_json     jsonb not null default '[]'::jsonb,  -- [{name,email,affiliation,presenting}]
  keywords         text[] not null default '{}',
  category         text,
  pdf_url          text,
  status           text not null default 'pending'
                     check (status in ('pending','accept','reject','revision','waitlist')),
  review_notes     text,
  assigned_session uuid references sessions(id) on delete set null,
  submitted_at     timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);
create index if not exists abstracts_event_idx  on abstracts(event_id, status);
create index if not exists abstracts_cfp_idx    on abstracts(cfp_id);

-- ─── RLS ──────────────────────────────────────────────────────────────────────
alter table sponsors              enable row level security;
alter table sponsor_leads         enable row level security;
alter table white_label_settings  enable row level security;
alter table call_for_papers       enable row level security;
alter table abstracts             enable row level security;

-- sponsors: public can read visible ones; event owners can write
do $$ begin
  if not exists (select 1 from pg_policies where tablename='sponsors' and policyname='public_read') then
    create policy public_read on sponsors for select using (is_visible = true);
  end if;
end $$;
do $$ begin
  if not exists (select 1 from pg_policies where tablename='sponsors' and policyname='owner_write') then
    create policy owner_write on sponsors for all
      using  (event_id in (select id from events where user_id = auth.uid()))
      with check (event_id in (select id from events where user_id = auth.uid()));
  end if;
end $$;

-- sponsor_leads: exhibitors (matched by sponsor owner email) can read their own; event owners can read all
do $$ begin
  if not exists (select 1 from pg_policies where tablename='sponsor_leads' and policyname='public_insert') then
    create policy public_insert on sponsor_leads for insert with check (true);
  end if;
end $$;
do $$ begin
  if not exists (select 1 from pg_policies where tablename='sponsor_leads' and policyname='owner_read') then
    create policy owner_read on sponsor_leads for select
      using (event_id in (select id from events where user_id = auth.uid()));
  end if;
end $$;

-- white_label_settings: only the owning user
do $$ begin
  if not exists (select 1 from pg_policies where tablename='white_label_settings' and policyname='owner_all') then
    create policy owner_all on white_label_settings for all
      using (user_id = auth.uid()) with check (user_id = auth.uid());
  end if;
end $$;

-- call_for_papers: public read open CFPs; event owner writes
do $$ begin
  if not exists (select 1 from pg_policies where tablename='call_for_papers' and policyname='public_read') then
    create policy public_read on call_for_papers for select using (is_open = true);
  end if;
end $$;
do $$ begin
  if not exists (select 1 from pg_policies where tablename='call_for_papers' and policyname='owner_write') then
    create policy owner_write on call_for_papers for all
      using  (event_id in (select id from events where user_id = auth.uid()))
      with check (event_id in (select id from events where user_id = auth.uid()));
  end if;
end $$;

-- abstracts: public can insert (anyone can submit); event owners can read + update
do $$ begin
  if not exists (select 1 from pg_policies where tablename='abstracts' and policyname='public_insert') then
    create policy public_insert on abstracts for insert with check (true);
  end if;
end $$;
do $$ begin
  if not exists (select 1 from pg_policies where tablename='abstracts' and policyname='owner_all') then
    create policy owner_all on abstracts for all
      using  (event_id in (select id from events where user_id = auth.uid()))
      with check (event_id in (select id from events where user_id = auth.uid()));
  end if;
end $$;
