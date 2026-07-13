-- ============================================================
-- Nana Forex — Phase 1: User Accounts & Profiles
-- Run this in the Supabase project SQL editor
-- (Dashboard -> SQL Editor -> New query -> paste -> Run).
--
-- Covers backend requirements #1–11 (registration, login, logout,
-- password reset, email verification, session mgmt, JWT, profile
-- CRUD, avatar upload, preferences, account deletion) plus the
-- notifications + activity-log tables used across the app.
--
-- Supabase Auth (auth.users) already handles the credential,
-- session, JWT, email-verification and password-reset machinery.
-- This script adds the application-side tables that hang off it.
-- ============================================================

-- ------------------------------------------------------------
-- 1. PROFILES  (one row per auth user)
-- ------------------------------------------------------------
create table if not exists public.profiles (
  id           uuid primary key references auth.users (id) on delete cascade,
  full_name    text,
  phone        text,
  country      text,
  avatar_url   text,
  bio          text,
  role         text        not null default 'user',   -- 'user' | 'admin'
  preferences  jsonb       not null default '{}'::jsonb,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

comment on table public.profiles is 'Public-facing profile + preferences for each auth user.';

-- ------------------------------------------------------------
-- 2. AUTO-CREATE a profile row when a user signs up
-- ------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, phone)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', ''),
    coalesce(new.raw_user_meta_data ->> 'phone', '')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ------------------------------------------------------------
-- 3. keep updated_at fresh
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

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

-- ------------------------------------------------------------
-- 4. NOTIFICATIONS  (in-app; req #22–24, 97)
-- ------------------------------------------------------------
create table if not exists public.notifications (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users (id) on delete cascade,
  title      text not null,
  body       text,
  type       text not null default 'info',   -- info | success | warning | error
  read       boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists notifications_user_idx on public.notifications (user_id, created_at desc);

-- ------------------------------------------------------------
-- 5. ACTIVITY LOG  (req #21, 104–107)
-- ------------------------------------------------------------
create table if not exists public.activity_log (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users (id) on delete cascade,
  action     text not null,
  metadata   jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index if not exists activity_log_user_idx on public.activity_log (user_id, created_at desc);

-- ------------------------------------------------------------
-- is_admin(): true when the current user's profile role = 'admin'.
-- Used by blog_posts / leaderboard write policies. SECURITY DEFINER
-- so it can read profiles without tripping that table's own RLS.
-- To grant admin:  update public.profiles set role='admin'
--                  where id = (select id from auth.users where email='you@...');
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

-- ============================================================
-- ROW LEVEL SECURITY
-- Nothing is readable/writable until a policy allows it.
-- ============================================================
alter table public.profiles      enable row level security;
alter table public.notifications enable row level security;
alter table public.activity_log  enable row level security;

-- ---- profiles ----
drop policy if exists "profiles: read own"   on public.profiles;
drop policy if exists "profiles: update own" on public.profiles;

-- NOTE: auth.uid() is wrapped as (select auth.uid()) so Postgres
-- evaluates it once per query instead of once per row. This silences
-- the "Auth RLS Initialization Plan" performance advisory.

create policy "profiles: read own"
  on public.profiles for select
  using ((select auth.uid()) = id);

create policy "profiles: update own"
  on public.profiles for update
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);
-- (insert is done by the trigger with security definer; account
--  deletion is done via auth.users cascade, so no extra policy needed)

-- ---- notifications ----
drop policy if exists "notifications: read own"   on public.notifications;
drop policy if exists "notifications: update own" on public.notifications;

create policy "notifications: read own"
  on public.notifications for select
  using ((select auth.uid()) = user_id);

create policy "notifications: update own"
  on public.notifications for update
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

-- ---- activity_log ----
drop policy if exists "activity: read own" on public.activity_log;

create policy "activity: read own"
  on public.activity_log for select
  using ((select auth.uid()) = user_id);

-- ============================================================
-- STORAGE: avatars bucket (req #9, 119)
--
-- NOTE: the storage schema only exists once Storage has been used
-- at least once. If you got  ERROR: relation "storage.buckets"
-- does not exist  running this file, do the avatars setup
-- separately instead:
--   1. Dashboard -> Storage -> New bucket -> name "avatars",
--      mark it Public -> Save. (This initialises the storage schema.)
--   2. Then run  supabase/storage-avatars.sql  for the RLS policies.
--
-- Everything above this line runs without Storage.
-- ============================================================
