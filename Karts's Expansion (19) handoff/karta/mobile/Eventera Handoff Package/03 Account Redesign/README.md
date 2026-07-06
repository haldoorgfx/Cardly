# Handoff: Eventera — Account Redesign

## Overview
A redesign of the **attendee Account area** in the Eventera mobile app. Replaces the previous sparse account screens with a real profile header (avatar, stats), colored icon-tile menus grouped by purpose, richer Following / Saved / Notifications, and a settings screen where interests wrap as chips instead of full-width stacked bars.

This bundle is a **visual spec**, not production code. Rebuild in the target codebase (existing Flutter app per the product owner), reusing existing Supabase/API data contracts — visual change only.

## Fidelity
**High-fidelity.** Colors, type, spacing, radii, shadows, states are final. Placeholders to replace with real data:
- **Avatar** — initial-on-forest fallback (gold letter). Use real photo when set.
- **Photos** — `.ph` mesh-gradient placeholders (saved-event covers, organizer avatars). Use real imagery.
- **Counts / stats / lists** — sample values. Bind to real data.

## Brand tokens (exact)
Full palette/type/shape in `karta.css`. Key values:
- **forest** `#1F4D3A`, **forest-dark** `#0D1F17`, **forest-soft** `#E8EFEB`
- **gold** `#E8C57E` / **gold-hover** `#C9A45E` / **gold-soft** `#F5E9CC` (sparingly)
- **cream-canvas** `#FAF6EE` (bg, NOT white), **cream-surface** `#FFFFFF`, **cream-soft** `#F0EDE8`, **cream-border** `#E5E0D4`
- **ink** `#0F1F18` / **ink-soft** `#3A4A42` / **ink-muted** `#6B7A72`
- **success** `#2D7A4F`, **warning** `#C97A2D`, **info** `#3A6B8C`, **danger** `#B8423C`
- Type: DM Sans (display/headings, −0.02em), Inter (body/UI), JetBrains Mono (dates, counts, version)
- Radius: profile header 18, cards 15, buttons/inputs 12, icon tiles 11, pills 999. Screen padding 20.
- Shadows: `--sh-soft`, `--sh-lift`, `--sh-ring` (in mobile.css).

## New reusable components (in mobile.css)
- **`.menu`** — grouped card of rows; each `.mrow` = icon tile + `.mt` (title `.t` + optional subtitle `.d`) + optional `.count` (mono) or tag + `.chev`. Hairline dividers between rows.
- **`.itile` + `.itile-{forest|gold|info|success|danger|muted}`** — 40px rounded icon tile with a soft-tint background per semantic color. Used in menus and notification rows.
- **`.grouplab`** — uppercase mono-spaced section label above a menu/card.
- **Stat strip** — inside the profile header: 3 equal cells (number in forest DM Sans + muted label), divided by hairlines.
- Reuses existing `.chip` / `.chip.on` (interests), `.tgl` (toggles), `.av` (avatars), `.mbtn` (buttons), `.tag-*` (badges).

## Screens

### Row 1 · Account hub
- **Signed in** — profile header card: forest-gradient top (gold-ringed avatar, name, email, edit affordance) over a white stat strip (Tickets / Cards / Connections). Below: **"My stuff"** menu (My tickets w/ count, My cards, Saved events, Following) and **"Preferences"** menu (Notifications w/ unread badge, Profile & settings, Help & support). Sign out is a quiet danger-tinted secondary button at the bottom + app version line. Account tab active.
- **Guest** — gradient invite card ("browsing as a guest") with gold "Sign in or create account" CTA; explore rows show "Sign in to view".

### Row 1 · Saved events
- Cover-image event cards (120px) with bottom scrim, category tag (top-left), and a filled bookmark toggle in a blurred circle (top-right, tap to un-save); title + mono date row below.

### Row 2 · Following
- **"Following"** menu (followed organizers: avatar, name, "New-event alerts on" subtitle, notify toggle) + **"Suggested organizers"** menu (avatar, name, events/category, Follow button — first is filled forest, rest are soft). Keeps the screen useful when the user follows few.

### Row 2 · Notifications
- Grouped by recency: **"New"** (unread, forest-soft highlighted rows with unread dot) and **"Earlier"** (plain). Each row = typed colored icon tile (registration = success/person, import = forest/ticket), bold title, muted detail (email / duplicates), mono date.
- **Empty** — "You're all caught up" bell state.

### Row 3 · Profile & settings
- **Top** — centered avatar with edit badge + email; **"Personal details"** card (Full name, City w/ pin icon, Phone w/ phone icon); **"Interests"** card where options **wrap as `.chip`s** (selected = forest fill) with a dashed "＋ Add" chip. Sticky "Save changes".
- **Scrolled** — **"Notifications"** card (labeled toggles w/ descriptions: Event reminders, Agenda changes, New events from organizers, Recommended events) + **"Account"** menu (Change email, Language & region w/ value, Delete account in danger). Sticky "Save changes".

## Interactions & behavior
- Menu rows navigate; counts/badges reflect live data (unread notifications, upcoming tickets, saved count, following count).
- Saved bookmark toggles un-save (removes card). Following toggle controls new-event alerts; Follow button progresses to Following.
- Notifications: "Mark all" clears unread; tapping a row deep-links (to the event/registration). Unread = forest-soft bg + dot.
- Interests: tap chip to toggle; "＋ Add" opens an input to add a custom interest.
- Settings toggles persist immediately or on "Save changes" (match existing app behavior). Delete account → confirm destructive flow.
- Guest: any gated row → sign-in.

## State
Auth: signed-in vs guest. Profile: name, city, phone, avatar, email, interests[]. Counts: tickets (upcoming/past), cards, connections, saved, following, unread notifications. Notification prefs: reminders, agenda changes, followed-organizer events, recommended. Per the product owner these map to existing Supabase/API contracts — reuse them.

## Files
In `design_handoff_account_redesign/`:
- `Eventera Account Redesign.html` — all account screens (main reference)
- `mobile.css` — mobile primitives + new menu/icon-tile/stat components
- `karta.css` — brand tokens (source of truth)
- `eventera-logo.png` — wordmark
- `README.md` — this doc

Icons are inline stroke SVG (1.7–2 width) — map to your icon set. Fonts via Google Fonts (bundle/self-host in prod). To view: open the HTML and pan the canvas across rows 1–3.
