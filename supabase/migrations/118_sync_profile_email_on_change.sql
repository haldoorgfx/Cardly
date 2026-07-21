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
--   2. THE OLD ADDRESS BECOMES PERMANENTLY UNUSABLE FOR SIGNUP. Once you vacate
--      it, someone else can create an auth.users row with it — but
--      `profiles.email` is UNIQUE (001), your stale row still holds that
--      address, and `handle_new_user` inserts with no `on conflict`. The trigger
--      raises, and because it is AFTER INSERT in the same transaction the
--      auth.users insert rolls back with it. Their signup fails outright, with
--      an opaque error, and will keep failing forever.
--
--      (An earlier draft of this file claimed the two accounts would instead
--      SHARE speaker/sponsor ownership through the duplicate email. They cannot
--      — the unique constraint makes that state unreachable. The failure is a
--      blocked signup, not a shared identity. Recorded because the wrong version
--      is the more intuitive one and will be re-derived otherwise.)
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
--
-- The `not exists` guard matters. profiles.email is UNIQUE, so if some OTHER
-- profile row already holds the address we are about to write, this UPDATE
-- would raise — and because it is one statement, it would abort the entire
-- migration, including the trigger above. Skipping the conflicting rows means
-- the trigger still lands and the rest of the backfill still runs; the
-- stragglers are then reported below rather than silently dropped.
update public.profiles p
   set email = u.email
  from auth.users u
 where u.id = p.id
   and p.email is distinct from u.email
   and not exists (
     select 1 from public.profiles other
      where other.email = u.email
        and other.id <> p.id
   );

-- Report anything the guard skipped. These are genuine conflicts — two profiles
-- laying claim to one address — and they need a human to decide which account
-- keeps it. Expected to be zero: the unique constraint has been in place since
-- 001, so a duplicate can only exist if it predates it or was written directly.
do $$
declare n int;
begin
  select count(*) into n
    from public.profiles p
    join auth.users u on u.id = p.id
   where p.email is distinct from u.email;

  if n > 0 then
    raise notice
      'sync_profile_email: % profile row(s) still disagree with auth.users and were skipped because another profile already holds the target address. Run the SELECT in the comment below to see them.', n;
  end if;
end $$;

-- To inspect the stragglers, if the notice above reported any:
--
--   select p.id, p.email as profile_email, u.email as auth_email
--     from public.profiles p
--     join auth.users u on u.id = p.id
--    where p.email is distinct from u.email;
