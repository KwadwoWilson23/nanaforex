-- ============================================================
-- Nana Forex — Security linter fixes
-- Run once in Supabase SQL Editor. Clears:
--   * "Function Search Path Mutable"  (public.set_updated_at)
--   * "RLS Policy Always True" x5     (public.blog_posts — leftover
--                                      permissive policies from the
--                                      original blog setup)
-- ============================================================

-- ------------------------------------------------------------
-- 1. Pin search_path on the updated-at trigger function
-- ------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ------------------------------------------------------------
-- 2. Ensure the admin check exists (writes depend on it)
-- ------------------------------------------------------------
create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.profiles
    where id = (select auth.uid()) and role = 'admin'
  );
$$;

-- ------------------------------------------------------------
-- 3. Blog posts: drop EVERY existing policy (including the old
--    permissive ones with unknown names), then recreate a clean set.
-- ------------------------------------------------------------
alter table public.blog_posts enable row level security;

do $$
declare pol record;
begin
  for pol in
    select policyname
    from pg_policies
    where schemaname = 'public' and tablename = 'blog_posts'
  loop
    execute format('drop policy if exists %I on public.blog_posts', pol.policyname);
  end loop;
end $$;

-- Public read (intentional: a blog is meant to be read by everyone).
create policy "blog_posts: public read"
  on public.blog_posts for select
  using (true);

-- Writes: admins only (profiles.role = 'admin').
create policy "blog_posts: admin insert"
  on public.blog_posts for insert
  to authenticated
  with check (public.is_admin());

create policy "blog_posts: admin update"
  on public.blog_posts for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

create policy "blog_posts: admin delete"
  on public.blog_posts for delete
  to authenticated
  using (public.is_admin());

-- After running, click "Rerun linter". The function warning clears, and
-- the blog_posts warnings drop to (at most) the single public-read policy,
-- which is the intended public access and safe to keep.
