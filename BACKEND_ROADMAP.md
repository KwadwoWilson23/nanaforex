# Nana Forex — Backend Roadmap

This maps the **185 backend requirements** onto the project's actual stack and
sorts them by feasibility and phase. Read this before picking up any item so we
don't build things in the wrong order (e.g. commissions before accounts exist).

## Current reality (starting point)

- **Static multi-page site** — plain HTML/CSS/vanilla JS, no framework, no build.
- **Supabase is the only backend.** Already used for: admin auth, the
  `blog_posts` table, and the `blog-media` storage bucket.
- The **leaderboard is `localStorage`-only** today — not shared, not a backend.
- Anything requiring secrets, webhooks, scheduled jobs, or third-party server
  calls must run in **Supabase Edge Functions** (Deno) — it *cannot* live in the
  browser, because the anon key and any API keys shipped to the client are public.

### Feasibility legend
- 🟢 **Doable now** with Supabase (DB + Auth + Storage), mostly client-side.
- 🟡 **Needs an Edge Function** (server-side secret, webhook, cron, or 3rd-party call).
- 🔴 **Heavy / external** — depends on a paid/complex integration (MT4/MT5, prop-firm
  infra, live market feeds, payment rails) or is really its own project.

---

## Phase 1 — Accounts & Profiles ✅ (started in this branch)
*Requirements 1–11, plus the shared notification/activity tables.*

| # | Requirement | Status |
|---|-------------|--------|
| 1–7 | Registration, login, logout, password reset, email verification, sessions, JWT | 🟢 Supabase Auth — **built** (`auth.js`, `login/register/reset` pages) |
| 8 | User Profile CRUD | 🟢 `profiles` table + RLS — **built** |
| 9 | Profile Picture Upload | 🟢 `avatars` bucket + RLS — **built** |
| 10 | User Preferences CRUD | 🟢 `profiles.preferences` jsonb — **built** |
| 11 | Account Deletion | 🟢 `auth.users` cascade (needs a small Edge Function to call admin delete) — 🟡 |

**Apply:** run `supabase/schema.sql`, then see `supabase/README.md`.

---

## Phase 2 — Security & Account Hardening
*12, 13, 154, 166–170.*

| # | Requirement | Notes |
|---|-------------|-------|
| 12 | Two-Factor Authentication | 🟢 Supabase Auth MFA (TOTP) |
| 13 | Device / Session Management | 🟢 list & revoke sessions via Auth |
| 154 | Security Settings | 🟢 profile-backed |
| 166 | Rate Limiting | 🟡 Edge Function / gateway |
| 167 | IP Blocking | 🟡 Edge Function + block list table |
| 168 | Suspicious Activity Detection | 🟡 triggers + Edge Function |
| 169 | Audit Trail | 🟢 `activity_log` (table already created) |
| 170 | Data Encryption | 🟢 at rest by Supabase; app-level for sensitive fields |

---

## Phase 3 — Dashboard, Notifications & Activity
*14–24, 97, 104–107, 153, 156.*

Mostly 🟢: tables + RLS + client rendering. These are the natural first
*user-facing* payoff after accounts exist.

- 14–20 Dashboard overview, balance, P/L, active trades, stats, equity/perf charts
  → 🟢 `trades`, `accounts` tables (data entry manual until Phase 8 broker link).
- 21 Recent Activity, 104–107 activity log retrieval/filter/export → 🟢 (`activity_log`).
- 22–24, 97 Notifications list / mark read / mark all read / in-app → 🟢 (`notifications` table built).
- 153 General Settings, 156 Appearance Settings → 🟢 preferences.

---

## Phase 4 — Content: Courses / LMS
*25–34, 109, 120–123, 141–144.*

- 25–29, 32 Catalog, details, enrollment, progress, completion, categories → 🟢 tables + RLS.
- 30, 31, 122, 123 Certificate generation / download / PDF export → 🟡 Edge Function (PDF render).
- 33, 34 Course payment + verification → 🟡 (see Phase 7 payments).
- 109 Course Management, 120 thumbnail, 121 video upload → 🟢 Storage (large video → 🔴 consider a CDN/Mux).

---

## Phase 5 — Signals
*35–42, 110, 111, 126.*

- 35–39, 110, 111 Signal list/details/stats/subscription/management/publishing → 🟢 tables + RLS.
- 37, 126 Live signal updates → 🟢 Supabase Realtime (`postgres_changes`).
- 40, 41 Subscription plans / cancellation → 🟡 ties to payments.
- 42, 100 Telegram delivery → 🟡 Edge Function + Telegram Bot API (`130`).

---

## Phase 6 — Trading Tools & Calculators
*78–87.*

🟢 **Pure front-end math** — position size, pip value, risk/reward, currency
converter, P/L, RSI, Fibonacci, volatility, MA crossover, lot size. No backend
needed beyond optionally saving results. These are quick wins and can be done
anytime, independent of the account system.

---

## Phase 7 — Payments & Subscriptions
*33, 34, 40, 41, 88–96, 114, 131–133.*

All 🟡 (server-side, secret keys + webhooks) — **must** be Edge Functions.

- 88–96 Plans, create/cancel subscription, payment processing, history,
  invoices, webhook handling, renewal, expiry.
- 131 Paystack, 132 Flutterwave, 133 Stripe — pick primary (Paystack/Flutterwave
  fit Ghana/West-Africa best; Stripe for international).
- 93 Invoice, 123 PDF → 🟡 PDF Edge Function.
- 114 Payment Verification, 94 webhook → 🟡 verify signature server-side.

---

## Phase 8 — Copy Trading & Broker Integration
*43–53, 129.*

🔴 The hard, external part. Real MT4/MT5 copy trading needs broker/bridge infra
(a VPS running an EA, or a broker's copy-trade API, or a provider like cTrader
Copy). Recommend: **v1 shows manual/synced stats** (🟢 tables), and true
auto-copy (48–52, 129) is a later, separately-scoped integration.

---

## Phase 9 — IB / Referrals & Mentorship
*54–69, 112, 113, 145–148.*

- 54–61, 112, 145–148 IB application, dashboard, referrals, commission history,
  referral links/tracking, sub-IB → 🟢 tables + RLS; 60/147 commission calc → 🟡
  (Edge Function or scheduled job for payouts).
- 62–69, 113 Mentorship programs, applications, scheduling, mentor list → 🟢 tables.
- 66, 67 Session scheduling/management → 🟢 (external calendar optional).

---

## Phase 10 — Market Data & News
*70–77, 134–137.*

All 🟡 (third-party API keys must stay server-side; proxy via Edge Function +
cache):
- 70–73, 125 Live price, chart data, indicators, sentiment, price updates.
- 74, 137 Market news; 75 economic calendar; 76 fear & greed; 77 FX rates.
- 134 Alpha Vantage, 135 Twelve Data, 136 Exchange Rate API.
Cache aggressively (173) to respect free-tier rate limits.

---

## Phase 11 — Realtime & Notifications Delivery
*98–103, 124–128, 130, 138, 139, 158.*

- 124–128 WebSocket / price / signal / trade / notification delivery → 🟢 Supabase Realtime.
- 98 Email (🟡 Resend/SendGrid), 99 Push (🟡 web-push), 100 Telegram (🟡 bot),
  101 SMS (🟡 Twilio/Hubtel), 102 preferences (🟢), 103 templates (🟢).
- 138 Email service, 139 SMS service → 🟡 integrations.

---

## Phase 12 — Prop-Firm / Challenges & Funded Accounts
*149–152.*

🔴 Challenge application (🟢 form/table) is easy, but funded-account management,
profit-split calc, and real evaluation logic depend on broker integration
(Phase 8). Scope as its own project once copy-trading infra exists.

---

## Phase 13 — Admin, Analytics & Ops
*108, 115–118, 160–165, 171–185.*

- 108 User mgmt, 115 commission approval, 116 system settings, 117 analytics
  dashboard, 118 revenue reports → 🟢/🟡 (admin RLS + aggregate queries/Edge Fns).
- 159–161 Community chat, comments, ratings/reviews → 🟢 tables + Realtime.
- 162–165 Analytics → 🟡 aggregation jobs.
- 171–175 SEO/sitemap/meta/cache/CDN/image opt → mix of 🟢 static + 🟡/🔴 infra.
- 176–185 DB collections/indexes/backups/migrations, scheduled jobs, event
  triggers, HTTP endpoints, webhooks, cron → 🟡 Supabase (pg_cron, triggers,
  Edge Functions). **Note:** the list mentions Firestore/Realtime Database (176,
  177) — this project uses **Supabase (Postgres)**, not Firebase. We should pick
  one; recommend staying on Supabase since it's already integrated.

---

## Cross-cutting recommendations

1. **Pick the stack story now.** The list mixes Firebase and generic terms, but
   the code is Supabase. Commit to **Supabase** (Auth + Postgres + Storage +
   Realtime + Edge Functions) to avoid a rewrite.
2. **Move the leaderboard to the DB** early — it's currently `localStorage`, so
   it isn't shared between visitors. Small win, high visibility.
3. **Anything with a secret key = Edge Function.** Never ship Paystack/Stripe/
   Alpha Vantage/Twilio keys to the browser.
4. **Sequence:** Phase 1 (done) → 2/3 (secure + useful dashboard) → 6 (quick
   calculator wins) → 4/5 (courses/signals) → 7 (payments unlock monetization)
   → 8–12 (heavy integrations) → 13 (admin/ops throughout).
5. **The 🔴 items (MT4/MT5, funded accounts, live copy trading) are each a
   project on their own** — set expectations with the collaborator that these
   are not "a weekend of backend."

---

### Requirement index → phase (quick lookup)
- 1–11 → **P1** · 12,13,154,166–170 → **P2** · 14–24,97,104–107,153,156 → **P3**
- 25–34,109,120–123,141–144 → **P4** · 35–42,110,111,126 → **P5** · 78–87 → **P6**
- 33,34,40,41,88–96,114,131–133 → **P7** · 43–53,129 → **P8**
- 54–69,112,113,145–148 → **P9** · 70–77,134–137 → **P10**
- 98–103,124–128,130,138,139,158 → **P11** · 149–152 → **P12**
- 108,115–118,159–165,171–185 → **P13**
