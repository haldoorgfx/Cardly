'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import type { Zone, Variant } from '@/types/database';

const CW = 1080;
const CH = 1350;

type HistoryState = { past: Zone[][]; future: Zone[][] };
type SnapGuides = { x?: number; y?: number };

function Icon({ d, size = 16, sw = 1.8 }: { d: string; size?: number; sw?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" dangerouslySetInnerHTML={{ __html: d }} />
  );
}

const I = {
  text: '<path d="M4 7V4h16v3M9 20h6M12 4v16"/>',
  photo: '<rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/>',
  field: '<rect x="3" y="6" width="18" height="12" rx="2"/><path d="M7 10v4"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  eye: '<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>',
  eyeOff: '<path d="M17.94 17.94A10 10 0 0 1 12 20c-7 0-11-8-11-8a18 18 0 0 1 5.06-5.94M9.9 4.24A10 10 0 0 1 12 4c7 0 11 8 11 8a18 18 0 0 1-3.17 4.19M1 1l22 22"/><path d="M14.12 14.12A3 3 0 1 1 9.88 9.88"/>',
  lock: '<rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>',
  unlock: '<rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 9.9-1"/>',
  trash: '<polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6"/>',
  duplicate: '<rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>',
  align_l: '<line x1="17" y1="10" x2="3" y2="10"/><line x1="21" y1="6" x2="3" y2="6"/><line x1="21" y1="14" x2="3" y2="14"/><line x1="17" y1="18" x2="3" y2="18"/>',
  align_c: '<line x1="18" y1="10" x2="6" y2="10"/><line x1="21" y1="6" x2="3" y2="6"/><line x1="21" y1="14" x2="3" y2="14"/><line x1="18" y1="18" x2="6" y2="18"/>',
  align_r: '<line x1="21" y1="10" x2="7" y2="10"/><line x1="21" y1="6" x2="3" y2="6"/><line x1="21" y1="14" x2="3" y2="14"/><line x1="21" y1="18" x2="7" y2="18"/>',
  zoom_in: '<circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3M11 8v6M8 11h6"/>',
  zoom_out: '<circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3M8 11h6"/>',
  grid: '<rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/>',
  cursor: '<path d="M5 3l14 7-6 2-2 6-6-15z"/>',
  back: '<path d="M19 12H5M12 19l-7-7 7-7"/>',
  save: '<circle cx="12" cy="12" r="10"/><path d="M9 12l2 2 4-4"/>',
  globe: '<circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15 15 0 0 1 0 20M12 2a15 15 0 0 0 0 20"/>',
  more: '<circle cx="5" cy="12" r="1.5" fill="currentColor"/><circle cx="12" cy="12" r="1.5" fill="currentColor"/><circle cx="19" cy="12" r="1.5" fill="currentColor"/>',
  undo: '<path d="M3 7v6h6"/><path d="M21 17a9 9 0 0 0-15-6.7L3 13"/>',
  redo: '<path d="M21 7v6h-6"/><path d="M3 17a9 9 0 0 1 15-6.7L21 13"/>',
  upload: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>',
  play: '<polygon points="6 4 20 12 6 20 6 4"/>',
  pin: '<line x1="12" y1="17" x2="12" y2="22"/><path d="M5 17h14v-1.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V6h1a2 2 0 0 0 0-4H8a2 2 0 0 0 0 4h1v4.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24V17z"/>',
  close: '<line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>',
  layers: '<polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/>',
  up: '<path d="M18 15l-6-6-6 6"/>',
  down: '<path d="M6 9l6 6 6-6"/>',
  preview: '<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/><path d="M3 3l18 18"/>',
  alignTop: '<line x1="3" y1="3" x2="21" y2="3"/><rect x="7" y="7" width="4" height="14" rx="1"/><rect x="13" y="7" width="4" height="10" rx="1"/>',
  alignMid: '<line x1="3" y1="12" x2="21" y2="12"/><rect x="7" y="5" width="4" height="14" rx="1"/><rect x="13" y="7" width="4" height="10" rx="1"/>',
  alignBot: '<line x1="3" y1="21" x2="21" y2="21"/><rect x="7" y="3" width="4" height="14" rx="1"/><rect x="13" y="7" width="4" height="10" rx="1"/>',
};

const COLORS = ['#FFFFFF', '#0F1F18', '#1F4D3A', '#E8C57E', '#FFD28A', '#7BE0C0', '#FF6058', '#000000'];
const FONTS = ['DM Sans', 'Inter', 'JetBrains Mono', 'Space Grotesk', 'Playfair Display', 'Georgia'];

interface CanvasEditorProps {
  eventId: string;
  eventName: string;
  variants: Variant[];
}

export default function CanvasEditor({ eventId, eventName, variants: initialVariants }: CanvasEditorProps) {
  const router = useRouter();

  const [variants, setVariants] = useState<Variant[]>(initialVariants);
  const [activeVariantId, setActiveVariantId] = useState<string>(initialVariants[0]?.id ?? '');
  const [showAddVariantModal, setShowAddVariantModal] = useState(false);
  const [addingVariant, setAddingVariant] = useState(false);
  const [newVariantName, setNewVariantName] = useState('');
  const [newVariantFile, setNewVariantFile] = useState<File | null>(null);
  const newVariantFileRef = useRef<HTMLInputElement>(null);

  const [variantZonesMap, setVariantZonesMap] = useState<Record<string, Zone[]>>(() => {
    const map: Record<string, Zone[]> = {};
    for (const v of initialVariants) map[v.id] = (v.zones as Zone[]) ?? [];
    return map;
  });

  const activeVariant = variants.find(v => v.id === activeVariantId) ?? variants[0];
  const zones = variantZonesMap[activeVariantId] ?? [];
  const bgW = activeVariant?.background_width ?? CW;
  const bgH = activeVariant?.background_height ?? CH;
  const backgroundUrl = activeVariant?.background_url ?? '';

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [zoom, setZoom] = useState(0.42);
  const [grid, setGrid] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);
  const [snapGuides, setSnapGuides] = useState<SnapGuides>({});
  const [nameVal, setNameVal] = useState(eventName);
  const [editName, setEditName] = useState(false);
  const [savedAt, setSavedAt] = useState('just now');
  const [history, setHistory] = useState<HistoryState>({ past: [], future: [] });
  const stageRef = useRef<HTMLDivElement>(null);
  const autosaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const zonesRef = useRef(zones);
  zonesRef.current = zones;
  const didMoveRef = useRef(false);

  const selected = zones.find(z => z.id === selectedId) ?? null;

  const switchVariant = useCallback((variantId: string) => {
    setActiveVariantId(variantId);
    setSelectedId(null);
    setHistory({ past: [], future: [] });
  }, []);

  const scheduleSave = useCallback((nextZones: Zone[], variantId: string) => {
    if (autosaveTimer.current) clearTimeout(autosaveTimer.current);
    autosaveTimer.current = setTimeout(async () => {
      await fetch(`/api/events/${eventId}/variants/${variantId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ zones: nextZones }),
      });
      setSavedAt(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
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

  const updateZone = useCallback((id: string, patch: Partial<Zone>, withHistory = false) => {
    const next = zonesRef.current.map(z => z.id === id ? { ...z, ...patch } : z);
    if (withHistory) pushHistory(next);
    else {
      setZonesForVariant(activeVariantId, next);
      scheduleSave(next, activeVariantId);
    }
  }, [pushHistory, scheduleSave, activeVariantId, setZonesForVariant]);

  const removeZone = useCallback((id: string) => {
    pushHistory(zonesRef.current.filter(z => z.id !== id));
    setSelectedId(null);
  }, [pushHistory]);

  const duplicateZone = useCallback((id: string) => {
    const z = zonesRef.current.find(x => x.id === id);
    if (!z) return;
    const nz: Zone = { ...z, id: 'z' + Math.random().toString(36).slice(2, 7), x: z.x + 30, y: z.y + 30, label: z.label + ' copy' };
    pushHistory([...zonesRef.current, nz]);
    setSelectedId(nz.id);
  }, [pushHistory]);

  const moveZoneUp = useCallback((id: string) => {
    const arr = zonesRef.current;
    const idx = arr.findIndex(z => z.id === id);
    if (idx <= 0) return;
    const next = [...arr];
    [next[idx - 1], next[idx]] = [next[idx], next[idx - 1]];
    pushHistory(next);
  }, [pushHistory]);

  const moveZoneDown = useCallback((id: string) => {
    const arr = zonesRef.current;
    const idx = arr.findIndex(z => z.id === id);
    if (idx >= arr.length - 1) return;
    const next = [...arr];
    [next[idx + 1], next[idx]] = [next[idx], next[idx + 1]];
    pushHistory(next);
  }, [pushHistory]);

  const toggleLock = useCallback((id: string) => {
    const z = zonesRef.current.find(z => z.id === id);
    if (!z) return;
    updateZone(id, { locked: !z.locked }, true);
  }, [updateZone]);

  const addZone = useCallback((type: 'text' | 'photo' | 'custom') => {
    const base = { id: 'z' + Math.random().toString(36).slice(2, 7), x: bgW / 2 - 200, y: bgH / 2 - 50, required: false };
    let z: Zone;
    if (type === 'text') {
      z = { ...base, type: 'text', label: 'New text field', w: 400, h: 80, font: 'DM Sans', weight: 600, size: 48, color: '#FFFFFF', align: 'left', placeholder: 'Placeholder', sample: 'Sample text', lineHeight: 1.2, letterSpacing: 0, opacity: 100 };
    } else if (type === 'photo') {
      z = { ...base, type: 'photo', label: 'Photo', w: 240, h: 240, shape: 'circle', placeholder: 'Tap to add a photo', sample: '·', opacity: 100 };
    } else {
      z = { ...base, type: 'custom', label: 'Custom field', w: 400, h: 60, font: 'Inter', weight: 500, size: 24, color: '#FFFFFF', align: 'left', placeholder: 'Select option', sample: 'Speaker', options: ['Speaker', 'Sponsor', 'Delegate'], opacity: 100 };
    }
    pushHistory([...zonesRef.current, z]);
    setSelectedId(z.id);
  }, [pushHistory, bgW, bgH]);

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

  const interaction = useRef<{ mode: 'move' | 'resize'; dir?: string; id: string; sx: number; sy: number; ox: number; oy: number; ow: number; oh: number } | null>(null);

  const onZonePointerDown = useCallback((e: React.PointerEvent, zone: Zone) => {
    e.stopPropagation();
    setSelectedId(zone.id);
    didMoveRef.current = false;
    interaction.current = { mode: 'move', id: zone.id, sx: e.clientX, sy: e.clientY, ox: zone.x, oy: zone.y, ow: zone.w, oh: zone.h };
    document.body.classList.add('cursor-grabbing', 'select-none');
  }, []);

  const onHandlePointerDown = useCallback((e: React.PointerEvent, zone: Zone, dir: string) => {
    e.stopPropagation();
    setSelectedId(zone.id);
    didMoveRef.current = false;
    interaction.current = { mode: 'resize', dir, id: zone.id, sx: e.clientX, sy: e.clientY, ox: zone.x, oy: zone.y, ow: zone.w, oh: zone.h };
    document.body.classList.add('select-none');
  }, []);

  useEffect(() => {
    const SNAP_THRESHOLD = 8 / zoom;
    const onMove = (e: PointerEvent) => {
      const it = interaction.current;
      if (!it) return;
      didMoveRef.current = true;
      const dx = (e.clientX - it.sx) / zoom;
      const dy = (e.clientY - it.sy) / zoom;
      const guides: SnapGuides = {};

      if (it.mode === 'move') {
        let nx = Math.max(0, Math.min(bgW - it.ow, it.ox + dx));
        let ny = Math.max(0, Math.min(bgH - it.oh, it.oy + dy));
        // Snap to horizontal center
        if (Math.abs((nx + it.ow / 2) - bgW / 2) < SNAP_THRESHOLD) {
          nx = bgW / 2 - it.ow / 2;
          guides.x = bgW / 2;
        }
        // Snap to vertical center
        if (Math.abs((ny + it.oh / 2) - bgH / 2) < SNAP_THRESHOLD) {
          ny = bgH / 2 - it.oh / 2;
          guides.y = bgH / 2;
        }
        // Snap to left/right edges
        if (Math.abs(nx) < SNAP_THRESHOLD) { nx = 0; guides.x = 0; }
        if (Math.abs(nx + it.ow - bgW) < SNAP_THRESHOLD) { nx = bgW - it.ow; guides.x = bgW; }
        setSnapGuides(guides);
        updateZone(it.id, { x: Math.round(nx), y: Math.round(ny) });
      } else if (it.mode === 'resize' && it.dir) {
        const d = it.dir;
        let nx = it.ox, ny = it.oy, nw = it.ow, nh = it.oh;
        if (d.includes('e')) nw = Math.max(40, it.ow + dx);
        if (d.includes('s')) nh = Math.max(20, it.oh + dy);
        if (d.includes('w')) { nw = Math.max(40, it.ow - dx); nx = it.ox + (it.ow - nw); }
        if (d.includes('n')) { nh = Math.max(20, it.oh - dy); ny = it.oy + (it.oh - nh); }
        nx = Math.max(0, nx); ny = Math.max(0, ny);
        nw = Math.min(nw, bgW - nx); nh = Math.min(nh, bgH - ny);
        setSnapGuides(guides);
        updateZone(it.id, { x: Math.round(nx), y: Math.round(ny), w: Math.round(nw), h: Math.round(nh) });
      }
    };
    const onUp = () => {
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
    return () => { window.removeEventListener('pointermove', onMove); window.removeEventListener('pointerup', onUp); };
  }, [zoom, updateZone, bgW, bgH]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement).tagName === 'INPUT' || (e.target as HTMLElement).tagName === 'TEXTAREA') return;
      if (e.key === 'Backspace' || e.key === 'Delete') {
        if (selectedId) { e.preventDefault(); removeZone(selectedId); }
      } else if (e.key === 'Escape') {
        setSelectedId(null);
      } else if (e.metaKey || e.ctrlKey) {
        if (e.key === 'z') { e.preventDefault(); if (e.shiftKey) { redo(); } else { undo(); } }
        if (e.key === 'd' && selectedId) { e.preventDefault(); duplicateZone(selectedId); }
        if (e.key === 'p') { e.preventDefault(); setPreviewMode(p => !p); }
      } else if (selected) {
        const step = e.shiftKey ? 10 : 1;
        if (e.key === 'ArrowLeft') { e.preventDefault(); updateZone(selected.id, { x: Math.max(0, selected.x - step) }, true); }
        if (e.key === 'ArrowRight') { e.preventDefault(); updateZone(selected.id, { x: Math.min(bgW - selected.w, selected.x + step) }, true); }
        if (e.key === 'ArrowUp') { e.preventDefault(); updateZone(selected.id, { y: Math.max(0, selected.y - step) }, true); }
        if (e.key === 'ArrowDown') { e.preventDefault(); updateZone(selected.id, { y: Math.min(bgH - selected.h, selected.y + step) }, true); }
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [selected, selectedId, undo, redo, removeZone, duplicateZone, updateZone, bgW, bgH]);

  useEffect(() => {
    const fit = () => {
      const el = stageRef.current;
      if (!el) return;
      const pad = 80;
      const z = Math.min((el.clientWidth - pad) / bgW, (el.clientHeight - pad) / bgH);
      setZoom(Math.max(0.18, Math.min(1.4, z)));
    };
    fit();
    window.addEventListener('resize', fit);
    return () => window.removeEventListener('resize', fit);
  }, [bgW, bgH, activeVariantId]);

  const handlePublish = async () => {
    router.push(`/events/${eventId}/publish`);
  };

  const saveName = async () => {
    setEditName(false);
    await fetch(`/api/events/${eventId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: nameVal }),
    });
  };

  const handleAddVariant = async () => {
    if (!newVariantName.trim() || !newVariantFile) return;
    setAddingVariant(true);
    try {
      const fd = new FormData();
      fd.append('variant_name', newVariantName.trim());
      fd.append('file', newVariantFile);
      const res = await fetch(`/api/events/${eventId}/variants`, { method: 'POST', body: fd });
      if (!res.ok) throw new Error('Failed to create variant');
      const newVariant = await res.json() as Variant;
      newVariant.zones = [];
      setVariants(v => [...v, newVariant]);
      setVariantZonesMap(m => ({ ...m, [newVariant.id]: [] }));
      switchVariant(newVariant.id);
      setShowAddVariantModal(false);
      setNewVariantName('');
      setNewVariantFile(null);
    } catch {
      // silently fail
    } finally {
      setAddingVariant(false);
    }
  };

  return (
    <div className="flex flex-col" style={{ height: '100vh', overflow: 'hidden', background: '#FAF6EE' }}>
      {/* Top Bar */}
      <header className="h-14 bg-white border-b border-border flex items-center px-4 gap-3 shrink-0 z-10">
        <a href="/dashboard" className="h-8 w-8 rounded-lg hover:bg-cream grid place-items-center text-[#0F1F18]/70" title="Back">
          <Icon d={I.back} size={16} />
        </a>
        <div className="h-6 w-px bg-border" />
        <a href="/dashboard" className="flex items-center gap-2 shrink-0">
          <span className="h-7 w-7 rounded-lg grid place-items-center text-white font-display font-bold text-[13px] bg-primary">C</span>
        </a>
        <div className="flex items-center gap-1.5 text-[13px]">
          <span className="text-[#0F1F18]/40 font-mono text-[11px]">Events</span>
          <span className="text-[#0F1F18]/30">/</span>
          {editName
            ? <input autoFocus value={nameVal} onChange={e => setNameVal(e.target.value)} onBlur={saveName} onKeyDown={e => e.key === 'Enter' && saveName()} className="font-display font-semibold bg-white border border-primary/40 rounded-md px-2 py-0.5 outline-none w-[260px]" />
            : <button onClick={() => setEditName(true)} className="font-display font-semibold hover:bg-cream rounded-md px-2 py-0.5">{nameVal}</button>
          }
        </div>

        <div className="flex-1" />

        <div className="flex items-center gap-1">
          <button title="Undo (⌘Z)" disabled={!history.past.length} onClick={undo} className={`h-8 w-8 rounded-lg grid place-items-center ${history.past.length ? 'text-[#0F1F18]/80 hover:bg-cream' : 'text-[#0F1F18]/25'}`}>
            <Icon d={I.undo} size={15} />
          </button>
          <button title="Redo (⇧⌘Z)" disabled={!history.future.length} onClick={redo} className={`h-8 w-8 rounded-lg grid place-items-center ${history.future.length ? 'text-[#0F1F18]/80 hover:bg-cream' : 'text-[#0F1F18]/25'}`}>
            <Icon d={I.redo} size={15} />
          </button>
        </div>

        <div className="flex items-center gap-1.5 text-[12px] text-[#0F1F18]/55 mx-2">
          <Icon d={I.save} size={13} sw={2} />
          Saved · {savedAt}
        </div>

        <div className="flex items-center gap-2">
          {/* Preview toggle */}
          <button
            onClick={() => setPreviewMode(p => !p)}
            title="Preview mode (⌘P)"
            className={`inline-flex items-center gap-1.5 text-[12px] px-3 py-1.5 rounded-lg border transition ${previewMode ? 'bg-primary/10 text-primary border-primary/30' : 'text-[#0F1F18]/70 border-border hover:bg-cream'}`}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
            </svg>
            {previewMode ? 'Editing' : 'Preview'}
          </button>

          <a
            href={`/events/${eventId}`}
            className="inline-flex items-center gap-1.5 text-[13px] text-[#0F1F18]/80 bg-white border border-border px-3 py-1.5 rounded-lg hover:bg-cream transition"
          >
            <Icon d={I.play} size={13} sw={2.2} />
            Test
          </a>
          <button
            onClick={handlePublish}
            className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-white px-3.5 py-1.5 rounded-lg hover:opacity-95 transition shadow-soft bg-primary"
          >
            <Icon d={I.globe} size={13} sw={2.2} />
            Publish
          </button>
        </div>
      </header>

      {/* Variant tab bar */}
      <div className="h-11 bg-white border-b border-border flex items-center px-4 gap-1 shrink-0 z-10">
        <span className="text-[11px] font-mono text-[#0F1F18]/40 mr-2 shrink-0">VARIANTS</span>
        {variants.map(v => (
          <button
            key={v.id}
            onClick={() => switchVariant(v.id)}
            className={`flex items-center gap-2 px-3.5 h-7 rounded-lg text-[13px] font-medium transition ${v.id === activeVariantId ? 'bg-primary text-white shadow-sm' : 'text-[#0F1F18]/60 hover:text-[#0F1F18] hover:bg-cream border border-border'}`}
          >
            <Icon d={I.layers} size={12} sw={2} />
            {v.variant_name}
          </button>
        ))}
        <button
          onClick={() => setShowAddVariantModal(true)}
          className="flex items-center gap-1.5 px-3 h-7 rounded-lg text-[13px] font-medium text-[#0F1F18]/50 hover:text-primary hover:bg-primary/[0.08] border border-dashed border-border hover:border-primary/40 transition"
        >
          <Icon d={I.plus} size={13} sw={2.5} />
          Add variant
        </button>
      </div>

      <div className="flex-1 flex min-h-0">
        {/* Left Rail */}
        <aside className="w-[256px] shrink-0 bg-white border-r border-border flex flex-col overflow-y-auto">
          {!previewMode && (
            <div className="p-4">
              <div className="text-[11px] font-mono tracking-widest text-[#0F1F18]/40 mb-3">ADD TO CANVAS</div>
              <div className="space-y-1.5">
                {[
                  { type: 'text' as const, label: 'Text field', sub: 'Name, title, country…', icon: I.text },
                  { type: 'photo' as const, label: 'Photo zone', sub: 'Headshot or logo', icon: I.photo },
                  { type: 'custom' as const, label: 'Custom field', sub: 'Dropdown, badge, role…', icon: I.field },
                ].map(item => (
                  <button
                    key={item.type}
                    onClick={() => addZone(item.type)}
                    className="group w-full flex items-center gap-3 p-2.5 rounded-xl hover:bg-cream border border-transparent hover:border-border transition text-left"
                  >
                    <span className="h-9 w-9 rounded-lg bg-cream grid place-items-center text-primary group-hover:text-white group-hover:bg-primary transition">
                      <Icon d={item.icon} size={15} sw={1.8} />
                    </span>
                    <span className="flex-1 min-w-0">
                      <span className="block text-[13px] font-medium">{item.label}</span>
                      <span className="block text-[11px] text-[#0F1F18]/50">{item.sub}</span>
                    </span>
                    <Icon d={I.plus} size={13} sw={2} />
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className={previewMode ? 'p-4' : 'px-4'}>
            <div className="text-[11px] font-mono tracking-widest text-[#0F1F18]/40 mb-2 flex items-center justify-between">
              LAYERS <span className="text-[#0F1F18]/40 normal-case font-sans">{zones.length}</span>
            </div>
            <div className="space-y-0.5">
              {zones.map((z, idx) => (
                <div
                  key={z.id}
                  onClick={() => { if (!previewMode) setSelectedId(z.id); }}
                  className={`group flex items-center gap-1.5 px-2 py-1.5 rounded-lg cursor-pointer text-[12.5px] ${z.id === selectedId && !previewMode ? 'bg-primary/10 text-primary' : 'hover:bg-cream text-[#0F1F18]/80'}`}
                >
                  {/* Layer order arrows */}
                  {!previewMode && (
                    <div className="flex flex-col gap-0 opacity-0 group-hover:opacity-100 shrink-0">
                      <button onClick={e => { e.stopPropagation(); moveZoneUp(z.id); }} disabled={idx === 0} className="h-4 w-4 rounded grid place-items-center text-[#0F1F18]/40 hover:text-primary disabled:opacity-20" title="Move up">
                        <Icon d={I.up} size={9} sw={2.5} />
                      </button>
                      <button onClick={e => { e.stopPropagation(); moveZoneDown(z.id); }} disabled={idx === zones.length - 1} className="h-4 w-4 rounded grid place-items-center text-[#0F1F18]/40 hover:text-primary disabled:opacity-20" title="Move down">
                        <Icon d={I.down} size={9} sw={2.5} />
                      </button>
                    </div>
                  )}
                  <span className={`h-6 w-6 rounded-md grid place-items-center shrink-0 ${z.id === selectedId && !previewMode ? 'text-primary' : 'text-[#0F1F18]/50'}`}>
                    <Icon d={z.type === 'photo' ? I.photo : z.type === 'custom' ? I.field : I.text} size={12} />
                  </span>
                  <span className="flex-1 truncate">{z.label}</span>
                  {z.required && <span className="text-[9px] font-mono px-1 py-px rounded bg-primary/10 text-primary shrink-0">REQ</span>}
                  {!previewMode && (
                    <div className="opacity-0 group-hover:opacity-100 flex items-center gap-0.5">
                      <button
                        onClick={e => { e.stopPropagation(); toggleLock(z.id); }}
                        className={`h-6 w-6 rounded-md grid place-items-center ${z.locked ? 'text-warning' : 'text-[#0F1F18]/40 hover:text-[#0F1F18]'}`}
                        title={z.locked ? 'Unlock' : 'Lock'}
                      >
                        <Icon d={z.locked ? I.lock : I.unlock} size={11} />
                      </button>
                      <button
                        onClick={e => { e.stopPropagation(); updateZone(z.id, { hidden: !z.hidden }); }}
                        className="h-6 w-6 rounded-md grid place-items-center text-[#0F1F18]/40 hover:text-[#0F1F18]"
                        title={z.hidden ? 'Show' : 'Hide'}
                      >
                        <Icon d={z.hidden ? I.eyeOff : I.eye} size={11} />
                      </button>
                    </div>
                  )}
                </div>
              ))}
              {zones.length === 0 && (
                <div className="text-center py-6 text-[12px] text-[#0F1F18]/35">
                  No zones yet.<br />Add one above.
                </div>
              )}
            </div>
          </div>

          <div className="mt-auto p-3 border-t border-border">
            <div className="text-[11px] font-mono tracking-widest text-[#0F1F18]/40 mb-2">BACKGROUND</div>
            <div className="flex items-center gap-3 rounded-xl border border-border p-2.5">
              <div className="h-9 w-9 rounded-md shrink-0 bg-cover bg-center" style={{ backgroundImage: backgroundUrl ? `url(${backgroundUrl})` : undefined, background: backgroundUrl ? undefined : '#FAF6EE' }} />
              <div className="flex-1 min-w-0">
                <div className="text-[12px] font-medium truncate">{activeVariant?.variant_name ?? 'Variant'}</div>
                <div className="text-[10px] font-mono text-[#0F1F18]/45">{bgW} × {bgH}</div>
              </div>
            </div>
          </div>
        </aside>

        {/* Stage */}
        <div
          ref={stageRef}
          className="flex-1 relative overflow-hidden"
          style={{ backgroundColor: '#EDE9E0', backgroundImage: 'radial-gradient(#C8C2B5 1px, transparent 1px)', backgroundSize: '16px 16px' }}
          onPointerDown={() => setSelectedId(null)}
        >
          <div className="absolute inset-0 flex items-center justify-center">
            <div style={{ width: bgW * zoom, height: bgH * zoom, position: 'relative', flexShrink: 0 }}>
              <div
                className="relative shadow-lift rounded-md"
                style={{ width: bgW, height: bgH, transform: `scale(${zoom})`, transformOrigin: '0 0', position: 'absolute', top: 0, left: 0 }}
                onPointerDown={e => e.stopPropagation()}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={backgroundUrl} alt="" className="absolute inset-0 w-full h-full object-cover rounded-md" draggable={false} />

                {/* Grid overlay */}
                {grid && (
                  <div className="absolute inset-0 pointer-events-none" style={{
                    backgroundImage: 'linear-gradient(to right, rgba(31,77,58,0.10) 1px, transparent 1px), linear-gradient(to bottom, rgba(31,77,58,0.10) 1px, transparent 1px)',
                    backgroundSize: '60px 60px',
                  }} />
                )}

                {/* Snap guides */}
                {snapGuides.x !== undefined && (
                  <div className="absolute top-0 bottom-0 pointer-events-none" style={{ left: snapGuides.x, width: 1, background: 'rgba(232,197,126,0.9)', boxShadow: '0 0 4px rgba(232,197,126,0.5)' }} />
                )}
                {snapGuides.y !== undefined && (
                  <div className="absolute left-0 right-0 pointer-events-none" style={{ top: snapGuides.y, height: 1, background: 'rgba(232,197,126,0.9)', boxShadow: '0 0 4px rgba(232,197,126,0.5)' }} />
                )}

                {/* Zones */}
                {zones.map(z => (
                  <ZoneEl
                    key={z.id}
                    zone={z}
                    selected={z.id === selectedId && !previewMode}
                    previewMode={previewMode}
                    onPointerDown={e => { if (!z.locked && !previewMode) onZonePointerDown(e, z); }}
                    onHandle={(e, dir) => onHandlePointerDown(e, z, dir)}
                  />
                ))}

                {/* Canvas frame label */}
                {!previewMode && (
                  <>
                    <div className="absolute -top-7 left-0 right-0 flex items-center justify-between text-[11px] font-mono text-[#0F1F18]/45">
                      <span>{bgW} × {bgH} px</span>
                      <span>{zones.length} zones · {zones.filter(z => z.required).length} required</span>
                    </div>
                    <span className="absolute -top-1 -left-1 h-3 w-3 border-t border-l border-primary/50" />
                    <span className="absolute -top-1 -right-1 h-3 w-3 border-t border-r border-primary/50" />
                    <span className="absolute -bottom-1 -left-1 h-3 w-3 border-b border-l border-primary/50" />
                    <span className="absolute -bottom-1 -right-1 h-3 w-3 border-b border-r border-primary/50" />
                  </>
                )}

                {previewMode && (
                  <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/50 text-white/70 text-[11px] font-mono px-3 py-1.5 rounded-full backdrop-blur-sm pointer-events-none">
                    PREVIEW · no zone outlines
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Bottom zoom bar */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-1 bg-white rounded-xl border border-border shadow-soft p-1">
            <button onClick={() => setZoom(z => Math.max(0.1, z - 0.1))} className="h-8 w-8 rounded-lg hover:bg-cream grid place-items-center text-[#0F1F18]/70" title="Zoom out">
              <Icon d={I.zoom_out} size={14} />
            </button>
            <button onClick={() => setZoom(1)} className="font-mono text-[12px] px-2 min-w-[64px] text-center hover:bg-cream rounded-lg py-1.5">
              {Math.round(zoom * 100)}%
            </button>
            <button onClick={() => setZoom(z => Math.min(2, z + 0.1))} className="h-8 w-8 rounded-lg hover:bg-cream grid place-items-center text-[#0F1F18]/70" title="Zoom in">
              <Icon d={I.zoom_in} size={14} />
            </button>
            <span className="h-5 w-px bg-border mx-1" />
            <button
              onClick={() => setGrid(g => !g)}
              className={`h-8 px-2.5 rounded-lg flex items-center gap-1.5 text-[12px] ${grid ? 'bg-primary/10 text-primary' : 'hover:bg-cream text-[#0F1F18]/70'}`}
            >
              <Icon d={I.grid} size={13} />
              Grid
            </button>
            <button onClick={() => { const el = stageRef.current; if (!el) return; const pad = 80; setZoom(Math.max(0.18, Math.min(1.4, Math.min((el.clientWidth - pad) / bgW, (el.clientHeight - pad) / bgH)))); }} className="h-8 px-2.5 rounded-lg hover:bg-cream text-[12px] text-[#0F1F18]/70">
              Fit
            </button>
          </div>
        </div>

        {/* Right Rail */}
        {!selected || previewMode ? (
          <aside className="w-[300px] shrink-0 bg-white border-l border-border flex flex-col items-center justify-center p-8 text-center">
            <div className="h-12 w-12 rounded-2xl bg-cream grid place-items-center text-[#0F1F18]/40">
              <Icon d={previewMode ? I.preview : I.cursor} size={18} />
            </div>
            <div className="mt-4 font-display font-medium text-[14px]">
              {previewMode ? 'Preview mode' : 'Nothing selected'}
            </div>
            <p className="text-[12.5px] text-[#0F1F18]/55 mt-1 max-w-[200px]">
              {previewMode
                ? 'Zone outlines are hidden. Press ⌘P or click "Editing" to resume editing.'
                : 'Pick a zone on the canvas, or add a new field from the left panel.'}
            </p>
            {!previewMode && (
              <div className="mt-6 grid grid-cols-2 gap-1.5 text-[10px] font-mono text-[#0F1F18]/50">
                <span>Click</span><span>select zone</span>
                <span>Drag</span><span>reposition</span>
                <span>⌫</span><span>delete zone</span>
                <span>⌘D</span><span>duplicate</span>
                <span>⌘P</span><span>preview mode</span>
              </div>
            )}
          </aside>
        ) : (
          <aside className="w-[300px] shrink-0 bg-white border-l border-border flex flex-col overflow-y-auto">
            {/* Header */}
            <div className="p-4 border-b border-border flex items-center gap-2">
              <span className="h-7 w-7 rounded-md grid place-items-center text-white bg-primary">
                <Icon d={selected.type === 'photo' ? I.photo : selected.type === 'custom' ? I.field : I.text} size={13} />
              </span>
              <div className="flex-1 min-w-0">
                <div className="text-[11px] font-mono text-[#0F1F18]/50 uppercase tracking-widest">{selected.type} zone</div>
                <div className="text-[13px] font-display font-semibold truncate">{selected.label}</div>
              </div>
              <button onClick={() => duplicateZone(selected.id)} title="Duplicate (⌘D)" className="h-7 w-7 rounded-md hover:bg-cream grid place-items-center text-[#0F1F18]/60">
                <Icon d={I.duplicate} size={13} />
              </button>
              <button onClick={() => removeZone(selected.id)} title="Delete (⌫)" className="h-7 w-7 rounded-md hover:bg-rose-50 grid place-items-center text-rose-500">
                <Icon d={I.trash} size={13} />
              </button>
            </div>

            {/* Field properties */}
            <PropSection title="Field">
              <PropRow label="Label">
                <input value={selected.label} onChange={e => updateZone(selected.id, { label: e.target.value })} className="prop-input" />
              </PropRow>
              <PropRow label="Placeholder">
                <input value={selected.placeholder ?? ''} onChange={e => updateZone(selected.id, { placeholder: e.target.value })} className="prop-input" placeholder="Shown in the form" />
              </PropRow>
              <PropRow label="Sample text">
                <input value={selected.sample ?? ''} onChange={e => updateZone(selected.id, { sample: e.target.value })} className="prop-input" placeholder="Live preview value" />
              </PropRow>
              <PropToggle label="Required field" value={!!selected.required} onChange={v => updateZone(selected.id, { required: v })} />
            </PropSection>

            {selected.type === 'photo' ? (
              <PropSection title="Photo style">
                <PropRow label="Shape">
                  <Segmented
                    value={selected.shape ?? 'circle'}
                    onChange={v => updateZone(selected.id, { shape: v as Zone['shape'] })}
                    options={[{ v: 'circle', label: 'Circle' }, { v: 'rounded', label: 'Rounded' }, { v: 'square', label: 'Square' }]}
                  />
                </PropRow>
              </PropSection>
            ) : (
              <>
                <PropSection title="Typography">
                  <PropRow label="Font">
                    <select value={selected.font ?? 'Inter'} onChange={e => updateZone(selected.id, { font: e.target.value })} className="prop-input">
                      {FONTS.map(f => <option key={f} value={f}>{f}</option>)}
                    </select>
                  </PropRow>
                  <PropRow label="Weight">
                    <Segmented
                      value={String(selected.weight ?? 400)}
                      onChange={v => updateZone(selected.id, { weight: Number(v) })}
                      options={[{ v: '300', label: 'Light' }, { v: '400', label: 'Reg' }, { v: '600', label: 'SBd' }, { v: '700', label: 'Bold' }]}
                    />
                  </PropRow>
                  <PropRow label={`Size · ${selected.size ?? 32}px`}>
                    <input type="range" min="8" max="200" value={selected.size ?? 32} onChange={e => updateZone(selected.id, { size: Number(e.target.value) })} className="w-full accent-primary" style={{ height: 4 }} />
                  </PropRow>
                  <PropRow label={`Line height · ${(selected.lineHeight ?? 1.2).toFixed(1)}`}>
                    <input type="range" min="0.8" max="2.5" step="0.05" value={selected.lineHeight ?? 1.2} onChange={e => updateZone(selected.id, { lineHeight: Number(e.target.value) })} className="w-full accent-primary" style={{ height: 4 }} />
                  </PropRow>
                  <PropRow label={`Letter spacing · ${selected.letterSpacing ?? 0}px`}>
                    <input type="range" min="-5" max="20" step="0.5" value={selected.letterSpacing ?? 0} onChange={e => updateZone(selected.id, { letterSpacing: Number(e.target.value) })} className="w-full accent-primary" style={{ height: 4 }} />
                  </PropRow>
                  <PropRow label="Align">
                    <Segmented
                      value={selected.align ?? 'left'}
                      onChange={v => updateZone(selected.id, { align: v as Zone['align'] })}
                      options={[{ v: 'left', icon: I.align_l }, { v: 'center', icon: I.align_c }, { v: 'right', icon: I.align_r }]}
                    />
                  </PropRow>
                  <PropRow label="Text color">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <input type="color" value={selected.color ?? '#FFFFFF'} onChange={e => updateZone(selected.id, { color: e.target.value })} className="h-7 w-7 rounded border border-border cursor-pointer bg-white" />
                      <input value={selected.color ?? '#FFFFFF'} onChange={e => updateZone(selected.id, { color: e.target.value })} className="prop-input flex-1 font-mono text-[11px] uppercase" style={{ minWidth: 72 }} />
                      <div className="flex gap-1 flex-wrap">
                        {COLORS.map(s => (
                          <button key={s} onClick={() => updateZone(selected.id, { color: s })} className={`h-5 w-5 rounded border transition ${(selected.color ?? '').toUpperCase() === s.toUpperCase() ? 'border-primary ring-2 ring-primary/30' : 'border-border'}`} style={{ background: s }} />
                        ))}
                      </div>
                    </div>
                  </PropRow>
                </PropSection>

                {/* Background fill */}
                <PropSection title="Background fill">
                  <PropToggle label="Enable background" value={!!selected.bgColor} onChange={v => updateZone(selected.id, { bgColor: v ? 'rgba(0,0,0,0.5)' : undefined })} />
                  {selected.bgColor && (
                    <>
                      <PropRow label="Fill color">
                        <div className="flex items-center gap-2">
                          <input type="color" value={selected.bgColor.startsWith('#') ? selected.bgColor : '#000000'} onChange={e => updateZone(selected.id, { bgColor: e.target.value })} className="h-7 w-7 rounded border border-border cursor-pointer" />
                          <input value={selected.bgColor} onChange={e => updateZone(selected.id, { bgColor: e.target.value })} className="prop-input flex-1 font-mono text-[11px]" />
                        </div>
                      </PropRow>
                      <PropRow label={`Fill opacity · ${selected.bgOpacity ?? 60}%`}>
                        <input type="range" min="0" max="100" value={selected.bgOpacity ?? 60} onChange={e => updateZone(selected.id, { bgOpacity: Number(e.target.value) })} className="w-full accent-primary" style={{ height: 4 }} />
                      </PropRow>
                    </>
                  )}
                </PropSection>
              </>
            )}

            {/* Appearance */}
            <PropSection title="Appearance">
              <PropRow label={`Opacity · ${selected.opacity ?? 100}%`}>
                <input type="range" min="0" max="100" value={selected.opacity ?? 100} onChange={e => updateZone(selected.id, { opacity: Number(e.target.value) })} className="w-full accent-primary" style={{ height: 4 }} />
              </PropRow>
              <PropToggle label="Locked (no drag)" value={!!selected.locked} onChange={v => updateZone(selected.id, { locked: v })} />
              <PropToggle label="Hidden on canvas" value={!!selected.hidden} onChange={v => updateZone(selected.id, { hidden: v })} />
            </PropSection>

            {/* Position & size */}
            <PropSection title="Position & size">
              <div className="grid grid-cols-2 gap-2">
                <NumberProp label="X" value={selected.x} onChange={v => updateZone(selected.id, { x: v })} />
                <NumberProp label="Y" value={selected.y} onChange={v => updateZone(selected.id, { y: v })} />
                <NumberProp label="W" value={selected.w} onChange={v => updateZone(selected.id, { w: v })} />
                <NumberProp label="H" value={selected.h} onChange={v => updateZone(selected.id, { h: v })} />
              </div>
              {/* Quick alignment */}
              <div className="mt-3 grid grid-cols-3 gap-1.5">
                <button onClick={() => updateZone(selected.id, { x: Math.round(bgW / 2 - selected.w / 2) })} className="py-1.5 text-[11px] font-mono text-[#0F1F18]/60 border border-border rounded-lg hover:bg-cream flex items-center justify-center gap-1" title="Center H">
                  <Icon d={I.pin} size={10} />Center H
                </button>
                <button onClick={() => updateZone(selected.id, { y: Math.round(bgH / 2 - selected.h / 2) })} className="py-1.5 text-[11px] font-mono text-[#0F1F18]/60 border border-border rounded-lg hover:bg-cream flex items-center justify-center gap-1" title="Center V">
                  <Icon d={I.pin} size={10} />Center V
                </button>
                <button onClick={() => updateZone(selected.id, { x: 0, y: 0 })} className="py-1.5 text-[11px] font-mono text-[#0F1F18]/60 border border-border rounded-lg hover:bg-cream flex items-center justify-center gap-1" title="Reset pos">
                  <Icon d={I.back} size={10} />Reset
                </button>
              </div>
            </PropSection>

            <style>{`
              .prop-input { width:100%; height:32px; padding:0 10px; border:1px solid #E5E0D4; border-radius:8px; background:#FAF6EE; font-size:12.5px; font-family:'Inter',sans-serif; outline:none; }
              .prop-input:focus { background:white; outline:2px solid rgba(31,77,58,0.25); outline-offset:-1px; border-color:#1F4D3A; }
            `}</style>
          </aside>
        )}
      </div>

      {/* Add Variant Modal */}
      {showAddVariantModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-[#0F1F18]/40 backdrop-blur-sm" onClick={() => setShowAddVariantModal(false)} />
          <div className="relative bg-white rounded-2xl shadow-lift w-full max-w-[420px] mx-4 p-6">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="font-display font-bold text-[18px]">Add variant</h2>
                <p className="text-[12.5px] text-[#0F1F18]/50 mt-0.5">A new card type for this event (e.g. Speaker, Sponsor)</p>
              </div>
              <button onClick={() => setShowAddVariantModal(false)} className="h-8 w-8 rounded-lg hover:bg-cream grid place-items-center text-[#0F1F18]/50">
                <Icon d={I.close} size={15} />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-[12px] font-medium text-[#0F1F18]/70 mb-1.5">Variant name</label>
                <input
                  autoFocus
                  type="text"
                  placeholder="e.g. Speaker, Sponsor, Exhibitor"
                  value={newVariantName}
                  onChange={e => setNewVariantName(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleAddVariant()}
                  className="w-full h-10 px-3 rounded-xl border border-border text-[13.5px] outline-none focus:border-primary transition"
                />
              </div>
              <div>
                <label className="block text-[12px] font-medium text-[#0F1F18]/70 mb-1.5">Background design</label>
                <input ref={newVariantFileRef} type="file" accept="image/png,image/jpeg" className="hidden" onChange={e => setNewVariantFile(e.target.files?.[0] ?? null)} />
                <button
                  onClick={() => newVariantFileRef.current?.click()}
                  className={`w-full h-24 rounded-xl border-2 border-dashed flex flex-col items-center justify-center gap-2 transition ${newVariantFile ? 'border-primary/50 bg-primary/[0.04] text-primary' : 'border-border hover:border-primary/40 text-[#0F1F18]/40'}`}
                >
                  {newVariantFile ? (
                    <>
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
                      <span className="text-[12px] font-medium">{newVariantFile.name}</span>
                    </>
                  ) : (
                    <>
                      <Icon d={I.upload} size={20} sw={1.6} />
                      <span className="text-[12.5px]">Upload PNG or JPG</span>
                    </>
                  )}
                </button>
              </div>
            </div>
            <div className="flex gap-2 mt-6">
              <button onClick={() => setShowAddVariantModal(false)} className="flex-1 h-10 rounded-xl border border-border text-[13px] hover:bg-cream transition">Cancel</button>
              <button
                onClick={handleAddVariant}
                disabled={!newVariantName.trim() || !newVariantFile || addingVariant}
                className="flex-1 h-10 rounded-xl text-[13px] font-semibold text-white transition disabled:opacity-40 bg-primary"
              >
                {addingVariant ? 'Creating…' : 'Create variant'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function ZoneEl({ zone, selected, previewMode, onPointerDown, onHandle }: {
  zone: Zone; selected: boolean; previewMode: boolean;
  onPointerDown: (e: React.PointerEvent) => void;
  onHandle: (e: React.PointerEvent, dir: string) => void;
}) {
  if (zone.hidden) return null;
  const isPhoto = zone.type === 'photo';
  const radius = isPhoto ? (zone.shape === 'circle' ? '50%' : zone.shape === 'rounded' ? '20%' : '4px') : '6px';
  const dashColor = selected ? '#1F4D3A' : '#E8C57E';
  const opacityVal = (zone.opacity ?? 100) / 100;

  const inner = (() => {
    if (isPhoto) {
      return (
        <div className="absolute inset-0 grid place-items-center text-white" style={{ borderRadius: radius, background: 'rgba(255,255,255,0.05)', backdropFilter: 'blur(2px)' }}>
          <div className="font-display font-bold opacity-60" style={{ fontSize: Math.min(zone.w, zone.h) / 3 }}>{zone.sample ?? '+'}</div>
        </div>
      );
    }
    return (
      <>
        {zone.bgColor && (
          <div className="absolute inset-0" style={{
            borderRadius: 4,
            background: zone.bgColor,
            opacity: (zone.bgOpacity ?? 60) / 100,
          }} />
        )}
        <div className="absolute inset-0 flex items-center overflow-hidden" style={{ justifyContent: zone.align === 'center' ? 'center' : zone.align === 'right' ? 'flex-end' : 'flex-start' }}>
          <div style={{
            fontFamily: zone.font, fontWeight: zone.weight, fontSize: zone.size, color: zone.color,
            lineHeight: zone.lineHeight ?? 1.2,
            letterSpacing: zone.letterSpacing ? `${zone.letterSpacing}px` : undefined,
            whiteSpace: 'nowrap', textAlign: zone.align,
          }}>
            {zone.sample ?? zone.placeholder}
          </div>
        </div>
      </>
    );
  })();

  return (
    <div
      className="absolute"
      style={{
        left: zone.x, top: zone.y, width: zone.w, height: zone.h, borderRadius: radius,
        cursor: zone.locked ? 'not-allowed' : previewMode ? 'default' : 'grab',
        opacity: opacityVal,
        outline: selected && !previewMode ? `1.5px solid ${dashColor}` : undefined,
      }}
      onPointerDown={onPointerDown}
    >
      {!previewMode && (
        <div className="absolute inset-0 pointer-events-none" style={{
          borderRadius: radius,
          backgroundImage: `repeating-linear-gradient(90deg, ${dashColor} 0 8px, transparent 8px 14px), repeating-linear-gradient(180deg, ${dashColor} 0 8px, transparent 8px 14px), repeating-linear-gradient(0deg, ${dashColor} 0 8px, transparent 8px 14px), repeating-linear-gradient(270deg, ${dashColor} 0 8px, transparent 8px 14px)`,
          backgroundSize: '100% 2px, 2px 100%, 100% 2px, 2px 100%',
          backgroundPosition: '0 0, 0 0, 0 100%, 100% 0',
          backgroundRepeat: 'no-repeat',
          opacity: 0.95,
        }} />
      )}

      {inner}

      {!previewMode && (
        <span className="absolute pointer-events-auto font-mono text-[10px] px-1.5 py-px rounded text-white whitespace-nowrap" style={{ background: dashColor, top: -4, left: 0, transform: 'translateY(-100%)' }}>
          {zone.label}{zone.required && ' *'}
          {zone.locked && ' 🔒'}
        </span>
      )}

      {selected && !previewMode && (
        <>
          {(['nw', 'n', 'ne', 'e', 'se', 's', 'sw', 'w'] as const).map(dir => (
            <HandleEl key={dir} dir={dir} round={isPhoto && zone.shape === 'circle'} onPointerDown={e => onHandle(e, dir)} />
          ))}
          <span className="absolute font-mono text-[10px] text-white px-2 py-0.5 rounded whitespace-nowrap" style={{ background: '#1F4D3A', bottom: -28, left: '50%', transform: 'translateX(-50%)' }}>
            {zone.w} × {zone.h}
          </span>
        </>
      )}
    </div>
  );
}

const HANDLE_POSITIONS: Record<string, React.CSSProperties> = {
  nw: { top: -6, left: -6, cursor: 'nwse-resize' },
  n:  { top: -6, left: '50%', marginLeft: -5, cursor: 'ns-resize' },
  ne: { top: -6, right: -6, cursor: 'nesw-resize' },
  e:  { top: '50%', right: -6, marginTop: -5, cursor: 'ew-resize' },
  se: { bottom: -6, right: -6, cursor: 'nwse-resize' },
  s:  { bottom: -6, left: '50%', marginLeft: -5, cursor: 'ns-resize' },
  sw: { bottom: -6, left: -6, cursor: 'nesw-resize' },
  w:  { top: '50%', left: -6, marginTop: -5, cursor: 'ew-resize' },
};

function HandleEl({ dir, round, onPointerDown }: { dir: string; round: boolean; onPointerDown: (e: React.PointerEvent) => void }) {
  return (
    <span
      data-handle={dir}
      onPointerDown={onPointerDown}
      style={{ position: 'absolute', width: 10, height: 10, background: 'white', border: '1.5px solid #1F4D3A', borderRadius: round ? 999 : 2, ...HANDLE_POSITIONS[dir] }}
    />
  );
}

function PropSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="px-4 py-4 border-b border-border">
      <div className="text-[11px] font-mono tracking-widest text-[#0F1F18]/40 mb-3">{title.toUpperCase()}</div>
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
    <label className="flex items-center justify-between cursor-pointer">
      <span className="text-[12.5px]">{label}</span>
      <button type="button" onClick={() => onChange(!value)} className={`relative h-5 w-9 rounded-full transition ${value ? 'bg-primary' : 'bg-border'}`}>
        <span className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-all ${value ? 'left-[18px]' : 'left-0.5'}`} />
      </button>
    </label>
  );
}

function Segmented({ value, onChange, options }: { value: string; onChange: (v: string) => void; options: { v: string; label?: string; icon?: string }[] }) {
  return (
    <div className="flex p-0.5 bg-cream rounded-lg border border-border">
      {options.map(o => (
        <button
          key={o.v}
          onClick={() => onChange(o.v)}
          className={`flex-1 h-7 text-[11px] font-medium rounded-md grid place-items-center transition ${value === o.v ? 'bg-white shadow-sm text-[#0F1F18]' : 'text-[#0F1F18]/55 hover:text-[#0F1F18]'}`}
        >
          {o.icon ? <Icon d={o.icon} size={12} /> : o.label}
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
