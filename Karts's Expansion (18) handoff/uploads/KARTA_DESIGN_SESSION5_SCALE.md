# KARTA — CLAUDE DESIGN SESSION 5
## Phase 5: API Keys, White-Label, Abstract Submission, Portfolio Analytics

Open with: "Using the exact Karta design system from Session 1 (karta.css — forest #1F4D3A, gold #E8C57E, cream #FAF6EE, DM Sans display, Inter body, JetBrains Mono numbers), design these 5 screens."

---

## SCREENS

### W28 · API Key Management

Developer-facing but not cold. agents.md discipline — data is everything, decoration is nothing.

**Page header:**
DM Sans 28px 400 forest "API Keys"
Inter 16px muted "Use API keys to access Karta's REST API from your own applications."

**Quick reference strip (cream-soft band, 1px bottom border):**
"Base URL:" in Inter 13px muted followed by `https://karta.cre8so.com/api/v1` in JetBrains Mono 13px forest on a cream-soft code pill. Copy icon right. Docs link: "View API docs →" in gold.

**Create new key (white card, 8px radius, 1px cream border, 24px pad):**
DM Sans 18px 500 forest "Create API key"
Two inputs side by side: Key name (placeholder "e.g. My CRM integration") + Scope selector (dropdown with checkboxes: events:read · events:write · registrations:read · registrations:write · checkin:write · analytics:read).
"Create key" forest button.

**Active keys list:**
Table headers (Inter 11px 500, uppercase, letter-spacing 0.06em, muted): Name · Key · Scopes · Last used · Created · Actions

Each row:
- Key name (DM Sans 15px 500 forest)
- Key prefix: `kta_live_ab12cd34...` in JetBrains Mono 13px forest on cream-soft pill. Copy icon.
- Scope pills (small, 24px, forest-soft bg, forest text, 999px): "events:read" etc.
- Last used: JetBrains Mono 12px muted "2 days ago"
- Created: JetBrains Mono 12px muted "Jan 12, 2026"
- Actions: "Rotate" ghost + "Revoke" red ghost

**Key created modal (overlay):**
DM Sans 22px 500 forest "Your new API key"
Warning: Inter 14px muted "Copy this key now. It won't be shown again."
Key in full: JetBrains Mono 15px forest on forest-soft wide pill. Large copy button (forest fill, "Copy key", full width).
"I've copied my key" forest button below dismisses modal.

---

### W29 · White-Label Settings

For Studio plan organizers. Lets them brand the platform as their own.

**Page header:**
DM Sans 28px 400 forest "White Label"
Gold plan badge: "Studio plan feature" (gold border, gold text, 999px pill, 28px).

**Two columns:**

LEFT (600px) — Settings form:

Section: "Brand Identity"
- Brand name input: "Your brand name" (replaces 'Karta' everywhere)
- Logo upload zone: dashed cream border, 120px tall, "Upload logo (PNG, SVG, max 2MB)" in muted.
- Favicon upload: same but 64px square zone.
- Primary color: color picker input (shows hex value in JetBrains Mono) + a small color swatch circle.

Section: "Custom Domain"
DM Sans 18px 500 forest "Custom Domain"
Domain input: "events.yourcompany.com" placeholder. Inter 14px muted "Point this domain's CNAME to karta.cre8so.com"
Status indicator: pulsing green dot + "Verified" in Inter 13px forest OR orange dot + "Waiting for DNS..." in muted.
DNS record to add: code block (forest-soft background): `CNAME  events.yourcompany.com  →  karta.cre8so.com`

Section: "Emails"
From name: "e.g. TechCorp Events"
Reply-to email input.
"Hide 'Powered by Karta'" toggle — when on: Inter 13px muted note "Karta branding removed from all attendee emails."

"Save changes" forest button, full width of column.

RIGHT (280px, sticky) — Live preview:
White card (8px radius, 1px cream border, 24px pad). DM Sans 16px 500 forest "Preview" at top.
Miniature event page mockup (240px wide, 320px tall, scaled at 50%). Shows their custom logo where Karta logo would be, their primary color on the CTA button. Updates in real-time as they type.

---

### W30 · Abstract Submission (Public Form)

The form academic and professional event organizers use for call-for-papers. Clean, focused, trustworthy.

**Page header:**
Event logo (40px) + event name (DM Sans 20px 500 forest) + "Call for Papers" (Inter 14px muted).
DM Sans 32px 400 forest "Submit your abstract"
Forest-soft band: "Deadline: March 1, 2026 · 14 days remaining" in JetBrains Mono 14px forest + Inter 14px muted remaining text.

**The form (single column, max-width 680px, centered):**

Step indicator: 3 segments ("Paper details · Authors · Review & submit"). Active: forest fill. Complete: checkmark + forest. Upcoming: cream border.

**Paper Details step:**
- Title input (full width, 56px height)
- Abstract textarea (full width, 180px min, word count "0 / 400 words" in JetBrains Mono 12px muted, right-aligned, color changes to warning at 380, error at 400)
- Keywords (tag input — type and press Enter, shows as forest-soft pills with × remove)
- Category dropdown (conference tracks)
- PDF upload zone (optional): "Upload full paper (optional) — PDF, max 10MB"

**Authors step:**
"Primary author (you)" section with name/email/affiliation (pre-filled if logged in).
"+ Add co-author" button opens an inline row: name + email + affiliation inputs.
"I am presenting this paper" toggle.

**Review & Submit step:**
Summary card (white, 1px cream border): all fields shown read-only in rows. Edit icon on each row.
"Submit abstract" forest button, full width.
Inter 13px muted below: "You'll receive a confirmation email. Decisions by February 15."

---

### W31 · Abstract Review Panel (Organizer)

The organizer's tool for reviewing submitted papers. agents.md discipline — this is an admin surface.

**Page header:**
DM Sans 28px 400 forest "Abstracts — AfriTech Summit"
Stats strip: "47 submitted · 12 accepted · 8 rejected · 27 pending review" — all numbers JetBrains Mono 16px 500 forest.

**Filter tabs:** All · Pending · Accepted · Rejected · Revision Requested

**Abstract list (left, 400px) + Detail (right, remaining):**

LEFT — list:
Each row (72px, white, 1px bottom border): title (Inter 14px 500 forest, 2-line truncated) + submitter (Inter 12px muted) + category pill + status pill + submission date (JetBrains Mono 11px muted). Active row: forest-soft background.

RIGHT — detail panel:
Abstract title: DM Sans 24px 400 forest.
Authors: "Dr. Amina Osman, Sahel Pay · Prof. Kwame Mensah, University of Ghana" in Inter 15px muted.
Category pill + submission date in JetBrains Mono 13px.
Keywords: tag pills.
Abstract body: Inter 15px ink, full text (scrollable).
Download PDF link if uploaded.

Review panel (white card, 8px radius, 1px cream border, 24px pad):
Status selector: 5 pill options — "Pending · Accept · Reject · Request revision · Waitlist". Click to select, selected fills forest.
Notes textarea: "Review notes (optional, shared with authors if accepted/rejected)".
If accepting: "Assign to session" dropdown.
"Save decision" forest button. "Next abstract →" ghost link.

---

### W32 · Portfolio Analytics (Multi-Event Overview)

The power-organizer view across all their events. Typography does the work.

**Page header:**
DM Sans 32px 400 forest "Your Events Portfolio"
Date range pill selector (1 quarter · 6 months · 1 year · All time). JetBrains Mono 13px showing selected range.

**Top summary (Stripe editorial principle — single prose strip, not a KPI grid):**
White card, 8px radius, 1px cream border, 28px pad:
"24 events · 14,280 total registrations · $89,400 total revenue · 87% average check-in rate · 11,840 Karta Cards downloaded (83%)"
JetBrains Mono for all numbers. Muted separator dots. The Karta Card metric appears alongside standard event metrics — it's a first-class KPI.

**Growth chart:**
Section: DM Sans 22px 400 forest "Registrations over time"
Single line chart (Inter 14px muted axis labels, JetBrains Mono 12px for axis numbers). Two lines: this period (forest) + last period (forest-soft, dashed). One gold dot at current end of the forest line. NO chart grid lines — just the two lines on a clean cream canvas.

Editorial insight below: Inter 14px muted "Registrations grew 34% compared to the same period last year. Your fastest-growing event type is Tech summits (+52%)."

**Top events table:**
DM Sans 22px 400 forest "Top performing events"
Same table treatment as W01 dashboard — hairline separators, JetBrains Mono numbers, status pills.
Columns: Event · Date · Registrations · Revenue · Check-in rate · Cards shared. Sortable.

**Karta Card virality section (unique to Karta — no competitor has this):**
DM Sans 22px 400 forest "Card sharing across your events"
Bar chart: each event as a horizontal bar (forest fill, cream track), showing "cards downloaded / registrations" as a percentage. JetBrains Mono 13px for all percentages. Best: AfriTech Summit 91%. Lowest: Weekend Workshop 62%.
Editorial note: "Attendees at your tech events share their cards 2.3× more than at cultural events. Consider the design and the shareability of the moment."

**Revenue breakdown:**
DM Sans 22px 400 forest "Revenue"
Same editorial prose-rows format from W05: each revenue source on its own line, label (Inter 14px forest) + dots + amount (JetBrains Mono 16px 500 forest). Total at the bottom with a hairline separator above it.
