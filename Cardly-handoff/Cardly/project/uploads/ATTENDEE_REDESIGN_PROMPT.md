# CARDLY — ATTENDEE EXPERIENCE REDESIGN PROMPT

**Paste this into a fresh claude.ai/design session.**

---

```
# CARDLY — ATTENDEE EXPERIENCE REDESIGN

## CONTEXT

Cardly is a live SaaS at cardly-two.vercel.app. Designers and event organizers upload a branded card design, define editable zones (name, photo, role, etc.), and share a public link. Attendees open the link on their phone, personalize the card, and download a PNG to share on social media.

The DESIGNER side works well. The ATTENDEE side is what we're redesigning.

I've audited the current code. The attendee experience has a mix of working patterns and real problems. This prompt is built from that audit — not guesses. Build to fix the specific gaps below.

---

## WHAT'S CURRENTLY THERE (the audit)

Working today:
- Live preview that updates as the attendee types
- Mobile-locked 375px layout
- Sticky CTA at bottom with backdrop blur
- Photo upload with empty-state placeholder
- Loading spinner on generate
- Two share buttons after generation (WhatsApp, X)
- Validation just checks if required fields are filled (no inline errors, just disabled button)

Currently broken / missing:
- The whole thing uses an OLD dark-purple-pink brand instead of our forest-cream system
- There's no arrival/intro screen — attendees drop straight into a form with no context
- No event branding at the top (organizer's logo / event name is generic)
- No photo crop tool (selfies appear stretched or off-center)
- No inline validation errors (button silently stays disabled, attendee doesn't know why)
- Layout is locked at 375px even on desktop — wastes the screen on laptops/tablets
- Success state has only 2 share buttons (need Instagram, Facebook, LinkedIn, Copy link)
- The card preview doesn't feel like a "magic moment" — it's just one element in a stack
- No caption-copy helper for sharing

---

## WHO THE ATTENDEE IS (design for this exact person)

- 22–45 years old
- On their phone (iOS Safari or Android Chrome), mobile data
- Likely in Africa, the Middle East, or the diaspora
- Just got a WhatsApp message with the link from a colleague, friend, organizer
- Has ~90 seconds of attention
- Wants to make the card, share it to WhatsApp Status or Instagram Story, feel proud
- Not a designer. Uses Instagram, WhatsApp, TikTok — not Canva
- Has zero patience for forms with unclear errors

---

## THE MAGIC MOMENT (everything serves this)

The whole flow exists for ONE moment: the attendee sees their face and name on a beautifully-branded card and thinks **"oh wow — I want to share this NOW."**

If a design choice doesn't make that moment land harder → cut it.

---

## BRAND SYSTEM (LOCKED — APPLY EVERYWHERE)

**Colors — use these tokens, no others**
- Primary: `#1F4D3A` (forest green) — primary brand, all main CTAs
- Primary dark: `#163828` — hover states
- Primary soft: `#E8EFEB` — tinted backgrounds, hover rows
- Accent: `#E8C57E` (warm cream-gold) — sparingly, premium CTAs, success highlights
- Accent dark: `#C9A45E`
- Ink: `#0F1F18` — primary text
- Ink soft: `#3A4A42` — secondary text
- Muted: `#6B7A72` — captions, metadata, placeholders
- Cream: `#FAF6EE` — APP BACKGROUND (not pure white)
- Surface: `#FFFFFF` — cards, modals, inputs sit on cream
- Border: `#E5E0D4` — warm beige, NOT cool grey
- Border strong: `#C9C3B1`
- Success: `#2D7A4F`
- Danger: `#B8423C`

**Hero gradient (use only on premium moments — sparingly)**
`linear-gradient(135deg, #1F4D3A 0%, #2A6A50 60%, #E8C57E 100%)`

**Typography (locked)**
- Display: DM Sans, weight 700, letter-spacing -0.02em — headlines only
- Sans: Inter, weights 400/500/600 — body, UI, labels
- Mono: JetBrains Mono — small labels and metadata only

**Type scale**
- Display L: 36px / 1.1
- Display M: 28px / 1.15
- H1: 24px / 1.2
- Body L: 18px / 1.55
- Body: 16px / 1.6
- Body S: 14px / 1.5
- Caption: 12px / 1.4 (use muted color)

**Shadows**
- soft: `0 1px 2px rgba(15,31,24,0.04), 0 8px 24px rgba(15,31,24,0.06)`
- lift: `0 4px 12px rgba(15,31,24,0.08), 0 24px 60px rgba(31,77,58,0.12)`
- focus: `0 0 0 3px rgba(31,77,58,0.15)`

**Tone:** editorial, African-modern, calm, premium. NOT corporate. NOT loud. NOT playful-cartoonish. NOT generic SaaS.

---

## CRITICAL CONSTRAINTS (NON-NEGOTIABLE)

1. **MOBILE-FIRST at 375px.** Design every screen for iPhone SE width first. Then add `sm:` (≥640px) and `lg:` (≥1024px) variants where layout should expand.
2. **No login.** Attendees never sign up. Public link, public access.
3. **Tap targets ≥48px.** One-thumb operable. No tiny buttons.
4. **No text smaller than 14px.** Body 16px minimum. Buttons 16px+.
5. **The card preview is the hero** on every screen it appears. Make it large, make it beautiful.
6. **Cream backgrounds, not white.** White is for surfaces sitting ON cream (cards, modals, inputs).
7. **Warm beige borders, not grey.** Use `#E5E0D4`.
8. **Lucide icons only.** No emoji-as-icons. No stock icon sets.
9. **No bouncy / spring / playful animations.** Calm transitions only: 200–300ms ease-out.

---

## RESPONSIVE STRATEGY

Build a single component that adapts:

- **375px – 639px (mobile):** single column. Card preview at top, form below, sticky CTA at bottom.
- **640px – 1023px (tablet):** single column still, but max width 500px centered. More breathing room.
- **1024px+ (desktop):** two-column. Card preview LEFT (60%), form/CTAs RIGHT (40%). Both vertically centered. Max content width 1200px.

The desktop layout must NOT feel like a "stretched mobile" — it should feel native to a wide screen.

---

## SCREENS TO DESIGN (build all six, in order)

### SCREEN 1 — ARRIVAL (E0)

**Purpose:** First impression. Reduce bounce. Give the attendee context before any form.

**Required elements:**
- Top strip: event organizer logo (if present) + event name + dates + location
  - Layout: logo on left, event info on right
  - Background: surface white sitting on cream
- The card design preview, LARGE, centered, with realistic placeholder data ("Your Name" + photo placeholder showing a Lucide `User` icon in a circle/square per zone shape)
- Headline: "Get your personalized card" (Display M, ink)
- Subhead: "Add your name and photo. Download in seconds. Share anywhere." (Body, ink-soft)
- Primary CTA: "Create my card" — full-width on mobile, forest green, with arrow icon
- Trust line: "Free. No signup. Takes 30 seconds." (Caption, muted)
- "Powered by Cardly" footer (mono, 11px, muted)

**Design direction:**
- Card preview floats with a 4-second translateY animation (3px up and back) — feels alive
- Background: cream with one subtle decorative shape (primary-soft circle, blurred, positioned behind the card)
- CTA: solid forest green, white text, lift shadow on hover

**Why this screen exists:** the current product drops attendees into a cold form. This intro adds 4 seconds of context and increases completion rate.

---

### SCREEN 2 — DETAILS FORM (E1)

**Purpose:** Collect attendee info with zero friction.

**Required elements:**

Top section:
- Smaller event-branding strip (logo, name) — secondary, not hero
- The LIVE card preview directly below — still large (60% of viewport on mobile)
- Preview updates within 100ms as the attendee types

Form section (below preview):
- One field per row, stacked vertically
- Label above input: 12px mono, ink-soft, lowercase, no colon
- Required fields: small asterisk in primary color after label
- Input style: `bg-surface (white)`, `border-border (warm beige)`, `rounded-xl`, 56px height, 16px padding
- Focus state: `border-primary`, soft green ring (use shadow-focus)
- Error state: `border-danger`, inline error message below in danger color (14px) with `AlertCircle` icon

Field types to design:
- Single-line text
- Multi-line text (auto-resizes 80px → 120px)
- Dropdown (designer-defined options, native `<select>` for mobile)
- Email (with format hint and validation)
- Photo upload (see Screen 3 for crop flow)

Photo upload field:
- Empty state: large tap zone, dashed border-border, ImageIcon centered, "Tap to add photo" label
- Filled state: shows the cropped photo thumbnail (40px circle/shape), "Change photo" link
- Tap → opens device file picker → on file selected → opens crop modal (Screen 3)

CTA section (sticky bottom on mobile, inline on desktop):
- Primary: "Preview my card" — full-width on mobile, forest green, 56px tall
- Disabled state: bg-primary-soft, text-muted
- When invalid required fields exist: button stays enabled, tapping it scrolls to first error and triggers shake animation on error field (150ms, 4px horizontal)

**Design direction:**
- The preview pulls the eye up, the form is workmanlike below
- Spacing: 16px between fields, 24px between sections
- Field grouping: if event has many fields, visually group related ones (e.g., "About you" group with name/title, "Your photo" group)

---

### SCREEN 3 — PHOTO CROP MODAL (E1.5)

**Purpose:** Make sure the attendee's photo fits the designed shape beautifully.

**Required elements:**
- Full-screen modal on mobile, centered 600px-wide dialog on desktop
- Background: ink at 80% opacity
- Modal content: surface white, rounded-2xl
- Title: "Position your photo" (Display M)
- The uploaded photo displayed with a crop frame matching the zone shape (circle / square / rounded square / hexagon)
- Photo can be dragged to reposition, pinched to zoom on mobile
- Zoom slider: 1x to 3x, primary color thumb
- Helper text below crop area: "Drag to position. Pinch or use slider to zoom."
- Two buttons at bottom:
  - SECONDARY: "Re-upload" — white bg, ink text, border-border
  - PRIMARY: "Use this photo" — forest green
- Close (X) icon top-right

**Design direction:**
- Frame border: 2px solid cream
- Dimmed overlay outside the crop frame
- Smooth pan/zoom interaction
- On confirm → modal closes → photo appears in the form (Screen 2) AND in the live preview

---

### SCREEN 4 — PREVIEW & DOWNLOAD (E2)

**Purpose:** The magic moment. The "I want to share this" reaction.

**Required elements:**

Hero section:
- The fully-rendered card preview — MASSIVE — fills 85% of viewport width on mobile
- Subtle background: hero-gradient at 8% opacity, contained behind the card
- Soft "sparkle" particles around the card for 2 seconds when the page loads, then settle
- Above card: "Looks great." (Display L, ink) + "Your card is ready" (Body L, ink-soft)

CTA section directly below card:
- PRIMARY: "Download" — full-width forest green, with Lucide `Download` icon
- On tap: triggers PNG download AND shows a toast "Saved to your photos"
- After 1 second, auto-transitions to Screen 5 (success/share)
- SECONDARY: "Edit my info" — text link below, ink-soft, no border

Below CTA — inline share preview:
- Label: "Or share directly:" (Caption, muted)
- Row of 6 platform icons (Lucide where possible; brand SVGs for WhatsApp/Instagram/X/Facebook/LinkedIn): WhatsApp, Instagram, X, Facebook, LinkedIn, Copy Link
- Each icon: 48px tap target, surface white circle, platform-brand icon inside, soft shadow
- Tapping any: triggers Web Share API on mobile, or copies a pre-filled message

**Design direction:**
- This is THE screen of the whole product. Give it space.
- Card preview gets the largest visual weight
- Subtle, slow load-in animation: card scales from 0.96 to 1.00 + fades in over 400ms
- Use the hero-gradient sparingly behind the card as a soft halo

---

### SCREEN 5 — SUCCESS / VIRAL SHARE (E3)

**Purpose:** Push the share. Most won't share unless prompted.

**Required elements:**

Top section:
- Success badge: forest-green circle with cream-gold checkmark icon
- Headline: "Card saved" (Display M, ink)
- Subhead: "Now share it where your audience hangs out" (Body, ink-soft)
- Smaller version of the card (40% of viewport) — visible but not hero anymore

Caption helper card:
- A tappable card (surface white, border-border, rounded-2xl, padding 16px)
- Caption text inside, editable on tap: "Excited to be at [Event Name] — join me 🎉"
- Below the text: small "Tap to edit" hint (muted) + Lucide `Copy` button
- When copied: button briefly shows "Copied!" with success color

Primary share section:
- Headline: "Share where it matters" (H1, ink)
- Three big share buttons, full-width, stacked:
  - **Instagram Stories** — surface white with brand gradient border, Instagram icon, "Open in Instagram"
  - **WhatsApp Status** — surface white with brand green border, WhatsApp icon, "Send on WhatsApp"
  - **X / Twitter** — surface white with brand black border, X icon, "Post on X"
- Each button is 64px tall, with the platform's brand color as the icon and accent

Secondary share row (smaller, horizontal):
- Facebook, LinkedIn, TikTok (if applicable), Copy Link
- 40px circular buttons

Bottom prompt:
- Surface white card with primary-soft tint
- "Know someone else attending? [Forward the link]" — invite to spread the link

Footer:
- "Powered by Cardly" — mono, muted

**Design direction:**
- This screen is the viral loop. Every element should feel like sharing is the obvious next step.
- Background: cream with very soft hero-gradient wash at 5% opacity at the top
- Use accent (gold) for the success badge to give a "earned" feeling

---

### SCREEN 6 — STATES & EDGE CASES

Design these for any/all screens above:

**Loading state**
- Skeleton shimmer in primary-soft for any element that loads (card preview, share buttons)
- Subtle pulsing animation, no spinners (except inside CTA buttons during async actions)

**Network error**
- Centered card, surface white
- Abstract geometric shape (circle in primary-soft with a small line through it — DON'T use stock illustrations)
- Headline: "Connection trouble" (Display M)
- Body: "Check your internet and try again." (Body)
- Retry CTA: "Try again" — forest green, full-width

**Photo upload failed**
- Inline error on the photo field
- Danger color border + Lucide `AlertCircle` icon + message: "Couldn't upload that photo. Try a smaller file (under 10MB)."

**Field validation error**
- Inline under each field
- Danger color, 14px, with `AlertCircle` icon
- Specific messages:
  - "Name is required"
  - "Please enter a valid email"
  - "Photo is required"

**Event expired / unpublished**
- Card preview area replaced with centered message
- Surface white card with calm illustration (geometric, not stock)
- Headline: "This event is no longer accepting cards"
- Body: "The organizer has closed registration. Contact them if you need help."
- No CTAs — this is a dead-end state

**Already submitted (optional, future)**
- "You've already created a card for this event"
- Show the previously generated card
- Download button + share row

---

## INTERACTION & MOTION SYSTEM

- Page transitions: 250ms ease-out fade + 8px slide up
- Button press: 100ms scale-down to 0.97 then back (tactile)
- Input focus: border-color + ring fade in over 200ms
- Card preview live update: text fades in over 100ms (no jarring snap)
- Success checkmark: draws stroke over 400ms
- Photo loading into preview: cross-fade over 200ms
- NO bouncy spring physics. NO confetti explosions. NO "playful" overdone moments.
- The mood is "calm, polished, premium" — like Stripe Checkout or Linear.

---

## ACCESSIBILITY (must follow)

- All interactive elements have visible focus states (the green focus ring)
- Color contrast meets WCAG AA: ink on cream/white, ink-soft for secondary text
- Form labels are programmatically associated with inputs
- Errors are announced (use aria-live="polite" on inline errors)
- All buttons have descriptive labels (not just icons)
- Lang attribute matches event language (default "en")

---

## OUTPUT FORMAT

For each screen:
1. A complete responsive React + Tailwind component
2. Mobile-first, with `sm:` and `lg:` breakpoints
3. Use shadcn/ui primitives where they exist (Button, Input, Dialog, Toast)
4. Lucide-react icons only
5. Use the brand tokens from the Brand System section above as Tailwind classes (assume the dev will configure Tailwind config to expose `bg-primary`, `text-ink`, `bg-cream`, etc.)
6. Realistic placeholder content:
   - Event names: "Pan-African Climate Summit 2026", "Africa Tech Festival '26", "5th Pan-African Youth Forum", "Global Halal Summit"
   - Attendee names: Aisha Ahmed, Kwame Mensah, Lerato Mbeki, Tariq El-Sayed, Adaeze Okonkwo
   - Locations: Nairobi, Accra, Lagos, Djibouti, Addis Ababa
7. Inline `{/* TODO: API call here */}` comments where backend logic plugs in
8. One artifact per screen

---

## BUILD ORDER

Build screens in this exact order. Wait for my approval after each before continuing.

1. Screen 1 — Arrival (E0)
2. Screen 2 — Details Form (E1)
3. Screen 3 — Photo Crop Modal (E1.5)
4. Screen 4 — Preview & Download (E2)
5. Screen 5 — Success / Viral Share (E3)
6. Screen 6 — States & Edge Cases (E6)

---

## START WITH SCREEN 1

Build Screen 1 (Arrival) first as a complete responsive React + Tailwind component.

Use this realistic event for the mockup:
- Event name: "5th Pan-African Youth Forum"
- Event dates: "4–6 November 2025"
- Location: "Ayla Hôtel Djibouti"
- Organizer logo: African Union (use placeholder text "AU" in a circle)
- Card design background: imagine a green-themed event card with the organizer's branding
- The card has 3 editable zones: name (text), photo (circle, top-right), title (text below name)

Show me Screen 1 in mobile (375px), tablet (640px), and desktop (1024px) variants. After I approve, build Screen 2.

Do NOT skip ahead. Do NOT combine screens into one artifact. Each screen is its own artifact.
```

---

## How to use this

1. **Open a fresh** claude.ai/design session
2. **Paste the entire prompt above** (everything between the triple backticks) as your first message
3. **Wait for Screen 1** to render. Review it CRITICALLY:
   - Does it use forest green (not purple)?
   - Does it use cream background (not pure white, not dark)?
   - Does the card feel hero-sized?
   - Does it look calm and editorial (not playful or corporate)?
4. **If yes → approve and move to Screen 2.** If no → say specifically what's off and ask for a revision.
5. **Continue through all 6 screens.** Don't rush. This is the work that matters.
6. **When done → export the HTML/JSX.** Send it to me. I'll write the Claude Code handoff prompt to implement it.

## What this prompt fixes vs the current code

| Current code | New design |
|---|---|
| Dark purple-pink theme | Forest green + cream |
| Drops into form | Has arrival screen |
| Generic header | Event branding strip |
| No photo crop | Crop modal with positioning |
| Disabled button, no errors | Inline validation with specifics |
| Mobile-locked at 375px | Responsive: mobile + tablet + desktop |
| 2 share buttons | 6+ share platforms with caption helper |
| Card preview just there | Card preview as hero with motion |
| Success is okay | Success is the viral moment |

## After Claude Design ships all 6 screens

Tomorrow (not tonight), bring me the export. I'll write the Claude Code handoff prompt that:
1. Updates `tailwind.config.ts` to the new brand tokens
2. Replaces `globals.css` gradient/colors
3. Replaces `AttendeeClient.tsx` with the new design implementation
4. Adds the crop modal (`react-easy-crop`)
5. Wires up the new share platforms (Web Share API + platform-specific intents)

Then we deploy and TEST on your actual phone. That's the real finish line.
