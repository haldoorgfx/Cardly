'use client';

/**
 * PhotoCropModal — E1.5
 * Full-screen dark photo cropping overlay using react-easy-crop.
 * Appears on top of the DetailsFormScreen when an attendee picks a photo.
 */

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

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Position your photo"
      style={{
        position: 'fixed', inset: 0, zIndex: 50,
        fontFamily: 'Inter, sans-serif',
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
        <div style={{ padding: '18px 20px 12px', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
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
            display: 'flex', justifyContent: 'center', gap: 6,
            pointerEvents: 'none', zIndex: 2,
          }}>
            {['Drag to reposition', 'Pinch to zoom'].map(hint => (
              <div key={hint} style={{
                padding: '6px 10px',
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
        <div style={{ padding: '16px 20px 22px', background: 'rgba(0,0,0,0.2)', display: 'flex', flexDirection: 'column', gap: 10 }}>
          <button
            onClick={onConfirm}
            style={{
              height: 56, background: '#1F4D3A', color: '#FAF6EE',
              border: 'none', borderRadius: 14,
              fontFamily: 'Inter, sans-serif', fontWeight: 600, fontSize: 16,
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
              cursor: 'pointer',
            }}
          >
            <Check size={18} strokeWidth={2.2}/> Use this photo
          </button>
          <button
            onClick={onReupload}
            style={{
              height: 48, background: 'transparent', color: '#FAF6EE',
              border: '1.5px solid rgba(250,246,238,0.25)', borderRadius: 14,
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
          width: 600, borderRadius: 24,
          background: '#FFFFFF', color: '#0F1F18',
          boxShadow: '0 24px 80px rgba(0,0,0,0.4), 0 4px 12px rgba(0,0,0,0.2)',
          overflow: 'hidden',
        }}>
          {/* Header */}
          <div style={{ padding: '24px 28px 20px', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
            <div>
              <div style={{
                fontFamily: 'Inter, system-ui, sans-serif', fontSize: 11,
                color: '#6B7A72', letterSpacing: '0.1em',
                textTransform: 'uppercase', marginBottom: 6,
              }}>Position photo</div>
              <div style={{
                fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: 700, fontSize: 28,
                letterSpacing: '-0.025em', color: '#0F1F18', lineHeight: 1.15,
              }}>Position your photo</div>
              <div style={{
                fontFamily: 'Inter, sans-serif', fontSize: 14, color: '#6B7A72', marginTop: 6,
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
            margin: '0 28px', borderRadius: 18,
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
              position: 'absolute', top: 14, left: 14, zIndex: 3,
              display: 'inline-flex', alignItems: 'center', gap: 8,
              padding: '6px 12px',
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
                height: 52, padding: '0 22px',
                background: '#FFFFFF', color: '#0F1F18',
                border: '1.5px solid #E5E0D4', borderRadius: 14,
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
                border: 'none', borderRadius: 14,
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
      <div style={{ flex: 1, position: 'relative', height: 24, display: 'flex', alignItems: 'center' }}>
        <div style={{ position: 'absolute', left: 0, right: 0, height: 4, borderRadius: 999, background: 'rgba(250,246,238,0.18)' }}/>
        <div style={{ position: 'absolute', left: 0, height: 4, borderRadius: 999, width: `${pct}%`, background: '#1F4D3A' }}/>
        <div style={{ position: 'absolute', left: `calc(${pct}% - 11px)`, width: 22, height: 22, borderRadius: '50%', background: '#1F4D3A', border: '3px solid #fff', boxShadow: '0 2px 6px rgba(0,0,0,0.25)' }}/>
        <input
          type="range" min={1} max={3} step={0.01} value={zoom}
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
      <div style={{ flex: 1, position: 'relative', height: 24, display: 'flex', alignItems: 'center' }}>
        <div style={{ position: 'absolute', left: 0, right: 0, height: 4, borderRadius: 999, background: '#E5E0D4' }}/>
        <div style={{ position: 'absolute', left: 0, height: 4, borderRadius: 999, width: `${pct}%`, background: '#1F4D3A' }}/>
        <div style={{ position: 'absolute', left: `calc(${pct}% - 11px)`, width: 22, height: 22, borderRadius: '50%', background: '#1F4D3A', border: '3px solid #fff', boxShadow: '0 2px 6px rgba(15,31,24,0.25)' }}/>
        <input
          type="range" min={1} max={3} step={0.01} value={zoom}
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
