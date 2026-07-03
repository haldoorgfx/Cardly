-- ============================================================================
-- 049_notifications_realtime_and_devices.sql
-- Live in-app notifications (realtime) + device push-token storage (FCM).
-- Idempotent — paste into Supabase → SQL Editor → Run.
-- ============================================================================

-- 1) LIVE IN-APP NOTIFICATIONS -----------------------------------------------
-- Add `notifications` to the realtime publication so the mobile app receives
-- inserts/updates instantly (the app's realtime subscription needs this).
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'notifications'
  ) then
    alter publication supabase_realtime add table public.notifications;
  end if;
end $$;


-- 2) DEVICE PUSH TOKENS (FCM) ------------------------------------------------
-- One row per device. The mobile app upserts its Firebase Cloud Messaging
-- token here on sign-in; the push sender reads it to deliver notifications.
create table if not exists public.user_devices (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users(id) on delete cascade,
  fcm_token  text not null,
  platform   text default 'android',   -- 'android' | 'ios'
  updated_at timestamptz default now(),
  created_at timestamptz default now(),
  unique (fcm_token)
);

create index if not exists user_devices_user_idx on public.user_devices(user_id);

alter table public.user_devices enable row level security;

drop policy if exists "user_devices own" on public.user_devices;
create policy "user_devices own" on public.user_devices
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
