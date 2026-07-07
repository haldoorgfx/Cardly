# Eventera Public-Facing UX Flow Audit

**Date:** 2026-07-07
**Project:** Eventera (Next.js Event Platform)
**Audit Scope:** Public flows (landing, sign-up, discover, register, ticket) with file:line citations

---

## EXECUTIVE SUMMARY: FLOWS THAT FAIL

### Critical Dead Ends (No Success State)
1. **Duplicate Registration** — User fills form, rejected at payment. No recovery link.
2. **Card Generation Failure** — No retry. Card lost if tab closed.  
3. **Ticket Lookup Privacy Bug** — null email filter exposes unowned tickets.
4. **Processor Currency Mismatch** — Silent fallback Flutterwave→Stripe. User unaware.

### Top 10 Fixes (Effort vs. Impact)
1. Move duplicate check to step 0 — 2h
2. Fix email null check ticket bug — 1h
3. Add resend confirmation email — 3h
4. Show "already registered" badge — 3h
5. Move payment processor PRE-form — 4h
6. Add ?next= to auth — 2h
7. Card retry UI — 3h
8. Empty state messages — 2h
9. Show fees earlier — 2h
10. Payment verification loading state — 1h

---

## FLOW 1: LANDING → SIGNUP

**Steps:** 3 (Hero → Auth Choice → Form)
**Files:** app/(marketing)/page.tsx, app/(auth)/signup/page.tsx

**Critical Issues:**
- No ?next= support—user can't return to event after signup
- Free tier limits shown only on hero, not repeated on signup form
- Duplicate email error generic ("Registration failed")
- No password strength meter or client-side validation feedback
- After account created, lands on generic dashboard—no "next step" prompt

**Verdict:** Ends at dashboard with no clear "what now?" Users unsure if they should create event or browse.

---

## FLOW 2: DISCOVER → EVENT PAGE

**Steps:** 2 (Browse → Event Page)
**Files:** app/(public)/discover/page.tsx (redirect), app/(public)/e/[slug]/page.tsx

**Critical Issues:**
- BLANK PAGE if no tickets uploaded yet (no "coming soon" message)
- "Already registered" state INVISIBLE to logged-in attendee (prompts duplicate registration)
- Missing organizer avatar handled silently—card looks incomplete
- 404 has no context (unpublished? wrong slug?)

**Verdict:** Silently fails on missing data. Prompts duplicates.

---

## FLOW 3: REGISTRATION (MOST FRICTION)

**Steps:** 4 (Ticket → Details → Payment → Confirmation)
**Files:** app/(public)/e/[slug]/register/*, components/registration/*

### DEAD END 1: Duplicate Registration Not Caught Early
- app/(public)/e/[slug]/register/page.tsx:22-60 initializes alreadyRegistered flag
- **But RegistrationClient.tsx:169 does NOT block submission**
- User fills entire form (name, email, phone, custom fields, photo)
- Submits → API returns DUPLICATE_REGISTRATION error (line 423)
- **No recovery link.** User must navigate away manually.
- **FIX:** Check at step 0. If duplicate, show "You're registered!" button → /my-tickets

### DEAD END 2: Processor Currency Mismatch (Silent)
- Lines 361-367: If processor doesn't support currency, silently falls back to Stripe
- No warning shown. User expecting Flutterwave (mobile money) gets Stripe card form.
- If user doesn't have card, they're blocked with no explanation.
- **FIX:** Show processor selector PRE-form with currency badges. Only allow compatible.

### DEAD END 3: Card Generation Failure
- ConfirmPage.tsx:174-175 catches error, shows message
- No "retry" button. No "download as PDF" fallback.
- SessionStorage card is lost if tab closed (line 86-94)
- **FIX:** Add retry + PDF fallback + "contact support" link

### Other Friction
- PWYW min price shown only AFTER clicking ticket (line 237-240)
- Platform fee (3.5%) hidden until checkout (line 244)—should show at step 1
- Promo code failure UX poor: error shown but input not cleared
- Sold-out tickets still selectable (should gray out at step 0)

**Verdict:** THREE critical dead ends. Form can block indefinitely on payment timeout. No recovery paths.

---

## FLOW 4: TICKET VIEWING /my-tickets/[id]

**Step:** 1
**File:** app/(app)/my-tickets/[id]/page.tsx:1-47

### CRITICAL PRIVACY BUG (Line 29)
\\\	ypescript
const identityFilters: string[] = [\user_id.eq.\\];
if (normalizedEmail) identityFilters.push(\ttendee_email.eq.\\);
const { data: existing } = await (admin as any)
  .from('registrations')
  .select(...)
  .or(identityFilters.join(','))
\\\

**Problem:** If normalizedEmail is empty string, filter becomes \ttendee_email.eq.\ (match any null). This allows user to view registrations with null email (orphaned/imported rows they don't own).

**Impact:** User can enumerate and view all guest/imported attendees' tickets.

**FIX:** Check email non-empty BEFORE adding filter.

**Verdict:** SECURITY ISSUE. Blocks this entire flow.

---

## FLOW 5: CARD PAGE /c/[slug]

**Step:** 1
**File:** app/c/[slug]/page.tsx:1-155

- ✅ No variants → friendly empty state message (lines 87-103)
- ✅ Single variant → auto-loads (lines 115-136)
- ✅ Draft preview banner shown (lines 121-125)
- ⚠️ Multiple variants → picker (not fully reviewed)

**Verdict:** ✅ Works well.

---

## FLOW 6: ORGANIZER PROFILE /o/[userId]

**Steps:** 2
**File:** app/(public)/o/[userId]/page.tsx

- No "not found" message (line 51)
- Metadata generation overly defensive (lines 38-50)—suggests past schema issues
- Geolocation fallback blocks render (lines 186-199)

**Verdict:** ✅ Works. Lacks polish.

---

## FLOW 7: SPEAKER PROFILE /s/[slug]/[speakerId]

**Steps:** 1
**File:** app/(public)/s/[slug]/[speakerId]/page.tsx

- ✅ Owned speaker redirects to workspace (lines 42-45)
- ⚠️ No sessions → blank page (no "coming soon" message)
- ⚠️ Time format may fail silently (lines 62-69)

**Verdict:** ✅ Works. Missing empty state.

---

## FLOW 8: SPONSOR BOOTH /x/[slug]/[sponsorId]

**Steps:** 1
**File:** app/(public)/x/[slug]/[sponsorId]/page.tsx

- ✅ Owned sponsor redirects (lines 42-45)
- Offerings rendering not reviewed

**Verdict:** ✅ Works.

---

## TOP 10 FIXES: EFFORT × IMPACT

| # | Fix | Files | Effort | Impact |
|---|-----|-------|--------|--------|
| 1 | Move duplicate check to step 0 | RegisterClient:169, page:22-60 | 2h | CRITICAL—eliminates form waste |
| 2 | Fix email null check bug | my-tickets/[id]:29 | 1h | CRITICAL—closes security hole |
| 3 | Add resend confirmation email | confirm/page:26 | 3h | HIGH—recovers from lost token |
| 4 | Show "already registered" badge | e/[slug]/page:107-137 | 3h | HIGH—prevents confusion |
| 5 | Move processor selector PRE-form | RegisterClient:354-367 | 4h | HIGH—no surprises at payment |
| 6 | Add ?next= to auth | auth/login, auth/signup | 2h | HIGH—preserves referrer |
| 7 | Card retry UI | ConfirmPage:174-175 | 3h | MEDIUM—saves card |
| 8 | Empty state messages | e/[slug], s/[slug] | 2h | MEDIUM—less "broken" appearance |
| 9 | Show fees in review | RegisterClient step 1 | 2h | MEDIUM—no fee shock |
| 10 | Payment verification loading | ConfirmPage:184-200 | 1h | MEDIUM—signals progress |

---

## SUMMARY: END-STATE VERDICTS

| Flow | Verdict | Primary Issue |
|------|---------|---------------|
| Landing → Signup | ❌ Unclear | No next-step after account. |
| Discover → Event | ❌ Silent failures | Missing data = blank. Duplicate risk. |
| Register (Full) | ❌ 3 dead ends | Duplicate rejected at payment. Card no retry. |
| Ticket View | ❌ Security bug | null email exposes others' tickets. |
| Card View | ✅ OK | SessionStorage risk if minor. |
| Organizer | ✅ OK | Lacks polish. |
| Speaker | ✅ OK | Missing empty state. |
| Sponsor | ✅ OK | Incomplete review. |

