# CARDLY — AUTH & USER SYSTEM AUDIT

**Generated:** 2026-05-18  
**Scope:** Read-only audit of all auth, user, permission, and session infrastructure.  
**Phase:** 1 of 5 — Discovery only. No code was modified.

---

## A. CURRENT SCHEMA STATE

### A1. Auth tables (managed by Supabase Auth)

Supabase manages `auth.users`, `auth.identities`, and `auth.sessions` automatically. These tables are not in the migration files because they are created by Supabase on project init.

- **`auth.users`** — ✅ Exists (Supabase-managed). No custom columns added to it. The `handle_new_user()` trigger reads `new.raw_user_meta_data->>'full_name'` on insert to populate the `profiles` table.
- **`auth.identities`** — ⚠️ Exists (Supabase-managed). Used for OAuth provider linking. No code reads from it directly.
- **`auth.sessions`** — ⚠️ Exists (Supabase-managed). Session management is fully delegated to Supabase. Not directly queried anywhere in app code.

### A2. Application-level user tables

#### `profiles`

Defined in `supabase/migrations/001_initial_schema.sql` lines 7–13. Amended by `supabase/migrations/002_brand_kit.sql`.

| Column       | Type         | Nullable | Default        |
|--------------|--------------|----------|----------------|
| `id`         | uuid         | NO       | (FK to auth.users) |
| `email`      | text         | YES      | —              |
| `full_name`  | text         | YES      | —              |
| `plan`       | text         | NO       | `'free'`       |
| `created_at` | timestamptz  | NO       | `now()`        |
| `brand_kit`  | jsonb        | NO       | `'{}'::jsonb`  |

**Constraints:**
- `plan` has a CHECK constraint: `plan in ('free', 'pro', 'studio')`
- `email` is UNIQUE
- `id` is PK and CASCADE-deletes when the `auth.users` row is deleted

**Foreign keys:** `id` → `auth.users(id) ON DELETE CASCADE`

**RLS:** ✅ Enabled  
**RLS policy:**
```sql
create policy "profiles: own row" on profiles
  for all using (auth.uid() = id);
```
Gap: This single `for all` policy covers SELECT, INSERT, UPDATE, DELETE but does not separate them. INSERT is allowed for any authenticated user where `auth.uid() = id` — this is correct for profile creation but means RLS is not differentiating read vs write permissions. ⚠️

**No `role` column exists.** The role system described in the target model (SUPER_ADMIN, ADMIN, USER, VISITOR) does not exist anywhere in the database. ❌

### A3. Other tables that reference users

#### `events`

| Column            | Type        | Nullable | Default              |
|-------------------|-------------|----------|----------------------|
| `id`              | uuid        | NO       | `gen_random_uuid()`  |
| `user_id`         | uuid        | NO       | FK → profiles(id)    |
| `name`            | text        | NO       | —                    |
| `slug`            | text        | NO       | (UNIQUE)             |
| `background_url`  | text        | YES      | —                    |
| `background_width`| int         | YES      | —                    |
| `background_height`| int        | YES      | —                    |
| `zones`           | jsonb       | NO       | `'[]'::jsonb`        |
| `status`          | text        | NO       | `'draft'`            |
| `view_count`      | int         | NO       | 0                    |
| `download_count`  | int         | NO       | 0                    |
| `created_at`      | timestamptz | NO       | `now()`              |
| `updated_at`      | timestamptz | NO       | `now()`              |

**On user delete:** `CASCADE` — events are deleted when the user is deleted. ✅  
**RLS:** ✅ Enabled  
**Policies:**
```sql
create policy "events: owner access" on events
  for all using (auth.uid() = user_id);

create policy "events: public read published" on events
  for select using (status = 'published');
```
⚠️ The `for all` owner policy and the public SELECT policy can overlap — a published event owned by the user is matched by both. This is safe but creates implicit dual access. No insert check enforces `user_id = auth.uid()` on the WITH CHECK clause — relies on app-level enforcement.

#### `event_variants`

| Column              | Type        | Nullable | Default             |
|---------------------|-------------|----------|---------------------|
| `id`                | uuid        | NO       | `gen_random_uuid()` |
| `event_id`          | uuid        | NO       | FK → events(id)     |
| `variant_name`      | text        | NO       | —                   |
| `variant_slug`      | text        | NO       | —                   |
| `background_url`    | text        | YES      | —                   |
| `background_width`  | int         | YES      | —                   |
| `background_height` | int         | YES      | —                   |
| `zones`             | jsonb       | NO       | `'[]'::jsonb`       |
| `position`          | int         | NO       | 0                   |
| `created_at`        | timestamptz | NO       | `now()`             |

**Note:** `event_variants` has NO RLS policies defined in any migration. ❌ All operations go through `createAdminClient()` (service role), which bypasses RLS entirely. This means any authenticated user could theoretically read/modify any variant if they hit the table directly via the anon key. In practice the API routes use the admin client correctly, but no database-level guardrail exists.

#### `generated_cards`

| Column          | Type        | Nullable | Default             |
|-----------------|-------------|----------|---------------------|
| `id`            | uuid        | NO       | `gen_random_uuid()` |
| `event_id`      | uuid        | NO       | FK → events(id)     |
| `variant_id`    | uuid        | YES      | —                   |
| `attendee_name` | text        | YES      | —                   |
| `attendee_data` | jsonb       | YES      | —                   |
| `output_url`    | text        | YES      | —                   |
| `created_at`    | timestamptz | NO       | `now()`             |

**On event delete:** `CASCADE` — generated cards are deleted when the event is deleted. ✅  
**RLS:** ✅ Enabled  
**Policies:**
```sql
create policy "generated_cards: public insert" on generated_cards
  for insert with check (true);

create policy "generated_cards: owner read" on generated_cards
  for select using (
    exists (
      select 1 from events
      where events.id = generated_cards.event_id
        and events.user_id = auth.uid()
    )
  );
```
⚠️ `with check (true)` on the public insert policy means anyone can insert a generated_card for any event_id, including unpublished or archived events. The render API route checks `event.status !== 'published'` in application code, but the RLS policy does not enforce this at DB level.

---

## B. CURRENT AUTH FLOWS — WHAT EXISTS

### B1. Sign up

- **File:** `app/(auth)/signup/page.tsx` — client component
- **Handler:** `app/(auth)/actions.ts` → `signUp()` (server action)
- **Email + password:** ✅ Supported via `supabase.auth.signUp()`
- **Email verification required:** ⚠️ Depends on Supabase project settings (not configurable in code). If the Supabase project has "Confirm email" enabled, verification is required. If not, user is signed in immediately. Cannot determine which setting is active without dashboard access.
- **Profile row created on signup:** ✅ Via `handle_new_user()` DB trigger — fires on `auth.users` INSERT, creates `profiles` row automatically.
- **Welcome email sent:** ❌ No welcome email logic anywhere in code. If Supabase "Confirm email" is on, a confirmation email is sent by Supabase automatically, but there is no custom welcome email.
- **Redirects after signup:** → `/dashboard` immediately (even if email verification is required — this may cause issues if unverified users hit protected pages).
- **Full name collected:** ✅ `full_name` field in signup form, passed via `options.data`

### B2. Sign in

- **File:** `app/(auth)/login/page.tsx`
- **Handler:** `app/(auth)/actions.ts` → `signIn()`
- **Email + password:** ✅ Via `supabase.auth.signInWithPassword()`
- **Rate limiting on failed attempts:** ❌ No rate limiting in application code. Supabase has built-in rate limiting on Auth endpoints (configurable in dashboard), but nothing is enforced at app level.
- **Error messages:** ⚠️ Raw Supabase error messages surfaced directly to the user (e.g., `"Invalid login credentials"`). Not sanitized or translated to friendly copy.
- **Redirects after signin:** → `/dashboard`

### B3. Google OAuth

- **Configured in Supabase dashboard:** ⚠️ Unknown — requires dashboard access
- **Code wiring in app:** ❌ No Google OAuth button, no `signInWithOAuth()` call anywhere in codebase
- **Callback route exists:** ❌ No `app/(auth)/callback/` route exists. There is a `redirectTo` in `resetPassword()` pointing to `/auth/callback` but no handler file for it.
- **Profile created on first Google signin:** ⚠️ The `handle_new_user()` trigger would fire, but `full_name` from Google metadata depends on whether `raw_user_meta_data` contains it in the expected format.

### B4. Email verification

- **Required for new signups:** ⚠️ Depends on Supabase dashboard setting — not determinable from code
- **Verification email template configured:** ⚠️ Supabase dashboard only — not determinable from code
- **Resend verification flow exists:** ❌ No "resend verification email" page or action in codebase

### B5. Forgot password / reset

- **Forgot password page:** ❌ No page exists. The login page has a "Forgot password?" label (`app/(auth)/login/page.tsx` line 123) but it is a `<span>` with `cursor-default` and `title="Password reset coming soon"` — it is a placeholder, not a link.
- **Reset password action:** ✅ `resetPassword()` server action exists in `app/(auth)/actions.ts` lines 49–56. It calls `supabase.auth.resetPasswordForEmail()` and redirects to `/auth/callback?next=/settings/reset-password`.
- **Reset password page:** ❌ No `/settings/reset-password` page exists. The callback route (`/auth/callback`) also does not exist.
- **Token expiration handling:** ❌ No handler exists to receive the reset token.

### B6. Change password (signed in)

- **Settings page:** ❌ No settings page exists at `/settings`
- **Change password flow:** ❌ Not implemented

### B7. Change email

- **Flow exists:** ❌ Not implemented

### B8. Sign out

- **Sign out button location:** ✅ In the left sidebar nav, `app/(app)/layout.tsx` line 274 (`handleSignOut` calls `supabase.auth.signOut()` then redirects to `/login`). Also `signOut()` server action in `app/(auth)/actions.ts` line 42.
- **Clears session properly:** ✅ `supabase.auth.signOut()` clears the cookie-based session
- **"Sign out all devices" option:** ❌ Not implemented. Supabase supports `{ scope: 'global' }` in `signOut()` but this is not wired up.

---

## C. CURRENT MIDDLEWARE & ROUTE PROTECTION

### C1. middleware.ts analysis

**File:** `middleware.ts` (root) → delegates to `lib/supabase/middleware.ts`

```ts
// lib/supabase/middleware.ts lines 33–47
const isProtected =
  request.nextUrl.pathname.startsWith("/dashboard") ||
  request.nextUrl.pathname.startsWith("/events") ||
  request.nextUrl.pathname.startsWith("/analytics") ||
  request.nextUrl.pathname.startsWith("/templates") ||
  request.nextUrl.pathname.startsWith("/brand") ||
  request.nextUrl.pathname.startsWith("/settings") ||
  request.nextUrl.pathname.startsWith("/team");

if (isProtected && !user) {
  const url = request.nextUrl.clone();
  url.pathname = "/login";
  return NextResponse.redirect(url);
}
```

**Protected routes:** `/dashboard`, `/events/**`, `/analytics`, `/templates`, `/brand`, `/settings`, `/team`

**Public routes (implicit):** `/`, `/pricing`, `/login`, `/signup`, `/c/**` (attendee public pages), `/api/**`

**Unauth behavior:** Redirect to `/login`

**Matcher config:**
```ts
matcher: [
  "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
],
```
This matches all routes except static assets. ✅

⚠️ **Gap:** `/api/**` routes are NOT in the `isProtected` list. The middleware does not block unauthenticated requests to API routes. Each API route must check auth independently.

### C2. Server Components auth check pattern

**`app/(app)/dashboard/page.tsx` lines 14–15:**
```ts
const { data: { user } } = await supabase.auth.getUser();
if (!user) redirect('/login');
```
✅ Explicit auth check present in dashboard page.

**`app/(app)/layout.tsx` lines 422–424 (client component):**
```ts
supabase.auth.getUser().then(({ data }) => {
  if (!data.user) { router.push('/login'); return; }
```
⚠️ This is a CLIENT-SIDE check in the layout — it runs after the page has already rendered. Not a server-side guard. Security depends on the middleware redirect, not this check.

**Other `(app)` pages:**
- `app/(app)/events/[id]/page.tsx` — ⚠️ Not read directly; likely relies on middleware + layout redirect
- `app/(app)/events/[id]/edit/page.tsx` — ⚠️ Same assumption
- `app/(app)/events/new/page.tsx` — ⚠️ Same assumption

### C3. API route auth checks

| Route | Auth Checked | Ownership Verified | On Auth Failure |
|---|---|---|---|
| `POST /api/events/create` | ✅ `getUser()` line 19 | ✅ `user_id` set to `user.id` | 401 JSON |
| `GET /api/events/[id]` | ✅ `getUser()` line 7 | ✅ `.eq('user_id', user.id)` | 401 / 404 |
| `PATCH /api/events/[id]` | ✅ `getUser()` line 25 | ✅ `.eq('user_id', user.id)` | 401 / 500 |
| `DELETE /api/events/[id]` | ✅ `getUser()` line 53 | ✅ `.eq('user_id', user.id)` | 401 / 500 |
| `POST /api/render` | ❌ No auth check | ❌ Only checks `event.status === 'published'` | — |
| `GET /api/brand` | ✅ `getUser()` line 6 | ✅ `.eq('id', user.id)` | 401 JSON |
| `PATCH /api/brand` | ✅ `getUser()` line 20 | ✅ `.eq('id', user.id)` | 401 JSON |

⚠️ **`/api/render` has no authentication check.** Any anonymous request can call it with a valid `variantId`. The only gate is `event.status !== 'published'`. This is intentional for the attendee public flow, but it means the render endpoint could be used to probe unpublished event content if a `variantId` is guessed (UUIDs are hard to guess, low practical risk).

---

## D. ROLE / PERMISSION SYSTEM

### D1. Current state

❌ **No role system exists anywhere in the codebase.**

- No `role` column in `profiles`
- No `is_admin`, `is_super_admin` flag anywhere
- No permission check function
- No admin-only middleware branch
- The `plan` column (`free` / `pro` / `studio`) exists and is used for feature gating (event limits, watermark), but it is not a role/permission system

The entire SUPER_ADMIN / ADMIN / USER role model described in the target spec needs to be built from scratch.

### D2. Admin access

❌ No admin route, admin UI, or admin tooling exists. There is no way to access admin functionality currently.

---

## E. PROFILE & ACCOUNT SETTINGS

### E1. Profile editing

- **Settings page:** ❌ No `/settings` page exists in the codebase (the route is listed in nav and is middleware-protected, but the page file does not exist — navigating there would 404)
- **Editable fields:** None — no settings UI built
- **Avatar upload:** ❌
- **Display name, bio:** ❌

### E2. Account deletion

- **Delete account flow exists:** ⚠️ Partial. `deleteAccount()` server action exists in `app/(auth)/actions.ts` lines 58–69. It calls `admin.auth.admin.deleteUser(user.id)`. The trigger `on delete cascade` on `profiles` and events will propagate deletes.
- **What's cascaded on delete:**
  - `auth.users` delete → `profiles` delete (CASCADE) → triggers cascade to events
  - `events` delete → `generated_cards` delete (CASCADE)
  - Storage files (event backgrounds, generated card outputs) are NOT automatically deleted — orphaned files remain in Supabase Storage
- **GDPR compliance level:** ⚠️ Partial. The delete action removes all DB data but leaves storage files. No data export, no confirmation email, no "deletion scheduled" / cool-off period. Not GDPR-compliant.

### E3. Data export

❌ No data export flow exists anywhere.

### E4. Notification preferences

❌ Not implemented.

---

## F. SECURITY CHECKS

### F1. Password policy

- **Minimum length:** ⚠️ Client-side only — `minLength={8}` on the signup form input (`app/(auth)/signup/page.tsx` line 152). No server-side or Supabase-level enforcement visible in code (Supabase does have configurable minimum length in dashboard).
- **Complexity requirements:** ❌ No complexity rules (uppercase, number, special char) enforced anywhere
- **Pwned password check:** ❌ Not implemented

### F2. Session management

- **Session storage:** ✅ Cookie-based via `@supabase/ssr`. The `createServerClient` in `lib/supabase/server.ts` and `lib/supabase/middleware.ts` use `cookies()` and request cookie management — correct SSR-safe approach.
- **Session expiration:** ⚠️ Default Supabase session duration (typically 1 hour access token, refresh token handled automatically). Not customized in code.
- **Refresh tokens:** ✅ Handled automatically by `@supabase/ssr` middleware via `updateSession()`.

### F3. CSRF

- ⚠️ Next.js Server Actions have built-in CSRF protection (origin header checked by Next.js). API routes (`app/api/**`) do not have explicit CSRF headers checked, but they rely on the Supabase auth token in cookies which is same-site protected.

### F4. Rate limiting

- **Login:** ❌ No app-level rate limiting. Supabase has configurable rate limits on Auth endpoints (dashboard setting).
- **Password reset:** ❌ No app-level rate limiting.
- **Signup:** ❌ No app-level rate limiting.
- No `upstash`, `redis`, or rate-limit library installed.

### F5. Email enumeration

- ⚠️ Raw Supabase error messages are surfaced to the user. When signing in with a non-existent email, Supabase returns `"Invalid login credentials"` (does not distinguish "email not found" from "wrong password"). This is correct behavior — Supabase does not enumerate emails by default. Verify in dashboard that "Secure email change" is enabled.

---

## G. RLS POLICY HEALTH

### `profiles`

| Operation | Policy | Status |
|---|---|---|
| SELECT | `for all` using `auth.uid() = id` | ✅ Correct |
| INSERT | `for all` — no separate insert check | ⚠️ Should be done by trigger only; user should not be able to INSERT a profile for another uid |
| UPDATE | `for all` using `auth.uid() = id` | ✅ Correct |
| DELETE | `for all` using `auth.uid() = id` | ⚠️ Users can self-delete their profile row, bypassing `deleteAccount()` admin action — minor inconsistency |

### `events`

| Operation | Policy | Status |
|---|---|---|
| SELECT (owner) | `for all` using `auth.uid() = user_id` | ✅ |
| SELECT (public) | `for select` using `status = 'published'` | ✅ |
| INSERT | `for all` — no `WITH CHECK (user_id = auth.uid())` | ⚠️ A user could theoretically insert an event with any `user_id` via direct Supabase client call. App code always sets `user_id = user.id` but the DB doesn't enforce this. |
| UPDATE | `for all` using `auth.uid() = user_id` | ✅ |
| DELETE | `for all` using `auth.uid() = user_id` | ✅ |

### `event_variants`

| Operation | Policy | Status |
|---|---|---|
| ALL | ❌ No RLS policies defined | ❌ Critical gap |

All `event_variants` operations use `createAdminClient()` (service role) in app code — bypasses RLS. But if a Supabase client with anon key hit this table directly, there would be no restrictions. RLS policies should still be defined as defense-in-depth.

### `generated_cards`

| Operation | Policy | Status |
|---|---|---|
| INSERT | `for insert with check (true)` | ⚠️ Anyone can insert for any event_id, including drafts/archived |
| SELECT (owner) | Checks via events join | ✅ |
| UPDATE | No policy | ❌ No UPDATE policy; would be blocked by RLS if attempted but explicit deny is clearer |
| DELETE | No policy | ❌ No DELETE policy; event owners cannot delete individual cards |

---

## H. ENV VARIABLES (names only, no values)

From `.env.local.example` and code references:

| Variable | Referenced In | Status |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | `lib/supabase/server.ts`, `lib/supabase/client.ts`, `lib/supabase/middleware.ts` | ✅ Required |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Same as above | ✅ Required |
| `SUPABASE_SERVICE_ROLE_KEY` | `lib/supabase/server.ts` (createAdminClient) | ✅ Required |
| `NEXT_PUBLIC_APP_URL` | `app/(auth)/actions.ts` line 52 (resetPassword redirectTo) | ✅ Required |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | ❌ Not referenced anywhere in code | — |
| Any email/SMTP keys (Resend, SendGrid) | ❌ Not referenced anywhere in code | — |
| Any rate-limit keys (Upstash Redis) | ❌ Not referenced anywhere in code | — |

---

## I. INSTALLED PACKAGES

From `package.json`:

| Package | Version | Notes |
|---|---|---|
| `@supabase/supabase-js` | ^2.105.4 | ✅ Current |
| `@supabase/ssr` | ^0.10.3 | ✅ Preferred approach (not deprecated auth-helpers) |
| `@supabase/auth-helpers-nextjs` | Not installed | ✅ Good — deprecated package not present |
| Password validation library | None | ❌ No `zxcvbn`, `@zxcvbn-ts`, or similar |
| Rate limit library | None | ❌ No Upstash, express-rate-limit, etc. |
| Email library | None | ❌ No Resend, Nodemailer, etc. |
| `react-hook-form` | ^7.75.0 | ✅ Present (used in editor) |
| `zod` | ^4.4.3 | ✅ Present (for form validation) |

---

## J. KNOWN GAPS — SUMMARY TABLE

| Severity | Feature | Current State | Phase to fix |
|---|---|---|---|
| 🔴 Critical | Role system (SUPER_ADMIN, ADMIN, USER) | Does not exist anywhere | Phase 2 |
| 🔴 Critical | `event_variants` has zero RLS policies | No DB-level protection | Phase 2 |
| 🔴 Critical | Forgot password page | Placeholder text, no actual page | Phase 3 |
| 🔴 Critical | Auth callback route `/auth/callback` | Referenced in `resetPassword()` but file doesn't exist | Phase 3 |
| 🔴 Critical | Settings page at `/settings` | Route protected by middleware but page doesn't exist — 404 | Phase 3 |
| 🟠 High | Google OAuth | Not wired in code | Phase 3 |
| 🟠 High | Email verification resend flow | Not implemented | Phase 3 |
| 🟠 High | Change password (signed in) | Not implemented | Phase 4 |
| 🟠 High | Change email | Not implemented | Phase 4 |
| 🟠 High | `/api/render` has no auth check | Public endpoint, intentional but unguarded | Phase 2 (document intent) |
| 🟠 High | Sign out all sessions | Only signs out current session | Phase 4 |
| 🟠 High | Storage files orphaned on account delete | S3/Supabase files not cleaned up | Phase 4 |
| 🟡 Medium | `events` INSERT has no RLS WITH CHECK on `user_id` | App-enforced only | Phase 2 |
| 🟡 Medium | `generated_cards` INSERT allows any event_id | Should check `event.status = 'published'` | Phase 2 |
| 🟡 Medium | `profiles` INSERT RLS — should be trigger-only | Minor inconsistency | Phase 2 |
| 🟡 Medium | Password policy — client-side only | min 8 chars in HTML only, no server/DB enforcement | Phase 3 |
| 🟡 Medium | Raw Supabase error messages shown to users | Not user-friendly, leaks internals | Phase 3 |
| 🟡 Medium | Signup redirects to dashboard before verification | If "confirm email" is on, user hits dashboard unverified | Phase 3 |
| 🟡 Medium | Account deletion leaves storage files | GDPR compliance gap | Phase 4 |
| 🟢 Low | Admin tooling / user management dashboard | Does not exist | Phase 5 |
| 🟢 Low | Data export (GDPR) | Not implemented | Phase 4 |
| 🟢 Low | Notification preferences | Not implemented | Phase 4 |
| 🟢 Low | Rate limiting (app-level) | Relies on Supabase defaults | Phase 3 |
| 🟢 Low | Pwned password check | Not implemented | Phase 3 |
| 🟢 Low | "Sign out all sessions" option | Not implemented | Phase 4 |

---

## K. RECOMMENDED PHASE 2 SCOPE

Phase 2 is the **Foundation** — the schema and infrastructure changes that BLOCK everything else. Nothing in Phase 3 or beyond can be built correctly without these.

### K1. Schema changes needed

1. **Add `role` column to `profiles`:**
   ```sql
   alter table profiles
     add column role text not null default 'user'
     check (role in ('user', 'admin', 'super_admin'));
   ```
   Super admin rows set manually in DB. Admin rows set by super admins via admin UI (Phase 5).

2. **Add RLS policies for `event_variants`:**
   ```sql
   alter table event_variants enable row level security;
   
   -- Owners can do anything via the event relationship
   create policy "variants: owner access" on event_variants
     for all using (
       exists (select 1 from events where events.id = event_variants.event_id and events.user_id = auth.uid())
     );
   
   -- Public can read variants of published events
   create policy "variants: public read published" on event_variants
     for select using (
       exists (select 1 from events where events.id = event_variants.event_id and events.status = 'published')
     );
   ```

3. **Tighten `events` INSERT policy:**
   ```sql
   -- Replace the 'for all' policy with separate policies
   drop policy "events: owner access" on events;
   
   create policy "events: owner select" on events
     for select using (auth.uid() = user_id);
   
   create policy "events: owner insert" on events
     for insert with check (auth.uid() = user_id);
   
   create policy "events: owner update" on events
     for update using (auth.uid() = user_id);
   
   create policy "events: owner delete" on events
     for delete using (auth.uid() = user_id);
   
   create policy "events: public read published" on events
     for select using (status = 'published');
   ```

4. **Tighten `generated_cards` INSERT to published events only:**
   ```sql
   drop policy "generated_cards: public insert" on generated_cards;
   
   create policy "generated_cards: public insert published only" on generated_cards
     for insert with check (
       exists (select 1 from events where events.id = generated_cards.event_id and events.status = 'published')
     );
   ```

### K2. Application code changes needed

1. **Create `/auth/callback/route.ts`** — handles Supabase auth callbacks (email verification, password reset, OAuth). This is a prerequisite for Google OAuth and password reset in Phase 3.

2. **Create `/settings/page.tsx`** — basic shell page (can be mostly empty) so the route doesn't 404. Currently in the middleware protected list but the file doesn't exist.

3. **Add role-aware middleware** — read `role` from `profiles` and expose it for downstream use. Protect any admin routes created in Phase 5.

4. **Document `/api/render` is intentionally public** — add a comment confirming this is expected (public attendee flow). No code change needed, just explicit documentation to avoid confusion in future audits.

### K3. Types update

Update `types/database.ts` to add `role` to `profiles` Row/Insert/Update.

---

## L. OPEN QUESTIONS

1. **Email verification configured?** — Supabase dashboard → Authentication → Settings → "Confirm email". If ON, the current signup flow redirects to `/dashboard` before the user verifies, which may cause downstream issues (RLS would allow the user through but their email is technically unverified). Needs verification.

2. **Google OAuth configured in Supabase?** — Dashboard → Authentication → Providers → Google. Must be enabled there before any code wiring makes sense.

3. **Supabase email templates** — Password reset, email confirmation, and change-email templates are configured in Supabase dashboard. The `resetPassword()` redirect URL (`/auth/callback?next=/settings/reset-password`) must match exactly what's configured in the Supabase "Redirect URLs" allowlist, or the reset link will fail.

4. **Storage bucket policies** — `event-backgrounds` and `generated-cards` buckets are referenced in comments in `001_initial_schema.sql` but policies are not defined in migrations. Need to confirm whether the buckets exist in the Supabase dashboard and whether they have correct access policies (public read for event-backgrounds? Private for generated-cards?).

5. **Session token duration** — What is the configured JWT expiry in Supabase? Default is 3600s (1 hour). For a SaaS dashboard that designers keep open, this may be too short. Needs a decision.

6. **`plan` field — who sets it?** — Currently there is no way to upgrade a user's plan from within the app. Is there Stripe integration planned? How does a user go from `free` to `pro` today? Manually in DB?

7. **`brand_kit` column** — Was recently added via `002_brand_kit.sql`. Confirm this migration has been run on the production Supabase instance (not just locally).
