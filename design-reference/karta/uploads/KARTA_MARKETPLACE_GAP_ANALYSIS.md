# KARTA — COMPETITIVE GAP ANALYSIS & MARKETPLACE EVOLUTION
## Master Handoff for Claude Design + Claude Code

**Date:** June 2026
**Research base:** Cvent, InEvent, Eventee, Eventify, Luma, Eventbrite, Whova, Bizzabo, Swapcard
**Goal:** Evolve Karta from an event management SaaS into **the event marketplace** — where attendees discover and buy, and organizers run everything.

---

# PART 1 — WHERE KARTA STANDS TODAY

## Already built or fully designed (do not re-design, do not rebuild)

| Area | Status |
|---|---|
| Registration, tickets, promo codes, orders | Built |
| Public event pages + directory | Built + designed |
| Agenda, sessions, speakers | Built |
| Call for Speakers | Designed (dashboard prototype) |
| QR check-in, badges | Built + designed |
| Networking, AI matchmaking, 1:1 messaging, meetings scheduler | Built + designed |
| Q&A, polls, gamification | Built |
| Sponsors/exhibitors, lead retrieval | Built |
| Floor plan | Designed |
| Virtual sessions | Built |
| Analytics, reports | Built + designed |
| API keys, webhooks, integrations hub, white-label | Built + designed |
| Email templates | Designed |
| Onboarding wizard | Designed |
| Speaker portal, Exhibitor portal, Attendee web app | Designed |
| Operator/admin console | Built + designed |
| Communications center | Designed |
| **Karta Card (signature differentiator)** | Built |

This is already more than Eventee's entire product. The gaps below are what separates Karta from the marketplace vision and from the enterprise platforms.

---

# PART 2 — COMPETITIVE GAP ANALYSIS

## What each competitor does that Karta doesn't (yet)

### 🟢 LUMA — the marketplace model (MOST RELEVANT TO YOUR VISION)
Luma is the closest model to "the event marketplace" you described. ~2M people register for events monthly.

| Feature | What it does | Karta status |
|---|---|---|
| **Personalized discovery feed** | Events suggested by interests + location as users browse | ❌ Missing |
| **City pages** | "Events in Nairobi" — curated per-city landing pages | ❌ Missing |
| **Category pages** | Auto-categorized events (tech, wellness, business...) | ⚠️ Directory has categories, no SEO pages |
| **Community calendars** | Organizers create subscribable calendars; followers get notified of new events | ❌ Missing |
| **Follow organizers** | Follow → notified on every new event | ❌ Missing (designed in Phase 5, not built) |
| **Invites system** | Hosts send email/SMS invites, track acceptance rates | ❌ Missing |
| **Blasts** | Broadcast messages to all guests (email + SMS), schedulable | ❌ Missing |
| **Event chat** | Per-event group chat for all attendees | ⚠️ Have 1:1, no group chat |
| **Waitlists** | Join waitlist for sold-out events incl. paid; auto-promote | ❌ Missing |
| **Flexible ticket types** | Sliding scale, require-approval, hidden tickets | ⚠️ Have basic types only |
| **Map exploration** | Browse events on a map | ❌ Missing |
| **Event page themes** | Pre-designed visual themes + effects per event | ❌ Missing (have brand kits) |
| **Discovery eligibility rules** | Quality bar for featuring (no external ticketing, no gated locations) | ❌ Missing |

### 🟠 EVENTBRITE — marketplace monetization
20–30% of organizers' ticket sales come from Eventbrite's organic discovery. That's the marketplace value.

| Feature | What it does | Karta status |
|---|---|---|
| **Discovery engine** | Personalized recommendations, followers notified automatically | ❌ Missing |
| **Promoted listings (Ads)** | Organizers pay for placement in search/feed → platform revenue | ❌ Missing |
| **Social ads automation (Boost)** | Auto-generate FB/IG campaigns from event data | ❌ Missing |
| **Reserved seating / seat maps** | Pick-your-seat for theaters, galas | ❌ Missing |
| **Timed entry** | Time-slot tickets (museums, tours) | ❌ Missing |
| **Donations** | Donation ticket type, pay-what-you-want | ❌ Missing |
| **Add-ons / merchandise** | Sell parking, t-shirts, VIP upgrades with tickets | ❌ Missing |
| **Group registration** | One person registers many; bulk ticket bundles | ❌ Missing |
| **Ticket transfer** | Attendee transfers ticket to someone else | ❌ Missing |
| **Payout schedules** | Organizer chooses payout timing | ⚠️ Basic Stripe only |
| **Fee pass-through choice** | Organizer absorbs fees or passes to buyer | ❌ Missing |

### 🔵 EVENTEE — attendee experience polish
G2's "easiest to use" event app. Their entire product is the attendee layer.

| Feature | What it does | Karta status |
|---|---|---|
| **Workshop seat booking** | Capacity-limited sessions; attendees book seats; full = waitlist | ❌ Missing |
| **Newsfeed / social wall** | Organizer posts updates, GIFs, promos; attendees post; scheduled posts | ❌ Missing |
| **Push/real-time notifications** | Agenda changes instantly visible; reminders before sessions | ⚠️ No notification system |
| **Swipe networking** | Tinder-style mutual matching before contact is shared | ⚠️ Have grid + AI match, no swipe |
| **Meeting → agenda sync** | Accepted meetings auto-appear in both personal agendas | ⚠️ Designed, not built |
| **Session insights** | Per-session engagement tracking for organizers | ⚠️ Basic |
| **Partner analytics** | Sponsor ROI dashboards (booth visits, profile views) | ⚠️ Lead counts only |
| **In-app custom menu** | Organizer adds custom pages/links to event app | ❌ Missing |

### 🟣 EVENTIFY — onsite operations + AI agents
Their 2026 positioning is "AI agents for events." Strong onsite tooling.

| Feature | What it does | Karta status |
|---|---|---|
| **Onsite badge printing** | Zebra/Brother/Epson direct-thermal printing in 3–5s at check-in | ❌ Missing |
| **Self-check-in kiosks** | iPad kiosk mode — attendee scans own QR or searches name | ❌ Missing |
| **Offline mode** | Check-in + lead capture work without internet, sync later | ❌ Missing (critical for African venues) |
| **Walk-in registration** | Register + pay + badge at the door | ❌ Missing |
| **Session-level check-in** | Scan into individual sessions, not just the event | ❌ Missing |
| **Lead tags + workflows** | Hot/warm/cold tags + automated follow-up emails to leads | ⚠️ Have rating, no automation |
| **AI agents** | AI assistants that execute organizer tasks | ❌ Missing (you have AI matchmaking — extend it) |

### 🔴 CVENT / INEVENT — enterprise depth
What enterprise buyers expect. Mostly P2 — don't build before validation.

| Feature | What it does | Karta status |
|---|---|---|
| **Registration approval workflows** | Apply → organizer approves → pay | ❌ Missing |
| **Email marketing automation** | Drip campaigns, reminders, segmented sends, A/B | ⚠️ Transactional only |
| **Pre/post-event surveys** | Survey builder + response analytics | ⚠️ Session feedback only |
| **Budget management** | Track event costs vs revenue | ❌ Missing |
| **Custom report builder** | Drag-and-drop report creation, scheduled exports | ❌ Missing |
| **Travel & hospitality** | Flights, hotel room blocks, shuttles, meal vouchers | ❌ Missing (P3 — skip) |
| **Multi-language events** | Event content in multiple languages | ❌ Missing (relevant for FR/AR Africa) |
| **Accessibility** | Captions, screen-reader flows | ⚠️ Partial |
| **On-demand content** | Session recordings library post-event | ⚠️ Recording URL field only |

### ⚫ WHOVA / BIZZABO / SWAPCARD — engagement extras

| Feature | What it does | Karta status |
|---|---|---|
| **Community boards** | Topic-based discussion threads per event | ❌ Missing |
| **Scavenger hunts** | Gamified onsite challenges | ⚠️ Have points, no challenges |
| **Photo wall** | Shared event photo stream | ❌ Missing |
| **AI attendee copilot** | "Bizzy" — chat assistant answering attendee questions about the event | ❌ Missing (huge Anthropic API opportunity) |
| **Lead scoring** | AI ranks leads by quality for exhibitors | ❌ Missing |
| **Speed networking / roundtables** | Timed 1:1 rotations, topic tables | ❌ Missing |
| **Job board** | Attendees post/browse jobs (Whova) | ❌ Missing (P3) |

---

# PART 3 — THE PRIORITIZED ROADMAP

Three phases. **M = Marketplace (the vision), O = Organizer ops, E = Enterprise.** Build in this order.

## 🥇 PHASE M — THE MARKETPLACE (build first — this IS your vision)

The front website becomes a true discovery marketplace. Attendee accounts become first-class.

**M1. Attendee accounts & identity**
- Attendee signup/login (email OTP + Google) — separate from organizer accounts but same auth system, role-based
- Profile: interests (categories), city/region, photo
- "My tickets" wallet: all registrations, QR codes, Karta Cards in one place
- Purchase history, saved/bookmarked events

**M2. Discovery engine**
- Personalized home feed: events matching interests + city, upcoming this week, trending (by registration velocity)
- City pages: `/events/[city]` — SEO-indexed, curated header, all public events in that city
- Category pages: `/events/category/[slug]` — SEO-indexed
- Search with filters: date range, price (free/paid), category, format (in-person/virtual), city
- Map view: events plotted on an interactive map
- Featured events: operator-curated + quality-bar rules (event must have cover image, description, tickets live)

**M3. Follow & notify**
- Follow organizers → in-app + email notification on new event publish
- Community calendars: organizer's public calendar page, subscribable (ICS feed + email digest)
- Waitlists: sold-out events accept waitlist joins; auto-promote with payment window when seats free

**M4. Notifications system (email + WhatsApp)**
- Notification service with templates + queue (build on existing Resend; add WhatsApp via Twilio/Meta WhatsApp Business API)
- Attendee: registration confirmation, payment receipt, event reminder (24h + 2h), agenda changes, check-in confirmation, post-event feedback ask — each on email + WhatsApp (user choice)
- Organizer: new registration, payout sent, waitlist filled, event milestone (50% capacity)
- WhatsApp is the differentiator for Africa — Eventbrite doesn't do this. Ticket + QR + Karta Card delivered straight into WhatsApp.

**M5. Ticketing depth**
- Group registration (register N people in one checkout, one payer)
- Donation / pay-what-you-want ticket type
- Approval-required tickets (apply → approve → pay)
- Hidden tickets (unlock via code)
- Ticket transfer to another person
- Add-ons (parking, merch, VIP upgrade) attached to any ticket
- Fee handling choice: organizer absorbs platform fee or passes to buyer

**M6. Marketplace monetization (platform revenue)**
- Promoted listings: organizers pay to boost placement in feed/search (clearly labeled)
- Featured collections: operator-curated ("Ramadan events", "Tech in East Africa")
- Platform fee on paid tickets (you already have Stripe/Flutterwave — formalize the fee structure with the pass-through option)

## 🥈 PHASE O — ORGANIZER OPERATIONS (build second — retention & word-of-mouth)

**O1. Communications center** (designed already — build it)
- Email blasts to segments (all / ticket type / checked-in / no-shows)
- Scheduled sends, basic drip (reminder sequence)
- WhatsApp broadcast to opted-in attendees
- Per-event newsfeed: organizer posts updates/photos/announcements visible in attendee event view; scheduled posts

**O2. Onsite hardening**
- Offline-capable check-in (service worker + local queue, sync on reconnect) — **critical for African venues with bad Wi-Fi**
- Self-check-in kiosk mode (full-screen route, attendee scans/searches)
- Walk-in registration at the door (register + pay + card on the spot)
- Session-level check-in (scan into capacity-limited sessions)
- Badge PDF generation for printing (4x6 thermal layout; defer hardware integration)

**O3. Sessions depth**
- Workshop seat booking with capacity + per-session waitlist
- Session insights: attendance, rating, Q&A volume per session

**O4. Engagement extras**
- Event group chat / community board (topic threads)
- Photo wall (attendee uploads, organizer moderates)
- Swipe networking mode (mutual match before contact share — wraps existing matchmaking)
- Speed networking rounds (timed 1:1 rotations)

**O5. Karta AI (extend your existing Anthropic integration)**
- Attendee copilot: chat that answers "when is X session", "who should I meet", "where is room B" from event data
- Organizer copilot: "write my reminder email", "summarize feedback", "which sessions underperformed"
- Lead scoring for exhibitors: AI ranks captured leads
- This + the Karta Card + WhatsApp = your three unfair advantages. Nobody in the market has all three.

## 🥉 PHASE E — ENTERPRISE (build only when a paying customer asks)

- Pre/post-event survey builder
- Custom report builder + scheduled exports
- Reserved seating / seat maps
- Timed entry
- Budget management
- Multi-language event content (EN/FR/AR matters for your market)
- On-demand content library
- Live captions/translation
- Travel & hospitality (probably never — partner instead)

---

# PART 4 — INSTRUCTIONS FOR CLAUDE DESIGN

Paste this section into Claude Design (with the Karta design system from `/design-reference/karta/` — forest #1F4D3A, gold #E8C57E, cream #FAF6EE, DM Sans/Inter/JetBrains Mono):

> Using the exact Karta design system and existing component patterns from the design reference, design the following NEW screens. These extend the existing attendee (`attendee/`) and dashboard (`dashboard/`) surfaces — match their layouts and primitives. All screens are responsive web, mobile-first.
>
> **Marketplace (attendee-facing):**
> 1. **D01 · Marketplace Home (logged-in)** — personalized feed: "For you" (interest+city matched events), "This week in [city]", "Trending", "From organizers you follow". Airbnb photography-first cards. Top: pill search + category chips + city selector.
> 2. **D02 · City Page** — `/events/[city]`: hero with city name + event count, filter row, event grid, map toggle button.
> 3. **D03 · Search Results + Map View** — split view: filterable list left, interactive map right with price pins; mobile = toggle between list/map.
> 4. **D04 · Attendee Account — My Tickets Wallet** — upcoming tickets as cards (QR + Karta Card thumbnail + event info), past events below, each opens full-screen QR for the door.
> 5. **D05 · Attendee Profile & Interests** — interests as selectable category pills, city, notification preferences (email/WhatsApp toggles per notification type).
> 6. **D06 · Organizer Public Profile (follow)** — banner, logo, bio, Follow button (gold when following), upcoming events grid, past events, follower count in JetBrains Mono.
> 7. **D07 · Waitlist States** — sold-out event page state with "Join waitlist" replacing register CTA; waitlist position confirmation; "spot opened" notification screen with payment countdown timer.
> 8. **D08 · Group Registration Flow** — quantity selector per ticket type, attendee-details form repeated per seat (collapsible), single payment, success state showing N tickets + N Karta Cards.
>
> **Organizer dashboard additions:**
> 9. **D09 · Communications Center** — segmented blast composer (audience picker: all/ticket type/checked-in), email + WhatsApp channel toggles, schedule picker, sent-history table with open rates in JetBrains Mono.
> 10. **D10 · Event Newsfeed Manager** — post composer (text/image/GIF), scheduled posts queue, published feed preview as attendees see it.
> 11. **D11 · Kiosk Check-in Mode** — full-screen self-service: big "Scan your QR" zone, name search fallback, success state with attendee name + ticket type + green flash, badge-print button.
> 12. **D12 · Walk-in Registration** — door-staff flow: quick form (name/email/phone) → ticket select → tap-to-pay or cash toggle → instant QR + Karta Card sent via WhatsApp.
> 13. **D13 · Promoted Listing Manager** — organizer buys placement: budget input, duration, preview of "Promoted" label on their card in the feed, performance stats (impressions/clicks/registrations in JetBrains Mono).
> 14. **D14 · Karta AI Copilot Panel** — slide-over chat panel inside the event dashboard; suggested prompts ("Draft reminder email", "Summarize session feedback"); also design the attendee-side floating copilot button + chat sheet in the attendee event view.
>
> Forbidden: no generic AI-slop layouts, no Roboto, numbers always JetBrains Mono, gold appears once per screen, cream canvas not white, photography bleeds edge-to-edge on event cards.

---

# PART 5 — INSTRUCTIONS FOR CLAUDE CODE

After designs are approved and placed in `/design-reference/karta/marketplace/`, run milestones in order, one Claude Code session each, surgical handoff pattern (Step 0 plan → approval → phased commits → regression check). Stack stays locked: Next.js 14 + Supabase + Tailwind + shadcn, no new deps except a WhatsApp provider SDK.

> **Milestone M1 — Attendee accounts & wallet**
> Tables: extend `profiles` with `account_type`, `interests text[]`, `city`, `notification_prefs jsonb`. New: `saved_events`, `organizer_follows`.
> Routes: `/account` (wallet), `/account/profile`, attendee auth flow (email OTP + Google via existing Supabase auth).
> Wallet pulls existing `registrations` + `generated_cards`. RLS: attendee sees only own rows.
>
> **Milestone M2 — Discovery**
> Tables: `event_categories` (seed ~12), add `category_id`, `city`, `is_featured`, `search_vector tsvector` to events. New: `event_views` (for trending).
> Routes: rebuild `/(public)/events` as the personalized feed (logged-out = city+trending only), `/events/city/[city]`, `/events/category/[slug]`, search API with Postgres full-text + filters, map view (Leaflet via CDN or static map tiles — no heavy dep).
> SEO: generateMetadata + JSON-LD Event schema on all public event/city/category pages, sitemap expansion.
>
> **Milestone M3 — Follow, calendars, waitlists**
> Tables: `organizer_follows` (done in M1), `waitlist_entries (event_id, ticket_type_id, registration info, position, status, promoted_at, expires_at)`.
> Logic: capacity check on ticket purchase → offer waitlist; on cancellation/capacity increase → promote first in line, send payment link with 24h expiry (cron via Vercel cron route).
> Organizer calendar page `/o/[slug]` with ICS feed endpoint.
>
> **Milestone M4 — Notifications (email + WhatsApp)**
> Tables: `notifications (user_id, type, channel, payload, status, sent_at)`, `notification_templates`.
> Service: `lib/notifications/` — single `notify()` entry; channels: Resend (existing) + WhatsApp Cloud API (Meta) with template messages; respect per-user channel prefs; queue with retry via cron route.
> Wire into: registration confirm, payment receipt, reminders (24h/2h cron), agenda change, waitlist promotion, organizer new-event → followers.
> Env: `WHATSAPP_PHONE_ID`, `WHATSAPP_TOKEN`. Template registration with Meta is a manual prerequisite — flag for the human.
>
> **Milestone M5 — Ticketing depth**
> Tables: `ticket_addons`, `order_items` (if not present), extend `ticket_types` with `kind ('standard','donation','approval','hidden')`, `min_price`, `unlock_code`. New: `ticket_transfers`, `registration_approvals`.
> Flows: group checkout (qty per type, per-attendee details, one payment intent), donation amount input, approval queue page for organizer, transfer flow (original QR voided, new issued), add-on selection step, fee pass-through toggle in event payment settings (display math at checkout).
> Every group registrant still gets their own Karta Card — that's the viral loop multiplied.
>
> **Milestone M6 — Marketplace monetization**
> Tables: `promoted_listings (event_id, budget, starts_at, ends_at, impressions, clicks, status)`, `featured_collections`, `collection_events`.
> Feed ranking: promoted slots (labeled "Promoted", max 1 per 6 cards), then personalized score (interest match + city + recency + velocity).
> Operator console: collections CRUD, featuring rules, promoted-listing approval.
>
> **Milestone O1–O5** (one session each, after M-phase ships): Communications center → Onsite hardening (offline check-in service worker, kiosk route, walk-in flow, badge PDF) → Session seat booking → Engagement extras (group chat via Supabase Realtime, photo wall, swipe mode) → Karta AI copilots (Anthropic API, reuse matchmaking patterns; attendee copilot gets event context via RAG over sessions/speakers/rooms).
>
> Regression after every milestone: existing card flow, registration, check-in, dashboards all pass; `pnpm build && pnpm typecheck && pnpm lint` clean; migrations idempotent; RLS on every new table.

---

# PART 5B — ADDENDUM: ITEMS FROM DEEPER RESEARCH (slot into the phases noted)

| Feature | Who has it | Why it matters | Phase |
|---|---|---|---|
| **Live display screens** | Eventify | Chromeless full-screen projector views: live Q&A wall, poll results, social wall, schedule, sponsor loop — `/e/[slug]/display/[type]`, dark theme, Supabase Realtime auto-refresh. Makes every Karta event *look* high-tech on stage. | O4 |
| **Event duplication + save-as-template** | Everyone | "Duplicate event" copies agenda, tickets, settings, card design. The #1 retention feature for repeat organizers. Cheap to build. | O1 |
| **Recurring events / series** | Luma, Eventbrite | Weekly meetup, monthly forum — one parent, many instances, shared followers and calendar. | M3 |
| **UTM & source tracking on registrations** | Cvent, Bizzabo | `source` + `utm jsonb` on registrations + "Registrations by source" analytics. **This is how you prove the Karta Card drives registrations with data** — every card share link gets `?src=card`. | M2 |
| **Embeddable widgets** | Eventify, Eventbrite | `/embed/[slug]` iframe + copy-paste snippet so organizers put the register button/schedule on their own sites. Distribution multiplier. | O1 |
| **Add-to-calendar** | Everyone | Google/Apple/Outlook/ICS buttons on confirmation page + all reminder emails. One hour of work, used by every attendee. | M4 |
| **Per-event staff roles** | Cvent, InEvent | Invite staff to ONE event with a scoped role: check-in only, moderator only, finance only. Server-side enforced. Builds on existing teams. | O2 |
| **Scheduled posts** | Eventee | Pre-schedule newsfeed announcements ("Day 2 starts in 1 hour!") before the event begins. Already implied in O1 — make it explicit. | O1 |

---

# PART 6 — HONEST STRATEGIC NOTES

1. **The marketplace is a two-sided cold-start problem.** Discovery feeds are worthless with 8 events in them. The features above make the marketplace *possible* — but the marketplace becomes *real* when you onboard 20–30 Djibouti/East-Africa organizers personally. The features and the recruiting have to happen together.

2. **Your three unfair advantages** — no competitor has all three:
   - **Karta Card** (viral attendee identity — nobody has it)
   - **WhatsApp-native** (tickets, reminders, cards in WhatsApp — Eventbrite/Luma don't do this; Africa lives on WhatsApp)
   - **Karta AI** (copilots built on the Anthropic integration you already have)
   Lead every pitch with these. The rest of the roadmap is table stakes.

3. **Don't build Phase E until someone pays for it.** Cvent has 156 features and a 4-month implementation cycle. You win on speed, price, WhatsApp, and the Card — not feature count.

4. **Pricing implication:** the marketplace gives you a second revenue line (per-ticket fee + promoted listings) on top of SaaS subscriptions. Free organizers on the marketplace are inventory, not cost — their events fill your discovery feed.

5. **The 5-real-users advice still stands** — but now it's sharper: get 5 organizers to run real events on the M-phase marketplace before building the O-phase. Their complaints will reorder your roadmap better than any competitor analysis.
