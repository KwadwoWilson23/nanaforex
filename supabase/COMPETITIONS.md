# Trading Competitions Module

Live MT4/MT5 trading competitions with a public leaderboard.

## Data source: MyFxBook (free)

Traders link their MT4/MT5 account to their own **MyFxBook** account once
(5-minute one-time setup, free forever, they own the credentials). MyFxBook
publishes their live equity, drawdown, and trade history at a public URL.
Our platform stores that URL per participant and polls it every few minutes
to update the leaderboard.

- **Cost to us:** $0. No per-account fees.
- **Update cadence:** 5–15 minutes (fine for weekly / monthly contests).
- **What we never see:** the trader's investor password. MyFxBook holds it.
- **The `services/tracking.js` boundary keeps us provider-agnostic** — if we
  later want MetaAPI for a paid "premium real-time" tier, we plug it in there
  without touching the DB or the frontend.

## Architecture

```
                                                    ┌────────────────┐
       Browser (nanaforex.com)                      │   MyFxBook     │
       ─────────────────────                        │  (public pages,│
        Static HTML/CSS/JS                          │   widget API)  │
        Supabase-js (auth + realtime)               │                │
                    │                               │                │
                    │           Vercel Functions    └───────▲────────┘
                    │           ─────────────               │
                    │           /api/competitions/join      │
                    ▼           /api/competitions/connect   │
              Supabase          /api/admin/*        ────────┘
              Postgres          /api/sync (cron 5m)  services/tracking.js
              ────────                                fetches + parses
              competitions
              participants
              trades
              leaderboard_snapshots  ◄─── Supabase Realtime
              audit_log                    postgres_changes  ─► Browser
```

- **Server**: Vercel Serverless Functions (Node runtime) in `/api/*`.
- **Cron**: Vercel Cron hits `/api/sync` every 5 minutes.
- **Realtime**: Browsers subscribe to Supabase `postgres_changes` on the
  `leaderboard_current` view. UI updates without polling.

## Files

| File | Purpose |
|------|---------|
| `competitions.sql` | Schema — 5 tables + view + RLS. **RUN THIS FIRST.** |
| `COMPETITIONS.md`  | This document. |
| _(pending)_ `api/services/tracking.js` | Provider-agnostic wrapper. `myfxbook` today, `metaapi` later. |
| _(pending)_ `api/services/myfxbook.js` | Fetches + parses MyFxBook stats. |
| _(pending)_ `api/competitions/join.js` | User joins a competition. |
| _(pending)_ `api/competitions/connect.js` | User submits MyFxBook URL; we verify it. |
| _(pending)_ `api/sync.js` | Cron target — pulls MyFxBook, writes trades + equity. |
| _(pending)_ `api/admin/disqualify.js` | Admin action + audit log. |
| _(pending)_ `htmls/users/competitions.html` | Public list. |
| _(pending)_ `htmls/users/competition-detail.html` | Detail + leaderboard. |
| _(pending)_ `htmls/users/admin-competitions.html` | Admin dashboard. |

## Roadmap

- [x] **Phase 1 — Schema** (`competitions.sql`). Provider-agnostic:
  `tracking_provider` + `tracking_ref` + `tracking_meta` instead of a
  MetaAPI-specific column.
- [ ] **Phase 2 — Tracking service (MyFxBook)** — build `services/tracking.js`
  + `services/myfxbook.js`. Needs one test MyFxBook URL to develop against.
- [ ] **Phase 3 — Join + Connect flow** — public competitions list, per-comp
  detail page, "Join" button, "Paste your MyFxBook URL" form.
- [ ] **Phase 4 — Sync cron** — Vercel Cron → `/api/sync` (5 min) → MyFxBook →
  write trades + update balance/equity + auto-DQ on rule violation.
- [ ] **Phase 5 — Public leaderboard UI** — Supabase Realtime on
  `leaderboard_current`.
- [ ] **Phase 6 — Admin dashboard** — competitions list, participant table,
  trade drill-in, disqualify + audit log + CSV export.
- [ ] **Phase 7 (optional) — MetaAPI premium tier** — add `services/metaapi.js`
  behind the same interface, offer as a paid tier for verified real-time.

## How the "connect account" flow will look for a user

1. User visits **/users/competitions**, sees a list of open/upcoming competitions.
2. Clicks **Join** on one they want. Row is inserted into `participants` with
   `status = 'pending'`, `tracking_provider = null`.
3. They're prompted: *"Paste your MyFxBook 'System' share URL. Don't have
   one? Here's how to set it up in 5 minutes."* (Short 3-step video/guide.)
4. They paste `https://www.myfxbook.com/members/username/system-name/1234567`.
5. Our `/api/competitions/connect` endpoint:
   - Validates the URL format
   - Fetches the page once and confirms it returns valid stats (verifies
     the trader made it PUBLIC)
   - Stores `tracking_provider = 'myfxbook'`, `tracking_ref = <URL>`,
     `starting_balance = <fetched balance>`, `status = 'connected'`.
6. Every 5 min the cron fetches the URL again, updates equity/trades/rank.

## Security notes

- **We never handle broker credentials.** The trader gives their investor
  password to MyFxBook (a service they already trust), not to us. Our only
  input is a public URL.
- **Rate limiting.** Vercel Functions get per-IP rate limits via a header
  check + Supabase counter table; we'll wire this in Phase 3.
- **Admin actions audited.** Every disqualification / rule edit writes a row
  to `audit_log`. Only the admin role can read it.
- **RLS is on** on every table. Public read is intentional and limited to
  data you'd want on a leaderboard.

## Setup order

1. Run `supabase/schema.sql` (already run) + `supabase/leaderboard.sql`
   (already need to run, from earlier fix) + `supabase/competitions.sql` (new).
2. Add `SUPABASE_SERVICE_ROLE_KEY` to Vercel → Project → Settings → Environment
   Variables. This is what lets the sync bypass RLS to write trades.
3. Add the Vercel Cron entry to `vercel.json` (I'll do this in Phase 4).
4. **No MetaAPI signup, no API token, no per-account fees.** All you need is
   the SQL and the env var.

## What I still need from you to build Phase 2

**One test MyFxBook URL.** So the parser has real input to develop against.
Either your own MT account linked to MyFxBook, or any public trading-system
URL on `myfxbook.com`. Just paste it here.

While you're getting that, also confirm the first competition's rules:

- Name and dates
- `starting_balance` (USD) — required starting balance
- `max_drawdown_pct` — typical 5–10%
- `min_trades` to qualify — typical 5–20 trades
- Prize pool (if any)
- MT4 only, MT5 only, or both?
- Demo accounts allowed, or live only?
