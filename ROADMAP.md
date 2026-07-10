# ROADMAP.md — Eventera v1.1 Editor Upgrades

**DO NOT BUILD THIS YET.**

This file is for post-MVP work. Build conditions:
- ✅ MVP shipped to Vercel
- ✅ At least 1 paying customer has run a real event through Eventera
- ✅ Feedback from that customer reviewed
- ✅ Phase 1 → 4 from CLAUDE.md are complete and stable

If any of those are not true, **close this file and go back to CLAUDE.md.**

---

## What This Roadmap Is

12 focused upgrades to the **D2 Canvas Editor** that deepen Eventera's core value: helping designers define personalization zones on their uploaded designs.

**What this is NOT:** a Canva clone. We are not adding text styling, font pickers, shape libraries, AI features, or template marketplaces. The designer already designed the card in their real design tool. Eventera's editor only handles personalization zones.

---

## The 12 Features (build in this order)

### F1 — Expanded Field Types
**Goal:** Support more attendee data than just text and photo.

**Add:**
- `dropdown` — designer pre-defines options (e.g., "Speaker / Attendee / Sponsor / Exhibitor"). Attendee picks one.
- `date` — for things like "Attending Day 1 / Day 2 / All Days"
- `email` — separate from text because it has format validation
- `multi-line text` — for bios, longer titles

**Database change:**
Extend zones JSON to include:
```json
{
  "id": "z3",
  "type": "dropdown",
  "label": "Role",
  "options": ["Attendee", "Speaker", "Sponsor", "Exhibitor"],
  "x": 100, "y": 600, "w": 300, "h": 50,
  "font": "Inter", "size": 18, "color": "#0f0f1a",
  "align": "center"
}
```

**UI change:**
- LeftRail "Add to Canvas" gets new buttons: Dropdown, Date, Email, Multi-line
- Right sidebar shows options editor for dropdowns
- Attendee public page renders the right input for each type

---

### F2 — Field Validation Rules
**Goal:** Prevent attendees from breaking the design with bad input.

**Add to each zone in the right sidebar:**
- Max characters (for text fields)
- Min characters
- Required toggle (already exists, formalize it)
- Email format validation (auto on email type)
- Custom error message per zone

**Attendee side:**
- Inline validation on the form
- Block submit until all required fields pass

---

### F3 — Smart Text Auto-Fit
**Goal:** Long names shouldn't overflow the design.

**Logic:**
- Each text zone has a `min_size` and `max_size` in the zone properties
- When attendee types a name, the rendered text auto-shrinks if it exceeds the zone width
- If text still doesn't fit at `min_size`, truncate with ellipsis or wrap (configurable per zone)

**Where this lives:**
- Preview side: real-time auto-fit in the React preview
- Server side: `sharp` rendering applies the same logic

**Designer control:**
- Right sidebar: "Text behavior" → Auto-shrink / Wrap / Truncate (radio)

---

### F4 — Multi-Line Text Zones (covered partially in F1)
**Goal:** Bios, multi-word titles, longer fields.

**Add:**
- Line height control in zone properties
- Max lines setting (e.g., max 3 lines, then truncate)
- Vertical alignment within zone (top / middle / bottom)

---

### F5 — Photo Shape Options
**Goal:** Match the visual style of any design.

**Currently:** circle, square (basic).

**Add:**
- Rounded square (with corner radius slider)
- Hexagon
- Full bleed (no shape, fills zone exactly)
- Custom border on photo (color + width)

**Where:**
- Right sidebar when a photo zone is selected
- `sharp` server-side rendering applies the mask shape

---

### F6 — Photo Crop Preview for Attendees
**Goal:** Attendees see exactly how their photo will be cropped before submitting.

**Flow:**
1. Attendee uploads photo
2. Modal opens with the photo + crop frame matching the designer's defined shape
3. Attendee can drag/zoom to reposition inside the frame
4. Confirm → photo gets cropped client-side AND saved to the form
5. Server uses the same crop coordinates when rendering the final PNG

**Library:** `react-easy-crop` (small, focused, fits the stack)

---

### F7 — Zone Alignment Guides + Snap
**Goal:** Designers don't fight pixel-level positioning.

**Add to canvas:**
- Snap to center (horizontal + vertical of canvas)
- Snap to other zone edges and centers
- Visual guide lines (magenta or brand purple) when snapping
- Hold Cmd/Ctrl to disable snap temporarily
- Distance indicators between zones when dragging

**Where:**
- Stage component in D2 editor
- Snap threshold: 6px

---

### F8 — Multi-Zone Selection + Group Operations
**Goal:** Manage related zones together.

**Add:**
- Shift+click to select multiple zones
- Marquee selection (drag-select empty area)
- When multiple selected, show in right sidebar:
  - Align: left / center / right / top / middle / bottom
  - Distribute: horizontally / vertically
  - Group / Ungroup
  - Delete all

**Keyboard shortcuts:**
- Cmd/Ctrl+A → select all zones
- Esc → deselect

---

### F9 — Layer Order Controls
**Goal:** When zones overlap, control which is on top.

**Add to right sidebar:**
- Bring to front
- Send to back
- Bring forward (one step)
- Send backward (one step)

**Database:**
- Add `z_index` to each zone object
- Render zones sorted by z_index

---

### F10 — Preview as Attendee Mode
**Goal:** Designer sees exactly what the attendee will experience without leaving the editor.

**Add to top bar:**
- Toggle: "Edit / Preview"
- In preview mode:
  - Hide all editing UI (handles, dashed borders, sidebars)
  - Render the attendee form alongside the live preview
  - Designer can type sample data to see how it looks
- Toggle back to edit at any time

**No new route — just a UI mode toggle.**

---

### F11 — Multi-Variant per Event (Attendee / Speaker / Sponsor / Exhibitor)
**Goal:** One event, multiple poster types — like Premagic does.

**This is the biggest feature in the roadmap.**

**Concept:**
- An event has multiple "variants" instead of just one design
- Each variant has its own background image and zones
- Variants share the same event slug, but the attendee picks their type on the public page

**Database changes:**
```sql
create table event_variants (
  id uuid primary key default gen_random_uuid(),
  event_id uuid references events(id) on delete cascade,
  variant_name text not null,        -- "Attendee", "Speaker", etc.
  variant_slug text not null,        -- "attendee", "speaker"
  background_url text,
  background_width int,
  background_height int,
  zones jsonb default '[]'::jsonb,
  position int default 0,
  created_at timestamptz default now()
);

-- Drop background_url, background_width, background_height, zones from events table
-- Each event now has at least one default variant
```

**Migration plan:**
- For existing events, create one default variant called "Attendee" and move all data into it
- Update API routes to handle variants
- Update render API to accept variant_id

**Editor UI:**
- Top of editor: tabs for each variant (Attendee | Speaker | Sponsor | + Add)
- Click tab → switch which variant is being edited
- Each variant can have completely different background + zones

**Attendee public page:**
- If event has 1 variant → straight to form
- If event has 2+ variants → first screen: "I am attending as…" → pick variant → form

**Routes:**
- `/c/[slug]` → variant picker if multi-variant
- `/c/[slug]/[variantSlug]` → form for that variant

---

### F12 — Background Swap (Preserve Zones)
**Goal:** Designer iterates on the design without losing all the zone work.

**Flow:**
- Right sidebar or top bar: "Replace background" button
- Upload new image
- Confirmation dialog: "Keep zone positions or reset?"
- If image is same dimensions as old: keep zones exactly
- If different dimensions: offer to scale zones proportionally OR reset

**Why this matters:**
Designers tweak their card design 5+ times during an event. Without this, they'd have to rebuild all zones every time. This is a quiet but huge UX win.

---

## Build Order (DO NOT REORDER)

1. F11 — Multi-variant per event (biggest architectural change, do first while codebase is small)
2. F1 — Expanded field types
3. F2 — Field validation
4. F5 — Photo shape options
5. F6 — Photo crop preview for attendees
6. F12 — Background swap
7. F9 — Layer order
8. F7 — Alignment guides + snap
9. F8 — Multi-zone selection
10. F10 — Preview as attendee mode
11. F3 — Smart text auto-fit
12. F4 — Multi-line text zones

**Reason for the order:**
- F11 first because it changes the database schema. Better to do this when there's less data to migrate.
- Field types + validation early because they unlock more event types.
- Photo features clustered because they share the `sharp` rendering pipeline.
- Polish features (snap, multi-select, preview mode) at the end.

---

## Rules When Building These Features

1. **Build one feature, test it end-to-end (designer → attendee → download), commit, move to next.** No bundling.
2. **Every feature must keep the watermark + plan-limit logic working.**
3. **No new dependencies except `react-easy-crop` (F6).** Everything else uses what's already in the stack.
4. **Don't break existing events.** Write migrations that preserve all existing data.
5. **Match the existing editor's visual style.** Don't redesign the editor UI to fit new features — fit features into the existing UI.
6. **Test on mobile after every feature** that touches the attendee side (F1, F2, F5, F6, F11).
7. **Commit after every feature** with a clear message: `feat: F1 expanded field types`.

---

## Definition of Done (per feature)

- Code written and committed
- Manual test: full designer → attendee → download flow works
- Mobile test: feature works on 375px viewport (where relevant)
- No regression: all previous features still work
- Deployed to Vercel
- Tested on production URL with a real phone

---

## What's Explicitly NOT in This Roadmap

If anyone (you, Claude Code, a future user) suggests these, say no:

- Font picker for arbitrary text styling
- Color picker on text zones (designer controls this in their design tool)
- Templates marketplace
- Stickers, shapes, illustrations library
- AI features (AI writer, AI image gen, AI captions, AI anything)
- Animations / motion effects on cards
- Multi-page documents
- Brand kit / asset management
- Background removal
- Image filters / photo effects
- Video output (separate v2 product if ever)
- Team accounts / collaboration
- Comments / approval workflow

These belong to Canva, Figma, or Premagic. Not Eventera.

---

## Reminder

**This file is for AFTER the MVP ships and earns money.** If you're reading this while still in Phase 1, 2, or 3 of CLAUDE.md — close this file and get back to work on the MVP. Don't get distracted by upgrades to a product that doesn't exist yet.

**Finished > perfect. Published > saved. Systems > motivation.**
