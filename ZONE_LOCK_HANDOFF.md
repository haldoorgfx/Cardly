# CARDLY — ZONE LOCK FEATURE HANDOFF

**Add the ability for organizers to lock zones so attendees cannot edit them. Locked zones use the organizer's pre-set values. If all zones are locked, the attendee skips the form entirely and downloads the card as-is. SCOPED: editor + attendee flow + render API. Marketing and dashboard untouched.**

---

## How to use

1. Make sure you're on master and clean:
   ```
   cd C:\Users\cabda\cardly
   git checkout master
   git pull origin master
   git status
   ```

2. Open Claude Code (fresh session), paste the prompt block below.

---

## THE PROMPT — PASTE EVERYTHING BELOW INTO CLAUDE CODE

```
We are adding a "zone lock" feature so event organizers can mark zones as non-editable by attendees. This unlocks share-only campaigns where attendees don't need to personalize anything — they just download and share. Per-zone toggle + a "Lock all zones" convenience button. The attendee experience auto-adapts.

────────────────────────────────────────────
ABSOLUTE NON-NEGOTIABLE BOUNDARIES
────────────────────────────────────────────

You ARE allowed to touch:
- components/editor/** (CanvasEditor.tsx + chrome + sidebar)
- app/c/[slug]/AttendeeFlow.tsx
- app/c/[slug]/components/DetailsFormScreen.tsx
- app/c/[slug]/components/PreviewDownloadScreen.tsx
- app/c/[slug]/[variantSlug]/page.tsx (read-only check)
- app/api/render/route.ts (render must use locked zone values, not attendee values)
- types/database.ts (only to update the Zone TypeScript shape — JSONB column, no SQL migration needed)
- lib/zones/** if it exists

You are FORBIDDEN from touching:
- app/(marketing)/** (all marketing pages)
- app/(auth)/** (signup/login)
- app/(app)/** (dashboard, event creation flow — except the editor itself)
- middleware.ts
- lib/supabase/** (Supabase clients)
- supabase/migrations/** (no DB schema migration needed — zones is JSONB)
- tailwind.config.ts, app/globals.css
- BRAND.md, CLAUDE.md

If you find yourself needing to touch anything outside the allowed list, STOP and ask.

────────────────────────────────────────────
STEP 0 — READ FIRST, PRODUCE WRITTEN PLAN
────────────────────────────────────────────

Read these files completely:

1. CLAUDE.md (project rules)
2. types/database.ts (current Zone type)
3. components/editor/CanvasEditor.tsx (main editor)
4. components/editor/rightSidebar/RightSidebar.tsx (context-switching panels)
5. components/editor/rightSidebar/* — all panel files (TextZonePanel, PhotoZonePanel, etc.)
6. components/editor/chrome/TopBar.tsx
7. components/editor/chrome/BottomBar.tsx
8. components/editor/leftRail/LeftRail.tsx
9. app/c/[slug]/AttendeeFlow.tsx
10. app/c/[slug]/components/DetailsFormScreen.tsx
11. app/c/[slug]/components/PreviewDownloadScreen.tsx
12. app/api/render/route.ts

Produce a written plan with these sections:

A. SUMMARY: 3 sentences describing the feature in plain English.

B. ISOLATION CONFIRMATION: explicitly list what you will and will not touch.

C. ZONE TYPE UPDATE: confirm the current Zone shape and how you'll add the `locked: boolean` field. Since zones live in a JSONB column, no SQL migration is needed — only TypeScript type update + default value handling for existing zones (treat undefined as `locked: false`).

D. EDITOR UI CHANGES:
   - Where the per-zone lock toggle will live in the right sidebar (each zone panel: TextZonePanel, PhotoZonePanel, CustomFieldPanel)
   - Where the "Lock all zones" button will live (suggest: BottomBar or TopBar — pick one and justify)
   - Visual indicator on the canvas for locked zones (lock icon overlay)
   - Whether locked zones can still be selected and moved by the organizer (YES — organizer can do anything; "locked" only affects attendees)

E. ATTENDEE FLOW LOGIC:
   - Decision tree: if ALL zones in the active variant are locked → AttendeeFlow skips DetailsFormScreen entirely, goes from ArrivalScreen → PreviewDownloadScreen
   - If SOME zones are locked → DetailsFormScreen filters them out, only renders form fields for unlocked zones
   - Locked zones still appear in the live preview with the organizer's pre-set values
   - In PreviewDownloadScreen, locked zones show the pre-set values (not attendee input)

F. RENDER API CHANGES:
   - When generating the final PNG, for each zone:
     - If zone.locked === true → use the pre-set value from the zone definition (zone.value or zone.text or zone.imageUrl)
     - If zone.locked === false → use attendee-submitted value (current behavior)
   - The render endpoint never trusts attendee input for locked zones

G. EDGE CASES:
   - Variant switching: lock state is per-zone, not per-variant — confirm or change
   - Zone duplication: a duplicated zone inherits the locked state
   - Backwards compatibility: existing events without `locked` field treat all zones as unlocked (current behavior)
   - Required zones that are locked: locked overrides required — they're not collected from attendee
   - Photo zones: when locked, the organizer's pre-set image is used; attendee doesn't see upload UI

H. UI MICROCOPY:
   - The toggle label in the editor sidebar (suggest: "Attendees can edit this zone" with description below)
   - The "Lock all" button label (suggest: "Make share-only" — flips all zones to locked)
   - Attendee-facing copy when all zones locked: ArrivalScreen CTA changes to "Get my card" (instead of "Get Started")
   - Empty form state: never show "no fields to fill in" — attendee just doesn't see the form step

I. REGRESSION TEST PLAN:
   - Existing published events (no `locked` field on zones) → must still work exactly as before
   - Editor: lock a zone → attendee form skips it → render uses organizer's value
   - Editor: lock all zones → attendee skips form → render produces card with no attendee input
   - Editor: unlock a previously locked zone → attendee form shows it again
   - Variants: lock zones in Variant A, unlock in Variant B → each variant's attendee flow is correct
   - Render API: locked text zone uses zone.value, not attendee POST data
   - Render API: locked photo zone uses zone.imageUrl, not attendee upload
   - Mobile: lock toggle is reachable, "Lock all" button works on mobile

J. OPEN QUESTIONS: anything ambiguous you need clarified before writing code.

WAIT for my approval before writing any code. Do not skip Step 0.

────────────────────────────────────────────
STEP 1 — TYPE UPDATE + DEFAULT HANDLING
────────────────────────────────────────────

After approval:

1. Update the Zone type in types/database.ts (or wherever it lives):
   type Zone = {
     id: string
     type: 'text' | 'photo' | 'custom'
     // ... existing fields
     locked?: boolean  // NEW — defaults to false (undefined treated as false)
     // For locked text zones, `value` or `text` holds the organizer's pre-set value
     // For locked photo zones, `imageUrl` holds the organizer's pre-set image
   }

2. Add a helper utility in lib/zones/ (create if doesn't exist):
   export function isZoneLocked(zone: Zone): boolean {
     return zone.locked === true
   }
   
   export function getUnlockedZones(zones: Zone[]): Zone[] {
     return zones.filter(z => !isZoneLocked(z))
   }
   
   export function allZonesLocked(zones: Zone[]): boolean {
     return zones.length > 0 && zones.every(isZoneLocked)
   }

Commit: feat(zones): add locked field to Zone type with helper utilities

────────────────────────────────────────────
STEP 2 — EDITOR: PER-ZONE LOCK TOGGLE
────────────────────────────────────────────

In each zone panel (TextZonePanel, PhotoZonePanel, CustomFieldPanel) in the right sidebar:

Add a section near the top (above the field-specific properties):

┌─ Editable by attendees ─────────────────┐
│  [Toggle ON ●—]  Attendees can edit this │
│                                          │
│  When off, this zone shows your default  │
│  value on every card.                    │
└──────────────────────────────────────────┘

Wire to update zone.locked. Toggle ON = locked false (editable). Toggle OFF = locked true (not editable).

Commit: feat(editor): per-zone lock toggle in zone property panels

────────────────────────────────────────────
STEP 3 — EDITOR: VISUAL INDICATOR ON CANVAS
────────────────────────────────────────────

On the CanvasEditor.tsx, when rendering a zone that's locked, overlay a small lock icon (Lucide Lock):

- Icon: 14px, position top-right of zone, in primary-soft circle bg
- Tooltip on hover: "Locked — attendees can't edit"
- Visible to organizer in edit mode only (not in preview mode)

This helps organizers see at a glance which zones are locked.

Commit: feat(editor): lock icon indicator on canvas for locked zones

────────────────────────────────────────────
STEP 4 — EDITOR: "LOCK ALL ZONES" BUTTON
────────────────────────────────────────────

Add to BottomBar.tsx (next to existing snap/grid toggles, or in an "Actions" menu):

A button labeled "Make share-only" with a Lock icon.

Behavior:
- Click → confirmation: "Lock all zones in this variant? Attendees won't be able to personalize this card."
- Confirmed → set all zones in the active variant to locked: true
- Re-clicking with all already locked → label changes to "Make personalizable" and unlocks all

Smart label:
- If any zone unlocked → button shows "Make share-only" (Lock icon)
- If all zones locked → button shows "Make personalizable" (Unlock icon)

Commit: feat(editor): add Lock all / Unlock all zones button to BottomBar

────────────────────────────────────────────
STEP 5 — ATTENDEE FLOW: SMART ROUTING
────────────────────────────────────────────

In AttendeeFlow.tsx, after fetching the event/variant zones:

const visibleZones = getUnlockedZones(zones)
const skipForm = visibleZones.length === 0

If skipForm === true:
- ArrivalScreen CTA text becomes "Get my card" (instead of "Get Started")
- Clicking CTA → go directly to PreviewDownloadScreen
- Skip DetailsFormScreen entirely

If skipForm === false:
- Pass visibleZones to DetailsFormScreen (which only renders form fields for these)
- The locked zones still appear in the preview but with pre-set values
- Continue normal flow

In DetailsFormScreen:
- Only render form inputs for the zones in visibleZones (unlocked zones)
- Preview on the right still shows ALL zones — locked ones with their pre-set values, unlocked ones with attendee input

In PreviewDownloadScreen:
- For locked zones, render with the organizer's pre-set value (zone.value, zone.text, zone.imageUrl)
- For unlocked zones, render with attendee-submitted values
- Download button generates PNG using same merge logic

Commit: feat(attendee): smart routing — skip form when all zones locked

────────────────────────────────────────────
STEP 6 — RENDER API: TRUST ZONE.LOCKED
────────────────────────────────────────────

In app/api/render/route.ts:

For each zone in the event:
- If zone.locked === true:
  - Use zone.value for text zones
  - Use zone.imageUrl for photo zones
  - IGNORE any matching attendee-submitted field
- If zone.locked === false || undefined:
  - Use attendee-submitted value (current behavior)

This is the security boundary: even if a malicious attendee POSTs data for a locked zone field, the render endpoint discards it.

Add a brief comment in the render function explaining this.

Commit: feat(render): use organizer pre-set values for locked zones

────────────────────────────────────────────
STEP 7 — TESTING (MANUAL, BEFORE PUSH)
────────────────────────────────────────────

Run pnpm dev. Test in browser:

A. Existing event (created before this feature):
   - Open it in editor → all zones still editable as before
   - Open public link → attendee form shows all fields as before
   - Download → works as before

B. Lock one zone:
   - Open editor, select a zone, toggle "Editable by attendees" OFF
   - Save & publish
   - Open public link in incognito
   - Attendee form should NOT show that zone's field
   - Preview should show the organizer's pre-set value for that zone
   - Download → PNG has organizer's value for locked zone

C. Lock all zones:
   - Click "Make share-only" in BottomBar → confirm
   - All zones get lock icon overlay
   - Save & publish
   - Open public link in incognito
   - ArrivalScreen CTA says "Get my card"
   - Clicking goes directly to PreviewDownloadScreen
   - Download works, PNG has all organizer pre-set values

D. Unlock all:
   - Click "Make personalizable" → all zones unlock
   - Attendee form returns

E. Variants:
   - Switch between variants — lock state is per-zone, persists correctly
   - Different variants can have different lock combinations

F. Edge case — render API security:
   - Lock a text zone
   - Manually POST to /api/render with attendee data trying to override that zone
   - Confirm the response uses the organizer's value, not the attempted override

G. Build:
   - pnpm build → zero errors

────────────────────────────────────────────
STEP 8 — COMMIT, PUSH, DEPLOY
────────────────────────────────────────────

After all tests pass:

1. Verify no forbidden files were touched
2. git status — should show only allowed files modified
3. git push origin master
4. Wait for Vercel deploy (~2-3 minutes)
5. Test on live URL
6. Report back with:
   - Files changed (count + paths)
   - Confirmation forbidden files untouched
   - Test results from Step 7 (A through G)
   - Any decisions made on ambiguous parts

────────────────────────────────────────────
HARD CONSTRAINTS — DO NOT VIOLATE
────────────────────────────────────────────

1. Stay on master. No worktree commits unless absolutely necessary.
2. No new packages.
3. No database schema migrations (zones are JSONB — type-only change).
4. Backwards compatibility is mandatory: existing zones without `locked` field MUST work as before.
5. The render API is the security boundary — never trust attendee input for locked zones.
6. Do NOT change the brand, design tokens, or visual style.
7. Do NOT touch marketing pages, auth, dashboard, render core image logic.
8. Test with pnpm build before pushing.
9. The "Lock all" button must be reversible.
10. Lock state persists through autosave like any other zone property.

────────────────────────────────────────────
START
────────────────────────────────────────────

Begin with Step 0 (read files + written plan with sections A through J). Do not write any code until I explicitly approve the plan.
```

---

## After Claude Code returns the plan

Send me a screenshot of the plan. I'll review with you before you approve.

Same surgical pattern as the previous three handoffs.
