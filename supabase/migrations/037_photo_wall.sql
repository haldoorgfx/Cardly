-- Photo wall: attendee-uploaded photos during events
create table if not exists event_photos (
  id           uuid primary key default gen_random_uuid(),
  event_id     uuid not null references events(id) on delete cascade,
  uploader_id  uuid references profiles(id) on delete set null,
  attendee_name text,
  image_url    text not null,
  caption      text,
  status       text not null default 'pending' check (status in ('pending','approved','rejected','featured')),
  likes        int not null default 0,
  day_label    text,
  created_at   timestamptz default now()
);

create index if not exists event_photos_event_idx on event_photos(event_id);
create index if not exists event_photos_status_idx on event_photos(event_id, status);
