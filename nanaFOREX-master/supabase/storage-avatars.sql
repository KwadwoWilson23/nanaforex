-- ============================================================
-- Nana Forex — avatars storage policies (req #9, 119)
--
-- RUN THIS *AFTER* creating the "avatars" bucket:
--   Dashboard -> Storage -> New bucket -> name: avatars -> Public -> Save
--
-- Creating a bucket in the UI initialises the `storage` schema, so
-- storage.buckets / storage.objects will exist by the time you run this.
-- (If you prefer SQL and the storage schema already exists, the insert
--  below will create the bucket too.)
-- ============================================================

-- Optional: create the bucket via SQL (safe to keep; no-op if it exists)
insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

-- Users may only write to a folder named after their own uid:
--   avatars/<auth.uid()>/whatever.png
drop policy if exists "avatars: public read"  on storage.objects;
drop policy if exists "avatars: write own"    on storage.objects;
drop policy if exists "avatars: update own"   on storage.objects;
drop policy if exists "avatars: delete own"   on storage.objects;

create policy "avatars: public read"
  on storage.objects for select
  using (bucket_id = 'avatars');

create policy "avatars: write own"
  on storage.objects for insert
  with check (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

create policy "avatars: update own"
  on storage.objects for update
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

create policy "avatars: delete own"
  on storage.objects for delete
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );
