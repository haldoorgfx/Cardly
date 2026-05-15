'use client';

import React from 'react';
import type { Zone } from '@/types/database';
import {
  Type, Image, ImagePlus, ToggleLeft, Tag, Plus,
  Eye, EyeOff, Lock, LockOpen,
  ChevronUp, ChevronDown, Square, Circle, Triangle, Minus,
} from 'lucide-react';

interface LeftRailProps {
  previewMode: boolean;
  zones: Zone[];
  selectedIds: string[];
  setSelectedIds: React.Dispatch<React.SetStateAction<string[]>>;
  addZone: (type: 'text' | 'photo' | 'custom' | 'label') => void;
  addShapeZone: (shapeType: 'rect' | 'ellipse' | 'triangle' | 'line') => void;
  moveZoneUp: (id: string) => void;
  moveZoneDown: (id: string) => void;
  updateZone: (id: string, patch: Partial<Zone>, withHistory?: boolean) => void;
  uploadingImage: boolean;
  imageUploadRef: React.RefObject<HTMLInputElement>;
  handleImageUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export default function LeftRail({
  previewMode, zones, selectedIds, setSelectedIds,
  addZone, addShapeZone,
  moveZoneUp, moveZoneDown, updateZone,
  uploadingImage, imageUploadRef, handleImageUpload,
}: LeftRailProps) {
  return (
    <aside className="w-[252px] shrink-0 bg-white border-r border-border flex flex-col overflow-y-auto">

      {/* ── ADD ELEMENT ────────────────────────────────── */}
      {!previewMode && (
        <div className="p-4">
          <div className="text-[10px] font-mono tracking-widest text-ink/40 mb-3 uppercase">Add Element</div>

          {/* Hidden file input for image upload */}
          <input
            ref={imageUploadRef}
            type="file"
            accept="image/png,image/jpeg,image/webp,image/gif,image/svg+xml"
            className="hidden"
            onChange={handleImageUpload}
          />

          <div className="space-y-1">
            {([
              { type: 'text'   as const, label: 'Text field',   sub: 'Name, title, country…',   icon: <Type size={15} strokeWidth={1.8} /> },
              { type: 'photo'  as const, label: 'Photo zone',   sub: 'Headshot or logo',          icon: <Image size={15} strokeWidth={1.8} /> },
              { type: 'custom' as const, label: 'Custom field', sub: 'Dropdown, badge, role…',    icon: <ToggleLeft size={15} strokeWidth={1.8} /> },
              { type: 'label'  as const, label: 'Static text',  sub: 'Fixed text on the card',    icon: <Tag size={15} strokeWidth={1.8} /> },
            ]).map(item => (
              <button
                key={item.type}
                onClick={() => addZone(item.type)}
                className="group w-full flex items-center gap-3 p-2.5 rounded-xl hover:bg-cream border border-transparent hover:border-border transition text-left"
              >
                <span className="h-9 w-9 rounded-lg bg-cream grid place-items-center text-primary group-hover:text-white group-hover:bg-primary transition shrink-0">
                  {item.icon}
                </span>
                <span className="flex-1 min-w-0">
                  <span className="block text-[13px] font-medium">{item.label}</span>
                  <span className="block text-[11px] text-ink/50">{item.sub}</span>
                </span>
                <Plus size={12} strokeWidth={2} className="text-ink/30 shrink-0" />
              </button>
            ))}

            {/* Static image upload */}
            <button
              onClick={() => imageUploadRef.current?.click()}
              disabled={uploadingImage}
              className="group w-full flex items-center gap-3 p-2.5 rounded-xl hover:bg-cream border border-transparent hover:border-border transition text-left disabled:opacity-50 mt-1"
            >
              <span className="h-9 w-9 rounded-lg bg-cream grid place-items-center text-primary group-hover:text-white group-hover:bg-primary transition shrink-0">
                {uploadingImage
                  ? <svg className="animate-spin" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
                  : <ImagePlus size={15} strokeWidth={1.8} />
                }
              </span>
              <span className="flex-1 min-w-0">
                <span className="block text-[13px] font-medium">{uploadingImage ? 'Uploading…' : 'Static image'}</span>
                <span className="block text-[11px] text-ink/50">Embed PNG, JPG, SVG on the card</span>
              </span>
              <Plus size={12} strokeWidth={2} className="text-ink/30 shrink-0" />
            </button>
          </div>

          {/* Shapes */}
          <div className="mt-3">
            <div className="flex items-center gap-2 mb-2">
              <div className="flex-1 h-px bg-border" />
              <span className="text-[10px] font-mono tracking-widest text-ink/35 uppercase">Shapes</span>
              <div className="flex-1 h-px bg-border" />
            </div>
            <div className="grid grid-cols-2 gap-1.5">
              {([
                { shapeType: 'rect'     as const, label: 'Rectangle', icon: <Square size={13} strokeWidth={1.8} /> },
                { shapeType: 'ellipse'  as const, label: 'Circle',    icon: <Circle size={13} strokeWidth={1.8} /> },
                { shapeType: 'triangle' as const, label: 'Triangle',  icon: <Triangle size={13} strokeWidth={1.8} /> },
                { shapeType: 'line'     as const, label: 'Line',      icon: <Minus size={13} strokeWidth={1.8} /> },
              ] as { shapeType: 'rect' | 'ellipse' | 'triangle' | 'line'; label: string; icon: React.ReactNode }[]).map(item => (
                <button
                  key={item.shapeType}
                  onClick={() => addShapeZone(item.shapeType)}
                  className="group flex items-center gap-2 p-2 rounded-xl hover:bg-cream border border-transparent hover:border-border transition text-left"
                >
                  <span className="h-7 w-7 rounded-lg bg-cream grid place-items-center text-primary group-hover:text-white group-hover:bg-primary transition shrink-0">
                    {item.icon}
                  </span>
                  <span className="text-[12px] font-medium">{item.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── LAYERS ─────────────────────────────────────── */}
      <div className={previewMode ? 'p-4 flex-1' : 'px-4 pb-4 flex-1'}>
        <div className="text-[10px] font-mono tracking-widest text-ink/40 mb-2 flex items-center justify-between uppercase">
          <span>Layers</span>
          <span className="text-ink/35 font-sans normal-case text-[11px]">{zones.length}</span>
        </div>

        <div className="space-y-0.5">
          {[...zones].reverse().map(z => {
            const realIdx = zones.findIndex(x => x.id === z.id);
            const isSel = selectedIds.includes(z.id) && !previewMode;
            const ZoneIcon = z.type === 'photo' ? Image
              : z.type === 'custom' ? ToggleLeft
              : z.type === 'label' ? Tag
              : z.type === 'shape' ? Square
              : z.type === 'image' ? ImagePlus
              : Type;

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
                className={`group flex items-center gap-1.5 px-2 py-1.5 rounded-lg cursor-pointer text-[12.5px] transition ${
                  isSel ? 'bg-primary/10 text-primary' : 'hover:bg-cream text-ink/80'
                }`}
              >
                {/* Layer order arrows */}
                {!previewMode && (
                  <div className="flex flex-col gap-0 opacity-0 group-hover:opacity-100 shrink-0 transition">
                    <button
                      onClick={e => { e.stopPropagation(); moveZoneUp(z.id); }}
                      disabled={realIdx >= zones.length - 1}
                      className="h-4 w-4 rounded grid place-items-center text-ink/40 hover:text-primary disabled:opacity-20"
                    >
                      <ChevronUp size={9} strokeWidth={2.5} />
                    </button>
                    <button
                      onClick={e => { e.stopPropagation(); moveZoneDown(z.id); }}
                      disabled={realIdx <= 0}
                      className="h-4 w-4 rounded grid place-items-center text-ink/40 hover:text-primary disabled:opacity-20"
                    >
                      <ChevronDown size={9} strokeWidth={2.5} />
                    </button>
                  </div>
                )}

                {/* Zone type icon */}
                <span className={`h-6 w-6 rounded-md grid place-items-center shrink-0 ${isSel ? 'text-primary' : 'text-ink/50'}`}>
                  <ZoneIcon size={12} strokeWidth={1.8} />
                </span>

                <span className="flex-1 truncate">{z.label}</span>

                {z.required && (
                  <span className="text-[9px] font-mono px-1 py-px rounded bg-primary/10 text-primary shrink-0">REQ</span>
                )}
                {(z.rotation ?? 0) !== 0 && (
                  <span className="text-[9px] font-mono text-accent shrink-0" title={`${z.rotation}°`}>↻</span>
                )}

                {/* Lock / hide buttons */}
                {!previewMode && (
                  <div className="opacity-0 group-hover:opacity-100 flex items-center gap-0.5 shrink-0 transition">
                    <button
                      onClick={e => { e.stopPropagation(); updateZone(z.id, { locked: !z.locked }); }}
                      className={`h-6 w-6 rounded-md grid place-items-center transition ${z.locked ? 'text-warning' : 'text-ink/40 hover:text-ink'}`}
                      title={z.locked ? 'Unlock' : 'Lock'}
                    >
                      {z.locked ? <Lock size={11} strokeWidth={1.8} /> : <LockOpen size={11} strokeWidth={1.8} />}
                    </button>
                    <button
                      onClick={e => { e.stopPropagation(); updateZone(z.id, { hidden: !z.hidden }); }}
                      className="h-6 w-6 rounded-md grid place-items-center text-ink/40 hover:text-ink transition"
                      title={z.hidden ? 'Show' : 'Hide'}
                    >
                      {z.hidden ? <EyeOff size={11} strokeWidth={1.8} /> : <Eye size={11} strokeWidth={1.8} />}
                    </button>
                  </div>
                )}
              </div>
            );
          })}

          {zones.length === 0 && (
            <div className="text-center py-6 text-[12px] text-ink/30 font-mono">
              No elements yet.
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}
