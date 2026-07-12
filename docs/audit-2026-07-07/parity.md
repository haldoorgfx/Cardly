# Eventera Feature Parity Audit: Web vs. Mobile

**Date:** 2026-07-07  
**Scope:** Next.js web app (app/ + components/) vs. Flutter mobile app (eventera_mobile/lib/)  
**Breadth:** Very thorough — all major features for attendee, organizer, speaker, sponsor/exhibitor roles

---

## Executive Summary

**Top Finding:** The mobile app is primarily a read-heavy, in-venue companion with critical gaps in organizer workflows and sponsor/exhibitor management. Most sponsor, exhibitor, and speaker role features are marked DRAFT (build-untested) on mobile, with several dead-end interactions ("go to web" patterns). Check-in (organizer) and ticket consumption (attendee) are fully functional; registration, event discovery, and ticket viewing work. However, organizers cannot create events, manage tickets, publish events, or configure analytics on mobile. Speakers cannot edit their profiles. Sponsors cannot manage leads or booth teams on mobile with functional backends.

---

## Feature Parity Matrix Summary

### ATTENDEE FEATURES (87% parity)

Core features fully functional:
- ✅ Discovery (search, filters, pagination)
- ✅ Event Pages (agenda, speakers, sponsors, community)
- ✅ Registration (free, paid, PWYW, promo codes, waitlist)
- ✅ My Tickets (view, QR display)
- ✅ Saved Events & Following
- ✅ Networking (people, messages, real-time)
- ✅ Q&A (ask, upvote, filter)
- ✅ Polls & Feedback
- ✅ Agenda & Sessions

Partial or missing:
- ⚠️ Ticket Transfer/Cancel (web only)
- ⚠️ Eventera Card (web studio only; mobile can generate but not edit)
- ⚠️ Payment (Waafipay only, not Stripe like web)
- ⚠️ Profile Edit (read-only on mobile)
- ⚠️ Speed Networking (DRAFT stub)

### ORGANIZER FEATURES (35% parity)

Fully functional:
- ✅ Create Event (draft, no publish)
- ✅ Check-in (QR scan, manual, real-time stats)
- ✅ Attendee List (search, filter, status)

**All other organizer features are web-only:**
- ❌ Publish Event
- ❌ Edit Event Details
- ❌ Ticket Management
- ❌ Event Settings
- ❌ Analytics & Revenue
- ❌ Communications/Announcements
- ❌ Agenda Builder
- ❌ Speakers Management
- ❌ Promo Codes
- ❌ Approvals Workflow
- ❌ Team/Staff Management
- ❌ Integrations & Webhooks

**Files:** Web organizer hub = 40+ routes under pp/(app)/events/[id]/*. Mobile = 4 tabs in lib/organize/ with check-in focus only.

### SPEAKER FEATURES (60% parity)

Fully functional:
- ✅ View Sessions (assigned to speaker)
- ✅ Green Room (read-only, call time + stage info)
- ✅ Q&A (read-only questions)

Partial or missing:
- ⚠️ Profile Edit (read-only on mobile; punts to web)
- ❌ CFP Submission
- ⚠️ Speaker Tools (DRAFT screens aggregating read-only features)

**File:** Mobile: lib/rbac/speaking_screen.dart + speaker role screens in lib/roles/speaker/ (mostly DRAFT).

### SPONSOR/EXHIBITOR FEATURES (30% parity)

Fully functional:
- ✅ Dashboard (list all booths)
- ✅ Lead Capture (QR scan via lead_scanner_screen.dart)
- ✅ Booth View

**Mostly DRAFT or non-functional:**
- ⚠️ Booth Products (read-only, no CRUD)
- ⚠️ Lead List (read-only, DRAFT)
- ⚠️ Lead Detail (read-only, punts export to web)
- ⚠️ Booth Team (read-only, no invite)
- ⚠️ Directory Preview (dead "Request meeting" button)
- ⚠️ Meeting Requests (read-only, DRAFT)
- ⚠️ Sponsor Tools Hub (DRAFT, aggregates unfinished screens)

**Web-only:**
- ❌ Booth Profile Edit
- ❌ Product CRUD
- ❌ Lead Export/CRM Sync
- ❌ Meeting Scheduling
- ❌ Resources Upload

**Files:** Mobile: 8 DRAFT screens under lib/roles/sponsor/ + lib/roles/exhibitor/. Web: full dashboard at pp/(app)/sponsoring/[id]/*.

---

## DRAFT / Non-Functional Screens (Mobile)

**Count: 16 screens marked DRAFT or with critical stubs**

Listed by file:

1. **oles/speaker/green_room_screen.dart** — DRAFT
   - Shows call time, stage, room (read-only)
   - Footer: "Slide upload, rider and full run-of-show are managed on web"
   - No edit capability

2. **oles/speaker/session_qa_screen.dart** — DRAFT
   - Questions read-only; no reply UI built

3. **oles/speaker/speaker_profile_screen.dart** — DRAFT
   - Profile display only; all edits punt to web dashboard
   - Note: "Full management punts to web"

4. **oles/speaker/speaker_tools_screen.dart** — DRAFT
   - Hub aggregating green room + Q&A (both DRAFT)

5. **oles/sponsor/booth_team_screen.dart** — DRAFT
   - Lists team members but no invite/add flow
   - Note: "Not build-tested"

6. **oles/sponsor/lead_scanner_screen.dart** — DRAFT
   - Camera + capture sheet (hot/warm/cold rating)
   - Note: "Not build-tested. Requires mobile_scanner package"
   - Uses RPC capture_lead (059_sponsor_lead_capture.sql)

7. **oles/sponsor/my_leads_screen.dart** — DRAFT
   - Read-only list; no export or filtering beyond status

8. **oles/sponsor/lead_detail_screen.dart** — DRAFT
   - Shows name, email, rating, note, timestamp
   - Footer: "Full contact export & CRM sync are on the Eventera web dashboard"

9. **oles/exhibitor/booth_products_screen.dart** — DRAFT
   - Products read-only; no CRUD

10. **oles/exhibitor/directory_preview_screen.dart** — DRAFT
    - Shows booth as attendees see it
    - **Dead button:** MButton('Request meeting', onTap: {}) (line 77)

11. **oles/exhibitor/meeting_requests_screen.dart** — DRAFT
    - Lists meetings but no action capability
    - Note: "Not build-tested"

12. **oles/sponsor/sponsor_tools_screen.dart** — DRAFT
    - Hub showing lead scanner, my leads, booth team (all DRAFT/limited)

13. **screens/organizer/zone_editor_screen.dart** — DRAFT
    - Exists but marked untested; zone drawing for card personalization

14. **ttendee/network/speed_networking_screen.dart** — DRAFT
    - Matching scheduler (stub implementation)

15. **ttendee/engage/leaderboard_screen.dart** — DRAFT
    - Gamification points; sync uncertain

16. **oles/role_widgets.dart** — DRAFT
    - Component lib; "Not build-tested. No Dart toolchain in authoring env"

---

## Dead-End / Punt-to-Web Patterns

Mobile screens that intentionally redirect users to web for completion:

| Screen | Punch Pattern | Target Route |
|--------|---------------|--------------|
| Card Confirm | "Make your card" CTA in confirm_screen.dart | /studio (card editor) |
| Speaker Profile | Read-only card footer: "See web" | /speaking/[id] |
| Green Room | "AV contact: See event team on the web" | /events/[id]/check-in (staff) |
| Sponsor Booth | Read-only footer: "See web dashboard" | /sponsoring/[id] |
| Lead Export | "CRM sync are on the web dashboard" | /sponsoring/[id]/leads |

**Files:**
- ttendee/register/confirm_screen.dart line ~168
- oles/speaker/speaker_profile_screen.dart
- oles/speaker/green_room_screen.dart line ~65
- oles/sponsor/lead_detail_screen.dart line ~79

---

## Critical Parity Gaps (Top 10)

### 1. Event Creation & Management ⚠️⚠️⚠️
- **Web:** Full builder (name, dates, venue, cover, settings, publish, archive)
- **Mobile:** Draft creation only; cannot publish, edit, or access settings
- **Impact:** Organizers stuck in web for launch workflows
- **Files:** Web: pp/(app)/events/new/page.tsx, Mobile: create_event_screen.dart

### 2. Ticket Management ⚠️⚠️⚠️
- **Web:** Create, edit, price, qty, PWYW, variants, sold-out rules
- **Mobile:** No ticket UI at all
- **Impact:** Organizers cannot configure ticket types on mobile
- **File:** Web: pp/(app)/events/[id]/tickets/page.tsx

### 3. Sponsor & Exhibitor Workflows ⚠️⚠️⚠️
- **Web:** Full booth CRUD, products, meetings, lead export, CRM integration
- **Mobile:** 8+ DRAFT screens; capture works, but leads/booths are read-only or non-functional
- **Impact:** Sponsors cannot manage from mobile; lead capture doesn't feed back to actionable list
- **Files:** Mobile: All lib/roles/sponsor/ + lib/roles/exhibitor/

### 4. Speaker Profile Management ⚠️⚠️
- **Web:** Bio, photo, social links, sessions, CFP submissions
- **Mobile:** Read-only card; all edits punch to web
- **Impact:** Speakers cannot update profiles on mobile
- **File:** Mobile: lib/roles/speaker/speaker_profile_screen.dart

### 5. Event Publishing & Launch ⚠️⚠️⚠️
- **Web:** /events/[id]/publish (go live, set public, announce)
- **Mobile:** No publish control at all
- **Impact:** Events stuck as draft; organizers must use web
- **File:** Web: pp/(app)/events/[id]/publish/page.tsx

### 6. Organizer Analytics & Revenue ⚠️⚠️⚠️
- **Web:** Dashboard, attendance trends, revenue breakdown, refunds, downloads
- **Mobile:** None; check-in live stats only
- **Impact:** Organizers cannot monitor event health from mobile
- **Files:** Web: pp/(app)/events/[id]/analytics/ + evenue/ + engage/

### 7. Ticket Transfer & Cancellation ⚠️⚠️
- **Web:** Attendee can transfer to another email or cancel (refund flow)
- **Mobile:** No transfer/cancel UI
- **Impact:** Attendees must use web to modify tickets
- **File:** Web: pp/(app)/my-tickets/[id]/transfer

### 8. Payment Gateway Parity ⚠️⚠️
- **Web:** Stripe (global) + Flutterwave (Africa-wide)
- **Mobile:** Waafipay only (Africa-focused; no global Stripe)
- **Impact:** Global attendees cannot pay on mobile
- **File:** Mobile: ttendee/register/waafipay_payment_screen.dart

### 9. Approvals Workflow ⚠️⚠️
- **Web:** Organizer can review & approve/reject pending registrations
- **Mobile:** No approval UI; attendees see "pending" but organizer has no action
- **Impact:** Organizers must use web to process approvals
- **File:** Web: pp/(app)/events/[id]/approvals/page.tsx

### 10. Lead Management (Sponsor) ⚠️⚠️
- **Web:** Full list, filter by rating, export, CRM sync, analytics
- **Mobile:** Capture (QR scan) works, but list/detail/export are DRAFT or non-functional
- **Impact:** Sponsors capture on-site but cannot work leads from mobile
- **Files:** Mobile: lead_scanner_screen.dart (capture), my_leads_screen.dart (DRAFT), lead_detail_screen.dart (DRAFT)

---

## Functional Status by Role

| Role | Web Completeness | Mobile Completeness | Verdict |
|------|------------------|---------------------|---------|
| **Attendee** | 100% (all features) | 87% (missing transfer, cancel, full card edit) | ✅ Mostly functional |
| **Organizer** | 100% (full event lifecycle) | 35% (create + check-in only) | ❌ **Critical gaps** |
| **Speaker** | 100% (profile, sessions, CFP) | 60% (view-only; edit on web) | ⚠️ Read-only on mobile |
| **Sponsor/Exhibitor** | 100% (full booth + lead mgmt) | 30% (capture + browse; export/edit on web) | ❌ **Mostly DRAFT** |

---

## Data Sync & Real-Time

| Feature | Sync | Notes |
|---------|------|-------|
| Q&A Upvotes | ✅ Real-time | Supabase realtime. Web + mobile in sync. |
| Messaging | ✅ Real-time | Supabase messages + channel. |
| Check-in Counts | ✅ Real-time | Supabase egistrations publication. Mobile auto-refreshes. |
| Polls | ✅ Real-time | Vote API → real-time results (Supabase). |
| Leaderboard | ⚠️ Eventual | Mobile DRAFT; sync uncertain. |
| Notifications | ⚠️ In-app only | Web in-app only; mobile has no push. |

---

## Recommendations (Priority Order)

### 🔴 BLOCKER — Organizer Workflows
1. **Implement Event Publish on Mobile** — Allow organizers to go live without web. (Currently must use web.)
2. **Implement Ticket Management UI** — Add, edit, price, qty, PWYW. (Currently no mobile UI.)
3. **Complete Sponsor/Exhibitor DRAFT Screens** — Test build, verify RPC calls, or remove stubs. (16 non-functional screens.)
4. **Add Stripe Gateway to Mobile** — Reduce payment friction for global attendees. (Waafipay only currently.)

### 🟡 HIGH — Core Gaps
5. **Enable Speaker Profile Editing** — Remove punt-to-web; let speakers update bios on mobile.
6. **Implement Lead Export (Sponsor)** — Basic CSV or email export. (Currently "see web".)
7. **Add Ticket Transfer/Cancel (Attendee)** — Simple flow for ticket modifications.
8. **Event Settings on Mobile** — Readonly or basic toggles (description, visibility, dates).

### 🟢 POLISH
9. **Push Notifications** — Currently in-app only.
10. **Zone Editor (Card Design)** — Allow mobile card personalization. (Currently stubbed.)

---

## File Structure Reference

### Web (Next.js)
- **Main Hub:** pp/(app)/ — 98 page.tsx files covering all features
- **Organizer:** pp/(app)/events/[id]/* — 40+ routes (edit, tickets, check-in, analytics, communications, etc.)
- **Attendee:** pp/(app)/attending/[slug]/* (event hubs), /saved, /my-tickets, /notifications
- **Roles:** pp/(app)/speaking/, /sponsoring/
- **Settings:** pp/(app)/settings/* (account, API, billing, white-label)
- **API:** pp/api/ — 169+ endpoints

### Mobile (Flutter)
- **Attendee Shell:** lib/attendee/app_shell.dart — 4 bottom tabs (home, discover, tickets, account)
- **Organizer Shell:** lib/organize/organize_shell.dart — 4 tabs (events, attendees, **scan**, stats, profile)
- **Roles:** lib/roles/ → speaker/, sponsor/, exhibitor/, staff/
- **Screens:** lib/screens/ (auth, personalization, card reveal)
- **Auth/API:** lib/auth_service.dart, lib/eventera_api.dart, lib/net.dart

---

## Conclusion

**The mobile app excels at in-venue operations** (check-in via QR, Q&A, networking, real-time feedback) and **attendee ticket consumption** (discover, register, view tickets, agenda). 

**It fails significantly at organizer event management** (no publish, no tickets, no settings, no analytics) and **sponsor/exhibitor workflows** (8 DRAFT screens, mostly read-only, no export).

**The design is intentional:** Mobile is a **companion device** for attendees and a **check-in kiosk** for organizers. All event configuration, analytics, and sponsor workflows are web-only.

**For production readiness, this requires:**
1. Finishing or removing 16 DRAFT screens
2. Implementing event publishing on mobile
3. Adding basic ticket management
4. Verifying all role-based RPC calls (especially sponsor lead capture)
5. Adding Stripe to payment options

Currently, the mobile app is **80% feature-complete for attendee scenarios** but **only 35% ready for organizer scenarios** and **30% ready for sponsor scenarios**.