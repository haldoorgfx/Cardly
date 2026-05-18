# CARDLY — EDITOR (D2) DESIGN IMPROVEMENT PROMPT FOR CLAUDE DESIGN

**This is a TARGETED improvement of the existing canvas editor — not a redesign from scratch. The editor already works. We're elevating it to match the polish of the new attendee experience while keeping all the structure and density designers expect from a tool.**

**Run this AFTER the attendee handoff has shipped to production.**

---

## How to use this prompt

1. Open a fresh `claude.ai/design` session
2. Paste the prompt below (everything between the triple backticks)
3. Build screens one at a time, in order
4. Review each before saying "next"
5. After all designs are done → export the JSX → bring it back for a Claude Code handoff prompt

---

## PASTE THIS INTO CLAUDE DESIGN

```
# CARDLY EDITOR (D2) — TARGETED IMPROVEMENT

## CONTEXT

Cardly is a live SaaS at cardly-two.vercel.app. Event organizers and designers upload a branded event design and define editable "zones" (text fields, photo zones, custom fields) that attendees later personalize on their phones.

The editor (called "D2") is the central tool of the platform. It already works well. We're NOT redesigning it from scratch — we're elevating it with targeted improvements to specific weak areas, while preserving everything that already functions.

This is editor design, NOT attendee design. The two should NOT look identical:
- Attendee experience = mobile-first, visual generosity, marketing-feel, one big card hero
- Editor experience = desktop-first, functional density, tool-feel, panels + sidebars

Think Figma / Linear / Notion editor density — not Stripe Checkout calm.

---

## WHO USES THIS EDITOR

A specific person:
- Event organizer, brand manager, or campaign manager
- 25–50 years old
- On a laptop (occasionally tablet, never phone)
- Wants to set up an event's attendee-card in 10 minutes
- May or may not be a designer — should work for both
- Will create multiple events over time, so muscle memory matters
- Needs to clearly see what's editable vs what's locked

---

## THE JOBS THE EDITOR MUST DO

For each job, the design must make it OBVIOUS how to accomplish it.

1. Set up a new event (name, canvas size, background)
2. Add zones (text, photo, custom field, static text, image)
3. Position and resize zones on the canvas
4. Configure each zone's properties (label, font, color, shape, required)
5. Add variants (Attendee / Speaker / Sponsor / Exhibitor — all using the same background, different zones)
6. Preview what the attendee will see
7. Publish to get a shareable link
8. Manage layer order (which zone sits on top when zones overlap)
9. Undo / redo mistakes
10. See save status (is my work saved?)

---

## WHAT'S ALREADY WORKING (DO NOT CHANGE THESE)

Keep these patterns from the existing editor:

- Top bar: back button + breadcrumb (Events / Event Name) + last-saved time + Preview/Test/Publish buttons
- Left rail: "ADD ELEMENT" section with element types stacked vertically (Text field, Photo zone, Custom field, Static text, Image)
- Center: the canvas with zoom and grid
- Bottom bar: zoom controls, Fit, Grid, Snap, pan
- Right sidebar exists with event metadata
- Variants pill at the top of left rail ("Attendee · + Add variant")
- Keyboard shortcuts as a reference column on the right

DO NOT change:
- The overall 3-column layout (left rail / canvas / right sidebar)
- The Top bar structure
- The Bottom bar structure
- The keyboard shortcuts displayed

---

## WHAT'S WEAK / MISSING (THIS IS WHERE WE IMPROVE)

These are the targeted improvements:

### Gap 1 — Right sidebar doesn't adapt to selection

Currently the right sidebar shows static event metadata. It should change context based on what's selected:

- Nothing selected → Event info panel (name, canvas, background, zones count, variants, status, publish action)
- Text zone selected → Text zone properties panel (label, placeholder, font, size, weight, color, alignment, required, validation, layer order, duplicate/delete)
- Photo zone selected → Photo zone properties panel (label, shape, corner radius if rounded, border, layer order, required, duplicate/delete)
- Custom field selected → Custom field properties panel (label, type dropdown, options if dropdown, default value, layer order, required, duplicate/delete)
- Static text selected → Static text properties panel (content, font, size, weight, color, alignment, position, layer order, duplicate/delete)
- Image selected → Image properties panel (replace image, opacity, layer order, duplicate/delete)
- Multiple zones selected → Multi-select panel (align, distribute, group, delete all)

### Gap 2 — No visible Layers panel

Currently shows "LAYERS · 0" with "No elements yet" placeholder, but no real layer manager. Need a proper Layers section that:
- Lists every zone on the current variant with its label and type icon
- Click a layer → selects it
- Drag a layer → reorders (z-index)
- Eye icon → toggle visibility
- Lock icon → lock from edit
- Highlights the currently selected layer

### Gap 3 — No "Preview as Attendee" mode

A toggle in the top bar that switches the canvas into preview mode:
- Hides all editing UI (handles, dashed borders, sidebars collapse)
- Shows the canvas exactly as an attendee will see it
- Includes a sample data input panel so the designer can type "Test Name" and see how it looks
- Toggle back to edit mode at any time

### Gap 4 — Save status indicator is invisible

The top bar shows "10:38 PM" (time) but not whether the work is saved. Need a clear indicator:
- "Saved" with a green dot when synced
- "Saving…" with a spinner during the 800ms debounced save
- "Unsaved changes" with a warning dot if save failed
- Tooltip on hover shows exact last save time

### Gap 5 — Shape primitives feel out of place

The left rail shows Rectangle / Circle / Triangle / Line under "SHAPES". These are decorative shapes the designer can add to the card. For a personalization tool where the designer ALREADY uploaded a finished card design, decorative shapes are mostly unnecessary clutter. Demote them:
- Move under a collapsible "More" section at the bottom of the left rail
- Or hide entirely (the designer adds shapes in their real design tool, not here)

### Gap 6 — Undo / redo aren't visible buttons

Currently only available via keyboard (Cmd+Z). Add visible undo/redo buttons in the top bar — small icon buttons with disabled state when no history exists.

### Gap 7 — Background management is awkwardly placed

The "BACKGROUND" section is at the bottom-LEFT under the layers section. It should be in the right sidebar (Event info panel) since it's event-level metadata, not an element you add to the canvas. The left rail should be exclusively for ADDING elements.

### Gap 8 — Variants UI is underdeveloped

"Variants · Attendee · + Add variant" is just a dropdown. Real variant management needs:
- Tabs row showing each variant (Attendee, Speaker, Sponsor, Exhibitor) with the active variant highlighted
- Each tab shows the variant's name and a small thumbnail
- "+ Add variant" creates a new tab pre-filled with a name picker (Speaker, Sponsor, Exhibitor, VIP, Volunteer, Custom...)
- Rename / Duplicate / Delete variant via right-click or three-dot menu on each tab
- Each variant can have its own background AND its own zones (different from sibling variants)
- Switching variants in the editor swaps the entire canvas

---

## BRAND SYSTEM (LOCKED — SAME AS ATTENDEE EXPERIENCE)

**Colors**
- Primary: `#1F4D3A` (forest green)
- Primary dark: `#163828`
- Primary soft: `#E8EFEB`
- Accent: `#E8C57E` (warm cream-gold, very sparingly)
- Ink: `#0F1F18`
- Ink soft: `#3A4A42`
- Muted: `#6B7A72`
- Cream: `#FAF6EE` (canvas/panel backgrounds)
- Surface: `#FFFFFF`
- Border: `#E5E0D4`
- Border strong: `#C9C3B1`
- Success: `#2D7A4F`
- Warning: `#C97A2D`
- Danger: `#B8423C`

**Typography**
- Display: DM Sans, 700, letter-spacing -0.02em
- Sans: Inter, 400/500/600
- Mono: JetBrains Mono — for ALL labels, kbd shortcuts, dimensions, IDs

**The mono font is heavily used in this editor (tool-feel).**
Labels like "ADD ELEMENT", "LAYERS", "SHAPES", coordinate readouts, dimensions — all mono uppercase 10–11px.

**Shadows**
- panel: `0 1px 2px rgba(15,31,24,0.04), 0 8px 24px rgba(15,31,24,0.06)`
- popover: `0 4px 12px rgba(15,31,24,0.08), 0 24px 60px rgba(31,77,58,0.12)`

---

## EDITOR DESIGN PRINCIPLES (FOR THIS PROJECT)

Different from the attendee experience. Apply these to every screen:

1. **DENSITY OVER SPACE.** This is a tool, not a marketing page. Tight padding, small labels (10–12px mono), close-grouped controls.

2. **FUNCTIONAL > BEAUTIFUL.** A control that's hard to find is a bug, no matter how clean the UI looks. Visible always > hidden in a menu.

3. **MONOSPACE FOR METADATA.** Coordinates, dimensions, IDs, shortcuts, layer counts, save status — all in JetBrains Mono. Adds tool credibility.

4. **PANELS, NOT MODALS.** Properties live in the sidebar, not in pop-out dialogs. Designers want everything visible while they work.

5. **KEYBOARD-FIRST AFFORDANCES.** Show keyboard shortcuts next to every action. A power user should be able to learn the editor without the mouse.

6. **NO ROUNDED EVERYTHING.** Inputs and buttons use `rounded-md` (6px) not `rounded-xl` (12px). The attendee experience is soft and approachable. The editor is precise and crisp.

7. **CANVAS IS CALM.** The center canvas area should feel like a quiet stage — soft cream background with a subtle grid. The chrome (panels, sidebars) is where density lives.

8. **ICONS USE LUCIDE.** Same icon family as attendee experience. Consistency across the product.

---

## RESPONSIVE STRATEGY

This editor is **desktop-first** because it's a tool:

- **Desktop ≥1280px (PRIMARY):** Full 3-column layout — left rail 240px / canvas flex / right sidebar 320px
- **Laptop 1024–1279px:** Same 3-column but tighter — left rail 200px / canvas / right sidebar 280px
- **Tablet 768–1023px:** Left rail collapses to icons only (60px wide), right sidebar still 280px
- **Mobile <768px:** Show an upgrade nudge: "This editor works best on desktop. Switch to a laptop for the full experience." with a "View as attendee" fallback CTA. DO NOT try to redesign the editor for mobile — it's not the right context.

---

## SCREENS TO DESIGN (BUILD IN THIS ORDER)

### SCREEN D2.1 — Empty Editor (no zones yet)

Shows the editor state immediately after upload, before any zones are added.

**Layout:**

TOP BAR (full width):
- Left: back arrow → Events → event name (breadcrumb)
- Center: nothing
- Right (left to right): undo button, redo button, save status pill ("✓ Saved 2s ago"), Preview button (eye icon), Test button (play icon), Publish button (primary forest green)

VARIANTS TABS ROW (full width, below top bar):
- Tab pills: "Attendee" (active, forest green underline, surface white bg)
- "+ Add variant" button at the right

LEFT RAIL (240px):
- Header: "ADD ELEMENT" (mono uppercase 10px, muted)
- Vertical stack of element types as tappable rows:
  - Text field — "Name, title, country..."
  - Photo zone — "Headshot or logo"
  - Custom field — "Dropdown, badge, role..."
  - Static text — "Fixed text on the card"
  - Image — "PNG, JPG, WebP, SVG, GIF"
- Each row: icon left (16px), label + sublabel, "+" on the right
- Below "ADD ELEMENT": collapsible "Decorative shapes" (collapsed by default) with Rectangle / Circle / Triangle / Line
- Bottom of rail: small "?" Help icon

CANVAS (center):
- Cream background with subtle dotted grid pattern
- The uploaded background image, centered, slightly inset
- Shows actual canvas dimensions label at top-center (mono, "1080 × 1920 px")
- Below the canvas image, near the bottom of the visible area, a soft hint: "Start by adding a text field or photo zone from the left."
- Bottom bar (full canvas width): zoom percentage, "−" and "+" buttons, "Fit" button, "Grid" toggle, "Snap" toggle, "pan" hint (mono mini text)

RIGHT SIDEBAR (320px):
- Header: "EVENT" (mono uppercase 10px, muted)
- Sections (stacked, each with mono uppercase label and white surface card with border-border):
  - Name (input field, value: event name)
  - Canvas (read-only chip showing "1080 × 1920 px" + "Resize" link)
  - Background (thumbnail of the uploaded background + "Replace" button)
  - Variants (count: 1, "Manage" link)
  - Status: pill ("Draft" / "Published" / "Archived")
  - Zones (count: 0)
- Below: "LAYERS" section header (mono) with empty state — "No elements yet. Add one from the left."
- Bottom: "SHORTCUTS" section with kbd-styled keys (mono):
  - Click — select zone
  - Drag — reposition
  - Delete (⌫) — delete
  - Cmd D — duplicate
  - Cmd Z / Shift Cmd Z — undo / redo
  - [ ] — layer order
  - Cmd P — preview
  - Cmd / — shortcuts help
  - G — toggle grid

**Design direction:**
- Density is correct. Don't over-space.
- All section headers are mono uppercase 10px tracking 0.08em
- All inputs are rounded-md (6px), not rounded-xl
- Borders are 1px solid border-border
- Active states use primary-soft fill + primary text

---

### SCREEN D2.2 — Editor with Text Zone Selected

Same layout, but a text zone is on the canvas and selected.

**Differences from D2.1:**

CANVAS:
- The uploaded background image now has a dashed-outlined text zone overlaid (label "Full Name" floating above it in a small mono badge)
- The selected zone has solid forest-green border + 8 resize handles (corners + edges) in primary green
- The zone shows live placeholder text ("Your name") in the configured font/size

RIGHT SIDEBAR (now showing TEXT ZONE properties):
- Header changes from "EVENT" to "TEXT ZONE — Full Name"
- Breadcrumb back to Event panel
- Sections:
  - LABEL (input: "Full Name")
  - PLACEHOLDER (input: "Your name")
  - REQUIRED (toggle: ON)
  - FONT (dropdown: DM Sans / Inter / JetBrains Mono)
  - SIZE (number input + small slider, value: 32px)
  - WEIGHT (segmented control: 400 / 500 / 600 / 700)
  - COLOR (color swatch + hex input: #0F1F18)
  - ALIGN (3 buttons: left / center / right, "center" active)
  - VALIDATION:
    - Max chars: input 80
  - POSITION (4 number inputs in a 2x2 grid: X, Y, W, H — all px, mono font for readouts)
  - LAYER (4 small buttons: ↑ Bring forward, ↓ Send back, ⤒ Bring to front, ⤓ Send to back)
  - ACTIONS (Duplicate / Lock / Delete — 3 inline icon buttons with mono labels)

LEFT RAIL: same as D2.1

LAYERS section in right sidebar shows: "Full Name" as the only layer with type icon + visibility + lock icons next to it.

**Design direction:**
- Each property group is its own white surface card with a mono uppercase label
- Inputs are tight: 36px height, mono font for numbers
- Color picker shows a 24px swatch + 8-char hex input
- Position grid: 2 columns × 2 rows, each cell is a mono label + tight input

---

### SCREEN D2.3 — Editor with Photo Zone Selected

Same as D2.2 but a photo zone is selected (circle shape).

**Right sidebar shows PHOTO ZONE properties:**
- Header: "PHOTO ZONE — Headshot"
- LABEL (input)
- REQUIRED (toggle)
- SHAPE (4 buttons with preview icons: Circle / Square / Rounded / Hexagon — circle active)
- CORNER RADIUS (slider 0–50%, only visible if "Rounded" selected)
- BORDER:
  - Toggle (off/on)
  - If on: color picker + width slider (0–10px)
- POSITION (same 2x2 X/Y/W/H grid)
- LAYER (same 4 buttons)
- ACTIONS (Duplicate / Lock / Delete)

**Canvas:**
- The selected photo zone is shown as a circle with a dashed forest-green border and a centered placeholder icon (Lucide ImageIcon in muted color on cream-soft background)
- 8 resize handles around the bounding box (the square boundary of the circle)

---

### SCREEN D2.4 — Editor with Custom Field Selected (Dropdown type)

Custom fields let the organizer define structured choices like "Role: Speaker / Attendee / Sponsor".

**Right sidebar shows CUSTOM FIELD properties:**
- Header: "CUSTOM FIELD — Role"
- LABEL (input: "Role")
- TYPE (dropdown: Text / Dropdown / Date / Email — "Dropdown" selected)
- If Dropdown: OPTIONS section
  - List of options with reorder handles + delete icons
  - Each option: input field + small × button
  - "+ Add option" button at bottom
  - Example options: Speaker, Attendee, Sponsor, Exhibitor, VIP
- DEFAULT VALUE (dropdown to pick which option is pre-selected, or "None")
- REQUIRED (toggle)
- FONT / SIZE / WEIGHT / COLOR / ALIGN (same as text zone, the displayed value uses these)
- POSITION (same 2x2 grid)
- LAYER (same 4 buttons)
- ACTIONS

---

### SCREEN D2.5 — Multi-Variant Tab Active (Speaker variant)

Same editor layout, but the variant tab "Speaker" is active instead of "Attendee".

**Variants row shows:**
- Attendee (white surface)
- Speaker (active — primary-soft fill, forest green underline)
- Sponsor (white surface)
- "+ Add variant" button

**Canvas shows:**
- The same background image (or a different one — variants can have different backgrounds)
- Different zones from Attendee variant — maybe a "SPEAKER" badge zone, name, photo, talk title
- Selected zone is the "SPEAKER" badge — text zone with primary fill

**Right sidebar:**
- Header: "VARIANT — Speaker"
- Sections:
  - NAME (input: "Speaker")
  - BACKGROUND (thumbnail + Replace button — variant can have its own bg)
  - ZONES (count: 4)
  - DUPLICATE FROM ATTENDEE button (copies zones from another variant)
  - DELETE VARIANT button (danger color, at the bottom)

The point is: the user understands each variant is a self-contained surface that shares the same event metadata (name, organizer, dates) but has its own zones and optionally its own background.

---

### SCREEN D2.6 — Preview as Attendee Mode

Top bar shows a clear toggle: "Edit / Preview" with Preview active (primary-soft pill around "Preview").

**Canvas:**
- The canvas image displays as the attendee will see it
- All editing UI hidden: no dashed zone borders, no handles, no zoom controls, no bottom bar
- Zones render their actual placeholder values ("Your Name", "Your Role", etc.)

**Left rail collapses to a slim 60px icon strip:**
- Just element icons stacked, no labels
- Greyed out (you can't add elements while previewing)

**Right sidebar replaced with "TEST DATA" panel:**
- Header: "TEST AS ATTENDEE" (mono uppercase)
- Form fields matching the zones in the current variant:
  - Full Name (text input: "Aisha Ahmed")
  - Role (dropdown: "Speaker")
  - Photo (file upload — shows a circular avatar preview)
- A small note at the top: "Fill in test data to see how the card will look to an attendee."
- "Reset test data" button at the bottom

**Canvas updates live as the designer types in the test data form.**

A "← Back to Edit" button at the top of the right sidebar exits preview mode.

---

### SCREEN D2.7 — Mobile Fallback

For viewports <768px (mobile/small tablet).

**Design:**
- Surface white card centered on cream background, max-width 360px
- Top: small mono label "EDITOR · DESKTOP REQUIRED"
- Lucide Monitor icon (large, in primary-soft circle)
- Headline (Display M): "Cardly's editor works best on a laptop"
- Body: "The canvas editor needs a larger screen to position zones precisely. Open this link on a laptop or tablet to continue editing."
- Primary CTA: "Copy event link" (so designer can email/text the link to their other device)
- Secondary CTA: "View as attendee" (so they can at least preview the public-facing page)
- Footer (mono caption muted): "Powered by Cardly"

---

## INTERACTIONS & MICROCOPY

For each screen, show these states implicitly through realistic content:

- Save status pill: cycle states ("Saved 2s ago" → "Saving…" → "Saved")
- Inputs: regular state + focus state + filled state visible across the screens
- Hover states on buttons (slight bg darken)
- Resize handles: cursor changes implied by their position (corner = diagonal, edge = horizontal/vertical)
- Drag indicators: subtle shadow under a layer being dragged in the Layers list

Microcopy details (these matter):
- Hint text uses sentence case, not title case
- Numeric labels use mono font even when small (X, Y, W, H, %, px)
- Element type sublabels are quiet (muted color, 11px)
- Tooltips: brief, no period at end
- Empty state messages start with verbs ("Start by adding…", "Drag a zone to reorder…")

---

## OUTPUT FORMAT

For each screen, produce one artifact:
1. Complete React + Tailwind component
2. Use shadcn/ui primitives where appropriate (Button, Input, Select, Tabs, Toggle, Dialog)
3. Lucide-react icons only
4. Use realistic content matching African event ecosystem:
   - Event: "5th Pan-African Youth Forum"
   - Variants: Attendee, Speaker, Sponsor
   - Sample attendee data: Aisha Ahmed, "Climate Policy Lead"
5. Add `{/* TODO: wire to state */}` comments where logic plugs in
6. Build at desktop 1280px width (do not show responsive variants in artifacts — design intent is desktop-only for the editor)

---

## BUILD ORDER (STRICT)

1. D2.1 — Empty Editor
2. D2.2 — Text Zone Selected
3. D2.3 — Photo Zone Selected
4. D2.4 — Custom Field (Dropdown) Selected
5. D2.5 — Multi-Variant Active
6. D2.6 — Preview as Attendee Mode
7. D2.7 — Mobile Fallback

Wait for my approval after each before building the next.

---

## START WITH D2.1

Build D2.1 (Empty Editor) at desktop 1280px width. Use:
- Event name: "5th Pan-African Youth Forum"
- Background: imagine a green-themed event card with white space for content
- Canvas: 1080 × 1920 px (Instagram Story size)
- No zones yet — show empty state

Show me D2.1. Wait for my approval before D2.2.
```

---

## End of prompt — what happens after Claude Design ships these 7 screens

1. **Export the JSX files** from each artifact in Claude Design
2. **Save them** in your project root in a new folder: `editor-handoff/`
3. **Bring them back to me** here in this chat
4. **I'll write the Claude Code handoff prompt** with the same strict isolation rules:
   - Only touch `components/editor/CanvasEditor.tsx` and the editor's supporting files
   - Don't break the data contract with the attendee experience
   - Don't touch render, auth, dashboard
   - Keep all existing keyboard shortcuts, drag/resize/zoom logic
   - Only redesign the chrome (panels, sidebars, tabs)

---

## What's deliberately DIFFERENT about this prompt

Compared to the attendee redesign:

| Attendee redesign | Editor improvement |
|---|---|
| Mobile-first, 375px | Desktop-first, 1280px |
| One big card hero | Density, panels, sidebars |
| Calm spacing, generous whitespace | Tight density, mono labels |
| `rounded-2xl` (12px) | `rounded-md` (6px) |
| Display fonts for warmth | Mono fonts for tool-feel |
| Magic moment focus | Job-completion focus |
| Full redesign (was bad) | Targeted improvements (already good) |

This is critical. If you try to make the editor feel like the attendee experience, it'll lose its tool credibility. Tools are dense. Marketing pages are spacious. Different goals.

---

## Your deal — reminder

You committed: **ship attendee first.** That means:

1. **Tomorrow morning:** Run the attendee handoff prompt I gave you earlier
2. **Watch Claude Code work** through the attendee redesign
3. **Test the live result** on your phone
4. **Send the URL to ONE person**
5. **THEN open Claude Design** with this editor prompt
6. **Design the editor screens** with critical review
7. **Bring the JSX back to me** for the editor handoff prompt

Do not jump to editor design before the attendee experience is live in production. That's the deal we made. I'm trusting you to honor it.

---

## Final word for tonight

Goodnight, Abdalla.

You have:
- ✅ A working product
- ✅ Beautiful attendee designs
- ✅ A surgical handoff prompt for the attendee
- ✅ A disciplined improvement prompt for the editor
- ✅ A ROADMAP for v1.1 features
- ✅ A BRAND.md as source of truth

The only thing left is to ship. Both prompts above are ready when you are.

See you tomorrow with results.
