# CARDLY — EDITOR (D2) HANDOFF TO CLAUDE CODE

**This prompt redesigns the existing canvas editor (D2) to match the new design language from Claude Design. It is SCOPED — only the editor's UI is touched. The editor's drag/resize/zoom/save logic stays intact. The attendee experience, render API, dashboard, and auth are untouched.**

**RUN THIS PROMPT ONLY AFTER the attendee handoff (v3) has been shipped and verified.**

---

## How to use this prompt

1. **PREREQUISITE — verify the attendee handoff already shipped:**
   - Live URL shows the new forest+cream attendee experience (E0 → E3)
   - You've tested it on your phone
   - You've sent it to at least one real person
   - The downloaded PNG matches the live preview

   If any of those isn't true, STOP. Go finish the attendee handoff first. Don't stack incomplete work.

2. **Make sure you're on `master` branch and working tree is clean:**
   ```
   cd C:\Users\cabda\cardly
   git checkout master
   git status   # should say "nothing to commit, working tree clean"
   git pull origin master
   ```

3. The new editor design reference files are already in your project at:
   ```
   C:\Users\cabda\cardly\Cardly-handoff\Cardly\project\
   ```
   The 8 reference files Claude Code will read for the editor redesign:
   - `editor-shared.jsx` (shared tokens, icons, and component primitives)
   - `editor-d21.jsx` (D2.1 — Empty Editor)
   - `editor-d22.jsx` (D2.2 — Text Zone Selected)
   - `editor-d23.jsx` (D2.3 — Photo Zone Selected)
   - `editor-d24.jsx` (D2.4 — Custom Field Dropdown Selected)
   - `editor-d25.jsx` (D2.5 — Multi-Variant Speaker Active)
   - `editor-d26.jsx` (D2.6 — Preview as Attendee Mode)
   - `editor-d27.jsx` (D2.7 — Mobile Fallback)

   The same folder also contains the older attendee reference files (arrival-card.jsx, arrival-screen.jsx, details-screen.jsx, crop-modal.jsx, preview-screen.jsx, success-screen.jsx) and other historical files. Claude Code will be told to IGNORE all non-editor reference files.

4. Open Claude Code (`claude` in PowerShell) and paste the prompt below as your first message.

5. Approve plan steps as Claude Code presents them. Do NOT let it skip ahead — review each phase.

---

## THE PROMPT — PASTE EVERYTHING BELOW THIS LINE INTO CLAUDE CODE

```
We are doing a SCOPED redesign of ONE PART of the Eventera platform: the canvas editor at /events/[id]/edit. The 7 new editor screens have been designed in Claude Design and exported as JSX reference files located in `Cardly-handoff/Cardly/project/`. Your job is to faithfully reimplement those designs as production Next.js components, while preserving every piece of editor LOGIC (drag, resize, zoom, auto-save, undo/redo, keyboard shortcuts) that already works.

This is a UI-only redesign. The editor's behavior must remain identical. We're changing how it LOOKS, not how it WORKS.

────────────────────────────────────────────
ABSOLUTE NON-NEGOTIABLE BOUNDARIES
────────────────────────────────────────────

You ARE allowed to touch ONLY:
- `app/(app)/events/[id]/edit/page.tsx` and any client component(s) that page renders
- `components/editor/CanvasEditor.tsx` — refactor / replace the editor chrome (sidebars, panels, top bar, bottom bar), BUT preserve all the core canvas interaction logic (drag, resize, zoom, snap, autosave, undo/redo). See "EDITOR LOGIC PRESERVATION CONTRACT" below.
- New component files inside `components/editor/` for split-out panels (e.g., `LeftRail.tsx`, `RightSidebar/EventPanel.tsx`, etc.)
- New component files inside `app/(app)/events/[id]/edit/` if the page needs orchestrating components
- `tailwind.config.ts` — only if a new utility is needed (and only with my approval)

You are FORBIDDEN from touching:
- `app/c/[slug]/**` — the attendee experience (just shipped, do NOT regress it)
- `app/api/render/route.ts` — the server-side PNG render endpoint
- `app/api/events/**` — event CRUD API
- `app/api/upload/**` — file upload API
- `app/(app)/dashboard/**` — dashboard
- `app/(app)/events/[id]/page.tsx` — event detail page (read-only summary)
- `app/(app)/events/[id]/publish/**` — publish flow
- `app/(app)/events/new/**` — event creation flow
- `app/(auth)/**` — signup, login, logout
- `app/(marketing)/**` — landing page, pricing
- `middleware.ts` — auth middleware
- `lib/supabase/**` — Supabase client/server helpers
- `supabase/migrations/**` — database schema
- `types/database.ts` — type definitions (READ ONLY — do NOT change Zone, Event, Variant shapes)
- `scripts/**`, `vercel.json`, `next.config.mjs`, `tsconfig.json`
- `app/globals.css` — already cleaned in the attendee handoff, don't touch
- `Cardly-handoff/**` — design reference folder (READ-ONLY)

If you find yourself wanting to "improve" anything outside the allowed list — STOP and ask me first.

────────────────────────────────────────────
EDITOR LOGIC PRESERVATION CONTRACT (CRITICAL)
────────────────────────────────────────────

The current `CanvasEditor.tsx` has working implementations of:
- Zone dragging (mouse + keyboard arrow nudge)
- Zone resizing via 8 corner/edge handles
- Zone selection (single + multi if implemented)
- Zone deletion (Delete/Backspace key)
- Zone duplication (Cmd/Ctrl + D)
- Undo / redo (Cmd/Ctrl + Z, Shift+Cmd/Ctrl + Z)
- Layer order (bracket keys [ and ])
- Auto-save with 800ms debounce to Supabase
- Zoom in/out (Cmd/Ctrl + +/-)
- Grid toggle (G key)
- Snap-to-zone alignment guides
- Pan (space + drag)
- Click-empty-canvas to deselect

ALL of these must continue working IDENTICALLY after the redesign. If you change any of these, the user (Abdalla) will be furious and Claude Code will be reverted.

What you ARE redesigning:
- The visual chrome around the canvas: left rail, top bar, bottom bar, right sidebar
- How the right sidebar adapts based on what's selected (context-switching panel)
- The Layers panel (currently a stub, needs real list)
- The variants tabs row
- The Preview-as-Attendee mode
- The save status indicator
- The mobile fallback screen
- Visible undo/redo buttons in the top bar
- Background management UI placement (move from left rail to right sidebar)
- Decorative shapes section (demote to collapsible)

What you are NOT redesigning:
- The canvas itself — zones still render at percent-based positions over the background image
- The drag/resize handles' visual style can be lightly polished but must remain functional (8 handles per zone, cursor changes per handle position)
- Any state management, debouncing, or Supabase write logic

If something is ambiguous about whether it's "chrome" or "logic," ASK ME before changing it.

────────────────────────────────────────────
STEP 0 — READ FIRST
────────────────────────────────────────────

Read these in order, completely. Do not skip.

1. CLAUDE.md (project rules)
2. BRAND.md (brand system — locked tokens)
3. `tailwind.config.ts` (current config — confirm forest+cream tokens are in place from previous session)
4. `app/globals.css` (cleaned already in attendee handoff — confirm and use as-is)
5. `types/database.ts` (READ ONLY — Zone, Event, Variant shapes; do not modify)
6. `app/(app)/events/[id]/edit/page.tsx` (current editor route)
7. `components/editor/CanvasEditor.tsx` (current editor — understand ALL its logic before touching anything; document what each useState, useRef, useEffect, and useCallback does so you don't accidentally remove behavior)
8. `app/c/[slug]/AttendeeFlow.tsx` (READ ONLY — to understand the data contract the editor produces for attendees to consume)
9. `Cardly-handoff/Cardly/project/editor-shared.jsx` (NEW design — shared tokens, icons, primitives)
10. `Cardly-handoff/Cardly/project/editor-d21.jsx` (NEW design — D2.1 Empty Editor)
11. `Cardly-handoff/Cardly/project/editor-d22.jsx` (NEW design — D2.2 Text Zone Selected)
12. `Cardly-handoff/Cardly/project/editor-d23.jsx` (NEW design — D2.3 Photo Zone Selected)
13. `Cardly-handoff/Cardly/project/editor-d24.jsx` (NEW design — D2.4 Custom Field Dropdown)
14. `Cardly-handoff/Cardly/project/editor-d25.jsx` (NEW design — D2.5 Multi-Variant Speaker Active)
15. `Cardly-handoff/Cardly/project/editor-d26.jsx` (NEW design — D2.6 Preview as Attendee Mode)
16. `Cardly-handoff/Cardly/project/editor-d27.jsx` (NEW design — D2.7 Mobile Fallback)

IMPORTANT: `Cardly-handoff/Cardly/project/` also contains older attendee design files (arrival-card.jsx, arrival-screen.jsx, details-screen.jsx, crop-modal.jsx, preview-screen.jsx, success-screen.jsx), an `ios-frame.jsx`, a `design-canvas.jsx`, and historical HTML mockups (A1-A2, B1, C1-C3, D1-D3, F1-F3, etc.). DO NOT read those — they are out of scope for this session. Only the 8 editor JSX files above are relevant.

After reading, produce a written plan with these sections:

A. SUMMARY: 3 sentences describing what will happen in this session.
B. ISOLATION CONFIRMATION: explicitly list what you will and will not touch (mirror the boundaries above).
C. LOGIC PRESERVATION CONFIRMATION: enumerate every editor behavior in CanvasEditor.tsx (drag, resize, undo, autosave, etc.) and confirm each will be preserved unchanged. Cite line numbers in the current CanvasEditor.tsx for each behavior.
D. NEW UI ARCHITECTURE: a tree showing all new component files you'll create (LeftRail, RightSidebar with context panels, TopBar, BottomBar, VariantsTabs, LayersPanel, etc.) and what each renders.
E. STATE MIGRATION PLAN: which pieces of state move from the monolithic CanvasEditor.tsx into smaller components, and which stay at the top level.
F. DATA CONTRACT CONFIRMATION: confirm Zone, Event, and Variant types will be consumed as-is, no schema changes. If variants don't yet exist in the schema (single-variant events only), confirm whether you'll need to ADD a variants concept and how (this is a real architectural question — ASK before adding tables).
G. NEW DEPENDENCIES: list any new packages. There should be NONE unless explicitly justified.
H. RISK LIST: what could break (the editor's interaction model, attendee data, render API) and how you'll prevent each.
I. REGRESSION TEST PLAN: how you'll verify after the redesign that (1) all editor logic still works, (2) the attendee experience still loads correctly using events created in the new editor, (3) the render API still produces correct PNGs.
J. OPEN QUESTIONS: anything in the design files that's ambiguous when applied to real event data.

DO NOT WRITE ANY CODE YET. Wait for my "approved" before moving to Step 1.

────────────────────────────────────────────
STEP 1 — STATE INVENTORY OF CURRENT EDITOR
────────────────────────────────────────────

Before touching CanvasEditor.tsx, document its full state model in a comment block at the top of the file:

```
// CARDLY CANVAS EDITOR — STATE & BEHAVIOR INVENTORY
// (documented before refactor — do not remove any of this functionality)
//
// State:
//   zones: Zone[]                — line N
//   selectedId: string | null    — line N
//   zoom: number                 — line N
//   ... (full list)
//
// Behaviors:
//   handleDrag                   — line N (mouse drag a zone to reposition)
//   handleResize                 — line N (8-handle resize)
//   undo                         — line N (Cmd+Z, restores past state)
//   ... (full list)
```

Commit this documentation pass FIRST as a separate commit: `chore(editor): document current state and behaviors before refactor`.

────────────────────────────────────────────
STEP 2 — EXTRACT EDITOR CHROME INTO COMPONENTS
────────────────────────────────────────────

Refactor CanvasEditor.tsx to lift the "chrome" (panels, bars, sidebars) into their own components, keeping all the canvas interaction LOGIC at the top level. Suggested structure:

```
components/editor/
├── CanvasEditor.tsx                ← top-level, owns state + canvas
├── chrome/
│   ├── TopBar.tsx                   ← back btn, breadcrumb, undo/redo, save status, Preview/Test/Publish
│   ├── BottomBar.tsx                ← zoom, Fit, Grid, Snap, pan hint
│   ├── VariantsTabs.tsx             ← variant pills + Add variant
│   └── MobileFallback.tsx           ← <768px nudge
├── leftRail/
│   ├── LeftRail.tsx                 ← container
│   ├── AddElementSection.tsx        ← Text field, Photo zone, Custom field, Static text, Image
│   └── DecorativeShapesSection.tsx  ← collapsible Rectangle/Circle/Triangle/Line
├── rightSidebar/
│   ├── RightSidebar.tsx             ← container, switches panel based on selection
│   ├── panels/
│   │   ├── EventPanel.tsx           ← when nothing selected
│   │   ├── TextZonePanel.tsx        ← when a text zone is selected
│   │   ├── PhotoZonePanel.tsx       ← when a photo zone is selected
│   │   ├── CustomFieldPanel.tsx     ← when a custom field is selected
│   │   ├── StaticTextPanel.tsx      ← when a static text is selected
│   │   ├── ImagePanel.tsx           ← when an image element is selected
│   │   ├── VariantPanel.tsx         ← when a variant tab is active (no zone selected)
│   │   └── MultiSelectPanel.tsx     ← when multiple zones are selected (if multi-select exists)
│   ├── LayersPanel.tsx              ← list of zones with visibility/lock/reorder
│   └── ShortcutsPanel.tsx           ← keyboard shortcut reference
└── preview/
    ├── PreviewMode.tsx              ← D2.6 preview-as-attendee mode
    └── TestDataPanel.tsx            ← sidebar inside preview mode
```

Each component receives the data and callbacks it needs as props from `CanvasEditor.tsx`. The canvas itself (the actual drag/resize/render area) stays where it is — only the surrounding UI is decomposed.

Commit incrementally:
- `feat(editor): extract TopBar with undo/redo and save status`
- `feat(editor): extract BottomBar with zoom/grid/snap controls`
- `feat(editor): extract LeftRail with ADD ELEMENT sections`
- `feat(editor): extract VariantsTabs row`
- `feat(editor): extract RightSidebar with context-switching panel`
- `feat(editor): implement EventPanel + TextZonePanel + PhotoZonePanel + CustomFieldPanel + StaticTextPanel + ImagePanel`
- `feat(editor): implement LayersPanel with real layer list`
- `feat(editor): implement MobileFallback for <768px`
- `feat(editor): implement PreviewMode with TestDataPanel`

After each commit, verify the editor still works locally (drag a zone, resize it, undo, save).

────────────────────────────────────────────
STEP 3 — KEY DESIGN DETAILS TO MATCH FROM REFERENCE
────────────────────────────────────────────

From `editor-shared.jsx`, extract the design tokens and primitives. Do NOT just copy the code verbatim — adapt the patterns to Tailwind classes and the existing brand tokens.

From each editor-dXX.jsx file, match these specific details:

DENSITY:
- Section labels: 10px JetBrains Mono uppercase, letter-spacing 0.08em, muted color
- Inputs: 36px height, rounded-md (6px), border-border, focus ring forest green
- Panel cards: bg-surface, border-border, rounded-xl (12px), padding 14-16px
- Each property group is its own card

TOP BAR:
- Left: back arrow icon, "Events" link, "/", event name (truncated if long)
- Center: empty
- Right: undo/redo icon buttons (with disabled state), save status pill ("✓ Saved 2s ago" in success color), Preview button (with ⌘P kbd hint), Test button (play icon), Publish button (forest green primary)

VARIANTS TABS:
- Pills with variant name + zone count badge (e.g., "Attendee · 3")
- Active variant: forest green underline, primary text
- Inactive variants: muted text, surface bg
- "+ Add variant" button at the right of the tabs

CANVAS:
- Cream background with subtle dotted grid
- Canvas dimensions label floating above the artwork ("canvas 1080 × 1920 px | 31%")
- Empty state: "NO ZONES YET" badge centered on the artwork
- Bottom hint when empty: "Start by adding a text field or photo zone from the left."

ZONE OVERLAY ON CANVAS:
- Floating zone label badge above selected zone (e.g., "T full_name · text · req")
- 8 resize handles in primary green color
- Dimensions readout at the bottom-right of the bounding box (e.g., "920 × 200")
- Dashed border for unselected zones, solid for selected

RIGHT SIDEBAR:
- Header shows breadcrumb when a zone is selected (e.g., "EVENT / ATTENDEE" with back chevron)
- Below breadcrumb: zone type icon + label + zone ID badge (e.g., "TEXT ZONE / Full Name / #z_01")
- Each property group is mono uppercase label + white surface card with controls
- Position panel: 2x2 grid of X/Y (top row) and W/H (bottom row), mono number inputs
- Layer order: 4 small icon buttons in a 2x2 grid (or 4 in a row)
- Actions row at the bottom: Duplicate / Lock / Delete

LAYERS PANEL (D2.x):
- Each layer row: type icon + label + (eye, lock) icons on the right
- Click to select, drag handle on the left to reorder
- Highlighted state on the currently selected layer (primary-soft bg)

SHORTCUTS PANEL:
- Header "SHORTCUTS" mono uppercase
- 2-column layout: action label (left) + kbd badge(s) (right)
- Use a small `<kbd>` style: bg-cream, border-border, mono, rounded-md, padding 2px 6px

MOBILE FALLBACK (D2.7):
- Centered card, max-width 360px
- "EDITOR · DESKTOP REQUIRED" label
- Monitor icon in primary-soft circle, small phone "no" indicator
- Heading "The editor works best on a laptop"
- Body text explaining
- Event reference card showing organizer logo + event name + cardly.io/edit/[slug]
- "Copy event link" primary CTA
- "View as attendee" secondary CTA
- "Editing on phone · coming later" pill at the bottom

────────────────────────────────────────────
STEP 4 — VARIANTS HANDLING
────────────────────────────────────────────

The new designs show MULTI-VARIANT support (Attendee, Speaker, Sponsor, with different zones per variant).

Check first: does the database schema already support variants? Read `types/database.ts` and `supabase/migrations/**`.

If variants do NOT exist in the schema:
- ASK ME before adding them
- I will decide whether to add a variants table now or treat the editor as single-variant for this redesign

If variants DO exist in the schema:
- Use them. Render the variant tabs. Switching tabs swaps the active variant's zones on the canvas.

If we're going single-variant for now:
- Render the variant tabs as designed for visual consistency, but only "Attendee" is functional
- "+ Add variant" can be visible but disabled with a tooltip: "Multi-variant coming soon"

────────────────────────────────────────────
STEP 5 — REGRESSION TESTING (CRITICAL — DO NOT SKIP)
────────────────────────────────────────────

After all editor screens are built, you MUST verify:

5A — EDITOR BEHAVIOR REGRESSION:
- Open an existing event in the editor
- Drag a zone → it repositions, autosave fires after 800ms
- Resize a zone via corner handle → it resizes correctly
- Select another zone → right sidebar context-switches to new zone's properties
- Click empty canvas → deselects, right sidebar shows EventPanel
- Press Cmd+Z → undoes
- Press Cmd+Shift+Z → redoes
- Press Cmd+D → duplicates selected zone
- Press Delete → deletes selected zone
- Press G → toggles grid
- Press [ / ] → adjusts layer order
- Press Cmd+P → enters preview-as-attendee mode
- Type in the test data panel → live preview updates
- Click "Back to Edit" → exits preview mode

5B — ATTENDEE EXPERIENCE REGRESSION:
- Take an event you just edited in the new editor
- Publish it → open the public attendee link
- Confirm zones render at correct positions
- Confirm photo zones show correct shapes
- Confirm the downloaded PNG still matches the live preview
- If ANY of those break, you've changed the data contract somewhere — revert and fix

5C — MOBILE FALLBACK:
- Open the editor URL in a viewport ≤767px
- Confirm the mobile fallback screen renders correctly
- Confirm "Copy event link" copies the right URL
- Confirm "View as attendee" navigates to the public `/c/[slug]` page

5D — VISUAL POLISH SWEEP:
- Walk through each major editor state (empty, text selected, photo selected, custom field selected, variant switched, preview mode)
- Compare against the corresponding editor-dXX.jsx reference
- Note any drift and fix or document

────────────────────────────────────────────
STEP 6 — DEPLOY & REPORT
────────────────────────────────────────────

When all local tests pass:
- `git push origin master`
- Wait for Vercel auto-deploy (~2 minutes)
- Verify on https://cardly-two.vercel.app

Then give me:
1. List of all files changed (count + paths)
2. Confirmation that nothing forbidden was touched
3. Confirmation that all editor behaviors still work (test results from 5A)
4. Confirmation that the attendee experience still works (test 5B)
5. Live URL of an event to test in the editor and as an attendee
6. Any decisions made on ambiguous parts

────────────────────────────────────────────
HARD CONSTRAINTS — DO NOT VIOLATE
────────────────────────────────────────────

1. Stay on `master` branch. Do NOT merge from `main` or open PRs to `main`.
2. Do NOT install any new packages without my approval.
3. Do NOT modify ANY file in the forbidden list (re-read the boundaries at the top).
4. Do NOT remove or alter any editor BEHAVIOR — drag, resize, undo, autosave, keyboard shortcuts, snap, zoom, pan, etc. UI redesign only.
5. Do NOT change the database schema or RLS policies.
6. Do NOT change the Zone, Event, or Variant TypeScript types.
7. Do NOT change /api/render or /api/events logic.
8. The new editor REPLACES the old monolithic CanvasEditor.tsx UI — refactor it into smaller components but preserve all its logic.
9. Use TypeScript strict mode. Type every prop.
10. Lucide-react icons only. Convert inline SVGs from reference designs to Lucide where equivalents exist.
11. Test by editing a real existing event and confirming the public attendee page still works perfectly.

────────────────────────────────────────────
START
────────────────────────────────────────────

Begin with Step 0 (read files + produce written plan with ALL 10 sections A-J). Do not write any code until I explicitly approve the plan.
```

---

## End of prompt — what happens next

When Claude Code finishes Step 0, review the plan for:

✅ **Good signs:**
- 10 plan sections (A-J), all present and substantive
- Section B (ISOLATION) explicitly lists CanvasEditor.tsx as the ONLY editor file being significantly touched
- Section C (LOGIC PRESERVATION) enumerates editor behaviors with line numbers from the current code
- Section D (NEW UI ARCHITECTURE) shows a clean component tree for the chrome
- Section F (DATA CONTRACT) handles the variants question — either confirms variants exist or asks before adding them
- Section H (RISK LIST) names specific risks like "could break drag if I miss this"
- Section I (REGRESSION TEST PLAN) includes attendee experience verification

🚫 **Red flags — push back hard:**
- Wants to rewrite CanvasEditor.tsx from scratch (should refactor, not rewrite — preserve logic)
- Plans to touch the attendee pages, render API, or auth
- Adds new libraries without justification
- Wants to change the database schema without asking
- Plans to "while we're here" improve anything outside scope
- Doesn't address the variants question

When the plan looks right, reply: `Approved. Begin Step 1 (state inventory). Show me the diff before committing each phase.`

---

## After Claude Code completes Steps 1–6

1. **Test the editor on your laptop** — drag zones, resize, undo, save, change properties
2. **Test an EXISTING event** in the new editor (proves data contract holds)
3. **Test the attendee experience** for the same event (proves no regression there)
4. **Test the mobile fallback** by opening the editor URL on your phone
5. **Open the live URL on your phone** and walk through both designer + attendee flows
6. **Send the URL to one real person** — the actual finish line for this whole project

---

## Order reminder

```
WEEK 1 (this week):
1. Ship the ATTENDEE handoff (v3) ← YOU ARE HERE OR JUST AFTER
2. Test the attendee experience on phone
3. Send URL to one real person, get feedback

WEEK 2 (after attendee is verified):
4. Ship the EDITOR handoff (this file)
5. Test the editor on laptop
6. Test that existing events still work as attendee experience

WEEK 3:
7. Iterate based on real user feedback
```

Do NOT run this editor handoff prompt before the attendee handoff is fully shipped, tested, and verified.

---

Save this file. Forget it exists until the attendee experience is live and tested. Then come back, run the prerequisite check, and execute.

Goodnight, Abdalla.
