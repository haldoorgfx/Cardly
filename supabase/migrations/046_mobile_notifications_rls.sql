-- 046_mobile_notifications_rls.sql
-- Let the mobile app (an authenticated attendee) read and update their OWN
-- notifications directly with the anon/authed key.
--
-- Why this is needed: the web reads notifications through the service-role
-- admin client (which bypasses RLS), so no user-facing SELECT/UPDATE policy
-- ever existed. The mobile app queries as the signed-in user, so it needs an
-- own-row policy or the notifications screen comes back empty.
--
-- Safe + idempotent: only runs if the table exists; drops policies before
-- recreating them.

do $$
begin
  if exists (
    select 1 from information_schema.tables
    where table_schema = 'public' and table_name = 'notifications'
  ) then

    alter table public.notifications enable row level security;

    drop policy if exists "notifications: own select" on public.notifications;
    create policy "notifications: own select" on public.notifications
      for select using (auth.uid() = user_id);

    drop policy if exists "notifications: own update" on public.notifications;
    create policy "notifications: own update" on public.notifications
      for update using (auth.uid() = user_id)
      with check (auth.uid() = user_id);

  end if;
end $$;
