'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import type { Zone } from '@/types/database';

const CW = 1080;
const CH = 1350;

type HistoryState = { past: Zone[][]; future: Zone[][] };

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
};

const COLORS = ['#FFFFFF', '#0F0F1A', '#6C63FF', '#F8A4D8', '#FFD28A', '#7BE0C0', '#FF6058'];
const FONTS = ['DM Sans', 'Inter', 'JetBrains Mono', 'Space Grotesk', 'Playfair Display'];

interface CanvasEditorProps {
  eventId: string;
  eventName: string;
  backgroundUrl: string;
  initialZones: Zone[];
}

export default function CanvasEditor({ eventId, eventName, backgroundUrl, initialZones }: CanvasEditorProps) {
  const router = useRouter();
  const [zones, setZones] = useState<Zone[]>(initialZones);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [zoom, setZoom] = useState(0.42);
  const [grid, setGrid] = useState(false);
  const [nameVal, setNameVal] = useState(eventName);
  const [editName, setEditName] = useState(false);
  const [savedAt, setSavedAt] = useState('just now');
  const [history, setHistory] = useState<HistoryState>({ past: [], future: [] });
  const [bgUrl, setBgUrl] = useState(backgroundUrl);
  const [uploading, setUploading] = useState(false);
  const stageRef = useRef<HTMLDivElement>(null);
  const bgInputRef = useRef<HTMLInputElement>(null);
  const autosaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const zonesRef = useRef(zones);
  zonesRef.current = zones;

  const handleBgUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const fd = new FormData();
    fd.append('file', file);
    const res = await fetch(`/api/events/${eventId}/background`, { method: 'POST', body: fd });
    const json = await res.json();
    if (res.ok) {
      setBgUrl(json.background_url);
    } else {
      alert(json.error ?? 'Upload failed');
    }
    setUploading(false);
    e.target.value = '';
  }, [eventId]);

  const selected = zones.find(z => z.id === selectedId) ?? null;

  // 800ms debounced autosave
  const scheduleSave = useCallback((nextZones: Zone[]) => {
    if (autosaveTimer.current) clearTimeout(autosaveTimer.current);
    autosaveTimer.current = setTimeout(async () => {
      await fetch(`/api/events/${eventId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ zones: nextZones }),
      });
      setSavedAt(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
    }, 800);
  }, [eventId]);

  const pushHistory = useCallback((nextZones: Zone[]) => {
    setHistory(h => ({ past: [...h.past.slice(-50), zonesRef.current], future: [] }));
    setZones(nextZones);
    scheduleSave(nextZones);
  }, [scheduleSave]);

  const updateZone = useCallback((id: string, patch: Partial<Zone>, withHistory = false) => {
    const next = zonesRef.current.map(z => z.id === id ? { ...z, ...patch } : z);
    if (withHistory) pushHistory(next);
    else { setZones(next); scheduleSave(next); }
  }, [pushHistory, scheduleSave]);

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

  const addZone = useCallback((type: 'text' | 'photo' | 'custom') => {
    const base = { id: 'z' + Math.random().toString(36).slice(2, 7), x: CW / 2 - 200, y: CH / 2 - 50, required: false };
    let z: Zone;
    if (type === 'text') {
      z = { ...base, type: 'text', label: 'New text field', w: 400, h: 80, font: 'DM Sans', weight: 600, size: 48, color: '#FFFFFF', align: 'left', placeholder: 'Placeholder', sample: 'Sample text' };
    } else if (type === 'photo') {
      z = { ...base, type: 'photo', label: 'Photo', w: 240, h: 240, shape: 'circle', placeholder: 'Tap to add a photo', sample: '·' };
    } else {
      z = { ...base, type: 'custom', label: 'Custom field', w: 400, h: 60, font: 'Inter', weight: 500, size: 24, color: '#FFFFFF', align: 'left', placeholder: 'Select option', sample: 'Speaker', options: ['Speaker', 'Sponsor', 'Delegate'] };
    }
    pushHistory([...zonesRef.current, z]);
    setSelectedId(z.id);
  }, [pushHistory]);

  const undo = useCallback(() => {
    setHistory(h => {
      if (!h.past.length) return h;
      const prev = h.past[h.past.length - 1];
      setZones(prev);
      scheduleSave(prev);
      return { past: h.past.slice(0, -1), future: [zonesRef.current, ...h.future] };
    });
  }, [scheduleSave]);

  const redo = useCallback(() => {
    setHistory(h => {
      if (!h.future.length) return h;
      const next = h.future[0];
      setZones(next);
      scheduleSave(next);
      return { past: [...h.past, zonesRef.current], future: h.future.slice(1) };
    });
  }, [scheduleSave]);

  // Drag/resize
  const interaction = useRef<{ mode: 'move' | 'resize'; dir?: string; id: string; sx: number; sy: number; ox: number; oy: number; ow: number; oh: number } | null>(null);

  const onZonePointerDown = useCallback((e: React.PointerEvent, zone: Zone) => {
    e.stopPropagation();
    setSelectedId(zone.id);
    interaction.current = { mode: 'move', id: zone.id, sx: e.clientX, sy: e.clientY, ox: zone.x, oy: zone.y, ow: zone.w, oh: zone.h };
    document.body.classList.add('cursor-grabbing', 'select-none');
  }, []);

  const onHandlePointerDown = useCallback((e: React.PointerEvent, zone: Zone, dir: string) => {
    e.stopPropagation();
    setSelectedId(zone.id);
    interaction.current = { mode: 'resize', dir, id: zone.id, sx: e.clientX, sy: e.clientY, ox: zone.x, oy: zone.y, ow: zone.w, oh: zone.h };
    document.body.classList.add('select-none');
  }, []);

  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      const it = interaction.current;
      if (!it) return;
      const dx = (e.clientX - it.sx) / zoom;
      const dy = (e.clientY - it.sy) / zoom;
      if (it.mode === 'move') {
        const nx = Math.max(0, Math.min(CW - it.ow, it.ox + dx));
        const ny = Math.max(0, Math.min(CH - it.oh, it.oy + dy));
        updateZone(it.id, { x: Math.round(nx), y: Math.round(ny) });
      } else if (it.mode === 'resize' && it.dir) {
        const d = it.dir;
        let nx = it.ox, ny = it.oy, nw = it.ow, nh = it.oh;
        if (d.includes('e')) nw = Math.max(40, it.ow + dx);
        if (d.includes('s')) nh = Math.max(20, it.oh + dy);
        if (d.includes('w')) { nw = Math.max(40, it.ow - dx); nx = it.ox + (it.ow - nw); }
        if (d.includes('n')) { nh = Math.max(20, it.oh - dy); ny = it.oy + (it.oh - nh); }
        nx = Math.max(0, nx); ny = Math.max(0, ny);
        nw = Math.min(nw, CW - nx); nh = Math.min(nh, CH - ny);
        updateZone(it.id, { x: Math.round(nx), y: Math.round(ny), w: Math.round(nw), h: Math.round(nh) });
      }
    };
    const onUp = () => {
      if (interaction.current) {
        const z = zonesRef.current.find(z => z.id === interaction.current!.id);
        if (z) setHistory(h => ({ past: [...h.past.slice(-50), zonesRef.current], future: [] }));
      }
      interaction.current = null;
      document.body.classList.remove('cursor-grabbing', 'select-none');
    };
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    return () => { window.removeEventListener('pointermove', onMove); window.removeEventListener('pointerup', onUp); };
  }, [zoom, updateZone]);

  // Keyboard shortcuts
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
      } else if (selected) {
        const step = e.shiftKey ? 10 : 1;
        if (e.key === 'ArrowLeft') { e.preventDefault(); updateZone(selected.id, { x: Math.max(0, selected.x - step) }, true); }
        if (e.key === 'ArrowRight') { e.preventDefault(); updateZone(selected.id, { x: Math.min(CW - selected.w, selected.x + step) }, true); }
        if (e.key === 'ArrowUp') { e.preventDefault(); updateZone(selected.id, { y: Math.max(0, selected.y - step) }, true); }
        if (e.key === 'ArrowDown') { e.preventDefault(); updateZone(selected.id, { y: Math.min(CH - selected.h, selected.y + step) }, true); }
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [selected, selectedId, undo, redo, removeZone, duplicateZone, updateZone]);

  // Fit zoom to viewport on mount
  useEffect(() => {
    const fit = () => {
      const el = stageRef.current;
      if (!el) return;
      const pad = 80;
      const z = Math.min((el.clientWidth - pad) / CW, (el.clientHeight - pad) / CH);
      setZoom(Math.max(0.18, Math.min(1.4, z)));
    };
    fit();
    window.addEventListener('resize', fit);
    return () => window.removeEventListener('resize', fit);
  }, []);

  const handlePublish = async () => {
    await fetch(`/api/events/${eventId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ zones }),
    });
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

  return (
    <div className="flex flex-col" style={{ height: '100vh', overflow: 'hidden', background: '#fafafa' }}>
      {/* Top Bar */}
      <header className="h-14 bg-white border-b border-[#e5e5ea] flex items-center px-4 gap-3 shrink-0 z-10">
        <a href="/dashboard" className="h-8 w-8 rounded-lg hover:bg-[#fafafa] grid place-items-center text-[#0f0f1a]/70" title="Back to events">
          <Icon d={I.back} size={16} />
        </a>
        <div className="h-6 w-px bg-[#e5e5ea]" />
        <a href="/dashboard" className="flex items-center gap-2 shrink-0">
          <span className="h-7 w-7 rounded-lg grid place-items-center text-white font-display font-bold text-[13px]" style={{ background: 'linear-gradient(135deg,#6c63ff,#f8a4d8)' }}>C</span>
        </a>
        <div className="flex items-center gap-1.5 text-[13px]">
          <span className="text-[#0f0f1a]/40 font-mono text-[11px]">Events</span>
          <span className="text-[#0f0f1a]/30">/</span>
          {editName
            ? <input autoFocus value={nameVal} onChange={e => setNameVal(e.target.value)} onBlur={saveName} onKeyDown={e => e.key === 'Enter' && saveName()} className="font-display font-semibold bg-white border border-[#6c63ff]/40 rounded-md px-2 py-0.5 outline-none w-[260px]" />
            : <button onClick={() => setEditName(true)} className="font-display font-semibold hover:bg-[#fafafa] rounded-md px-2 py-0.5">{nameVal}</button>
          }
        </div>

        <div className="flex-1" />

        <div className="flex items-center gap-1">
          <button title="Undo (⌘Z)" disabled={!history.past.length} onClick={undo} className={`h-8 w-8 rounded-lg grid place-items-center ${history.past.length ? 'text-[#0f0f1a]/80 hover:bg-[#fafafa]' : 'text-[#0f0f1a]/25'}`}>
            <Icon d={I.undo} size={15} />
          </button>
          <button title="Redo (⇧⌘Z)" disabled={!history.future.length} onClick={redo} className={`h-8 w-8 rounded-lg grid place-items-center ${history.future.length ? 'text-[#0f0f1a]/80 hover:bg-[#fafafa]' : 'text-[#0f0f1a]/25'}`}>
            <Icon d={I.redo} size={15} />
          </button>
        </div>

        <div className="flex items-center gap-1.5 text-[12px] text-[#0f0f1a]/55 mx-2">
          <Icon d={I.save} size={13} sw={2} />
          Saved · {savedAt}
        </div>

        <div className="flex items-center gap-2">
          <a
            href={`/events/${eventId}`}
            className="inline-flex items-center gap-1.5 text-[13px] text-[#0f0f1a]/80 bg-white border border-[#e5e5ea] px-3 py-1.5 rounded-lg hover:bg-[#fafafa] transition"
          >
            <Icon d={I.play} size={13} sw={2.2} />
            Preview
          </a>
          <button
            onClick={handlePublish}
            className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-white px-3.5 py-1.5 rounded-lg hover:opacity-95 transition shadow-soft"
            style={{ background: 'linear-gradient(135deg,#6c63ff,#f8a4d8)' }}
          >
            <Icon d={I.globe} size={13} sw={2.2} />
            Publish
          </button>
        </div>
      </header>

      <div className="flex-1 flex min-h-0">
        {/* Left Rail */}
        <aside className="w-[256px] shrink-0 bg-white border-r border-[#e5e5ea] flex flex-col overflow-y-auto">
          <div className="p-4">
            <div className="text-[11px] font-mono tracking-widest text-[#0f0f1a]/40 mb-3">ADD TO CANVAS</div>
            <div className="space-y-1.5">
              {[
                { type: 'text' as const, label: 'Text field', sub: 'Name, title, country…', icon: I.text },
                { type: 'photo' as const, label: 'Photo zone', sub: 'Headshot or logo', icon: I.photo },
                { type: 'custom' as const, label: 'Custom field', sub: 'Dropdown, badge, role…', icon: I.field },
              ].map(item => (
                <button
                  key={item.type}
                  onClick={() => addZone(item.type)}
                  className="group w-full flex items-center gap-3 p-2.5 rounded-xl hover:bg-[#fafafa] border border-transparent hover:border-[#e5e5ea] transition text-left"
                >
                  <span className="h-9 w-9 rounded-lg bg-[#fafafa] grid place-items-center text-[#6c63ff] group-hover:text-white transition" style={undefined}>
                    <svg className="group-hover:[background:linear-gradient(135deg,#6c63ff,#f8a4d8)] rounded-lg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" dangerouslySetInnerHTML={{ __html: item.icon }} />
                  </span>
                  <span className="flex-1 min-w-0">
                    <span className="block text-[13px] font-medium">{item.label}</span>
                    <span className="block text-[11px] text-[#0f0f1a]/50">{item.sub}</span>
                  </span>
                  <Icon d={I.plus} size={13} sw={2} />
                </button>
              ))}
            </div>
          </div>

          <div className="px-4">
            <div className="text-[11px] font-mono tracking-widest text-[#0f0f1a]/40 mb-2 flex items-center justify-between">
              ZONES <span className="text-[#0f0f1a]/40 normal-case">{zones.length}</span>
            </div>
            <div className="space-y-0.5">
              {zones.map(z => (
                <div
                  key={z.id}
                  onClick={() => setSelectedId(z.id)}
                  className={`group flex items-center gap-2 px-2 py-1.5 rounded-lg cursor-pointer text-[12.5px] ${z.id === selectedId ? 'bg-[#6c63ff]/10 text-[#6c63ff]' : 'hover:bg-[#fafafa] text-[#0f0f1a]/80'}`}
                >
                  <span className={`h-6 w-6 rounded-md grid place-items-center ${z.id === selectedId ? 'text-[#6c63ff]' : 'text-[#0f0f1a]/50'}`}>
                    <Icon d={z.type === 'photo' ? I.photo : z.type === 'custom' ? I.field : I.text} size={12} />
                  </span>
                  <span className="flex-1 truncate">{z.label}</span>
                  {z.required && <span className="text-[9px] font-mono px-1 py-px rounded bg-[#6c63ff]/10 text-[#6c63ff]">REQ</span>}
                  <button
                    onClick={e => { e.stopPropagation(); updateZone(z.id, { hidden: !z.hidden }); }}
                    className="opacity-0 group-hover:opacity-100 h-6 w-6 rounded-md grid place-items-center text-[#0f0f1a]/50 hover:bg-white"
                    title={z.hidden ? 'Show' : 'Hide'}
                  >
                    <Icon d={z.hidden ? I.eyeOff : I.eye} size={12} />
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-auto p-3 border-t border-[#e5e5ea]">
            <div className="text-[11px] font-mono tracking-widest text-[#0f0f1a]/40 mb-2">BACKGROUND</div>
            <div className="flex items-center gap-3 rounded-xl border border-[#e5e5ea] p-2.5">
              <div className="h-9 w-9 rounded-md shrink-0 bg-cover bg-center" style={{ backgroundImage: `url(${bgUrl})` }} />
              <div className="flex-1 min-w-0">
                <div className="text-[12px] font-medium truncate">Design background</div>
                <div className="text-[10px] font-mono text-[#0f0f1a]/45">{CW} × {CH}</div>
              </div>
              <button
                onClick={() => bgInputRef.current?.click()}
                disabled={uploading}
                title="Replace background"
                className="h-7 w-7 rounded-md grid place-items-center text-[#0f0f1a]/50 hover:bg-[#fafafa] hover:text-[#6c63ff] disabled:opacity-40 transition shrink-0"
              >
                {uploading
                  ? <svg className="animate-spin" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12a9 9 0 1 1-6.22-8.56"/></svg>
                  : <Icon d={I.upload} size={14} />}
              </button>
            </div>
            <input
              ref={bgInputRef}
              type="file"
              accept="image/png,image/jpeg"
              className="hidden"
              onChange={handleBgUpload}
            />
          </div>
        </aside>

        {/* Stage */}
        <div
          ref={stageRef}
          className="flex-1 relative overflow-hidden"
          style={{ backgroundColor: '#f4f4f7', backgroundImage: 'radial-gradient(#d4d4dc 1px, transparent 1px)', backgroundSize: '16px 16px' }}
          onPointerDown={() => setSelectedId(null)}
        >
          <div className="absolute inset-0 flex items-center justify-center">
            <div
              className="relative shadow-lift rounded-md"
              style={{ width: CW, height: CH, transform: `scale(${zoom})`, transformOrigin: 'center center' }}
              onPointerDown={e => e.stopPropagation()}
            >
              {/* Background image */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={bgUrl} alt="" className="absolute inset-0 w-full h-full object-cover rounded-md" draggable={false} />

              {/* Grid overlay */}
              {grid && (
                <div className="absolute inset-0 pointer-events-none" style={{
                  backgroundImage: 'linear-gradient(to right, rgba(108,99,255,0.10) 1px, transparent 1px), linear-gradient(to bottom, rgba(108,99,255,0.10) 1px, transparent 1px)',
                  backgroundSize: '60px 60px',
                }} />
              )}

              {/* Zones */}
              {zones.map(z => (
                <ZoneEl
                  key={z.id}
                  zone={z}
                  selected={z.id === selectedId}
                  onPointerDown={e => { if (!z.locked) onZonePointerDown(e, z); }}
                  onHandle={(e, dir) => onHandlePointerDown(e, z, dir)}
                />
              ))}

              {/* Canvas frame label */}
              <div className="absolute -top-7 left-0 right-0 flex items-center justify-between text-[11px] font-mono text-[#0f0f1a]/45">
                <span>{CW} × {CH} px</span>
                <span>{zones.length} zones · {zones.filter(z => z.required).length} required</span>
              </div>
              {/* Corner marks */}
              <span className="absolute -top-1 -left-1 h-3 w-3 border-t border-l border-[#6c63ff]/50" />
              <span className="absolute -top-1 -right-1 h-3 w-3 border-t border-r border-[#6c63ff]/50" />
              <span className="absolute -bottom-1 -left-1 h-3 w-3 border-b border-l border-[#6c63ff]/50" />
              <span className="absolute -bottom-1 -right-1 h-3 w-3 border-b border-r border-[#6c63ff]/50" />
            </div>
          </div>

          {/* Bottom bar */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-1 bg-white rounded-xl border border-[#e5e5ea] shadow-soft p-1">
            <button onClick={() => setZoom(z => Math.max(0.1, z - 0.1))} className="h-8 w-8 rounded-lg hover:bg-[#fafafa] grid place-items-center text-[#0f0f1a]/70" title="Zoom out">
              <Icon d={I.zoom_out} size={14} />
            </button>
            <button onClick={() => setZoom(1)} className="font-mono text-[12px] px-2 min-w-[64px] text-center hover:bg-[#fafafa] rounded-lg py-1.5">
              {Math.round(zoom * 100)}%
            </button>
            <button onClick={() => setZoom(z => Math.min(2, z + 0.1))} className="h-8 w-8 rounded-lg hover:bg-[#fafafa] grid place-items-center text-[#0f0f1a]/70" title="Zoom in">
              <Icon d={I.zoom_in} size={14} />
            </button>
            <span className="h-5 w-px bg-[#e5e5ea] mx-1" />
            <button
              onClick={() => setGrid(g => !g)}
              className={`h-8 px-2.5 rounded-lg flex items-center gap-1.5 text-[12px] ${grid ? 'bg-[#6c63ff]/10 text-[#6c63ff]' : 'hover:bg-[#fafafa] text-[#0f0f1a]/70'}`}
              title="Toggle grid"
            >
              <Icon d={I.grid} size={13} />
              Grid
            </button>
            <button onClick={() => { const el = stageRef.current; if (!el) return; const pad = 80; setZoom(Math.max(0.18, Math.min(1.4, Math.min((el.clientWidth - pad) / CW, (el.clientHeight - pad) / CH)))); }} className="h-8 px-2.5 rounded-lg hover:bg-[#fafafa] text-[12px] text-[#0f0f1a]/70">
              Fit
            </button>
          </div>
        </div>

        {/* Right Rail */}
        {!selected ? (
          <aside className="w-[300px] shrink-0 bg-white border-l border-[#e5e5ea] flex flex-col items-center justify-center p-8 text-center">
            <div className="h-12 w-12 rounded-2xl bg-[#fafafa] grid place-items-center text-[#0f0f1a]/40">
              <Icon d={I.cursor} size={18} />
            </div>
            <div className="mt-4 font-display font-medium text-[14px]">Nothing selected</div>
            <p className="text-[12.5px] text-[#0f0f1a]/55 mt-1 max-w-[200px]">Pick a zone on the canvas, or add a new field from the left panel.</p>
            <div className="mt-6 grid grid-cols-2 gap-1.5 text-[10px] font-mono text-[#0f0f1a]/50">
              <span>Click</span><span>select zone</span>
              <span>Drag</span><span>reposition</span>
              <span>⌫</span><span>delete zone</span>
              <span>⌘D</span><span>duplicate</span>
            </div>
          </aside>
        ) : (
          <aside className="w-[300px] shrink-0 bg-white border-l border-[#e5e5ea] flex flex-col overflow-y-auto">
            {/* Header */}
            <div className="p-4 border-b border-[#e5e5ea] flex items-center gap-2">
              <span className="h-7 w-7 rounded-md grid place-items-center text-white" style={{ background: 'linear-gradient(135deg,#6c63ff,#f8a4d8)' }}>
                <Icon d={selected.type === 'photo' ? I.photo : selected.type === 'custom' ? I.field : I.text} size={13} />
              </span>
              <div className="flex-1 min-w-0">
                <div className="text-[11px] font-mono text-[#0f0f1a]/50 uppercase tracking-widest">{selected.type} zone</div>
                <div className="text-[13px] font-display font-semibold truncate">{selected.label}</div>
              </div>
              <button onClick={() => duplicateZone(selected.id)} title="Duplicate (⌘D)" className="h-7 w-7 rounded-md hover:bg-[#fafafa] grid place-items-center text-[#0f0f1a]/60">
                <Icon d={I.duplicate} size={13} />
              </button>
              <button onClick={() => removeZone(selected.id)} title="Delete (⌫)" className="h-7 w-7 rounded-md hover:bg-rose-50 grid place-items-center text-rose-500">
                <Icon d={I.trash} size={13} />
              </button>
            </div>

            {/* Field section */}
            <PropSection title="Field">
              <PropRow label="Label">
                <input value={selected.label} onChange={e => updateZone(selected.id, { label: e.target.value })} className="prop-input" />
              </PropRow>
              <PropRow label="Placeholder">
                <input value={selected.placeholder ?? ''} onChange={e => updateZone(selected.id, { placeholder: e.target.value })} className="prop-input" placeholder="Shown in the form" />
              </PropRow>
              <PropRow label="Sample">
                <input value={selected.sample ?? ''} onChange={e => updateZone(selected.id, { sample: e.target.value })} className="prop-input" placeholder="Live preview value" />
              </PropRow>
              <PropToggle label="Required" value={!!selected.required} onChange={v => updateZone(selected.id, { required: v })} />
            </PropSection>

            {/* Style section */}
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
                    options={[{ v: '400', label: 'Reg' }, { v: '500', label: 'Med' }, { v: '600', label: 'SBd' }, { v: '700', label: 'Bld' }]}
                  />
                </PropRow>
                <PropRow label={`Size · ${selected.size ?? 32}px`}>
                  <input type="range" min="12" max="160" value={selected.size ?? 32} onChange={e => updateZone(selected.id, { size: Number(e.target.value) })} className="w-full" style={{ WebkitAppearance: 'none', height: 4, background: '#e5e5ea', borderRadius: 999 }} />
                </PropRow>
                <PropRow label="Color">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <input type="color" value={selected.color ?? '#FFFFFF'} onChange={e => updateZone(selected.id, { color: e.target.value })} className="h-7 w-7 rounded border border-[#e5e5ea] cursor-pointer bg-white" />
                    <input value={selected.color ?? '#FFFFFF'} onChange={e => updateZone(selected.id, { color: e.target.value })} className="prop-input flex-1 font-mono text-[11px] uppercase" style={{ minWidth: 80 }} />
                    <div className="flex gap-1">
                      {COLORS.map(s => (
                        <button key={s} onClick={() => updateZone(selected.id, { color: s })} className={`h-5 w-5 rounded border ${(selected.color ?? '').toUpperCase() === s ? 'border-[#6c63ff] ring-2 ring-[#6c63ff]/30' : 'border-[#e5e5ea]'}`} style={{ background: s }} />
                      ))}
                    </div>
                  </div>
                </PropRow>
                <PropRow label="Align">
                  <Segmented
                    value={selected.align ?? 'left'}
                    onChange={v => updateZone(selected.id, { align: v as Zone['align'] })}
                    options={[{ v: 'left', icon: I.align_l }, { v: 'center', icon: I.align_c }, { v: 'right', icon: I.align_r }]}
                  />
                </PropRow>
              </PropSection>
            )}

            {/* Position section */}
            <PropSection title="Position & size">
              <div className="grid grid-cols-2 gap-2">
                <NumberProp label="X" value={selected.x} onChange={v => updateZone(selected.id, { x: v })} />
                <NumberProp label="Y" value={selected.y} onChange={v => updateZone(selected.id, { y: v })} />
                <NumberProp label="W" value={selected.w} onChange={v => updateZone(selected.id, { w: v })} />
                <NumberProp label="H" value={selected.h} onChange={v => updateZone(selected.id, { h: v })} />
              </div>
              <button
                onClick={() => updateZone(selected.id, { x: Math.round(CW / 2 - selected.w / 2) })}
                className="mt-3 w-full text-[12px] text-[#0f0f1a]/60 border border-[#e5e5ea] rounded-lg py-1.5 hover:bg-[#fafafa] flex items-center justify-center gap-1.5"
              >
                <Icon d={I.pin} size={11} />
                Snap to center horizontally
              </button>
            </PropSection>

            <style>{`
              .prop-input { width:100%; height:32px; padding:0 10px; border:1px solid #e5e5ea; border-radius:8px; background:#fafafa; font-size:12.5px; font-family:'Inter',sans-serif; outline:none; }
              .prop-input:focus { background:white; outline:2px solid rgba(108,99,255,0.25); outline-offset:-1px; border-color:#6c63ff; }
            `}</style>
          </aside>
        )}
      </div>
    </div>
  );
}

function ZoneEl({ zone, selected, onPointerDown, onHandle }: { zone: Zone; selected: boolean; onPointerDown: (e: React.PointerEvent) => void; onHandle: (e: React.PointerEvent, dir: string) => void; }) {
  if (zone.hidden) return null;
  const isPhoto = zone.type === 'photo';
  const radius = isPhoto ? (zone.shape === 'circle' ? '50%' : zone.shape === 'rounded' ? '20%' : '4px') : '6px';
  const dashColor = selected ? '#6c63ff' : '#f8a4d8';

  const inner = (() => {
    if (isPhoto) {
      return (
        <div className="absolute inset-0 grid place-items-center text-white" style={{ borderRadius: radius, background: 'rgba(255,255,255,0.05)', backdropFilter: 'blur(2px)' }}>
          <div className="font-display font-bold opacity-60" style={{ fontSize: Math.min(zone.w, zone.h) / 3 }}>{zone.sample ?? '+'}</div>
        </div>
      );
    }
    return (
      <div className="absolute inset-0 flex items-center overflow-hidden" style={{ justifyContent: zone.align === 'center' ? 'center' : zone.align === 'right' ? 'flex-end' : 'flex-start' }}>
        <div style={{ fontFamily: zone.font, fontWeight: zone.weight, fontSize: zone.size, color: zone.color, lineHeight: 1, whiteSpace: 'nowrap', textAlign: zone.align }}>
          {zone.sample ?? zone.placeholder}
        </div>
      </div>
    );
  })();

  return (
    <div
      className="absolute"
      style={{ left: zone.x, top: zone.y, width: zone.w, height: zone.h, borderRadius: radius, cursor: zone.locked ? 'not-allowed' : 'grab', outline: selected ? `1.5px solid ${dashColor}` : undefined }}
      onPointerDown={onPointerDown}
    >
      {/* Dashed border */}
      <div className="absolute inset-0 pointer-events-none" style={{
        borderRadius: radius,
        backgroundImage: `repeating-linear-gradient(90deg, ${dashColor} 0 8px, transparent 8px 14px), repeating-linear-gradient(180deg, ${dashColor} 0 8px, transparent 8px 14px), repeating-linear-gradient(0deg, ${dashColor} 0 8px, transparent 8px 14px), repeating-linear-gradient(270deg, ${dashColor} 0 8px, transparent 8px 14px)`,
        backgroundSize: '100% 2px, 2px 100%, 100% 2px, 2px 100%',
        backgroundPosition: '0 0, 0 0, 0 100%, 100% 0',
        backgroundRepeat: 'no-repeat',
        opacity: 0.95,
      }} />

      {inner}

      {/* Label */}
      <span className="absolute pointer-events-auto font-mono text-[10px] px-1.5 py-px rounded text-white whitespace-nowrap" style={{ background: dashColor, top: -4, left: 0, transform: 'translateY(-100%)' }}>
        {zone.label}{zone.required && ' *'}
      </span>

      {/* Handles when selected */}
      {selected && (
        <>
          {(['nw', 'n', 'ne', 'e', 'se', 's', 'sw', 'w'] as const).map(dir => (
            <HandleEl key={dir} dir={dir} round={isPhoto && zone.shape === 'circle'} onPointerDown={e => onHandle(e, dir)} />
          ))}
          <span className="absolute font-mono text-[10px] text-white px-2 py-0.5 rounded whitespace-nowrap" style={{ background: '#6c63ff', bottom: -28, left: '50%', transform: 'translateX(-50%)' }}>
            {zone.w} × {zone.h}
          </span>
        </>
      )}
    </div>
  );
}

const HANDLE_POSITIONS: Record<string, React.CSSProperties> = {
  nw: { top: -6, left: -6, cursor: 'nwse-resize' },
  n: { top: -6, left: '50%', marginLeft: -5, cursor: 'ns-resize' },
  ne: { top: -6, right: -6, cursor: 'nesw-resize' },
  e: { top: '50%', right: -6, marginTop: -5, cursor: 'ew-resize' },
  se: { bottom: -6, right: -6, cursor: 'nwse-resize' },
  s: { bottom: -6, left: '50%', marginLeft: -5, cursor: 'ns-resize' },
  sw: { bottom: -6, left: -6, cursor: 'nesw-resize' },
  w: { top: '50%', left: -6, marginTop: -5, cursor: 'ew-resize' },
};

function HandleEl({ dir, round, onPointerDown }: { dir: string; round: boolean; onPointerDown: (e: React.PointerEvent) => void }) {
  return (
    <span
      data-handle={dir}
      onPointerDown={onPointerDown}
      style={{
        position: 'absolute',
        width: 10,
        height: 10,
        background: 'white',
        border: '1.5px solid #6c63ff',
        borderRadius: round ? 999 : 2,
        ...HANDLE_POSITIONS[dir],
      }}
    />
  );
}

function PropSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="px-4 py-4 border-b border-[#e5e5ea]">
      <div className="text-[11px] font-mono tracking-widest text-[#0f0f1a]/40 mb-3">{title.toUpperCase()}</div>
      <div className="space-y-3">{children}</div>
    </div>
  );
}

function PropRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <div className="text-[11px] text-[#0f0f1a]/55 mb-1">{label}</div>
      {children}
    </label>
  );
}

function PropToggle({ label, value, onChange }: { label: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex items-center justify-between cursor-pointer">
      <span className="text-[12.5px]">{label}</span>
      <button type="button" onClick={() => onChange(!value)} className={`relative h-5 w-9 rounded-full transition ${value ? '' : 'bg-[#e5e5ea]'}`} style={value ? { background: 'linear-gradient(135deg,#6c63ff,#f8a4d8)' } : {}}>
        <span className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-all ${value ? 'left-[18px]' : 'left-0.5'}`} />
      </button>
    </label>
  );
}

function Segmented({ value, onChange, options }: { value: string; onChange: (v: string) => void; options: { v: string; label?: string; icon?: string }[] }) {
  return (
    <div className="flex p-0.5 bg-[#fafafa] rounded-lg border border-[#e5e5ea]">
      {options.map(o => (
        <button
          key={o.v}
          onClick={() => onChange(o.v)}
          className={`flex-1 h-7 text-[11px] font-medium rounded-md grid place-items-center transition ${value === o.v ? 'bg-white shadow-sm text-[#0f0f1a]' : 'text-[#0f0f1a]/55 hover:text-[#0f0f1a]'}`}
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
      <div className="text-[10px] font-mono uppercase tracking-widest text-[#0f0f1a]/40 mb-1">{label}</div>
      <input type="number" value={value} onChange={e => onChange(Number(e.target.value))} className="prop-input font-mono text-[12px]" />
    </label>
  );
}
