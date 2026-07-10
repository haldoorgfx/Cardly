# KARTA — CLAUDE DESIGN SESSION 4
## Phase 4: Sponsors, Lead Retrieval, Virtual Sessions, Integrations

Open with: "Using the exact Karta design system from Session 1 (karta.css — forest #1F4D3A, gold #E8C57E, cream #FAF6EE, DM Sans display, Inter body, JetBrains Mono numbers), design these 5 screens."

---

## SCREENS

### W23 · Sponsor Showcase (Public Event Page Section)

This is a section within the public event page, shown as its own full page for reference. Prestigious, not salesy.

**Section header:**
DM Sans 28px 400 forest "Partners & Sponsors"
Inter 16px muted "AfriTech Summit 2026 is made possible by..."

**Tier 1 — Title Sponsors (2 across, large):**
Each card (white surface, 8px radius, 1px gold border — the ONLY place on this page with a gold border): logo centered (120px max-height, max-width 200px), company name (DM Sans 20px 500 forest, centered), tagline (Inter 14px muted, centered), "View booth →" forest ghost link.

**Tier 2 — Gold Sponsors (3 across):**
Same card style, no gold border (1px cream border instead). Logo 80px. Name + "Visit booth" ghost link.

**Tier 3 — Community Partners (horizontal logo strip):**
Clean row of monochrome logos (CSS mask technique — all logos same forest color via filter). No cards, no borders. Just logos in a row, 80px wide each, 40px tall, evenly spaced. On hover: logo becomes full-color.

**"Become a sponsor" CTA (for event interest page):**
Cream-soft band. "Interested in sponsoring?" DM Sans 20px 400 forest. Inter 14px muted brief text. "Contact organizer" gold pill button.

---

### W24 · Sponsor/Exhibitor Booth Page

The exhibitor's digital presence at the event. Airbnb listing-page anatomy for companies.

**Hero:**
Company cover image fills full width (400px tall). NO border. Bleeds edge-to-edge. Dark gradient bottom-40%. Over gradient: company name (DM Sans 32px 400 white, -0.02em), tagline (Inter 16px, gold).

**Content (max-width 960px, two columns below hero):**

LEFT (620px):
"About [Company]" — DM Sans 22px 400 forest, Inter 16px body.
"What we're offering" — list of 3-4 benefit items (checkmark icon in forest + Inter 15px description).
"Meet the team at the booth" — 3 team member chips (circular 40px photo + name + role, horizontal row).

RIGHT (280px, sticky):
Booth card (white, 8px radius, 1px cream border, 24px pad):
"Hall B · Booth 14" in JetBrains Mono 14px forest (large, prominent)
"Open: 9:00 – 18:00" in JetBrains Mono 13px muted
"Scan QR to connect" — forest button full-width (this opens the lead capture on exhibitor's device OR saves attendee's contact)
"Book a meeting" — ghost button below

---

### W25 · Lead Retrieval — Exhibitor QR Scanner

Mobile-optimized dark screen. Exhibitors use this on their phone to scan attendee QR codes. No Karta account needed.

**Full dark canvas (forest-dark #0D1F17). No nav bar — full screen tool.**

**Header strip (56px, slightly lighter forest surface):**
Left: "← Exit" (Inter 13px muted). Center: company logo (small, white, 24px). Right: "12 leads" in JetBrains Mono 13px gold.

**Camera viewport (the main surface):**
Takes 55% of screen height. 8px radius. Scanning animation: animated gold corner brackets (top-left, top-right, bottom-left, bottom-right — 24px, 3px thick) with a slow scanning line (thin gold line moving top-to-bottom, loop).

Below the scanner: "Point at attendee QR code" in Inter 14px white, centered.

**SCAN RESULT STATE (replaces scanner view after successful scan):**
Green flash (forest-success color, full viewport momentarily) then reveals:
Attendee photo (80px circular, centered, gold border).
Name: DM Sans 24px 500 white.
Role + Company: Inter 15px muted.
Interest tags: 2-3 forest-soft pills.
"Attending: 3 sessions" in JetBrains Mono 12px muted.

Below: note textarea (forest card surface, 8px radius, 1px gold-at-20% border, Inter 14px white placeholder: "Add a note about this lead..."). Then rating row: "Hot · Warm · Cold" — 3 pill chips, tapping fills in gold/forest-soft/cream respectively.

"Save lead ✓" — full-width gold pill button (48px, gold fill, ink text).
"Scan another" — ghost text link below.

**ERROR STATE:**
Red flash then: "Already scanned" or "Invalid QR" in DM Sans 18px 500 white, centered.

---

### W26 · Virtual Session Player

The hybrid/online event experience. Two panels.

**Full-width layout (no sidebar, no padding — immersive):**

**LEFT — Video (65% of viewport width):**
Video fills this area completely. Black letterbox. Event branding strip at top of video (gold text, subtle). Standard video controls bar at bottom (play/pause, volume, fullscreen, quality) — minimal, dark glass.

"LIVE" pulsing dot (red) + "243 watching" in JetBrains Mono 12px white, top-right of video area.

**RIGHT PANEL (35% width, cream-soft background, 1px left hairline):**
Tabs: "Q&A (12)" · "Chat" · "People"

Q&A tab (same component as W20 but narrower):
Questions list, upvote buttons, "Ask a question" input at bottom.

Moderator's "featured question" shown prominently at top — gold-left-border card.

**Below the player (full width, cream canvas):**
Session info strip: title (DM Sans 22px 400 forest) + speakers row (circular photos + names) + description (Inter 15px). "Add to agenda" ghost button right.

Related sessions: 3 horizontal cards (same compact style from W15 "You might also like").

**Mobile breakpoint:**
Video stacks on top, Q&A/chat below. Tabs still present. Full-width.

---

### W27 · Integrations Page (Organizer)

Clean dashboard page for connecting third-party tools. agents.md discipline — no decoration.

**Page header:**
DM Sans 28px 400 forest "Integrations"
Inter 16px muted "Connect your existing tools to sync data automatically."

**Connected section (if any):**
"Connected" in DM Sans 18px 500 forest.
Cards in a 3-column grid:

Each integration card (white surface, 8px radius, 1px cream border, 24px pad):
Logo (40px, left-aligned, colored). Company name (DM Sans 16px 500 forest). Short description (Inter 13px muted, 2 lines). Status: forest dot + "Connected" in Inter 13px forest. "Settings" ghost link + "Disconnect" muted link — both small, right-aligned bottom.

**Available section:**
"Available" in DM Sans 18px 500 forest.
Same card grid. Status: muted ring + "Not connected" in Inter 13px muted. "Connect" forest ghost button (6px radius, 36px).

**Available integrations to show:**
1. Zoom — video meetings for hybrid sessions
2. Mailchimp — sync registrants to your email list
3. HubSpot — add registrants as CRM contacts
4. Zapier — connect to 5,000+ apps
5. Slack — post event notifications to channels

Each card shows the real logo color treatment on hover (full color), monochrome at rest (CSS filter to forest color).

**API section (bottom):**
DM Sans 22px 400 forest "Webhooks & API"
Inter 14px muted "For developers — connect Karta to anything with our REST API and outbound webhooks."
Two CTA cards side by side: "API Keys →" (forest ghost) + "Webhook settings →" (forest ghost).
