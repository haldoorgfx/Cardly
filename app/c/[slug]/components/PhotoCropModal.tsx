'use client';

/**
 * PhotoCropModal — E1.5
 * Full-screen dark photo cropping overlay using react-easy-crop.
 * Appears on top of the DetailsFormScreen when an attendee picks a photo.
 */

import { useEffect, useRef } from 'react';
import Cropper from 'react-easy-crop';
import type { Area, Point } from 'react-easy-crop';
import { X, ZoomIn, ZoomOut, Upload, Check } from 'lucide-react';
import type { CropTarget } from '../AttendeeFlow';

interface Props {
  cropTarget: CropTarget;
  cropPos: Point;
  cropZoom: number;
  onCropChange: (pos: Point) => void;
  onZoomChange: (zoom: number) => void;
  onCropComplete: (area: Area, pixels: Area) => void;
  onConfirm: () => void;
  onReupload: () => void;
  onClose: () => void;
}

function shapeLabel(shape?: string) {
  if (shape === 'circle')  return 'Circle · matches card zone';
  if (shape === 'rounded') return 'Rounded · matches card zone';
  if (shape === 'hexagon') return 'Hexagon · matches card zone';
  return 'Square · matches card zone';
}

export default function PhotoCropModal({
  cropTarget, cropPos, cropZoom,
  onCropChange, onZoomChange, onCropComplete,
  onConfirm, onReupload, onClose,
}: Props) {
  const { zone } = cropTarget;
  const cropShape = zone.shape === 'circle' ? 'round' : 'rect';
  const aspect = zone.w && zone.h ? zone.w / zone.h : 1;

  const pct = ((cropZoom - 1) / (3 - 1)) * 100;

  // Modal focus management: this dialog renders BOTH a mobile sheet and a
  // desktop dialog at once (one is `display:none` via a `lg:` breakpoint), so
  // the trap only considers elements that are actually visible/rendered
  // (offsetParent !== null). Traps Tab, closes on Escape, and restores focus
  // to whatever was focused before the modal opened.
  const dialogRef = useRef<HTMLDivElement>(null);
  const previouslyFocused = useRef<HTMLElement | null>(null);

  useEffect(() => {
    previouslyFocused.current = document.activeElement as HTMLElement | null;
    const node = dialogRef.current;
    const getFocusable = () => Array.from(
      node?.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
      ) ?? []
    ).filter(el => el.offsetParent !== null);

    const initial = getFocusable();
    (initial[0] ?? node)?.focus();

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { e.preventDefault(); onClose(); return; }
      if (e.key !== 'Tab') return;
      const list = getFocusable();
      if (list.length === 0) return;
      const first = list[0];
      const last = list[list.length - 1];
      const active = document.activeElement as HTMLElement | null;
      if (e.shiftKey) {
        if (active === first || !node?.contains(active)) { e.preventDefault(); last.focus(); }
      } else if (active === last || !node?.contains(active)) {
        e.preventDefault(); first.focus();
      }
    };
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      previouslyFocused.current?.focus?.();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div
      ref={dialogRef}
      role="dialog"
      aria-modal="true"
      aria-label="Position your photo"
      tabIndex={-1}
      style={{
        position: 'fixed', inset: 0, zIndex: 50,
        fontFamily: 'Inter, sans-serif',
        outline: 'none',
      }}
    >
      {/* Dark scrim */}
      <div
        style={{ position: 'absolute', inset: 0, background: 'rgba(15,31,24,0.85)' }}
        onClick={onClose}
      />

      {/* ── Mobile / tablet: full-screen sheet ───────────────────────────── */}
      <div
        className="relative z-10 flex flex-col lg:hidden"
        style={{
          position: 'absolute', inset: 0,
          background: '#0F1F18', color: '#FAF6EE',
        }}
      >
        {/* Header */}
        <div style={{ padding: '16px 20px 12px', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
          <div>
            <div style={{
              fontFamily: 'Inter, system-ui, sans-serif', fontSize: 10,
              color: 'rgba(250,246,238,0.55)', letterSpacing: '0.1em',
              textTransform: 'uppercase', marginBottom: 4,
            }}>
              Position photo
            </div>
            <div style={{
              fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: 700, fontSize: 22,
              letterSpacing: '-0.02em', color: '#FAF6EE',
            }}>
              Position your photo
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            style={{
              width: 40, height: 40, borderRadius: '50%',
              background: 'rgba(250,246,238,0.08)', border: 'none',
              color: '#FAF6EE', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            }}
          >
            <X size={18} strokeWidth={2}/>
          </button>
        </div>

        {/* Crop area */}
        <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
          <Cropper
            image={cropTarget.srcUrl}
            crop={cropPos}
            zoom={cropZoom}
            aspect={aspect}
            cropShape={cropShape}
            onCropChange={onCropChange}
            onZoomChange={onZoomChange}
            onCropComplete={onCropComplete}
            style={{
              containerStyle: { background: '#0F1F18' },
              cropAreaStyle: {
                border: '2px solid rgba(250,246,238,0.85)',
                boxShadow: '0 0 0 9999px rgba(15,31,24,0.7)',
              },
            }}
          />

          {/* Hint chips */}
          <div style={{
            position: 'absolute', left: 0, right: 0, bottom: 12,
            display: 'flex', justifyContent: 'center', gap: 8,
            pointerEvents: 'none', zIndex: 2,
          }}>
            {['Drag to reposition', 'Pinch to zoom'].map(hint => (
              <div key={hint} style={{
                padding: '8px 12px',
                background: 'rgba(250,246,238,0.10)',
                color: '#FAF6EE', borderRadius: 999,
                fontFamily: 'Inter, sans-serif', fontSize: 12, fontWeight: 500,
              }}>{hint}</div>
            ))}
          </div>
        </div>

        {/* Zoom slider */}
        <div style={{
          padding: '16px 20px 8px',
          background: 'rgba(0,0,0,0.2)',
          borderTop: '1px solid rgba(250,246,238,0.08)',
        }}>
          <div style={{
            fontFamily: 'Inter, system-ui, sans-serif', fontSize: 10,
            color: 'rgba(250,246,238,0.55)', letterSpacing: '0.06em',
            textTransform: 'uppercase', marginBottom: 8,
          }}>Zoom</div>
          <ZoomSliderDark zoom={cropZoom} pct={pct} onZoomChange={onZoomChange}/>
        </div>

        {/* Buttons */}
        <div style={{ padding: '16px 20px 24px', background: 'rgba(0,0,0,0.2)', display: 'flex', flexDirection: 'column', gap: 8 }}>
          <button
            onClick={onConfirm}
            style={{
              height: 56, background: '#1F4D3A', color: '#FAF6EE',
              border: 'none', borderRadius: 12,
              fontFamily: 'Inter, sans-serif', fontWeight: 600, fontSize: 16,
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              cursor: 'pointer',
            }}
          >
            <Check size={18} strokeWidth={2.2}/> Use this photo
          </button>
          <button
            onClick={onReupload}
            style={{
              height: 48, background: 'transparent', color: '#FAF6EE',
              border: '1.5px solid rgba(250,246,238,0.25)', borderRadius: 12,
              fontFamily: 'Inter, sans-serif', fontWeight: 600, fontSize: 15,
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              cursor: 'pointer',
            }}
          >
            <Upload size={16} strokeWidth={2}/> Re-upload
          </button>
        </div>
      </div>

      {/* ── Desktop: centered dialog ──────────────────────────────────────── */}
      <div
        className="hidden lg:flex items-center justify-center"
        style={{ position: 'absolute', inset: 0, zIndex: 10 }}
      >
        <div style={{
          width: 600, borderRadius: 16,
          background: '#FFFFFF', color: '#0F1F18',
          boxShadow: '0 4px 12px rgba(15,31,24,0.08), 0 24px 60px rgba(31,77,58,0.12)',
          overflow: 'hidden',
        }}>
          {/* Header */}
          <div style={{ padding: '24px 28px 20px', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
            <div>
              <div style={{
                fontFamily: 'Inter, system-ui, sans-serif', fontSize: 11,
                color: '#65736B', letterSpacing: '0.1em',
                textTransform: 'uppercase', marginBottom: 8,
              }}>Position photo</div>
              <div style={{
                fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: 700, fontSize: 28,
                letterSpacing: '-0.025em', color: '#0F1F18', lineHeight: 1.15,
              }}>Position your photo</div>
              <div style={{
                fontFamily: 'Inter, sans-serif', fontSize: 14, color: '#65736B', marginTop: 8,
              }}>Drag to reposition. Scroll or use the slider to zoom.</div>
            </div>
            <button
              onClick={onClose}
              aria-label="Close"
              style={{
                width: 40, height: 40, borderRadius: '50%',
                background: '#E8EFEB', border: 'none',
                color: '#1F4D3A', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
              }}
            >
              <X size={18} strokeWidth={2}/>
            </button>
          </div>

          {/* Crop stage */}
          <div style={{
            position: 'relative', height: 400,
            background: '#0F1F18', overflow: 'hidden',
            margin: '0 28px', borderRadius: 16,
          }}>
            <Cropper
              image={cropTarget.srcUrl}
              crop={cropPos}
              zoom={cropZoom}
              aspect={aspect}
              cropShape={cropShape}
              onCropChange={onCropChange}
              onZoomChange={onZoomChange}
              onCropComplete={onCropComplete}
              style={{
                containerStyle: { background: '#0F1F18' },
                cropAreaStyle: {
                  border: '2px solid rgba(250,246,238,0.85)',
                  boxShadow: '0 0 0 9999px rgba(15,31,24,0.7)',
                },
              }}
            />

            {/* Shape label chip */}
            <div style={{
              position: 'absolute', top: 16, left: 16, zIndex: 3,
              display: 'inline-flex', alignItems: 'center', gap: 8,
              padding: '8px 12px',
              background: 'rgba(15,31,24,0.7)',
              backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)',
              border: '1px solid rgba(250,246,238,0.12)',
              borderRadius: 999,
              fontFamily: 'Inter, system-ui, sans-serif', fontSize: 10,
              letterSpacing: '0.08em', textTransform: 'uppercase',
              color: 'rgba(250,246,238,0.85)',
              pointerEvents: 'none',
            }}>
              <span style={{
                width: 10, height: 10, borderRadius: '50%',
                border: '1.5px solid #E8C57E',
              }}/>
              <span>{shapeLabel(zone.shape)}</span>
            </div>
          </div>

          {/* Zoom slider */}
          <div style={{ padding: '20px 28px 8px', display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{
              fontFamily: 'Inter, system-ui, sans-serif', fontSize: 11,
              color: '#3A4A42', letterSpacing: '0.06em', textTransform: 'uppercase', minWidth: 44,
            }}>Zoom</div>
            <div style={{ flex: 1 }}>
              <ZoomSliderLight zoom={cropZoom} pct={pct} onZoomChange={onZoomChange}/>
            </div>
          </div>

          {/* Footer */}
          <div style={{
            padding: '16px 28px 24px',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12,
          }}>
            <button
              onClick={onReupload}
              style={{
                height: 52, padding: '0 24px',
                background: '#FFFFFF', color: '#0F1F18',
                border: '1.5px solid #E5E0D4', borderRadius: 12,
                fontFamily: 'Inter, sans-serif', fontWeight: 600, fontSize: 15,
                display: 'inline-flex', alignItems: 'center', gap: 8, cursor: 'pointer',
              }}
            >
              <Upload size={16} strokeWidth={2}/> Re-upload
            </button>
            <button
              onClick={onConfirm}
              style={{
                height: 52, padding: '0 28px',
                background: '#1F4D3A', color: '#FAF6EE',
                border: 'none', borderRadius: 12,
                fontFamily: 'Inter, sans-serif', fontWeight: 600, fontSize: 15,
                display: 'inline-flex', alignItems: 'center', gap: 10, cursor: 'pointer',
                boxShadow: '0 1px 2px rgba(15,31,24,0.04), 0 8px 24px rgba(31,77,58,0.18)',
              }}
            >
              <Check size={18} strokeWidth={2.2}/> Use this photo
            </button>
          </div>
        </div>
      </div>

      {/* The native range input is visually hidden (opacity:0) behind the custom
          track/thumb, which also hides its default focus ring. Draw an explicit
          one on the visible thumb when the input has keyboard focus. */}
      <style>{`
        .zoom-track:focus-within .zoom-thumb {
          outline: 2px solid #E8C57E;
          outline-offset: 2px;
        }
      `}</style>
    </div>
  );
}

/* ── Zoom slider helpers ─────────────────────────────────────────────────── */
function ZoomSliderDark({ zoom, pct, onZoomChange }: { zoom: number; pct: number; onZoomChange: (z: number) => void }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
      <div style={{ color: 'rgba(250,246,238,0.7)' }}>
        <ZoomOut size={18} strokeWidth={2}/>
      </div>
      <div className="zoom-track" style={{ flex: 1, position: 'relative', height: 24, display: 'flex', alignItems: 'center' }}>
        <div style={{ position: 'absolute', left: 0, right: 0, height: 4, borderRadius: 999, background: 'rgba(250,246,238,0.18)' }}/>
        <div style={{ position: 'absolute', left: 0, height: 4, borderRadius: 999, width: `${pct}%`, background: '#1F4D3A' }}/>
        <div className="zoom-thumb" style={{ position: 'absolute', left: `calc(${pct}% - 11px)`, width: 22, height: 22, borderRadius: '50%', background: '#1F4D3A', border: '3px solid #fff', boxShadow: '0 2px 6px rgba(0,0,0,0.25)' }}/>
        <input
          type="range" min={1} max={3} step={0.01} value={zoom}
          aria-label="Zoom photo"
          onChange={e => onZoomChange(Number(e.target.value))}
          style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer', width: '100%' }}
        />
      </div>
      <div style={{ color: 'rgba(250,246,238,0.7)' }}>
        <ZoomIn size={18} strokeWidth={2}/>
      </div>
      <div style={{ fontFamily: 'Inter, system-ui, sans-serif', fontSize: 12, color: 'rgba(250,246,238,0.85)', minWidth: 36, textAlign: 'right' }}>
        {zoom.toFixed(1)}×
      </div>
    </div>
  );
}

function ZoomSliderLight({ zoom, pct, onZoomChange }: { zoom: number; pct: number; onZoomChange: (z: number) => void }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
      <div style={{ color: '#3A4A42' }}><ZoomOut size={18} strokeWidth={2}/></div>
      <div className="zoom-track" style={{ flex: 1, position: 'relative', height: 24, display: 'flex', alignItems: 'center' }}>
        <div style={{ position: 'absolute', left: 0, right: 0, height: 4, borderRadius: 999, background: '#E5E0D4' }}/>
        <div style={{ position: 'absolute', left: 0, height: 4, borderRadius: 999, width: `${pct}%`, background: '#1F4D3A' }}/>
        <div className="zoom-thumb" style={{ position: 'absolute', left: `calc(${pct}% - 11px)`, width: 22, height: 22, borderRadius: '50%', background: '#1F4D3A', border: '3px solid #fff', boxShadow: '0 2px 6px rgba(15,31,24,0.25)' }}/>
        <input
          type="range" min={1} max={3} step={0.01} value={zoom}
          aria-label="Zoom photo"
          onChange={e => onZoomChange(Number(e.target.value))}
          style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer', width: '100%' }}
        />
      </div>
      <div style={{ color: '#3A4A42' }}><ZoomIn size={18} strokeWidth={2}/></div>
      <div style={{ fontFamily: 'Inter, system-ui, sans-serif', fontSize: 12, color: '#0F1F18', minWidth: 36, textAlign: 'right' }}>
        {zoom.toFixed(1)}×
      </div>
    </div>
  );
}
