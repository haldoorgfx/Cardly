# CARDLY — PHASE 1: USER & AUTH SYSTEM AUDIT

**Discovery prompt only. Claude Code DOES NOT write any code in this phase. It reads the codebase and produces a detailed audit document. We use that document to write Phase 2 (Foundation), Phase 3 (Auth Flows), etc.**

---

## How to use

1. Make sure clean state:
   ```
   cd C:\Users\cabda\cardly
   git checkout master
   git pull origin master
   git status
   ```

2. Open Claude Code (fresh session). Paste the prompt below.

3. Claude Code will produce a single audit document (`AUTH_AUDIT.md` in project root) and commit nothing else.

4. Send me the audit document. I write Phase 2 from there.

---

## THE PROMPT — PASTE EVERYTHING BELOW INTO CLAUDE CODE

```
We are doing a READ-ONLY AUDIT of the user/auth/permissions system in Eventera. The goal is to produce a comprehensive document mapping what currently exists, what is partially built, what is missing, and what is broken.

This phase produces NO CODE. Only a single audit document. The audit informs subsequent phases.

────────────────────────────────────────────
ABSOLUTE BOUNDARIES
────────────────────────────────────────────

You are FORBIDDEN from modifying any source code in this session.

Allowed actions:
- READ any file
- RUN read-only commands (git log, etc)
- CREATE one new file: AUTH_AUDIT.md in the project root

Not allowed:
- Modify any .ts / .tsx / .js / .jsx / .sql / .json file
- Run database migrations
- Install packages
- Touch Supabase dashboard
- Run `pnpm dev` or `pnpm build`

────────────────────────────────────────────
TARGET USER MODEL FOR CARDLY
────────────────────────────────────────────

- SUPER ADMIN: founder accounts (manually flagged in DB). Can see all data, manage all users, access admin tooling.
- ADMIN: invited helpers. Same powers as super admin but cannot create other admins.
- USER: standard organizers who sign up. Can manage only their own events.
- VISITOR: attendees who fill out cards. NO account required. They are anonymous public users.

Auth methods to be supported in v1:
- Email + password
- Google OAuth
- (Future: Magic link, Apple OAuth, 2FA — not in scope for v1)

Account features to be supported:
- Sign up / sign in
- Email verification
- Forgot password / reset password
- Change password (while signed in)
- Change email (with re-verification)
- Edit profile (name, avatar, etc)
- Notification preferences
- Account deletion (GDPR)
- Data export (GDPR)
- Sign out / sign out all sessions

────────────────────────────────────────────
STEP 0 — READ THESE FILES
────────────────────────────────────────────

Read every file in:

1. app/(auth)/** — signup, login, callback, layouts
2. app/(app)/** — anything that requires auth
3. middleware.ts — auth protection logic
4. lib/supabase/** — Supabase client setup (server vs client vs middleware)
5. types/database.ts — current type definitions
6. supabase/migrations/** — read every migration file to understand schema history

Also read:
- CLAUDE.md
- BRAND.md if it exists
- package.json (to see what auth libs are installed)
- next.config.mjs

Note env variable NAMES (not values) from .env.example or references in code.

────────────────────────────────────────────
STEP 1 — PRODUCE THE AUDIT DOCUMENT
────────────────────────────────────────────

Create AUTH_AUDIT.md in project root with these sections. Be thorough. Quote actual file paths and line numbers where relevant. Use ✅ / ⚠️ / ❌ to mark status.

# CARDLY — AUTH & USER SYSTEM AUDIT

## A. CURRENT SCHEMA STATE

### A1. Auth tables (managed by Supabase Auth)
- auth.users table — confirm exists, list any custom columns
- auth.identities — for OAuth providers
- auth.sessions — session management

### A2. Application-level user tables
For each table that exists, document:
- Table name
- Columns (name + type + nullable + default)
- Foreign keys
- Indexes
- RLS enabled? Yes/No
- RLS policies (paste each one verbatim)

Specifically look for:
- profiles table — what columns exist?
- Any role / permission columns
- plan column (free/pro/studio)
- Any audit_log, sessions, or auth_events tables

### A3. Other tables that reference users
For each table with a user_id foreign key:
- Table name
- How user_id is enforced in RLS
- What happens when user is deleted (CASCADE, SET NULL, etc)

## B. CURRENT AUTH FLOWS — WHAT EXISTS

### B1. Sign up
- File path of signup page
- File path of signup action/handler
- Email + password supported? ✅/⚠️/❌
- Email verification required? ✅/⚠️/❌
- Profile row created on signup? ✅/⚠️/❌
- Welcome email sent? ✅/⚠️/❌
- Redirects to where after signup?

### B2. Sign in
- File path
- Email + password supported? ✅/⚠️/❌
- Rate limiting on failed attempts? ✅/⚠️/❌
- Error messages user-friendly? Quote them
- Redirects to where after signin?

### B3. Google OAuth
- Configured in Supabase? Unknown without dashboard access — note as ⚠️
- Code wiring exists in app? ✅/⚠️/❌
- Callback route exists? File path
- Profile created on first Google signin? ✅/⚠️/❌

### B4. Email verification
- Required for new signups? ✅/⚠️/❌
- Verification email template configured? Unknown — note as ⚠️
- Resend verification flow exists? ✅/⚠️/❌

### B5. Forgot password / reset
- Forgot password page exists? File path + ✅/⚠️/❌
- Reset password page exists? File path + ✅/⚠️/❌
- Email template configured? Unknown — note as ⚠️
- Token expiration handled gracefully? ✅/⚠️/❌

### B6. Change password (signed in)
- Settings page exists? ✅/⚠️/❌
- Requires current password to change? ✅/⚠️/❌

### B7. Change email
- Flow exists? ✅/⚠️/❌
- Re-verification of new email? ✅/⚠️/❌

### B8. Sign out
- Sign out button exists? Location?
- Clears session properly? ✅/⚠️/❌
- "Sign out all devices" option exists? ✅/⚠️/❌

## C. CURRENT MIDDLEWARE & ROUTE PROTECTION

### C1. middleware.ts analysis
- Quote the relevant section that protects routes
- Which routes are protected (paste matcher config)
- Which routes are public
- What happens when unauthenticated user hits protected route?

### C2. Server Components auth check pattern
- How does app/(app)/dashboard/page.tsx check auth? Quote it
- Are auth checks consistent across all (app) routes?
- Any routes missing auth checks? List them

### C3. API route auth checks
- For each route in app/api/**, document:
  - Is auth checked? ✅/⚠️/❌
  - Is user ownership of resource verified? ✅/⚠️/❌
  - What happens on auth failure?

## D. ROLE / PERMISSION SYSTEM

### D1. Current state
- Does any role field exist anywhere? ✅/⚠️/❌
- If yes: where, what values, how is it set?
- If no: confirm the entire role system needs to be built from scratch

### D2. Admin access
- Is there any admin route or UI? ✅/⚠️/❌
- How would you currently access admin tooling?

## E. PROFILE & ACCOUNT SETTINGS

### E1. Profile editing
- Settings page exists? File path + ✅/⚠️/❌
- Editable fields: list them
- Avatar upload? ✅/⚠️/❌
- Display name, bio, etc? ✅/⚠️/❌

### E2. Account deletion
- Delete account flow exists? ✅/⚠️/❌
- What's cascaded on delete?
- GDPR compliance level: rough assessment

### E3. Data export
- Export user data flow exists? ✅/⚠️/❌

### E4. Notification preferences
- Exists? ✅/⚠️/❌

## F. SECURITY CHECKS

### F1. Password policy
- Minimum length? Where enforced?
- Complexity requirements? Where enforced?
- Pwned password check? ✅/⚠️/❌

### F2. Session management
- Session expiration configured? Default Supabase?
- Refresh tokens used? ✅/⚠️/❌
- Sessions stored in cookies (recommended) or localStorage?

### F3. CSRF
- POST endpoints check Origin? ✅/⚠️/❌

### F4. Rate limiting
- Login rate limited? ✅/⚠️/❌
- Password reset rate limited? ✅/⚠️/❌
- Signup rate limited? ✅/⚠️/❌

### F5. Email enumeration
- Does the app reveal whether an email is registered?

## G. RLS POLICY HEALTH

For each table with RLS, verify:
- ✅ Policy correctly checks auth.uid()
- ⚠️ Policy exists but has gaps
- ❌ Policy missing or incorrect

Specifically for Eventera tables:
- profiles: SELECT/INSERT/UPDATE/DELETE policies?
- events: who can SELECT/INSERT/UPDATE/DELETE?
- generated_cards: who can SELECT/INSERT/UPDATE/DELETE?

Flag any policy that:
- Allows public access where it shouldn't
- Doesn't check user_id ownership
- Has overly broad WITH CHECK clauses

## H. ENV VARIABLES (names only, no values)

List which env vars are referenced for auth:
- NEXT_PUBLIC_SUPABASE_URL — ✅/⚠️/❌
- NEXT_PUBLIC_SUPABASE_ANON_KEY — ✅/⚠️/❌
- SUPABASE_SERVICE_ROLE_KEY — ✅/⚠️/❌
- Any GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET references
- NEXT_PUBLIC_SITE_URL or similar (for OAuth callbacks)
- Any RESEND / SENDGRID / SMTP keys for emails
- Any UPSTASH_REDIS keys for rate limiting

## I. INSTALLED PACKAGES

List relevant packages from package.json:
- @supabase/supabase-js (version)
- @supabase/ssr (version) — preferred over auth-helpers
- @supabase/auth-helpers-nextjs (if present — deprecated, flag for migration)
- Any password validation libraries
- Any rate limit libraries
- Any email libraries (resend, nodemailer, etc)

## J. KNOWN GAPS — SUMMARY TABLE

| Severity | Feature | Current State | Phase to fix |
|---|---|---|---|
| 🔴 Critical | ... | ... | Phase 2 |
| 🟠 High | ... | ... | Phase 3 |
| 🟡 Medium | ... | ... | Phase 4 |
| 🟢 Low | ... | ... | Phase 5+ |

## K. RECOMMENDED PHASE 2 SCOPE

Based on this audit, what does Phase 2 (Foundation) need to deliver?

Specifically:
- Schema changes needed (e.g., add role column to profiles)
- RLS policy fixes
- Middleware updates
- Anything else that BLOCKS auth flow work in Phase 3

## L. OPEN QUESTIONS

Anything you couldn't determine from the codebase alone:
- Things requiring Supabase dashboard access (e.g., email templates, OAuth providers configured)
- Things requiring environment knowledge
- Anything ambiguous in the current implementation

────────────────────────────────────────────
HARD CONSTRAINTS
────────────────────────────────────────────

1. DO NOT modify any code
2. DO NOT run migrations
3. DO NOT install packages
4. DO NOT make assumptions — if you can't tell, mark ⚠️ with "needs verification"
5. DO NOT print any actual secret values from .env files
6. DO commit ONLY the AUTH_AUDIT.md file with message: "docs: phase 1 auth system audit"
7. DO push to master after committing the audit doc

────────────────────────────────────────────
START
────────────────────────────────────────────

Begin reading. Produce AUTH_AUDIT.md. Commit and push. Report back when complete with a one-paragraph summary of the most critical findings.
```

---

## What happens next

When Claude Code finishes:

1. **It commits AUTH_AUDIT.md** to your master branch
2. **It pushes** so the audit doc is on GitHub
3. **It reports back** with a 1-paragraph summary

You then:
1. Open AUTH_AUDIT.md
2. Take 2-3 screenshots of the key sections
3. Send them to me

I then write **Phase 2 (Foundation)** with full context — the actual changes needed to make your role system work properly. That prompt will be specific to what your codebase actually has, not generic assumptions.

---

## Estimated phase work

| Phase | Scope | Estimated work |
|---|---|---|
| 1 | Audit (this) | 10-15 min Claude Code |
| 2 | Foundation: roles, RLS, middleware | 1-2 hours |
| 3 | Auth flows: email verify, forgot password, Google OAuth | 2-3 hours |
| 4 | Account management: profile, email change, deletion | 1-2 hours |
| 5 | Admin tooling: user management dashboard | 2-3 hours |
| 6 | Advanced: 2FA, sessions list (later) | TBD |

Total: 8-12 hours of Claude Code time across 5 sessions.

Each phase is testable and shippable on its own. No giant prompt that fails halfway.
