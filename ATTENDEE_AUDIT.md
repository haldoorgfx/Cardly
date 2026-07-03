# Eventera — Full Attendee Audit

A complete pass over what an attendee can do, their privileges/limits, and the real codebase issues found across the mobile app, the API routes, and the database RLS. Ordered by severity so we fix the important things first.

---

## Capabilities matrix

| Capability | Visitor (not signed in) | Signed-in attendee |
|---|---|---|
| Browse / search / filter / map | ✅ | ✅ |
| View event details | ✅ | ✅ |
| Register for an event | ✅ (email only) | ✅ (email auto-filled) |
| See ticket right after registering | ✅ | ✅ |
| Ticket history (wallet) | ❌ (sign-in gate) | ✅ |
| Save events / follow organizers | ❌ | ✅ |
| Engagement (agenda, Q&A, polls, feedback) | ❌ (needs registration) | ✅ after registering |
| Networking (people, messages, connect) | ❌ | ✅ after registering |
| Create / personalize cards | ❌ | ✅ |
| Profile & settings, onboarding | ❌ | ✅ |
| Notifications inbox | ❌ | ✅ |

---

## 🔴 Critical — security (fix before wider release)

These let one attendee act **as another**. They need both a DB (RLS) fix and a server-side ownership check.

1. **Engagement tables are wide open.** `migrations/021_networking_qa_polls.sql` gives `attendee_connections`, `messages`, `message_threads`, `qa_questions`, `qa_upvotes`, `poll_votes`, `poll_options`, `leaderboard_points`, `attendee_agendas`, `session_ratings`, `event_feedback` a blanket policy: `for all using (true) with check (true)`. Any signed-in user can insert/edit/delete **any** row — stuff poll votes, post messages between other people, award themselves leaderboard points, etc.

2. **API routes trust client-supplied identity.** The messages, connections, poll-vote, Q&A-upvote, feedback, session-rate and session-book routes accept `sender_id` / `recipient_id` / `requester_id` / `registration_id` from the request body and never verify they belong to the logged-in user. So the app can send a message *as* someone else, connect *as* someone else, or vote *as* someone else.

**Fix:** in each route, resolve the caller's own registration from their auth session (server-side) and use that instead of trusting the body; then tighten the RLS policies to own-row for writes. This is a focused change across ~8 routes + one migration. It needs a Vercel deploy and careful testing so engagement features keep working.

---

## 🟠 High

3. **Privacy settings aren't enforced.** Attendees can set `directory_visible = false` and fill private `dietary` / `accessibility`, but the people-directory query doesn't filter by `directory_visible`, and there's no RLS shielding dietary/accessibility from other attendees. Private data can leak.

4. **Engagement access is lost after an app restart for guests.** Gating reads `EventContext.current.registrationId`, which is in-memory only. A guest who registered, then reopens the app, sees "Register to participate" even though they're registered. (Signed-in users are fine — it's re-read from the DB.)

5. **Promo code + pay-what-you-want are validated client-side only.** The discount/minimum is checked in the app; the server should re-enforce both at charge time so a tampered request can't underpay. (Partly mitigated because payment capture is server-side — worth confirming.)

---

## 🟡 Medium

6. **Photo upload is a stub in a few places.** The profile screen has a working avatar upload, but the **auth new-user step**, **onboarding step 1**, and **CFP** show a photo ring that does nothing. Either wire them to the same uploader or remove the affordance.

7. **Optimistic updates can desync.** Upvotes, poll votes, and message sends update the UI before the server confirms, with no revert on failure — counts can drift.

8. **`profiles` has no public SELECT policy**, so anywhere the mobile app tries to read another user's profile directly (vs. through a service-role API route) comes back empty. Organizer/people info must go through the API.

9. **No input validation (zod) on the CFP and exhibitor-leads routes** — oversized arrays / unvalidated emails get through.

---

## 🟢 Low / polish

10. Inconsistent API error shapes (`error.flatten()` vs. raw string) — the app should tolerate both.
11. Promo banner load fails silently (fine — falls back to default).
12. Ticket wallet shows duplicate registrations if a user registered twice (guest + signed-in) — correct data, confusing UX.
13. Invite-code modal accepts any text with no format hint.

---

## What I already fixed this pass
- **Map**: forced a camera nudge on ready so tiles load without you panning.
- **Startup speed**: splash cut from 2.3s → 1.1s.
- (Earlier) ticketing integrity, false-registered, missing tickets, RLS ownership for registrations, auth redirect.

## Honest notes
- **Push re-audit**: nothing to re-audit yet — push isn't built (it's scaffolded and waiting on your Firebase project). Once it's wired I'll audit it.
- **Stress / real-life test**: I can't run the app on a device from here, so this document is the static equivalent (it's what caught the ticketing bugs). Real load/stress testing has to happen on a running build — I'll fix whatever it surfaces.

---

## Recommended fix order
1. **Critical security (#1–2)** — lock down the engagement writes + verify identity server-side. Highest priority before real users.
2. **Privacy enforcement (#3)**.
3. **Guest engagement context (#4)** and **photo-upload stubs (#6)** — visible UX gaps.
4. The rest as polish.
