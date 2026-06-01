'use client';

import { useRef } from 'react';
import { Camera, X } from 'lucide-react';
import type { Zone } from '@/types/database';

interface Props {
  zones: Zone[];
  values: Record<string, string>;
  photoUrls: Record<string, string>;
  errors: Record<string, string>;
  onChange: (zoneId: string, value: string) => void;
  onPhotoSelect: (zone: Zone, file: File, srcUrl: string) => void;
  onPhotoClear: (zoneId: string) => void;
  backgroundUrl: string | null;
  backgroundWidth: number | null;
  backgroundHeight: number | null;
}

const PREVIEW_W = 280;

export function CardZoneFill({
  zones, values, photoUrls, errors, onChange, onPhotoSelect, onPhotoClear,
  backgroundUrl, backgroundWidth, backgroundHeight,
}: Props) {
  const inputZones = zones.filter(z => z.type !== 'shape' && z.type !== 'image' && z.type !== 'label' && !z.hidden);
  const scale = backgroundWidth ? PREVIEW_W / backgroundWidth : 1;
  const previewH = backgroundHeight ? backgroundHeight * scale : PREVIEW_W * (7 / 5);

  return (
    <div className="flex flex-col lg:flex-row gap-6">
      {/* ── Form fields ── */}
      <div className="flex-1 min-w-0 space-y-4">
        <p className="text-[13px]" style={{ color: '#6B7A72' }}>
          Personalise your card. It&apos;ll be generated when you confirm.
        </p>
        {inputZones.map(zone => {
          const err = errors[zone.id];
          if (zone.type === 'photo') {
            return (
              <PhotoField
                key={zone.id}
                zone={zone}
                previewUrl={photoUrls[zone.id]}
                error={err}
                onChange={(f, url) => onPhotoSelect(zone, f, url)}
                onClear={() => onPhotoClear(zone.id)}
              />
            );
          }
          if (zone.type === 'custom' && zone.options?.length) {
            return (
              <div key={zone.id}>
                <label className="block text-[12px] font-medium mb-1.5" style={{ color: '#3A4A42' }}>
                  {zone.label ?? 'Select'}{zone.required && <span style={{ color: '#B8423C' }}> *</span>}
                </label>
                <select
                  value={values[zone.id] ?? ''}
                  onChange={e => onChange(zone.id, e.target.value)}
                  className="w-full h-10 px-3 rounded-lg text-[14px] outline-none transition"
                  style={{ background: '#FAF6EE', border: `1px solid ${err ? '#B8423C' : '#E5E0D4'}`, color: '#0F1F18' }}
                >
                  <option value="">Select…</option>
                  {zone.options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                </select>
                {err && <p className="text-[12px] mt-1" style={{ color: '#B8423C' }}>{err}</p>}
              </div>
            );
          }
          const isTextarea = zone.h && zone.h > 80;
          return (
            <div key={zone.id}>
              <label className="block text-[12px] font-medium mb-1.5" style={{ color: '#3A4A42' }}>
                {zone.label ?? 'Text'}{zone.required && <span style={{ color: '#B8423C' }}> *</span>}
              </label>
              {isTextarea ? (
                <textarea
                  value={values[zone.id] ?? ''}
                  onChange={e => onChange(zone.id, e.target.value)}
                  placeholder={zone.placeholder ?? ''}
                  maxLength={zone.maxChars ?? 500}
                  rows={3}
                  className="w-full px-3 py-2.5 rounded-lg text-[14px] outline-none resize-none transition"
                  style={{ background: '#FAF6EE', border: `1px solid ${err ? '#B8423C' : '#E5E0D4'}`, color: '#0F1F18' }}
                  onFocus={e => (e.target.style.borderColor = '#E8C57E')}
                  onBlur={e => (e.target.style.borderColor = err ? '#B8423C' : '#E5E0D4')}
                />
              ) : (
                <input
                  type="text"
                  value={values[zone.id] ?? ''}
                  onChange={e => onChange(zone.id, e.target.value)}
                  placeholder={zone.placeholder ?? ''}
                  maxLength={zone.maxChars ?? 200}
                  className="w-full h-10 px-3 rounded-lg text-[14px] outline-none transition"
                  style={{ background: '#FAF6EE', border: `1px solid ${err ? '#B8423C' : '#E5E0D4'}`, color: '#0F1F18' }}
                  onFocus={e => (e.target.style.borderColor = '#E8C57E')}
                  onBlur={e => (e.target.style.borderColor = err ? '#B8423C' : '#E5E0D4')}
                />
              )}
              {err && <p className="text-[12px] mt-1" style={{ color: '#B8423C' }}>{err}</p>}
            </div>
          );
        })}
      </div>

      {/* ── Live preview ── */}
      {backgroundUrl && (
        <div className="lg:w-[280px] shrink-0">
          <div className="text-[11px] font-mono uppercase tracking-widest mb-2 text-center" style={{ color: '#6B7A72' }}>
            Preview
          </div>
          <div
            className="relative overflow-hidden rounded-xl mx-auto shadow-lift"
            style={{ width: PREVIEW_W, height: previewH }}
          >
            {/* Background */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={backgroundUrl} alt="" className="absolute inset-0 w-full h-full object-cover" />

            {/* Zone overlays */}
            {zones.map(zone => {
              if (zone.hidden) return null;

              const style: React.CSSProperties = {
                position: 'absolute',
                left: zone.x * scale,
                top: zone.y * scale,
                width: zone.w * scale,
                height: zone.h * scale,
                overflow: 'hidden',
              };

              if (zone.type === 'photo') {
                const photoUrl = photoUrls[zone.id];
                const borderRadius =
                  zone.shape === 'circle' ? '50%' :
                  zone.shape === 'rounded' ? `${(zone.cornerRadius ?? 8) * scale}px` : '0';
                return (
                  <div key={zone.id} style={{ ...style, borderRadius, background: 'rgba(255,255,255,0.12)' }}>
                    {photoUrl && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={photoUrl} alt="" className="w-full h-full object-cover" style={{ borderRadius }} />
                    )}
                    {!photoUrl && (
                      <div className="w-full h-full flex items-center justify-center" style={{ borderRadius }}>
                        <Camera size={Math.max(12, zone.w * scale * 0.25)} strokeWidth={1.5} style={{ color: 'rgba(255,255,255,0.4)' }} />
                      </div>
                    )}
                  </div>
                );
              }

              if (zone.type === 'text' || zone.type === 'custom') {
                const text = values[zone.id] ?? zone.sample ?? zone.placeholder ?? '';
                const textColor = zone.color ?? '#FFFFFF';
                const fontSize = Math.max(8, (zone.size ?? 16) * scale);
                const fontWeight = zone.weight ?? 400;
                const textAlign = (zone.align ?? 'left') as React.CSSProperties['textAlign'];
                return (
                  <div
                    key={zone.id}
                    style={{
                      ...style,
                      display: 'flex',
                      alignItems: zone.verticalAlign === 'center' ? 'center' : zone.verticalAlign === 'bottom' ? 'flex-end' : 'flex-start',
                      padding: 2,
                    }}
                  >
                    <span style={{
                      width: '100%',
                      fontSize,
                      fontWeight,
                      color: text ? textColor : 'rgba(255,255,255,0.3)',
                      textAlign,
                      fontFamily: zone.font === 'JetBrains Mono' ? 'JetBrains Mono, monospace' : zone.font === 'DM Sans' ? 'DM Sans, sans-serif' : 'Inter, sans-serif',
                      lineHeight: zone.lineHeight ?? 1.3,
                      letterSpacing: zone.letterSpacing ? `${zone.letterSpacing * scale}px` : undefined,
                      textTransform: zone.textTransform as React.CSSProperties['textTransform'] ?? undefined,
                      overflowWrap: 'break-word',
                      whiteSpace: 'pre-wrap',
                    }}>
                      {text || (zone.placeholder ?? zone.label ?? '')}
                    </span>
                  </div>
                );
              }

              return null;
            })}
          </div>
        </div>
      )}
    </div>
  );
}

function PhotoField({ zone, previewUrl, error, onChange, onClear }: {
  zone: Zone;
  previewUrl: string | undefined;
  error: string | undefined;
  onChange: (file: File, url: string) => void;
  onClear: () => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  return (
    <div>
      <label className="block text-[12px] font-medium mb-1.5" style={{ color: '#3A4A42' }}>
        {zone.label ?? 'Photo'}{zone.required && <span style={{ color: '#B8423C' }}> *</span>}
      </label>
      {previewUrl ? (
        <div className="flex items-center gap-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={previewUrl} alt="Preview"
            className="object-cover"
            style={{
              width: 56, height: 56,
              borderRadius: zone.shape === 'circle' ? '50%' : 8,
              border: '2px solid #E5E0D4',
            }}
          />
          <div className="flex-1 min-w-0">
            <div className="text-[13px] font-medium" style={{ color: '#0F1F18' }}>Photo selected</div>
            <div className="flex gap-2 mt-1">
              <button onClick={() => inputRef.current?.click()} className="text-[12px] font-medium" style={{ color: '#1F4D3A' }}>
                Change
              </button>
              <button onClick={onClear} className="text-[12px]" style={{ color: '#6B7A72' }}>
                Remove
              </button>
            </div>
          </div>
          <button onClick={onClear} className="shrink-0" style={{ color: '#6B7A72' }}>
            <X size={16} strokeWidth={2} />
          </button>
        </div>
      ) : (
        <button
          onClick={() => inputRef.current?.click()}
          className="w-full flex items-center gap-3 px-4 h-16 rounded-xl border-2 border-dashed transition"
          style={{ borderColor: error ? '#B8423C' : '#E5E0D4', background: '#FAF6EE' }}
          onMouseEnter={e => (e.currentTarget.style.borderColor = '#E8C57E')}
          onMouseLeave={e => (e.currentTarget.style.borderColor = error ? '#B8423C' : '#E5E0D4')}
        >
          <Camera size={20} strokeWidth={1.8} style={{ color: '#6B7A72', flexShrink: 0 }} />
          <span className="text-[14px]" style={{ color: '#6B7A72' }}>Click to upload photo</span>
        </button>
      )}
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={e => {
          const file = e.target.files?.[0];
          if (!file) return;
          const url = URL.createObjectURL(file);
          onChange(file, url);
          e.target.value = '';
        }}
      />
      {error && <p className="text-[12px] mt-1" style={{ color: '#B8423C' }}>{error}</p>}
    </div>
  );
}
