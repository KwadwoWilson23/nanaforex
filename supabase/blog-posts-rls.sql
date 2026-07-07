-- ============================================================
-- Nana Forex — Fix CRITICAL advisor: RLS disabled on blog_posts
--
-- The Security Advisor flags:
--   * "RLS Disabled in Public"       (CRITICAL)
--   * "Policy Exists RLS Disabled"   (CRITICAL)
--
-- Meaning: policies were written for public.blog_posts but Row Level
-- Security was never turned ON, so the table is fully exposed through
-- the public anon key — anyone can read, write AND delete posts.
--
-- This script turns RLS on and sets the intended access model:
--   * anyone (even logged-out visitors) may READ posts   -> public blog
--   * only an authenticated user (the admin who logs in) may
--     INSERT / UPDATE / DELETE  -> matches js/blog-admin.js
--
-- Run in: Dashboard -> SQL Editor -> New query -> paste -> Run.
-- ============================================================

-- 1. Turn RLS on (this is the actual fix for the CRITICAL warnings)
alter table public.blog_posts enable row level security;

-- 2. Replace policies with an explicit, safe set.
--    Drop our named policies if re-running; if the collaborator left
--    other differently-named policies behind, review them in
--    Dashboard -> Authentication -> Policies and remove any that grant
--    broader access than intended (permissive policies are OR-combined).
drop policy if exists "blog_posts: public read"    on public.blog_posts;
drop policy if exists "blog_posts: admin insert"   on public.blog_posts;
drop policy if exists "blog_posts: admin update"   on public.blog_posts;
drop policy if exists "blog_posts: admin delete"   on public.blog_posts;

-- Anyone may read
create policy "blog_posts: public read"
  on public.blog_posts for select
  using (true);

-- Only admins (profiles.role = 'admin') may write.
-- Requires public.is_admin() from schema.sql — run schema.sql first.
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

-- ------------------------------------------------------------
-- Grant yourself admin (after creating your account):
--   update public.profiles set role = 'admin'
--   where id = (select id from auth.users where email = 'you@nanaforex.com');
-- ------------------------------------------------------------
