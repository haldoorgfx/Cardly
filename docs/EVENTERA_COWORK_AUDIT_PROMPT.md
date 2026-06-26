# EVENTERA — FULL PLATFORM AUDIT & DOCUMENTATION
## Claude Cowork / Claude Code Prompt
### Paste this entire document as your prompt

---

## CONTEXT

I am the founder of Eventera — a full-stack event management SaaS platform built with Next.js 14, Supabase, Tailwind, shadcn/ui, and TypeScript. The platform is located at `C:\Users\cabda\cardly`.

The platform was built by handing off designs to Claude Code without pre-written documentation. It works, but I need to:
1. Audit everything that was built
2. Produce complete living documentation
3. Identify what is missing, broken, disconnected, or inconsistent
4. Produce a cleanup plan for Claude Code to implement

The reference PRD is in `docs/EVENTERA_PRD.md` (copy it there first — see Step 0).

---

## STEP 0 — SETUP

Before doing anything else:

1. Create a `docs/` folder in the project root if it doesn't exist
2. Copy the PRD content into `docs/EVENTERA_PRD.md`
3. Create `docs/AUDIT_REPORT.md` (you will fill this in as you work)
4. Create `docs/CLEANUP_PLAN.md` (you will fill this in at the end)

---

## STEP 1 — CODEBASE INVENTORY

Read and catalog every file in the project. Produce a structured inventory in `docs/AUDIT_REPORT.md` covering:

### 1A — Route Inventory
List every route that exists in `app/`:
- Full path
- Route type (page, API route, layout, loading, error)
- Authentication required (yes/no)
- What it does (one line)
- Status (working/broken/incomplete/unknown)

### 1B — Component Inventory
List every component in `components/`:
- Component name
- Location
- What it does
- Which routes use it
- Dependencies

### 1C — Library/Utilities Inventory
List everything in `lib/`:
- File name
- Purpose
- What imports it

### 1D — Database Migration Inventory
List every file in `supabase/migrations/`:
- Migration number and name
- What tables/changes it creates
- Whether it appears to have been applied (check for any applied migration tracking)

### 1E — Environment Variables
List every environment variable referenced in the codebase:
- Variable name
- Where it's used
- Required or optional
- Whether it exists in .env.local (check without revealing values)

---

## STEP 2 — ARCHITECTURE AUDIT

Examine the actual architecture against the intended architecture in the PRD. Document findings in `docs/AUDIT_REPORT.md`:

### 2A — Route Group Structure
Check `app/` for:
- Are route groups correct? `(app)`, `(public)`, `(auth)`, `(marketing)`, `admin`
- Are any routes in the wrong group?
- Are there orphaned routes with no layout?
- Are there routes that should exist but don't?

### 2B — Authentication Flow
Trace the authentication flow:
- How does login work? (Supabase client setup)
- How are server components reading auth? (`createServerClient`)
- How are client components reading auth? (`createBrowserClient`)
- Is middleware protecting the right routes?
- Check `middleware.ts` — what routes does it protect?

### 2C — Database Connection
Check how Supabase is initialized:
- Is there a consistent pattern for server vs client Supabase instances?
- Are there any files creating Supabase clients in inconsistent ways?
- Is `createAdminClient()` (service role) only used where appropriate?

### 2D — Type Safety
Check TypeScript usage:
- Is `strict: true` in tsconfig?
- Are there files using `any` type excessively?
- Are database types generated? (check for `types/supabase.ts` or similar)
- Are API responses typed?

### 2E — Error Handling
Check error handling patterns:
- Do API routes have try/catch?
- Are errors logged to Sentry?
- Are user-facing error messages appropriate (no raw errors shown)?
- Are there unhandled promise rejections?

---

## STEP 3 — FEATURE AUDIT

For each major feature, check whether it's built, partial, or missing. Document status in `docs/AUDIT_REPORT.md`:

### 3A — Authentication (F01)
- [ ] Email + password: built/missing
- [ ] Magic link: built/missing
- [ ] Google OAuth: built/missing
- [ ] Password reset: built/missing
- [ ] Email verification: built/missing
- [ ] Role system: built/missing

### 3B — Event Management (F02)
- [ ] Create event: built/missing
- [ ] Edit event: built/missing
- [ ] Publish/unpublish: built/missing
- [ ] Event duplication: built/missing
- [ ] Event categories: built/missing

### 3C — Ticket Management (F03)
- [ ] Multiple ticket types: built/missing
- [ ] Free tickets: built/missing
- [ ] Paid tickets: built/missing
- [ ] Promo codes: built/missing
- [ ] Waitlist: built/missing
- [ ] Capacity management: built/missing

### 3D — Registration & Checkout (F04)
- [ ] Registration form: built/missing
- [ ] Custom fields: built/missing
- [ ] Stripe checkout: built/missing
- [ ] Flutterwave checkout: built/missing
- [ ] Confirmation page: built/missing
- [ ] QR code generation: built/missing

### 3E — Eventera Card (F05)
- [ ] Card generation on registration: built/missing
- [ ] Card Studio (editor): built/missing
- [ ] Card download: built/missing
- [ ] Card sharing: built/missing
- [ ] Badge/print generation: built/missing

### 3F — Agenda & Sessions (F06)
- [ ] Session creation: built/missing
- [ ] Agenda builder UI: built/missing
- [ ] Multi-track: built/missing
- [ ] Personal agenda: built/missing

### 3G — Speaker Management (F07)
- [ ] Speaker CRUD: built/missing
- [ ] Speaker-session assignment: built/missing
- [ ] Speaker portal: built/missing

### 3H — Networking (F08)
- [ ] Attendee profiles: built/missing
- [ ] Connection requests: built/missing
- [ ] 1:1 messaging: built/missing
- [ ] AI matchmaking: built/missing

### 3I — Live Engagement (F09)
- [ ] Q&A: built/missing
- [ ] Polls: built/missing
- [ ] Gamification: built/missing

### 3J — Check-in (F10)
- [ ] QR scanner: built/missing
- [ ] Kiosk mode: built/missing
- [ ] Offline support: built/missing

### 3K — Analytics (F13)
- [ ] Per-event analytics: built/missing
- [ ] Portfolio analytics: built/missing
- [ ] Source tracking: built/missing

### 3L — ERA AI (F16)
- [ ] lib/ai/era.ts: built/missing
- [ ] lib/ai/gate.ts: built/missing
- [ ] ERA API routes: built/missing
- [ ] ERA UI components: built/missing

### 3M — Admin Panel (F19)
- [ ] User management: built/missing
- [ ] Platform analytics: built/missing
- [ ] Audit log: built/missing

---

## STEP 4 — BRAND AUDIT

Search the entire codebase for brand inconsistencies:

### 4A — Find all "Karta" references in user-facing strings
Search for:
- "Karta" (standalone, not in variable names)
- "Cardly"
- "karta card" (case-insensitive)
- Old taglines

List every file and line number where old brand appears in user-facing text.

### 4B — Check metadata
Verify in `app/layout.tsx`:
- Page title
- Meta description
- OG tags
- Site name

### 4C — Check email templates
Verify all email templates use "Eventera" branding.

---

## STEP 5 — DATA INTEGRITY AUDIT

### 5A — Migration Coverage
Cross-reference `supabase/migrations/` against the schema in `docs/EVENTERA_PRD.md`:
- Which tables from the PRD exist in migrations?
- Which tables are missing?
- Are there tables in migrations not in the PRD?

### 5B — RLS Coverage
Check every table mentioned in migrations:
- Does every table have RLS enabled?
- Are there appropriate SELECT/INSERT/UPDATE/DELETE policies?
- Are there any tables with RLS disabled that shouldn't be?

### 5C — Foreign Key Integrity
Check for:
- Are FK relationships defined in migrations?
- Are there junction tables missing FKs?
- Are cascade deletes appropriate?

### 5D — Index Coverage
Check for indexes on:
- `event_id` columns
- `user_id` columns
- `status` columns
- `slug` columns
- `starts_at` columns

---

## STEP 6 — DEPENDENCY AUDIT

Read `package.json` and check:

### 6A — Unused Dependencies
List packages that appear in package.json but are not imported anywhere in the codebase.

### 6B — Duplicate Functionality
Identify packages that do the same thing (e.g., two form libraries, two date libraries).

### 6C — Security Vulnerabilities
Run `pnpm audit` and list any high/critical vulnerabilities.

### 6D — Outdated Critical Packages
Note if any of these are significantly outdated:
- next
- @supabase/supabase-js
- @supabase/ssr
- stripe
- react
- typescript

---

## STEP 7 — CODE QUALITY AUDIT

### 7A — Consistency Check
Check for inconsistent patterns:
- Are API routes consistently structured?
- Is error handling consistent?
- Are loading states handled consistently?
- Is data fetching pattern consistent (server components vs client)?

### 7B — Dead Code
Identify:
- Commented-out code blocks (more than 5 lines)
- Unused exported functions/components
- Files that are imported nowhere

### 7C — TODO/FIXME Comments
List all TODO and FIXME comments with file and line numbers.

### 7D — Console Logs
List all `console.log` statements left in production code (should only be `console.error`).

---

## STEP 8 — PRODUCE THE AUDIT REPORT

Write the complete findings to `docs/AUDIT_REPORT.md`:

```markdown
# EVENTERA — FULL CODEBASE AUDIT REPORT
Date: [today]
Audited by: Claude

## Executive Summary
[3-5 sentences: overall health of the codebase]

## Critical Issues (must fix before launch)
[numbered list]

## Important Issues (fix soon)
[numbered list]

## Minor Issues (nice to have)
[numbered list]

## Route Inventory
[complete table]

## Component Inventory
[complete table]

## Feature Status
[complete checklist from Step 3]

## Brand Issues
[complete list from Step 4]

## Schema Issues
[complete list from Step 5]

## Dependency Issues
[complete list from Step 6]

## Code Quality Issues
[complete list from Step 7]

## What's Working Well
[positive findings]
```

---

## STEP 9 — PRODUCE THE CLEANUP PLAN

Write `docs/CLEANUP_PLAN.md`:

```markdown
# EVENTERA — CLEANUP & IMPLEMENTATION PLAN
## For Claude Code to implement

### Priority 1 — Critical (do first)
For each critical issue:
- Issue description
- Exact files to change
- What the fix should be
- Estimated complexity (low/medium/high)

### Priority 2 — Important
[same format]

### Priority 3 — Nice to Have
[same format]

### Missing Features to Build
For each feature marked as missing:
- Feature name
- What needs to be built
- Which files to create/modify
- Dependencies

### Database Changes Needed
- Migrations to write
- Indexes to add
- RLS policies to add

### Recommended Refactors
- Pattern inconsistencies to standardize
- Dead code to remove
- Dependencies to remove
```

---

## STEP 10 — FINAL SUMMARY

At the end, provide a plain-English summary:

1. **Overall health score** (1-10) with reasoning
2. **Top 5 things that must be fixed before launch**
3. **Top 5 things that are working well**
4. **Estimated time to fix critical issues** (in Claude Code sessions)
5. **Recommendation** — is the platform ready to show to real users, or does it need work first?

---

## OUTPUT FILES

When complete, these files should exist:
```
docs/
  EVENTERA_PRD.md          (copied from the master PRD)
  AUDIT_REPORT.md          (your findings)
  CLEANUP_PLAN.md          (actionable fix list for Claude Code)
```

Do not modify any source code during this audit. Read only.
This is a documentation and analysis task only.
