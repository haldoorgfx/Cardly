-- ============================================================
-- Migration 007 — Content CMS (Phase 3)
-- Idempotent: safe to run multiple times.
--
-- Manual steps (Supabase dashboard, not SQL):
--   Storage → New bucket → name: "cms-media"
--   Set bucket to Public (media URLs are served publicly)
-- ============================================================

-- ── 1. cms_pages ─────────────────────────────────────────────
create table if not exists cms_pages (
  id               uuid        primary key default gen_random_uuid(),
  slug             text        unique not null,
  title            text        not null,
  status           text        not null default 'draft'
                               check (status in ('draft', 'published')),
  seo              jsonb       not null default '{}'::jsonb,
  published_version int,
  created_by       uuid        references profiles(id),
  updated_at       timestamptz not null default now()
);

alter table cms_pages enable row level security;

do $$ begin
  if not exists (select 1 from pg_policies where tablename = 'cms_pages' and policyname = 'cms_pages_public_read') then
    execute $p$
      create policy "cms_pages_public_read"
        on cms_pages for select to public
        using (status = 'published')
    $p$;
  end if;
end $$;

-- ── 2. cms_blocks ─────────────────────────────────────────────
create table if not exists cms_blocks (
  id         uuid        primary key default gen_random_uuid(),
  page_id    uuid        not null references cms_pages(id) on delete cascade,
  type       text        not null,
  content    jsonb       not null default '{}'::jsonb,
  position   int         not null default 0,
  created_at timestamptz not null default now()
);

alter table cms_blocks enable row level security;

do $$ begin
  if not exists (select 1 from pg_policies where tablename = 'cms_blocks' and policyname = 'cms_blocks_public_read') then
    execute $p$
      create policy "cms_blocks_public_read"
        on cms_blocks for select to public
        using (
          exists (
            select 1 from cms_pages
            where id = cms_blocks.page_id and status = 'published'
          )
        )
    $p$;
  end if;
end $$;

-- ── 3. cms_navigation ─────────────────────────────────────────
create table if not exists cms_navigation (
  id         uuid        primary key default gen_random_uuid(),
  location   text        not null check (location in ('header', 'footer')),
  items      jsonb       not null default '[]'::jsonb,
  updated_at timestamptz not null default now(),
  constraint cms_navigation_location_unique unique (location)
);

alter table cms_navigation enable row level security;

do $$ begin
  if not exists (select 1 from pg_policies where tablename = 'cms_navigation' and policyname = 'cms_navigation_public_read') then
    execute $p$
      create policy "cms_navigation_public_read"
        on cms_navigation for select to public
        using (true)
    $p$;
  end if;
end $$;

-- Seed default navigation rows if not present
insert into cms_navigation (location, items)
  values
    ('header', '[
      {"label": "Use cases",    "href": "/use-cases"},
      {"label": "How it works", "href": "/how-it-works"},
      {"label": "Pricing",      "href": "/pricing"}
    ]'::jsonb),
    ('footer', '[
      {"label": "Product",  "children": [
        {"label": "Use cases",    "href": "/use-cases"},
        {"label": "How it works", "href": "/how-it-works"},
        {"label": "Pricing",      "href": "/pricing"},
        {"label": "What''s new",  "href": "/whats-new"}
      ]},
      {"label": "Company", "children": [
        {"label": "About",    "href": "/about"},
        {"label": "Blog",     "href": "/blog"},
        {"label": "Contact",  "href": "/contact"},
        {"label": "Partners", "href": "/partners"}
      ]},
      {"label": "Resources", "children": [
        {"label": "Help center", "href": "/help"},
        {"label": "Privacy",     "href": "/privacy"},
        {"label": "Terms",       "href": "/terms"},
        {"label": "Status",      "href": "/status"}
      ]}
    ]'::jsonb)
  on conflict (location) do nothing;

-- ── 4. cms_media ──────────────────────────────────────────────
create table if not exists cms_media (
  id          uuid        primary key default gen_random_uuid(),
  url         text        not null,
  filename    text,
  alt         text,
  width       int,
  height      int,
  size_bytes  int,
  mime        text,
  uploaded_by uuid        references profiles(id),
  created_at  timestamptz not null default now()
);

alter table cms_media enable row level security;

do $$ begin
  if not exists (select 1 from pg_policies where tablename = 'cms_media' and policyname = 'cms_media_public_read') then
    execute $p$
      create policy "cms_media_public_read"
        on cms_media for select to public
        using (true)
    $p$;
  end if;
end $$;

-- ── 5. cms_page_versions ──────────────────────────────────────
create table if not exists cms_page_versions (
  id         uuid        primary key default gen_random_uuid(),
  page_id    uuid        not null references cms_pages(id) on delete cascade,
  version_num int        not null default 1,
  snapshot   jsonb       not null,
  created_by uuid        references profiles(id),
  created_at timestamptz not null default now()
);

alter table cms_page_versions enable row level security;
-- Versions are admin-only — no public policy. Service-role client only.

-- ── Done ──────────────────────────────────────────────────────
