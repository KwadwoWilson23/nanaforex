-- ============================================================
-- Seed: July Challenge (2026)
--
-- Idempotent — safe to re-run. To edit dates or rules later,
-- either UPDATE by slug or re-run this file with new values.
--
-- Change these two dates if the launch window shifts:
--   start_date: currently a week from now (gives time to test)
--   end_date:   30 days after start
-- ============================================================

insert into public.competitions (
  slug,
  name,
  description,
  start_date,
  end_date,
  status,
  rules,
  prize_pool,
  max_participants
) values (
  'july-challenge-2026',
  'July Challenge',
  'Trade a $100 MT5 account (demo or live) for the July Challenge. Max 10% drawdown. Minimum 10 trades to qualify. Compete for a $500 prize pool.',
  '2026-07-25T00:00:00Z'::timestamptz,
  '2026-08-25T23:59:59Z'::timestamptz,
  'upcoming',
  jsonb_build_object(
    'starting_balance',   100,
    'max_drawdown_pct',   10,
    'min_trades',         10,
    'allowed_platforms',  array['mt5'],
    'account_type',       array['demo','live'],
    'prize_pool_usd',     500,
    'currency',           'USD'
  ),
  500,
  null
)
on conflict (slug) do update set
  name         = excluded.name,
  description  = excluded.description,
  start_date   = excluded.start_date,
  end_date     = excluded.end_date,
  status       = excluded.status,
  rules        = excluded.rules,
  prize_pool   = excluded.prize_pool,
  updated_at   = now();

-- Verify: expect one row.
select id, slug, name, start_date, end_date, status, prize_pool, rules
from public.competitions
where slug = 'july-challenge-2026';
