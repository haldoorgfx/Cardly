# CARDLY — LANDING PAGE & MARKETING SITE REDESIGN PROMPT FOR CLAUDE DESIGN

**A comprehensive redesign of the public marketing pages. Modern, conversion-focused, market-aligned. Broader positioning without losing specificity. Forest+cream brand throughout.**

**Run this in Claude Design AFTER the editor handoff is merged and shipped to production.**

---

## How to use this prompt

1. Open a fresh `claude.ai/design` session
2. Paste the prompt below (everything between the triple backticks)
3. Build pages one at a time, in order — wait for approval after each
4. Export when done, bring back here for the Claude Code handoff

---

## PASTE THIS INTO CLAUDE DESIGN

```
# CARDLY — LANDING PAGE & MARKETING SITE REDESIGN

## CONTEXT

Cardly is a live SaaS at cardly-two.vercel.app. The core product is already built and shipped: designers/organizers upload a branded design, define editable zones (name, photo, role), and share a public link. Attendees personalize the card on their phone, download a PNG, and share to social media. Both the designer editor AND the attendee experience are already polished with a forest+cream design system.

What's NOT yet polished is the marketing surface — the public landing page, pricing page, and adjacent marketing pages that potential customers see BEFORE signing up. They need a real upgrade.

This is a marketing redesign, NOT a product redesign. We're NOT changing the editor or attendee experience. We're rebuilding the surfaces that convince people to try the product.

---

## POSITIONING (CRITICAL — READ TWICE)

### Who Cardly is for (the BROADER category)
Cardly is for anyone running a CAMPAIGN that needs attendees, supporters, speakers, or community members to share personalized branded content.

That includes:
- Event organizers (conferences, summits, festivals, forums)
- NGO and nonprofit campaigns (awareness drives, fundraising)
- Political campaigns (rallies, endorsements, voter mobilization)
- Religious organizations (events, programs, community drives)
- Brand activations (product launches, store openings, sponsorships)
- Educational institutions (graduations, alumni events, scholarship campaigns)
- Corporate communications (town halls, internal launches, employee advocacy)
- Conference speakers and creators (announcing they're speaking)

The thread connecting all of these: each campaign needs many individual people to share something on their own social media that's both branded (so it looks professional) and personal (so it looks authentic).

### What Cardly is NOT
Don't position Cardly as:
- A general design tool (we're not Canva)
- A photo editor (we're not VSCO)
- A social media scheduler (we're not Buffer)
- A "one-stop platform for all your marketing needs" (vague death-language)
- A platform for "all kinds of campaigns" — say WHAT KIND specifically

### The positioning statement (use this exact framing)
"Cardly is how organizers turn one design into thousands of personalized shareable cards — so every attendee, supporter, or speaker gets their own branded moment to share."

That's the spine. Everything else on the marketing site should ladder up to this.

---

## WHO THE TARGET VISITOR IS

A specific person opens cardly.app:
- An event coordinator at a conference, NGO, brand, or political organization
- 28–48 years old
- Has been asked to "increase social media buzz" for an upcoming campaign or event
- Has tried: posting templates in WhatsApp groups (low engagement), making attendees a Canva template (most people never open it), hiring a designer for 200 individual cards (doesn't scale), buying GetDP/Premagic/CrowdCard (sometimes works, often clunky, not African-friendly)
- Has 10 minutes of attention max before they bounce
- Lives in or operates in Africa, the Middle East, South Asia, or globally with Africa-first audiences
- Cares about brand consistency, not template choice
- Will sign up if you show them the magic in 30 seconds

The whole site exists to take this person from "I just clicked the link" to "I'm trying it now" in under 60 seconds.

---

## BRAND SYSTEM (LOCKED — SAME AS THE PRODUCT)

**Colors**
- Primary: #1F4D3A (forest green)
- Primary dark: #163828
- Primary soft: #E8EFEB
- Accent: #E8C57E (cream-gold) — used sparingly for premium moments
- Accent dark: #C9A45E
- Ink: #0F1F18 (text)
- Ink soft: #3A4A42 (secondary text)
- Muted: #6B7A72 (captions)
- Cream: #FAF6EE (page background)
- Surface: #FFFFFF (cards sitting on cream)
- Border: #E5E0D4 (warm beige)
- Success: #2D7A4F
- Danger: #B8423C

**Hero gradient (use sparingly — for premium moments, not everywhere)**
linear-gradient(135deg, #1F4D3A 0%, #2A6A50 60%, #E8C57E 100%)

**Typography**
- Display: DM Sans 700, letter-spacing -0.02em (headlines)
- Sans: Inter 400/500/600 (body, UI)
- Mono: JetBrains Mono (labels, metadata, small caps)

**Mood**
Editorial. African-modern. Calm-premium. Confident. NOT corporate SaaS. NOT playful illustration-heavy. NOT generic startup landing page.

Think: Stripe Sessions, Linear homepage, Notion storytelling — but warmer, with African design sensibility (more cream and gold, less stark).

---

## DESIGN PRINCIPLES

1. **SHOW THE PRODUCT EARLY.** A real card preview should be visible above the fold. Don't make visitors scroll to see what Cardly actually does.

2. **REAL EXAMPLES, NOT MOCKUPS.** Every card preview shown anywhere on the site should look like a real event card with realistic content (real African event names, real names like Aisha Ahmed / Kwame Mensah, real venues like Ayla Hôtel Djibouti).

3. **MULTIPLE USE CASES VISIBLE.** Show 4-6 different campaign types in one section so the visitor immediately recognizes their use case. Don't try to be everything — show breadth as proof of category fit.

4. **NUMBERS GROUND CLAIMS.** Where possible, replace adjectives with numbers. Not "fast" → "in under 30 seconds." Not "loved by organizers" → "Used at 12 events across 8 countries." If you don't have numbers yet, leave placeholders like "[247] cards generated this week."

5. **MOBILE-FIRST EVERYTHING.** Most decision-makers will open the link on their phone first. The site must look great on a 375px screen, then scale up.

6. **PROOF OVER PROMISES.** Show actual card examples, actual attendee flow screenshots, actual editor screenshots. Don't say "intuitive" — show it.

7. **NO BUZZWORDS.** Banned: synergy, leverage, ecosystem, holistic, seamless, robust, cutting-edge, revolutionary, game-changing, "AI-powered" (you're not), "enterprise-grade" (you're not yet), "10x." Use plain language.

8. **CALM CONFIDENCE.** The site should feel like the founder knows exactly who this is for and isn't trying to convince everyone.

---

## RESPONSIVE STRATEGY

- Mobile-first 375px: single column, hero card stacked above text
- Tablet 640–1023px: generous padding, single column with wider content
- Desktop ≥1024px: multi-column hero, multi-column use cases, max content width 1280px

---

## PAGES TO DESIGN (IN ORDER)

1. L1 — Landing Page (home page at /)
2. L2 — Use Cases Page (/use-cases)
3. L3 — Pricing Page (/pricing)
4. L4 — How It Works Page (/how-it-works)
5. L5 — About / Story Page (/about)
6. L6 — Mobile Nav & Footer (shared)

---

## L1 — LANDING PAGE (DETAILED — 13 SECTIONS)

Design this as ONE long scrollable page with these sections in exact order:

### SECTION 1: Top navigation
- Logo (Cardly wordmark, forest green, DM Sans bold)
- Center nav links (desktop): Use Cases · How It Works · Pricing
- Right: "Sign in" + "Start free" (primary CTA, forest green button)
- Mobile: hamburger menu
- Background: cream, subtle bottom shadow on scroll

### SECTION 2: Hero
The most important real estate on the site.

Layout: Two-column on desktop (text LEFT 50%, card preview RIGHT 50%). Single column on mobile (text TOP, card preview BOTTOM).

Left column:
- Mono label: "FOR EVENT TEAMS, BRANDS & CAMPAIGNS"
- Headline (Display L, ~48-56px desktop / 36px mobile):
  "Every supporter. Every speaker. Every attendee. Their own branded card."
- Subhead (Body L, ~20px, ink-soft):
  "Cardly turns one design into thousands of personalized shareable cards. Your audience adds their name and photo on their phone — and shares it everywhere."
- Primary CTA: "Start free →"
- Secondary CTA: "See how it works →"
- Trust bar: "Free for up to 50 cards · No credit card · Works on every phone"

Right column:
- LARGE hero card preview, tilted 3deg, soft lift shadow
- Real African-themed event card with: African Union YOUTH PROGRAMME mono caps + "5th Pan-African Youth Forum" in white display + "I'M ATTENDING" badge + Aisha Ahmed / Climate Policy Lead + 4-6 NOV 2025 / DJIBOUTI
- Behind: subtle hero-gradient halo at 12% opacity
- Floating cards 2 and 3 (smaller, fading) with different names suggesting "every supporter has their own"

Background: cream + 2-3 large soft circles in primary-soft, blurred, behind content

### SECTION 3: Social proof strip
- Mono caption: "USED FOR CAMPAIGNS BY"
- Logos in horizontal row, desaturated to ink-soft
- 6 logos desktop, 3 visible mobile
- Cream background

If no real logos: monogram circles like "AU", "UNDP" etc.

### SECTION 4: The problem (named honestly)
Layout: centered, one column, max width 720px

- Mono caption: "THE PROBLEM"
- Headline (Display M): "You need every attendee to share. They never do."
- Body (Body L, ink-soft):
  "You spend months planning a campaign. You design beautiful brand assets. Then the day comes — and your attendees post about it however they want, if they post at all. The brand inconsistency is real. The reach is half what it could be. The 'social media kit' you sent in WhatsApp? Half-opened, mostly ignored."

Below: visual showing chaos — 4 mismatched fake social posts with frustrated captions like "branding chaos," "wrong colors," "low quality," "off-brand."

### SECTION 5: The solution (Cardly, named simply)
Layout: two-column on desktop, single column mobile

Left:
- Mono: "THE FIX"
- Headline (Display M): "One design. Thousands of personalized versions. Zero designer hours."
- Body: "Upload your campaign design once. Mark which parts should be filled in by attendees — name, photo, role, whatever you need. Share the link. Watch your audience generate their own branded share cards, on their phones, in under 30 seconds."

Right:
- 3-step visual: "Design → Publish → Attendees share"
- Each step: icon (PencilRuler, Send, Share2) + one-sentence description
- Connected by subtle arrow lines in primary

### SECTION 6: Use case grid (KEY SECTION)
6 use-case cards in responsive grid (2x3 desktop, 1x6 mobile)

Each card:
- Icon in primary-soft circle
- Category label (mono uppercase 10px, primary)
- Headline (H2, ink)
- One-line description (Body, ink-soft)
- Mini card preview on the right
- "See example →" link in primary

Six use cases:

1. CONFERENCES — "Conference attendees and speakers" — "Every speaker, sponsor, and attendee gets their own branded variant of your event card."

2. NGOs — "Awareness and fundraising campaigns" — "Your supporters announce they're backing your cause — branded to your campaign."

3. POLITICAL CAMPAIGNS — "Endorsement and rally cards" — "Volunteers, endorsers, and supporters generate cards that look professional and personal at once."

4. RELIGIOUS ORGANIZATIONS — "Event registration and community drives" — "Members announce attendance at your conference, fast, or fundraiser."

5. BRAND ACTIVATIONS — "Product launches and store openings" — "Your customers and partners share branded launch announcements that drive real reach."

6. EDUCATIONAL INSTITUTIONS — "Graduations, alumni, and scholarship campaigns" — "Graduates, alumni, and scholarship recipients each get their own moment to share."

Visual treatment:
- Surface white, border-border, rounded-2xl
- Hover: lift shadow + primary border color

### SECTION 7: How it works (3-step walkthrough)
Alternating left/right rows, each with screenshot + text

Step 1: "Upload your design"
- Editor screenshot
- "Drop in any design from Canva, Figma, Illustrator — any PNG or JPG works."
- Caption: "Works at any aspect ratio."

Step 2: "Mark editable zones"
- Editor screenshot showing zones placed
- "Click to add text fields, photo zones, dropdowns, and custom fields where you want attendees to personalize. Different roles? Add variants — Attendee, Speaker, Sponsor."

Step 3: "Share the link"
- Phone screenshot of attendee page
- "Send one link via WhatsApp, email, or QR code. Attendees open it on their phone, type their name, upload a photo, and download their card in under 30 seconds."

Below: CTA "Start your first campaign →"

### SECTION 8: Feature highlights
4-6 feature cards in a row

Features:
1. VARIANTS — "One event, multiple roles. Attendees, speakers, sponsors — each gets their own card layout."
2. PHOTO CROP — "Smart cropping matches your zone shape — circle, square, hexagon, rounded — automatically."
3. LIVE PREVIEW — "Attendees see their card update as they type. No surprises at download."
4. SHARE BUILT-IN — "One-tap share to Instagram Stories, WhatsApp Status, X, and more — with caption suggestions."
5. AFRICA-FIRST — "Built for low-bandwidth networks, mobile-first phones, and how Africa actually uses social media."
6. NO ATTENDEE ACCOUNTS — "Attendees never sign up or log in. They tap the link, make their card, move on."

### SECTION 9: Pricing teaser
3 pricing cards in a row

Free — $0 — "For small campaigns and trials"
- 1 event · Up to 50 cards · Cardly watermark
- CTA: "Start free"

Pro — $29/month — "For most organizers"
- 5 events · Unlimited cards · No watermark · 3 variants per event
- CTA: "Start Pro trial"
- Badge: "Most popular" (accent gold)

Studio — $99/month — "For agencies and large campaigns"
- Unlimited events · Unlimited cards · Unlimited variants · Brand kit · Team accounts · Priority support
- CTA: "Start Studio trial"

Below: "See full pricing details →" link

### SECTION 10: Testimonial / quote block (optional placeholder)
Centered, max width 720px
- Large quote mark in accent gold
- Quote (Display M italic): "Cardly let us turn 600 attendees into 600 brand ambassadors. The reach was 10x what we expected."
- Attribution: "[Name] · [Role] · [Organization]"

If no testimonial yet, hide or use clearly placeholder content.

### SECTION 11: FAQ
6-8 questions in accordion

1. Do attendees need to sign up?
2. What file formats can I upload as my design?
3. Can I have different cards for different roles?
4. Can attendees crop their photos?
5. Where can attendees share their card?
6. What languages does Cardly support?
7. Can I see analytics on who downloaded their card?
8. How is Cardly different from Canva templates?

Surface white cards, border-border, rounded-xl. Forest-green chevron rotates on open.

### SECTION 12: Final CTA
Centered, full-width, hero-gradient background at low opacity

- Headline (Display L, ink): "Start your first campaign today."
- Subhead (Body L, ink-soft): "Free for up to 50 cards. No credit card. Most users have their first card ready in under 5 minutes."
- Primary CTA (forest green, large): "Start free →"
- Below: "or see a live example →"

### SECTION 13: Footer
Multi-column, clean

Column 1 (logo + tagline):
- Cardly wordmark
- "Personalized share cards for every campaign."
- Social icons (LinkedIn, Twitter/X, Instagram)

Column 2 — Product: Use cases · How it works · Pricing · What's new
Column 3 — Company: About · Blog · Contact · Partners
Column 4 — Resources: Help center · Privacy · Terms · Status

Bottom bar:
- "© 2026 Cardly. Built with care for organizers everywhere."
- "MADE IN DJIBOUTI" badge with flag emoji

---

## L2 — USE CASES PAGE

Dedicated page at /use-cases that goes deeper than the homepage grid.

Structure:
1. Hero: "Cardly works for every kind of campaign." + subhead about who uses it
2. Tab navigation: Conferences · NGOs · Political · Religious · Brand · Education
3. Each tab opens a detailed use case section with:
   - 2-3 card examples
   - 3-4 problems Cardly solves
   - Quote placeholder
   - "See template" link
4. Bottom CTA: "Don't see your use case? Email us →"

---

## L3 — PRICING PAGE

Structure:
1. Hero: "Simple pricing. Pay only when you grow."
2. Plan toggle: Monthly / Yearly (20% off yearly)
3. 3 plan columns (Free / Pro / Studio) with FULL feature comparison
4. Feature comparison table (collapsed by default, expandable)
5. FAQ specific to pricing
6. Final CTA: "Start free → upgrade when you're ready"

No "Enterprise — contact us" for now. Studio is top tier, transparent.

---

## L4 — HOW IT WORKS PAGE

Structure:
1. Hero: "From idea to thousands of shares in 4 steps."
2. Step 1: "Upload your design" — walkthrough with screenshots
3. Step 2: "Define editable zones" — editor walkthrough
4. Step 3: "Publish your link" — share options
5. Step 4: "Watch your audience share" — analytics + viral loop visual
6. Video placeholder: 60-second product demo
7. CTA: "Start free →"

---

## L5 — ABOUT / STORY PAGE

Structure:
1. Hero: "Built in Djibouti, for the world." + founder photo + name
2. Founder story (Body L, max-width 640px, 2-3 paragraphs):
   - Why you built this
   - What you saw others missed
   - Who you're building for (Africa-first, globally relevant)
3. Mission section: "What Cardly stands for" — 3 values with icon + headline + body
4. Team section (placeholder if solo)
5. Press / mentions section (placeholder)
6. CTA: "Want to chat? Email →"

---

## L6 — MOBILE NAVIGATION & FOOTER

Mobile nav:
- Hamburger icon in top-right
- Tap opens full-screen overlay menu
- Menu items: Use Cases · How It Works · Pricing · About · Sign in · Start free
- Close (X) in top-right of overlay
- Background: cream with subtle gradient

Footer: same content as L1 Section 13, stacked vertically on mobile.

---

## INTERACTIONS & MOTION

- All transitions: 200-300ms ease-out
- Hover on CTA: slight lift + brightness
- Hover on cards: 1.02 scale + lift shadow
- Hover on links: underline animates left-to-right
- On-scroll fade-up animations for major sections (subtle, 400ms)
- Hero card slight float idle (translateY 3px / 4s)
- No bouncy spring physics. No confetti. No parallax trickery.

---

## ACCESSIBILITY

- All CTAs have visible focus rings (forest green, 3px, soft alpha)
- All images have alt text
- Color contrast meets WCAG AA throughout
- Lang attribute "en" — write copy so it could be translated

---

## OUTPUT FORMAT

Each page:
1. Complete React + Tailwind component
2. Mobile-first responsive with sm: and lg: breakpoints
3. Use shadcn/ui primitives where appropriate
4. Lucide-react icons only
5. Realistic content (real African event names, organizations, attendee names)
6. Inline {/* TODO: link */} comments where real data plugs in
7. One artifact per page

---

## BUILD ORDER (STRICT)

1. L1 — Landing page (build all 13 sections in one artifact, show at desktop 1280px / tablet 768px / mobile 375px)
2. L2 — Use Cases page
3. L3 — Pricing page
4. L4 — How It Works page
5. L5 — About page
6. L6 — Mobile nav + Footer

Wait for my approval after each before building the next.

---

## START WITH L1

Build the full landing page (all 13 sections) as one responsive React + Tailwind component.

Use these realistic content seeds:
- Hero event: "5th Pan-African Youth Forum" / Aisha Ahmed / Climate Policy Lead / 4-6 NOV 2025 / DJIBOUTI
- Variants shown: "I'M ATTENDING" / "I'M SPEAKING AT" / "I'M VOLUNTEERING AT"
- Use cases: "Africa Tech Festival 2026", "Pan-African Climate Summit", "Global Halal Summit", "United for East Africa", "MTN Brand Activation 2026", "University of Nairobi Class of 2026"
- Testimonial placeholder

Show me L1 at desktop 1280px, tablet 768px, AND mobile 375px in one artifact. After I approve, build L2.
```

---

## What this prompt deliberately does NOT do

- Does NOT make positioning generic. "For event teams, brands & campaigns" is broader than just events but is NOT "for everyone."
- Does NOT add "AI-powered" anywhere. You're not. Don't lie.
- Does NOT use emotional manipulation copy. The headline names the user's job, not their feelings.
- Does NOT add features you don't have yet (brand kit, team accounts, custom domains listed as "coming soon").
- Does NOT promise things you can't deliver. No "10x reach" claims without data.

## What this prompt DELIBERATELY does

- Shows the product (real card preview) above the fold
- Names the visitor's actual pain in their own words
- Shows breadth of use cases without saying "for everyone"
- Stays on the forest+cream brand
- Mobile-first, calm, editorial — matches your existing product surfaces
- Clear conversion path: Hero CTA → Use Cases proof → How It Works → Pricing → Final CTA
- Builds trust through Africa-specific positioning (a real differentiator vs Premagic etc)

---

## After Claude Design ships L1-L6

Export the JSX files. Bring them back. I'll write the Claude Code handoff prompt with strict isolation (only touches `app/(marketing)/**`, leaves editor/attendee/render/auth alone) — same pattern that worked twice already.

---

## Final reminder

This prompt is ready to use whenever. But the smartest sequence is still:

1. Send the live URL to 5 real humans in your specific niche
2. Listen to what they say — write down the EXACT WORDS they use
3. Replace placeholder copy in this prompt with their language
4. THEN run this prompt

The redesign will be 10x better with real user words in it.

But do you. The prompt's here when you want it.
