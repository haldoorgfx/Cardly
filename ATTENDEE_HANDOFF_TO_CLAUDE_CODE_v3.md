# CARDLY — ATTENDEE EXPERIENCE HANDOFF TO CLAUDE CODE (v2 — Strict Isolation)

**This prompt replaces the existing attendee experience (`/c/[slug]`) with the newly designed 5-screen flow from Claude Design. Surgical scope. ZERO impact on anything outside the attendee path. Preserves the editor → attendee data contract.**

---

## How to use this prompt

1. Make sure you're on `master` branch and working tree is clean:
   ```
   cd C:\Users\cabda\cardly
   git checkout master
   git status   # should say "nothing to commit, working tree clean"
   git pull origin master
   ```

2. The new attendee design files (6 JSX files from Claude Design) are already placed inside the handoff project folder at:
   ```
   C:\Users\cabda\cardly\Cardly-handoff\Cardly\project\
   ```
   The 6 reference files Claude Code will read:
   - `Cardly-handoff/Cardly/project/arrival-card.jsx`
   - `Cardly-handoff/Cardly/project/arrival-screen.jsx`
   - `Cardly-handoff/Cardly/project/details-screen.jsx`
   - `Cardly-handoff/Cardly/project/crop-modal.jsx`
   - `Cardly-handoff/Cardly/project/preview-screen.jsx`
   - `Cardly-handoff/Cardly/project/success-screen.jsx`

   Note: this folder also contains older HTML mockups (A1, A2, B1, C1–C3, D1–D3, E0–E3, F1–F3) from earlier design iterations. Claude Code will be told to IGNORE those — only the six attendee JSX files above are in scope for this session.

   Project structure (relevant parts):
   ```
   C:\Users\cabda\cardly\
   ├── Cardly-handoff\Cardly\project\   ← contains the 6 NEW attendee JSX files + old HTML mockups
   │   ├── arrival-card.jsx              ← IN SCOPE
   │   ├── arrival-screen.jsx            ← IN SCOPE
   │   ├── details-screen.jsx            ← IN SCOPE
   │   ├── crop-modal.jsx                ← IN SCOPE
   │   ├── preview-screen.jsx            ← IN SCOPE
   │   ├── success-screen.jsx            ← IN SCOPE
   │   └── *.html, other *.jsx           ← OUT OF SCOPE (ignore)
   ├── app\
   ├── components\
   ├── CLAUDE.md
   ├── BRAND.md
   └── ... rest of project
   ```

3. Open Claude Code (`claude` in PowerShell) and paste the prompt below as your first message.

4. Approve plan steps as Claude Code presents them. Do NOT let it skip ahead — review each phase.

---

## THE PROMPT — PASTE EVERYTHING BELOW THIS LINE INTO CLAUDE CODE

```
We are doing a SCOPED upgrade to ONE PART of the Cardly platform: the public attendee experience at /c/[slug]. The 5 new attendee screens have been designed in Claude Design and exported as JSX reference files located in `Cardly-handoff/Cardly/project/` (specifically: arrival-card.jsx, arrival-screen.jsx, details-screen.jsx, crop-modal.jsx, preview-screen.jsx, success-screen.jsx). All other files in that folder (HTML mockups and older jsx like design-canvas.jsx, ios-frame.jsx, details-screen variations) are out of scope — DO NOT read or use them. Your job is to faithfully reimplement the 5 new attendee screens as production Next.js components.

This is a high-risk session because Cardly is already live in production with paying-customer potential. You must NOT break anything currently working. Read every constraint below before touching code.

────────────────────────────────────────────
ABSOLUTE NON-NEGOTIABLE BOUNDARIES
────────────────────────────────────────────

You ARE allowed to touch ONLY:
- `app/c/[slug]/` — the attendee public route (this is what we're rebuilding)
- `tailwind.config.ts` — brand token cleanup only
- `app/globals.css` — brand gradient cleanup only
- `package.json` / `pnpm-lock.yaml` — only to add `react-easy-crop` (no other packages)
- Files that contain hardcoded `#6c63ff` / `#f8a4d8` / `#fafafa` (as page bg) / `#e5e5ea` colors — replace those tokens only, nothing else in those files

You are FORBIDDEN from touching:
- `components/editor/CanvasEditor.tsx` — the canvas editor (1000+ lines, working perfectly, do NOT change ANY logic)
- `app/api/render/route.ts` — the server-side PNG render endpoint (was just fixed, must not regress)
- `app/api/events/**` — event CRUD API
- `app/api/upload/**` — file upload API
- `app/(app)/**` — dashboard, event detail, event creation, publish flow
- `app/(auth)/**` — signup, login, logout, password flows
- `app/(marketing)/**` — landing page, pricing page (except brand token replacements only)
- `middleware.ts` — auth middleware
- `lib/supabase/**` — Supabase client/server helpers
- `supabase/migrations/**` — database schema
- `types/database.ts` — type definitions (READ ONLY — do NOT change the shape)
- `scripts/**` — migration / setup scripts
- `vercel.json` — deployment config
- `next.config.mjs` — Next.js config
- `tsconfig.json` — TypeScript config
- `Cardly-handoff/**` — design reference folder (READ-ONLY). You may READ the 6 attendee JSX files inside `Cardly-handoff/Cardly/project/` (arrival-card.jsx, arrival-screen.jsx, details-screen.jsx, crop-modal.jsx, preview-screen.jsx, success-screen.jsx) as design reference, but NEVER write, edit, or delete anything in this folder. Treat it as a frozen archive of design intent.

If you find yourself wanting to "improve" anything outside the allowed list — STOP and ask me first.

────────────────────────────────────────────
THE EDITOR ↔ ATTENDEE CONTRACT (MUST BE PRESERVED)
────────────────────────────────────────────

The editor (CanvasEditor.tsx) saves event data to Supabase. The attendee page reads that same data. Both sides depend on a stable data contract. Your new attendee implementation MUST consume this exact data shape WITHOUT changes:

EVENT object from Supabase (do NOT change this shape):
```
{
  id: string,
  user_id: string,
  name: string,
  slug: string,
  background_url: string,
  background_width: number,
  background_height: number,
  zones: Zone[],
  status: 'draft' | 'published' | 'archived',
  view_count: number,
  download_count: number,
  created_at: timestamp,
  updated_at: timestamp
}
```

ZONE object (every zone in event.zones) — do NOT change this shape:
```
{
  id: string,
  type: 'text' | 'photo' | 'custom',
  label: string,
  x: number,           // pixel offset from background top-left
  y: number,           // pixel offset from background top-left
  w: number,           // width in pixels
  h: number,           // height in pixels
  required?: boolean,
  placeholder?: string,
  // text-only:
  font?: string,
  size?: number,
  weight?: number,
  color?: string,
  align?: 'left' | 'center' | 'right',
  // photo-only:
  shape?: 'circle' | 'square' | 'rounded' | 'hex'
}
```

Your new attendee components MUST:
- Read `event.background_width` and `event.background_height` to set the preview aspect ratio
- Position each zone by converting absolute pixel coordinates (zone.x, zone.y, zone.w, zone.h) to percentages of the background dimensions
- Apply zone.font, zone.size, zone.weight, zone.color, zone.align for text zones
- Apply zone.shape for photo zones
- Treat zone.type === 'custom' as a text field (same as 'text', different label)
- Honor zone.required and zone.placeholder

If the editor adds a new field type or property in the future, the attendee page should gracefully ignore unknown fields rather than crash. Use TypeScript optional chaining and defensive defaults.

Test compatibility: when you're done, an event created by the existing editor must work in your new attendee experience WITHOUT requiring any editor change.

────────────────────────────────────────────
STEP 0 — READ FIRST
────────────────────────────────────────────

Read these in order, completely. Do not skip.

1. CLAUDE.md (project rules)
2. BRAND.md (brand system — source of truth for colors/typography)
3. tailwind.config.ts (current config — note the old purple/pink tokens that need updating)
4. app/globals.css (current CSS — note the old gradients)
5. types/database.ts (READ ONLY — the data contract you must consume)
6. app/c/[slug]/page.tsx (server component that loads event by slug — minor updates allowed)
7. app/c/[slug]/AttendeeClient.tsx (current attendee implementation — to be REPLACED)
8. app/api/render/route.ts (READ ONLY — to understand what render output you must visually match)
9. components/editor/CanvasEditor.tsx (READ ONLY — to confirm the zone shape being saved)
10. Cardly-handoff/Cardly/project/arrival-card.jsx (NEW design — reusable card preview)
11. Cardly-handoff/Cardly/project/arrival-screen.jsx (NEW design — Screen 1: Arrival / E0)
12. Cardly-handoff/Cardly/project/details-screen.jsx (NEW design — Screen 2: Details Form / E1)
13. Cardly-handoff/Cardly/project/crop-modal.jsx (NEW design — Screen 3: Photo Crop Modal / E1.5)
14. Cardly-handoff/Cardly/project/preview-screen.jsx (NEW design — Screen 4: Preview & Download / E2)
15. Cardly-handoff/Cardly/project/success-screen.jsx (NEW design — Screen 5: Success & Viral Share / E3)

IMPORTANT: The `Cardly-handoff/Cardly/project/` folder contains MANY other files (old HTML mockups like A1 Landing Page.html, B1 Auth.html, C1-C3, D1-D3, F1-F3; older jsx files like design-canvas.jsx, ios-frame.jsx; an `uploads/` subfolder; old E1 Attendee Public Page.html and E2 Preview State.html). DO NOT READ those — they are stale and outdated. Only the SIX JSX files listed above (arrival-card, arrival-screen, details-screen, crop-modal, preview-screen, success-screen) are the current attendee design source of truth.

After reading, produce a written plan with these sections:

A. SUMMARY: 3 sentences describing what you understand needs to happen.
B. ISOLATION CONFIRMATION: explicitly list what you will and will not touch (mirror the boundaries above).
C. DATA CONTRACT CONFIRMATION: confirm in your own words how you'll consume the existing event + zone shape from Supabase.
D. BRAND TOKEN MIGRATION PLAN: what changes in tailwind.config.ts and globals.css.
E. FILE TOUCH LIST: every file you will modify or create, with one-line reason for each.
F. NEW DEPENDENCIES: confirm the only new package is `react-easy-crop`.
G. RISK LIST: what could break in other parts of the platform (editor, render, dashboard) and how you'll prevent that.
H. EDITOR REGRESSION TEST PLAN: how you'll verify the editor still works after the changes.
I. OPEN QUESTIONS: anything in the design files that's ambiguous when applied to real event data.

DO NOT WRITE ANY CODE YET. Wait for my "approved" before moving to Step 1.

────────────────────────────────────────────
STEP 1 — BRAND TOKEN MIGRATION (FINISH THE INCOMPLETE BRAND SWAP)
────────────────────────────────────────────

The brand swap from purple/pink to forest+cream was started but never finished. The Tailwind config still defines `brand.primary: "#6c63ff"`. Multiple files still hardcode old colors. Finish the swap — but ONLY by changing color values, NEVER by changing component logic or layout.

1A — UPDATE tailwind.config.ts

Replace the `theme.extend.colors.brand` block and ADD new top-level tokens:

```ts
colors: {
  brand: {
    primary: "#1F4D3A",
    secondary: "#E8C57E",
    ink: "#0F1F18",
    offwhite: "#FAF6EE",
    border: "#E5E0D4",
  },
  primary: { DEFAULT: "#1F4D3A", dark: "#163828", soft: "#E8EFEB" },
  accent: { DEFAULT: "#E8C57E", dark: "#C9A45E" },
  ink: { DEFAULT: "#0F1F18", soft: "#3A4A42" },
  muted: "#6B7A72",
  cream: "#FAF6EE",
  surface: "#FFFFFF",
  border: { DEFAULT: "#E5E0D4", strong: "#C9C3B1" },
  success: "#2D7A4F",
  warning: "#C97A2D",
  danger: "#B8423C",
  info: "#3A6B8C",
},
```

Update shadows:
```ts
boxShadow: {
  soft: "0 1px 2px rgba(15,31,24,0.04), 0 8px 24px rgba(15,31,24,0.06)",
  lift: "0 4px 12px rgba(15,31,24,0.08), 0 24px 60px rgba(31,77,58,0.12)",
},
```

Update the `zonePulse` keyframe color from `rgba(108,99,255,0.25)` to `rgba(31,77,58,0.25)`.

DO NOT change fontFamily, animation names, marquee, floatA/B, or any other keyframe.

1B — UPDATE app/globals.css

Replace these gradient definitions (forest+cream replaces purple+pink):
- `.grad-text` body: `linear-gradient(135deg, #1F4D3A 0%, #2A6A50 60%, #E8C57E 100%)`
- `.grad-bg` body: `linear-gradient(135deg, #1F4D3A 0%, #2A6A50 60%, #E8C57E 100%)`
- `.grad-border` colors: same new gradient
- `.ring-grad:focus-visible` box-shadow: `0 0 0 3px rgba(31,77,58,0.25)`

Update the CSS custom properties to match the new brand:
- `--primary: 150 43% 21%;` (forest green #1F4D3A)
- `--primary-foreground: 35 60% 96%;` (cream)
- `--secondary: 39 67% 70%;` (cream-gold accent)
- `--background: 35 60% 96%;` (cream)
- `--foreground: 144 33% 9%;` (ink)
- `--border: 36 28% 86%;` (warm beige border)
- `--ring: 150 43% 21%;` (forest)
- `--muted: 36 28% 92%;`
- `--muted-foreground: 144 8% 45%;`

Update body background from `#ffffff` to `#FAF6EE` (cream).
Update body color from `#0f0f1a` to `#0F1F18`.
Update noise pattern color from `#0f0f1a` to `#0F1F18`.

DO NOT change any animation keyframes, font imports, or layer structure.

1C — SEARCH AND REPLACE COLOR TOKENS ACROSS THE CODEBASE

Find every occurrence of these hex values in .tsx / .ts / .css files and replace:
- `#6c63ff` → `#1F4D3A`
- `#f8a4d8` → `#E8C57E`
- `#0f0f1a` → `#0F1F18`
- `#e5e5ea` → `#E5E0D4`

For `#fafafa`:
- If it's used as a PAGE background → replace with `#FAF6EE`
- If it's a surface/card background → keep as `#FFFFFF`
- Show me ambiguous cases before deciding

For any inline gradients matching the old purple→pink → replace with forest→deeper-forest→cream-gold.

CRITICAL — when doing replacements:
- Only change the COLOR VALUE
- Do NOT modify component logic, layout, spacing, padding, JSX structure, or any non-color attribute
- Do NOT rename variables, props, or class names
- Do NOT "while you're here" refactor anything

Files that contain old colors (replace ONLY the colors, leave everything else exactly as-is):
- app/(marketing)/page.tsx
- app/(marketing)/pricing/page.tsx
- app/(auth)/login/page.tsx
- app/(auth)/signup/page.tsx
- app/(app)/layout.tsx
- app/(app)/dashboard/page.tsx
- app/(app)/dashboard/DashboardContent.tsx
- app/(app)/dashboard/EventCard.tsx
- app/(app)/events/new/page.tsx
- app/(app)/events/[id]/page.tsx
- app/(app)/events/[id]/EventDetailActions.tsx
- app/(app)/events/[id]/publish/PublishClient.tsx
- app/(app)/error.tsx
- app/not-found.tsx
- components/shared/CopyButton.tsx
- components/editor/CanvasEditor.tsx ⚠️ ONLY change color values (e.g. zone outline color, handle color). Do NOT change any drag/resize/zoom/state/keyboard/auto-save logic.

After replacements, verify the editor still works:
- `pnpm dev`
- Open the editor on an existing event
- Drag a zone, resize it, change properties — confirm everything still functions
- Confirm auto-save still fires

Commit: `chore: finish brand swap to forest + cream across all files (colors only, no logic changes)`

STOP. Show me a list of files touched + count of color replacements. Confirm the editor still works. Wait for my "approved" before moving to Step 2.

────────────────────────────────────────────
STEP 2 — INSTALL DEPENDENCIES
────────────────────────────────────────────

Install the only new dependency:
```
pnpm add react-easy-crop
```

Confirm in package.json that no other packages were added. The lock file should only show the addition of react-easy-crop and its transitive deps.

Commit: `chore: add react-easy-crop for attendee photo crop modal`

────────────────────────────────────────────
STEP 3 — IMPLEMENT THE NEW ATTENDEE EXPERIENCE
────────────────────────────────────────────

The design reference files at `Cardly-handoff/Cardly/project/arrival-card.jsx`, `arrival-screen.jsx`, `details-screen.jsx`, `crop-modal.jsx`, `preview-screen.jsx`, and `success-screen.jsx` are written as `window.XScreen` global components for Claude Design's preview environment. They are NOT production-ready files. Reimplement them as proper Next.js components inside `app/c/[slug]/`. Ignore every other file in `Cardly-handoff/Cardly/project/` — only those six JSX files matter.

What you must extract from the reference JSX files:
- Exact visual design (colors, spacing, font sizes, line heights, border radii, shadows)
- Responsive variants (mobile/tablet/desktop layout patterns)
- Component structure (BrandStrip, Field primitives, etc.)
- Realistic placeholder content patterns

What you must NOT copy verbatim:
- The `window.XScreen = function...` pattern (it's for preview only)
- Inline SVG icons (replace with lucide-react icons)
- Hard-coded sample data (replace with real props from event + form state)
- Token objects defined locally in each file (use Tailwind classes instead)

3A — FILE STRUCTURE

Create these new files inside `app/c/[slug]/`:

```
app/c/[slug]/
├── page.tsx                          (existing — minor updates allowed)
├── AttendeeFlow.tsx                  (NEW — top-level client component, screen state machine)
├── components/
│   ├── EventCardPreview.tsx          (NEW — reusable live preview, renders background + zones)
│   ├── EventBrandStrip.tsx           (NEW — organizer logo + event name + date + location)
│   ├── ArrivalScreen.tsx             (NEW — E0)
│   ├── DetailsFormScreen.tsx         (NEW — E1)
│   ├── PhotoCropModal.tsx            (NEW — E1.5)
│   ├── PreviewDownloadScreen.tsx     (NEW — E2)
│   ├── SuccessShareScreen.tsx        (NEW — E3)
│   ├── fields/
│   │   ├── FieldText.tsx
│   │   ├── FieldTextarea.tsx
│   │   ├── FieldSelect.tsx
│   │   └── FieldPhoto.tsx
│   └── share/
│       └── ShareButton.tsx
```

Then DELETE the old file:
- `app/c/[slug]/AttendeeClient.tsx` (replaced by AttendeeFlow.tsx)

3B — DATA FLOW

`page.tsx` (existing server component) loads the event from Supabase and passes it as props to `AttendeeFlow`. Keep the page.tsx server-side data loading intact — only adjust the JSX to pass new props if needed.

`AttendeeFlow.tsx` is the client orchestrator:
- Receives event + zones from page.tsx
- Manages screen state: 'arrival' | 'details' | 'preview' | 'success'
- Manages form values: `Record<zoneId, string>`
- Manages photo files + cropped data URLs: `Record<zoneId, { file: File, croppedDataUrl: string, crop: CropArea }>`
- Manages errors: `Record<zoneId, string>`
- Manages isGenerating, isCropOpen, currentCropZoneId
- Calls `/api/render` when the user submits → receives PNG blob → moves to preview screen
- Triggers download from preview screen → moves to success screen

Use plain React `useState` for state. No Redux, no Zustand, no Context.

3C — RESPONSIVENESS (ONE COMPONENT, ADAPTS VIA TAILWIND)

Each screen is ONE component that uses responsive classes:
- Default = mobile (375px viewport)
- `sm:` = ≥640px (tablet)
- `lg:` = ≥1024px (desktop, two-column layouts)

Layout patterns per screen:

ARRIVAL (E0):
- Mobile: vertical stack — brand strip → card (~250px wide) → headline → CTA → trust line
- Desktop: two columns — card LEFT (60%) → text + CTA + 3 trust badges RIGHT (40%)

DETAILS FORM (E1):
- Mobile: vertical — mini brand strip → live preview card → form (numbered sections) → sticky bottom CTA
- Desktop: two columns — preview LEFT (55%) → form RIGHT (45%) with inline CTA, no sticky bar
- Live preview MUST update as user types (debounced ~80ms)

PHOTO CROP MODAL (E1.5):
- Mobile / tablet: full-screen sheet with ink-80 backdrop
- Desktop: centered 600px-wide dialog
- Use react-easy-crop component
- Crop shape matches the photo zone shape (circle / square / rounded / hex)
- Zoom slider 1x – 3x with primary-color thumb
- Helper text and badge inside ("CIRCLE · MATCHES CARD ZONE")
- Two buttons: secondary "Re-upload" + primary "Use this photo"
- Returns a cropped image as base64 data URL to AttendeeFlow

PREVIEW & DOWNLOAD (E2):
- Mobile: vertical — "Looks great." headline → MASSIVE card (~85% width) → Download CTA → "← Edit my info" → 6-platform share row
- Desktop: two columns — card LEFT → text + CTA + share row RIGHT, with "Saved to your photos" toast on download

SUCCESS / VIRAL SHARE (E3):
- Mobile: vertical — gold-ringed badge → "Card saved" → smaller card → caption helper card → 3 stacked platform CTAs → secondary share row → "Know someone else attending?" forward card
- Desktop: two columns — card + file metadata LEFT → caption + share buttons + forward RIGHT

3D — KEY IMPLEMENTATION DETAILS

EventCardPreview component:
- Accepts `event`, `zoneValues`, `photoUrls` as props
- Renders the background image with `aspect-ratio` from event.background_width / event.background_height
- Maps each zone using percentage positioning:
  ```
  left: (zone.x / event.background_width) * 100 + '%'
  top: (zone.y / event.background_height) * 100 + '%'
  width: (zone.w / event.background_width) * 100 + '%'
  height: (zone.h / event.background_height) * 100 + '%'
  ```
- For text zones: render `zoneValues[zone.id]` styled with zone.font / zone.size / zone.weight / zone.color / zone.align
- For photo zones: render `photoUrls[zone.id]` clipped to zone.shape (circle/square/rounded/hex)
- Empty photo zones show a placeholder (cream background + Lucide ImageIcon)

Live preview update logic:
- When user types in a text field → update `values[zoneId]` → preview re-renders within 100ms
- When user uploads a photo + confirms crop → update `photoUrls[zoneId]` → preview shows the cropped image

Form validation:
- Use react-hook-form + zod (already in project)
- Required zones must have non-empty values OR an uploaded photo
- Email-type zones validate email format
- Errors render inline below each field with danger color + AlertCircle icon

Share button URLs:
- WhatsApp: `https://wa.me/?text=${encodeURIComponent(caption + ' ' + window.location.href)}`
- X / Twitter: `https://twitter.com/intent/tweet?text=${encodeURIComponent(caption)}&url=${window.location.href}`
- Facebook: `https://www.facebook.com/sharer/sharer.php?u=${window.location.href}&quote=${encodeURIComponent(caption)}`
- LinkedIn: `https://www.linkedin.com/sharing/share-offsite/?url=${window.location.href}`
- Instagram: show a small dialog explaining the photo is in camera roll, with an "Open Instagram" deeplink (`instagram://story-camera`)
- Copy Link: writeText + show "Copied!" feedback for 1.5s
- Mobile: prefer `navigator.share()` when available

3E — INCREMENTAL COMMITS

Commit after each major piece (so we can roll back specific parts if needed):
- `feat(attendee): scaffold AttendeeFlow + EventCardPreview + EventBrandStrip`
- `feat(attendee): implement E0 ArrivalScreen with responsive layouts`
- `feat(attendee): implement field primitives (text, textarea, select, photo)`
- `feat(attendee): implement E1 DetailsFormScreen with live preview + validation`
- `feat(attendee): implement E1.5 PhotoCropModal with react-easy-crop`
- `feat(attendee): implement E2 PreviewDownloadScreen with inline share row`
- `feat(attendee): implement E3 SuccessShareScreen with caption helper + viral CTAs`
- `feat(attendee): delete old AttendeeClient.tsx, wire new flow into page.tsx`

────────────────────────────────────────────
STEP 4 — REGRESSION TESTING (CRITICAL — DO NOT SKIP)
────────────────────────────────────────────

After all attendee screens are built, you MUST verify nothing else broke.

4A — EDITOR REGRESSION TEST

Start dev server. Log in as a designer. Walk through:
- Open the dashboard → does it load with new brand?
- Create a new event → upload a design → can you add zones?
- Drag a zone, resize, change properties → all still work?
- Auto-save fires (check Supabase events table for updates)?
- Undo / redo still work?
- Publish the event → still generates a slug + URL?

If ANY editor functionality broke, STOP and revert the Step 1C changes that touched CanvasEditor.tsx. The rule was: colors only, no logic.

4B — ATTENDEE FLOW TEST

On the published event from 4A, open the public share link:
- E0: arrival screen loads, event branding correct, card preview visible
- E1: form renders, fields match the zones defined in the editor, live preview updates as you type
- E1.5: photo upload opens crop modal, crop shape matches zone shape
- E2: preview screen shows the rendered card from /api/render
- The downloaded PNG visually matches the on-screen preview
- E3: success screen shows, caption copy works, share buttons render

4C — DATA CONTRACT TEST (THE CRITICAL ONE)

Take an event created BEFORE this session (already in the database from previous work):
- Open its public share link
- Confirm it renders correctly in the new attendee experience
- All zones load with correct positions, fonts, colors, shapes
- The render output still matches the preview

This proves the editor → attendee data contract is preserved.

4D — VISUAL REGRESSION (LIGHT TOUCH)

Walk through every page once to make sure brand cleanup didn't break visuals:
- Landing page (/)
- Pricing page (/pricing)
- Login (/login)
- Signup (/signup)
- Dashboard (/dashboard)
- Event detail (/events/[id])
- Editor (/events/[id]/edit)
- Publish (/events/[id]/publish)
- Public attendee (/c/[slug])

For each: confirm no purple/pink remains, no broken layouts, no missing styles.

────────────────────────────────────────────
STEP 5 — DEPLOY
────────────────────────────────────────────

When local tests all pass:
- Commit any final fixes
- Push to master: `git push origin master`
- Wait for Vercel auto-deploy (~2 minutes)
- Test live URL at https://cardly-two.vercel.app on mobile (real phone)

────────────────────────────────────────────
STEP 6 — FINAL REPORT
────────────────────────────────────────────

Give me:
1. List of all files changed (count + paths)
2. Confirmation that everything outside the allowed list was NOT touched
3. Confirmation that the editor still works (test results from 4A)
4. Confirmation that existing events still render in the new attendee experience (test 4C)
5. Live URL of a test event to walk through on my phone
6. Any places the design didn't translate cleanly and how you decided

────────────────────────────────────────────
HARD CONSTRAINTS — DO NOT VIOLATE
────────────────────────────────────────────

1. Stay on `master` branch. Do NOT merge from `main` or open PRs to `main`.
2. Do NOT install any package other than `react-easy-crop`.
3. Do NOT modify ANY file in the forbidden list (re-read the boundaries at the top if needed).
4. Do NOT change the editor's drag/resize/zoom/state/keyboard/auto-save logic — ONLY swap colors in CanvasEditor.tsx.
5. Do NOT change the database schema, RLS policies, or the Zone TypeScript type.
6. Do NOT change /api/render logic — it must continue producing PNGs that match the new preview.
7. The new attendee design REPLACES the old AttendeeClient.tsx — delete the old file when fully ready.
8. Use TypeScript strict mode. Type every prop, zone shape, event data.
9. Lucide-react icons only. Convert inline SVGs from reference designs to Lucide.
10. Test on a real existing published event before declaring done.

────────────────────────────────────────────
START
────────────────────────────────────────────

Begin with Step 0 (read files + produce written plan with ALL 9 sections A-I). Do not write any code until I explicitly approve the plan.
```

---

## End of prompt — what happens next

After Claude Code presents its plan (Step 0), review it carefully. Look for:

✅ **Good signs:**
- Lists all 5 attendee screens by name
- Mentions reading BRAND.md and the 6 specific JSX files in `Cardly-handoff/Cardly/project/`
- Explicit ISOLATION CONFIRMATION section listing what it will/won't touch
- DATA CONTRACT CONFIRMATION section explaining how it'll consume Supabase data
- Plans to install only `react-easy-crop`
- Knows to stay on master branch
- Includes EDITOR REGRESSION TEST PLAN
- Lists specific files in the touch list (limited to allowed scope)

🚫 **Red flags — push back hard:**
- Suggests touching the editor, dashboard, auth, or API routes (beyond brand tokens)
- Wants to add new shadcn components or libraries
- Wants to change the Zone type or database schema
- Plans to "while we're here" improve anything outside scope
- Wants to "simplify" or "improve" CanvasEditor.tsx beyond color swaps
- Plans to merge from main or change branches

When the plan looks right, reply: `Approved. Begin Step 1 (brand token migration). Show me the diff before committing each phase.`

---

## After Claude Code completes Steps 1–6

1. **Read the final report carefully** — especially the editor regression test results
2. **Test on YOUR phone** — open the live URL, run through E0 → E3
3. **Test the editor too** — make sure dragging zones, auto-save, undo/redo all still work
4. **Test an OLD event** (created before this session) on the new attendee flow — proves the data contract holds
5. **Send the live URL to ONE real person** in your network
6. **Watch them use it** — write down what trips them up

That's the real finish line. The product is no good until someone outside your head uses it and tells you what works.
