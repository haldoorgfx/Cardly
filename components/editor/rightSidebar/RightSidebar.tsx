'use client';

// RightSidebar — context-switching panel matching editor-shared.jsx / D2.1–D2.3 design.
//
// Modes:
//   preview     → PreviewPanel
//   multiselect → MultiSelectPanel
//   zone        → children (RightRail from CanvasEditor) + LayersPanel + ShortcutsBlock
//   event       → EventPanel + LayersPanel + ShortcutsBlock
//
// Layers and Shortcuts are ALWAYS rendered in this sidebar (below the top panel).

import React from 'react';
import type { Zone } from '@/types/database';
import {
  Eye, EyeOff, Lock, LockOpen, MousePointer2,
  Type, Camera, ToggleLeft, Tag, ImagePlus, Square,
  AlignStartHorizontal, AlignCenterHorizontal, AlignEndHorizontal,
  AlignStartVertical, AlignCenterVertical, AlignEndVertical,
  AlignHorizontalSpaceAround, AlignVerticalSpaceAround,
  Pencil, Upload, Image as ImageIcon,
  ChevronDown, ChevronUp,
} from 'lucide-react';

/* ── Design tokens (matching editor-shared.jsx) ──────────────────── */
const T = {
  cream:       '#FAF6EE',
  surface:     '#FFFFFF',
  border:      '#E5E0D4',
  borderStrong:'#C9C3B1',
  primary:     '#1F4D3A',
  primarySoft: '#E8EFEB',
  ink:         '#0F1F18',
  inkSoft:     '#3A4A42',
  muted:       '#6B7A72',
  danger:      '#B8423C',
  warning:     '#C97A2D',
  success:     '#2D7A4F',
};

/* ── PanelCard ───────────────────────────────────────────────────── */
function PanelCard({
  label, children, trailing,
}: { label: string; children: React.ReactNode; trailing?: React.ReactNode }) {
  return (
    <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 6, padding: '10px 12px' }}>
      <div className="flex items-center justify-between mb-2">
        <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10, color: T.muted, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
          {label}
        </div>
        {trailing}
      </div>
      {children}
    </div>
  );
}

/* ── Section label ───────────────────────────────────────────────── */
function SectionLabel({ children, count }: { children: React.ReactNode; count?: number }) {
  return (
    <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10, color: T.muted, letterSpacing: '0.1em', textTransform: 'uppercase' }} className="flex items-center gap-1.5">
      <span>{children}</span>
      {count !== undefined && <span style={{ opacity: 0.7 }}>· {count}</span>}
    </div>
  );
}

/* ── Shortcut row ────────────────────────────────────────────────── */
function ShortcutRow({ keys, label }: { keys: string[]; label: string }) {
  return (
    <div className="flex items-center justify-between py-1" style={{ fontFamily: 'Inter, sans-serif', fontSize: 12, color: T.inkSoft }}>
      <span>{label}</span>
      <div className="flex items-center gap-1">
        {keys.map((k, i) => (
          <kbd key={i} style={{
            padding: '1px 6px', minWidth: 18, textAlign: 'center',
            background: T.surface, color: T.ink,
            border: `1px solid ${T.border}`, borderRadius: 4,
            fontFamily: 'JetBrains Mono, monospace', fontSize: 10,
            fontWeight: 500, lineHeight: 1.4,
          }}>{k}</kbd>
        ))}
      </div>
    </div>
  );
}

/* ── Shortcuts block ─────────────────────────────────────────────── */
function ShortcutsBlock() {
  return (
    <>
      <div style={{ padding: '18px 14px 8px' }}>
        <SectionLabel>Shortcuts</SectionLabel>
      </div>
      <div style={{ padding: '0 14px 16px' }} className="flex flex-col gap-0.5">
        <ShortcutRow keys={['click']}     label="Select zone" />
        <ShortcutRow keys={['drag']}      label="Reposition" />
        <ShortcutRow keys={['⌫']}         label="Delete" />
        <ShortcutRow keys={['⌘', 'D']}   label="Duplicate" />
        <ShortcutRow keys={['⌘', 'Z']}   label="Undo" />
        <ShortcutRow keys={['⇧', '⌘', 'Z']} label="Redo" />
        <ShortcutRow keys={['[', ']']}   label="Layer order" />
        <ShortcutRow keys={['⌘', 'P']}   label="Preview" />
        <ShortcutRow keys={['G']}         label="Toggle grid" />
        <ShortcutRow keys={['⌘', '/']}   label="All shortcuts" />
      </div>
    </>
  );
}

/* ── Zone type icon helper ───────────────────────────────────────── */
function ZoneIcon({ type }: { type: string }) {
  const size = 12;
  const sw = 1.8;
  if (type === 'photo')  return <Camera size={size} strokeWidth={sw} />;
  if (type === 'custom') return <ToggleLeft size={size} strokeWidth={sw} />;
  if (type === 'label')  return <Tag size={size} strokeWidth={sw} />;
  if (type === 'shape')  return <Square size={size} strokeWidth={sw} />;
  if (type === 'image')  return <ImagePlus size={size} strokeWidth={sw} />;
  return <Type size={size} strokeWidth={sw} />;
}

/* ── Layers panel ────────────────────────────────────────────────── */
interface LayersPanelProps {
  zones: Zone[];
  selectedIds: string[];
  setSelectedIds: React.Dispatch<React.SetStateAction<string[]>>;
  moveZoneUp: (id: string) => void;
  moveZoneDown: (id: string) => void;
  updateZone: (id: string, patch: Partial<Zone>, withHistory?: boolean) => void;
  previewMode: boolean;
}

function LayersPanel({ zones, selectedIds, setSelectedIds, moveZoneUp, moveZoneDown, updateZone, previewMode }: LayersPanelProps) {
  const reversed = [...zones].reverse();

  return (
    <>
      <div style={{ padding: '4px 14px 8px' }}>
        <SectionLabel count={zones.length}>Layers</SectionLabel>
      </div>
      <div style={{ padding: '0 14px 14px' }} className="flex flex-col gap-1">
        {zones.length === 0 && (
          <div style={{
            padding: '16px 14px',
            background: T.surface,
            border: `1px dashed ${T.borderStrong}`,
            borderRadius: 6,
            textAlign: 'center',
          }}>
            <div style={{
              width: 32, height: 32, margin: '0 auto 8px',
              borderRadius: '50%',
              background: T.primarySoft, color: T.primary,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Square size={15} strokeWidth={1.8} />
            </div>
            <div style={{ fontFamily: 'Inter, sans-serif', fontSize: 12.5, fontWeight: 600, color: T.ink }}>
              No elements yet
            </div>
            <div style={{ fontFamily: 'Inter, sans-serif', fontSize: 11, lineHeight: 1.4, color: T.muted, marginTop: 3 }}>
              Add a zone from the left rail.
            </div>
          </div>
        )}

        {reversed.map(z => {
          const realIdx = zones.findIndex(x => x.id === z.id);
          const sel = selectedIds.includes(z.id) && !previewMode;

          return (
            <div
              key={z.id}
              onClick={e => {
                if (previewMode) return;
                if (e.shiftKey) {
                  setSelectedIds(ids => ids.includes(z.id) ? ids.filter(i => i !== z.id) : [...ids, z.id]);
                } else {
                  setSelectedIds([z.id]);
                }
              }}
              className="group flex items-center gap-2 px-2 cursor-pointer"
              style={{
                height: 32,
                background: sel ? T.primarySoft : T.surface,
                border: `1px solid ${sel ? 'rgba(31,77,58,0.2)' : T.border}`,
                borderRadius: 6,
              }}
            >
              {/* Layer order arrows (hover) */}
              {!previewMode && (
                <div className="opacity-0 group-hover:opacity-100 flex flex-col shrink-0 transition">
                  <button
                    onClick={e => { e.stopPropagation(); moveZoneUp(z.id); }}
                    disabled={realIdx >= zones.length - 1}
                    className="h-4 w-4 grid place-items-center disabled:opacity-20 transition"
                    style={{ color: T.muted, background: 'transparent', border: 'none', cursor: 'pointer', padding: 0 }}
                  >
                    <ChevronUp size={9} strokeWidth={2.5} />
                  </button>
                  <button
                    onClick={e => { e.stopPropagation(); moveZoneDown(z.id); }}
                    disabled={realIdx <= 0}
                    className="h-4 w-4 grid place-items-center disabled:opacity-20 transition"
                    style={{ color: T.muted, background: 'transparent', border: 'none', cursor: 'pointer', padding: 0 }}
                  >
                    <ChevronDown size={9} strokeWidth={2.5} />
                  </button>
                </div>
              )}

              {/* Zone type icon */}
              <div style={{
                width: 18, height: 18, borderRadius: 4, flexShrink: 0,
                background: sel ? T.primary : T.cream,
                color: sel ? T.cream : T.inkSoft,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <ZoneIcon type={z.type} />
              </div>

              {/* Label */}
              <div style={{
                flex: 1, minWidth: 0,
                fontFamily: 'Inter, sans-serif', fontSize: 12.5,
                fontWeight: sel ? 600 : 500,
                color: sel ? T.primary : T.ink,
                whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
              }}>
                {z.label}
              </div>

              {/* Type badge */}
              <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 9.5, color: T.muted, letterSpacing: '0.04em', flexShrink: 0 }}>
                {z.type}
              </div>

              {/* Lock / hide */}
              {!previewMode && (
                <div className="opacity-0 group-hover:opacity-100 flex items-center gap-px shrink-0 transition">
                  <button
                    onClick={e => { e.stopPropagation(); updateZone(z.id, { locked: !z.locked }); }}
                    title={z.locked ? 'Unlock' : 'Lock'}
                    style={{
                      width: 22, height: 22, borderRadius: 4,
                      background: 'transparent', border: 'none', cursor: 'pointer',
                      color: z.locked ? T.warning : T.borderStrong,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}
                  >
                    {z.locked ? <Lock size={11} strokeWidth={1.8} /> : <LockOpen size={11} strokeWidth={1.8} />}
                  </button>
                  <button
                    onClick={e => { e.stopPropagation(); updateZone(z.id, { hidden: !z.hidden }); }}
                    title={z.hidden ? 'Show' : 'Hide'}
                    style={{
                      width: 22, height: 22, borderRadius: 4,
                      background: 'transparent', border: 'none', cursor: 'pointer',
                      color: z.hidden ? T.borderStrong : T.inkSoft,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}
                  >
                    {z.hidden ? <EyeOff size={11} strokeWidth={1.8} /> : <Eye size={11} strokeWidth={1.8} />}
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </>
  );
}

/* ── Event Panel ─────────────────────────────────────────────────── */
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
}

function EventPanel({
  nameVal, setNameVal, editName, setEditName, saveName,
  bgW, bgH, backgroundUrl, bgReplaceRef, handleReplaceBackground,
}: EventPanelProps) {
  return (
    <div style={{ padding: '14px 14px 0', display: 'flex', flexDirection: 'column', gap: 10 }}>
      <SectionLabel>Event</SectionLabel>

      {/* Name */}
      <PanelCard label="Name">
        {editName ? (
          <input
            autoFocus
            value={nameVal}
            onChange={e => setNameVal(e.target.value)}
            onBlur={saveName}
            onKeyDown={e => e.key === 'Enter' && saveName()}
            className="w-full outline-none text-[13px] font-semibold"
            style={{
              height: 32, padding: '0 10px',
              background: T.surface, border: `1px solid ${T.primary}`,
              borderRadius: 6, color: T.ink,
              fontFamily: 'DM Sans, sans-serif',
            }}
          />
        ) : (
          <button
            onClick={() => setEditName(true)}
            className="w-full flex items-center justify-between group transition"
            style={{
              height: 32, padding: '0 10px',
              background: T.surface, border: `1px solid ${T.border}`,
              borderRadius: 6, cursor: 'text',
            }}
          >
            <span style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 13, fontWeight: 600, color: T.ink }} className="truncate">
              {nameVal}
            </span>
            <Pencil size={11} strokeWidth={1.8} style={{ color: T.muted, flexShrink: 0, marginLeft: 4, opacity: 0 }} className="group-hover:opacity-100 transition" />
          </button>
        )}
      </PanelCard>

      {/* Canvas size */}
      <PanelCard label="Canvas">
        <div
          className="flex items-center"
          style={{
            height: 32, padding: '0 10px',
            background: T.cream, border: `1px solid ${T.border}`,
            borderRadius: 6,
            fontFamily: 'JetBrains Mono, monospace', fontSize: 11,
            color: T.ink,
          }}
        >
          {bgW} × {bgH} px
        </div>
      </PanelCard>

      {/* Background */}
      <PanelCard label="Background">
        <div className="flex items-center gap-3">
          {/* Thumbnail */}
          <div style={{
            width: 56, height: 80, borderRadius: 4,
            border: `1px solid ${T.border}`, overflow: 'hidden',
            flexShrink: 0, position: 'relative',
            background: T.cream,
          }}>
            {backgroundUrl
              // eslint-disable-next-line @next/next/no-img-element
              ? <img src={backgroundUrl} alt="Background" className="w-full h-full object-cover" />
              : (
                <div className="w-full h-full flex items-center justify-center">
                  <ImageIcon size={16} strokeWidth={1.6} style={{ color: T.muted }} />
                </div>
              )
            }
          </div>
          {/* Info + replace */}
          <div className="flex-1 min-w-0">
            <div style={{ fontFamily: 'Inter, sans-serif', fontSize: 12, fontWeight: 500, color: T.ink }} className="truncate">
              {backgroundUrl ? 'background.png' : 'No background'}
            </div>
            {bgW > 0 && (
              <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10, color: T.muted, marginTop: 2, letterSpacing: '0.02em' }}>
                {bgW} × {bgH}
              </div>
            )}
            <label
              className="flex items-center gap-1 cursor-pointer transition hover:opacity-80"
              style={{ marginTop: 6, fontFamily: 'Inter, sans-serif', fontSize: 12, fontWeight: 600, color: T.primary }}
            >
              <Upload size={11} strokeWidth={2} />
              <span>Replace</span>
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
      </PanelCard>
    </div>
  );
}

/* ── Preview Panel ───────────────────────────────────────────────── */
function PreviewPanel() {
  return (
    <aside
      className="shrink-0 flex flex-col items-center justify-center p-8 text-center"
      style={{ width: 320, background: T.cream, borderLeft: `1px solid ${T.border}` }}
    >
      <div style={{
        width: 48, height: 48, borderRadius: 16,
        background: T.primarySoft,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: T.muted,
      }}>
        <Eye size={18} strokeWidth={1.8} />
      </div>
      <div style={{ marginTop: 12, fontFamily: 'DM Sans, sans-serif', fontWeight: 700, fontSize: 14, color: T.ink }}>
        Preview mode
      </div>
      <p style={{ fontSize: 12, color: T.muted, marginTop: 4, lineHeight: 1.5 }}>
        Zones are non-interactive.<br />
        Press{' '}
        <kbd style={{
          background: T.cream, border: `1px solid ${T.border}`,
          borderRadius: 4, padding: '1px 5px',
          fontFamily: 'JetBrains Mono, monospace', fontSize: 10,
        }}>⌘P</kbd>
        {' '}to resume editing.
      </p>
    </aside>
  );
}

/* ── Multi-select Panel ──────────────────────────────────────────── */
interface MultiSelectPanelProps {
  selectedIds: string[];
  alignSelected: (axis: 'left' | 'centerH' | 'right' | 'top' | 'middleV' | 'bottom') => void;
  distributeSelected: (dir: 'h' | 'v') => void;
  removeSelected: () => void;
}

function MultiSelectPanel({ selectedIds, alignSelected, distributeSelected, removeSelected }: MultiSelectPanelProps) {
  return (
    <aside
      className="shrink-0 flex flex-col items-center justify-center p-8 text-center"
      style={{ width: 320, background: T.cream, borderLeft: `1px solid ${T.border}` }}
    >
      <div style={{
        width: 48, height: 48, borderRadius: 16,
        background: T.primarySoft,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: T.muted,
      }}>
        <MousePointer2 size={18} strokeWidth={1.8} />
      </div>
      <div style={{ marginTop: 12, fontFamily: 'DM Sans, sans-serif', fontWeight: 700, fontSize: 14, color: T.ink }}>
        {selectedIds.length} selected
      </div>
      <p style={{ fontSize: 12, color: T.muted, marginTop: 4 }}>
        Select a single element to edit its properties.
      </p>

      <div className="mt-5 w-full text-left space-y-3">
        <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10, color: T.muted, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
          Align
        </div>
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
              className="h-9 rounded-xl border flex items-center justify-center transition hover:bg-[#E8EFEB] hover:border-[rgba(31,77,58,0.2)] hover:text-[#1F4D3A]"
              style={{ border: `1px solid ${T.border}`, color: T.inkSoft, background: T.surface }}
            >
              {icon}
            </button>
          ))}
        </div>

        {selectedIds.length >= 3 && (
          <>
            <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10, color: T.muted, letterSpacing: '0.1em', textTransform: 'uppercase', marginTop: 8 }}>
              Distribute
            </div>
            <div className="grid grid-cols-2 gap-1">
              <button
                title="Distribute horizontally"
                onClick={() => distributeSelected('h')}
                className="h-9 rounded-xl border flex items-center justify-center gap-1.5 text-[11px] transition hover:bg-[#E8EFEB]"
                style={{ border: `1px solid ${T.border}`, color: T.inkSoft, background: T.surface }}
              >
                <AlignHorizontalSpaceAround size={13} strokeWidth={1.8} />H
              </button>
              <button
                title="Distribute vertically"
                onClick={() => distributeSelected('v')}
                className="h-9 rounded-xl border flex items-center justify-center gap-1.5 text-[11px] transition hover:bg-[#E8EFEB]"
                style={{ border: `1px solid ${T.border}`, color: T.inkSoft, background: T.surface }}
              >
                <AlignVerticalSpaceAround size={13} strokeWidth={1.8} />V
              </button>
            </div>
          </>
        )}

        <button
          onClick={removeSelected}
          className="w-full mt-2 text-[12px] font-medium px-4 py-1.5 rounded-lg transition"
          style={{
            color: T.danger,
            border: '1px solid rgba(184,66,60,0.3)',
            background: T.surface,
          }}
        >
          Delete {selectedIds.length} elements
        </button>
      </div>
    </aside>
  );
}

/* ── Public composite sidebar ────────────────────────────────────── */
export type RightSidebarMode = 'preview' | 'multiselect' | 'event' | 'zone';

export interface RightSidebarProps {
  mode: RightSidebarMode;
  previewMode: boolean;
  // EventPanel
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
  // Layers (always rendered)
  zones: Zone[];
  selectedIds: string[];
  setSelectedIds: React.Dispatch<React.SetStateAction<string[]>>;
  moveZoneUp: (id: string) => void;
  moveZoneDown: (id: string) => void;
  updateZone: (id: string, patch: Partial<Zone>, withHistory?: boolean) => void;
  // MultiSelectPanel
  alignSelected: (axis: 'left' | 'centerH' | 'right' | 'top' | 'middleV' | 'bottom') => void;
  distributeSelected: (dir: 'h' | 'v') => void;
  removeSelected: () => void;
  // Zone panel rendered via children when mode === 'zone'
  children?: React.ReactNode;
}

export default function RightSidebar({
  mode, previewMode,
  nameVal, setNameVal, editName, setEditName, saveName,
  bgW, bgH, backgroundUrl, bgReplaceRef, handleReplaceBackground,
  zones, selectedIds, setSelectedIds, moveZoneUp, moveZoneDown, updateZone,
  alignSelected, distributeSelected, removeSelected,
  children,
}: RightSidebarProps) {

  if (mode === 'preview') return <PreviewPanel />;
  if (mode === 'multiselect') return (
    <MultiSelectPanel
      selectedIds={selectedIds}
      alignSelected={alignSelected}
      distributeSelected={distributeSelected}
      removeSelected={removeSelected}
    />
  );

  // 'event' or 'zone' — both show the main sidebar with layers + shortcuts
  return (
    <aside
      className="shrink-0 flex flex-col overflow-y-auto"
      style={{ width: 320, background: T.cream, borderLeft: `1px solid ${T.border}` }}
    >
      {/* Top panel: EventPanel or Zone children */}
      {mode === 'zone'
        ? children
        : (
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
          />
        )
      }

      {/* Divider */}
      <div style={{ height: 1, background: T.border, margin: '14px 14px 0' }} />

      {/* Layers — always shown */}
      <div style={{ paddingTop: 14 }}>
        <LayersPanel
          zones={zones}
          selectedIds={selectedIds}
          setSelectedIds={setSelectedIds}
          moveZoneUp={moveZoneUp}
          moveZoneDown={moveZoneDown}
          updateZone={updateZone}
          previewMode={previewMode}
        />
      </div>

      {/* Shortcuts */}
      <div style={{ height: 1, background: T.border, margin: '0 14px' }} />
      <ShortcutsBlock />
    </aside>
  );
}
