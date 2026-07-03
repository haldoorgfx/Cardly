# Ticketing System — Full Audit & Fixes

Audited all three layers: the Supabase schema (46 migrations), the web `/api/events/[id]/register` flow + payment routes, and the Flutter app. **Key fact:** the mobile app registers through the *same* web API route as the browser — it does not insert into the database directly. So every ticketing bug is in the shared web route + database, and fixing those fixes both apps at once.

---

## The single biggest cause

`supabase/pending_migrations_to_run.sql` lists migrations **041, 042, 043 as not yet applied**, and its own header warns: *"043 is REQUIRED — until it runs, the app references columns that don't exist and will 500 at runtime."* Migrations **044, 045, 046** (variant↔ticket link, multi-processor, mobile-notifications RLS) are also newer than what's live.

Until these are applied, the database is behind the code. Migration **042** in particular defines the allowed registration statuses (`pending_approval`, `refunded`, `waitlisted`). Without it, any registration or status change using those values fails with a check-constraint 500 — which looks exactly like **"I registered but got no ticket."**

**Action:** run `supabase/pending_migrations_to_run.sql` (041→042→043), then apply `044`, `045`, `046` if not already, **then** run the new `047_ticketing_integrity_fixes.sql`.

---

## The four bugs → root cause → fix

### 1. Register → no ticket / QR
- **Cause:** missing migration 042 → status `pending_approval` (used for free events that require approval, and other transitions) is rejected by the old check constraint → the write 500s. Separately, a paid registration that never completes payment correctly stays `pending` (by design), but the QR is locked until it clears.
- **Fix:** apply 042 (and `047` re-asserts the full status set idempotently). The QR itself is always generated at insert, so once status can be set correctly, the ticket appears.

### 2. Wrong ownership / missing tickets
- **Cause:** the row-level security policy `attendee_read` only returned registrations whose `attendee_email` **exactly** equals your profile email. So you could not see tickets linked to you by `user_id` (bought under a different email) or tickets whose stored email differed only in letter-case. This is the deeper reason some paid tickets never appeared in the Tickets tab — the database was hiding them from the query.
- **Fix (`047`, section 2):** new policy reads your registrations by `user_id` **or** a case-insensitive email match. Still strictly scoped to you.

### 3. Duplicate registrations
- **Cause:** uniqueness was `UNIQUE (event_id, attendee_email)` on the **raw** email, so `Alice@x.com` and `alice@x.com` were treated as two people. (The web route lowercases on insert, which mostly hides this — but any path or casing slip re-opens it.) There's also a narrow race in the route's "delete stale pending then insert" step.
- **Fix (`047`, section 3):** replace it with a **case-insensitive** unique index `(event_id, lower(attendee_email))`. It still raises the same duplicate error the route already handles.

### 4. Paid / free logic
- **Cause:** the server branching is actually correct (`isFree = chargedPrice === 0` → confirm immediately; paid → `pending` until payment). The real-world failures were: (a) the mobile ticket-load hid tickets whose `is_visible` was null → "No tickets available" (**already fixed** in the app), and (b) free-events-requiring-approval getting stuck because 042 wasn't applied (see bug 1).
- **Fix:** apply the migrations; the `is_visible` fix already shipped in the app.

---

## What `047_ticketing_integrity_fixes.sql` does

1. Re-asserts the full **status** check constraint (idempotent safety net for 042).
2. Rewrites the **`attendee_read` RLS** to match by `user_id` or case-insensitive email → fixes ownership + missing tickets.
3. Replaces email uniqueness with a **case-insensitive** unique index → fixes duplicates.
4. Adds non-negative checks on `amount_paid` / `quantity_sold` (new rows only).

It is idempotent and safe to re-run. It deliberately does **not** add a `quantity_sold` trigger, because the web route already increments that on payment — a trigger would double-count.

---

## Run order (Supabase → SQL Editor)

1. `supabase/pending_migrations_to_run.sql`  ← 041, 042, 043 (required)
2. `supabase/migrations/044_variant_ticket_link.sql`
3. `supabase/migrations/045_payment_processors_multi.sql`
4. `supabase/migrations/046_mobile_notifications_rls.sql`
5. `supabase/047_ticketing_integrity_fixes.sql`  ← the new fixes

If step 5 errors on the unique index, you have real case-duplicate rows. Find them with:
```sql
select event_id, lower(attendee_email) e, count(*)
from registrations group by 1,2 having count(*) > 1;
```
Keep the confirmed/checked-in row per group, delete the rest, then re-run step 5.

---

## Lower-priority web-route hardening (optional, needs a Vercel deploy)

- Make the "delete stale pending → insert" step atomic (single `INSERT ... ON CONFLICT`) to close the duplicate race entirely.
- When a **free** event has `checkout_require_approval = true`, make sure organizers are actually notified so attendees don't sit in `pending_approval` forever.

These live in `app/api/events/[id]/register/route.ts`. I can implement them next if you want — they require redeploying the web app, whereas the SQL above takes effect immediately for both apps.
