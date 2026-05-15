'use client';

// RightSidebar — context-switching panel.
// Renders the correct panel based on editor state:
//   previewMode      → PreviewPanel
//   selectedIds > 1  → MultiSelectPanel
//   !selected        → EventPanel
//   selected zone    → ZonePanel (the detailed RightRail, still in CanvasEditor.tsx)
//
// The ZonePanel (RightRail) is NOT moved here to avoid a big prop-drilling chain —
// it's rendered by CanvasEditor.tsx directly. This component handles the OTHER panels.

import React from 'react';
import type { Zone } from '@/types/database';
import {
  Eye, MousePointer2, Upload, Image as ImageIcon,
  AlignStartHorizontal, AlignCenterHorizontal, AlignEndHorizontal,
  AlignStartVertical, AlignCenterVertical, AlignEndVertical,
  AlignHorizontalSpaceAround, AlignVerticalSpaceAround,
  Pencil,
} from 'lucide-react';

/* ── Event Panel ─────────────────────────────────────────── */
interface EventPanelProps {
  nameVal: string;
  setNameVal: (v: string) => void;
  editName: boolean;
  setEditName: (v: boolean) => void;
  saveName: () => Promise<void>;
  bgW: number;
  bgH: number;
  backgroundUrl: string;
  bgReplaceRef: React.RefObject<HTMLInputElement>;
  handleReplaceBackground: (e: React.ChangeEvent<HTMLInputElement>) => Promise<void>;
  zones: Zone[];
}

function EventPanel({
  nameVal, setNameVal, editName, setEditName, saveName,
  bgW, bgH, backgroundUrl, bgReplaceRef, handleReplaceBackground,
  zones,
}: EventPanelProps) {
  return (
    <aside className="w-[300px] shrink-0 bg-white border-l border-border flex flex-col overflow-y-auto">
      {/* Event section */}
      <div className="p-4 border-b border-border">
        <div className="text-[10px] font-mono text-muted tracking-widest mb-3 uppercase">Event</div>

        {/* Name */}
        <div className="mb-3">
          <div className="text-[10.5px] text-muted mb-1">Name</div>
          {editName ? (
            <input
              autoFocus
              value={nameVal}
              onChange={e => setNameVal(e.target.value)}
              onBlur={saveName}
              onKeyDown={e => e.key === 'Enter' && saveName()}
              className="w-full h-9 px-2.5 rounded-lg border border-primary/40 text-[13px] font-display font-semibold outline-none bg-white"
            />
          ) : (
            <button
              onClick={() => setEditName(true)}
              className="w-full text-left h-9 px-2.5 rounded-lg border border-border hover:border-primary/40 text-[13px] font-display font-semibold transition group flex items-center justify-between"
            >
              <span className="truncate">{nameVal}</span>
              <Pencil size={11} strokeWidth={1.8} className="text-muted opacity-0 group-hover:opacity-100 shrink-0 ml-1 transition" />
            </button>
          )}
        </div>

        {/* Canvas size */}
        <div className="mb-3">
          <div className="text-[10.5px] text-muted mb-1">Canvas</div>
          <div className="h-9 px-2.5 rounded-lg border border-border bg-cream flex items-center text-[12px] font-mono text-muted">
            {bgW} × {bgH} px
          </div>
        </div>

        {/* Background */}
        <div className="mb-3">
          <div className="text-[10.5px] text-muted mb-1">Background</div>
          <div className="relative rounded-xl overflow-hidden border border-border bg-cream" style={{ height: 90 }}>
            {backgroundUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={backgroundUrl} alt="Background" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-[11px] text-muted">
                <div className="flex flex-col items-center gap-1">
                  <ImageIcon size={16} strokeWidth={1.6} className="text-muted/60" />
                  <span>No background</span>
                </div>
              </div>
            )}
            <label className="absolute bottom-1.5 right-1.5 bg-white/90 border border-border rounded-lg px-2 py-0.5 text-[10.5px] font-medium cursor-pointer hover:bg-white transition flex items-center gap-1.5">
              <Upload size={10} strokeWidth={2} />Replace
              <input
                ref={bgReplaceRef}
                type="file"
                accept="image/png,image/jpeg,image/webp"
                className="hidden"
                onChange={handleReplaceBackground}
              />
            </label>
          </div>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-2 gap-2">
          <div className="flex flex-col items-center justify-center py-2.5 px-3 rounded-xl bg-cream border border-border">
            <span className="font-display font-bold text-[22px] text-ink leading-none tracking-tight">
              {zones.length}
            </span>
            <span className="text-[10px] font-mono text-muted mt-1 uppercase tracking-wide">
              Zones
            </span>
          </div>
          <div className="flex flex-col items-center justify-center py-2.5 px-3 rounded-xl bg-cream border border-border">
            <span className="font-display font-bold text-[22px] text-ink leading-none tracking-tight">
              {zones.filter(z => z.required).length}
            </span>
            <span className="text-[10px] font-mono text-muted mt-1 uppercase tracking-wide">
              Required
            </span>
          </div>
        </div>
      </div>

      {/* Shortcuts reference */}
      <div className="p-4">
        <div className="text-[10px] font-mono text-muted tracking-widest mb-3 uppercase">Shortcuts</div>
        <div className="space-y-1.5">
          {([
            ['Click', 'select zone'],
            ['Drag', 'reposition'],
            ['⌫', 'delete'],
            ['⌘D', 'duplicate'],
            ['⌘Z / ⇧⌘Z', 'undo / redo'],
            ['[ ]', 'layer order'],
            ['⌘P', 'preview'],
            ['⌘/', 'shortcuts'],
            ['G', 'toggle grid'],
            ['⎵ + drag', 'pan canvas'],
          ] as [string, string][]).map(([k, v]) => (
            <div key={k} className="flex justify-between text-[10.5px] font-mono">
              <span className="bg-cream border border-border px-1.5 py-0.5 rounded text-ink/70 text-[10px]">{k}</span>
              <span className="text-ink/40">{v}</span>
            </div>
          ))}
        </div>
      </div>
    </aside>
  );
}

/* ── Preview Panel ───────────────────────────────────────── */
function PreviewPanel() {
  return (
    <aside className="w-[300px] shrink-0 bg-white border-l border-border flex flex-col items-center justify-center p-8 text-center">
      <div className="h-12 w-12 rounded-2xl bg-cream grid place-items-center text-ink/40">
        <Eye size={18} strokeWidth={1.8} />
      </div>
      <div className="mt-3 font-display font-semibold text-[14px]">Preview mode</div>
      <p className="text-[12px] text-ink/50 mt-1">Zones are non-interactive.<br />Press <kbd className="bg-cream border border-border rounded px-1 py-0.5 font-mono text-[10px]">⌘P</kbd> to resume editing.</p>
    </aside>
  );
}

/* ── Multi-select Panel ──────────────────────────────────── */
interface MultiSelectPanelProps {
  selectedIds: string[];
  alignSelected: (axis: 'left' | 'centerH' | 'right' | 'top' | 'middleV' | 'bottom') => void;
  distributeSelected: (dir: 'h' | 'v') => void;
  removeSelected: () => void;
}

function MultiSelectPanel({ selectedIds, alignSelected, distributeSelected, removeSelected }: MultiSelectPanelProps) {
  return (
    <aside className="w-[300px] shrink-0 bg-white border-l border-border flex flex-col items-center justify-center p-8 text-center">
      <div className="h-12 w-12 rounded-2xl bg-cream grid place-items-center text-ink/40">
        <MousePointer2 size={18} strokeWidth={1.8} />
      </div>
      <div className="mt-3 font-display font-semibold text-[14px]">{selectedIds.length} selected</div>
      <p className="text-[12px] text-ink/50 mt-1">Select a single element to edit its properties.</p>

      <div className="mt-5 w-full text-left space-y-3">
        <div className="text-[10px] font-mono text-ink/40 tracking-widest mb-1 uppercase">Align</div>
        <div className="grid grid-cols-3 gap-1">
          {([
            { axis: 'left'    as const, title: 'Align left edges',   icon: <AlignStartHorizontal size={15} strokeWidth={1.8} />  },
            { axis: 'centerH' as const, title: 'Align centers (H)',  icon: <AlignCenterHorizontal size={15} strokeWidth={1.8} /> },
            { axis: 'right'   as const, title: 'Align right edges',  icon: <AlignEndHorizontal size={15} strokeWidth={1.8} />    },
            { axis: 'top'     as const, title: 'Align top edges',    icon: <AlignStartVertical size={15} strokeWidth={1.8} />    },
            { axis: 'middleV' as const, title: 'Align middles (V)',  icon: <AlignCenterVertical size={15} strokeWidth={1.8} />   },
            { axis: 'bottom'  as const, title: 'Align bottom edges', icon: <AlignEndVertical size={15} strokeWidth={1.8} />      },
          ] as { axis: 'left' | 'centerH' | 'right' | 'top' | 'middleV' | 'bottom'; title: string; icon: React.ReactNode }[]).map(({ axis, title, icon }) => (
            <button
              key={axis}
              title={title}
              onClick={() => alignSelected(axis)}
              className="h-9 rounded-xl border border-border flex items-center justify-center hover:bg-cream hover:border-primary/40 hover:text-primary text-ink/55 transition"
            >
              {icon}
            </button>
          ))}
        </div>

        {selectedIds.length >= 3 && (
          <>
            <div className="text-[10px] font-mono text-ink/40 tracking-widest mt-2 mb-1 uppercase">Distribute</div>
            <div className="grid grid-cols-2 gap-1">
              <button
                title="Distribute horizontally"
                onClick={() => distributeSelected('h')}
                className="h-9 rounded-xl border border-border flex items-center justify-center gap-1.5 text-[11px] hover:bg-cream hover:border-primary/40 hover:text-primary text-ink/55 transition"
              >
                <AlignHorizontalSpaceAround size={13} strokeWidth={1.8} />H
              </button>
              <button
                title="Distribute vertically"
                onClick={() => distributeSelected('v')}
                className="h-9 rounded-xl border border-border flex items-center justify-center gap-1.5 text-[11px] hover:bg-cream hover:border-primary/40 hover:text-primary text-ink/55 transition"
              >
                <AlignVerticalSpaceAround size={13} strokeWidth={1.8} />V
              </button>
            </div>
          </>
        )}

        <button
          onClick={removeSelected}
          className="w-full mt-2 text-[12px] text-rose-500 hover:text-rose-600 font-medium border border-rose-200 hover:bg-rose-50 px-4 py-1.5 rounded-lg transition"
        >
          Delete {selectedIds.length} elements
        </button>
      </div>
    </aside>
  );
}

/* ── Public export: composite right sidebar ──────────────── */
export type RightSidebarMode = 'preview' | 'multiselect' | 'event' | 'zone';

export interface RightSidebarProps {
  mode: RightSidebarMode;
  // EventPanel props
  nameVal: string;
  setNameVal: (v: string) => void;
  editName: boolean;
  setEditName: (v: boolean) => void;
  saveName: () => Promise<void>;
  bgW: number;
  bgH: number;
  backgroundUrl: string;
  bgReplaceRef: React.RefObject<HTMLInputElement>;
  handleReplaceBackground: (e: React.ChangeEvent<HTMLInputElement>) => Promise<void>;
  zones: Zone[];
  // MultiSelectPanel props
  selectedIds: string[];
  alignSelected: (axis: 'left' | 'centerH' | 'right' | 'top' | 'middleV' | 'bottom') => void;
  distributeSelected: (dir: 'h' | 'v') => void;
  removeSelected: () => void;
  // Zone panel is rendered by CanvasEditor directly when mode === 'zone'
  children?: React.ReactNode;
}

export default function RightSidebar({
  mode,
  nameVal, setNameVal, editName, setEditName, saveName,
  bgW, bgH, backgroundUrl, bgReplaceRef, handleReplaceBackground,
  zones,
  selectedIds, alignSelected, distributeSelected, removeSelected,
  children,
}: RightSidebarProps) {
  if (mode === 'preview') return <PreviewPanel />;
  if (mode === 'multiselect') return <MultiSelectPanel selectedIds={selectedIds} alignSelected={alignSelected} distributeSelected={distributeSelected} removeSelected={removeSelected} />;
  if (mode === 'zone') return <>{children}</>;
  return (
    <EventPanel
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
      zones={zones}
    />
  );
}
