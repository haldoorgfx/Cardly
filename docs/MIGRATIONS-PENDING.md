> ## ✅ Applied 2026-07-22
>
> Abdalla ran both `APPLY_105-120_combined.sql` and the 116 file through the
> Supabase SQL editor. Re-verification from here is inherently limited: every
> RPC this batch adds (`book_session_seat`, `invite_waitlist_entry`,
> `unredeem_entitlement`) is deliberately revoked from `anon` and often from
> `authenticated` too (`security definer`, called only from service-role API
> routes) — so an anon-key probe returns "function not found" identically
> whether the migration landed or not, by design. That is NOT a sign anything
> failed; it means anon-key REST is the wrong tool to check these specific
> functions.
>
> What I *could* re-check with the anon key:
> - `message_threads` (119) — returns `200` with an empty array, consistent
>   with the `public_all` policy being gone and no permissive replacement.
> - `exhibitor_products` (117) — still returns one row for an unfiltered
>   query, which is expected and correct if that row belongs to a published
>   event; the fix scopes by publication status, not blanket denial, so this
>   result doesn't confirm or contradict anything on its own.
>
> Everything else in this file is trusted from the SQL editor completing
> without error, which is a reasonable bar — these are idempotent scripts
> that fail loudly on a real error, not something that can partially succeed
> silently.
>
> **Two ready-to-paste files exist now, built from everything below:**
> - **`supabase/APPLY_105-120_combined.sql`** — all ten migrations except 116,
>   concatenated in order with each one's own header intact. Paste the whole
>   file once and run it.
> - **`supabase/APPLY_116_teams_READ_THIS_FIRST.sql`** — 116 alone, with its
>   required pre-check pulled to the top as its own step. This one genuinely
>   needs you to read a query's output before deciding what to paste next —
>   that can't be automated away, see the file for why.
>
> I could not run either of these myself: no Supabase execution tool is
> available in this environment, the service-role key only reaches
> PostgREST's normal CRUD endpoints (not raw SQL), there's no direct Postgres
> connection string configured, and the Supabase CLI here isn't authenticated
> (checked — `supabase login` was never run). The SQL editor is the only path,
> same as the project docs already say.

# Migrations on disk from 105 up — apply checklist

Eleven migration files sit in `supabase/migrations/` at 105 and above. Some may
already be applied; **I cannot tell from here** and neither can the repo — see
the caveat at the bottom. This is the list, what each does, and how to check.

Applied by hand in the Supabase SQL editor. All eleven are idempotent
(`create or replace`, `drop … if exists`, `if not exists`), so **re-running one
that is already applied is safe** — which makes "when in doubt, run it" the
right default for every row except 116.

| # | File | What it does | Can I probe it? |
|---|---|---|---|
| 105 | `promo_redemption_tracking` | RPC / policy changes | Yes if it adds an RPC — see below |
| 106 | `checkin_rpc_race_guard` | Replaces the check-in RPC | Partly — the RPC exists, but "replaced" isn't detectable |
| **107** | `session_capacity_atomic_booking` (in `supabase/` root, not `migrations/`) | `book_session_seat()` RPC | ✅ **PROVED NOT APPLIED** |
| 108 | `poll_vote_counter_integrity` | Vote counter integrity | No |
| 110 | `storage_policy_hardening` | Storage bucket policies | No |
| 113 | `leaderboard_points_dedup` | `create unique index leaderboard_points_action_ref_uniq` | No — indexes aren't visible over REST |
| 115 | `waitlist_invite_and_unredeem_integrity` | `invite_waitlist_entry()` + `create unique index entitlement_redemptions_reverses_uidx` | No |
| **116** | `teams_grant_event_access` | **Teams: the database half** | ⚠ read the warning below |
| 117 | `exhibitor_products_published_only` | Narrows a `using (true)` read policy | ✅ verified needed — see below |
| 118 | `sync_profile_email_on_change` | Trigger + backfill so `profiles.email` follows `auth.users.email` | No |
| 119 | `networking_public_all_policy_removal` | Drops migration 021's `public_all` on the DM tables | Partially — see below |
| 120 | `registrations_hot_indexes` | Three ordering indexes on `registrations` (event+date, date, paid) | No — indexes aren't visible over REST. Purely additive, zero risk to apply; `CREATE INDEX` locks writes, so run during low traffic or add `CONCURRENTLY` if applying while an event is live. |
| **121** | `qa_points_cap_race_guard` | `award_qa_points()` RPC — closes a Q&A leaderboard-points race (see below) | Yes — same PGRST202 test as 107 |
| **122** | `platform_feature_flags` | Seeds 19 `platform:*` rows into `feature_flags` (migration 009) — super-admin kill-switches, see below | Yes — `GET /rest/v1/feature_flags?flag=eq.platform:qa` should return one row once applied |

---

### 122 — super-admin platform-wide feature kill-switches

New admin page **`/admin/platform-features`** (super_admin only) lists 19 optional
features (Q&A, Polls, Networking, Sponsors, Exhibitors, Developer API, etc.) each
with a toggle. Turning one off blocks it platform-wide — every event, regardless
of what any organizer has configured — by 404ing its API routes and
redirecting/404ing its pages.

**Safe to apply any time, in any order relative to code deploy.** All 19 rows seed
`enabled = true`, and `lib/features/platform.ts::isPlatformFeatureEnabled()` treats
a *missing* row as enabled too — so this migration can never silently turn
anything off by being (or not being) applied. It only starts doing anything once
someone actually flips a toggle in the new admin page.

Reuses the existing `feature_flags` table from migration 009 (a `platform:` key
prefix keeps these separate from the 5 existing dev-experiment flags) rather than
adding a parallel flags system.

---

### 121 — Q&A leaderboard points cap was racy, not just off-by-one

`app/api/events/[id]/q-and-a/route.ts` caps leaderboard points at 5 scored
questions per attendee by reading a count, then inserting if under the cap.
Concurrent requests (a script firing several at once, not just a double-click)
can each read the same stale count before any insert lands, so the real cap was
"5 plus however many requests you fire simultaneously" — on a leaderboard the
route's own comment says gets projected on a screen at the venue.

`award_qa_points()` moves the count-check and insert inside one
`pg_advisory_xact_lock`-guarded transaction (same idiom as 097 and 107), so
concurrent calls for the same attendee+event serialize and the race closes.
The API route already ships with a fallback to the old read-then-write
behaviour if this RPC isn't found, so applying 121 is safe at any time and not
applying it yet doesn't break anything — it just leaves the narrow race open.

---

## The three worth reading before you paste

### 116 — do the diff it asks for first

It reproduces migration **080's** body of `can_manage_event()` and adds a third
clause. But 051–104 are missing from this repo, so the file cannot prove it
knows the current body. If anything in that range added another clause, a plain
`create or replace` **silently drops it** and revokes somebody's access.

Dump the live definition and compare before running:

```sql
select pg_get_functiondef(p.oid)
from pg_proc p join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public' and p.proname = 'can_manage_event';
```

If it matches, apply as written. If it has extra clauses, keep them and add only
the `is_event_team_member()` clause.

**Teams does not work without this.** The TypeScript half shipped today; RLS and
the RPCs are a separate enforcement path and go through the SQL function.

### 117 — verified as genuinely needed

Probed production with the browser anon key on 2026-07-21:

```
GET /rest/v1/exhibitor_products?select=id   →  200, Content-Range 0-0/1
```

So the table really is readable by anyone holding the public key today, which is
what 117 closes. Its `event_id` column was also confirmed to exist, so the
`create policy` will not fail on paste.

### 119 — probably already done, still worth applying

A count-probe suggests the live database already has these policies replaced
(most likely by the missing migration 078):

```
messages / message_threads / attendee_connections   200  Content-Range */0
registrations / profiles   (known locked)           200  */0
events                     (known readable)         206  0-0/14
```

`events` proves the probe sees rows when a permissive policy exists, so the
`*/0` rows are meaningful. It is inference, not proof — an empty table reads the
same.

Apply it anyway. **The on-disk set is the only thing a fresh environment runs**,
and today that set still ends with migration 021's
`public_all … using (true) with check (true)` on `messages` — SELECT, INSERT,
UPDATE and DELETE for the anon role. Any staging clone, restore or second region
built from these files silently gets world-readable *and world-writable* private
DMs, and would show `*/0` purely by being empty. 119 is a no-op if 078 already
did the work.

Checked before writing that off as safe: every file touching those three tables
is an API route using the service-role client. Zero client components query them
with the anon key, so dropping the policy breaks nothing.

---

## Why "which are applied?" cannot be answered from the repo

`supabase/migrations/` holds 001–050 and 105+; `supabase/` root holds 080–104.
**051–104 are missing from the repository entirely** — applied to production,
never committed. So the files do not describe the live database, and a file's
absence proves nothing.

Anon-key probing settles *columns* (`42703` = absent) and *tables*
(`42P01` = absent).

**Functions ARE probeable too** — I had this wrong at first. POST to the RPC
endpoint and read the error code:

```
POST /rest/v1/rpc/book_session_seat   →  PGRST202  "Could not find the function"
                                          (with a fuzzy hint naming a DIFFERENT
                                           function — that hint is the tell)
POST /rest/v1/rpc/checkin_session_by_token → returns its real signature
```

The control call matters: a function that exists answers differently from one
that doesn't, so running both in the same pass distinguishes "absent" from
"my probe is broken". That is how **107 was proved missing**.

What this still cannot see: **policies and indexes**. So 110, 113, 115 and 119
remain undeterminable from outside.

For those, the fastest route is running them — they are all idempotent — rather
than trying to determine their state.

---

## Consequence of 107 being unapplied, specifically

Session booking currently uses the count-then-insert fallback. Capacity **is**
refused, so a 30-seat workshop does not sell 40 — but counting and inserting are
two statements, so two people clicking the last seat at the same moment can both
land. Applying `supabase/107_session_capacity_atomic_booking.sql` closes that
window.

Related and unresolved: **migration 099's status is unverifiable.**
`sessions.registrations_count` reads 0 on the one visible row, and
`attendee_agendas` is RLS-blocked to anon, so a dead counter and a genuinely
empty table look identical. Server-side enforcement does not depend on it —
both paths count real rows — but the *displayed* "12 / 30" and "Full" chips do.
If 099 is not applied those read 0 forever, and a full session looks open right
up until the refusal message fires.
