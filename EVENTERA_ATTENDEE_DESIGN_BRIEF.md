# Eventera — Attendee Mobile App — Complete Design Brief

Paste this into Claude Design (or use section by section). It specifies **every
attendee-facing screen**, the brand system, the navigation model, reusable
components, and all states. Design **mobile-first at 375 px width**, native app
feel (iOS + Android), light theme only.

---

## 0. Product context

Eventera is an event platform. This app is the **attendee** side: people open an
event (via a shared link, code, or discovery), see the full event page, register
/ get a ticket with a QR, make a personalized "I'm attending" card, and engage
during the event (agenda, Q&A, polls, networking, messages, feedback). Signed-in
attendees also get a ticket wallet, saved events, followed organizers,
notifications, and a profile.

Design goals: **editorial, African-modern, designer-grade, quiet confidence.**
The app frames the user's event — it never shouts. Generous spacing, calm
surfaces, one confident accent. Think Linear/Stripe restraint with warmth.

---

## 1. Brand system (use exactly)

**Colors**
- Primary (forest): `#1F4D3A`  · dark `#163828` · soft `#E8EFEB`
- Accent (gold, sparingly): `#E8C57E` · dark `#C9A45E`
- Ink (text): `#0F1F18` · ink-soft `#3A4A42` · muted `#6B7A72`
- Background (cream, NOT white): `#FAF6EE`
- Surface (cards/inputs): `#FFFFFF`
- Border (warm): `#E5E0D4` · border-strong `#C9C3B1`
- Success `#2D7A4F` · Warning `#C97A2D` · Danger `#B8423C` · Info `#3A6B8C`
- Hero/premium gradient: `linear-gradient(135deg, #1F4D3A 0%, #2A6A50 60%, #E8C57E 100%)`
- NEVER use purple `#6c63ff`, pink `#f8a4d8`, pure white bg, or cool greys.

**Typography**
- Display / headings: **DM Sans** (letter-spacing -0.02em, weights 600–700)
- Body / UI: **Inter**
- Mono (codes, IDs, ticket numbers, timestamps): **JetBrains Mono**
- Scale (mobile): H1 26–28, H2 20–22, H3 17, body 15, small 13, micro 12.

**Shape & depth**
- Corner radius: cards 14–16, inputs/buttons 12, chips/pills 999, sheets top-20.
- Shadows: soft `0 1px 2px rgba(15,31,24,.04), 0 8px 24px rgba(15,31,24,.06)`;
  lift `0 4px 12px rgba(15,31,24,.08), 0 24px 60px rgba(31,77,58,.12)`;
  focus ring `0 0 0 3px rgba(31,77,58,.15)`.
- Spacing scale: 4 / 8 / 12 / 16 / 20 / 24 / 28 / 32. Screen padding 20.

**Motion** (specify where it matters): floaty hero, subtle fades, tap scale 0.98,
skeleton shimmer for loading.

---

## 2. Global UI patterns (design once, reuse)

- **App bar**: cream background, back chevron left, screen title (DM Sans 17/600),
  optional right actions. No heavy elevation — a hairline border on scroll.
- **Primary button**: forest fill, white text, radius 12, full-width, 52 tall.
  **Secondary**: surface fill + warm border. **Text button**: forest text.
- **Cards**: white surface, warm border, radius 14, soft shadow, 16 padding.
- **Chips / tags**: pill, soft-tint background of a semantic color.
- **Inputs**: white surface, warm border, radius 12, label above (ink-soft 13/600),
  focus = forest border + focus ring, error = danger border + helper text.
- **Bottom sheet**: for pickers/actions (photo source, ticket options).
- **Empty state**: centered icon (muted), title (17/600), one line (muted), a CTA.
- **Error state**: danger icon, message, "Try again".
- **Loading**: skeleton placeholders that match the final layout (not just spinners).
- **Toasts/snackbars**: bottom, ink surface, short.
- **Avatars**: circle, initial fallback on forest with gold letter.

**Navigation model — design this:** the app has two levels:
1. **App level** — a lightweight home. Consider a bottom tab bar with 3–4 tabs:
   **Discover**, **My tickets**, **My cards**, **Account** (+ a prominent "Open by
   code"). Or a single scrollable home with entries. Propose the cleanest.
2. **Event level** — once inside an event, use a **sticky top segmented/tab bar or
   an in-event bottom bar** to move between the event's sections (Overview,
   Schedule, Speakers, Sponsors, Network, more). Register is a persistent CTA.

---

## 3. Screens to design (every one)

For each: design the **default**, plus **loading, empty, and error** where noted.

### A. Onboarding & entry
1. **Splash** — cream, Eventera mark (gold calendar-check in a forest rounded
   square), wordmark, subtle fade.
2. **Home** — open an event by link/code (input + button), "Discover events",
   entry to Account. Warm, minimal. (If bottom-tab model, this is the Discover tab
   with a prominent "Have a code?" field.)
3. **Attendee sign-in** — "Continue with Google" (primary), OR email — enter email
   → **one-time code (OTP)** screen (6-digit) → verified. Friendly, 2 steps.

### B. Discovery
4. **Discover / events list** — search bar, filter chips (category, city, date),
   scrollable **event cards** (cover image or brand gradient, title, date row w/
   calendar icon, venue row w/ pin icon). Loading = shimmer cards. Empty = "no
   events found".
5. **Search / filters** — expanded search with results + active filter chips.

### C. Event page (the centerpiece — design richly)
6. **Event overview** — hero (cover image or gradient), category chip, **title**
   (H1), tagline, date/time row, timezone, venue/online row, **organizer** row
   (avatar + name + follow), **Save** (bookmark) in app bar. Sections below:
   **About** (rich text), a **schedule preview** (next sessions), **speakers
   preview** (avatar row), **sponsors** strip, **who's attending** (avatar cluster
   + count). Sticky **Register / Get ticket** button at bottom. A secondary
   **"Make your card"** action.
7. **Event section nav** — show how Overview / Schedule / Speakers / Sponsors /
   Network / More are navigated (tabs or in-event bottom bar).

### D. Registration & tickets
8. **Ticket selection** — list of ticket types (name, price or "Free", perks,
   remaining), quantity, select. Promo code field. Order summary.
9. **Registration form** — name, email, phone + **dynamic custom fields**
   (text, select, checkbox) defined by the organizer. Validation states.
10. **Payment method** (paid tickets) — choose processor (card / mobile money),
    order summary, pay CTA. (Payment sheet handled externally — design the hand-off.)
11. **Confirmation / your ticket** — success moment, **QR code** (large, framed),
    ticket type, attendee name, event, add-to-calendar, "Make your card" CTA,
    "View my tickets".
12. **My tickets (wallet)** — list of ticket cards (event cover, name, date,
    status pill: Confirmed / Pending / Checked-in), tap → ticket detail.
13. **Ticket detail** — big QR, event + attendee info, status, **transfer ticket**
    action, add to calendar.

### E. The card (personalized attendee card)
14. **Make your card — pick design** — if the event has multiple card designs,
    a thumbnail chooser; show the selected design large.
15. **Personalize** — form fields per the design's zones (name, title, etc.) +
    **photo upload** (camera / gallery, with crop; circle or square per zone).
    Live preview of the card ideally.
16. **Card ready / success** — the finished card large, **suggested share
    caption** (copyable), **Save** and **Share** buttons, "Make another".

### F. Agenda & sessions
17. **Schedule / agenda** — **day tabs**, sessions grouped by time, each row:
    time, title, track color, room, speakers avatars, "add to my agenda" toggle.
    A **"My agenda"** filter/toggle. Empty per day.
18. **Session detail** — title, time, room, track, description, **speakers**,
    **add to my agenda**, **rate session** (stars + comment), link to that
    session's **live Q&A**, "watch" if virtual.

### G. Speakers & sponsors
19. **Speakers list** — grid/list of speaker cards (photo, name, role, company).
20. **Speaker detail** — large photo, name, role/company, bio, social links, and
    **their sessions**.
21. **Sponsors list** — grouped by tier (chips), sponsor logos/cards.
22. **Sponsor / booth detail** — logo, tagline, description, **offerings**, team
    members, contact / "book a meeting" link, booth location/hours.

### H. Live engagement
23. **Q&A** — list of questions sorted by upvotes; each: text, asker (or
    "Anonymous"), upvote count + button; filter by session; **ask a question**
    (sheet: text, anonymous toggle, optional session). Live feel.
24. **Polls** — list of polls; **active poll** = options with vote buttons; after
    voting or if closed = **live results bars** with %; closed badge.
25. **Leaderboard** — ranked list (rank, avatar, name, points), top-3 emphasized,
    "you" highlighted.

### I. Networking
26. **People / attendees** — directory cards (avatar, name, title/company),
    **Connect** button w/ status (Connect / Pending / Connected); a **"Suggested
    for you"** AI-matches section with a match % and reason.
27. **Connections / requests** — incoming/outgoing requests, accept/decline.
28. **Messages (inbox)** — thread list (avatar, name, last message, unread dot).
29. **Chat thread** — message bubbles (mine = forest, theirs = surface), composer.

### J. Feedback
30. **Feedback** — overall **star rating**, **highlights** (multi-select chips),
    comment, submit; thank-you state.

### K. Account
31. **Account hub** — profile header (avatar, name, email), rows: My tickets, My
    cards, Saved events, Following, Notifications, Profile/Settings, Sign out.
32. **Saved events** — bookmarked event cards; un-save.
33. **Following** — organizers followed (avatar, name), unfollow, notify toggle.
34. **Notifications** — inbox list (icon per type, title, body, time, unread
    state), mark-all-read; empty state.
35. **Profile / settings** — edit avatar, full name, city, phone, **interests**
    (chip multi-select), notification preferences (toggles).

### L. System states (design as a set)
36. Reusable **loading (skeleton), empty, error, offline, not-signed-in** states
    styled in-brand.

---

## 4. Deliverable request (tell Claude Design this)

> Design all screens above as a cohesive mobile app at 375 px, in the Eventera
> forest+cream brand, DM Sans + Inter type. Provide each screen's default plus its
> loading/empty/error variants where relevant. Keep components consistent (app
> bar, buttons, cards, chips, inputs, sheets, avatars). Propose the navigation
> model (bottom tabs at app level + in-event section nav). Deliver as clean,
> self-contained HTML/CSS screens I can hand to a developer, with the exact hex
> colors and spacing from the brand system. Prioritize: Home/Discover → Event
> overview → Registration/Ticket/QR → Make-a-card → Agenda → Q&A/Polls →
> Networking → Account, then the rest.

---

## 5. Notes for implementation (for the dev — me)
- All screens map to real Supabase data / existing web API routes already wired in
  the Flutter app; design changes are visual — data contracts stay.
- Watermark, QR, and card render come from the existing backend.
- Keep tap targets ≥ 44 px; one-thumb reachable; test at 375 px.
