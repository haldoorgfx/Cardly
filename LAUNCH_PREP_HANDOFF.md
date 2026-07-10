# CARDLY — LAUNCH PREP HANDOFF

**This prompt prepares the platform for launch: humanizes all marketing copy, removes AI-slop patterns, creates legal pages, fixes placeholder content, and produces a launch readiness checklist. SCOPED: copy and content only. Product code untouched.**

---

## How to use

1. Make sure you're on master and clean:
   ```
   cd C:\Users\cabda\cardly
   git checkout master
   git pull origin master
   git status
   ```

2. Open Claude Code, paste everything below this line.

---

## THE PROMPT — PASTE EVERYTHING BELOW INTO CLAUDE CODE

```
We are preparing Eventera for launch. The product is built. The design is shipped. What remains: the COPY across the platform feels AI-generated, has placeholder testimonials, missing legal pages, and reads like generic SaaS marketing. Real humans will see this tomorrow. It needs to feel like a real founder wrote it, not a language model.

────────────────────────────────────────────
ABSOLUTE NON-NEGOTIABLE BOUNDARIES
────────────────────────────────────────────

You ARE allowed to touch:
- app/(marketing)/page.tsx (landing)
- app/(marketing)/pricing/page.tsx
- app/(marketing)/use-cases/page.tsx
- app/(marketing)/how-it-works/page.tsx
- app/(marketing)/about/page.tsx
- components/marketing/** (where copy is hardcoded)
- NEW: app/(marketing)/privacy/page.tsx
- NEW: app/(marketing)/terms/page.tsx
- NEW: app/(marketing)/contact/page.tsx
- NEW: LAUNCH_CHECKLIST.md in project root
- NEW: TESTING_CHECKLIST.md in project root

You are FORBIDDEN from touching:
- app/c/[slug]/** (attendee experience)
- components/editor/** (canvas editor)
- app/(app)/** (dashboard)
- app/(auth)/** (signup/login)
- app/api/** (all APIs)
- middleware.ts, lib/supabase/**, types/database.ts
- supabase/migrations/**
- tailwind.config.ts, app/globals.css
- Any product logic — copy/content changes ONLY

If you need to touch anything outside the allowed list, STOP and ask first.

────────────────────────────────────────────
STEP 0 — READ AND DIAGNOSE FIRST
────────────────────────────────────────────

Read these files completely:
1. CLAUDE.md (project rules)
2. BRAND.md (brand voice if it exists)
3. app/(marketing)/page.tsx
4. app/(marketing)/pricing/page.tsx
5. app/(marketing)/use-cases/page.tsx
6. app/(marketing)/how-it-works/page.tsx
7. app/(marketing)/about/page.tsx
8. components/marketing/MarketingFooter.tsx (for link audit)

Then produce a written diagnostic with these sections:

A. AI-SLOP AUDIT: list every phrase or section across all 5 pages that reads as AI-generated. Be specific. Quote the text. Use these patterns as flags:
   - Empty intensifiers: "powerful," "seamless," "robust," "intuitive," "cutting-edge"
   - Hollow promises: "transform your business," "unlock potential," "elevate your brand"
   - Em-dash overuse — like this — which AI models love
   - Triplet rhythm: "Build. Share. Grow." or "Faster. Smarter. Better."
   - Generic testimonials with [Name] [Role] [Org] placeholders
   - "Loved by teams everywhere" / "Trusted by thousands" without numbers
   - "Our mission is to..." corporate-speak
   - Synthetic specificity: "10x faster" / "300% increase" without sources
   - Headlines that don't say what the product does

B. PLACEHOLDER INVENTORY: list every placeholder that needs a real value:
   - Testimonial quotes with [Name]
   - Social proof logos that aren't real customers
   - "Made in Djibouti" badge — keep
   - FAQ answers that are too generic
   - Pricing tier descriptions that overpromise
   - Any [TODO] comments or {/* TODO */} markers

C. MISSING PAGES: confirm what doesn't exist yet:
   - /privacy
   - /terms
   - /contact
   - Any footer link going to "#" placeholder
   - Cookie banner or notice

D. COPY VOICE PROBLEMS: identify where the writing voice is wrong:
   - Generic SaaS instead of founder voice
   - Buzzword-heavy sections
   - Sentences that say nothing
   - Headers that are abstract not concrete

WAIT for my approval before writing any code or copy.

────────────────────────────────────────────
STEP 1 — REWRITE THE COPY (human voice)
────────────────────────────────────────────

After approval, rewrite the copy on all 5 marketing pages with these rules:

VOICE
- Write like a founder who built this product alone, in Djibouti, for African event organizers and global campaigns
- First person plural ("we") sparingly; avoid royal "we"
- Direct, plain, specific
- Confident without bragging
- No buzzwords from the AI-SLOP AUDIT
- Vary sentence length — short, medium, occasional longer
- Cut adverbs ruthlessly

CONTENT RULES
- Replace empty adjectives with concrete examples
- Replace empty stats with honest framing ("Built for events with 50-50,000 attendees" instead of "Trusted by millions")
- Replace placeholder testimonials with: REMOVE them entirely if no real testimonials exist yet. Better to have no testimonials than fake-feeling ones.
- Replace placeholder logos with: REMOVE the "Used for campaigns by" strip entirely if there are no real logos. Or replace with a more honest statement like "Early access — first 50 organizations get founding member pricing."
- Use real numbers only. If you don't have data, don't fabricate it.
- Use specific event names already approved: "5th Pan-African Youth Forum," "Africa Tech Festival 2026"

HEADLINE PRINCIPLES
- Headlines must say WHAT the product does for WHO
- "Personalized share cards for every campaign" is better than "Elevate your brand experience"
- Test each headline: if a competitor's name could replace "Eventera" and the headline still works, it's too generic

SECTION-BY-SECTION RULES

For the LANDING PAGE (/):
1. Hero headline: keep direct, no abstract metaphors. Current: "Every supporter. Every speaker. Every attendee. Their own branded card." — this is good, keep or refine.
2. Hero subhead: cut anything that sounds like ChatGPT. Say what happens in plain words.
3. Problem section: rewrite to sound like a real founder venting about a real pain. Specific examples from real African event contexts.
4. Solution section: explain the product in 2 short sentences, then show.
5. Use cases grid: keep the 6 categories. Rewrite each description as a real scenario, not a generic benefit.
6. How it works: 3 steps, action verbs, concrete outcomes. No fluff.
7. Features section: list 6 features. Each one ONE sentence. No marketing puffery.
8. Pricing teaser: state plans plainly. Don't oversell.
9. Testimonials section: REMOVE if no real testimonials. Replace with: a single founder note or an "Early access" callout.
10. FAQ: rewrite questions to be ones real users actually ask. Answer in plain English. No corporate-speak.
11. Final CTA: short, direct, no exclamation marks.

For PRICING PAGE:
- Use "Free / Pro / Studio" tiers as designed
- Each tier description: 1 sentence max, plain English
- Feature comparison table: only include features that actually work today. Mark "Coming soon" honestly.
- FAQ: real questions real buyers ask. Refunds, downgrades, who owns the design files.

For USE CASES PAGE:
- 6 categories: each gets 2-3 specific scenarios with real-sounding event names
- Quotes: REMOVE all placeholder quotes unless replaced with real ones
- "Don't see your use case?" → keep as honest CTA

For HOW IT WORKS PAGE:
- 4 steps, plain action verbs
- Each step: what the user does, what happens, how long it takes (in honest terms)
- Video placeholder: keep, but add a note "Demo video coming soon — for now, see the 30-second walkthrough below" with text walkthrough

For ABOUT PAGE:
- Founder story: rewrite as honest first-person from Abdalla
- "Built in Djibouti, for the world" — keep
- Mission/values: 3 max, each in plain language
- Team: solo founder, name it honestly
- Press section: REMOVE if no real press coverage

────────────────────────────────────────────
STEP 2 — CREATE LEGAL & UTILITY PAGES
────────────────────────────────────────────

Create three new pages with real-feeling content:

2A — app/(marketing)/privacy/page.tsx
Standard privacy policy structure adapted for Eventera:
- What data we collect (account info, event data, attendee names/photos)
- How we use it (storage, rendering, no third-party selling)
- Cookie usage
- Data deletion rights
- Contact for privacy concerns
- Last updated date
Write it in plain English, not legal-speak. Add a note at top: "We'll review this with a lawyer before formal launch. This is our honest current practice."

2B — app/(marketing)/terms/page.tsx
Standard terms of service:
- Acceptance of terms
- Account responsibilities
- Acceptable use (no spam, no impersonation, etc.)
- IP rights (user owns their designs, Eventera owns the platform)
- Pricing and payment terms
- Cancellation
- Disclaimers
- Last updated date

2C — app/(marketing)/contact/page.tsx
Simple contact page:
- Email: use a placeholder for now (e.g., hello@cardly.app or whatever the rebrand becomes)
- WhatsApp button (link to wa.me/...)
- "Based in Djibouti. We reply within 24 hours."
- Quick form OR mailto link

Then UPDATE the MarketingFooter component to link to all three real pages instead of "#" placeholders.

────────────────────────────────────────────
STEP 3 — CREATE LAUNCH_CHECKLIST.md
────────────────────────────────────────────

Create LAUNCH_CHECKLIST.md in project root. Markdown checklist covering:

PRE-LAUNCH (must be true before sending to anyone):
- [ ] All placeholder testimonials removed or replaced
- [ ] All footer links resolve (no "#" placeholders)
- [ ] Privacy policy exists
- [ ] Terms of service exists
- [ ] Contact method works
- [ ] Sign up flow tested end-to-end
- [ ] Editor flow tested end-to-end
- [ ] Attendee flow tested end-to-end (E0 → E3)
- [ ] PNG download works on iOS Safari
- [ ] PNG download works on Android Chrome
- [ ] Tested on phone with 4G (not just WiFi)
- [ ] Stripe payment tested OR Pro/Studio tiers disabled until ready
- [ ] Analytics installed (Plausible, Vercel Analytics, or Google Analytics)
- [ ] Error tracking installed (Sentry or similar) OR an honest "report bug" form
- [ ] Domain set up if rebranded
- [ ] Custom domain or vercel.app URL decided
- [ ] Social media handles secured

LAUNCH DAY:
- [ ] Send to 5 specific people via WhatsApp/email
- [ ] Each person sent a personalized message (not blast)
- [ ] Capture feedback within 24 hours
- [ ] Monitor Vercel error logs hourly
- [ ] Watch first attendee flow happen live (record it if possible)

POST-LAUNCH (first 72 hours):
- [ ] Reply to every message within 4 hours
- [ ] Fix any blocker bugs same-day
- [ ] Take notes on what users say (verbatim)
- [ ] Don't add new features yet — only fix what breaks

────────────────────────────────────────────
STEP 4 — CREATE TESTING_CHECKLIST.md
────────────────────────────────────────────

Create TESTING_CHECKLIST.md in project root. Step-by-step manual test plan:

A. SIGN UP FLOW
- [ ] Visit / on desktop
- [ ] Click "Start free"
- [ ] Land on /signup
- [ ] Create account with new email
- [ ] Verify email if required
- [ ] Land on dashboard

B. EVENT CREATION FLOW
- [ ] Click "New event" from dashboard
- [ ] Upload a card design (PNG, JPG, 1080x1080 minimum)
- [ ] See editor open with design
- [ ] Add a text zone, label "Name"
- [ ] Add a photo zone, label "Photo"
- [ ] Resize, drag, reposition zones
- [ ] Test Cmd+Z undo
- [ ] Click Save
- [ ] Click Publish
- [ ] Copy public link

C. ATTENDEE FLOW (test as non-logged-in user — incognito tab)
- [ ] Paste public link
- [ ] See E0 Arrival screen with event branding
- [ ] Click Get Started
- [ ] Fill in name, upload photo
- [ ] Crop photo
- [ ] See preview matches what the designer made
- [ ] Click Download
- [ ] PNG downloads correctly
- [ ] PNG matches preview (no font shift, no missing image)
- [ ] See success screen with share buttons

D. SHARE BUTTONS
- [ ] WhatsApp button opens WhatsApp
- [ ] Instagram button works on mobile
- [ ] Twitter/X button works
- [ ] Copy link copies to clipboard

E. MOBILE TESTS
- [ ] Repeat A-D on actual mobile phone
- [ ] Test on iOS Safari
- [ ] Test on Android Chrome
- [ ] Test on slow 4G (use Chrome devtools throttling)

F. EDGE CASES
- [ ] What happens if attendee uploads huge photo (>10MB)?
- [ ] What happens with no internet mid-flow?
- [ ] What happens on a published event that's been deleted?
- [ ] What happens if 2 people fill out the same event at the same time?

G. MARKETING PAGES
- [ ] / loads in <3 seconds
- [ ] /pricing loads
- [ ] /use-cases loads, tabs work
- [ ] /how-it-works loads
- [ ] /about loads
- [ ] /privacy loads (new)
- [ ] /terms loads (new)
- [ ] /contact loads (new)
- [ ] All CTAs lead to correct destinations
- [ ] Mobile menu works
- [ ] Footer links all work

────────────────────────────────────────────
STEP 5 — COMMITS & PUSH
────────────────────────────────────────────

Commit in this order:
1. `chore(content): audit and remove AI-slop from marketing copy`
2. `feat(content): humanize landing page copy`
3. `feat(content): humanize pricing/use-cases/how-it-works/about`
4. `feat(legal): add privacy, terms, contact pages`
5. `feat(footer): wire footer links to real pages`
6. `docs: add LAUNCH_CHECKLIST.md and TESTING_CHECKLIST.md`

After all commits:
- `pnpm build` to verify zero errors
- `git push origin master`
- Vercel auto-deploys

────────────────────────────────────────────
HARD CONSTRAINTS
────────────────────────────────────────────

1. DO NOT touch any product code (editor, attendee, dashboard, auth, APIs)
2. DO NOT change brand colors, fonts, or design system
3. DO NOT add new dependencies
4. DO NOT invent testimonials, customer logos, or stats
5. DO NOT use buzzwords from the AI-SLOP AUDIT
6. DO NOT use em-dashes excessively (max 1-2 per page)
7. DO NOT use triplet rhythm in headlines (e.g., "Build. Share. Grow.")
8. DO NOT promise features that don't work yet — mark them "coming soon"
9. Stay on master branch
10. Test pnpm build before pushing

────────────────────────────────────────────
START
────────────────────────────────────────────

Begin with Step 0 — the diagnostic. Read all 5 marketing pages and produce the AI-SLOP AUDIT, PLACEHOLDER INVENTORY, MISSING PAGES list, and COPY VOICE PROBLEMS. Quote specific text. Do not write any new copy until I approve the diagnostic.
```

---

## End of prompt

---

## What this prompt does

1. **Diagnoses** every AI-feeling phrase across all 5 pages
2. **Lists** every placeholder that needs real content or removal
3. **Rewrites** the copy to sound like a real founder, not a language model
4. **Removes** fake testimonials and fake stats
5. **Creates** privacy, terms, and contact pages
6. **Wires** footer links to real destinations
7. **Generates** LAUNCH_CHECKLIST.md + TESTING_CHECKLIST.md
8. **Tests** the build before pushing

---

## What you do next

1. Save the file to `C:\Users\cabda\cardly\` as `LAUNCH_PREP_HANDOFF.md`
2. Open Claude Code
3. Paste this one-line instruction:

```
Read LAUNCH_PREP_HANDOFF.md fully and follow it exactly. Start with Step 0 — produce the diagnostic. Do not write any code or copy until I approve the diagnostic.
```

4. Wait for the diagnostic (5-10 minutes)
5. Screenshot the AI-SLOP AUDIT — send it to me before approving
6. I'll review with you, then you approve
7. Claude Code rewrites everything, creates legal pages, generates checklists
8. Push, deploy, ready to soft-launch tomorrow

---

## What I won't lie to you about

This is the **prep** for launch. After Claude Code finishes, you still need to actually do the testing checklist YOURSELF on a real phone with real 4G. No AI can do that. You'll have a humanized site with legal pages, but you still need to test that the product works end-to-end before sending the URL to anyone.

When the diagnostic comes back, send it to me. We close this out together.
