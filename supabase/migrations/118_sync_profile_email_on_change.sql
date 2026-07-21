-- 118: keep public.profiles.email in sync with auth.users.email
--
-- Migration 001 created `handle_new_user`, which copies the email into
-- public.profiles on INSERT only. Nothing ever updated it again, so from the
-- moment a user changed their sign-in email the two disagreed permanently.
--
-- That matters far more than a stale display string, because profiles.email is
-- used as an AUTHORIZATION key in several places:
--
--   lib/rbac/ownership.ts      speaker / sponsor record ownership
--   lib/rbac/sections.ts       which dashboard sections you can see
--   lib/workspace/eventRoles.ts, lib/rbac/context.ts
--   app/api/billing/*          the address Stripe bills and receipts
--   app/api/render/route.ts    where card-download notifications are sent
--
-- Two concrete consequences of the drift:
--   1. Change your email, and speaker/sponsor portal access keyed to your NEW
--      address is never granted — while access keyed to the OLD one persists.
--   2. Once you vacate the old address, someone else can sign up with it. Their
--      profiles.email and your stale profiles.email are then IDENTICAL, so an
--      `.eq('email', …)` / `.ilike('email', …)` match grants BOTH accounts the
--      same speaker/sponsor ownership.
--
-- The trigger is the canonical fix: it covers every path that can change an
-- email (web, mobile, the Supabase dashboard, admin API) rather than only the
-- one the web app happens to call. app/auth/callback/route.ts additionally
-- reconciles opportunistically so confirmed changes self-heal even before this
-- migration is applied.
--
-- Note the guard on `new.email is distinct from old.email` — auth.users is
-- updated on every sign-in (last_sign_in_at), and without it this would fire a
-- pointless profiles UPDATE on each one.

create or replace function public.sync_profile_email()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  update public.profiles
     set email = new.email
   where id = new.id
     and email is distinct from new.email;
  return new;
end;
$$;

drop trigger if exists on_auth_user_email_changed on auth.users;
create trigger on_auth_user_email_changed
  after update of email on auth.users
  for each row
  when (new.email is distinct from old.email)
  execute function public.sync_profile_email();

-- One-off backfill for accounts that already drifted before this shipped.
-- auth.users is the source of truth: it is what the user actually signs in with.
update public.profiles p
   set email = u.email
  from auth.users u
 where u.id = p.id
   and p.email is distinct from u.email;
