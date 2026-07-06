# Mobile (Flutter) vs Web — Feature Gap Audit

Date: 2026-07-05 · `eventera_mobile/` (Flutter, 77 Dart files, same Supabase backend)
Method: screen-by-screen read of the Flutter `lib/` against the web feature set.
**Verification note:** no changes made. The sandbox has no Dart/Flutter toolchain, so
mobile code can't be compile-checked here, and `MOBILE_SETUP.md` Step 1 (Android Studio)
is still pending — the app can't be built/run yet. This audit is read-only.

---

## Headline
The mobile app is **not thin**. The attendee experience is essentially at parity with
web, and the organizer *core flow* is present. The real gaps are (1) one clearly
mobile-appropriate organizer feature that's missing — **check-in scanning** — and
(2) the deep organizer management tables, which are reasonably web-only by design
(`MOBILE_SETUP.md`: "Not rebuilding all 146 web features").

---

## Attendee — ✅ complete (mature screens, not stubs)

| Web | Mobile screen | Lines | Status |
|---|---|---|---|
| Event hub (ticket/card/tools) | `attendee/hub/event_hub_screen.dart` | 1702 | ✅ richer than web (hero, glass actions, sponsor/schedule cards) |
| My tickets + QR + detail | `attendee/tickets/*` | 305/505/647 | ✅ |
| My cards | `screens/my_cards_screen.dart` | 225 | ✅ |
| Saved / Following | `attendee/account/saved_events_screen.dart`, `following_screen.dart` | 495 | ✅ |
| Agenda | `attendee/engage/agenda_screen.dart` | 605 | ✅ |
| Q&A / Polls / Leaderboard / Feedback | `attendee/engage/*` | 226–473 | ✅ |
| Messages / People / Speed networking | `attendee/network/*` | 252–517 | ✅ |
| Community chat | `attendee/community/community_chat_screen.dart` | 461 | ✅ |
| Discover + map | `attendee/discovery/*` | 326/1409 | ✅ (map may exceed web) |
| Registration / confirm / WaafiPay / waitlist | `attendee/register/*` | 236–1205 | ✅ |
| Speaker / Sponsor / Session detail | `attendee/hub/*` | 255–314 | ✅ |
| CFP submission | `attendee/engage/cfp_screen.dart` | — | ✅ |
| Account / profile / notifications / help | `attendee/account/*` | 180–918 | ✅ |
| Onboarding | `attendee/onboarding/onboarding_screen.dart` | 1110 | ✅ |
| Speaking / Sponsoring workspaces | `rbac/speaking_screen.dart`, `sponsoring_screen.dart` | 455/477 | ✅ |

**Attendee verdict:** no meaningful gaps. If anything, some mobile screens are more
polished than their web equivalents.

## Organizer — 🟡 core flow present, deep management missing

Present: `screens/organizer/` — create event (199), dashboard (228), event detail
(333: edit card fields, share, publish/unpublish, delete), **zone editor / card studio**
(498), share (131).

Missing vs web (the `/events/[id]/*` management suite):

| Web feature | Mobile? | Priority for mobile |
|---|---|---|
| **Check-in scanner (scan attendee QR at the door)** | ❌ | **HIGH — this is what phones are for** |
| Registrations list (see who's coming, mark checked-in) | ❌ | MEDIUM — useful on the go |
| Ticket types manager | ❌ | LOW (set up on web) |
| Promo codes / promoter links | ❌ | LOW |
| Orders / refunds | ❌ | LOW |
| Waitlist / approvals management | ❌ | LOW |
| Communications (email blast) | ❌ | LOW |
| Analytics / revenue / reports | ❌ | LOW (data tables → web) |
| Agenda builder / speaker / sponsor management | ❌ | LOW (content entry → web) |
| Staff roles | ❌ | LOW |

## Admin — intentional placeholder (correct)
`rbac/admin_screen.dart` is an honest "Admin tools are on the web" empty state, not a
broken stub. Platform moderation staying web-only is the right call. No action.

---

## Recommendation (priority order)

1. **Check-in scanner (HIGH).** The one gap worth closing for mobile. Organizers stand
   at the door and scan attendee QR codes with their phone camera — this is a
   mobile-native job the web can't do as well. It reuses the existing
   `/api/events/[id]/checkin` endpoint (scan `qr_code_token` → mark `checked_in`).
   Needs a Flutter QR-scanner package (e.g. `mobile_scanner`).
2. **Quick registrations view (MEDIUM).** A read-only "who's coming / who's checked in"
   list on mobile, pairing with the scanner. Reuses the registrations query.
3. **Leave the rest on web (LOW).** Promo codes, orders, analytics tables, communications,
   agenda/speaker/sponsor authoring — these are data-entry and reporting surfaces that
   belong on a computer. Building them in Flutter is high effort, low value, and
   contradicts the documented mobile scope.

## Before any mobile code is written
Two things must be true for mobile work to be safe (same standard as the web work):
1. **Android Studio + Flutter installed** (`MOBILE_SETUP.md` Step 1) so the app builds.
2. A build/run on a device or emulator so changes can be verified — I cannot
   compile-check Dart from here.

Until then, mobile changes would be blind and unbuildable. Recommend closing the
check-in-scanner gap first, once the build loop exists.
