-- ============================================================
-- Migration 006 — Admin Management Panels (Phase 2)
-- Idempotent: safe to run multiple times.
--
-- Manual steps (Supabase dashboard, not SQL):
--   Storage → New bucket → name: "templates"
--   Set bucket to Public (thumbnail/background URLs are public)
-- ============================================================

-- ── 1. profiles — suspension fields ──────────────────────────
alter table profiles
  add column if not exists suspended        boolean     not null default false,
  add column if not exists suspended_at     timestamptz,
  add column if not exists suspended_reason text;

-- ── 2. templates table ───────────────────────────────────────
create table if not exists templates (
  id             uuid        primary key default gen_random_uuid(),
  name           text        not null,
  category       text,
  thumbnail_url  text,
  background_url text,
  dimensions     jsonb,
  zones          jsonb       not null default '[]'::jsonb,
  min_plan       text        not null default 'free'
                             check (min_plan in ('free', 'pro', 'studio')),
  featured       boolean     not null default false,
  published      boolean     not null default false,
  created_by     uuid        references profiles(id),
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

-- RLS: enable and allow authenticated users to read published templates.
-- All admin writes go through the service-role client (bypasses RLS).
alter table templates enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where tablename = 'templates'
      and policyname = 'templates_select_published'
  ) then
    execute $policy$
      create policy "templates_select_published"
        on templates
        for select
        to authenticated
        using (published = true)
    $policy$;
  end if;
end
$$;

-- ── 3. events — moderation column ────────────────────────────
alter table events
  add column if not exists moderation_status text not null default 'ok'
    check (moderation_status in ('ok', 'flagged', 'removed'));

-- ── Done ─────────────────────────────────────────────────────
-- Sub-phase 2.1: profiles.suspended used for user management
-- Sub-phase 2.3: templates table used for admin template CRUD
-- Sub-phase 2.4: events.moderation_status used for event oversight
