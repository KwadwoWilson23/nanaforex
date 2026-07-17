# Trading Competitions Module

This module adds live MT4/MT5 trading competitions to Nana Forex: users join
a challenge, connect their MT account (investor password, read-only) via
MetaAPI, and appear on a real-time public leaderboard.

## Architecture (chosen for this stack)

```
                                                    ┌────────────────┐
       Browser (nanaforex.com)                      │   MetaAPI      │
       ─────────────────────                        │  (metaapi.cloud)│
        Static HTML/CSS/JS                          │                 │
        Supabase-js (auth + realtime)               │  Cloud MT4/MT5  │
                    │                               │  positions/     │
     Supabase Auth  │           Vercel Functions    │  balance stream │
     ─────────────  │           ─────────────       │                 │
     JWT            │           /api/join           └────────┬────────┘
                    │           /api/connect                 ▲
                    ▼           /api/withdraw                │
              Supabase          /api/admin/*        ─────────┘
              Postgres          /api/sync (cron)     Node MetaAPI SDK,
              ────────                               server-side only
              competitions
              participants
              trades
              leaderboard_snapshots  ◄─── Supabase Realtime
              audit_log                    postgres_changes  ─► Browser
```

- **Server**: Vercel Serverless Functions (Node runtime) in `/api/*`.
  MetaAPI SDK runs there so the API token never touches the browser.
- **Cron**: Vercel Cron hits `/api/sync` every 30–60s to pull position/equity
  updates from MetaAPI and write to Supabase. Simple, cheap, no separate worker.
- **Realtime**: Browsers subscribe to Supabase `postgres_changes` on
  `leaderboard_current` view. No polling needed for the UI.
- **Storage**: Only `metaapi_account_id` (an opaque reference) is stored on
  our side. Investor passwords never touch our servers — MetaAPI holds them.

## Files

| File | Purpose |
|------|---------|
| `competitions.sql` | Schema: 5 tables + view + RLS + indexes. **RUN THIS FIRST.** |
| `COMPETITIONS.md`  | This document. |
| _(pending)_ `/api/competitions/join.js` | User joins a competition. |
| _(pending)_ `/api/competitions/connect.js` | Provisions MetaAPI account. |
| _(pending)_ `/api/sync.js` | Cron target — pulls MetaAPI, writes trades/equity. |
| _(pending)_ `/api/admin/disqualify.js` | Admin action + audit log. |
| _(pending)_ `/api/services/metaapi.js` | Isolated MetaAPI wrapper (swappable). |
| _(pending)_ `htmls/users/competitions.html` | User-facing list + join flow. |
| _(pending)_ `htmls/users/competition-detail.html` | Detail + leaderboard. |
| _(pending)_ `htmls/users/admin-competitions.html` | Admin dashboard. |

## Roadmap (phase-by-phase)

- [x] **Phase 1 — Schema** (`competitions.sql`) — this commit.
- [ ] **Phase 2 — MetaAPI wrapper** (`/api/services/metaapi.js`) — isolated so we
  can swap providers later. Needs MetaAPI account + token.
- [ ] **Phase 3 — Join + Connect flow** — public list, per-competition detail,
  join button, connect-account form (investor password only), status polling.
- [ ] **Phase 4 — Sync worker** — Vercel Cron → `/api/sync` → MetaAPI positions →
  write trades + update balance/equity + auto-DQ on rule violation +
  write leaderboard snapshot.
- [ ] **Phase 5 — Public leaderboard UI** — real-time ranking via Supabase
  Realtime on `leaderboard_current`.
- [ ] **Phase 6 — Admin dashboard** — competitions list, per-competition
  participant table, drill-in trade history, disqualify + CSV export.

## Security notes

- **We never see the investor password.** The connect-account form POSTs it to
  our Vercel function, we forward it directly to MetaAPI's provisioning
  endpoint, and immediately drop it. MetaAPI stores + rotates the credentials.
  We only keep the `metaapi_account_id` reference.
- **Rate limiting.** Vercel Functions get per-IP rate limits via a header
  check (`x-forwarded-for` + Upstash Redis or Supabase counter table); we'll
  wire this in Phase 3.
- **Admin actions audited.** Every disqualification / rule edit writes a row
  to `audit_log`. Only the admin role can read that log.
- **RLS is on** on every table. Frontend can only read the safe subset via
  `leaderboard_current`. Trade/balance writes require the service role,
  which lives only in Vercel env vars.

## Setup order (once we're building)

1. Run `supabase/competitions.sql` in Supabase SQL Editor.
2. Sign up for MetaAPI, get the API token, add as `METAAPI_TOKEN` in
   Vercel → Project → Settings → Environment Variables.
3. Add `SUPABASE_SERVICE_ROLE_KEY` (not the anon key) to Vercel env vars.
   This is what lets `/api/*` bypass RLS to write trades.
4. Add Vercel Cron to `vercel.json` for `/api/sync` (every 60s).

## What I still need from you

1. A MetaAPI account + token (Phase 2 is blocked without it).
2. Confirm the first competition's rules — I'll use them as the seed row:
   - Name, dates
   - `starting_balance` (USD)
   - `max_drawdown_pct` (typical: 10%)
   - `min_trades` to qualify at the end (typical: 5–20)
   - Prize pool
   - MT4 only, MT5 only, or both?
   - Demo accounts allowed, or live only?
3. OK with Vercel Cron + serverless functions? (Free tier is plenty for MVP.)
