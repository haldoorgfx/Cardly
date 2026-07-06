# Handoff: Eventera — Auth & Onboarding

## Overview
Two connected pieces of the attendee entry experience:
1. **Auth redesign** — passwordless sign-in: forest hero panel + brand lockup, Google or email → 6-digit OTP → (new users) profile → in.
2. **Onboarding wizard** — a short, skippable 6-step data-collection flow after signup that captures what Eventera needs to personalize the app *and* what organizers need to run the event (headcount, dietary, accessibility).

Both are **visual specs**, not production code. Rebuild in the existing Flutter app, reusing current Supabase/API data contracts — visual only.

## Fidelity
**High-fidelity.** Colors, type, spacing, radii, shadows, states are final. Replace placeholders with real data: avatar (initial-on-forest fallback → real photo), `.ph` mesh gradients → real imagery, sample values/counts → live data, drawn Google glyph is the real 4-color G.

## Brand tokens (exact)
Full set in `karta.css`. Key: forest `#1F4D3A` · forest-dark `#0D1F17` · forest-soft `#E8EFEB` · gold `#E8C57E`/`#C9A45E`/gold-soft `#F5E9CC` · cream-canvas `#FAF6EE` (bg) · cream-surface `#FFFFFF` · cream-soft `#F0EDE8` · cream-border `#E5E0D4` · ink `#0F1F18`/`#3A4A42`/`#6B7A72` · success `#2D7A4F` · warning `#C97A2D` · info `#3A6B8C` · danger `#B8423C`. Type: DM Sans (headings −0.02em) / Inter (body) / JetBrains Mono (codes, dates, step counts). Radius: hero panel 30, cards 14–15, buttons/inputs 12, OTP cells 14, pills 999. Padding 20.

## New reusable components (in mobile.css)
**Auth:** `.auth-hero` (forest gradient panel, rounded-bottom, `.glow`), `.brandlock` (`.mark` + `.wm`), `.motif` (stacked attending-card motif: `.c-back`/`.c-mid`/`.c-front`), `.proof` (avatar cluster + count), `.gbtn` (white Google button, real colored G), `.divider` (labeled rule), `.otp` + `.cell` (`.filled`/`.on` w/ blinking `.caret`/`.err`), `.photoup` (dashed photo ring + `+` badge).
**Onboarding:** `.prog` (segmented progress bar; `i.on`/`i.half`), `.optcard` (selectable card, `.on` state, `.oc-check` checkbox or `.oc-radio`), `.whynote` (gold "why we ask" callout), `.ob-top`/`.ob-skip` scaffold (progress + back + skip).
Reuses existing `.chip`/`.chip.on`, `.tgl`, `.input`, `.itile-*`, `.mbtn*`, `.mcard`, `.av`.

## Screens

### `Eventera Auth Redesign.html` (8 screens, 2 rows)
1. **Welcome** — forest hero (brand lockup, card motif, "12,000+ in the room" proof) over cream: Google primary, "or with email" divider, email field + Continue, Terms line.
2. **Email entry** — focused/valid (success check, Send code), Google fallback.
3. **Email error** — invalid address, disabled CTA.
4. **Verify code** — 6-digit OTP, active cell caret, resend timer, Change email.
5. **Code error** — cells in danger, retry/resend.
6. **Verifying** — spinner moment.
7. **New user · profile** — signup branch: photo ring, full name, optional city, Skip.
8. **You're in** — dark success moment → Discover / I have a code.

**Auth behavior:** passwordless. Google or email both land on OTP for new/returning; unknown email → new-user profile after verify; known email → straight in. OTP: 6 digits auto-advance, 60s resend cooldown, wrong code → error state. All flows respect Terms/Privacy consent on the welcome screen.

### `Eventera Onboarding.html` (8 screens, 2 rows) — runs after first signup
1. **Intro** — 3 payoffs (card / matches / smoother event) + privacy reassurance; "Get started" / "I'll do this later".
2. **Basics** (Step 1, required) — photo, full name, city, phone → attending card + ticket updates.
3. **Work** (Step 2) — job title, company, industry select, "here as a…" role chips.
4. **Interests** (Step 3) — topic chips, live selected count.
5. **Goals** (Step 4) — multi-select cards: meet people / learn / raise / hire / sell.
6. **Networking** (Step 5) — directory visibility + "open to connect" toggles, LinkedIn/X links.
7. **Dietary & access** (Step 6) — dietary chips, accessibility chips, note; **explicitly private, organizer-only**.
8. **All set** — summary of what the profile powers (card ready, N matches, tailored sessions).

**Onboarding behavior:** only **name is required**; every other field/step is skippable (Skip top-right, "I'll do this later" on intro) and editable afterward in Profile → Settings. Progress bar reflects step N of 6. Each data point has a purpose, surfaced inline:
- basics/work → attending card + directory identity
- interests + goals → AI networking matches (match % + reason) and session recommendations
- networking prefs → attendee discoverability / directory opt-in
- dietary + accessibility → **organizer-facing aggregate** (catering headcount, access requirements); never shown on card/profile.

## Data captured (map to existing contracts)
profile: name, photo, city, phone, job_title, company, industry, role_type[], interests[], goals[], directory_visible (bool), open_to_connect (bool), links{linkedin, x}, dietary[], accessibility[], notes. Auth: email, oauth_provider, otp state, is_new_user. Per the product owner these map to existing Supabase/API — reuse them; QR/card render come from backend.

## Files
In `design_handoff_auth_onboarding/`:
- `Eventera Auth Redesign.html` — auth flow
- `Eventera Onboarding.html` — onboarding wizard
- `mobile.css` — primitives + new auth/onboarding components
- `karta.css` — brand tokens (source of truth)
- `eventera-logo.png` — wordmark
- `README.md` — this doc

Icons are inline stroke SVG (1.6–2 width) — map to your icon set. Fonts via Google Fonts (bundle/self-host in prod). Open either HTML and pan the canvas across its rows.
