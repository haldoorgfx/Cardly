-- ============================================================================
-- 072_announcements.sql
--
-- Event announcements sent by the organizer from the mobile app
-- (Organizer → Announcements). The Flutter screen records each broadcast and
-- lists the history via two SECURITY DEFINER RPCs (the mobile app talks to
-- Supabase directly, so authorization is enforced server-side — same ownership
-- pattern as 058_checkin_rpc.sql / 062_staff_attendee_list.sql).
--
--   record_announcement(p_event_id, p_title, p_body, p_sent_count) → jsonb  (owner ONLY; returns inserted row)
--   list_event_announcements(p_event_id)                           → rows   (owner OR active staff; newest first)
--
-- "Active staff" = the event owner (events.user_id) OR a user_event_roles row
-- (from 055) with role in ('staff','organizer') and status = 'active'.
--
-- Idempotent. Apply in the Supabase SQL editor. Does NOT touch applied migrations.
-- ============================================================================

-- 1. Table.
create table if not exists public.announcements (
  id          uuid primary key default gen_random_uuid(),
  event_id    uuid not null references public.events(id) on delete cascade,
  title       text,
  body        text not null,
  audience    text default 'everyone',
  sent_count  int  default 0,
  created_by  uuid,
  created_at  timestamptz default now()
);

create index if not exists announcements_event_idx on public.announcements(event_id, created_at desc);


-- 2. RLS: owner OR active staff may READ; owner may WRITE.
alter table public.announcements enable row level security;

-- (a) Owner / active staff read.
drop policy if exists "announcements: owner or staff read" on public.announcements;
create policy "announcements: owner or staff read" on public.announcements
  for select using (
    exists (select 1 from public.events e where e.id = event_id and e.user_id = auth.uid())
    or exists (
      select 1 from public.user_event_roles
      where event_id = announcements.event_id and user_id = auth.uid()
        and role in ('staff','organizer') and status = 'active'
    )
  );

-- (b) Owner writes (insert/update/delete). RPCs run SECURITY DEFINER, but these
--     policies keep any direct authed writes owner-scoped.
drop policy if exists "announcements: owner insert" on public.announcements;
create policy "announcements: owner insert" on public.announcements
  for insert with check (
    exists (select 1 from public.events e where e.id = event_id and e.user_id = auth.uid())
  );

drop policy if exists "announcements: owner update" on public.announcements;
create policy "announcements: owner update" on public.announcements
  for update using (
    exists (select 1 from public.events e where e.id = event_id and e.user_id = auth.uid())
  );

drop policy if exists "announcements: owner delete" on public.announcements;
create policy "announcements: owner delete" on public.announcements
  for delete using (
    exists (select 1 from public.events e where e.id = event_id and e.user_id = auth.uid())
  );


-- 3. record_announcement — OWNER ONLY. Inserts and returns the row as jsonb.
create or replace function public.record_announcement(
  p_event_id   uuid,
  p_title      text,
  p_body       text,
  p_sent_count int
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid   uuid := auth.uid();
  v_owner uuid;
  v_row   public.announcements%rowtype;
begin
  if v_uid is null then
    return jsonb_build_object('error','Not signed in');
  end if;

  select user_id into v_owner from public.events where id = p_event_id;
  if v_owner is null then
    return jsonb_build_object('error','Event not found');
  end if;

  -- Only the event owner may broadcast announcements.
  if v_owner <> v_uid then
    return jsonb_build_object('error','Not authorised for this event');
  end if;

  insert into public.announcements (event_id, title, body, sent_count, created_by)
  values (p_event_id, p_title, p_body, coalesce(p_sent_count, 0), v_uid)
  returning * into v_row;

  return jsonb_build_object(
    'id',          v_row.id,
    'event_id',    v_row.event_id,
    'title',       v_row.title,
    'body',        v_row.body,
    'audience',    v_row.audience,
    'sent_count',  v_row.sent_count,
    'created_by',  v_row.created_by,
    'created_at',  v_row.created_at
  );
end;
$$;


-- 4. list_event_announcements — owner OR active staff. Newest first.
create or replace function public.list_event_announcements(p_event_id uuid)
returns table (
  id          uuid,
  event_id    uuid,
  title       text,
  body        text,
  audience    text,
  sent_count  int,
  created_by  uuid,
  created_at  timestamptz
)
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_uid   uuid := auth.uid();
  v_owner uuid;
begin
  if v_uid is null then return; end if;
  select user_id into v_owner from public.events where id = p_event_id;
  if v_owner is null then return; end if;

  -- Owner, OR an active staff member for this event.
  if v_owner <> v_uid and not exists (
    select 1 from public.user_event_roles
    where event_id = p_event_id and user_id = v_uid
      and role in ('staff','organizer') and status = 'active'
  ) then
    return;  -- not authorised → empty set
  end if;

  return query
    select a.id, a.event_id, a.title, a.body, a.audience,
           a.sent_count, a.created_by, a.created_at
    from public.announcements a
    where a.event_id = p_event_id
    order by a.created_at desc;
end;
$$;


grant execute on function public.record_announcement(uuid, text, text, int) to authenticated;
grant execute on function public.list_event_announcements(uuid)             to authenticated;
