# Handoff: Eventera — Attendee Mobile App

## Overview
The **attendee-facing** mobile app for Eventera, an event platform. Attendees open an event (by shared link, code, or discovery), view the event page, register / get a QR ticket, make a personalized "I'm attending" card, and engage during the event (agenda, Q&A, polls, networking, messages, feedback). Signed-in attendees also get a ticket wallet, saved events, followed organizers, notifications, and a profile.

Design goals: **editorial, African-modern, designer-grade, quiet confidence** — the app frames the user's event, it never shouts. Generous spacing, calm cream surfaces, one confident forest accent with sparing gold. Think Linear/Stripe restraint with warmth.

This bundle contains **36 numbered screens** plus their loading / empty / error / offline / not-signed-in variants, laid out as 375px phone frames on a pannable canvas, grouped into 12 flow sections (A–L).

## About the Design Files
The files in this bundle are **design references authored in HTML/CSS** — prototypes that show the intended look, spacing, and behavior. They are **not production code to copy directly**.

The task is to **recreate these designs in the target codebase's environment**. The implementation notes from the product owner state: *all screens map to real Supabase data / existing web API routes already wired in a Flutter app; the design changes are visual and the data contracts stay the same.* So:
- If implementing in the **existing Flutter app**, rebuild each screen as Flutter widgets using the tokens below, keeping the existing data/model layer untouched.
- If a fresh environment is chosen (React Native, etc.), pick the framework's idiomatic patterns and apply these tokens.

Do not ship the HTML directly. Use it as the visual spec.

## Fidelity
**High-fidelity (hifi).** Final colors, typography, spacing, radii, shadows, and component states are specified and should be reproduced faithfully. Recreate pixel-close using the codebase's UI primitives. The only placeholders are:
- **Photos** — rendered with a layered mesh-gradient placeholder system (`.ph`, driven by an `--h` hue). Replace with real event/speaker/attendee imagery.
- **QR codes** — drawn as a deterministic pseudo-pattern for looks. Replace with the backend-generated QR.
- **Attendee card render** — the on-card composition is a visual mock; the real watermarked card render comes from the existing backend.

## Design language & brand

### Colors (exact hex)
| Token | Hex | Use |
|---|---|---|
| forest | `#1F4D3A` | primary — buttons, active nav, headings |
| forest-dark | `#0D1F17` | dark screens (splash, card success), deepest surfaces |
| forest-surface | `#1E3D2D` | dark elevated |
| forest-soft | `#E8EFEB` | tinted chips, active nav bg, soft badges |
| gold | `#E8C57E` | accent — used sparingly (card CTA, "live", highlights) |
| gold-hover | `#C9A45E` | gold pressed / darker gold text |
| gold-soft | `#F5E9CC` | gold tint backgrounds |
| cream-canvas | `#FAF6EE` | app background (NOT white) |
| cream-surface | `#FFFFFF` | cards, inputs, sheets |
| cream-soft | `#F0EDE8` | subtle fills, skeleton base |
| cream-border | `#E5E0D4` | warm hairline borders |
| border-strong | `#C9C3B1` | stronger borders, toggle-off track |
| ink | `#0F1F18` | primary text |
| ink-soft | `#3A4A42` | secondary text, labels |
| ink-muted | `#6B7A72` | tertiary text, meta |
| success | `#2D7A4F` | confirmed status |
| warning | `#C97A2D` | pending / low stock |
| danger | `#B8423C` | errors, "live" dot, destructive |
| info | `#3A6B8C` | informational tags |

Hero/premium gradient: `linear-gradient(135deg, #1F4D3A 0%, #2A6A50 60%, #E8C57E 100%)`.
Never use purple, pink, pure-white backgrounds, or cool greys.

### Typography
- **Display / headings:** DM Sans, weights 600–700, letter-spacing −0.02em.
- **Body / UI:** Inter, weights 400–600.
- **Mono** (codes, ticket IDs, timestamps, prices, counts): JetBrains Mono.
- Mobile scale: H1 26–28, H2 20–22, H3 17, body 15, small 13, micro 12.

### Shape & depth
- Radius: cards 14–16, inputs/buttons 12, chips/pills 999, bottom sheets top-20.
- Shadows:
  - soft: `0 1px 2px rgba(15,31,24,.04), 0 8px 24px rgba(15,31,24,.06)`
  - lift: `0 4px 12px rgba(15,31,24,.08), 0 24px 60px rgba(31,77,58,.12)`
  - focus ring: `0 0 0 3px rgba(31,77,58,.15)`
- Spacing scale: 4 / 8 / 12 / 16 / 20 / 24 / 28 / 32. Screen padding 20.

### Motion
Floaty hero (card success uses a 4.5s ease-in-out Y-float), subtle fades, tap scale 0.98, skeleton shimmer for loading.

## Navigation model (proposed & built)
Two levels:
1. **App level** — bottom tab bar, 4 tabs: **Discover · Tickets · Cards · Account**. Discover carries a prominent "Have a code?" field to jump straight into an event.
2. **Event level** — a sticky top **segmented section nav**: Overview · Schedule · Speakers · Sponsors · Network · More (overflow sections — Q&A, Polls, Leaderboard, Feedback — live behind a "More" bottom sheet). **Register / Get ticket** is a persistent sticky bottom CTA on the event pages.

## Global components (design once, reuse)
- **App bar** — 52px, cream, back chevron left, DM Sans 17/600 title, optional right actions; hairline bottom border (`.appbar.hair`) on scroll.
- **Status bar / phone chrome** — injected by script (`9:41`, signal/wifi/battery); `on-dark` variant flips glyphs white on dark screens.
- **Buttons** — `.mbtn` 52px tall, radius 12, full width: `mbtn-forest` (primary), `mbtn-gold` (accent), `mbtn-sec` (surface + border), `mbtn-text`; `mbtn-sm` = 44px. Active = scale .98.
- **Cards** — `.mcard`: white surface, warm border, radius 15, soft shadow, 16 padding.
- **Chips** — `.chip` pill, 34px; `.on` = forest fill; `.soft` = forest tint. Semantic `.tag` in forest/gold/success/warning/danger/info soft tints.
- **Inputs** — `.input`: white, warm border, radius 12, 50px; label above (ink-soft 13/600); `.focus` = forest border + focus ring; `.error` = danger border + helper text.
- **Bottom sheet** — `.sheet` with grab handle + `.scrim`, radius top-20; used for pickers/actions (ask a question, photo source, More sections).
- **Avatars** — `.av` circle, forest bg with gold initial fallback; sizes 32/40/48/64; `.av-cluster` for overlap. `.ph` variant = photo placeholder.
- **Bottom tab bar** — `.tabbar` 82px (safe-area padded), forest active icon+label.
- **Segmented section nav** — `.segnav`, forest underline on active.
- **Sticky CTA** — `.stickycta` bottom bar.
- **Toggle** — `.tgl` / `.tgl.on` (forest).
- **Segmented control** — `.seg-ctl` (day tabs, upcoming/past).
- **Skeleton** — `.skl` shimmer gradient.
- **Toast** — `.toast`, bottom, forest-dark surface, gold icon, short.
- **Star rating** — `.stars`, gold fill on / border off.

## Screens / Views
Numbering matches on-canvas labels; row letters are the flow sections.

### A · Onboarding & entry
1. **Splash** — dark forest mesh; gold calendar-check mark in a forest rounded square, "Eventera" wordmark, "Be in the room", loading bar. `data-nostatus`.
2. **Home / Discover tab** — logo app bar + search + avatar; forest-gradient "Have an event code?" card (mono code input + gold arrow); Discover heading with city selector; category chips; a featured event card (cover, Featured tag, date/venue rows), then compact list cards. Bottom tab bar (Discover active).
3. **Attendee sign-in** — brand mark, welcome copy, "Continue with Google" (forest primary), divider, email input (focus state), "Send me a code" (secondary), terms.
3b. **OTP** — 6-digit code, 6 boxes (filled/active-with-caret/empty), resend countdown, Verify CTA.

### B · Discovery
4. **Events list** — search input, filter chips, event cards (cover + date/venue). **Loading** = shimmer cards; **Empty** = centered magnifier, "No events found", Clear filters.
5. **Search & filters** — app bar with inline search field, active filter chips (removable), results count, compact result rows.

### C · Event page (centerpiece)
6. **Event overview** — 230px photo hero with scrim; floating translucent back/save/share actions; category tag, H1 title, tagline; date/time + timezone row, venue row; organizer card with Follow; About (with Read more); "Who's attending" avatar cluster + count. Sticky bottom: bookmark + "Get ticket · from $25".
6b. **Overview (scrolled)** — schedule preview (mini rows, track dots), speakers rail (circular avatars), sponsors strip, "Make your card" secondary.
7. **In-event section nav** — sticky segmented nav (Schedule active), day segmented control, session cards; demonstrates the **More** bottom sheet listing Q&A / Polls / Leaderboard / Feedback.

### D · Registration & tickets
8. **Ticket selection** — radio ticket-type cards (selected has forest ring; remaining counts in success/warning; sold-out struck-through + dimmed), quantity stepper, dashed promo field, sticky summary + Continue.
9. **Registration form** — name/email(focus)/phone(**error** state + helper); divider; organizer custom fields (text, select, checkbox). Sticky Continue.
10. **Payment method** — radio processor cards (Card selected / Mobile money), order summary (line items, promo discount in success, total in mono), "Secured by …" note, "Pay $47.50".
11. **Confirmation / your ticket** — dark screen; success check, "You're in.", white ticket card with large QR, ticket type tag, attendee name, event, mono ticket ID; Add to calendar, gold "Make your card", "View my tickets".
12. **My tickets (wallet)** — Upcoming/Past segmented; ticket cards (cover, name, date, status pill Confirmed/Pending/Checked-in) with tear-off "Show QR" footer. Tickets tab active.
13. **Ticket detail** — framed big QR + mono ID, status pill; Event / Attendee / When rows; Calendar + Transfer actions.

### E · The card
14. **Pick a design** — large forest card preview (photo, name, title, event footer), thumbnail chooser (selected has forest ring), sticky "Personalize this design".
15. **Personalize** — mini **live preview** card; photo upload row (circle crop, Change); Display name (focus) / Title / Company fields; sticky "Generate card".
16. **Card ready** — dark screen; floating (hero-float) finished card; suggested share caption box with Copy; Save + gold Share; "Make another".

### F · Agenda & sessions
17. **Schedule** — day segmented nav, "My agenda" toggle, time-grouped session cards (track-colored left border, speaker avatars, add-to-agenda +/✓ button). **My agenda empty** variant = per-day empty state.
18. **Session detail** — track/room tags, title, time row, description, speaker row (chevron to profile), "Rate this session" star card; sticky add (+) + "Join live Q&A".

### G · Speakers & sponsors
19. **Speakers** — 2-col grid of speaker cards (square photo, name, role/company).
20. **Speaker detail** — tall photo hero with name/role scrim, social icon buttons, bio, "Sessions" list (track-colored cards).
21. **Sponsors** — grouped by tier (Headline / Gold / Community) with tier tags; headline = full card, gold = 2-col, community = logo chips.
22. **Sponsor / booth detail** — logo + name + tier, description, booth location card, Offerings tags, team avatars, sticky "Book a meeting".

### H · Live engagement
23. **Live Q&A** — "Live" tag, filter chips (Top/Recent/session), question cards (upvote triangle + count, text, asker/Anonymous + time), sticky "Ask a question". **Ask sheet** variant = textarea, anonymous toggle, session select, Post.
24. **Polls** — active poll card (Live now, vote buttons) + closed poll card ("You voted", live result bars with %, forest/gold fills).
25. **Leaderboard** — top-3 podium (gold crown on #1, ranked plinths), ranked rows below, **"You"** row highlighted in forest-soft.

### I · Networking
26. **People** — "Suggested for you" AI match card (gold border, match %, reason chip, Connect); "All attendees" rows with Connect / Pending / Connected button states.
27. **Requests** — Incoming/Sent segmented; request cards with message + Accept/Decline.
28. **Messages (inbox)** — thread rows (avatar, name, last message truncated, time, unread dot).
29. **Chat thread** — avatar app bar; bubbles (mine = forest right / theirs = surface left) with tails; composer input + forest send button.

### J · Feedback
30. **Feedback** — "How was …?", centered star rating, "What stood out?" multi-select chips, optional comment textarea, sticky Submit. **Thank-you** variant = success check state.

### K · Account
31. **Account hub** — avatar/name/email header; rows (My tickets, My cards, Saved events, Following, Notifications [badge], Profile & settings); danger "Sign out". Account tab active.
32. **Saved events** — bookmarked event cards with filled bookmark (tap to un-save).
33. **Following** — organizer rows with notify toggle + Following button.
34. **Notifications** — typed rows (icon tile per type: ticket/connect/reminder), title, body, time, unread dot; "Mark all".
35. **Profile & settings** — avatar with edit badge, name/city/phone fields, Interests chip multi-select, notification preference toggles.

### L · System states (reusable set)
36. **Loading** (skeleton matching layout), **Empty** (My cards example), **Error** (danger icon + Try again), **Offline** (dark banner + cached-tickets state), **Not signed in** (lock icon + Sign in gate), **Toast/snackbar** ("Added to your agenda · Undo").

## Interactions & Behavior
- **Tap feedback:** `transform: scale(0.98)` on `.mbtn:active`.
- **App nav:** bottom tabs switch app-level views; segmented section nav switches event views; back chevron pops.
- **Register flow:** Event overview → Ticket selection → Registration form → Payment → Confirmation (QR) → optional Make-a-card.
- **Add to agenda:** +/✓ toggle on session rows; fires the "Added to your agenda · Undo" toast.
- **Q&A:** upvote toggles count/active state; "Ask a question" opens the bottom sheet.
- **Polls:** tapping a vote option transitions the card into the live-results bar state.
- **Connect:** Connect → Pending → Connected button progression.
- **Validation:** inline error state (danger border + helper text), e.g. phone field on the registration form.
- **Loading:** skeletons that mirror the final layout, shimmer 1.4s linear infinite.
- **Card success:** finished card gently floats (`heroFloat` 4.5s).

## State Management
- Auth: signed-in vs guest (gates Tickets/Cards/Account → "Not signed in" state); OTP verification step.
- Selection: chosen ticket type + quantity + promo; selected card design; selected payment processor.
- Per-event engagement: my-agenda set, Q&A upvotes, poll votes, connection statuses.
- Wallet: ticket list with status (Confirmed/Pending/Checked-in), upcoming vs past.
- Account: saved events, followed organizers (+ notify flag), interests, notification prefs, unread notification/message counts.
- Data fetching: event details, schedule, speakers, sponsors, attendees, Q&A/polls (live), messages. Per the product owner, these map to **existing Supabase/API contracts** — reuse them.

## Design Tokens
All tokens are defined as CSS custom properties in **`karta.css`** (shared source of truth) and **`mobile.css`** (mobile primitives + phone frame). See the Colors, Typography, Shape & depth, and Spacing sections above for exact values. Key extras:
- `--rm-card:15px`, `--rm-btn:12px`, `--rm-sheet:20px`
- `--sh-soft`, `--sh-lift`, `--sh-ring` (see Shadows)
- Photo placeholder: `.ph` with `--h` hue (0–360) — swap for real images.

## Assets
- `eventera-logo.png` — forest + gold "Eventera" wordmark (343×70, transparent). Included.
- Icons — inline SVG (stroke-based, 1.7–2 stroke width), no icon-font dependency. Map to your codebase's icon set (Lucide/Phosphor-style equivalents).
- Fonts — DM Sans, Inter, JetBrains Mono via Google Fonts. Bundle or self-host in production.
- Photos / QR / card render — **placeholders**; source from backend.

## Files
In this bundle (`design_handoff_attendee_mobile_app/`):
- `Eventera Attendee App.html` — all 36 screens + variants on the canvas (main reference).
- `mobile.css` — mobile component primitives + phone-frame chrome.
- `karta.css` — brand tokens, type scale, buttons, photo-placeholder system (shared source of truth).
- `eventera-logo.png` — wordmark asset.
- `README.md` — this document.

To view: open `Eventera Attendee App.html` in a browser; pan/scroll the canvas to move between flow rows A–L.
