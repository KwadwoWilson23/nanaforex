-- ============================================================
-- Nana Forex — Live Leaderboard + Challenge config
--
-- Moves the performance-dashboard leaderboard off localStorage
-- (which was per-browser only) into shared, server-backed tables.
-- Anyone can read; only a signed-in admin can write.
--
-- Run in: Dashboard -> SQL Editor -> paste -> Run.
-- ============================================================

-- ---- traders ----
create table if not exists public.leaderboard_traders (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  account    text,
  return_pct numeric  not null default 0,
  pips       integer  not null default 0,
  win_rate   integer  not null default 0,
  trades     integer  not null default 0,
  created_at timestamptz not null default now()
);

-- ---- challenge config (single row, id is pinned to 1) ----
create table if not exists public.challenge_config (
  id         integer primary key default 1,
  name       text,
  start_date date,
  end_date   date,
  prize_pool numeric,
  status     text,
  updated_at timestamptz not null default now(),
  constraint challenge_singleton check (id = 1)
);

-- ============================================================
-- Row Level Security: public read, authenticated (admin) write
-- ============================================================
alter table public.leaderboard_traders enable row level security;
alter table public.challenge_config    enable row level security;

-- traders
drop policy if exists "traders: public read"  on public.leaderboard_traders;
drop policy if exists "traders: admin write"  on public.leaderboard_traders;

create policy "traders: public read"
  on public.leaderboard_traders for select
  using (true);

-- Only admins (profiles.role = 'admin') may write — needs public.is_admin()
-- from schema.sql, so run schema.sql before this file.
create policy "traders: admin write"
  on public.leaderboard_traders for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- challenge config
drop policy if exists "challenge: public read" on public.challenge_config;
drop policy if exists "challenge: admin write" on public.challenge_config;

create policy "challenge: public read"
  on public.challenge_config for select
  using (true);

create policy "challenge: admin write"
  on public.challenge_config for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- ============================================================
-- Seed the default challenge row (edit later from the admin panel)
-- ============================================================
insert into public.challenge_config (id, name, start_date, end_date, prize_pool, status)
values (1, 'March 2026 Trading Challenge', '2026-03-01', '2026-04-15', 5000, 'active')
on conflict (id) do nothing;
