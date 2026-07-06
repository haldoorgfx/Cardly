# Eventera — Screen Inventory & Build Checklist

Every designed mobile screen, its role gate, its live/empty/loading needs, and the mock it lives in. Web (`eventera.so`) screens are in `karta/screens/w*.html` and `d*.html` in the main project.

Legend — States: **L** loading skeleton · **E** empty state · **R** error state · **RT** realtime/live.

## Attend mode — core (Team A)
Mock: `design/Eventera Attendee App.html`, `design/Eventera Onboarding.html`, tickets/account/auth redesigns.
Baseline for `attendee` (and therefore for every role). Covers: splash, sign-in (Google/OTP), onboarding & profile wizard, Discover feed, event overview, ticketing & checkout, tickets wallet + Eventera Card, schedule/agenda, speakers & sponsors browse, session detail, networking/directory/requests/messaging, feedback, account. Implement live where the mock shows it (agenda, networking). States: L/E/R throughout.

## Attend mode — Speaker (Team B) · gate `speaker@event`
Mock: `design/Eventera Speaker & Sponsor.html`

| ID | Screen | Gate | States |
|---|---|---|---|
| SP04 | Speaker role badge on event card + "Speaker tools" entry | `view speakerTools` | — |
| SP01 | My Sessions (list; title, time-mono, room, track) | speaker | L, E |
| SP02 | Session detail + **live read-only Audience Q&A** (sorted by upvotes) | speaker (own session) | RT |
| SP06 | Audience Q&A empty | speaker | E |
| SP03 | My Speaker Profile (light edit; full mgmt → web) | speaker | R |
| SP05 | Green room / logistics (call time, stage, AV, run-of-show) | speaker | — |

## Attend mode — Sponsor (Team C) · gate `sponsor@event`
Mock: `design/Eventera Speaker & Sponsor.html`

| ID | Screen | Gate | States |
|---|---|---|---|
| SPO05 | Sponsor role badge + "Sponsor tools" entry | `view sponsorTools` | — |
| SPO01 | My Booth (name, location, tier, description; light edit) | sponsor | R |
| SPO02 | **Lead Retrieval scanner** (dark, gold brackets, scan line) | sponsor/teammate | R |
| SPO03 | Lead captured (note + hot/warm/cold) | sponsor/teammate | R |
| SPO06 | Lead detail (contact, note, rating, captured meta) | sponsor | — |
| SPO04 | My Leads (search, rating, date-mono; export → web) | sponsor | L, E |
| SPO07 | Booth team & scan access (revocable per teammate) | owner only | — |

## Organize mode (Team D)
Mock: `design/Eventera Organize.html` · Bottom nav: Events · Scan · Attendees · Stats · Profile

| ID | Screen | Gate | States |
|---|---|---|---|
| O01 | My Events (live registered/checked-in counts) | staff+ | L, E, RT |
| O02 | Event control hub (stat bar + big actions) | organizer+ | RT |
| O03 | **QR check-in scanner** (dark; the key screen) | staff+ | R |
| O04 | Scan result — success (photo, ticket, card thumbnail) | staff+ | — |
| O05 | Scan result — already checked in (amber + time) | staff+ | — |
| O06 | Scan result — invalid (red) | staff+ | R |
| O07 | Attendee list (search + All/Checked-in/Pending) | staff+ | E, RT |
| O08 | Manual check-in / verification | staff+ | — |
| O09 | Walk-in registration (register+check-in+card) | organizer+ | R |
| O10 | Live stats (rate ring, chart, recent — auto-updating) | organizer+ | RT |
| O11 | **Staff limited view** (scanner+list only; rest locked) | staff | — |
| O12 | Profile / mode switch (Attend ⇄ Organize) | any | — |
| O13 | Announcements / push to attendees | organizer+ | RT |
| O14 | Session / room check-in | staff+ | — |
| O15 | Staff & roles (invite, assign door) | organizer+ (owner for org roles) | — |
| O16 | Event settings (window, walk-ins, double-scan, offline, badges) | organizer+ | — |

## Cross-surface behaviors to verify (Team G)
- Registration (Attend) → appears in O07 Attendee list and O01/O02/O10 counts.
- Door scan (O03→O04) → increments checked-in everywhere live; re-scan → O05, never double-counts.
- Speaker/sponsor assigned on web → SP04/SPO05 entry points appear on that account's phone within ~1s.
- Sponsor scan (SPO02→SPO03) → lead in SPO04 pool, shared across booth team, revocation immediate.
- Organizer announcement (O13) → attendee devices receive push.
- Staff account → O11 view only; organizer-only screens 403 server-side.
