-- Migration 110: lock down the `uploads` and `event-assets` Storage policies.
--
-- Migration 050 created these buckets with policies named "owner update" /
-- "owner delete" that never actually checked an owner:
--
--   create policy "uploads: owner delete" on storage.objects
--     for delete to authenticated using (bucket_id = 'uploads');
--
-- The only predicate is the bucket id. Any signed-in user (a free account is
-- enough) holding the public anon key could therefore, without ever touching
-- our API routes:
--   * overwrite another user's avatar — the web and mobile clients write to the
--     deterministic path `avatars/<user-id>.jpg`, so the victim's path is
--     guessable from their profile id;
--   * delete EVERY object in `event-assets` — that is every sponsor logo,
--     session slide deck and application-form file on the platform, for every
--     event, in one scripted loop;
--   * insert arbitrary objects at arbitrary paths in either bucket, which is
--     also an unbounded storage-cost surface (no bucket size or MIME limits).
--
-- Fixes:
--   1. `uploads` INSERT is scoped to the caller's own `avatars/<uid>...` path.
--      That covers all four legitimate call sites — ProfileSettings.tsx,
--      OnboardingWizard.tsx, and the three Flutter screens — which all write
--      `avatars/<uid>` or `avatars/<uid>-<ts>`.
--   2. `uploads` UPDATE/DELETE require the caller to be the object's owner.
--      `owner_id` (text) is the current column; `owner` (uuid) is the legacy
--      one — coalesce so this works on either Storage version.
--   3. `event-assets` gets NO authenticated write policies at all. Every write
--      to that bucket goes through a server route using the service-role key,
--      which bypasses RLS entirely, so client-side write access was pure
--      attack surface with no legitimate user.
--   4. Bucket-level size and MIME caps, so a direct anon-key upload can't
--      bypass the per-route size checks in our API handlers.
--
-- Public read is preserved on both buckets — the public URLs are used on
-- attendee-facing pages.
--
-- NOTE: migrations 051-104 are not present in this repo, so a later migration
-- may have already added differently-named policies on storage.objects. This
-- file only replaces the exact policy names created by 050. After applying,
-- verify nothing permissive survives:
--
--   select policyname, cmd, qual, with_check
--     from pg_policies
--    where schemaname = 'storage' and tablename = 'objects'
--    order by policyname;
--
-- Idempotent.

-- ── uploads: avatars only, owner-scoped ──────────────────────────────────────

drop policy if exists "uploads: authenticated insert" on storage.objects;
create policy "uploads: own avatar insert" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'uploads'
    and name like 'avatars/' || auth.uid()::text || '%'
  );

drop policy if exists "uploads: owner update" on storage.objects;
create policy "uploads: owner update" on storage.objects
  for update to authenticated
  using (
    bucket_id = 'uploads'
    and coalesce(owner_id, owner::text) = auth.uid()::text
  );

drop policy if exists "uploads: owner delete" on storage.objects;
create policy "uploads: owner delete" on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'uploads'
    and coalesce(owner_id, owner::text) = auth.uid()::text
  );

-- public read stays as-is (recreated for idempotency)
drop policy if exists "uploads: public read" on storage.objects;
create policy "uploads: public read" on storage.objects
  for select to public using (bucket_id = 'uploads');

-- ── event-assets: server-side writes only ────────────────────────────────────
-- Service-role writes bypass RLS, so removing these leaves every legitimate
-- upload route working while closing client-side write access completely.

drop policy if exists "event-assets: authenticated insert" on storage.objects;
drop policy if exists "event-assets: owner update" on storage.objects;
drop policy if exists "event-assets: owner delete" on storage.objects;

drop policy if exists "event-assets: public read" on storage.objects;
create policy "event-assets: public read" on storage.objects
  for select to public using (bucket_id = 'event-assets');

-- ── Bucket-level caps ────────────────────────────────────────────────────────
-- Backstop for the per-route size checks: a direct anon-key upload can't
-- exceed these even though it never runs our handler code.

update storage.buckets
   set file_size_limit = 10485760,  -- 10 MB
       allowed_mime_types = array['image/jpeg','image/png','image/webp','image/gif']
 where id = 'uploads';

-- event-assets also holds slide decks and application-form files, which are
-- legitimately non-image and larger; the routes cap those at 20-25 MB.
update storage.buckets
   set file_size_limit = 26214400  -- 25 MB
 where id = 'event-assets';
