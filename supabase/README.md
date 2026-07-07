# Nana Forex — Backend Setup (Phase 1: Auth)

This folder holds the server-side pieces that back the login/register flow.
Everything here runs on **Supabase** — the same project already used by the
blog and dashboard (`js/env.js` → `xjmakedoqdbfafhbhjsj`).

## What Phase 1 gives you

Covers backend-requirements **#1–11** (registration, login, logout, password
reset, email verification, session/JWT, profile CRUD, avatar upload,
preferences, account deletion) plus the shared `notifications` and
`activity_log` tables.

New files added to the site:

| File | Purpose |
|------|---------|
| `supabase/schema.sql` | Tables, triggers, Row Level Security |
| `supabase/storage-avatars.sql` | Avatar bucket policies (run after creating the bucket) |
| `supabase/blog-posts-rls.sql` | **Security fix:** enables RLS + admin-only writes on `blog_posts` |
| `supabase/leaderboard.sql` | Live leaderboard + challenge tables (public read, admin write) |
| `js/auth.js` | Reusable browser auth module (`window.NanaAuth`) |
| `css/auth.css` | Styling for the auth pages |
| `htmls/register.html` | Create account |
| `htmls/login.html` | Log in |
| `htmls/reset-password.html` | Request a reset email |
| `htmls/update-password.html` | Landing page for the reset link |

## Setup steps (once)

1. **Apply the schema.** Open the Supabase dashboard → **SQL Editor** → paste
   the contents of `schema.sql` → **Run**. This creates the tables, the
   auto-profile trigger, and RLS policies.

2. **Set up avatar storage.** Dashboard → **Storage → New bucket** → name it
   `avatars`, mark it **Public**, Save. (Creating a bucket initialises the
   Storage schema — this is why it's a separate step; running it inside
   `schema.sql` on a brand-new project fails with
   `relation "storage.buckets" does not exist`.) Then SQL Editor → run
   `storage-avatars.sql` for the per-user upload policies.

3. **Configure Auth redirect URLs.** Dashboard → **Authentication → URL
   Configuration** → add your site origin (e.g. `http://localhost:5500` for
   local testing and the production URL) to **Redirect URLs**. The reset/verify
   emails link back to these.

4. **Email verification (optional but recommended).** Dashboard →
   **Authentication → Providers → Email** → toggle *Confirm email*. When ON,
   `auth.js` shows a "check your email" message after registration; when OFF,
   users are logged in immediately.

5. **Fix the blog_posts security warning + add the leaderboard.** Run
   `blog-posts-rls.sql` (enables RLS with public-read / **admin-only** writes)
   and `leaderboard.sql` (live leaderboard + challenge tables). Both depend on
   `public.is_admin()` created in `schema.sql`, so run schema.sql first.

6. **Grant yourself admin.** Admin writes (blog posts, leaderboard, challenge)
   require `profiles.role = 'admin'`. After creating your owner account, run in
   the SQL editor:

   ```sql
   update public.profiles set role = 'admin'
   where id = (select id from auth.users where email = 'you@nanaforex.com');
   ```

   Non-admin accounts can log in to the site but are refused the blog/dashboard
   admin panels (and blocked by RLS even if they bypass the UI).

7. **Test it.** Serve the site over http (not `file://`, or the redirects
   won't work) and open `htmls/register.html`.

## About the advisor warnings

- **CRITICAL – `blog_posts` (RLS Disabled in Public):** pre-existing, from the
  blog feature. Fixed by step 5 (`blog-posts-rls.sql`).
- **WARN – `profiles`/`notifications`/`activity_log` (Auth RLS Initialization
  Plan):** a *performance* hint, not a hole. `schema.sql` already wraps
  `auth.uid()` as `(select auth.uid())` so it's evaluated once per query. If you
  applied an earlier version of the schema, just re-run `schema.sql` to clear it.

## How the frontend uses it

`js/auth.js` exposes `window.NanaAuth` and auto-wires any of these element IDs
if present on the page: `registerForm`, `loginForm`, `resetForm`,
`updatePasswordForm`, and any element with `data-logout`.

To protect a page (e.g. a real user dashboard):

```js
// after supabase-client.js + auth.js are loaded
NanaAuth.requireAuth("login.html").then((session) => {
  if (session) NanaAuth.loadProfile().then(renderProfile);
});
```

## Note for the merge

The main collaborator's branch reportedly already has a login/register **page**.
If those pages use different input IDs than the ones `auth.js` expects
(`loginEmail`, `loginPassword`, `regFullName`, `regEmail`, `regPhone`,
`regPassword`, `regConfirmPassword`, `resetEmail`, `newPassword`), either rename
the inputs to match or adjust the selectors at the top of `auth.js`. The SQL
schema is frontend-agnostic and can be applied as-is.

See `../BACKEND_ROADMAP.md` for how the remaining ~174 requirements map into
later phases.
