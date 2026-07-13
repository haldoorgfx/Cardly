-- Migration 050: create the storage buckets the app uploads to, with policies.
--
-- Root cause of "image upload not working": the client/server code uploads to
-- the `uploads` bucket (profile photos, web + mobile) and the `event-assets`
-- bucket (sponsor logos/resources, session slides), but neither bucket existed
-- in Storage — so every upload to them failed silently. The other buckets
-- (avatars, brand-assets, cms-media, event-backgrounds, generated-cards) already
-- exist. Server routes use the service-role key and bypass RLS, but the bucket
-- must still exist; client-side uploads additionally need an INSERT policy.
--
-- Applied directly in the Supabase SQL editor 2026-07-13. Idempotent.

insert into storage.buckets (id, name, public) values ('uploads','uploads',true)
  on conflict (id) do update set public = true;
insert into storage.buckets (id, name, public) values ('event-assets','event-assets',true)
  on conflict (id) do update set public = true;

-- uploads: client-side profile photos (web + mobile) — authenticated write, public read
drop policy if exists "uploads: authenticated insert" on storage.objects;
create policy "uploads: authenticated insert" on storage.objects for insert to authenticated with check (bucket_id = 'uploads');
drop policy if exists "uploads: owner update" on storage.objects;
create policy "uploads: owner update" on storage.objects for update to authenticated using (bucket_id = 'uploads');
drop policy if exists "uploads: owner delete" on storage.objects;
create policy "uploads: owner delete" on storage.objects for delete to authenticated using (bucket_id = 'uploads');
drop policy if exists "uploads: public read" on storage.objects;
create policy "uploads: public read" on storage.objects for select to public using (bucket_id = 'uploads');

-- event-assets: sponsor logos/resources, session slides — authenticated write, public read
drop policy if exists "event-assets: authenticated insert" on storage.objects;
create policy "event-assets: authenticated insert" on storage.objects for insert to authenticated with check (bucket_id = 'event-assets');
drop policy if exists "event-assets: owner update" on storage.objects;
create policy "event-assets: owner update" on storage.objects for update to authenticated using (bucket_id = 'event-assets');
drop policy if exists "event-assets: owner delete" on storage.objects;
create policy "event-assets: owner delete" on storage.objects for delete to authenticated using (bucket_id = 'event-assets');
drop policy if exists "event-assets: public read" on storage.objects;
create policy "event-assets: public read" on storage.objects for select to public using (bucket_id = 'event-assets');
