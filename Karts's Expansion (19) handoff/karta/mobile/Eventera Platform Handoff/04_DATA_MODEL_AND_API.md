# Eventera — Data Model, API & Realtime

Shared contract for all teams. Ship as `@eventera/types` (zod + TS). Backend enforces; clients consume.

## 1. Entities (core)

```
Account        id, email, name, photoUrl, phone, city, createdAt
Profile        accountId, headline, company, industry, bio, socials{linkedin,x}, interests[],
               goals[], dietary, accessibility, discoverable(bool), openToConnect(bool)
Workspace      id, name, ownerAccountId            // an organizer org (Karta Studio)
Event          id, workspaceId, name, coverUrl, startAt, endAt, venue, city, status(draft|
               upcoming|live|past), timezone, settings(json)
Membership     id, accountId, eventId, roles[]      // ['attendee','speaker','sponsor','staff',
               // 'organizer','owner'] — additive, per event
Ticket         id, eventId, accountId, type, price, code(QR), status(valid|checked_in|void),
               checkedInAt, checkedInBy, door
Session        id, eventId, title, startAt, endAt, room, track, speakerIds[], description
Question       id, sessionId, accountId, text, upvotes, createdAt   // audience Q&A
SpeakerInfo    membershipId, sessions[], profile(shared Profile), greenRoom{callTime,stage,av}
Sponsor        id, eventId, name, boothName, boothLocation, tier, description, logoUrl
BoothMember    id, sponsorId, accountId, canScan(bool)              // shared lead pool access
Lead           id, sponsorId, attendeeAccountId, rating(hot|warm|cold), note, capturedBy,
               capturedAt, booth
Announcement   id, eventId, authorId, body, audience, sentAt, deliveredCount, openedCount
CheckIn        id, ticketId, eventId, sessionId?, door, byAccountId, at, source(scan|manual|walkin)
StaffAssignment id, eventId, accountId, role(staff|organizer), door?
```

## 2. Identity & roles
- `GET /me` → account + profile + per-event memberships (roles resolved).
- Roles are **never** static token claims; resolve per resource at request time. Token holds accountId + session only.
- `rbac.can(user, action, resource)` is the one gate (see `02_ROLES_AND_ACCESS.md`).

## 3. REST surface (representative — all role-checked)

**Attend**
```
GET  /events                       discover feed
GET  /events/:id                   overview (+ my memberships/roles for this event)
POST /events/:id/register          → Ticket (+ Eventera Card)
GET  /me/tickets
GET  /events/:id/sessions | /speakers | /sponsors
```
**Speaker** (require speaker@event)
```
GET  /events/:id/speaker/sessions
GET  /sessions/:id/questions?sort=upvotes     // read-only for speaker; RT
PATCH /me/speaker-profile
GET  /sessions/:id/greenroom
```
**Sponsor** (require sponsor@event / booth)
```
GET  /events/:id/sponsor/booth  |  PATCH .../booth
POST /sponsor/:sponsorId/leads                // capture: {attendeeCode, rating, note}
GET  /sponsor/:sponsorId/leads?q=  |  GET /leads/:id  |  PATCH /leads/:id
GET  /sponsor/:sponsorId/team  |  PATCH /booth-members/:id  {canScan}
```
**Organize** (staff+ unless noted)
```
GET  /events/:id/attendees?status=all|checked_in|pending&q=
POST /checkins            {ticketCode, door, sessionId?}   // idempotent → success|dupe|invalid
POST /checkins/manual     {ticketId, door}
POST /events/:id/walkins  {name,email,ticketType}          // organizer+ → register+checkin+card
GET  /events/:id/stats                                     // organizer+  RT
POST /events/:id/announcements                             // organizer+  → push fan-out
GET  /events/:id/staff  |  POST /events/:id/staff (invite) // organizer+ (owner for org roles)
PATCH /events/:id/settings                                 // organizer+
```

## 4. Realtime channels (pub/sub)
Subscribe on entering the relevant screen; unsubscribe on leave.
```
event:{id}:checkins        → {ticketId, at, door, total, checkedIn}   // O01,O02,O03,O07,O10
event:{id}:stats           → live counters + recent list              // O10
session:{id}:questions     → new/updated question, upvote deltas      // SP02
sponsor:{id}:leads         → new lead (shared pool)                   // SPO04
account:{id}:roles         → role.changed / permission.revoked        // SP04,SPO05,SPO07 gating
event:{id}:announcements   → push payload                             // attendee devices
```
Guarantee: door scan → `checkins` event → all subscribers reflect new totals ≤1s. Counters authoritative in Redis, persisted to Postgres.

## 5. Check-in semantics (get these exactly right)
- **Idempotent:** same ticket re-scanned → returns `already_checked_in` with original `checkedInAt`/door; never increments.
- **Invalid:** unknown code or wrong-event code → `invalid`; surface O06; suggest attendee-list lookup.
- **Attribution:** every CheckIn records `door` + `byAccountId` + `source` for audit.
- **Offline (organizer):** queue scans locally, show Offline badge (O16), reconcile on reconnect; on conflict the earliest valid scan wins, dupes collapse.
- **Walk-in** is one transaction: create Account(if new)+Ticket+CheckIn+Card atomically.

## 6. Sync principle
Mobile and web are the same data. There is no "mobile database." Every write goes to the shared API; every live screen is a subscriber. The web dashboard's numbers and the organizer's Live Stats are the same query. Configuration (ticket types, agenda, pricing, speaker/sponsor assignment, white-label) is authored on web and read on mobile — mobile deep-links to web for those.
