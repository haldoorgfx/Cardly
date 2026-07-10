-- ============================================================================
-- 069_whatsapp.sql   (Group G3)
--
-- PURPOSE
--   WhatsApp Business notifications: connect a WABA, keep a template library,
--   build a per-event journey automation, and send/track broadcasts.
--     • register 'whatsapp' as a provider in 047_integrations (extend, no fork)
--     • whatsapp_connections   — connected WABA phone numbers (W01)
--     • message_templates      — template library w/ approval status (W01/W03)
--     • notification_automations — per-event journey steps + channels (W02)
--     • broadcasts             — announcement history (W04)
--
-- DEPENDS ON
--   • 047_integrations     → user_integrations.provider CHECK (extended here)
--   • 055_user_event_roles → user_event_roles (staff auth)
--   • 067 (this batch)     → can_manage_event() (redefined here, self-contained)
--
-- IDEMPOTENT: drop+recreate constraint, create table if not exists,
--   drop policy if exists + create policy, create or replace function.
-- HOW TO APPLY: paste this whole file into the Supabase SQL editor and Run.
-- ============================================================================


-- ─────────────────────────────────────────────────────────────────────────────
-- 0. Auth helper (self-contained; identical to 067's definition).
-- ─────────────────────────────────────────────────────────────────────────────
create or replace function public.can_manage_event(p_event_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.events e
    where e.id = p_event_id and e.user_id = auth.uid()
  ) or exists (
    select 1 from public.user_event_roles r
    where r.event_id = p_event_id
      and r.user_id = auth.uid()
      and r.role in ('staff','organizer')
      and r.status = 'active'
  );
$$;

revoke all on function public.can_manage_event(uuid) from public;
grant execute on function public.can_manage_event(uuid) to authenticated;


-- ─────────────────────────────────────────────────────────────────────────────
-- 1. Register 'whatsapp' as a provider on the existing 047 integrations table
--    rather than inventing a parallel concept. The paste-credential config
--    (waba_id, phone_number_id, access token, etc.) lives in the shared jsonb.
-- ─────────────────────────────────────────────────────────────────────────────
alter table public.user_integrations
  drop constraint if exists user_integrations_provider_check;

alter table public.user_integrations
  add constraint user_integrations_provider_check
  check (provider in (
    'slack', 'zapier', 'google_sheets', 'mailchimp', 'hubspot', 'whatsapp'
  ));


-- ─────────────────────────────────────────────────────────────────────────────
-- 2. whatsapp_connections — a connected WhatsApp Business phone number.
--    event_id nullable so an org can connect once and reuse across events.
-- ─────────────────────────────────────────────────────────────────────────────
create table if not exists public.whatsapp_connections (
  id            uuid primary key default gen_random_uuid(),
  event_id      uuid references public.events(id) on delete cascade,
  owner_id      uuid not null references auth.users(id) on delete cascade,
  phone_number  text not null,
  waba_id       text,
  status        text not null default 'pending'
                  check (status in ('connected','pending','disconnected')),
  created_at    timestamptz not null default now()
);

create index if not exists whatsapp_connections_event_idx on public.whatsapp_connections(event_id);
create index if not exists whatsapp_connections_owner_idx on public.whatsapp_connections(owner_id);

alter table public.whatsapp_connections enable row level security;

drop policy if exists "wa_conn_manage" on public.whatsapp_connections;
create policy "wa_conn_manage" on public.whatsapp_connections
  for all
  using (owner_id = auth.uid() or (event_id is not null and public.can_manage_event(event_id)))
  with check (owner_id = auth.uid() or (event_id is not null and public.can_manage_event(event_id)));


-- ─────────────────────────────────────────────────────────────────────────────
-- 3. message_templates — WhatsApp template library (W01/W03).
--    event_id nullable → org-level templates reusable across events; owner_id
--    scopes those org-level rows when event_id is null.
-- ─────────────────────────────────────────────────────────────────────────────
create table if not exists public.message_templates (
  id               uuid primary key default gen_random_uuid(),
  event_id         uuid references public.events(id) on delete cascade,
  owner_id         uuid not null references auth.users(id) on delete cascade,
  name             text not null,
  category         text not null default 'utility'
                     check (category in ('utility','marketing','authentication')),
  approval_status  text not null default 'pending'
                     check (approval_status in ('approved','pending','rejected')),
  body             text,
  buttons          jsonb not null default '[]'::jsonb,
  created_at       timestamptz not null default now()
);

create index if not exists message_templates_event_idx on public.message_templates(event_id);
create index if not exists message_templates_owner_idx on public.message_templates(owner_id);

alter table public.message_templates enable row level security;

drop policy if exists "msg_tpl_manage" on public.message_templates;
create policy "msg_tpl_manage" on public.message_templates
  for all
  using (owner_id = auth.uid() or (event_id is not null and public.can_manage_event(event_id)))
  with check (owner_id = auth.uid() or (event_id is not null and public.can_manage_event(event_id)));


-- ─────────────────────────────────────────────────────────────────────────────
-- 4. notification_automations — per-event journey steps (W02).
--    One row per (event, step); channels toggles email/whatsapp/sms.
-- ─────────────────────────────────────────────────────────────────────────────
create table if not exists public.notification_automations (
  id          uuid primary key default gen_random_uuid(),
  event_id    uuid not null references public.events(id) on delete cascade,
  step        text not null
                check (step in ('registration','d7','d1','h1','during','post')),
  enabled     boolean not null default false,
  channels    jsonb not null default '{"email":true,"whatsapp":false,"sms":false}'::jsonb,
  created_at  timestamptz not null default now(),
  unique (event_id, step)
);

create index if not exists notification_automations_event_idx on public.notification_automations(event_id);

alter table public.notification_automations enable row level security;

drop policy if exists "notif_auto_manage" on public.notification_automations;
create policy "notif_auto_manage" on public.notification_automations
  for all
  using (public.can_manage_event(event_id))
  with check (public.can_manage_event(event_id));


-- ─────────────────────────────────────────────────────────────────────────────
-- 5. broadcasts — announcement send history (W04).
-- ─────────────────────────────────────────────────────────────────────────────
create table if not exists public.broadcasts (
  id          uuid primary key default gen_random_uuid(),
  event_id    uuid not null references public.events(id) on delete cascade,
  body        text not null,
  audience    jsonb not null default '{}'::jsonb,
  channels    jsonb not null default '{}'::jsonb,
  sent_count  int not null default 0,
  status      text not null default 'draft'
                check (status in ('draft','queued','sending','sent','failed')),
  created_by  uuid references auth.users(id) on delete set null,
  created_at  timestamptz not null default now()
);

create index if not exists broadcasts_event_idx on public.broadcasts(event_id);

alter table public.broadcasts enable row level security;

drop policy if exists "broadcasts_manage" on public.broadcasts;
create policy "broadcasts_manage" on public.broadcasts
  for all
  using (public.can_manage_event(event_id))
  with check (public.can_manage_event(event_id));
