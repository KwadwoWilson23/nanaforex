# Nana Forex — React (Next.js 15)

This folder holds the modern React rewrite. It's deployed as a **separate
Vercel project** pointed at this subdirectory, so the current static site at
`nanaforex.com` keeps working untouched while we migrate page by page.

## Stack

- **Next.js 15** (App Router, RSC where possible, client components only where needed)
- **React 19** + **TypeScript**
- **Tailwind CSS 3.4** with the Nana Forex brand palette
- **Framer Motion 11** for scroll reveals + micro-interactions
- **Supabase JS + SSR** for auth (Phase 3+, not yet wired)

## What's in Phase 1 (this commit)

- Full homepage: Navbar, Hero (animated glow + Framer Motion staggered entry),
  Ticker, Stats (count-up on scroll), Services (hover lift + icon float),
  Founder + Featured At strip (real images), Telegram feature card,
  Testimonials, FAQ accordion (spring-animated), CTA, Footer.
- Global styles + brand tokens.
- Root layout with fonts (Inter + Space Grotesk via next/font), favicon,
  OpenGraph/Twitter meta.
- Font Awesome loaded via CDN (same as the existing site).

## Local development

```bash
cd web
npm install
npm run dev
# → http://localhost:3000
```

## Deploy to Vercel (one-time setup)

1. Vercel Dashboard → **Add New… → Project**.
2. Import the same GitHub repo (`KwadwoWilson23/nanaforex`).
3. On the "Configure Project" screen:
   - **Framework preset:** Next.js (auto-detected)
   - **Root Directory:** click **Edit → set to `web`**
   - **Build & Output Settings:** leave defaults
4. Environment Variables (Phase 3+):
   - `NEXT_PUBLIC_SUPABASE_URL` = `https://xjmakedoqdbfafhbhjsj.supabase.co`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` = *(same anon key as `js/env.js`)*
5. Deploy.

You'll get a preview URL like `nanaforex-next.vercel.app` — this is where you
review the React version. The main `nanaforex.com` deployment is untouched.

When we're done migrating everything and you approve the React version, we
switch the DNS on the Vercel side: point `nanaforex.com` at the new Next.js
project instead of the current static one.

## Roadmap

- [x] **Phase 1** — Scaffold + homepage
- [ ] **Phase 2** — Marketing pages: about, services, contact, blog, dashboard (public perf)
- [ ] **Phase 3** — Auth: Supabase SSR, Google Sign-In, login/register/reset
- [ ] **Phase 4** — Protected user pages: dashboard, profile, settings, notifications
- [ ] **Phase 5** — Competitions: list, detail (join + connect), public leaderboard
- [ ] **Phase 6** — Admin: competitions admin, blog admin, leaderboard admin
- [ ] **Phase 7** — DNS switchover to Next.js at nanaforex.com

## Note on the API routes

Existing serverless functions in `/api/*` at the repo root (health, competitions/*, admin/*, sync) stay untouched. The new React project doesn't need to re-implement them — once the DNS switches, we either:
- Move `/api/*` into `/web/app/api/*` (Next.js route handlers), or
- Keep the two Vercel projects separately, one owning the marketing/user pages, one owning the API.

We'll pick when we get to Phase 3.
