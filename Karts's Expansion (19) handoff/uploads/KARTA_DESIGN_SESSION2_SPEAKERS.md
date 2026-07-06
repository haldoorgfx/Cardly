# KARTA — CLAUDE DESIGN SESSION 2
## Phase 2: Speakers, Sessions, Personal Agenda

Open with: "Using the exact Karta design system, CSS tokens, fonts, and component patterns from Session 1 (karta.css — forest #1F4D3A, gold #E8C57E, cream #FAF6EE, DM Sans display, Inter body, JetBrains Mono numbers), design these 5 screens. Do not redefine the design system — use it directly."

---

## SCREENS

### W13 · Speaker Directory (Public)

Airbnb listing-grid anatomy for people. This is the most photography-driven screen in the platform.

**Top: page header**
DM Sans 32px 400 forest, letter-spacing -0.02em: "Speakers". Below: "47 speakers across 3 days" in Inter 16px muted. Right: filter pills (All · Keynote · Workshop · Panel · Fireside).

**Featured speaker (full-width card, 520px tall):**
Photo fills the ENTIRE card — bleeds to every edge, no border, no padding. Dark gradient bottom-third only. Over gradient: speaker name (DM Sans 28px 400 white, -0.02em), title + company (Inter 16px, gold), "Keynote · Main Stage" pill (gold outline, 28px). Top-right: session count badge "3 sessions" (cream surface, forest text, 999px radius). This card takes full content width.

**Speaker grid (3 columns, then 2 at tablet, 1 at mobile):**
Each card: photo fills the entire card top (aspect 3:4). NO thumbnail circle. NO text beside photo. Photo is the card. Only at the BOTTOM: a cream surface strip (80px) with name (DM Sans 15px 500 forest) + role + company (Inter 13px muted) + a small "2 sessions" in JetBrains Mono 11px muted. Card hover: 1px gold border appears. No shadow.

**Speaker search bar:**
Pill (999px radius), full content width, cream surface, cream border. "Search speakers by name, company, or topic..."

---

### W14 · Speaker Profile Page

Spotify album-page + Airbnb listing-detail hybrid. The speaker IS the content.

**Hero (full viewport width, 480px tall):**
Speaker photo fills the full width. No container. Bleeds edge-to-edge. Bottom dark gradient (60% of hero height). Over gradient: speaker name (DM Sans 40px 400 white, -0.025em), title at company (Inter 18px, gold), 3 social icons (LinkedIn, Twitter/X, website) as small white circles (32px, blur-glass surface).

**Below hero (max-width 960px, centered, two columns):**

LEFT COLUMN (620px):
- Section: DM Sans 22px 400 forest "About" — Inter 16px body below
- Section: DM Sans 22px 400 forest "Sessions" — list of session cards (3 cards max). Each: session title (DM Sans 15px 500 forest), time in JetBrains Mono 13px muted, room (Inter 13px muted), track pill, "Add to agenda" ghost button.
- Section: DM Sans 22px 400 forest "Co-speakers" — 3 small speaker chips (circular 40px photo + name, horizontal row)

RIGHT COLUMN (280px, sticky top):
- "Connect" card: white, 8px radius, 1px cream border, 24px padding. Photo (64px circular, gold border). Name + headline. "Send connection request" forest button full-width. "Share profile" ghost link below.
- Interests: tag pills (forest-soft background, forest text, 999px radius)

---

### W15 · Session Detail Page

The agenda item expanded. Hybrid of content + action.

**Top section (cream-soft band, full width, 240px):**
Track color pill top-left (e.g. "Design" — small, colored dot + label). Session title: DM Sans 32px 400 forest, -0.025em, max-width 720px. Time + room: JetBrains Mono 14px muted. "47 attending" in JetBrains Mono 13px muted. "Add to my agenda" gold pill button (48px tall, right-aligned on desktop, full width on mobile).

**Below band — two column layout:**

LEFT (640px):
Description: Inter 16px, 1.6 line-height.

Speakers section: "Presented by" in DM Sans 20px 400 forest.
Speaker cards (horizontal, side by side): photo fills card top (aspect 2:3, 8px radius), name + role below. Each 180px wide. Airbnb anatomy — photo IS the card.

"You might also like" — 3 compact session rows (title + time + room + track color dot, no photos).

RIGHT (260px, sticky):
Schedule card (white, 8px radius, 1px cream border, 24px pad):
Date: DM Sans 16px 600 forest
Time: JetBrains Mono 20px forest (large, prominent)
Room: Inter 14px muted
Duration: JetBrains Mono 13px muted "45 min"
Capacity: "47 / 120 registered" in JetBrains Mono 13px — forest number, muted slash and total
[Add to agenda button — forest fill, full width]
[Already in agenda state: gold outline, "✓ In your agenda", gold text]

**After session (if session has ended):**
Rating prompt replaces the schedule card: 5 star dots (gold filled / gold outline), "Rate this session" in DM Sans 16px 500 forest. After selection: comment textarea + "Submit feedback" forest button.

---

### W16 · Personal Agenda (My Schedule)

The attendee's curated view of the event. Calm, personal, functional.

**Page header:**
DM Sans 28px 400 forest "My Agenda — AfriTech Summit 2026"
Subtext: "14 sessions saved across 3 days" in Inter 16px muted. Right: "Add more sessions" ghost button.

**Day tabs:** Thu 12 · Fri 13 · Sat 14. Active: forest underline + forest text.

**The agenda — NOT a time grid, a personal list:**
Each session as a card (white surface, 8px radius, 1px cream border). Layout:
- Left: time block (JetBrains Mono 15px 500 forest, e.g. "10:00") with a vertical gold line connecting consecutive sessions
- Right: session title (DM Sans 16px 500 forest), speaker (Inter 14px muted), room (Inter 13px muted), track pill
- Far right: "Remove ×" (muted, appears on hover)

Conflict indicator: if two sessions overlap, a cream-border orange/warning pill "Conflict" appears between the overlapping rows. JetBrains Mono 11px.

Empty state: DM Sans 20px 400 forest "Your agenda is empty", Inter 14px muted "Browse sessions and add the ones you want to attend", "Browse sessions →" forest button.

**Bottom: "Sessions you haven't rated" section (after event):**
Compact list of attended sessions with 5-star inline rating. JetBrains Mono for session time.

---

### W17 · Session Feedback & Event Rating

The post-event page. Calm, appreciative, simple.

**Page header:**
DM Sans 28px 400 forest "How was AfriTech Summit?"
Inter 16px muted "Your feedback helps organizers improve."

**Overall event rating (large, prominent):**
DM Sans 22px 400 forest "Rate the event"
5 large star outlines (40px each), gold-filled on selection. Current: 4 of 5 filled.
After rating: Inter 16px muted "Thanks — tell us more (optional)" textarea below.

**Per-session list:**
"Sessions you attended" in DM Sans 20px 400 forest
Each row: session title (Inter 15px 500 forest) + compact 5-star inline (20px stars, gold) + "Skip" ghost link. Already-rated rows show filled stars + a checkmark (forest, 16px).

**Highlights section:**
"What was the best part?" — 3 pill chips to tap: "The speakers · The networking · The sessions · The venue · The Karta Card 😄" — multi-select, tapping fills them forest.

**Submit:**
"Submit feedback" forest button, full width on mobile, 280px on desktop, centered.
"Skip for now" ghost link below.
