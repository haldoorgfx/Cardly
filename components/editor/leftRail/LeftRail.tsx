'use client';

import React, { useState } from 'react';
import {
  Type, Camera, ToggleLeft, Tag, ImagePlus, Plus,
  ChevronRight, ChevronDown, HelpCircle,
  Square, Circle, Triangle, Minus,
} from 'lucide-react';

interface LeftRailProps {
  previewMode: boolean;
  addZone: (type: 'text' | 'photo' | 'custom' | 'label') => void;
  addShapeZone: (shapeType: 'rect' | 'ellipse' | 'triangle' | 'line') => void;
  uploadingImage: boolean;
  imageUploadRef: React.RefObject<HTMLInputElement>;
  handleImageUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

/* ── Element button ──────────────────────────────────────────────── */
function AddElementBtn({
  icon, label, sub, onClick, disabled,
}: {
  icon: React.ReactNode;
  label: string;
  sub: string;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="w-full flex items-center gap-2.5 p-2 rounded-md text-left transition-opacity hover:opacity-80 active:scale-[0.99] disabled:opacity-50"
      style={{ background: '#FFFFFF', border: '1px solid #E5E0D4' }}
    >
      <span
        className="h-7 w-7 rounded-md grid place-items-center shrink-0"
        style={{ background: '#E8EFEB', color: '#1F4D3A' }}
      >
        {icon}
      </span>
      <span className="flex-1 min-w-0">
        <span className="block text-[12.5px] font-semibold truncate" style={{ color: '#0F1F18', lineHeight: 1.3 }}>{label}</span>
        <span className="block text-[11px] truncate" style={{ color: '#6B7A72', lineHeight: 1.3 }}>{sub}</span>
      </span>
      <Plus size={13} strokeWidth={2} style={{ color: '#6B7A72', opacity: 0.6, flexShrink: 0 }} />
    </button>
  );
}

export default function LeftRail({
  previewMode,
  addZone, addShapeZone,
  uploadingImage, imageUploadRef, handleImageUpload,
}: LeftRailProps) {
  const [shapesOpen, setShapesOpen] = useState(false);

  return (
    <aside
      className="shrink-0 flex flex-col overflow-y-auto"
      style={{ width: 240, background: '#FAF6EE', borderRight: '1px solid #E5E0D4' }}
    >
      {!previewMode && (
        <>
          {/* ── Add element ──────────────────────────────── */}
          <div className="p-3 flex flex-col gap-1.5">
            <div
              className="text-[10px] uppercase tracking-[0.1em] mb-1"
              style={{ fontFamily: 'JetBrains Mono, monospace', color: '#6B7A72' }}
            >
              Add element
            </div>

            {/* Hidden file input */}
            <input
              ref={imageUploadRef}
              type="file"
              accept="image/png,image/jpeg,image/webp,image/gif,image/svg+xml"
              className="hidden"
              onChange={handleImageUpload}
            />

            <AddElementBtn
              icon={<Type size={14} strokeWidth={1.8} />}
              label="Text field"
              sub="Name, title, country…"
              onClick={() => addZone('text')}
            />
            <AddElementBtn
              icon={<Camera size={14} strokeWidth={1.8} />}
              label="Photo zone"
              sub="Headshot or logo"
              onClick={() => addZone('photo')}
            />
            <AddElementBtn
              icon={<ToggleLeft size={14} strokeWidth={1.8} />}
              label="Custom field"
              sub="Dropdown, badge, role…"
              onClick={() => addZone('custom')}
            />
            <AddElementBtn
              icon={<Tag size={14} strokeWidth={1.8} />}
              label="Static text"
              sub="Fixed text on the card"
              onClick={() => addZone('label')}
            />
            <AddElementBtn
              icon={
                uploadingImage
                  ? <svg className="animate-spin" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12a9 9 0 1 1-6.219-8.56" /></svg>
                  : <ImagePlus size={14} strokeWidth={1.8} />
              }
              label={uploadingImage ? 'Uploading…' : 'Image'}
              sub="PNG · JPG · SVG · GIF"
              onClick={() => imageUploadRef.current?.click()}
              disabled={uploadingImage}
            />

            {/* Decorative shapes — collapsible */}
            <div className="mt-1">
              <button
                onClick={() => setShapesOpen(s => !s)}
                className="w-full flex items-center gap-1.5 px-2 py-1.5 rounded-md transition hover:bg-white"
                style={{
                  border: '1px solid #E5E0D4',
                  background: 'transparent',
                  fontFamily: 'JetBrains Mono, monospace',
                  fontSize: 10,
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  color: '#3A4A42',
                }}
              >
                {shapesOpen
                  ? <ChevronDown size={11} strokeWidth={2} style={{ flexShrink: 0 }} />
                  : <ChevronRight size={11} strokeWidth={2} style={{ flexShrink: 0 }} />
                }
                <Square size={11} strokeWidth={1.8} style={{ flexShrink: 0 }} />
                <span className="flex-1 text-left">Decorative shapes</span>
                <span style={{ color: '#6B7A72', fontSize: 10 }}>4</span>
              </button>

              {shapesOpen && (
                <div className="mt-1.5 grid grid-cols-2 gap-1">
                  {([
                    { s: 'rect'     as const, label: 'Rectangle', icon: <Square size={12} strokeWidth={1.8} /> },
                    { s: 'ellipse'  as const, label: 'Circle',    icon: <Circle size={12} strokeWidth={1.8} /> },
                    { s: 'triangle' as const, label: 'Triangle',  icon: <Triangle size={12} strokeWidth={1.8} /> },
                    { s: 'line'     as const, label: 'Line',      icon: <Minus size={12} strokeWidth={1.8} /> },
                  ] as { s: 'rect' | 'ellipse' | 'triangle' | 'line'; label: string; icon: React.ReactNode }[]).map(item => (
                    <button
                      key={item.s}
                      onClick={() => addShapeZone(item.s)}
                      className="flex items-center gap-1.5 p-2 rounded-md transition hover:bg-white text-left"
                      style={{ border: '1px solid #E5E0D4', background: '#FAF6EE' }}
                    >
                      <span
                        className="h-6 w-6 rounded grid place-items-center shrink-0"
                        style={{ background: '#E8EFEB', color: '#1F4D3A' }}
                      >
                        {item.icon}
                      </span>
                      <span className="text-[11.5px] font-medium" style={{ color: '#0F1F18' }}>
                        {item.label}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Separator */}
          <div style={{ height: 1, background: '#E5E0D4', margin: '0 12px' }} />

          {/* Footer hint */}
          <div className="px-3 py-2 flex items-center gap-2">
            <button
              title="Help · ⌘/"
              className="h-7 w-7 rounded-md grid place-items-center transition hover:bg-white"
              style={{ border: '1px solid #E5E0D4', color: '#6B7A72', background: 'transparent' }}
            >
              <HelpCircle size={13} strokeWidth={1.8} />
            </button>
            <span
              style={{
                fontFamily: 'JetBrains Mono, monospace',
                fontSize: 10,
                color: '#6B7A72',
                letterSpacing: '0.04em',
              }}
            >
              Drag · drop to canvas
            </span>
          </div>
        </>
      )}
    </aside>
  );
}
