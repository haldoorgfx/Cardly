-- Event staff / team members with scoped roles
create table if not exists event_staff (
  id          uuid primary key default gen_random_uuid(),
  event_id    uuid not null references events(id) on delete cascade,
  owner_id    uuid not null references profiles(id) on delete cascade,
  email       text not null,
  role        text not null check (role in ('check_in','moderator','finance','manager')),
  status      text not null default 'pending' check (status in ('pending','active','removed')),
  expires     text default '24h_after',  -- 24h_after | on_end | never
  last_seen   timestamptz,
  invited_at  timestamptz default now(),
  created_at  timestamptz default now()
);

create index if not exists event_staff_event_idx on event_staff(event_id);
create index if not exists event_staff_owner_idx on event_staff(owner_id);
