# Eventera — Honest Assessment & Roadmap

*A straight look at what the app is, what's missing, what to fix, and what to build next — grounded in how the leading event apps actually work (Luma, Partiful, Whova, Brella, Premagic, DICE, Eventbrite).*

---

## The honest headline

The attendee app is **broad but shallow**. You've matched almost every screen the web platform has — discovery, event hub, tickets, cards, engagement, networking, account. That's real work and it's rare. But right now it mirrors a *website*, and it's missing the three things that make a *mobile* event app worth keeping on someone's phone:

1. **It can't take money.** Paid tickets dead-end (Flutterwave shows a link; Stripe/WaafiPay aren't wired in-app).
2. **It can't reach the user.** There's a `notifications` table but nothing is pushed to the device — no reminders, no "doors open," no "a spot opened."
3. **It doesn't work without signal.** Tickets and schedules need Wi-Fi, and event venues have terrible Wi-Fi.

Every serious source says the same thing: attendees delete apps that are just "the schedule with a login." Only about **half of attendees even download the official event app**, and offline access to your ticket/schedule is "the difference between an app that works when it matters and one that doesn't." Fix those three before adding a single new screen.

**And one strategic point up front:** your real advantage isn't being another Whova. It's the **personalized attendee card** — the "I'm attending" graphic. That's the same wedge Premagic used to build a whole company. Right now that feature is buried and basic. It should be the loudest thing in the app.

---

## 1. What's actually missing (ranked by impact)

### Critical — the app can't succeed without these

**a) In-app payments, mobile-money first.**
Paid tickets currently can't be completed in the app. For your market this is the #1 revenue blocker. In Africa, cards are the minority — you need **M-Pesa (STK push), Paystack, Flutterwave, MTN MoMo**. Platforms like Karibisha and eGotickets win specifically because they integrate mobile money with zero friction. Card-only is a dealbreaker here.

**b) Push notifications.**
The single biggest driver of "opens the app again." You already store notifications server-side — you just never deliver them. Needed: event reminders (24h / 1h / "starting now"), agenda changes, **waitlist spot opened**, new message, "your card is ready," receipts. Rule from the research: **behavior-based, personalized, and fewer than ~5 a week** (60% of users quit an app that over-notifies), and **ask permission *after* the first meaningful action**, never on launch.

**c) Offline mode.**
Cache the user's **ticket QR + event schedule + their agenda** so they open instantly with no signal. This is repeatedly named the #1 usability failure of event apps. It's not a feature, it's table stakes at a venue.

### Important — needed to compete

**d) Onboarding (interests + city).**
The web has a 3-step wizard (interests, city, notifications); the app skips it. Without it you can't personalize discovery, can't send relevant notifications, and can't do good matchmaking. Keep it to one or two screens (research: a single "what's your goal?" microsurvey measurably lifts retention).

**e) Your card feature is under-built vs Premagic.**
This is your moat and it's the weakest-developed. Missing: AI photo distribution (face-matched event photos delivered to each attendee), one-tap share with **auto-generated caption + hashtags**, and **sponsor-branded galleries** (which Premagic turns into a whole new revenue line). Premagic's customers average **4x more registrations from organic sharing alone**. You already generate the card — you're 30% of the way to the most valuable feature in the category.

**f) Real calendar sync + wallet passes.**
You ship a `.ics` file (good), but the bar is one-tap "Add to Google/Apple Calendar" and an **Apple Wallet / Google Wallet ticket pass**. Luma's whole retention loop is calendar-based.

**g) A viral invite loop.**
Partiful's growth engine is: no download, enter a phone number, RSVP, see who else is going. You have none of that shareable social pull yet. Even a "share event → track who registered from your link" loop would compound.

### Minor / cleanup (things I found in the code)

- **Community message send** relies on a direct insert that may be blocked by row-level security — needs a proper server route + test.
- **"My cards"** screen still uses the old purple/pink `Brand.*` theme instead of your forest tokens.
- Cosmetic dead spots: the Discover **city selector** and **search icon** don't do anything yet; the profile **avatar name** is hardcoded "You."
- **Paid-ticket path** surfaces a raw payment link with no in-app browser — feels broken even when it works.
- **Lead scanner** for sponsors/exhibitors is a mockup, not real.

---

## 2. What to fix / UI-UX improvements

**Kill sign-in friction.** Login friction is the #1 documented reason attendees abandon event apps (wrong email at the venue, forgotten password, bad Wi-Fi). You're already ahead here with email-code + Google. Keep pushing: let people **browse and view a shared event with zero login**, and only ask to sign in at the moment they register or open their ticket. Never gate discovery behind auth.

**Make the card the hero.** It's your differentiation and it's currently a secondary button. On the event page and after registering, "Make your card" should be a primary, beautiful, obvious action — with a live preview. This is the thing no competitor in your region does well.

**Notification permission timing.** Ask only after they register for their first event or generate their first card — not on first launch (immediate asks get denied and you lose the channel forever).

**Perceived speed.** Keep leaning on skeletons + optimistic UI (you already do some). Cache the discover feed and event hub so returning feels instant.

**One-thumb mobile discipline.** Everything reachable with a thumb, 44px+ tap targets, respect system text size. Your attendee flows are mobile-first already; hold that line as you add features.

**Design consistency pass.** Bring "My cards" onto the forest/cream tokens, wire or hide the cosmetic controls (city selector, search icon), fix the "You" avatar. Small things, but they read as "unfinished" to users. Luma's entire reputation is "it just looks and feels better" — polish *is* the product in this category.

**Empty and error states with a next step.** Every empty screen should push toward the core loop ("No tickets yet → Discover events"), not dead-end.

---

## 3. New features to add (prioritized, tied to money)

### Tier 1 — do these next (revenue + retention + your moat)

1. **Mobile-money + card checkout in-app** (Paystack / Flutterwave / M-Pesa STK push). Unlocks all paid events. *This is your revenue.*
2. **Push notifications** across the event lifecycle + chat + waitlist. *This is your retention.*
3. **AI photo gallery + attendee advocacy** — evolve the card into a Premagic-style engine: face-matched event photos delivered to each attendee, one-tap social share with auto-caption, and **sponsor-branded galleries** as a new paid product. *This is your differentiation AND a new revenue line.*
4. **Offline tickets + schedule.** *This is basic trust.*

### Tier 2 — network effects & stickiness

5. **1:1 meeting scheduler** (Brella-style): AI-suggested slots based on mutual availability + shared interests, built on the connections/DMs you already have. Intent-based matchmaking ("I want to hire / sell / learn") beats generic "networking."
6. **Apple/Google Wallet passes** + one-tap calendar add.
7. **Referral / invite loop**: shareable event links that track who registered, with a small reward. Partiful and Premagic both grow almost entirely through attendee sharing.
8. **Proper live session streaming + live reactions/emoji** (you have the "watch" hook; make it real).

### Tier 3 — later

9. **Venue map / wayfinding** (offline).
10. **Post-event recap**: highlights, ratings summary, session recordings on-demand, "people you met."
11. **Real sponsor lead capture** (badge/QR scan) to replace the mock.
12. **AI event assistant** ("what should I attend?", "who should I meet?") — the 2025 differentiator, and you already have the data (interests, agenda, matches).

---

## 4. The business reality

You have subscription tiers (free / pro / studio) from the web. Add the two revenue lines the market actually rewards:

- **A per-ticket fee on paid events.** Luma's flat **5% (waived on a paid plan)** is the cleanest, most-loved model — far better received than Eventbrite's stacked percentage + flat fees. Copy Luma's simplicity.
- **Sponsor-branded photo galleries + advocacy** (the Premagic insight): every attendee already downloads and shares their own event photos — wrap that in sponsor branding and sell it. It turns a free attendee behavior into sponsor inventory. At scale this is worth more than ticket fees.

Your moat is **designer-native, beautiful, personalized cards + Africa-first mobile money + Partiful-level low friction.** Don't try to out-feature Whova or Cvent — you'll lose. Win on beauty, the card/advocacy wedge, and being the frictionless, mobile-money-native option for your region.

---

## 5. If you do only three things next

1. **Wire mobile-money checkout** so paid events work. (Revenue.)
2. **Turn on push notifications**, permission-after-first-action. (Retention.)
3. **Make the card a first-class, shareable, AI-assisted experience** and cache tickets offline. (Moat + trust.)

Everything else is a bonus. These three move the product from "a nice mirror of the website" to "an app people keep."

---

## Sources

- [Luma — App Store](https://apps.apple.com/us/app/luma-events-invites/id1546150895) · [Luma tips & how it works](https://party.pro/luma/) · [Luma vs Eventbrite](https://help.luma.com/p/luma-vs-eventbrite) · [Luma pricing](https://www.saasworthy.com/product/lu-ma/pricing)
- [Partiful — CNBC](https://www.cnbc.com/2025/04/19/meet-partiful-the-gen-z-party-planning-staple-thats-taking-on-apple.html) · [Partiful — Modern Retail](https://www.modernretail.co/technology/how-partiful-has-become-the-hottest-invitation-app-for-startup-founders/) · [Partiful — TechCrunch](https://techcrunch.com/2024/11/18/partiful-is-googles-best-app-of-2024/)
- [Whova — best event app features 2026](https://whova.com/whova-event-app/) · [Whova setup & best practices](https://attendeegain.com/whova-event-app-setup-tips-best-practice-guide/)
- [Premagic — turn attendees into marketers](https://premagic.com/) · [Premagic AI photo distribution](https://premagic.com/smart-photo-distribution-for-seamless-events/) · [Premagic sponsor galleries / Event Tech Live](https://eventtechlive.com/premagic-and-the-rewriting-of-event-sponsorship-measurement-event-technology-awards-ai-edition-shortlisted-spotlight/)
- [Brella — event matchmaking](https://www.brella.io/event-matchmaking) · [Brella matchmaking best practices](https://help.brella.io/en/best-practices/best-practices-for-matchmaking)
- [Ticketing fees compared (Eventbrite/Luma/DICE)](https://www.ticketfairy.com/event-ticketing/eventbrite-vs-dice) · [Ticketing cost comparison](https://www.eventuallyticketing.com/tools/event-ticketing-cost-comparison)
- [Why attendee mobile experience fails — Swoogo](https://swoogo.events/blog/attendee-mobile-experience/) · [Event app adoption benchmarks — Nunify](https://www.nunify.com/blogs/event-app-adoption-rate-benchmarks) · [Event app problems 2026 — Grupio](https://www.grupio.com/blog/event-app-problems-2026/)
- [Push notification UX guide](https://uxcam.com/blog/push-notification-guide/) · [Mobile onboarding best practices — Appcues](https://www.appcues.com/blog/mobile-onboarding-best-practices)
- [Payment gateways in Africa](https://www.nimblechapps.com/blog/top-7-payment-gateways-in-africa-for-mobile-apps) · [Karibisha — Kenya/Africa ticketing](https://karibisha.events/) · [eGotickets](https://egotickets.com/) · [Mobile money & M-Pesa in travel/events](https://www.mightytravels.com/2025/01/7-ways-mobile-money-apps-are-transforming-travel-payments-in-africa-a-deep-dive-into-kenyas-m-pesa-success/)
