# KARTA — CLAUDE DESIGN SESSION 3
## Phase 3: Networking, Q&A, Polls, Gamification

Open with: "Using the exact Karta design system from Session 1 (karta.css — forest #1F4D3A, gold #E8C57E, cream #FAF6EE, DM Sans display, Inter body, JetBrains Mono numbers), design these 5 screens."

---

## SCREENS

### W18 · Networking — People Discovery

The social layer of the event. Feels warm and human, not like a business directory.

**Page header:**
DM Sans 28px 400 forest "People at AfriTech Summit 2026"
Below: "247 attendees are networking" in Inter 16px muted. Filter pills: All · Founders · Investors · Engineers · Designers · Students.

**AI Suggestions strip (the premium section — gets special treatment):**
Section heading: Inter 12px 500, letter-spacing 0.06em, uppercase, gold: "SUGGESTED FOR YOU"
Horizontal scroll. Each match card (240px wide):

Card anatomy: cream surface, 8px radius, 1px cream border.
TOP: photo fills top 55% of card (aspect 16:9 crop for horizontal feel). NO border around photo.
BOTTOM (cream, 16px pad): name (DM Sans 15px 500 forest) + role + company (Inter 13px muted). Then: thin gold hairline. Below: "Why meet?" in Inter 11px gold italic, followed by the AI reason in Inter 13px muted (max 2 lines, e.g. "Both building fintech in East Africa. Both attending the Payments session tomorrow."). Then: "Connect" ghost pill (forest border + forest text, 32px).

Gold treatment: a subtle gold glow on card hover — `box-shadow: 0 0 0 1.5px rgba(232,197,126,0.5)`. The ONLY screen where multiple gold accents are allowed (each card can have a gold element) because each card IS a separate context.

**People grid (3 columns desktop, 2 tablet, 1 mobile):**
Each card: circular photo (80px, centered, top of card). Name (DM Sans 15px 500 forest, centered). Role + company (Inter 13px muted, centered). 2-3 interest tags (small forest-soft pills, centered). "Connect" ghost pill, centered. Mutual connections count if any: "2 mutual" in JetBrains Mono 11px muted.

**Search + filter:**
Full-width pill search. "Search by name, company, interest..."

---

### W19 · Messaging — Inbox + Thread

Clean, minimal. The agents.md discipline applied to a messenger.

**LEFT PANEL (320px, cream canvas, 1px right hairline):**
Section heading: DM Sans 16px 600 forest "Messages"
"+ New message" ghost button (forest border), 36px.

Conversation list: each row (72px): circular photo (44px) + name (Inter 15px 500 forest) + last message preview (Inter 13px muted, 1 line, truncated) + timestamp (JetBrains Mono 11px muted, right-aligned). Unread: forest dot (8px) on left, name in 600 weight. Active row: forest-soft background.

**RIGHT PANEL (main):**
Active conversation header: photo (40px) + name (DM Sans 18px 500 forest) + role (Inter 13px muted) + "View profile →" gold link.

Messages area: 
- Their messages: cream-border bubble, left-aligned, Inter 14px ink
- Your messages: forest-fill bubble, right-aligned, white text
- Timestamps: JetBrains Mono 11px muted, centered between groups

**"Share your Karta Card" banner** (subtle, dismissable): cream-soft band above input. "Share your card with [Name]?" — forest-soft bg, Inter 13px, "Share card" forest ghost button, "×" dismiss.

Input row: Inter 14px placeholder "Send a message...", forest send button (circle, 40px, forest fill, white arrow icon).

**Empty state (no conversation selected):**
Center of right panel: circular overlap of 3 avatars (48px each) + DM Sans 20px 400 forest "Your messages" + Inter 14px muted "Connect with people and start conversations." + "Browse people" forest button.

---

### W20 · Live Q&A (Attendee View)

The screen attendees use DURING a session. Should feel immediate and alive.

**Session context bar (cream-soft, 56px, sticky top below nav):**
Session title (Inter 14px 500 forest, truncated) · Room (Inter 13px muted) · "LIVE" pulsing red dot + "LIVE" in Inter 11px 500 red, uppercase. Right: attendee count "234 in room" in JetBrains Mono 12px muted.

**Question list (main area):**
Each question card: white surface, 8px radius, 1px cream border. 
Left: upvote button — up-arrow icon + count below it in JetBrains Mono 14px 500 forest. When upvoted: button fills forest. 
Right: question text (Inter 15px ink, 2-3 lines) + submitter (Inter 12px muted, "Anonymous" or "Amina O.") + timestamp (JetBrains Mono 11px muted).
Sorted by votes — highest first. Top question gets a subtle gold-soft background.

**"Featured" question (organizer-highlighted):**
Gold 2px left border on the card. "Featured by moderator" label in Inter 11px gold.

**Ask a question input (fixed bottom bar, cream surface, 1px top border):**
Textarea (Inter 14px, 48px min-height, 6px radius, cream border). Below: "Post anonymously" toggle (small, left) + "Submit question" forest pill (right). Count of pending questions: "14 questions · sorted by votes" in JetBrains Mono 11px muted, above the input.

---

### W21 · Live Poll + Leaderboard

Two states on one screen: active poll (top half) and gamification leaderboard (bottom).

**ACTIVE POLL section:**
Cream-soft background band. "LIVE POLL" in Inter 10px 600, letter-spacing 0.1em, gold, uppercase. Below: poll question in DM Sans 22px 400 forest. Options as large tap-target buttons (full width, 56px, cream surface, 1px cream border, 8px radius, Inter 15px 500 forest). Selected option: forest fill, white text, checkmark right. After voting: each option shows a percentage bar (forest fill, cream track) and percentage in JetBrains Mono 14px 500. Live update animation as votes come in.

"47 responses so far" in JetBrains Mono 12px muted, below options.

**LEADERBOARD section (below, white background):**
Section heading: DM Sans 22px 400 forest "Event Leaderboard"
Subtext: Inter 14px muted "Earn points by attending sessions, networking, and giving feedback."

**Top 3 (podium layout, horizontal):**
2nd place (left, slightly shorter): photo 56px circular, name, points in JetBrains Mono 16px 500, "#2" in JetBrains Mono 12px muted.
1st place (center, tallest): photo 72px circular, gold border (2px), name, points in JetBrains Mono 20px 500 forest, gold laurel crown icon (16px) above photo, "#1" in gold.
3rd place (right): photo 56px circular, name, points, "#3".

**Ranks 4–10 (list):**
Each row: rank in JetBrains Mono 13px muted, photo 36px circular, name + role (Inter 14px, muted), points right-aligned in JetBrains Mono 14px 500 forest.

**Your position (if not in top 10):**
Cream-soft band at bottom: "You're #34 with 120 points. Attend 2 more sessions to reach the top 20." Inter 14px muted, JetBrains Mono for numbers.

---

### W22 · Organizer: Q&A Moderation Panel

The organizer view during a live session. Clean, action-oriented. agents.md discipline.

**Two-column layout:**
Left (420px): question queue. Right (remaining): session status + controls.

**LEFT — Question queue:**
"Q&A — Design Systems Workshop" heading (DM Sans 18px 500 forest). "23 questions · sorted by votes" in JetBrains Mono 12px muted.

Filter tabs: All · Pending · Answered · Hidden

Each question row (white surface, 1px cream border, 8px radius, 12px pad):
Upvote count (JetBrains Mono 16px 500 forest, left). Question text (Inter 14px ink). Submitter + time (Inter 12px muted). Actions (right): "Feature" (star, gold on active) · "Answered ✓" (forest, fills on active) · "Hide" (muted × icon). All 3 as small icon buttons, no labels.

Answered questions: muted opacity, "✓ Answered" pill (forest-soft).

**RIGHT — Session status:**
"Session live" with pulsing forest dot. JetBrains Mono: "47 min remaining · 234 attendees · 23 questions"

Active poll card (white, 1px cream border): poll question + results bars + "Close poll" ghost button.

"Launch new poll" forest button. Clicking opens a slide-over: poll question input + option inputs + "Launch" button.

"End Q&A" and "Download questions CSV" — small ghost buttons at bottom.
