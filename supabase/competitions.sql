-- ============================================================
-- Nana Forex — Trading Competitions (Phase 1: schema)
-- Run in Supabase → SQL Editor after schema.sql + leaderboard.sql.
--
-- Depends on:
--   * public.profiles         (from schema.sql)
--   * public.is_admin()       (from schema.sql)
--
-- What this creates:
--   * competitions         — the challenges themselves
--   * participants         — one row per user per competition
--   * trades               — every open/closed trade streamed from MetaAPI
--   * leaderboard_snapshots — historical rank data for charts
--   * audit_log            — admin actions (disqualify, override, edits)
--   * leaderboard_current  — view: current live ranking per competition
--
-- Security model:
--   * competitions        — public READ; admin WRITE
--   * participants        — public READ (needed for the leaderboard);
--                           user can INSERT their own row (join);
--                           user can UPDATE their own row for withdraw;
--                           admin can UPDATE anyone (disqualify);
--                           only service role writes MetaAPI ids/balances
--                           (server-side sync bypasses RLS)
--   * trades              — public READ; only service role WRITES
--   * snapshots           — public READ; only service role WRITES
--   * audit_log           — admin READ only; server-side writes
-- ============================================================


-- ------------------------------------------------------------
-- 1. COMPETITIONS
-- ------------------------------------------------------------
create table if not exists public.competitions (
  id           uuid primary key default gen_random_uuid(),
  slug         text not null unique,          -- URL-friendly id
  name         text not null,
  description  text,
  start_date   timestamptz not null,
  end_date     timestamptz not null,

  -- one of upcoming | active | ended | cancelled
  status       text not null default 'upcoming'
                 check (status in ('upcoming','active','ended','cancelled')),

  -- rules jsonb — expected keys (all optional):
  --   max_drawdown_pct   number  – auto-disqualify above this DD
  --   min_trades         integer – min trades to be ranked at end
  --   starting_balance   number  – required starting balance in USD
  --   account_type       text    – 'demo' | 'live'
  --   allowed_platforms  text[]  – ['mt4','mt5']
  --   max_lot_size       number  – per-trade lot cap
  --   allowed_symbols    text[]  – if omitted, all symbols allowed
  rules        jsonb not null default '{}'::jsonb,

  prize_pool       numeric(12,2),
  max_participants integer,
  cover_image_url  text,

  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

comment on table public.competitions is
  'Trading competitions users can join. rules is a jsonb bag of parameters (max_drawdown_pct, min_trades, starting_balance, allowed_platforms, etc.).';

create index if not exists competitions_status_idx
  on public.competitions (status, start_date desc);


-- ------------------------------------------------------------
-- 2. PARTICIPANTS
--   One row per user per competition.
--   metaapi_account_id is the ONLY credential-like value we store —
--   MetaAPI itself holds the actual investor password. We never see
--   or store the raw password.
-- ------------------------------------------------------------
create table if not exists public.participants (
  id                 uuid primary key default gen_random_uuid(),
  competition_id     uuid not null references public.competitions(id) on delete cascade,
  user_id            uuid not null references auth.users(id) on delete cascade,

  -- Provider-agnostic performance tracking linkage (MyFxBook / FX Blue /
  -- MetaAPI / manual — one of; see COMPETITIONS.md).
  tracking_provider  text check (tracking_provider in ('myfxbook','fxblue','metaapi','manual')),
  tracking_ref       text,        -- MyFxBook URL, MetaAPI accountId, etc.
  tracking_meta      jsonb not null default '{}'::jsonb,
                       -- provider-specific extras (system_id, feed key, etc.)
  mt_platform        text check (mt_platform in ('mt4','mt5')),
  mt_login           text,        -- account number (public info)
  mt_server          text,        -- server name (public info)
  broker_name        text,

  -- Live financials (updated by the sync worker)
  starting_balance   numeric(14,2),
  current_balance    numeric(14,2),
  current_equity     numeric(14,2),
  peak_equity        numeric(14,2),  -- highest equity seen — used for drawdown
  max_drawdown_pct   numeric(6,2) default 0,
  trade_count        integer default 0,

  -- Lifecycle
  status             text not null default 'pending'
                       check (status in (
                         'pending',       -- joined, MetaAPI not yet connected
                         'connecting',    -- server is provisioning the account
                         'connected',     -- live sync healthy
                         'disqualified',  -- admin or auto rule violation
                         'withdrawn',     -- user withdrew
                         'completed'      -- ended alive (final ranking recorded)
                       )),
  status_reason      text,
  disqualified_at    timestamptz,
  disqualified_by    uuid references auth.users(id),

  joined_at          timestamptz not null default now(),
  connected_at       timestamptz,
  last_sync_at       timestamptz,

  -- One entry per user per competition
  unique (competition_id, user_id)
);

create index if not exists participants_competition_status_idx
  on public.participants (competition_id, status);
create index if not exists participants_user_idx
  on public.participants (user_id);
create index if not exists participants_tracking_idx
  on public.participants (tracking_provider, tracking_ref)
  where tracking_ref is not null;


-- ------------------------------------------------------------
-- 3. TRADES
--   Written by the sync worker as MetaAPI streams updates.
-- ------------------------------------------------------------
create table if not exists public.trades (
  id             uuid primary key default gen_random_uuid(),
  participant_id uuid not null references public.participants(id) on delete cascade,

  mt_ticket_id   text not null,     -- MT4/MT5 ticket id from MetaAPI
  symbol         text not null,     -- e.g. 'EURUSD'
  side           text not null check (side in ('buy','sell')),
  lot_size       numeric(10,2) not null,

  open_price     numeric(14,5) not null,
  close_price    numeric(14,5),
  open_time      timestamptz not null,
  close_time     timestamptz,

  stop_loss      numeric(14,5),
  take_profit    numeric(14,5),
  commission     numeric(10,2) default 0,
  swap           numeric(10,2) default 0,
  profit         numeric(14,2),      -- realized on close, running P/L while open

  status         text not null default 'open'
                   check (status in ('open','closed','cancelled')),

  synced_at      timestamptz not null default now(),

  -- Prevent duplicate syncs of the same MT ticket for a participant
  unique (participant_id, mt_ticket_id)
);

create index if not exists trades_participant_status_idx
  on public.trades (participant_id, status);
create index if not exists trades_participant_close_time_idx
  on public.trades (participant_id, close_time desc nulls first);


-- ------------------------------------------------------------
-- 4. LEADERBOARD SNAPSHOTS
--   Written every N seconds by the sync worker so we can chart
--   rank movement over the life of a competition.
-- ------------------------------------------------------------
create table if not exists public.leaderboard_snapshots (
  id             uuid primary key default gen_random_uuid(),
  competition_id uuid not null references public.competitions(id) on delete cascade,
  participant_id uuid not null references public.participants(id) on delete cascade,

  rank           integer not null,
  equity         numeric(14,2) not null,
  profit_pct     numeric(7,2) not null,
  drawdown_pct   numeric(6,2) not null,
  trade_count    integer not null,

  snapshot_time  timestamptz not null default now()
);

create index if not exists snapshots_competition_time_idx
  on public.leaderboard_snapshots (competition_id, snapshot_time desc);
create index if not exists snapshots_competition_rank_idx
  on public.leaderboard_snapshots (competition_id, snapshot_time desc, rank);


-- ------------------------------------------------------------
-- 5. AUDIT LOG
--   Admin actions (disqualifications, manual overrides, edits).
-- ------------------------------------------------------------
create table if not exists public.audit_log (
  id           uuid primary key default gen_random_uuid(),
  actor_id     uuid references auth.users(id),
  action       text not null,    -- e.g. 'disqualify_participant', 'update_rules'
  entity_type  text,              -- 'participant' | 'competition' | 'user'
  entity_id    uuid,
  metadata     jsonb not null default '{}'::jsonb,
  created_at   timestamptz not null default now()
);

create index if not exists audit_actor_idx
  on public.audit_log (actor_id, created_at desc);
create index if not exists audit_entity_idx
  on public.audit_log (entity_type, entity_id);


-- ------------------------------------------------------------
-- 6. updated_at trigger on competitions
-- ------------------------------------------------------------
drop trigger if exists competitions_set_updated_at on public.competitions;
create trigger competitions_set_updated_at
  before update on public.competitions
  for each row execute function public.set_updated_at();


-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================
alter table public.competitions           enable row level security;
alter table public.participants           enable row level security;
alter table public.trades                 enable row level security;
alter table public.leaderboard_snapshots  enable row level security;
alter table public.audit_log              enable row level security;

-- competitions --------------------------------------------------
drop policy if exists "competitions: public read"  on public.competitions;
drop policy if exists "competitions: admin write"  on public.competitions;

create policy "competitions: public read"
  on public.competitions for select
  using (true);

create policy "competitions: admin write"
  on public.competitions for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- participants --------------------------------------------------
-- Public read is REQUIRED for the leaderboard to work. If you want
-- to hide competitors' broker/login, use the leaderboard_current
-- view (below) which trims sensitive fields.
drop policy if exists "participants: public read"    on public.participants;
drop policy if exists "participants: user insert"    on public.participants;
drop policy if exists "participants: user update"    on public.participants;
drop policy if exists "participants: admin update"   on public.participants;

create policy "participants: public read"
  on public.participants for select
  using (true);

-- User can join a competition (insert their own row).
create policy "participants: user insert"
  on public.participants for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

-- User can update their own status (e.g., withdraw), but only limited fields.
-- We keep this open at RLS-level and enforce field limits at the API layer.
create policy "participants: user update"
  on public.participants for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

-- Admin can update anyone (disqualify, resync, etc.)
create policy "participants: admin update"
  on public.participants for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- trades --------------------------------------------------------
-- Public read (leaderboard transparency). Only server (service role)
-- writes trades — no policy allows client-side writes.
drop policy if exists "trades: public read" on public.trades;
create policy "trades: public read"
  on public.trades for select
  using (true);

-- leaderboard_snapshots ----------------------------------------
drop policy if exists "snapshots: public read" on public.leaderboard_snapshots;
create policy "snapshots: public read"
  on public.leaderboard_snapshots for select
  using (true);

-- audit_log -----------------------------------------------------
-- Admin read only. Server-side writes via service role.
drop policy if exists "audit: admin read" on public.audit_log;
create policy "audit: admin read"
  on public.audit_log for select
  to authenticated
  using (public.is_admin());


-- ============================================================
-- HELPER VIEWS
--
-- leaderboard_current — live per-competition ranking. Use this in
-- the browser instead of participants directly, so we don't expose
-- broker/login/status_reason on the public leaderboard.
-- ============================================================
create or replace view public.leaderboard_current
with (security_invoker = true) as
select
  p.competition_id,
  p.id                as participant_id,
  p.user_id,
  coalesce(pr.full_name, 'Trader') as display_name,
  pr.avatar_url,
  p.mt_platform,
  p.status,
  p.starting_balance,
  p.current_equity,
  case
    when coalesce(p.starting_balance, 0) > 0
      then round(((coalesce(p.current_equity, p.starting_balance) - p.starting_balance)
                  / p.starting_balance * 100)::numeric, 2)
    else 0
  end as profit_pct,
  p.max_drawdown_pct,
  p.trade_count,
  p.last_sync_at,
  row_number() over (
    partition by p.competition_id
    order by
      case
        when p.status = 'disqualified' then 2
        when p.status = 'pending'      then 1
        else 0
      end,
      case
        when coalesce(p.starting_balance, 0) > 0
          then (coalesce(p.current_equity, p.starting_balance) - p.starting_balance)
                / p.starting_balance
        else 0
      end desc
  ) as rank
from public.participants p
left join public.profiles pr on pr.id = p.user_id
where p.status in ('connecting','connected','disqualified','completed');


-- ============================================================
-- DONE.
-- After running: verify with
--   select tablename from pg_tables
--    where schemaname='public'
--      and tablename in ('competitions','participants','trades',
--                        'leaderboard_snapshots','audit_log');
-- Should return 5 rows.
-- ============================================================
