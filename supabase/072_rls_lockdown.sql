-- 072_rls_lockdown.sql
-- ─────────────────────────────────────────────────────────────────────────────
-- CRITICAL PRODUCTION SECURITY FIX. Paste the WHOLE file into the Supabase SQL
-- editor and run once. Safe + idempotent.
--
-- WHAT WAS WRONG (verified live 2026-07-07 with only the public anon key, no login):
--   • registrations — the `public_attendee_wall` policy (054) allowed anon to
--     SELECT confirmed rows of any public event. RLS is row-level, so `select=*`
--     returned the WHOLE row: attendee_email, phone, custom fields, amount_paid,
--     payment-intent ids, and qr_code_token (a working check-in credential).
--   • profiles — `public_profile_read` (053) exposed full rows of organizers +
--     attendees: email, phone, plan, role (incl. super_admin), stripe_customer_id.
--   • sponsors — `public_read using(is_visible=true)` (023) exposed invite_token,
--     the bearer credential for the exhibitor lead portal → booth/lead takeover.
--   • sponsor_members / sponsor_resources — `public_all using(true)` (027):
--     full anon read AND write of booth team PII and resources.
--
-- ROOT CAUSE: "public read" policies were written at the ROW level on tables
-- whose rows mix public columns (name, logo) with secrets. Postgres RLS cannot
-- filter columns, so any public row policy leaks the entire row.
--
-- THE FIX: lock the base tables to owner / own-row only, and expose the genuinely
-- public data through SAFE-COLUMN VIEWS (public_profiles, public_sponsors) that
-- omit every secret. The web app already reads these tables via the service-role
-- client server-side, so it is unaffected. The mobile app is repointed at the
-- new views in the same change set.
-- ─────────────────────────────────────────────────────────────────────────────


-- ── 1. registrations — remove the public wall; keep owner + own-attendee reads ─
do $$ begin
  if to_regclass('public.registrations') is not null then
    alter table public.registrations enable row level security;
    -- THE LEAK: drop it. No public/anon read of registrations at all.
    drop policy if exists public_attendee_wall on public.registrations;
    -- (owner_all, attendee_read, public_insert from 017/047 remain and are correct:
    --  organizers read their event's rows, attendees read their own, anyone inserts.)
  end if;
end $$;


-- ── 1b. Safe "who's attending" wall — replaces the dropped public policy ──────
-- Returns ONLY display name + user_id (for avatar lookup) for confirmed
-- attendees of a PUBLIC event. No email, phone, token, or amount. SECURITY
-- DEFINER so it can read past the now-locked registrations RLS, but it only
-- ever projects these two safe columns.
create or replace function public.event_public_attendees(p_event_id uuid)
returns table (attendee_name text, user_id uuid)
language sql
security definer
set search_path = public
as $$
  select r.attendee_name, r.user_id
  from registrations r
  where r.event_id = p_event_id
    and r.status in ('confirmed', 'checked_in')
    and r.event_id in (select event_id from event_pages where is_public = true)
  order by r.created_at desc
  limit 100;
$$;

grant execute on function public.event_public_attendees(uuid) to anon, authenticated;


-- ── 2. profiles — own-row only on the base table; safe columns via a view ──────
do $$ begin
  if to_regclass('public.profiles') is not null then
    alter table public.profiles enable row level security;

    -- THE LEAK: drop the broad public read that exposed email/phone/role/stripe.
    drop policy if exists public_profile_read on public.profiles;

    -- Re-assert own-row access (full columns) for the signed-in user.
    drop policy if exists "profiles: own select" on public.profiles;
    create policy "profiles: own select" on public.profiles
      for select using (id = auth.uid());

    drop policy if exists "profiles: own update" on public.profiles;
    create policy "profiles: own update" on public.profiles
      for update using (id = auth.uid()) with check (id = auth.uid());

    drop policy if exists "profiles: own insert" on public.profiles;
    create policy "profiles: own insert" on public.profiles
      for insert with check (id = auth.uid());
  end if;
end $$;

-- Public, SAFE-column projection of profiles for organizer/speaker cards,
-- avatars and follow suggestions. No email, phone, plan, role, or Stripe ids.
-- A view is owned by postgres and (security_invoker off = default) bypasses the
-- base-table RLS, so anon can read exactly these columns and nothing else.
create or replace view public.public_profiles as
  select id, full_name, avatar_url, bio, organization, city
  from public.profiles;

grant select on public.public_profiles to anon, authenticated;


-- ── 3. sponsors — booth owner reads own row; public display via a safe view ───
do $$ begin
  if to_regclass('public.sponsors') is not null then
    alter table public.sponsors enable row level security;

    -- THE LEAK: drop the public read that exposed invite_token + contact_email.
    drop policy if exists public_read on public.sponsors;

    -- The sponsor who owns the booth (matched by their account email) may read
    -- their own full row — this is how the mobile booth tools get their token.
    drop policy if exists "sponsors: self read" on public.sponsors;
    create policy "sponsors: self read" on public.sponsors
      for select using (
        lower(contact_email) = lower((select email from public.profiles where id = auth.uid()))
      );
    -- (owner_write / owner_all for the event organizer remain from 023.)
  end if;
end $$;

-- Public, SAFE-column projection of visible sponsors for event pages. No
-- invite_token, contact_email, or team_members.
create or replace view public.public_sponsors as
  select id, event_id, company_name, tagline, description, logo_url, cover_url,
         website_url, meeting_url, booth_location, booth_hours, offerings,
         tier, position
  from public.sponsors
  where is_visible = true;

grant select on public.public_sponsors to anon, authenticated;


-- ── 4. sponsor_members / sponsor_resources — no more public_all ────────────────
do $$ begin
  if to_regclass('public.sponsor_members') is not null then
    alter table public.sponsor_members enable row level security;
    drop policy if exists public_all on public.sponsor_members;
    -- Event organizer manages the booth team; the member reads their own row.
    drop policy if exists "sponsor_members: owner all" on public.sponsor_members;
    create policy "sponsor_members: owner all" on public.sponsor_members
      for all using (
        sponsor_id in (
          select s.id from public.sponsors s
          join public.events e on e.id = s.event_id
          where e.user_id = auth.uid()
        )
      ) with check (
        sponsor_id in (
          select s.id from public.sponsors s
          join public.events e on e.id = s.event_id
          where e.user_id = auth.uid()
        )
      );
    drop policy if exists "sponsor_members: self read" on public.sponsor_members;
    create policy "sponsor_members: self read" on public.sponsor_members
      for select using (
        user_id = auth.uid()
        or lower(invited_email) = lower((select email from public.profiles where id = auth.uid()))
      );
  end if;
end $$;

do $$ begin
  if to_regclass('public.sponsor_resources') is not null then
    alter table public.sponsor_resources enable row level security;
    drop policy if exists public_all on public.sponsor_resources;
    -- Event organizer manages resources; visible ones are public per booth.
    drop policy if exists "sponsor_resources: owner all" on public.sponsor_resources;
    create policy "sponsor_resources: owner all" on public.sponsor_resources
      for all using (
        sponsor_id in (
          select s.id from public.sponsors s
          join public.events e on e.id = s.event_id
          where e.user_id = auth.uid()
        )
      ) with check (
        sponsor_id in (
          select s.id from public.sponsors s
          join public.events e on e.id = s.event_id
          where e.user_id = auth.uid()
        )
      );
    drop policy if exists "sponsor_resources: public read" on public.sponsor_resources;
    create policy "sponsor_resources: public read" on public.sponsor_resources
      for select using (
        sponsor_id in (select id from public.sponsors where is_visible = true)
      );
  end if;
end $$;


-- ── 5. Sanity: after running, re-run the live probes. All must return 0 rows to
--       an anonymous caller:
--   /rest/v1/registrations?select=id,attendee_email  → []
--   /rest/v1/profiles?select=id,email                → []
--   /rest/v1/sponsors?select=invite_token            → []
--   /rest/v1/public_profiles?select=full_name        → still works (safe cols)
--   /rest/v1/public_sponsors?select=company_name     → still works (safe cols)
