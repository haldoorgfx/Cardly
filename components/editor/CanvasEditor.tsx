'use client';

// ═══════════════════════════════════════════════════════════════════════════
// KARTA CANVAS EDITOR — STATE & BEHAVIOR INVENTORY
// Documented before UI refactor (Step 1). DO NOT remove any of this logic.
// ───────────────────────────────────────────────────────────────────────────
//
// ── Constants ───────────────────────────────────────────────────────────────
//   CW = 1080                       — canvas baseline width (px)
//   CH = 1350                       — canvas baseline height (px)
//   GRID_SIZE = 60                  — snap-to-grid cell size (canvas px)
//   ROTATE_HANDLE_DIST = 32         — rotate handle distance above zone top
//
// ── Props ───────────────────────────────────────────────────────────────────
//   eventId: string                 — Supabase event UUID (for API calls)
//   eventName: string               — display name (editable inline)
//   variants: Variant[]             — initial variant list from server
//
// ── State ───────────────────────────────────────────────────────────────────
//   variants: Variant[]             — line 84  — live variant list
//   activeVariantId: string         — line 85  — which variant's zones are shown
//   showAddVariant: boolean         — line 86  — "Add variant" form open
//   addingVariant: boolean          — line 87  — POST in-flight
//   newVariantName: string          — line 88  — name input value
//   newVariantFile: File|null       — line 89  — background file for new variant
//   variantMenuId: string|null      — line 93  — which variant's context menu is open
//   renamingVariantId: string|null  — line 94  — inline rename mode
//   renameValue: string             — line 95  — rename input value
//   variantZonesMap: Record<string, Zone[]>  — line 98  — zones keyed by variantId
//   selectedIds: string[]           — line 111 — multi-select zone IDs
//   zoom: number (default 0.42)     — line 116 — canvas scale factor
//   grid: boolean                   — line 117 — dotted grid visible
//   gridSnap: boolean               — line 118 — snap zones to grid
//   previewMode: boolean            — line 119 — preview-as-attendee mode
//   snapGuides: SnapGuides          — line 120 — {x?,y?} snap line positions (canvas px)
//   nameVal: string                 — line 121 — event name input value
//   editName: boolean               — line 122 — inline event name edit mode
//   savedAt: string                 — line 123 — "HH:MM" timestamp of last save
//   fontSearch: string              — line 125 — font picker search query (unused UI)
//   showShortcuts: boolean          — line 126 — keyboard shortcuts panel open
//   copiedStyle: Partial<Zone>|null — line 127 — style clipboard (Cmd+Alt+C)
//   styleFlash: boolean             — line 128 — 1.2s flash after copy style
//   aspectLock: boolean             — line 129 — lock aspect ratio during resize
//   uploadingImage: boolean         — line 130 — zone image upload in-flight
//   spaceDown: boolean              — line 131 — space key held (pan mode)
//   floatBarPos: {left,top}|null    — line 132 — floating toolbar position
//   toolbarOffset: {dx,dy}          — line 133 — toolbar drag offset
//   history: HistoryState           — line 138 — {past: Zone[][], future: Zone[][]}
//   isMobile: boolean               — line 155 — viewport < 900px
//
// ── Refs ────────────────────────────────────────────────────────────────────
//   stageRef: HTMLDivElement        — line 141 — outer scrollable stage (for zoom/pan scroll)
//   canvasInnerRef: HTMLDivElement  — line 142 — the artwork div (for position math)
//   imageUploadRef: HTMLInputElement— line 143 — hidden input for zone image upload
//   bgReplaceRef: HTMLInputElement  — line 144 — hidden input for background replace
//   autosaveTimer: ReturnType<setTimeout> — line 145 — debounce timer handle
//   zonesRef: Zone[]                — line 146 — always-current zones (avoids stale closures in pointer handlers)
//   didMoveRef: boolean             — line 148 — drag dead-zone guard (5px threshold)
//   interaction: Interaction|null   — line 149 — active drag/resize/rotate state
//   isPanning: boolean              — line 150 — space+drag pan in progress
//   spaceDownRef: boolean           — line 151 — ref mirror of spaceDown state
//   panStart: {x,y,scrollLeft,scrollTop} — line 152 — pan anchor
//   stageContainerRef: HTMLDivElement    — line 134 — container for toolbar position calc
//   toolbarDragRef: drag anchor     — line 135 — toolbar drag state
//   newVariantFileRef: HTMLInputElement  — line 90  — hidden input for variant background
//
// ── Derived (not state) ─────────────────────────────────────────────────────
//   activeVariant   — line 104 — current Variant object
//   zones           — line 105 — current variant's Zone[]
//   bgW             — line 106 — active variant background width (px)
//   bgH             — line 107 — active variant background height (px)
//   backgroundUrl   — line 108 — active variant background_url
//   selectedId      — line 112 — last selectedIds entry
//   selected        — line 113 — Zone | null for selectedId
//
// ── Behaviors ───────────────────────────────────────────────────────────────
//   switchVariant(id)               — line 195 — switch active variant, clear selection + history
//   handleRenameVariant(id, name)   — line 202 — PATCH variant_name via API
//   handleDeleteVariant(id)         — line 214 — DELETE variant via API, switch to next
//   handleDuplicateVariant(id)      — line 225 — POST duplicate variant, copy zones
//   scheduleSave(zones, variantId)  — line 249 — 800ms debounce PATCH zones to Supabase
//   setZonesForVariant(id, zones)   — line 261 — update variantZonesMap for one variant
//   pushHistory(nextZones)          — line 265 — prepend current to past[], call scheduleSave
//   updateZone(id, patch, withHist) — line 272 — patch one zone; optionally push history
//   removeZone(id)                  — line 278 — filter out zone, push history
//   removeSelected()                — line 283 — filter out all selectedIds, push history
//   duplicateZone(id)               — line 288 — clone zone at +30,+30 offset, push history (Cmd+D)
//   moveZoneUp(id)                  — line 296 — swap zone with prev in array (] key)
//   moveZoneDown(id)                — line 304 — swap zone with next in array ([ key)
//   bringToFront(id)                — line 312 — move zone to end of array
//   sendToBack(id)                  — line 319 — move zone to start of array
//   alignSelected(axis)             — line 327 — align all selected zones (6 axes)
//   distributeSelected(dir)         — line 345 — evenly space ≥3 selected zones (h or v)
//   addZone(type)                   — line 369 — add text|photo|custom|label zone, scaled to bgW
//   addShapeZone(shapeType)         — line 394 — add rect|ellipse|triangle|line shape zone
//   handleImageUpload(e)            — line 420 — upload file → /api/upload-zone-image → add image zone
//   handleReplaceBackground(e)      — line 462 — upload file → /api/upload-zone-image → PATCH variant bg
//   undo()                          — line 495 — Cmd+Z: pop past[], push current to future[]
//   redo()                          — line 505 — Cmd+Shift+Z: pop future[], push current to past[]
//   copyStyle()                     — line 516 — Cmd+Alt+C: store non-positional zone props
//   pasteStyle()                    — line 525 — Cmd+Alt+V: apply copiedStyle to selected
//   onZonePointerDown(e, zone)      — line 531 — start move interaction; handle Shift for multi-select
//   onHandlePointerDown(e, zone, dir) — line 558 — start resize interaction (8 dirs: n/s/e/w/ne/nw/se/sw)
//   onRotatePointerDown(e, zone)    — line 566 — start rotate interaction (angle from zone center)
//   handleAddVariant()              — line 794 — POST new variant with name + background file
//   saveName()                      — line 813 — PATCH event name
//   fitZoom()                       — line 818 — recalculate zoom to fit stage
//
// ── useEffects ──────────────────────────────────────────────────────────────
//   Mobile detection                — line 156 — window.innerWidth < 900 → isMobile
//   Google Fonts inject             — line 163 — appends <link> to <head> once
//   Floating toolbar position       — line 173 — computes floatBarPos from selected zone + zoom
//   Reset toolbar drag offset       — line 192 — clears toolbarOffset on selection change
//   Global pointermove/pointerup    — line 587 — handles all drag/resize/rotate; updates snap guides
//   Keyboard shortcuts              — line 714 — Delete, Cmd+Z/Y, Cmd+D/P, arrows, brackets, G, space
//   Fit zoom on mount/variant change— line 757 — fit canvas to stage on load or variant switch
//   Scroll-to-zoom (wheel)          — line 770 — Ctrl/Cmd+wheel adjusts zoom
//   Re-center canvas after zoom     — line 783 — adjusts scrollLeft/scrollTop to keep canvas centered
//
// ── Type aliases ────────────────────────────────────────────────────────────
//   HistoryState = { past: Zone[][], future: Zone[][] }
//   SnapGuides   = { x?: number, y?: number }
//   Interaction  = { mode, id, sx, sy, ox, oy, ow, oh, dir?, startMouseAngle?, startRotation?, multiPositions? }
//
// ═══════════════════════════════════════════════════════════════════════════

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { fetchWithRetry } from '@/lib/utils/fetch-retry';
import { useRouter } from 'next/navigation';
import type { Zone, Variant } from '@/types/database';
import {
  Type, Image as ImageIcon, ImagePlus, ToggleLeft, Tag, Lock, LockOpen,
  Trash2, Copy, AlignLeft, AlignCenter, AlignRight, AlignJustify,
  Upload, X, ChevronUp, ChevronDown, Square, AlignVerticalJustifyEnd,
  AlignStartVertical, AlignCenterVertical, AlignEndVertical,
  AlignHorizontalJustifyCenter, AlignVerticalJustifyCenter,
} from 'lucide-react';

// Chrome components (UI only — no logic)
import MobileFallback from './chrome/MobileFallback';
import TopBar from './chrome/TopBar';
import BottomBar from './chrome/BottomBar';
import VariantsTabs from './chrome/VariantsTabs';
import LeftRail from './leftRail/LeftRail';
import RightSidebar, { type RightSidebarMode } from './rightSidebar/RightSidebar';

const CW = 1080;
const CH = 1350;
const GRID_SIZE = 60;
const ROTATE_HANDLE_DIST = 32; // px above zone (canvas space)

type HistoryState = { past: Zone[][]; future: Zone[][] };
type SnapGuides = { x?: number; y?: number };
interface Interaction {
  mode: 'move' | 'resize' | 'rotate';
  id: string;
  sx: number; sy: number;
  ox: number; oy: number; ow: number; oh: number;
  dir?: string;
  startMouseAngle?: number;
  startRotation?: number;
  multiPositions?: Record<string, { x: number; y: number }>;
}

/* ── helpers ─────────────────────────────────────────────── */
function wrapTextLines(text: string, maxWidth: number, fontSize: number): string[] {
  const approxCharWidth = fontSize * 0.55;
  const maxChars = Math.max(1, Math.floor(maxWidth / approxCharWidth));
  const words = text.split(' ');
  const lines: string[] = [];
  let current = '';
  for (const word of words) {
    const test = current ? `${current} ${word}` : word;
    if (test.length > maxChars && current) { lines.push(current); current = word; }
    else current = test;
  }
  if (current) lines.push(current);
  return lines.length ? lines : [''];
}


const BRAND_COLORS = [
  '#FFFFFF','#0F1F18','#1F4D3A','#2A6A50','#E8C57E',
  '#FFD28A','#7BE0C0','#FF6058','#3A6B8C','#C97A2D',
  '#000000','#FAF6EE',
];

const FONTS = [
  'DM Sans','Inter','JetBrains Mono','Space Grotesk','Playfair Display',
  'Poppins','Montserrat','Raleway','Nunito','Lato',
  'Oswald','Roboto','Work Sans','Merriweather','Lora',
  'Cormorant Garamond','Bebas Neue','Anton','Georgia','Times New Roman',
];

const GOOGLE_FONTS_URL =
  'https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&family=Inter:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500;700&family=Space+Grotesk:wght@300;400;500;600;700&family=Playfair+Display:wght@400;500;600;700&family=Poppins:wght@300;400;500;600;700&family=Montserrat:wght@300;400;500;600;700&family=Raleway:wght@300;400;500;600;700&family=Nunito:wght@300;400;500;600;700&family=Lato:wght@300;400;700&family=Oswald:wght@300;400;500;600;700&family=Roboto:wght@300;400;500;700&family=Work+Sans:wght@300;400;500;600;700&family=Merriweather:wght@300;400;700&family=Lora:wght@400;500;600;700&family=Cormorant+Garamond:wght@300;400;500;600;700&family=Bebas+Neue&family=Anton&display=swap';

/* ── types ───────────────────────────────────────────────── */
interface CanvasEditorProps {
  eventId: string;
  eventName: string;
  variants: Variant[];
}

/* ══════════════════════════════════════════════════════════
   MAIN COMPONENT
══════════════════════════════════════════════════════════ */
export default function CanvasEditor({ eventId, eventName, variants: initialVariants }: CanvasEditorProps) {
  const router = useRouter();

  /* variants */
  const [variants, setVariants] = useState<Variant[]>(initialVariants);
  const [activeVariantId, setActiveVariantId] = useState<string>(initialVariants[0]?.id ?? '');
  const [showAddVariant, setShowAddVariant] = useState(false);
  const [addingVariant, setAddingVariant] = useState(false);
  const [newVariantName, setNewVariantName] = useState('');
  const [newVariantFile, setNewVariantFile] = useState<File | null>(null);
  const newVariantFileRef = useRef<HTMLInputElement>(null);
  const [variantLimitHit, setVariantLimitHit] = useState(false);

  /* variant management */
  const [variantMenuId, setVariantMenuId]       = useState<string | null>(null);
  const [renamingVariantId, setRenamingVariantId] = useState<string | null>(null);
  const [renameValue, setRenameValue]             = useState('');

  /* zones per variant */
  const [variantZonesMap, setVariantZonesMap] = useState<Record<string, Zone[]>>(() => {
    const map: Record<string, Zone[]> = {};
    for (const v of initialVariants) map[v.id] = (v.zones as Zone[]) ?? [];
    return map;
  });

  const activeVariant = variants.find(v => v.id === activeVariantId) ?? variants[0];
  const zones        = variantZonesMap[activeVariantId] ?? [];
  const bgW          = activeVariant?.background_width  ?? CW;
  const bgH          = activeVariant?.background_height ?? CH;
  const backgroundUrl = activeVariant?.background_url  ?? '';

  /* selection */
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const selectedId = selectedIds[selectedIds.length - 1] ?? null;
  const selected   = zones.find(z => z.id === selectedId) ?? null;

  /* ui state */
  const [zoom, setZoom]               = useState(0.42);
  const [grid, setGrid]               = useState(false);
  const [gridSnap, setGridSnap]       = useState(false);
  const [previewMode, setPreviewMode] = useState(false);
  const [snapGuides, setSnapGuides]   = useState<SnapGuides>({});
  const [nameVal, setNameVal]         = useState(eventName);
  const [editName, setEditName]       = useState(false);
  const [savedAt, setSavedAt]         = useState('just now');
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [fontSearch, setFontSearch]   = useState('');
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [copiedStyle, setCopiedStyle] = useState<Partial<Zone> | null>(null);
  const [styleFlash, setStyleFlash]   = useState(false);
  const [aspectLock, setAspectLock]   = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [applyingTemplateId, setApplyingTemplateId] = useState<string | null>(null);
  const [applyingBg, setApplyingBg] = useState(false);
  const [brandAssets, setBrandAssets] = useState<string[]>([]);
  const [uploadingBrandAsset, setUploadingBrandAsset] = useState(false);
  const [spaceDown, setSpaceDown] = useState(false);
  const [floatBarPos, setFloatBarPos] = useState<{ left: number; top: number } | null>(null);
  const [toolbarOffset, setToolbarOffset] = useState({ dx: 0, dy: 0 });
  const stageContainerRef = useRef<HTMLDivElement>(null);
  const toolbarDragRef    = useRef<{ sx: number; sy: number; odx: number; ody: number } | null>(null);

  /* history */
  const [history, setHistory] = useState<HistoryState>({ past: [], future: [] });

  /* refs */
  const stageRef       = useRef<HTMLDivElement>(null);
  const canvasInnerRef  = useRef<HTMLDivElement>(null);
  const imageUploadRef  = useRef<HTMLInputElement>(null);
  const brandUploadRef  = useRef<HTMLInputElement>(null);
  const bgReplaceRef  = useRef<HTMLInputElement>(null);
  const autosaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const zonesRef      = useRef(zones);
  zonesRef.current    = zones;
  const didMoveRef    = useRef(false);
  const interaction   = useRef<Interaction | null>(null);
  const isPanning     = useRef(false);
  const spaceDownRef  = useRef(false);
  const panStart      = useRef({ x: 0, y: 0, scrollLeft: 0, scrollTop: 0 });

  /* ── mobile detection ──────────────────────────────── */
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check, { passive: true });
    return () => window.removeEventListener("resize", check);
  }, []);

    /* ── load Google Fonts ───────────────────────────────── */
  useEffect(() => {
    const id = 'karta-gfonts';
    if (document.getElementById(id)) return;
    const link = document.createElement('link');
    link.id = id; link.rel = 'stylesheet'; link.href = GOOGLE_FONTS_URL;
    document.head.appendChild(link);
  }, []);

  /* ── load brand kit assets ───────────────────────────── */
  useEffect(() => {
    fetch('/api/brand')
      .then(r => r.ok ? r.json() : {})
      .then((kit: Record<string, unknown>) => {
        if (Array.isArray(kit.assets)) setBrandAssets(kit.assets as string[]);
      })
      .catch(() => {});
  }, []);

  /* ── floating toolbar position ───────────────────────── */
  useEffect(() => {
    if (!selected || previewMode) { setFloatBarPos(null); return; }
    const recalc = () => {
      const canvas = canvasInnerRef.current;
      const container = stageContainerRef.current;
      if (!canvas || !container) return;
      const canvasRect    = canvas.getBoundingClientRect();
      const containerRect = container.getBoundingClientRect();
      const centerX  = canvasRect.left + (selected.x + selected.w / 2) * zoom - containerRect.left;
      const topY     = canvasRect.top  +  selected.y * zoom - containerRect.top - 56;
      setFloatBarPos({ left: centerX, top: topY });
    };
    recalc();
    const el = stageRef.current;
    el?.addEventListener('scroll', recalc, { passive: true });
    return () => el?.removeEventListener('scroll', recalc);
  }, [selected, zoom, previewMode]);

  /* reset drag offset when selection changes */
  useEffect(() => { setToolbarOffset({ dx: 0, dy: 0 }); }, [selected?.id]);

  /* ── variant helpers ─────────────────────────────────── */
  const switchVariant = useCallback((id: string) => {
    setActiveVariantId(id);
    setSelectedIds([]);
    setHistory({ past: [], future: [] });
  }, []);

  /* ── variant management ─────────────────────────────── */
  const handleRenameVariant = useCallback(async (variantId: string, name: string) => {
    const trimmed = name.trim();
    setRenamingVariantId(null);
    if (!trimmed) return;
    setVariants(vs => vs.map(v => v.id === variantId ? { ...v, variant_name: trimmed } : v));
    await fetch(`/api/events/${eventId}/variants/${variantId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ variant_name: trimmed }),
    });
  }, [eventId]);

  const handleDeleteVariant = useCallback(async (variantId: string) => {
    if (variants.length <= 1) return;
    setVariantMenuId(null);
    const res = await fetch(`/api/events/${eventId}/variants/${variantId}`, { method: 'DELETE' });
    if (!res.ok) return;
    const remaining = variants.filter(v => v.id !== variantId);
    setVariants(remaining);
    setVariantZonesMap(m => { const nm = { ...m }; delete nm[variantId]; return nm; });
    if (activeVariantId === variantId && remaining.length > 0) switchVariant(remaining[0].id);
  }, [eventId, variants, activeVariantId, switchVariant]);

  const handleDuplicateVariant = useCallback(async (variantId: string) => {
    setVariantMenuId(null);
    const source = variants.find(v => v.id === variantId);
    if (!source) return;
    const fd = new FormData();
    fd.append('source_variant_id', variantId);
    fd.append('variant_name', source.variant_name + ' copy');
    const res = await fetch(`/api/events/${eventId}/variants`, { method: 'POST', body: fd });
    if (!res.ok) return;
    const nv = await res.json() as Variant;
    const copiedZones = variantZonesMap[variantId] ?? [];
    nv.zones = copiedZones;
    setVariants(vs => [...vs, nv]);
    setVariantZonesMap(m => ({ ...m, [nv.id]: copiedZones }));
    // Save the copied zones immediately
    await fetch(`/api/events/${eventId}/variants/${nv.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ zones: copiedZones }),
    });
    switchVariant(nv.id);
  }, [eventId, variants, variantZonesMap, switchVariant]);

  /* ── autosave ────────────────────────────────────────── */
  const scheduleSave = useCallback((nextZones: Zone[], variantId: string) => {
    if (autosaveTimer.current) clearTimeout(autosaveTimer.current);
    autosaveTimer.current = setTimeout(async () => {
      try {
        await fetchWithRetry(
          `/api/events/${eventId}/variants/${variantId}`,
          {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ zones: nextZones }),
          },
          { attempts: 3, baseDelay: 1000 },
        );
        setSavedAt(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
      } catch {
        // Silent — next edit will trigger another save attempt
      }
    }, 800);
  }, [eventId]);

  const setZonesForVariant = useCallback((variantId: string, nextZones: Zone[]) => {
    setVariantZonesMap(m => ({ ...m, [variantId]: nextZones }));
  }, []);

  const pushHistory = useCallback((nextZones: Zone[]) => {
    setHistory(h => ({ past: [...h.past.slice(-50), zonesRef.current], future: [] }));
    setZonesForVariant(activeVariantId, nextZones);
    scheduleSave(nextZones, activeVariantId);
  }, [scheduleSave, activeVariantId, setZonesForVariant]);

  /* ── zone operations ─────────────────────────────────── */
  const updateZone = useCallback((id: string, patch: Partial<Zone>, withHistory = false) => {
    const next = zonesRef.current.map(z => z.id === id ? { ...z, ...patch } : z);
    if (withHistory) pushHistory(next);
    else { setZonesForVariant(activeVariantId, next); scheduleSave(next, activeVariantId); }
  }, [pushHistory, scheduleSave, activeVariantId, setZonesForVariant]);

  const removeZone = useCallback((id: string) => {
    pushHistory(zonesRef.current.filter(z => z.id !== id));
    setSelectedIds(ids => ids.filter(i => i !== id));
  }, [pushHistory]);

  const removeSelected = useCallback(() => {
    pushHistory(zonesRef.current.filter(z => !selectedIds.includes(z.id)));
    setSelectedIds([]);
  }, [pushHistory, selectedIds]);

  const duplicateZone = useCallback((id: string) => {
    const z = zonesRef.current.find(x => x.id === id);
    if (!z) return;
    const nz: Zone = { ...z, id: 'z' + Math.random().toString(36).slice(2, 7), x: z.x + 30, y: z.y + 30, label: z.label + ' copy' };
    pushHistory([...zonesRef.current, nz]);
    setSelectedIds([nz.id]);
  }, [pushHistory]);

  const moveZoneUp = useCallback((id: string) => {
    const arr = zonesRef.current;
    const idx = arr.findIndex(z => z.id === id);
    if (idx <= 0) return;
    const next = [...arr]; [next[idx - 1], next[idx]] = [next[idx], next[idx - 1]];
    pushHistory(next);
  }, [pushHistory]);

  const moveZoneDown = useCallback((id: string) => {
    const arr = zonesRef.current;
    const idx = arr.findIndex(z => z.id === id);
    if (idx >= arr.length - 1) return;
    const next = [...arr]; [next[idx + 1], next[idx]] = [next[idx], next[idx + 1]];
    pushHistory(next);
  }, [pushHistory]);

  const bringToFront = useCallback((id: string) => {
    const arr = zonesRef.current;
    const zone = arr.find(z => z.id === id);
    if (!zone || arr[arr.length - 1]?.id === id) return;
    pushHistory([...arr.filter(z => z.id !== id), zone]);
  }, [pushHistory]);

  const sendToBack = useCallback((id: string) => {
    const arr = zonesRef.current;
    const zone = arr.find(z => z.id === id);
    if (!zone || arr[0]?.id === id) return;
    pushHistory([zone, ...arr.filter(z => z.id !== id)]);
  }, [pushHistory]);

  /* ── multi-select align / distribute ──────────────────── */
  const alignSelected = useCallback((axis: 'left' | 'centerH' | 'right' | 'top' | 'middleV' | 'bottom') => {
    if (selectedIds.length < 2) return;
    const sel = zonesRef.current.filter(z => selectedIds.includes(z.id));
    const next = zonesRef.current.map(z => {
      if (!selectedIds.includes(z.id)) return z;
      switch (axis) {
        case 'left':    return { ...z, x: Math.min(...sel.map(s => s.x)) };
        case 'right':   return { ...z, x: Math.max(...sel.map(s => s.x + s.w)) - z.w };
        case 'centerH': return { ...z, x: Math.round((Math.min(...sel.map(s => s.x)) + Math.max(...sel.map(s => s.x + s.w))) / 2 - z.w / 2) };
        case 'top':     return { ...z, y: Math.min(...sel.map(s => s.y)) };
        case 'bottom':  return { ...z, y: Math.max(...sel.map(s => s.y + s.h)) - z.h };
        case 'middleV': return { ...z, y: Math.round((Math.min(...sel.map(s => s.y)) + Math.max(...sel.map(s => s.y + s.h))) / 2 - z.h / 2) };
        default: return z;
      }
    });
    pushHistory(next);
  }, [selectedIds, pushHistory]);

  const distributeSelected = useCallback((dir: 'h' | 'v') => {
    if (selectedIds.length < 3) return;
    const sel = [...zonesRef.current.filter(z => selectedIds.includes(z.id))];
    if (dir === 'h') {
      sel.sort((a, b) => a.x - b.x);
      const totalSpace = sel[sel.length - 1].x - sel[0].x;
      const totalW = sel.slice(1, -1).reduce((s, z) => s + z.w, 0);
      const gap = (totalSpace - totalW) / (sel.length - 1);
      let cursor = sel[0].x + sel[0].w + gap;
      const patches: Record<string, number> = {};
      for (let i = 1; i < sel.length - 1; i++) { patches[sel[i].id] = Math.round(cursor); cursor += sel[i].w + gap; }
      pushHistory(zonesRef.current.map(z => patches[z.id] !== undefined ? { ...z, x: patches[z.id] } : z));
    } else {
      sel.sort((a, b) => a.y - b.y);
      const totalSpace = sel[sel.length - 1].y - sel[0].y;
      const totalH = sel.slice(1, -1).reduce((s, z) => s + z.h, 0);
      const gap = (totalSpace - totalH) / (sel.length - 1);
      let cursor = sel[0].y + sel[0].h + gap;
      const patches: Record<string, number> = {};
      for (let i = 1; i < sel.length - 1; i++) { patches[sel[i].id] = Math.round(cursor); cursor += sel[i].h + gap; }
      pushHistory(zonesRef.current.map(z => patches[z.id] !== undefined ? { ...z, y: patches[z.id] } : z));
    }
  }, [selectedIds, pushHistory]);

  const addZone = useCallback((type: 'text' | 'photo' | 'custom' | 'label') => {
    // Scale defaults proportionally to canvas size (calibrated for 1080px baseline)
    const s = bgW / 1080;
    const zoneW  = Math.round(400 * s);
    const zoneH  = Math.round(80  * s);
    const photoS = Math.round(240 * s);
    const textSz = Math.round(48  * s);
    const custSz = Math.round(24  * s);
    const custH  = Math.round(60  * s);
    const base   = { id: 'z' + Math.random().toString(36).slice(2, 7), x: Math.round(bgW / 2 - zoneW / 2), y: Math.round(bgH / 2 - zoneH / 2), required: false };
    let z: Zone;
    if (type === 'text') {
      z = { ...base, type, label: 'Text field', w: zoneW, h: zoneH, font: 'DM Sans', weight: 700, size: textSz, color: '#FFFFFF', align: 'center', verticalAlign: 'top' as const, placeholder: 'Enter text', sample: 'Sample text', lineHeight: 1.2, letterSpacing: 0, opacity: 100, rotation: 0 };
    } else if (type === 'photo') {
      z = { ...base, type, label: 'Photo', w: photoS, h: photoS, shape: 'circle', placeholder: 'Tap to add a photo', sample: '·', opacity: 100, rotation: 0 };
    } else if (type === 'custom') {
      z = { ...base, type, label: 'Custom field', w: zoneW, h: custH, font: 'Inter', weight: 500, size: custSz, color: '#FFFFFF', align: 'center', placeholder: 'Select option', sample: 'Speaker', options: ['Speaker', 'Sponsor', 'Delegate'], opacity: 100, rotation: 0 };
    } else {
      // label
      z = { ...base, type: 'label', label: 'Static text', w: zoneW, h: zoneH, font: 'DM Sans', weight: 700, size: textSz, color: '#FFFFFF', align: 'center', verticalAlign: 'top' as const, placeholder: '', sample: 'I\'m Attending', lineHeight: 1.2, letterSpacing: 0, opacity: 100, rotation: 0 };
    }
    pushHistory([...zonesRef.current, z]);
    setSelectedIds([z.id]);
  }, [pushHistory, bgW, bgH]);

  const addShapeZone = useCallback((shapeType: 'rect' | 'ellipse' | 'triangle' | 'line') => {
    const s = bgW / 1080;
    const isLine = shapeType === 'line';
    const sw = isLine ? Math.round(400 * s) : Math.round(200 * s);
    const sh = isLine ? Math.max(4, Math.round(6  * s)) : Math.round(200 * s);
    const labels: Record<string, string> = { rect: 'Rectangle', ellipse: 'Circle', triangle: 'Triangle', line: 'Line' };
    const z: Zone = {
      id: 'z' + Math.random().toString(36).slice(2, 7),
      type: 'shape',
      label: labels[shapeType] ?? 'Shape',
      x: Math.round(bgW / 2 - sw / 2),
      y: Math.round(bgH / 2 - sh / 2),
      w: sw,
      h: sh,
      shapeType,
      bgColor: '#1F4D3A',
      bgOpacity: 100,
      strokeWidth: 0,
      opacity: 100,
      rotation: 0,
      required: false,
    };
    pushHistory([...zonesRef.current, z]);
    setSelectedIds([z.id]);
  }, [pushHistory, bgW, bgH]);

  const handleImageUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    // Reset so the same file can be re-selected
    if (imageUploadRef.current) imageUploadRef.current.value = '';
    setUploadingImage(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      fd.append('eventId', eventId);
      const res = await fetch('/api/upload-zone-image', { method: 'POST', body: fd });
      if (!res.ok) {
        const { error } = await res.json().catch(() => ({ error: 'Upload failed' }));
        console.error('[upload-zone-image]', error);
        return;
      }
      const { url } = await res.json() as { url: string };
      const s  = bgW / 1080;
      const iW = Math.round(400 * s);
      const iH = Math.round(300 * s);
      const z: Zone = {
        id:       'z' + Math.random().toString(36).slice(2, 7),
        type:     'image',
        label:    file.name.replace(/\.[^.]+$/, '').slice(0, 30),
        x:        Math.round(bgW / 2 - iW / 2),
        y:        Math.round(bgH / 2 - iH / 2),
        w:        iW,
        h:        iH,
        imageUrl: url,
        opacity:  100,
        rotation: 0,
        required: false,
      };
      pushHistory([...zonesRef.current, z]);
      setSelectedIds([z.id]);
    } catch (err) {
      console.error('[upload-zone-image] unexpected error', err);
    } finally {
      setUploadingImage(false);
    }
  }, [eventId, bgW, bgH, pushHistory]);

  const handleBrandUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (brandUploadRef.current) brandUploadRef.current.value = '';
    setUploadingBrandAsset(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      fd.append('eventId', eventId);
      const res = await fetch('/api/upload-zone-image', { method: 'POST', body: fd });
      if (!res.ok) return;
      const { url } = await res.json() as { url: string };
      setBrandAssets(prev => {
        const next = [...prev, url];
        fetch('/api/brand', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ assets: next }),
        }).catch(() => {});
        return next;
      });
    } catch (err) {
      console.error('[brand upload]', err);
    } finally {
      setUploadingBrandAsset(false);
    }
  }, [eventId]);

  const addBrandAssetToCanvas = useCallback((url: string) => {
    const s = bgW / 1080;
    const iW = Math.round(300 * s);
    const iH = Math.round(300 * s);
    const z: Zone = {
      id:       'z' + Math.random().toString(36).slice(2, 7),
      type:     'image',
      label:    'Brand asset',
      x:        Math.round(bgW / 2 - iW / 2),
      y:        Math.round(bgH / 2 - iH / 2),
      w:        iW, h: iH,
      imageUrl: url,
      opacity:  100, rotation: 0, required: false,
    };
    pushHistory([...zonesRef.current, z]);
    setSelectedIds([z.id]);
  }, [bgW, bgH, pushHistory]);

  const handleReplaceBackground = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (bgReplaceRef.current) bgReplaceRef.current.value = '';
    try {
      const fd = new FormData();
      fd.append('file', file);
      fd.append('eventId', eventId);
      const res = await fetch('/api/upload-zone-image', { method: 'POST', body: fd });
      if (!res.ok) return;
      const { url } = await res.json() as { url: string };
      const img = new window.Image();
      img.onload = async () => {
        const w = img.naturalWidth;
        const h = img.naturalHeight;
        setVariants(vs => vs.map(v =>
          v.id === activeVariantId
            ? { ...v, background_url: url, background_width: w, background_height: h }
            : v
        ));
        await fetch(`/api/events/${eventId}/variants/${activeVariantId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ background_url: url, background_width: w, background_height: h }),
        });
      };
      img.src = url;
    } catch (err) {
      console.error('[replace-background]', err);
    }
  }, [eventId, activeVariantId]);

  const onApplyTemplate = useCallback(async (templateId: string) => {
    if (!activeVariantId) return;
    setApplyingTemplateId(templateId);
    try {
      const res = await fetch('/api/apply-template-bg', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ variantId: activeVariantId, templateId }),
      });
      if (!res.ok) throw new Error('Failed to apply template');
      const { backgroundUrl: newUrl, width, height } = await res.json() as { backgroundUrl: string; width: number; height: number };
      setVariants(vs => vs.map(v =>
        v.id === activeVariantId
          ? { ...v, background_url: newUrl, background_width: width, background_height: height }
          : v
      ));
    } catch (err) {
      console.error('[apply-template]', err);
    } finally {
      setApplyingTemplateId(null);
    }
  }, [activeVariantId]);

  const onApplyBackground = useCallback(async (value: string) => {
    if (!activeVariantId) return;
    setApplyingBg(true);
    try {
      const res = await fetch('/api/apply-solid-bg', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ variantId: activeVariantId, value }),
      });
      if (!res.ok) throw new Error('Failed to apply background');
      const { backgroundUrl: newUrl, width, height } = await res.json() as { backgroundUrl: string; width: number; height: number };
      setVariants(vs => vs.map(v =>
        v.id === activeVariantId
          ? { ...v, background_url: newUrl, background_width: width, background_height: height }
          : v
      ));
    } catch (err) {
      console.error('[apply-solid-bg]', err);
    } finally {
      setApplyingBg(false);
    }
  }, [activeVariantId]);

  /* ── undo / redo ─────────────────────────────────────── */
  const undo = useCallback(() => {
    setHistory(h => {
      if (!h.past.length) return h;
      const prev = h.past[h.past.length - 1];
      setZonesForVariant(activeVariantId, prev);
      scheduleSave(prev, activeVariantId);
      return { past: h.past.slice(0, -1), future: [zonesRef.current, ...h.future] };
    });
  }, [scheduleSave, activeVariantId, setZonesForVariant]);

  const redo = useCallback(() => {
    setHistory(h => {
      if (!h.future.length) return h;
      const next = h.future[0];
      setZonesForVariant(activeVariantId, next);
      scheduleSave(next, activeVariantId);
      return { past: [...h.past, zonesRef.current], future: h.future.slice(1) };
    });
  }, [scheduleSave, activeVariantId, setZonesForVariant]);

  /* ── copy / paste style ──────────────────────────────── */
  const copyStyle = useCallback(() => {
    if (!selected) return;
    const { id, type, label, x, y, w, h, required, hidden, locked, ...style } = selected;
    void id; void type; void label; void x; void y; void w; void h; void required; void hidden; void locked;
    setCopiedStyle(style);
    setStyleFlash(true);
    setTimeout(() => setStyleFlash(false), 1200);
  }, [selected]);

  const pasteStyle = useCallback(() => {
    if (!selected || !copiedStyle) return;
    updateZone(selected.id, copiedStyle, true);
  }, [selected, copiedStyle, updateZone]);

  /* ── pointer: zone drag / resize / rotate ────────────── */
  const onZonePointerDown = useCallback((e: React.PointerEvent, zone: Zone) => {
    e.stopPropagation();
    didMoveRef.current = false;

    if (e.shiftKey) {
      setSelectedIds(ids => ids.includes(zone.id) ? ids.filter(i => i !== zone.id) : [...ids, zone.id]);
    } else {
      if (!selectedIds.includes(zone.id)) setSelectedIds([zone.id]);
    }

    // Multi-select move: store all starting positions
    const relevantIds = e.shiftKey ? selectedIds : selectedIds.includes(zone.id) ? selectedIds : [zone.id];
    const multiPositions: Record<string, { x: number; y: number }> = {};
    for (const sid of relevantIds) {
      const sz = zonesRef.current.find(z => z.id === sid);
      if (sz) multiPositions[sid] = { x: sz.x, y: sz.y };
    }

    interaction.current = {
      mode: 'move', id: zone.id,
      sx: e.clientX, sy: e.clientY,
      ox: zone.x, oy: zone.y, ow: zone.w, oh: zone.h,
      multiPositions,
    };
    document.body.classList.add('cursor-grabbing', 'select-none');
  }, [selectedIds]);

  const onHandlePointerDown = useCallback((e: React.PointerEvent, zone: Zone, dir: string) => {
    e.stopPropagation();
    setSelectedIds([zone.id]);
    didMoveRef.current = false;
    interaction.current = { mode: 'resize', dir, id: zone.id, sx: e.clientX, sy: e.clientY, ox: zone.x, oy: zone.y, ow: zone.w, oh: zone.h };
    document.body.classList.add('select-none');
  }, []);

  const onRotatePointerDown = useCallback((e: React.PointerEvent, zone: Zone) => {
    e.stopPropagation();
    setSelectedIds([zone.id]);
    didMoveRef.current = false;
    const canvasEl = canvasInnerRef.current;
    if (!canvasEl) return;
    const rect = canvasEl.getBoundingClientRect();
    const cx = rect.left + (zone.x + zone.w / 2) * zoom;
    const cy = rect.top  + (zone.y + zone.h / 2) * zoom;
    const startMouseAngle = Math.atan2(e.clientY - cy, e.clientX - cx);
    interaction.current = {
      mode: 'rotate', id: zone.id,
      sx: e.clientX, sy: e.clientY,
      ox: zone.x, oy: zone.y, ow: zone.w, oh: zone.h,
      startMouseAngle,
      startRotation: zone.rotation ?? 0,
    };
    document.body.classList.add('select-none');
  }, [zoom]);

  /* ── global pointer move / up ────────────────────────── */
  useEffect(() => {
    const SNAP = 6 / zoom;  // 6 visual px threshold

    const DRAG_THRESHOLD_PX = 5; // must move this many px before it counts as a drag

    let rafId: number | null = null;
    let pendingEvent: PointerEvent | null = null;

    // RAF-throttled wrapper — runs processMove at most once per animation frame
    const onMove = (e: PointerEvent) => {
      pendingEvent = e;
      if (rafId !== null) return;
      rafId = requestAnimationFrame(() => {
        rafId = null;
        if (pendingEvent) { processMove(pendingEvent); pendingEvent = null; }
      });
    };

    const processMove = (e: PointerEvent) => {
      const it = interaction.current;
      if (!it) return;
      // Only count as a drag once the pointer has moved past the dead-zone
      if (!didMoveRef.current) {
        const dist = Math.hypot(e.clientX - it.sx, e.clientY - it.sy);
        if (dist < DRAG_THRESHOLD_PX) return;
      }
      didMoveRef.current = true;

      if (it.mode === 'rotate') {
        const canvasEl = canvasInnerRef.current;
        if (!canvasEl) return;
        const rect = canvasEl.getBoundingClientRect();
        const cx = rect.left + (it.ox + it.ow / 2) * zoom;
        const cy = rect.top  + (it.oy + it.oh / 2) * zoom;
        const curAngle = Math.atan2(e.clientY - cy, e.clientX - cx);
        const delta = (curAngle - it.startMouseAngle!) * (180 / Math.PI);
        let newRot = ((it.startRotation! + delta) % 360 + 360) % 360;
        if (e.shiftKey) newRot = Math.round(newRot / 15) * 15;
        updateZone(it.id, { rotation: Math.round(newRot) });
        return;
      }

      const dx = (e.clientX - it.sx) / zoom;
      const dy = (e.clientY - it.sy) / zoom;
      const guides: SnapGuides = {};

      if (it.mode === 'move') {
        // Multi-move
        if (it.multiPositions && Object.keys(it.multiPositions).length > 1) {
          const next = zonesRef.current.map(z => {
            const sp = it.multiPositions![z.id];
            if (!sp) return z;
            let nx = Math.max(0, Math.min(bgW - z.w, sp.x + dx));
            let ny = Math.max(0, Math.min(bgH - z.h, sp.y + dy));
            if (gridSnap) { nx = Math.round(nx / GRID_SIZE) * GRID_SIZE; ny = Math.round(ny / GRID_SIZE) * GRID_SIZE; }
            return { ...z, x: Math.round(nx), y: Math.round(ny) };
          });
          setZonesForVariant(activeVariantId, next);
        } else {
          // Single move with snap
          let nx = Math.max(0, Math.min(bgW - it.ow, it.ox + dx));
          let ny = Math.max(0, Math.min(bgH - it.oh, it.oy + dy));

          if (gridSnap) {
            nx = Math.round(nx / GRID_SIZE) * GRID_SIZE;
            ny = Math.round(ny / GRID_SIZE) * GRID_SIZE;
          } else if (!e.ctrlKey) {
            // Build snap candidate lists from canvas edges/center + other zones' edges/centers
            const others = zonesRef.current.filter(z => z.id !== it.id);
            const snapX: number[] = [0, bgW / 2, bgW];
            const snapY: number[] = [0, bgH / 2, bgH];
            for (const oz of others) {
              snapX.push(oz.x, oz.x + oz.w / 2, oz.x + oz.w);
              snapY.push(oz.y, oz.y + oz.h / 2, oz.y + oz.h);
            }
            // Try snapping dragged zone's left/center/right to candidate X positions
            let bestXDist = SNAP;
            for (const cx of snapX) {
              const d0 = Math.abs(nx - cx);               // left edge
              const d1 = Math.abs(nx + it.ow / 2 - cx);  // center
              const d2 = Math.abs(nx + it.ow - cx);       // right edge
              if (d0 <= bestXDist) { bestXDist = d0; nx = cx; guides.x = cx; }
              if (d1 <= bestXDist) { bestXDist = d1; nx = cx - it.ow / 2; guides.x = cx; }
              if (d2 <= bestXDist) { bestXDist = d2; nx = cx - it.ow; guides.x = cx; }
            }
            // Try snapping dragged zone's top/middle/bottom to candidate Y positions
            let bestYDist = SNAP;
            for (const cy of snapY) {
              const d0 = Math.abs(ny - cy);               // top edge
              const d1 = Math.abs(ny + it.oh / 2 - cy);  // center
              const d2 = Math.abs(ny + it.oh - cy);       // bottom edge
              if (d0 <= bestYDist) { bestYDist = d0; ny = cy; guides.y = cy; }
              if (d1 <= bestYDist) { bestYDist = d1; ny = cy - it.oh / 2; guides.y = cy; }
              if (d2 <= bestYDist) { bestYDist = d2; ny = cy - it.oh; guides.y = cy; }
            }
            nx = Math.max(0, Math.min(bgW - it.ow, nx));
            ny = Math.max(0, Math.min(bgH - it.oh, ny));
          }
          setSnapGuides(guides);
          updateZone(it.id, { x: Math.round(nx), y: Math.round(ny) });
        }
      } else if (it.mode === 'resize' && it.dir) {
        const d = it.dir;
        let nx = it.ox, ny = it.oy, nw = it.ow, nh = it.oh;
        if (d.includes('e')) nw = Math.max(40, it.ow + dx);
        if (d.includes('s')) nh = Math.max(20, it.oh + dy);
        if (d.includes('w')) { nw = Math.max(40, it.ow - dx); nx = it.ox + (it.ow - nw); }
        if (d.includes('n')) { nh = Math.max(20, it.oh - dy); ny = it.oy + (it.oh - nh); }
        nx = Math.max(0, nx); ny = Math.max(0, ny);
        nw = Math.min(nw, bgW - nx); nh = Math.min(nh, bgH - ny);
        if (e.shiftKey) {
          // Shift key: lock to true square
          const s = Math.max(nw, nh); nw = s; nh = s;
        } else if (aspectLock) {
          // Aspect lock: maintain original ratio
          const ratio = it.ow / it.oh;
          const d = it.dir!;
          if (d.includes('n') || d.includes('s')) { nw = nh * ratio; }
          else { nh = nw / ratio; }
        }
        updateZone(it.id, { x: Math.round(nx), y: Math.round(ny), w: Math.round(nw), h: Math.round(nh) });
      }
    };

    const onUp = () => {
      if (rafId !== null) { cancelAnimationFrame(rafId); rafId = null; }
      pendingEvent = null;
      if (interaction.current && didMoveRef.current) {
        setHistory(h => ({ past: [...h.past.slice(-50), zonesRef.current], future: [] }));
      }
      interaction.current = null;
      didMoveRef.current = false;
      setSnapGuides({});
      document.body.classList.remove('cursor-grabbing', 'select-none');
    };

    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    return () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      if (rafId !== null) cancelAnimationFrame(rafId);
    };
  }, [zoom, updateZone, bgW, bgH, gridSnap, activeVariantId, setZonesForVariant, aspectLock]);

  /* ── keyboard shortcuts ──────────────────────────────── */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const inInput = (e.target as HTMLElement).tagName === 'INPUT' || (e.target as HTMLElement).tagName === 'TEXTAREA';
      if (inInput) return;

      const meta = e.metaKey || e.ctrlKey;

      if (e.key === 'Escape') { setSelectedIds([]); setShowShortcuts(false); return; }
      if (e.key === 'Backspace' || e.key === 'Delete') {
        if (selectedIds.length) { e.preventDefault(); removeSelected(); }
        return;
      }
      if (meta && e.key === 'z') { e.preventDefault(); if (e.shiftKey) { redo(); } else { undo(); } return; }
      if (meta && e.key === 'y') { e.preventDefault(); redo(); return; }
      if (meta && e.key === 'd' && selectedId) { e.preventDefault(); duplicateZone(selectedId); return; }
      if (meta && e.key === 'p') { e.preventDefault(); setPreviewMode(p => !p); return; }
      if (meta && e.key === '/') { e.preventDefault(); setShowShortcuts(s => !s); return; }
      if (meta && e.altKey && e.key === 'c') { e.preventDefault(); copyStyle(); return; }
      if (meta && e.altKey && e.key === 'v') { e.preventDefault(); pasteStyle(); return; }
      if (e.key === 'g') { setGrid(g => !g); return; }
      if (meta && (e.key === '=' || e.key === '+')) { e.preventDefault(); setZoom(z => Math.min(3, z + 0.15)); return; }
      if (meta && e.key === '-') { e.preventDefault(); setZoom(z => Math.max(0.1, z - 0.15)); return; }
      if (e.key === ' ') { e.preventDefault(); setSpaceDown(true); spaceDownRef.current = true; return; }

      // Arrow nudge
      if (selected && !selected.locked) {
        const step = e.shiftKey ? 10 : 1;
        if (e.key === 'ArrowLeft')  { e.preventDefault(); updateZone(selected.id, { x: Math.max(0, selected.x - step) }, true); }
        if (e.key === 'ArrowRight') { e.preventDefault(); updateZone(selected.id, { x: Math.min(bgW - selected.w, selected.x + step) }, true); }
        if (e.key === 'ArrowUp')    { e.preventDefault(); updateZone(selected.id, { y: Math.max(0, selected.y - step) }, true); }
        if (e.key === 'ArrowDown')  { e.preventDefault(); updateZone(selected.id, { y: Math.min(bgH - selected.h, selected.y + step) }, true); }
        if (e.key === '[')  { e.preventDefault(); moveZoneDown(selected.id); }
        if (e.key === ']')  { e.preventDefault(); moveZoneUp(selected.id); }
      }
    };
    const onKeyUp = (e: KeyboardEvent) => {
      if (e.key === ' ') { setSpaceDown(false); spaceDownRef.current = false; }
    };
    window.addEventListener('keydown', onKey);
    window.addEventListener('keyup', onKeyUp);
    return () => { window.removeEventListener('keydown', onKey); window.removeEventListener('keyup', onKeyUp); };
  }, [selected, selectedId, selectedIds, undo, redo, removeSelected, duplicateZone, updateZone, bgW, bgH, copyStyle, pasteStyle, moveZoneUp, moveZoneDown]);

  /* ── fit zoom on mount / variant change ──────────────── */
  useEffect(() => {
    const fit = () => {
      const el = stageRef.current;
      if (!el) return;
      const pad = 80;
      setZoom(Math.max(0.18, Math.min(1.4, Math.min((el.clientWidth - pad) / bgW, (el.clientHeight - pad) / bgH))));
    };
    fit();
    window.addEventListener('resize', fit);
    return () => window.removeEventListener('resize', fit);
  }, [bgW, bgH, activeVariantId]);

  /* ── scroll-to-zoom ──────────────────────────────────── */
  useEffect(() => {
    const el = stageRef.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      if (!(e.metaKey || e.ctrlKey)) return;
      e.preventDefault();
      setZoom(z => Math.max(0.1, Math.min(3, z * (e.deltaY > 0 ? 0.92 : 1.08))));
    };
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, []);

  /* ── re-center canvas after zoom changes ─────────────── */
  useEffect(() => {
    const el = stageRef.current;
    if (!el) return;
    requestAnimationFrame(() => {
      el.scrollLeft = Math.max(0, (el.scrollWidth - el.clientWidth)  / 2);
      el.scrollTop  = Math.max(0, (el.scrollHeight - el.clientHeight) / 2);
    });
  }, [zoom]);

  /* ── add variant ─────────────────────────────────────── */
  const handleAddVariant = async () => {
    if (!newVariantName.trim() || !newVariantFile) return;
    setAddingVariant(true);
    setVariantLimitHit(false);
    try {
      const fd = new FormData();
      fd.append('variant_name', newVariantName.trim());
      fd.append('file', newVariantFile);
      const res = await fetch(`/api/events/${eventId}/variants`, { method: 'POST', body: fd });
      if (res.status === 402) {
        setVariantLimitHit(true);
        return;
      }
      if (!res.ok) throw new Error('failed');
      const nv = await res.json() as Variant;
      nv.zones = [];
      setVariants(v => [...v, nv]);
      setVariantZonesMap(m => ({ ...m, [nv.id]: [] }));
      switchVariant(nv.id);
      setShowAddVariant(false);
      setNewVariantName(''); setNewVariantFile(null);
    } finally { setAddingVariant(false); }
  };

  const saveName = async () => {
    setEditName(false);
    await fetch(`/api/events/${eventId}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: nameVal }) });
  };

  const fitZoom = () => {
    const el = stageRef.current;
    if (!el) return;
    const pad = 80;
    setZoom(Math.max(0.18, Math.min(1.4, Math.min((el.clientWidth - pad) / bgW, (el.clientHeight - pad) / bgH))));
  };

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const filteredFonts = FONTS.filter(f => f.toLowerCase().includes(fontSearch.toLowerCase()));

  /* ══════════════════════════════════════════════════════
     RENDER
  ══════════════════════════════════════════════════════ */

  /* ── Mobile gate — canvas editor requires desktop (<768px) ── */
  if (isMobile) {
    return <MobileFallback eventId={eventId} eventName={nameVal} />;
  }

  // Determine right sidebar mode
  const sidebarMode: RightSidebarMode = previewMode
    ? 'preview'
    : selectedIds.length > 1
    ? 'multiselect'
    : selected
    ? 'zone'
    : 'event';

  return (
    <div className="flex flex-col" style={{ height: '100vh', overflow: 'hidden', background: '#FAF6EE' }}>

      {/* ── Top Bar ──────────────────────────────────────── */}
      <TopBar
        eventId={eventId}
        nameVal={nameVal}
        setNameVal={setNameVal}
        editName={editName}
        setEditName={setEditName}
        saveName={saveName}
        pastLength={history.past.length}
        futureLength={history.future.length}
        undo={undo}
        redo={redo}
        savedAt={savedAt}
        previewMode={previewMode}
        setPreviewMode={setPreviewMode}
        showShortcuts={showShortcuts}
        setShowShortcuts={setShowShortcuts}
        selected={selected}
        copiedStyle={copiedStyle}
        styleFlash={styleFlash}
        copyStyle={copyStyle}
        pasteStyle={pasteStyle}
        router={router}
      />

      {/* ── Variant Tabs ─────────────────────────────────── */}
      <VariantsTabs
        variants={variants}
        activeVariantId={activeVariantId}
        variantZonesMap={variantZonesMap}
        variantMenuId={variantMenuId}
        setVariantMenuId={setVariantMenuId}
        renamingVariantId={renamingVariantId}
        setRenamingVariantId={setRenamingVariantId}
        renameValue={renameValue}
        setRenameValue={setRenameValue}
        switchVariant={switchVariant}
        handleRenameVariant={handleRenameVariant}
        handleDeleteVariant={handleDeleteVariant}
        handleDuplicateVariant={handleDuplicateVariant}
        onAddVariant={() => setShowAddVariant(true)}
        bgW={bgW}
        bgH={bgH}
      />

      <div className="flex-1 flex min-h-0">

        {/* ── Left Rail ───────────────────────────────────── */}
        <LeftRail
          previewMode={previewMode}
          addZone={addZone}
          addShapeZone={addShapeZone}
          uploadingImage={uploadingImage}
          imageUploadRef={imageUploadRef}
          handleImageUpload={handleImageUpload}
          zones={zones}
          selectedIds={selectedIds}
          setSelectedIds={setSelectedIds}
          moveZoneUp={moveZoneUp}
          moveZoneDown={moveZoneDown}
          updateZone={updateZone}
          onApplyTemplate={onApplyTemplate}
          applyingTemplateId={applyingTemplateId}
          onApplyBackground={onApplyBackground}
          applyingBg={applyingBg}
          brandAssets={brandAssets}
          brandUploadRef={brandUploadRef}
          handleBrandUpload={handleBrandUpload}
          uploadingBrandAsset={uploadingBrandAsset}
          addBrandAssetToCanvas={addBrandAssetToCanvas}
        />

        {/* ── Stage ───────────────────────────────────────── */}
        <div ref={stageContainerRef} className="flex-1 flex flex-col overflow-hidden" style={{ position: 'relative' }}>
          {/* Canvas dims chip — non-scrolling overlay at top of stage */}
          {!previewMode && (
            <div style={{
              position: 'absolute', top: 10, left: '50%', transform: 'translateX(-50%)',
              display: 'inline-flex', alignItems: 'center', gap: 6,
              padding: '4px 10px',
              background: '#FFFFFF', border: '1px solid #E5E0D4',
              borderRadius: 6,
              fontFamily: 'JetBrains Mono, monospace', fontSize: 10,
              color: '#3A4A42', letterSpacing: '0.04em',
              zIndex: 10, pointerEvents: 'none', whiteSpace: 'nowrap',
            }}>
              <span style={{ color: '#6B7A72' }}>canvas</span>
              <span style={{ color: '#0F1F18', fontWeight: 500 }}>{bgW} × {bgH} px</span>
              <span style={{ width: 1, height: 12, background: '#E5E0D4' }} />
              <span style={{ color: '#6B7A72' }}>{Math.round(zoom * 100)}%</span>
            </div>
          )}

          {/* Scrollable canvas area */}
          <div
            ref={stageRef}
            className={`flex-1 overflow-auto${spaceDown ? ' cursor-grab' : ''}`}
            style={{ position: 'relative', backgroundColor: '#F5F1E6', backgroundImage: 'radial-gradient(#C9C3B1 0.8px, transparent 0.8px)', backgroundSize: '14px 14px', backgroundAttachment: 'local' }}
            onPointerDown={e => {
              if (spaceDownRef.current) {
                isPanning.current = true;
                panStart.current = { x: e.clientX, y: e.clientY, scrollLeft: stageRef.current!.scrollLeft, scrollTop: stageRef.current!.scrollTop };
                (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
                return;
              }
              if (!interaction.current) setSelectedIds([]);
            }}
            onPointerMove={e => {
              if (!isPanning.current) return;
              const dx = e.clientX - panStart.current.x;
              const dy = e.clientY - panStart.current.y;
              if (stageRef.current) {
                stageRef.current.scrollLeft = panStart.current.scrollLeft - dx;
                stageRef.current.scrollTop  = panStart.current.scrollTop  - dy;
              }
            }}
            onPointerUp={() => { isPanning.current = false; }}
          >
            {/* Centering wrapper: fills stage when canvas is small, expands when canvas is large */}
            <div style={{ minWidth: '100%', minHeight: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 80, boxSizing: 'border-box' }}>
              <div style={{ width: bgW * zoom, height: bgH * zoom, position: 'relative', flexShrink: 0 }}>
                <div
                  ref={canvasInnerRef}
                  className="relative shadow-lift rounded-md"
                  style={{ width: bgW, height: bgH, transform: `scale(${zoom})`, transformOrigin: '0 0', position: 'absolute', top: 0, left: 0 }}
                  onPointerDown={e => {
                    e.stopPropagation();
                    // clicking the canvas background (not a zone) deselects
                    if (e.target === e.currentTarget && !previewMode) setSelectedIds([]);
                  }}
                  onDoubleClick={e => e.stopPropagation()}
                >
                {/* Background image */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={backgroundUrl} alt="" className="absolute inset-0 w-full h-full object-cover rounded-md pointer-events-none" draggable={false} />

                {/* Grid overlay */}
                {grid && (
                  <div className="absolute inset-0 pointer-events-none rounded-md" style={{
                    backgroundImage: 'linear-gradient(to right,rgba(31,77,58,0.10) 1px,transparent 1px),linear-gradient(to bottom,rgba(31,77,58,0.10) 1px,transparent 1px)',
                    backgroundSize: `${GRID_SIZE}px ${GRID_SIZE}px`,
                  }} />
                )}

                {/* Snap guides — magenta alignment lines */}
                {snapGuides.x !== undefined && (
                  <div className="absolute top-0 bottom-0 pointer-events-none" style={{ left: snapGuides.x, width: 1, background: 'rgba(255,0,204,0.85)', boxShadow: '0 0 6px rgba(255,0,204,0.5)' }} />
                )}
                {snapGuides.y !== undefined && (
                  <div className="absolute left-0 right-0 pointer-events-none" style={{ top: snapGuides.y, height: 1, background: 'rgba(255,0,204,0.85)', boxShadow: '0 0 6px rgba(255,0,204,0.5)' }} />
                )}

                {/* Zones */}
                {zones.map(z => (
                  <ZoneEl
                    key={z.id}
                    zone={z}
                    zoom={zoom}
                    selected={selectedIds.includes(z.id) && !previewMode}
                    multiSelected={selectedIds.length > 1 && selectedIds.includes(z.id)}
                    previewMode={previewMode}
                    onPointerDown={e => { if (!z.locked && !previewMode) onZonePointerDown(e, z); }}
                    onHandle={(e, dir) => onHandlePointerDown(e, z, dir)}
                    onRotate={e => { if (!z.locked && !previewMode) onRotatePointerDown(e, z); }}
                  />
                ))}

                {/* floating toolbar is now viewport-anchored — see stageContainerRef section */}

                {/* Corner brackets */}
                {!previewMode && (
                  <>
                    <span className="absolute -top-1 -left-1 h-3 w-3 border-t border-l border-primary/50 pointer-events-none" />
                    <span className="absolute -top-1 -right-1 h-3 w-3 border-t border-r border-primary/50 pointer-events-none" />
                    <span className="absolute -bottom-1 -left-1 h-3 w-3 border-b border-l border-primary/50 pointer-events-none" />
                    <span className="absolute -bottom-1 -right-1 h-3 w-3 border-b border-r border-primary/50 pointer-events-none" />
                  </>
                )}

                {/* Empty canvas state */}
                {zones.length === 0 && !previewMode && (
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div style={{
                      display: 'inline-flex', alignItems: 'center', gap: 6,
                      padding: '6px 12px',
                      background: 'rgba(15,31,24,0.55)',
                      backdropFilter: 'blur(4px)',
                      borderRadius: 999,
                      fontFamily: 'JetBrains Mono, monospace',
                      fontSize: 11, letterSpacing: '0.08em',
                      textTransform: 'uppercase' as const,
                      color: 'rgba(255,255,255,0.7)',
                    }}>
                      No zones yet
                    </div>
                  </div>
                )}

                {previewMode && (
                  <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/50 text-white/70 text-[11px] font-mono px-3 py-1.5 rounded-full pointer-events-none">
                    PREVIEW — ⌘P to edit
                  </div>
                )}
              </div>
            </div>
          </div>
          </div>

          {/* ── Floating context toolbar — draggable, viewport-anchored ── */}
          {floatBarPos && selected && !previewMode && (() => {
            const containerW = stageContainerRef.current?.offsetWidth ?? 9999;
            // Always translateX(-50%) so the toolbar is centered on `left`.
            // Dragging shifts that center point — no transform switching = no jump.
            const rawLeft  = floatBarPos.left + toolbarOffset.dx;
            const finalLeft = Math.max(80, Math.min(rawLeft, containerW - 80));
            const finalTop  = Math.max(8, floatBarPos.top + toolbarOffset.dy);
            const isBold    = (selected.weight ?? 400) >= 700;
            const align     = selected.align ?? 'center';
            const opacity   = selected.opacity ?? 100;
            const isText    = selected.type === 'text' || selected.type === 'label' || selected.type === 'custom';
            const sep       = <span className="h-5 w-px shrink-0" style={{ background: '#E5E0D4', margin: '0 3px' }} />;
            return (
              <div
                role="toolbar"
                aria-label={`Format ${selected.label}`}
                className="absolute z-30"
                style={{
                  left: finalLeft,
                  top: finalTop,
                  transform: 'translateX(-50%)',   /* always centered — drag just moves the center */
                  filter: 'drop-shadow(0 8px 24px rgba(15,31,24,0.14)) drop-shadow(0 2px 4px rgba(15,31,24,0.08))',
                }}
                onClick={e => e.stopPropagation()}
                onPointerDown={e => e.stopPropagation()}
              >
                {/* ── arrow tip pointing down at element ── */}
                <div className="flex justify-center pointer-events-none" style={{ marginBottom: -1 }}>
                  <div style={{ width: 10, height: 6, background: 'white', clipPath: 'polygon(50% 100%, 0 0, 100% 0)', border: '1px solid #E5E0D4' }} />
                </div>

                <div
                  className="flex items-center bg-white rounded-2xl"
                  style={{ border: '1px solid #E5E0D4', padding: '4px 6px', gap: 1, whiteSpace: 'nowrap' }}
                >
                  {/* ── Grip / drag handle ── */}
                  <div
                    role="button"
                    aria-label="Drag toolbar to reposition"
                    title="Drag to move toolbar"
                    className="h-7 w-6 shrink-0 flex items-center justify-center rounded-lg hover:bg-[#FAF6EE] transition select-none"
                    style={{ cursor: 'grab', color: 'rgba(15,31,24,0.3)', touchAction: 'none' }}
                    onPointerDown={e => {
                      e.preventDefault();
                      e.stopPropagation();
                      // Store drag start + current offset snapshot
                      toolbarDragRef.current = {
                        sx: e.clientX, sy: e.clientY,
                        odx: toolbarOffset.dx, ody: toolbarOffset.dy,
                      };
                      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
                      (e.currentTarget as HTMLElement).style.cursor = 'grabbing';
                    }}
                    onPointerMove={e => {
                      if (!toolbarDragRef.current) return;
                      e.stopPropagation();
                      setToolbarOffset({
                        dx: toolbarDragRef.current.odx + (e.clientX - toolbarDragRef.current.sx),
                        dy: toolbarDragRef.current.ody + (e.clientY - toolbarDragRef.current.sy),
                      });
                    }}
                    onPointerUp={e => {
                      e.stopPropagation();
                      toolbarDragRef.current = null;
                      (e.currentTarget as HTMLElement).style.cursor = 'grab';
                    }}
                    onPointerCancel={() => { toolbarDragRef.current = null; }}
                  >
                    {/* 2×3 dot grip */}
                    <svg width="8" height="12" viewBox="0 0 8 12" fill="currentColor">
                      <circle cx="2" cy="2"  r="1.2"/><circle cx="6" cy="2"  r="1.2"/>
                      <circle cx="2" cy="6"  r="1.2"/><circle cx="6" cy="6"  r="1.2"/>
                      <circle cx="2" cy="10" r="1.2"/><circle cx="6" cy="10" r="1.2"/>
                    </svg>
                  </div>

                  {sep}

                  {/* ── TEXT / LABEL / CUSTOM ── */}
                  {isText && (
                    <>
                      {/* Font family */}
                      <select
                        aria-label="Font family"
                        value={selected.font ?? 'DM Sans'}
                        onChange={e => updateZone(selected.id, { font: e.target.value })}
                        title="Font family"
                        className="h-7 pl-2 pr-0.5 rounded-lg text-[11.5px] font-medium outline-none hover:bg-[#FAF6EE] focus:bg-[#FAF6EE] cursor-pointer transition"
                        style={{ maxWidth: 110, background: 'transparent', border: 'none', color: '#0F1F18' }}
                      >
                        {FONTS.map(f => <option key={f} value={f}>{f}</option>)}
                      </select>

                      {sep}

                      {/* Size − N + */}
                      <div
                        role="group"
                        aria-label="Font size"
                        className="flex items-center rounded-lg overflow-hidden shrink-0"
                        style={{ border: '1px solid #E5E0D4' }}
                      >
                        <button
                          aria-label="Decrease font size"
                          title="Decrease font size"
                          onClick={() => updateZone(selected.id, { size: Math.max(8, (selected.size ?? 32) - 2) })}
                          className="h-7 w-6 flex items-center justify-center hover:bg-[#FAF6EE] text-[#0F1F18]/60 hover:text-[#1F4D3A] active:bg-[#E8EFEB] transition text-[15px] font-light select-none"
                        >−</button>
                        <input
                          type="number" min="8" max="400"
                          aria-label="Font size value"
                          value={selected.size ?? 32}
                          onChange={e => { const v = Number(e.target.value); if (v >= 8) updateZone(selected.id, { size: v }); }}
                          className="h-7 w-9 text-center text-[11px] font-mono outline-none"
                          style={{ background: '#FAF6EE', border: 'none', color: '#0F1F18' }}
                        />
                        <button
                          aria-label="Increase font size"
                          title="Increase font size"
                          onClick={() => updateZone(selected.id, { size: Math.min(400, (selected.size ?? 32) + 2) })}
                          className="h-7 w-6 flex items-center justify-center hover:bg-[#FAF6EE] text-[#0F1F18]/60 hover:text-[#1F4D3A] active:bg-[#E8EFEB] transition text-[15px] font-light select-none"
                        >+</button>
                      </div>

                      {sep}

                      {/* Bold */}
                      <button
                        aria-label="Bold"
                        aria-pressed={isBold}
                        title={isBold ? 'Remove bold' : 'Bold'}
                        onClick={() => updateZone(selected.id, { weight: isBold ? 400 : 700 })}
                        className="h-7 w-7 rounded-lg grid place-items-center text-[13px] font-bold transition select-none active:scale-95"
                        style={isBold ? { background: '#1F4D3A', color: 'white' } : { color: '#0F1F18', opacity: 0.6 }}
                      >B</button>

                      {sep}

                      {/* Text align — letter labels so L/C/R are instantly readable */}
                      <div role="group" aria-label="Text alignment" className="flex items-center rounded-lg overflow-hidden shrink-0" style={{ border: '1px solid #E5E0D4' }}>
                        {([['left', 'L', 'Align left'], ['center', 'C', 'Align center'], ['right', 'R', 'Align right']] as [string, string, string][]).map(([v, letter, label]) => (
                          <button key={v}
                            aria-label={label} aria-pressed={align === v} title={label}
                            onClick={() => updateZone(selected.id, { align: v as Zone['align'] })}
                            className="h-7 w-7 flex items-center justify-center text-[11px] font-bold transition active:scale-95 select-none"
                            style={align === v
                              ? { background: '#1F4D3A', color: 'white' }
                              : { background: 'transparent', color: 'rgba(15,31,24,0.45)' }}
                          >{letter}</button>
                        ))}
                      </div>

                      {sep}

                      {/* Text color — "A" with colored underline strip (Word / Figma / Canva standard) */}
                      <label
                        aria-label={`Text color: ${selected.color ?? '#FFFFFF'}`}
                        title={`Text color: ${selected.color ?? '#FFFFFF'}`}
                        className="relative h-7 w-8 rounded-lg flex flex-col items-center justify-center hover:bg-[#FAF6EE] transition cursor-pointer shrink-0 select-none overflow-hidden gap-[2px]"
                      >
                        <span className="text-[13px] font-bold leading-none pointer-events-none" style={{ color: '#0F1F18' }}>A</span>
                        <div
                          className="w-5 rounded-sm pointer-events-none"
                          style={{ height: 3, background: selected.color ?? '#FFFFFF', boxShadow: '0 0 0 0.75px rgba(0,0,0,0.2)' }}
                        />
                        <input
                          type="color" value={selected.color ?? '#FFFFFF'}
                          aria-label="Pick text color"
                          onChange={e => updateZone(selected.id, { color: e.target.value })}
                          className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                          style={{ padding: 0 }}
                        />
                      </label>

                      {sep}
                    </>
                  )}

                  {/* ── PHOTO shape — CSS shape previews so circle/rounded/square are visually obvious ── */}
                  {selected.type === 'photo' && (
                    <>
                      <div role="group" aria-label="Photo shape" className="flex items-center gap-1 shrink-0 rounded-lg overflow-hidden" style={{ border: '1px solid #E5E0D4' }}>
                        {([
                          ['circle',  '9999px', 'Circle'],
                          ['rounded', '4px',    'Rounded'],
                          ['square',  '1px',    'Square'],
                        ] as [string, string, string][]).map(([v, radius, label]) => {
                          const active = (selected.shape ?? 'circle') === v;
                          return (
                            <button key={v}
                              aria-label={label} aria-pressed={active} title={label}
                              onClick={() => updateZone(selected.id, { shape: v as Zone['shape'] })}
                              className="h-7 w-9 flex items-center justify-center transition active:scale-95"
                              style={active ? { background: '#1F4D3A' } : { background: 'transparent' }}
                            >
                              <div style={{
                                width: 14, height: 14, borderRadius: radius,
                                border: `2px solid ${active ? 'white' : 'rgba(15,31,24,0.4)'}`,
                              }} />
                            </button>
                          );
                        })}
                      </div>
                      {sep}
                    </>
                  )}

                  {/* ── SHAPE fill color ── */}
                  {selected.type === 'shape' && (
                    <>
                      <div
                        role="button"
                        aria-label={`Fill color: ${selected.bgColor ?? '#1F4D3A'}`}
                        title={`Fill color: ${selected.bgColor ?? '#1F4D3A'}`}
                        className="relative h-7 w-7 rounded-lg grid place-items-center hover:bg-[#FAF6EE] transition cursor-pointer mx-0.5 shrink-0"
                      >
                        <div className="h-5 w-5 rounded border-2 border-white overflow-hidden" style={{ background: selected.bgColor ?? '#1F4D3A', boxShadow: '0 0 0 1.5px #E5E0D4' }}>
                          <input type="color" value={selected.bgColor ?? '#1F4D3A'}
                            aria-label="Pick fill color"
                            onChange={e => updateZone(selected.id, { bgColor: e.target.value })}
                            className="absolute inset-0 opacity-0 cursor-pointer w-8 h-8 -top-1.5 -left-1.5" />
                        </div>
                      </div>
                      {sep}
                    </>
                  )}

                  {/* ── Opacity ── */}
                  <div role="group" aria-label={`Opacity: ${opacity}%`} className="flex items-center gap-1.5 px-1 shrink-0">
                    <span className="text-[10px] font-mono w-7 text-right select-none tabular-nums" style={{ color: 'rgba(15,31,24,0.45)' }}>{opacity}%</span>
                    <input
                      type="range" min="10" max="100" value={opacity}
                      aria-label="Opacity"
                      onChange={e => updateZone(selected.id, { opacity: Number(e.target.value) })}
                      className="w-14 accent-primary cursor-pointer" style={{ height: 3 }}
                    />
                  </div>

                  {sep}

                  {/* ── Center H / V ── */}
                  <div role="group" aria-label="Center element" className="flex items-center gap-px">
                    <button
                      aria-label="Center horizontally on canvas"
                      title="Center horizontally"
                      onClick={() => updateZone(selected.id, { x: Math.round(bgW / 2 - selected.w / 2) }, true)}
                      className="h-7 w-7 rounded-lg grid place-items-center transition hover:bg-[#FAF6EE] active:scale-95"
                      style={{ color: 'rgba(15,31,24,0.65)' }}
                    ><AlignHorizontalJustifyCenter size={13} strokeWidth={1.8} /></button>
                    <button
                      aria-label="Center vertically on canvas"
                      title="Center vertically"
                      onClick={() => updateZone(selected.id, { y: Math.round(bgH / 2 - selected.h / 2) }, true)}
                      className="h-7 w-7 rounded-lg grid place-items-center transition hover:bg-[#FAF6EE] active:scale-95"
                      style={{ color: 'rgba(15,31,24,0.65)' }}
                    ><AlignVerticalJustifyCenter size={13} strokeWidth={1.8} /></button>
                  </div>

                  {sep}

                  {/* ── Layer order ── */}
                  <div role="group" aria-label="Layer order" className="flex items-center gap-px">
                    <button
                      aria-label="Bring forward"
                      title="Bring forward  ["
                      onClick={() => moveZoneUp(selected.id)}
                      className="h-7 w-7 rounded-lg grid place-items-center transition hover:bg-[#FAF6EE] active:scale-95"
                      style={{ color: 'rgba(15,31,24,0.65)' }}
                    ><ChevronUp size={13} strokeWidth={1.8} /></button>
                    <button
                      aria-label="Send backward"
                      title="Send backward  ]"
                      onClick={() => moveZoneDown(selected.id)}
                      className="h-7 w-7 rounded-lg grid place-items-center transition hover:bg-[#FAF6EE] active:scale-95"
                      style={{ color: 'rgba(15,31,24,0.65)' }}
                    ><ChevronDown size={13} strokeWidth={1.8} /></button>
                  </div>

                  {sep}

                  {/* ── Duplicate / Delete ── */}
                  <button
                    aria-label="Duplicate element (⌘D)"
                    title="Duplicate (⌘D)"
                    onClick={() => duplicateZone(selected.id)}
                    className="h-7 w-7 rounded-lg grid place-items-center transition hover:bg-[#FAF6EE] active:scale-95"
                    style={{ color: 'rgba(15,31,24,0.65)' }}
                  ><Copy size={13} strokeWidth={1.8} /></button>
                  <button
                    aria-label="Delete element (⌫)"
                    title="Delete (⌫)"
                    onClick={() => removeZone(selected.id)}
                    className="h-7 w-7 rounded-lg grid place-items-center transition hover:bg-red-50 active:scale-95"
                    style={{ color: '#f87171' }}
                  ><Trash2 size={13} strokeWidth={1.8} /></button>

                </div>
              </div>
            );
          })()}

          {/* Multi-select badge — viewport-fixed, not inside scroll area */}
          {selectedIds.length > 1 && !previewMode && (
            <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-primary text-white text-[11.5px] font-mono px-3 py-1.5 rounded-full shadow-lift pointer-events-none z-10">
              {selectedIds.length} elements selected · ⌫ delete · drag to move
            </div>
          )}

          {/* Bottom zoom bar */}
          <BottomBar
            zoom={zoom}
            setZoom={setZoom}
            fitZoom={fitZoom}
            grid={grid}
            setGrid={setGrid}
            gridSnap={gridSnap}
            setGridSnap={setGridSnap}
          />
        </div>

        {/* ── Right Sidebar ────────────────────────────────── */}
        <RightSidebar
          mode={sidebarMode}
          nameVal={nameVal}
          setNameVal={setNameVal}
          editName={editName}
          setEditName={setEditName}
          saveName={saveName}
          bgW={bgW}
          bgH={bgH}
          backgroundUrl={backgroundUrl}
          bgReplaceRef={bgReplaceRef}
          handleReplaceBackground={handleReplaceBackground}
          selectedIds={selectedIds}
          alignSelected={alignSelected}
          distributeSelected={distributeSelected}
          removeSelected={removeSelected}
        >
          {/* Zone panel rendered when mode === 'zone' */}
          {selected && (
            <RightRail
              selected={selected}
              bgW={bgW}
              bgH={bgH}
              updateZone={updateZone}
              duplicateZone={duplicateZone}
              removeZone={removeZone}
              BRAND_COLORS={BRAND_COLORS}
              aspectLock={aspectLock}
              setAspectLock={setAspectLock}
              eventId={eventId}
              bringForward={moveZoneDown}
              sendBack={moveZoneUp}
              bringToFront={bringToFront}
              sendToBack={sendToBack}
              zoneIndex={zones.findIndex(z => z.id === selected?.id)}
              zoneCount={zones.length}
            />
          )}
        </RightSidebar>
      </div>

      {/* ── Add Variant Modal ───────────────────────────── */}
      {showAddVariant && (
        <Modal onClose={() => { setShowAddVariant(false); setVariantLimitHit(false); }} title="Add variant" subtitle="A new card type, e.g. Speaker, Sponsor, Exhibitor">
          {variantLimitHit ? (
            <div className="space-y-4">
              <div className="rounded-xl p-4 flex gap-3" style={{ background: '#FEF3C7', border: '1px solid #F59E0B33' }}>
                <span style={{ fontSize: 20 }}>🔒</span>
                <div>
                  <p className="text-[13.5px] font-semibold mb-1" style={{ color: '#92400E' }}>Variant limit reached</p>
                  <p className="text-[12.5px] leading-relaxed" style={{ color: '#92400E' }}>
                    Your plan only allows a limited number of variants per event. Upgrade to Pro for 5 variants, or Studio for unlimited.
                  </p>
                </div>
              </div>
              <div className="flex gap-2 mt-2">
                <button onClick={() => { setShowAddVariant(false); setVariantLimitHit(false); }} className="flex-1 h-10 rounded-xl border border-border text-[13px] hover:bg-cream transition">Cancel</button>
                <a href="/settings#billing" className="flex-1 h-10 rounded-xl text-[13px] font-semibold text-white bg-primary flex items-center justify-center transition hover:opacity-90">
                  Upgrade plan →
                </a>
              </div>
            </div>
          ) : (
            <>
              <div className="space-y-4">
                <ModalField label="Variant name">
                  <input autoFocus type="text" placeholder="e.g. Speaker" value={newVariantName}
                    onChange={e => setNewVariantName(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleAddVariant()}
                    className="w-full h-10 px-3 rounded-xl border border-border text-[13.5px] outline-none focus:border-primary transition" />
                </ModalField>
                <ModalField label="Background design">
                  <input ref={newVariantFileRef} type="file" accept="image/png,image/jpeg" className="hidden" onChange={e => setNewVariantFile(e.target.files?.[0] ?? null)} />
                  <button onClick={() => newVariantFileRef.current?.click()}
                    className={`w-full h-24 rounded-xl border-2 border-dashed flex flex-col items-center justify-center gap-2 transition ${newVariantFile ? 'border-primary/50 bg-primary/[0.04] text-primary' : 'border-border hover:border-primary/40 text-[#0F1F18]/40'}`}>
                    {newVariantFile ? (<><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg><span className="text-[12px] font-medium">{newVariantFile.name}</span></>) : (<><Upload size={20} strokeWidth={1.6} /><span className="text-[12.5px]">Upload PNG or JPG</span></>)}
                  </button>
                </ModalField>
              </div>
              <div className="flex gap-2 mt-6">
                <button onClick={() => setShowAddVariant(false)} className="flex-1 h-10 rounded-xl border border-border text-[13px] hover:bg-cream transition">Cancel</button>
                <button onClick={handleAddVariant} disabled={!newVariantName.trim() || !newVariantFile || addingVariant}
                  className="flex-1 h-10 rounded-xl text-[13px] font-semibold text-white transition disabled:opacity-40 bg-primary">
                  {addingVariant ? 'Creating…' : 'Create variant'}
                </button>
              </div>
            </>
          )}
        </Modal>
      )}

      {/* ── Shortcuts Modal ─────────────────────────────── */}
      {showShortcuts && (
        <Modal onClose={() => setShowShortcuts(false)} title="Keyboard shortcuts" subtitle="Everything you can do without a mouse">
          <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-[12.5px]">
            {[
              ['⌘Z / ⇧⌘Z','Undo / Redo'],['⌘D','Duplicate zone'],['⌫','Delete selected'],
              ['⌘P','Preview mode'],['⌘/','This panel'],['G','Toggle grid'],
              ['⌘⌥C','Copy style'],['⌘⌥V','Paste style'],['Arrow keys','Nudge 1px'],
              ['⇧+Arrow','Nudge 10px'],['[',  'Send backward'],[']','Bring forward'],
              ['⇧+click','Multi-select'],['⇧+drag resize','Lock aspect ratio'],['Esc','Deselect all'],
              ['⌘+wheel','Zoom in/out'],['⇧+rotate','Snap to 15°'],['⌘+click variant','Switch variant'],
            ].map(([k, v]) => (
              <div key={k} className="flex items-center justify-between py-1 border-b border-border/50">
                <span className="font-mono text-[11px] bg-cream px-1.5 py-0.5 rounded text-[#0F1F18]/70">{k}</span>
                <span className="text-[#0F1F18]/60">{v}</span>
              </div>
            ))}
          </div>
        </Modal>
      )}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   RIGHT RAIL COMPONENT
══════════════════════════════════════════════════════════ */
const EDITOR_FONTS = ['DM Sans', 'Inter', 'JetBrains Mono'];

function RightRail({
  selected, bgW, bgH,
  updateZone, duplicateZone, removeZone, BRAND_COLORS, aspectLock, setAspectLock, eventId,
  bringForward, sendBack, bringToFront, sendToBack, zoneIndex, zoneCount,
}: {
  selected: Zone; bgW: number; bgH: number;
  updateZone: (id: string, patch: Partial<Zone>, withHistory?: boolean) => void;
  duplicateZone: (id: string) => void;
  removeZone: (id: string) => void;
  BRAND_COLORS: string[];
  aspectLock: boolean;
  setAspectLock: (v: boolean) => void;
  eventId: string;
  bringForward: (id: string) => void;
  sendBack: (id: string) => void;
  bringToFront: (id: string) => void;
  sendToBack: (id: string) => void;
  zoneIndex: number;
  zoneCount: number;
}) {
  const upd = (patch: Partial<Zone>) => updateZone(selected.id, patch);

  // Zone type label
  const typeLabel = selected.type === 'photo' ? 'Photo zone'
    : selected.type === 'custom' ? 'Custom field'
    : selected.type === 'label'  ? 'Static text'
    : selected.type === 'shape'  ? 'Shape'
    : selected.type === 'image'  ? 'Image'
    : 'Text zone';
  const TypeIcon = selected.type === 'photo' ? ImageIcon
    : selected.type === 'custom' ? ToggleLeft
    : selected.type === 'label'  ? Tag
    : selected.type === 'shape'  ? Square
    : selected.type === 'image'  ? ImagePlus
    : Type;

  return (
    <div className="flex flex-col">
      {/* ── Sticky zone header (D2.2 design) ─── */}
      <div style={{
        padding: '14px 14px 10px',
        borderBottom: '1px solid #E5E0D4',
        background: '#FAF6EE',
        position: 'sticky', top: 0, zIndex: 3,
      }}>
        {/* Breadcrumb row */}
        <div className="flex items-center gap-2 mb-2">
          <button
            onClick={() => { /* deselect is handled by clicking canvas */ }}
            title="Back to Event"
            style={{
              width: 22, height: 22, borderRadius: 4,
              background: '#FFFFFF', border: '1px solid #E5E0D4',
              color: '#6B7A72', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >
            <ChevronDown size={12} strokeWidth={2.2} style={{ transform: 'rotate(90deg)' }} />
          </button>
          <div style={{
            fontFamily: 'JetBrains Mono, monospace', fontSize: 10,
            color: '#6B7A72', letterSpacing: '0.1em', textTransform: 'uppercase',
          }}>
            Event / Attendee
          </div>
        </div>
        {/* Zone identity row */}
        <div className="flex items-center gap-2">
          <div style={{
            width: 22, height: 22, borderRadius: 4,
            background: '#E8EFEB', color: '#1F4D3A',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0,
          }}>
            <TypeIcon size={13} strokeWidth={1.8} />
          </div>
          <div className="flex-1 min-w-0">
            <div style={{
              fontFamily: 'JetBrains Mono, monospace', fontSize: 10,
              color: '#6B7A72', letterSpacing: '0.1em', textTransform: 'uppercase',
            }}>
              {typeLabel}
            </div>
            <div style={{
              fontFamily: 'DM Sans, sans-serif', fontWeight: 700, fontSize: 15,
              color: '#0F1F18', letterSpacing: '-0.01em',
              whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
            }}>
              {selected.label}
            </div>
          </div>
          <div style={{
            fontFamily: 'JetBrains Mono, monospace', fontSize: 10,
            color: '#6B7A72', letterSpacing: '0.04em', flexShrink: 0,
          }}>
            #{selected.id.slice(-4)}
          </div>
        </div>
      </div>

      {/* ── Field ───────────────────────────────────────── */}
      <PropSection title={selected.type === 'label' ? 'Content' : 'Field'}>
        <PropRow label="Label">
          <input value={selected.label} onChange={e => upd({ label: e.target.value })} className="prop-input" />
        </PropRow>
        {selected.type === 'label' ? (
          <>
            <PropRow label="Text content">
              <input value={selected.sample ?? ''} onChange={e => upd({ sample: e.target.value })} className="prop-input" placeholder="Text shown on the card" />
            </PropRow>
            <div className="text-[10.5px] font-mono text-warning bg-warning/8 border border-warning/20 rounded-lg px-2.5 py-1.5 leading-relaxed">
              Static — this text is baked into every card, not editable by attendees.
            </div>
          </>
        ) : selected.type === 'shape' ? null : (
          <>
            {/* Field setup guide */}
            <div className="rounded-lg px-2.5 py-2 text-[10.5px] leading-relaxed space-y-0.5" style={{background:'rgba(31,77,58,0.07)',border:'1px solid rgba(31,77,58,0.15)'}}>
              <div className="font-semibold text-primary text-[10px] uppercase tracking-wide mb-1">Attendee sees:</div>
              <div className="text-ink-soft"><span className="font-mono text-primary">Label</span> → field title in the form</div>
              <div className="text-ink-soft"><span className="font-mono text-primary">Placeholder</span> → hint below the title</div>
              <div className="text-ink-soft"><span className="font-mono text-primary">Preview text</span> → sample shown on card</div>
            </div>
            <PropRow label="Placeholder">
              <input value={selected.placeholder ?? ''} onChange={e => upd({ placeholder: e.target.value })} className="prop-input" placeholder="e.g. Enter your full name" />
            </PropRow>
            <PropRow label="Preview text">
              <input value={selected.sample ?? ''} onChange={e => upd({ sample: e.target.value })} className="prop-input" placeholder="e.g. Mohamed Ali" />
            </PropRow>
            <PropToggle label="Required" value={!!selected.required} onChange={v => upd({ required: v })} />
            {(selected.type === 'text' || selected.type === 'custom') && (
              <PropRow label={`Max chars · ${selected.maxChars ?? 'none'}`}>
                <div className="flex items-center gap-2">
                  <input
                    type="range" min="1" max="200"
                    value={selected.maxChars ?? 100}
                    onChange={e => upd({ maxChars: Number(e.target.value) })}
                    className="flex-1 accent-primary" style={{ height: 4 }}
                  />
                  <input
                    type="number" min="1" max="200"
                    value={selected.maxChars ?? ''}
                    placeholder="∞"
                    onChange={e => upd({ maxChars: e.target.value ? Number(e.target.value) : undefined })}
                    className="w-14 h-7 text-center border border-border rounded-lg text-[12px] font-mono outline-none focus:border-primary"
                  />
                </div>
              </PropRow>
            )}
          </>
        )}
      </PropSection>

      {/* ── Photo style ─────────────────────────────────── */}
      {selected.type === 'photo' && (
        <>
          <PropSection title="Photo style">
            <PropRow label="Shape">
              <Segmented
                value={selected.shape ?? 'circle'}
                onChange={v => upd({ shape: v as Zone['shape'] })}
                options={[
                  { v: 'circle',  label: 'Circle'  },
                  { v: 'rounded', label: 'Rounded' },
                  { v: 'square',  label: 'Square'  },
                  { v: 'hexagon', label: 'Hex'     },
                ]}
              />
            </PropRow>
            {selected.shape === 'rounded' && (
              <PropRow label={`Corner radius · ${selected.cornerRadius ?? 18}%`}>
                <input
                  type="range" min="1" max="48"
                  value={selected.cornerRadius ?? 18}
                  onChange={e => upd({ cornerRadius: Number(e.target.value) })}
                  className="w-full accent-primary" style={{ height: 4 }}
                />
              </PropRow>
            )}
          </PropSection>
          <PropSection title="Border">
            <PropToggle label="Show border" value={!!(selected.photoBorderWidth && selected.photoBorderWidth > 0)} onChange={v => upd({ photoBorderWidth: v ? 4 : 0, photoBorderColor: v ? '#FFFFFF' : undefined })} />
            {(selected.photoBorderWidth ?? 0) > 0 && (
              <>
                <PropRow label="Border color">
                  <ColorRow value={selected.photoBorderColor ?? '#FFFFFF'} onChange={c => upd({ photoBorderColor: c })} BRAND_COLORS={BRAND_COLORS} />
                </PropRow>
                <PropRow label={`Width · ${selected.photoBorderWidth ?? 4}px`}>
                  <input type="range" min="1" max="40" value={selected.photoBorderWidth ?? 4} onChange={e => upd({ photoBorderWidth: Number(e.target.value) })} className="w-full accent-primary" style={{ height: 4 }} />
                </PropRow>
              </>
            )}
          </PropSection>
        </>
      )}

      {/* ── Shape style ──────────────────────────────────── */}
      {selected.type === 'shape' && (
        <PropSection title="Shape style">
          <PropRow label="Fill color">
            <ColorRow value={selected.bgColor ?? '#1F4D3A'} onChange={c => upd({ bgColor: c })} BRAND_COLORS={BRAND_COLORS} />
          </PropRow>
          <PropRow label={`Fill opacity · ${selected.bgOpacity ?? 100}%`}>
            <input type="range" min="0" max="100" value={selected.bgOpacity ?? 100} onChange={e => upd({ bgOpacity: Number(e.target.value) })} className="w-full accent-primary" style={{ height: 4 }} />
          </PropRow>
          <PropToggle
            label="Show border"
            value={!!(selected.strokeWidth && selected.strokeWidth > 0)}
            onChange={v => upd({ strokeWidth: v ? 4 : 0, strokeColor: v ? '#FFFFFF' : undefined })}
          />
          {(selected.strokeWidth ?? 0) > 0 && (
            <>
              <PropRow label="Border color">
                <ColorRow value={selected.strokeColor ?? '#FFFFFF'} onChange={c => upd({ strokeColor: c })} BRAND_COLORS={BRAND_COLORS} />
              </PropRow>
              <PropRow label={`Border width · ${selected.strokeWidth ?? 4}px`}>
                <input type="range" min="1" max="40" value={selected.strokeWidth ?? 4} onChange={e => upd({ strokeWidth: Number(e.target.value) })} className="w-full accent-primary" style={{ height: 4 }} />
              </PropRow>
            </>
          )}
        </PropSection>
      )}

      {/* ── Image style ───────────────────────────────────── */}
      {selected.type === 'image' && (
        <PropSection title="Image">
          {selected.imageUrl && (
            <div className="rounded-xl overflow-hidden border border-border bg-cream" style={{ height: 120 }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={selected.imageUrl} alt={selected.label} className="w-full h-full object-contain" />
            </div>
          )}
          <PropRow label="Replace image">
            <label className="flex items-center gap-2 cursor-pointer w-full h-9 px-3 rounded-xl border border-border bg-cream text-[12.5px] hover:bg-white transition">
              <Upload size={13} strokeWidth={1.8} />
              <span>Upload new image…</span>
              <input
                type="file"
                accept="image/png,image/jpeg,image/webp,image/gif,image/svg+xml"
                className="hidden"
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  const fd = new FormData();
                  fd.append('file', file);
                  fd.append('eventId', eventId);
                  const res = await fetch('/api/upload-zone-image', { method: 'POST', body: fd });
                  if (res.ok) {
                    const { url } = await res.json() as { url: string };
                    upd({ imageUrl: url, label: file.name.replace(/\.[^.]+$/, '').slice(0, 30) });
                  }
                }}
              />
            </label>
          </PropRow>
        </PropSection>
      )}

      {/* ── Typography (text/custom/label) ──────────────── */}
      {(selected.type === 'text' || selected.type === 'custom' || selected.type === 'label') && (
        <>
          <PropSection title="Typography">
            {/* Font picker — restricted to the 3 bundled fonts */}
            <PropRow label="Font">
              <div className="grid grid-cols-3 gap-1">
                {EDITOR_FONTS.map(f => (
                  <button
                    key={f}
                    onClick={() => upd({ font: f })}
                    className={`h-8 rounded-lg border text-[11px] transition truncate px-1 ${(selected.font ?? 'DM Sans') === f ? 'bg-primary/10 text-primary border-primary/30 font-semibold' : 'border-border hover:bg-cream text-[#0F1F18]/65'}`}
                    style={{ fontFamily: f }}
                    title={f}
                  >
                    {f.split(' ')[0]}
                  </button>
                ))}
              </div>
            </PropRow>

            <PropRow label="Weight">
              <Segmented
                value={String(selected.weight ?? 400)}
                onChange={v => upd({ weight: Number(v) })}
                options={[{ v: '300', label: 'Light' }, { v: '400', label: 'Reg' }, { v: '600', label: 'SBd' }, { v: '700', label: 'Bold' }]}
              />
            </PropRow>

            <PropRow label={`Size · ${selected.size ?? 32}px`}>
              <div className="flex items-center gap-2">
                <input type="range" min="8" max="300" value={selected.size ?? 32} onChange={e => upd({ size: Number(e.target.value) })} className="flex-1 accent-primary" style={{ height: 4 }} />
                <input type="number" min="8" max="300" value={selected.size ?? 32} onChange={e => upd({ size: Number(e.target.value) })} className="w-14 h-7 text-center border border-border rounded-lg text-[12px] font-mono outline-none focus:border-primary" />
              </div>
              <div className="flex flex-wrap gap-1 mt-1.5">
                {[12, 18, 24, 32, 48, 64, 96, 128].map(s => (
                  <button key={s} onClick={() => upd({ size: s })} className={`h-6 px-2 text-[10.5px] font-mono rounded-lg border transition ${(selected.size ?? 32) === s ? 'bg-primary text-white border-primary' : 'border-border hover:bg-cream text-[#0F1F18]/55'}`}>{s}</button>
                ))}
                {/* Auto-height: expand zone height to fit text at current font size */}
                <button
                  title="Resize zone height to fit all text at the current font size"
                  onClick={() => {
                    const rawLinesCount = wrapTextLines(
                      (() => { const raw = selected.sample ?? selected.placeholder ?? ''; const t = selected.textTransform; return t === 'uppercase' ? raw.toUpperCase() : t === 'lowercase' ? raw.toLowerCase() : raw; })(),
                      selected.w - 16,
                      selected.size ?? 32
                    ).length;
                    const autoH = Math.ceil(rawLinesCount * (selected.size ?? 32) * (selected.lineHeight ?? 1.2)) + 16;
                    upd({ h: Math.max(selected.h, autoH) });
                  }}
                  className="h-6 px-2 text-[10.5px] font-mono rounded-lg border border-dashed transition border-warning/60 text-warning hover:bg-warning/10 flex items-center gap-1"
                >
                  <AlignVerticalJustifyEnd size={10} strokeWidth={2} />
                  Auto-height
                </button>
              </div>
            </PropRow>

            <PropRow label="Horizontal">
              <Segmented
                value={selected.align ?? 'left'}
                onChange={v => upd({ align: v as Zone['align'] })}
                options={[{ v: 'left', icon: <AlignLeft size={12} strokeWidth={1.8} /> }, { v: 'center', icon: <AlignCenter size={12} strokeWidth={1.8} /> }, { v: 'right', icon: <AlignRight size={12} strokeWidth={1.8} /> }, { v: 'justify', icon: <AlignJustify size={12} strokeWidth={1.8} /> }]}
              />
            </PropRow>

            <PropRow label="Vertical">
              <Segmented
                value={selected.verticalAlign ?? 'top'}
                onChange={v => upd({ verticalAlign: v as Zone['verticalAlign'] })}
                options={[{ v: 'top', icon: <AlignStartVertical size={12} strokeWidth={1.8} /> }, { v: 'center', icon: <AlignCenterVertical size={12} strokeWidth={1.8} /> }, { v: 'bottom', icon: <AlignEndVertical size={12} strokeWidth={1.8} /> }]}
              />
            </PropRow>

            <PropRow label="Transform">
              <Segmented
                value={selected.textTransform ?? 'none'}
                onChange={v => upd({ textTransform: v as Zone['textTransform'] })}
                options={[{ v: 'none', label: 'Aa' }, { v: 'uppercase', label: 'AA' }, { v: 'lowercase', label: 'aa' }]}
              />
            </PropRow>

            <PropRow label={`Line height · ${(selected.lineHeight ?? 1.2).toFixed(1)}`}>
              <input type="range" min="0.8" max="2.5" step="0.05" value={selected.lineHeight ?? 1.2} onChange={e => upd({ lineHeight: Number(e.target.value) })} className="w-full accent-primary" style={{ height: 4 }} />
            </PropRow>

            <PropRow label={`Letter spacing · ${selected.letterSpacing ?? 0}px`}>
              <input type="range" min="-5" max="30" step="0.5" value={selected.letterSpacing ?? 0} onChange={e => upd({ letterSpacing: Number(e.target.value) })} className="w-full accent-primary" style={{ height: 4 }} />
            </PropRow>

            <PropRow label="Text color">
              <ColorRow value={selected.color ?? '#FFFFFF'} onChange={c => upd({ color: c })} BRAND_COLORS={BRAND_COLORS} />
            </PropRow>
          </PropSection>

          {/* ── Text Effects ─────────────────────────────── */}
          <PropSection title="Text effects">
            {/* Stroke */}
            <PropToggle label="Text stroke" value={!!(selected.strokeColor && (selected.strokeWidth ?? 0) > 0)} onChange={v => upd({ strokeColor: v ? '#000000' : undefined, strokeWidth: v ? 3 : 0 })} />
            {selected.strokeColor && (selected.strokeWidth ?? 0) > 0 && (
              <>
                <PropRow label="Stroke color">
                  <ColorRow value={selected.strokeColor ?? '#000000'} onChange={c => upd({ strokeColor: c })} BRAND_COLORS={BRAND_COLORS} />
                </PropRow>
                <PropRow label={`Stroke width · ${selected.strokeWidth ?? 3}px`}>
                  <input type="range" min="1" max="20" value={selected.strokeWidth ?? 3} onChange={e => upd({ strokeWidth: Number(e.target.value) })} className="w-full accent-primary" style={{ height: 4 }} />
                </PropRow>
              </>
            )}

            {/* Shadow */}
            <PropToggle label="Drop shadow" value={!!(selected.shadowColor && (selected.shadowBlur ?? 0) > 0)} onChange={v => upd({ shadowColor: v ? 'rgba(0,0,0,0.6)' : undefined, shadowBlur: v ? 12 : 0, shadowX: v ? 2 : 0, shadowY: v ? 4 : 0 })} />
            {selected.shadowColor && (selected.shadowBlur ?? 0) > 0 && (
              <>
                <PropRow label="Shadow color">
                  <div className="flex items-center gap-2">
                    <input type="color" value={selected.shadowColor?.startsWith('#') ? selected.shadowColor : '#000000'} onChange={e => upd({ shadowColor: e.target.value })} className="h-7 w-7 rounded border border-border cursor-pointer" />
                    <input value={selected.shadowColor ?? ''} onChange={e => upd({ shadowColor: e.target.value })} className="prop-input flex-1 font-mono text-[11px]" />
                  </div>
                </PropRow>
                <PropRow label={`Blur · ${selected.shadowBlur ?? 12}px`}>
                  <input type="range" min="0" max="40" value={selected.shadowBlur ?? 12} onChange={e => upd({ shadowBlur: Number(e.target.value) })} className="w-full accent-primary" style={{ height: 4 }} />
                </PropRow>
                <div className="grid grid-cols-2 gap-2">
                  <PropRow label={`X · ${selected.shadowX ?? 0}px`}>
                    <input type="range" min="-20" max="20" value={selected.shadowX ?? 0} onChange={e => upd({ shadowX: Number(e.target.value) })} className="w-full accent-primary" style={{ height: 4 }} />
                  </PropRow>
                  <PropRow label={`Y · ${selected.shadowY ?? 0}px`}>
                    <input type="range" min="-20" max="20" value={selected.shadowY ?? 0} onChange={e => upd({ shadowY: Number(e.target.value) })} className="w-full accent-primary" style={{ height: 4 }} />
                  </PropRow>
                </div>
              </>
            )}
          </PropSection>

          {/* ── Background fill ───────────────────────────── */}
          <PropSection title="Background fill">
            <PropToggle label="Enable fill" value={!!selected.bgColor} onChange={v => upd({ bgColor: v ? '#000000' : undefined, bgOpacity: v ? 50 : undefined })} />
            {selected.bgColor && (
              <>
                <PropRow label="Fill color">
                  <ColorRow value={selected.bgColor.startsWith('#') ? selected.bgColor : '#000000'} onChange={c => upd({ bgColor: c })} BRAND_COLORS={BRAND_COLORS} />
                </PropRow>
                <PropRow label={`Fill opacity · ${selected.bgOpacity ?? 60}%`}>
                  <input type="range" min="0" max="100" value={selected.bgOpacity ?? 60} onChange={e => upd({ bgOpacity: Number(e.target.value) })} className="w-full accent-primary" style={{ height: 4 }} />
                </PropRow>
              </>
            )}
          </PropSection>
        </>
      )}

      {/* ── Appearance ──────────────────────────────────── */}
      <PropSection title="Appearance">
        <PropRow label={`Opacity · ${selected.opacity ?? 100}%`}>
          <input type="range" min="0" max="100" value={selected.opacity ?? 100} onChange={e => upd({ opacity: Number(e.target.value) })} className="w-full accent-primary" style={{ height: 4 }} />
        </PropRow>
        <PropRow label={`Rotation · ${selected.rotation ?? 0}°`}>
          <div className="flex items-center gap-2">
            <input type="range" min="0" max="359" value={selected.rotation ?? 0} onChange={e => upd({ rotation: Number(e.target.value) })} className="flex-1 accent-primary" style={{ height: 4 }} />
            <input type="number" min="0" max="359" value={selected.rotation ?? 0} onChange={e => upd({ rotation: Number(e.target.value) })} className="w-14 h-7 text-center border border-border rounded-lg text-[12px] font-mono outline-none focus:border-primary" />
          </div>
        </PropRow>
        <div className="flex gap-1.5">
          {[0, 45, 90, 135, 180, 270].map(d => (
            <button key={d} onClick={() => upd({ rotation: d })} className={`flex-1 h-7 text-[10.5px] font-mono rounded-lg border transition ${(selected.rotation ?? 0) === d ? 'bg-primary/10 text-primary border-primary/30' : 'border-border hover:bg-cream text-[#0F1F18]/55'}`}>{d}°</button>
          ))}
        </div>
        <PropToggle label="Locked" value={!!selected.locked} onChange={v => upd({ locked: v })} />
        <PropToggle label="Hidden" value={!!selected.hidden} onChange={v => upd({ hidden: v })} />
      </PropSection>

      {/* ── Position & size ─────────────────────────────── */}
      <PropSection title="Position & size">
        <div className="grid grid-cols-2 gap-2">
          <NumberProp label="X" value={selected.x} onChange={v => upd({ x: v })} />
          <NumberProp label="Y" value={selected.y} onChange={v => upd({ y: v })} />
          <div className="relative">
            <NumberProp label="W" value={selected.w} onChange={v => {
              if (aspectLock && selected.h > 0) { const r = selected.w / selected.h; upd({ w: v, h: Math.round(v / r) }); }
              else upd({ w: v });
            }} />
          </div>
          <div className="relative">
            <NumberProp label="H" value={selected.h} onChange={v => {
              if (aspectLock && selected.w > 0) { const r = selected.w / selected.h; upd({ h: v, w: Math.round(v * r) }); }
              else upd({ h: v });
            }} />
          </div>
        </div>
        <div className="flex items-center justify-between mt-1">
          <button
            onClick={() => setAspectLock(!aspectLock)}
            title="Lock aspect ratio"
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-[11.5px] font-mono transition ${aspectLock ? 'bg-primary/10 text-primary border-primary/30' : 'border-border text-[#0F1F18]/50 hover:bg-cream'}`}
          >
            {aspectLock ? <Lock size={12} strokeWidth={1.8} /> : <LockOpen size={12} strokeWidth={1.8} />}
            {aspectLock ? 'Ratio locked' : 'Lock ratio'}
          </button>
          <span className="text-[10.5px] font-mono text-[#0F1F18]/35">{selected.w} : {selected.h}</span>
        </div>
        {/* Alignment quick buttons */}
        <div className="mt-3 grid grid-cols-3 gap-1">
          <button onClick={() => upd({ x: 0 })} className="py-1.5 text-[10.5px] font-mono text-[#0F1F18]/55 border border-border rounded-lg hover:bg-cream transition" title="Align left edge">⇤ Left</button>
          <button onClick={() => upd({ x: Math.round(bgW / 2 - selected.w / 2) })} className="py-1.5 text-[10.5px] font-mono text-[#0F1F18]/55 border border-border rounded-lg hover:bg-cream transition" title="Center horizontally">↔ H</button>
          <button onClick={() => upd({ x: bgW - selected.w })} className="py-1.5 text-[10.5px] font-mono text-[#0F1F18]/55 border border-border rounded-lg hover:bg-cream transition" title="Align right edge">Right ⇥</button>
          <button onClick={() => upd({ y: 0 })} className="py-1.5 text-[10.5px] font-mono text-[#0F1F18]/55 border border-border rounded-lg hover:bg-cream transition" title="Align top edge">⇡ Top</button>
          <button onClick={() => upd({ y: Math.round(bgH / 2 - selected.h / 2) })} className="py-1.5 text-[10.5px] font-mono text-[#0F1F18]/55 border border-border rounded-lg hover:bg-cream transition" title="Center vertically">↕ V</button>
          <button onClick={() => upd({ y: bgH - selected.h })} className="py-1.5 text-[10.5px] font-mono text-[#0F1F18]/55 border border-border rounded-lg hover:bg-cream transition" title="Align bottom edge">Bot ⇩</button>
        </div>
      </PropSection>

      {/* Custom field options */}
      {selected.type === 'custom' && (
        <PropSection title="Dropdown options">
          <PropRow label="Options (one per line)">
            <textarea
              rows={4}
              value={(selected.options ?? []).join('\n')}
              onChange={e => upd({ options: e.target.value.split('\n').filter(Boolean) })}
              className="prop-input !h-auto py-2 resize-none font-mono text-[11.5px] leading-relaxed"
            />
          </PropRow>
        </PropSection>
      )}

      {/* ── Layer order & Actions ─────────────────────── */}
      <div style={{ padding: '0 14px 14px', display: 'flex', flexDirection: 'column', gap: 10 }}>
        {/* Layer order buttons */}
        <div style={{ background: '#FFFFFF', border: '1px solid #E5E0D4', borderRadius: 6, padding: '10px 12px' }}>
          <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10, color: '#6B7A72', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 8 }}>Layer</div>
          <div className="flex gap-1.5">
            {[
              { fn: () => bringForward(selected.id), title: 'Bring forward · ]', disabled: zoneIndex >= zoneCount - 1, label: '↑ Forward' },
              { fn: () => sendBack(selected.id),     title: 'Send back · [',     disabled: zoneIndex <= 0,            label: '↓ Back'    },
              { fn: () => bringToFront(selected.id), title: 'Bring to front · ⇧]', disabled: zoneIndex >= zoneCount - 1, label: '⇈ Front' },
              { fn: () => sendToBack(selected.id),   title: 'Send to back · ⇧[',  disabled: zoneIndex <= 0,            label: '⇊ Bottom' },
            ].map((btn, i) => (
              <button
                key={i}
                onClick={btn.fn}
                disabled={btn.disabled}
                title={btn.title}
                style={{
                  flex: 1, height: 28,
                  background: '#FFFFFF', border: '1px solid #E5E0D4', borderRadius: 6,
                  cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontFamily: 'JetBrains Mono, monospace', fontSize: 9.5, color: '#3A4A42',
                  opacity: btn.disabled ? 0.3 : 1,
                }}
              >
                {btn.label}
              </button>
            ))}
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex gap-1.5">
          <button
            onClick={() => duplicateZone(selected.id)}
            style={{
              flex: 1, height: 32,
              background: '#FFFFFF', border: '1px solid #E5E0D4', borderRadius: 6,
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5,
              fontFamily: 'JetBrains Mono, monospace', fontSize: 10, textTransform: 'uppercase',
              letterSpacing: '0.06em', fontWeight: 600, color: '#3A4A42', cursor: 'pointer',
            }}
          >
            <Copy size={13} strokeWidth={1.8} />Duplicate
          </button>
          <button
            onClick={() => upd({ locked: !selected.locked })}
            style={{
              flex: 1, height: 32,
              background: '#FFFFFF', border: '1px solid #E5E0D4', borderRadius: 6,
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5,
              fontFamily: 'JetBrains Mono, monospace', fontSize: 10, textTransform: 'uppercase',
              letterSpacing: '0.06em', fontWeight: 600, color: '#3A4A42', cursor: 'pointer',
            }}
          >
            {selected.locked ? <Lock size={13} strokeWidth={1.8} /> : <LockOpen size={13} strokeWidth={1.8} />}
            {selected.locked ? 'Unlock' : 'Lock'}
          </button>
          <button
            onClick={() => removeZone(selected.id)}
            style={{
              flex: 1, height: 32,
              background: '#FFFFFF', border: '1px solid rgba(184,66,60,0.3)', borderRadius: 6,
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5,
              fontFamily: 'JetBrains Mono, monospace', fontSize: 10, textTransform: 'uppercase',
              letterSpacing: '0.06em', fontWeight: 600, color: '#B8423C', cursor: 'pointer',
            }}
          >
            <Trash2 size={13} strokeWidth={1.8} />Delete
          </button>
        </div>
      </div>

      <style>{`
        .prop-input{width:100%;height:32px;padding:0 10px;border:1px solid #E5E0D4;border-radius:6px;background:#FFFFFF;font-size:12.5px;font-family:'Inter',sans-serif;outline:none;}
        .prop-input:focus{outline:2px solid rgba(31,77,58,0.25);outline-offset:-1px;border-color:#1F4D3A;}
      `}</style>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   ZONE ELEMENT
══════════════════════════════════════════════════════════ */
function ZoneEl({ zone, selected, multiSelected, previewMode, zoom, onPointerDown, onHandle, onRotate }: {
  zone: Zone; selected: boolean; multiSelected: boolean; previewMode: boolean; zoom: number;
  onPointerDown: (e: React.PointerEvent) => void;
  onHandle: (e: React.PointerEvent, dir: string) => void;
  onRotate: (e: React.PointerEvent) => void;
}) {
  if (zone.hidden) return null;

  const isPhoto  = zone.type === 'photo';
  const isLabel  = zone.type === 'label';
  const isShape  = zone.type === 'shape';
  const isImage  = zone.type === 'image';
  const rotation = zone.rotation ?? 0;
  const dim      = Math.min(zone.w, zone.h);
  const radius   = isPhoto
    ? (zone.shape === 'circle' ? '50%'
      : zone.shape === 'rounded' ? `${(zone.cornerRadius ?? 18) / 100 * dim}px`
      : zone.shape === 'hexagon' ? '0'
      : '4px')
    : (isShape || isImage) ? '0' : '6px';
  const hexClip  = isPhoto && zone.shape === 'hexagon'
    ? 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)'
    : undefined;
  const dashColor = multiSelected ? '#C9A45E' : isLabel ? '#C97A2D' : isShape ? '#3A6B8C' : isImage ? '#7C3AED' : '#1F4D3A';
  const opacityVal = (zone.opacity ?? 100) / 100;

  const displayText = (() => {
    const raw = zone.sample ?? zone.placeholder ?? '';
    const t = zone.textTransform;
    if (t === 'uppercase') return raw.toUpperCase();
    if (t === 'lowercase') return raw.toLowerCase();
    return raw;
  })();

  const rawLines = (!isPhoto && !isShape && !isImage) ? wrapTextLines(displayText, zone.w - 16, zone.size ?? 32) : [];

  // Scale text to always fit zone height in the editor preview
  // (zone.size stays unchanged — it's used for the final render; we only adjust the preview)
  const rawTotalH = rawLines.length * (zone.size ?? 32) * (zone.lineHeight ?? 1.2);
  const previewFitScale = (rawTotalH > 0 && rawTotalH > zone.h) ? zone.h / rawTotalH : 1;
  const previewSize = (zone.size ?? 32) * previewFitScale;
  const isTextScaledDown = previewFitScale < 0.98; // true if text had to shrink to fit

  // Recompute line breaks at preview size so wrapping is accurate for what you see
  const lines = rawLines.length > 0 ? wrapTextLines(displayText, zone.w - 16, previewSize) : [];

  const textStyle: React.CSSProperties = {
    fontFamily: zone.font,
    fontWeight: zone.weight,
    fontSize: previewSize,
    color: zone.color,
    lineHeight: zone.lineHeight ?? 1.2,
    letterSpacing: zone.letterSpacing ? `${zone.letterSpacing}px` : undefined,
    textAlign: zone.align,
    WebkitTextStroke: (zone.strokeColor && (zone.strokeWidth ?? 0) > 0) ? `${zone.strokeWidth}px ${zone.strokeColor}` : undefined,
    textShadow: (zone.shadowColor && (zone.shadowBlur ?? 0) > 0)
      ? `${zone.shadowX ?? 0}px ${zone.shadowY ?? 0}px ${zone.shadowBlur}px ${zone.shadowColor}`
      : undefined,
  };

  const inner = (() => {
    if (isShape) {
      const fill  = zone.bgColor ?? '#1F4D3A';
      const fillOp = (zone.bgOpacity ?? 100) / 100;
      const stroke = zone.strokeColor ?? 'none';
      const strokeW = zone.strokeWidth ?? 0;
      const st = zone.shapeType ?? 'rect';
      return (
        <div className="absolute inset-0">
          <svg width="100%" height="100%" viewBox={`0 0 ${zone.w} ${zone.h}`} xmlns="http://www.w3.org/2000/svg">
            {st === 'ellipse' && (
              <ellipse cx={zone.w / 2} cy={zone.h / 2}
                rx={Math.max(1, zone.w / 2 - strokeW / 2)} ry={Math.max(1, zone.h / 2 - strokeW / 2)}
                fill={fill} fillOpacity={fillOp}
                stroke={strokeW > 0 ? stroke : 'none'} strokeWidth={strokeW} />
            )}
            {st === 'triangle' && (
              <polygon points={`${zone.w / 2},${strokeW / 2} ${zone.w - strokeW / 2},${zone.h - strokeW / 2} ${strokeW / 2},${zone.h - strokeW / 2}`}
                fill={fill} fillOpacity={fillOp}
                stroke={strokeW > 0 ? stroke : 'none'} strokeWidth={strokeW} />
            )}
            {st === 'line' && (
              <line x1={0} y1={zone.h / 2} x2={zone.w} y2={zone.h / 2}
                stroke={fill} strokeWidth={zone.h} strokeOpacity={fillOp} />
            )}
            {st === 'rect' && (
              <rect x={strokeW / 2} y={strokeW / 2}
                width={Math.max(1, zone.w - strokeW)} height={Math.max(1, zone.h - strokeW)}
                fill={fill} fillOpacity={fillOp}
                stroke={strokeW > 0 ? stroke : 'none'} strokeWidth={strokeW} />
            )}
          </svg>
        </div>
      );
    }
    if (isImage) {
      return (
        <div className="absolute inset-0 overflow-hidden" style={{ borderRadius: 4 }}>
          {zone.imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={zone.imageUrl}
              alt={zone.label}
              className="w-full h-full pointer-events-none"
              style={{ objectFit: 'contain' }}
              draggable={false}
            />
          ) : (
            /* Image skeleton — grey bg + landscape icon */
            <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg" style={{ display: 'block' }}>
              {/* Background */}
              <rect width={zone.w} height={zone.h} fill="rgba(107,122,114,0.14)" rx="4" />
              {/* Hatching */}
              <defs>
                <pattern id={`img-hatch-${zone.id}`} width="10" height="10" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
                  <line x1="0" y1="0" x2="0" y2="10" stroke="rgba(107,122,114,0.06)" strokeWidth="2" />
                </pattern>
              </defs>
              <rect width={zone.w} height={zone.h} fill={`url(#img-hatch-${zone.id})`} rx="4" />
              {/* Mountain / landscape icon centered */}
              {(() => {
                const cx = zone.w / 2, cy = zone.h / 2;
                const s = Math.min(zone.w, zone.h) * 0.38;
                const col = 'rgba(107,122,114,0.45)';
                return (
                  <g transform={`translate(${cx - s / 2}, ${cy - s / 2})`}>
                    {/* Frame */}
                    <rect x={0} y={0} width={s} height={s} rx={s * 0.1} fill="none" stroke={col} strokeWidth={s * 0.05} />
                    {/* Sun circle */}
                    <circle cx={s * 0.3} cy={s * 0.32} r={s * 0.12} fill={col} />
                    {/* Mountains */}
                    <polygon points={`0,${s} ${s * 0.38},${s * 0.45} ${s * 0.65},${s}`} fill={col} />
                    <polygon points={`${s * 0.45},${s} ${s * 0.72},${s * 0.38} ${s},${s}`} fill={col} opacity="0.7" />
                  </g>
                );
              })()}
              {/* Label */}
              <text
                x={zone.w / 2} y={zone.h - Math.max(6, zone.h * 0.07)}
                textAnchor="middle" fill="rgba(107,122,114,0.6)"
                fontSize={Math.max(9, Math.min(zone.w, zone.h) * 0.08)}
                fontFamily="Inter, sans-serif" fontWeight="500"
              >Drop image</text>
            </svg>
          )}
        </div>
      );
    }
    if (isPhoto) {
      /* Photo placeholder — warm beige bg + Image icon, clipped to zone shape */
      const iconSize = Math.max(18, Math.min(zone.w, zone.h) * 0.28);
      const labelSz  = Math.max(9, Math.min(zone.w, zone.h) * 0.08);
      const bw = zone.photoBorderWidth ?? 0;
      const bCol = zone.photoBorderColor ?? '#ffffff';
      return (
        <div className="absolute inset-0 overflow-hidden" style={{ borderRadius: radius, clipPath: hexClip }}>
          {/* Warm beige fill */}
          <div
            className="w-full h-full flex flex-col items-center justify-center gap-2"
            style={{ background: '#EDE9E0' }}
          >
            <ImageIcon size={iconSize} strokeWidth={1.3} color="rgba(107,122,114,0.55)" />
            <span style={{
              fontSize: labelSz,
              color: 'rgba(107,122,114,0.58)',
              fontFamily: 'Inter, sans-serif',
              fontWeight: 500,
              textAlign: 'center',
              maxWidth: '90%',
              overflow: 'hidden',
              whiteSpace: 'nowrap',
              textOverflow: 'ellipsis',
            }}>
              {zone.label || 'Photo zone'}
            </span>
          </div>
          {/* Border ring overlay (if set by designer) */}
          {bw > 0 && (
            <div className="absolute inset-0 pointer-events-none" style={{
              borderRadius: radius,
              border: `${bw}px solid ${bCol}`,
            }} />
          )}
        </div>
      );
    }
    return (
      <>
        <div className="absolute inset-0 overflow-hidden" style={{ borderRadius: 6, padding: '0 8px' }}>
          {zone.bgColor && (
            <div className="absolute inset-0" style={{ background: zone.bgColor, opacity: (zone.bgOpacity ?? 60) / 100, borderRadius: 4 }} />
          )}
          <div className="relative h-full" style={{ display: 'flex', flexDirection: 'column', justifyContent: zone.verticalAlign === 'bottom' ? 'flex-end' : zone.verticalAlign === 'center' ? 'center' : 'flex-start', alignItems: zone.align === 'center' ? 'center' : zone.align === 'right' ? 'flex-end' : 'flex-start' }}>
            {lines.map((line, i) => (
              <div key={i} style={{ ...textStyle, whiteSpace: 'nowrap' }}>{line || ' '}</div>
            ))}
          </div>
        </div>
        {/* Fit badge: shown when text was scaled down to fit the zone height */}
        {isTextScaledDown && !previewMode && (
          <div
            title={'Text scaled to fit (actual: ' + zone.size + 'px). Resize zone height or reduce font size.'}
            className="absolute pointer-events-none flex items-center gap-0.5 px-1.5 py-0.5 rounded-md text-[9px] font-mono font-medium"
            style={{
              bottom: -2, right: 0, transform: 'translateY(100%)',
              background: '#C97A2D', color: '#fff', opacity: 0.9, zIndex: 10,
            }}
          >
            {'↕ fit ' + Math.round(previewFitScale * 100) + '%'}
          </div>
        )}
      </>
    );
  })();

  return (
    <div
      className="absolute"
      style={{
        left: zone.x, top: zone.y, width: zone.w, height: zone.h,
        borderRadius: radius,
        clipPath: hexClip,
        cursor: zone.locked ? 'not-allowed' : previewMode ? 'default' : 'grab',
        opacity: opacityVal,
        transform: rotation ? `rotate(${rotation}deg)` : undefined,
        transformOrigin: 'center center',
        outline: selected && !previewMode ? `2px solid ${dashColor}` : undefined,
        boxShadow: multiSelected && !previewMode ? `0 0 0 1px ${dashColor}40` : undefined,
        userSelect: 'none',
        WebkitUserSelect: 'none',
      }}
      onPointerDown={onPointerDown}
      onDoubleClick={e => e.stopPropagation()}
    >
      {/* Dashed border when not selected */}
      {!previewMode && !selected && (
        <div className="absolute inset-0 pointer-events-none" style={{
          borderRadius: radius,
          backgroundImage: `repeating-linear-gradient(90deg,${dashColor} 0 6px,transparent 6px 12px),repeating-linear-gradient(180deg,${dashColor} 0 6px,transparent 6px 12px),repeating-linear-gradient(0deg,${dashColor} 0 6px,transparent 6px 12px),repeating-linear-gradient(270deg,${dashColor} 0 6px,transparent 6px 12px)`,
          backgroundSize: '100% 1.5px,1.5px 100%,100% 1.5px,1.5px 100%',
          backgroundPosition: '0 0,0 0,0 100%,100% 0',
          backgroundRepeat: 'no-repeat',
          opacity: 0.7,
        }} />
      )}

      {inner}

      {/* Label tag */}
      {!previewMode && (
        <span className="absolute pointer-events-none font-mono text-[9.5px] px-1.5 py-px rounded text-white whitespace-nowrap" style={{ background: dashColor, top: -2, left: 0, transform: 'translateY(-100%)' }}>
          {zone.label}{zone.required && ' *'}{zone.locked && ' 🔒'}{rotation !== 0 && ` ${rotation}°`}
        </span>
      )}

      {/* Rotation handle — sizes scale inversely with zoom so they're always 14px on screen */}
      {selected && !previewMode && (
        <>
          {/* Stem line */}
          <div className="absolute pointer-events-none" style={{
            width: 1 / zoom,
            height: ROTATE_HANDLE_DIST / zoom,
            background: dashColor,
            left: zone.w / 2 - 0.5 / zoom,
            bottom: '100%',
          }} />
          {/* Circle handle */}
          <div
            onPointerDown={onRotate}
            title="Drag to rotate (⇧ = snap 15°)"
            style={{
              position: 'absolute',
              width: 14 / zoom, height: 14 / zoom,
              borderRadius: 999,
              background: 'white',
              border: `${2 / zoom}px solid ${dashColor}`,
              bottom: `calc(100% + ${ROTATE_HANDLE_DIST / zoom}px)`,
              left: zone.w / 2 - 7 / zoom,
              cursor: 'grab',
              boxShadow: `0 ${1/zoom}px ${4/zoom}px rgba(0,0,0,0.2)`,
              zIndex: 10,
            }}
          />
        </>
      )}

      {/* Resize handles + size badge */}
      {selected && !previewMode && (
        <>
          {(['nw','n','ne','e','se','s','sw','w'] as const).map(dir => (
            <HandleEl key={dir} dir={dir} round={isPhoto && zone.shape === 'circle'} color={dashColor} zoom={zoom} onPointerDown={e => onHandle(e, dir)} />
          ))}
          <span className="absolute font-mono text-white whitespace-nowrap pointer-events-none" style={{ fontSize: 9.5 / zoom, background: dashColor, bottom: -26 / zoom, left: '50%', transform: 'translateX(-50%)', padding: `${2/zoom}px ${6/zoom}px`, borderRadius: 4/zoom }}>
            {zone.w} × {zone.h}{rotation !== 0 ? ` · ${rotation}°` : ''}
          </span>
        </>
      )}
    </div>
  );
}

const HANDLE_CURSORS: Record<string, string> = {
  nw: 'nwse-resize', n: 'ns-resize', ne: 'nesw-resize', e: 'ew-resize',
  se: 'nwse-resize', s: 'ns-resize', sw: 'nesw-resize', w: 'ew-resize',
};

function HandleEl({ dir, round, color, zoom, onPointerDown }: {
  dir: string; round: boolean; color: string; zoom: number;
  onPointerDown: (e: React.PointerEvent) => void;
}) {
  /* Always 12×12 px on screen regardless of canvas zoom */
  const sz  = 12 / zoom;
  const h   = sz / 2;
  const bw  = 2 / zoom;

  const pos: React.CSSProperties = {};
  if      (dir.includes('n')) { pos.top    = -h; }
  else if (dir.includes('s')) { pos.bottom = -h; }
  else                         { pos.top = '50%'; pos.marginTop = -h; }
  if      (dir.includes('w')) { pos.left   = -h; }
  else if (dir.includes('e')) { pos.right  = -h; }
  else                         { pos.left = '50%'; pos.marginLeft = -h; }

  return (
    <span
      data-handle={dir}
      onPointerDown={onPointerDown}
      style={{
        position: 'absolute',
        width: sz, height: sz,
        background: 'white',
        border: `${bw}px solid ${color}`,
        borderRadius: round ? 999 : 3 / zoom,
        boxShadow: `0 ${1/zoom}px ${3/zoom}px rgba(0,0,0,0.25)`,
        cursor: HANDLE_CURSORS[dir],
        ...pos,
      }}
    />
  );
}

/* ══════════════════════════════════════════════════════════
   UI PRIMITIVES
══════════════════════════════════════════════════════════ */
function PropSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="px-4 py-4 border-b border-border">
      <div className="text-[10.5px] font-mono tracking-widest text-[#0F1F18]/40 mb-3">{title.toUpperCase()}</div>
      <div className="space-y-3">{children}</div>
    </div>
  );
}

function PropRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <div className="text-[11px] text-[#0F1F18]/55 mb-1">{label}</div>
      {children}
    </label>
  );
}

function PropToggle({ label, value, onChange }: { label: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex items-center justify-between cursor-pointer py-0.5">
      <span className="text-[12.5px]">{label}</span>
      <button type="button" onClick={() => onChange(!value)} className={`relative h-5 w-9 rounded-full transition ${value ? 'bg-primary' : 'bg-border'}`}>
        <span className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-all ${value ? 'left-[18px]' : 'left-0.5'}`} />
      </button>
    </label>
  );
}

function Segmented({ value, onChange, options }: { value: string; onChange: (v: string) => void; options: { v: string; label?: string; icon?: React.ReactNode }[] }) {
  return (
    <div className="flex p-0.5 bg-cream rounded-lg border border-border">
      {options.map(o => (
        <button key={o.v} onClick={() => onChange(o.v)}
          className={`flex-1 h-7 text-[11px] font-medium rounded-md grid place-items-center transition ${value === o.v ? 'bg-white shadow-sm text-[#0F1F18]' : 'text-[#0F1F18]/50 hover:text-[#0F1F18]'}`}>
          {o.icon ?? o.label}
        </button>
      ))}
    </div>
  );
}

function NumberProp({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) {
  return (
    <label className="block">
      <div className="text-[10px] font-mono uppercase tracking-widest text-[#0F1F18]/40 mb-1">{label}</div>
      <input type="number" value={value} onChange={e => onChange(Number(e.target.value))} className="prop-input font-mono text-[12px]" />
    </label>
  );
}

function ColorRow({ value, onChange, BRAND_COLORS }: { value: string; onChange: (v: string) => void; BRAND_COLORS: string[] }) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center gap-2">
        <input type="color" value={value.startsWith('#') ? value : '#ffffff'} onChange={e => onChange(e.target.value)} className="h-7 w-7 rounded border border-border cursor-pointer bg-white shrink-0" />
        <input value={value} onChange={e => onChange(e.target.value)} className="prop-input flex-1 font-mono text-[11px] uppercase" style={{ minWidth: 72 }} />
      </div>
      <div className="flex gap-1 flex-wrap">
        {BRAND_COLORS.map(s => (
          <button key={s} onClick={() => onChange(s)}
            className={`h-5 w-5 rounded border transition ${value.toUpperCase() === s.toUpperCase() ? 'border-primary ring-2 ring-primary/30' : 'border-border hover:border-primary/50'}`}
            style={{ background: s }}
            title={s}
          />
        ))}
      </div>
    </div>
  );
}

function Modal({ onClose, title, subtitle, children }: { onClose: () => void; title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-[#0F1F18]/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-lift w-full max-w-[440px] p-6">
        <div className="flex items-start justify-between mb-5">
          <div>
            <h2 className="font-display font-bold text-[18px]">{title}</h2>
            {subtitle && <p className="text-[12.5px] text-[#0F1F18]/50 mt-0.5">{subtitle}</p>}
          </div>
          <button onClick={onClose} className="h-8 w-8 rounded-lg hover:bg-cream grid place-items-center text-[#0F1F18]/50 shrink-0 ml-4">
            <X size={15} strokeWidth={1.8} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

function ModalField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-[12px] font-medium text-[#0F1F18]/70 mb-1.5">{label}</label>
      {children}
    </div>
  );
}
