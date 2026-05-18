'use client';

/**
 * DetailsFormScreen — E1
 * Form with live card preview. Mobile: stacked. Desktop (lg+): two-column sticky-preview.
 */

import { useRef, type ChangeEvent } from 'react';
import { Eye, Pencil, Image as ImageIcon, AlertCircle, ChevronDown, ArrowLeft, Loader2 } from 'lucide-react';
import type { Zone } from '@/types/database';
import EventBrandStrip from './EventBrandStrip';
import EventCardPreview from './EventCardPreview';

interface Props {
  eventName: string;
  backgroundUrl: string;
  backgroundWidth: number;
  backgroundHeight: number;
  zones: Zone[];
  editableZones: Zone[];
  values: Record<string, string>;
  photoUrls: Record<string, string>;
  photoFiles: Record<string, File>;
  errors: Record<string, string>;
  isGenerating: boolean;
  generateError: string;
  allRequiredFilled: boolean;
  onValueChange: (zoneId: string, value: string) => void;
  onPhotoSelect: (zoneId: string, file: File) => void;
  onGenerate: () => void;
  onBack: () => void;
}

/* ── Field primitives ────────────────────────────────────────────────────── */

function FieldLabel({ children, required }: { children: React.ReactNode; required?: boolean }) {
  return (
    <label style={{
      display: 'flex', alignItems: 'center', gap: 4,
      fontFamily: 'JetBrains Mono, monospace',
      fontSize: 12, color: '#3A4A42',
      letterSpacing: '0.02em', marginBottom: 6, textTransform: 'lowercase',
    }}>
      <span>{children}</span>
      {required && <span style={{ color: '#1F4D3A' }}>*</span>}
    </label>
  );
}

function FieldError({ children }: { children: React.ReactNode }) {
  return (
    <div role="alert" aria-live="polite" style={{
      display: 'flex', alignItems: 'center', gap: 6, marginTop: 6,
      fontFamily: 'Inter, sans-serif', fontSize: 13, color: '#B8423C',
    }}>
      <AlertCircle size={14} strokeWidth={2}/>
      <span>{children}</span>
    </div>
  );
}

function TextInput({
  zone, value, error, onChange,
}: { zone: Zone; value: string; error?: string; onChange: (v: string) => void }) {
  return (
    <div>
      <FieldLabel required={zone.required}>{zone.label || 'Field'}</FieldLabel>
      <input
        type="text"
        value={value}
        placeholder={zone.placeholder || zone.label || ''}
        onChange={e => onChange(e.target.value)}
        style={{
          display: 'block', width: '100%', height: 56,
          padding: '0 16px',
          background: '#FFFFFF',
          border: `1.5px solid ${error ? '#B8423C' : '#E5E0D4'}`,
          borderRadius: 14,
          fontFamily: 'Inter, sans-serif', fontSize: 16, fontWeight: 500,
          color: '#0F1F18',
          outline: 'none',
          transition: 'border-color .2s, box-shadow .2s',
          boxSizing: 'border-box',
        }}
        onFocus={e => { e.target.style.borderColor = '#1F4D3A'; e.target.style.boxShadow = '0 0 0 3px rgba(31,77,58,0.15)'; }}
        onBlur={e => { e.target.style.borderColor = error ? '#B8423C' : '#E5E0D4'; e.target.style.boxShadow = 'none'; }}
      />
      {error && <FieldError>{error}</FieldError>}
    </div>
  );
}

function TextAreaInput({
  zone, value, error, onChange,
}: { zone: Zone; value: string; error?: string; onChange: (v: string) => void }) {
  return (
    <div>
      <FieldLabel required={zone.required}>{zone.label || 'Field'}</FieldLabel>
      <textarea
        value={value}
        placeholder={zone.placeholder || zone.label || ''}
        onChange={e => onChange(e.target.value)}
        rows={3}
        style={{
          display: 'block', width: '100%',
          padding: '14px 16px',
          background: '#FFFFFF',
          border: `1.5px solid ${error ? '#B8423C' : '#E5E0D4'}`,
          borderRadius: 14,
          fontFamily: 'Inter, sans-serif', fontSize: 16, fontWeight: 500,
          color: '#0F1F18', lineHeight: 1.5,
          outline: 'none', resize: 'vertical',
          transition: 'border-color .2s, box-shadow .2s',
          boxSizing: 'border-box',
        }}
        onFocus={e => { e.target.style.borderColor = '#1F4D3A'; e.target.style.boxShadow = '0 0 0 3px rgba(31,77,58,0.15)'; }}
        onBlur={e => { e.target.style.borderColor = error ? '#B8423C' : '#E5E0D4'; e.target.style.boxShadow = 'none'; }}
      />
      {error && <FieldError>{error}</FieldError>}
    </div>
  );
}

function PhotoInput({
  zone, photoUrl, photoFile, error, onSelect,
}: {
  zone: Zone;
  photoUrl?: string;
  photoFile?: File;
  error?: string;
  onSelect: (file: File) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) onSelect(file);
    e.target.value = '';
  };

  return (
    <div>
      <FieldLabel required={zone.required}>{zone.label || 'Photo'}</FieldLabel>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="sr-only"
        onChange={handleChange}
      />
      {photoFile ? (
        /* Filled state */
        <div style={{
          height: 72, padding: '12px 14px',
          background: '#FFFFFF',
          border: '1.5px solid #E5E0D4',
          borderRadius: 14,
          display: 'flex', alignItems: 'center', gap: 14,
        }}>
          {photoUrl ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img src={photoUrl} alt="" style={{
              width: 48, height: 48, borderRadius: '50%', objectFit: 'cover', flexShrink: 0,
            }}/>
          ) : (
            <div style={{
              width: 48, height: 48, borderRadius: '50%',
              background: '#E8EFEB', flexShrink: 0,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <ImageIcon size={20} strokeWidth={1.5} color="#1F4D3A"/>
            </div>
          )}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{
              fontFamily: 'Inter, sans-serif', fontWeight: 600, fontSize: 14,
              color: '#0F1F18',
              whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
            }}>{photoFile.name}</div>
            <div style={{ fontFamily: 'Inter, sans-serif', fontSize: 12, color: '#6B7A72', marginTop: 2 }}>
              {(photoFile.size / 1024 / 1024).toFixed(1)} MB · cropped
            </div>
          </div>
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            style={{
              background: 'transparent', border: 'none', cursor: 'pointer',
              fontFamily: 'Inter, sans-serif', fontSize: 14, fontWeight: 600,
              color: '#1F4D3A', padding: '6px 10px',
            }}
          >Change</button>
        </div>
      ) : (
        /* Empty state */
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          style={{
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center', gap: 8,
            width: '100%', height: 120,
            background: '#FFFFFF',
            border: `1.5px dashed ${error ? '#B8423C' : '#C9C3B1'}`,
            borderRadius: 14, cursor: 'pointer',
            transition: 'border-color .2s, background .2s',
          }}
          onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = '#E8EFEB'; }}
          onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = '#FFFFFF'; }}
        >
          <div style={{
            width: 42, height: 42, borderRadius: 12,
            background: '#E8EFEB', color: '#1F4D3A',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <ImageIcon size={20} strokeWidth={2}/>
          </div>
          <div style={{ fontFamily: 'Inter, sans-serif', fontWeight: 600, fontSize: 15, color: '#0F1F18' }}>
            Tap to add photo
          </div>
          <div style={{ fontFamily: 'Inter, sans-serif', fontSize: 12, color: '#6B7A72' }}>
            JPG or PNG · under 10 MB
          </div>
        </button>
      )}
      {error && <FieldError>{error}</FieldError>}
    </div>
  );
}

function SelectInput({
  zone, value, error, onChange,
}: { zone: Zone; value: string; error?: string; onChange: (v: string) => void }) {
  if (!zone.options?.length) {
    return (
      <TextInput zone={zone} value={value} error={error} onChange={onChange}/>
    );
  }
  return (
    <div>
      <FieldLabel required={zone.required}>{zone.label || 'Field'}</FieldLabel>
      <div style={{ position: 'relative' }}>
        <select
          value={value}
          onChange={e => onChange(e.target.value)}
          style={{
            display: 'block', width: '100%', height: 56,
            padding: '0 40px 0 16px',
            background: '#FFFFFF',
            border: `1.5px solid ${error ? '#B8423C' : '#E5E0D4'}`,
            borderRadius: 14,
            fontFamily: 'Inter, sans-serif', fontSize: 16, fontWeight: 500,
            color: value ? '#0F1F18' : '#6B7A72',
            outline: 'none', appearance: 'none',
            cursor: 'pointer',
            boxSizing: 'border-box',
          }}
        >
          <option value="" disabled>{zone.placeholder || `Select ${zone.label || ''}`}</option>
          {zone.options.map(opt => (
            <option key={opt} value={opt}>{opt}</option>
          ))}
        </select>
        <ChevronDown size={18} strokeWidth={2} style={{
          position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)',
          color: '#6B7A72', pointerEvents: 'none',
        }}/>
      </div>
      {error && <FieldError>{error}</FieldError>}
    </div>
  );
}

/* ── Group header ────────────────────────────────────────────────────────── */
function GroupHeader({ index, title, subtitle }: { index: number; title: string; subtitle?: string }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{
          width: 22, height: 22, borderRadius: '50%',
          background: '#1F4D3A', color: '#FAF6EE',
          fontFamily: 'DM Sans, sans-serif', fontWeight: 700, fontSize: 12,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0,
        }}>{index}</div>
        <div style={{
          fontFamily: 'DM Sans, sans-serif', fontWeight: 600, fontSize: 16,
          color: '#0F1F18', letterSpacing: '-0.01em',
        }}>{title}</div>
      </div>
      {subtitle && (
        <div style={{
          fontFamily: 'Inter, sans-serif', fontSize: 13, color: '#6B7A72',
          marginTop: 4, marginLeft: 32,
        }}>{subtitle}</div>
      )}
    </div>
  );
}

/* ── Zone → field renderer ───────────────────────────────────────────────── */
function ZoneField({
  zone, value, photoUrl, photoFile, error, onValueChange, onPhotoSelect,
}: {
  zone: Zone;
  value: string; photoUrl?: string; photoFile?: File; error?: string;
  onValueChange: (v: string) => void;
  onPhotoSelect: (f: File) => void;
}) {
  if (zone.type === 'photo') {
    return (
      <PhotoInput
        zone={zone}
        photoUrl={photoUrl}
        photoFile={photoFile}
        error={error}
        onSelect={onPhotoSelect}
      />
    );
  }
  if (zone.type === 'custom' && zone.options?.length) {
    return <SelectInput zone={zone} value={value} error={error} onChange={onValueChange}/>;
  }
  // Use textarea when zone is notably taller than a single-line field (h > 80px)
  if (zone.h > 80) {
    return <TextAreaInput zone={zone} value={value} error={error} onChange={onValueChange}/>;
  }
  return <TextInput zone={zone} value={value} error={error} onChange={onValueChange}/>;
}

/* ── Main form body ──────────────────────────────────────────────────────── */
function FormBody({
  editableZones, values, photoUrls, photoFiles, errors, onValueChange, onPhotoSelect,
}: {
  editableZones: Zone[];
  values: Record<string, string>;
  photoUrls: Record<string, string>;
  photoFiles: Record<string, File>;
  errors: Record<string, string>;
  onValueChange: (id: string, v: string) => void;
  onPhotoSelect: (id: string, f: File) => void;
}) {
  const textZones  = editableZones.filter(z => z.type === 'text' || z.type === 'custom');
  const photoZones = editableZones.filter(z => z.type === 'photo');

  let groupIndex = 0;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
      {textZones.length > 0 && (
        <div>
          <GroupHeader
            index={++groupIndex}
            title="About you"
            subtitle="This is what shows on your card."
          />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {textZones.map(z => (
              <ZoneField
                key={z.id} zone={z}
                value={values[z.id] ?? ''}
                error={errors[z.id]}
                onValueChange={v => onValueChange(z.id, v)}
                onPhotoSelect={f => onPhotoSelect(z.id, f)}
              />
            ))}
          </div>
        </div>
      )}

      {photoZones.length > 0 && (
        <div>
          <GroupHeader
            index={++groupIndex}
            title="Your photo"
            subtitle="Square photo crops best — we'll help you align it."
          />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {photoZones.map(z => (
              <ZoneField
                key={z.id} zone={z}
                value={values[z.id] ?? ''}
                photoUrl={photoUrls[z.id]}
                photoFile={photoFiles[z.id]}
                error={errors[z.id]}
                onValueChange={v => onValueChange(z.id, v)}
                onPhotoSelect={f => onPhotoSelect(z.id, f)}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/* ── THE SCREEN ──────────────────────────────────────────────────────────── */
export default function DetailsFormScreen({
  eventName, backgroundUrl, backgroundWidth, backgroundHeight, zones, editableZones,
  values, photoUrls, photoFiles, errors, isGenerating, generateError, allRequiredFilled,
  onValueChange, onPhotoSelect, onGenerate, onBack,
}: Props) {
  const disabled = !allRequiredFilled || isGenerating;

  const GenerateBtn = ({ fullWidth = true }: { fullWidth?: boolean }) => (
    <button
      onClick={onGenerate}
      disabled={disabled}
      style={{
        width: fullWidth ? '100%' : 'auto',
        height: 56, padding: '0 28px',
        background: disabled ? '#E8EFEB' : '#1F4D3A',
        color: disabled ? '#6B7A72' : '#FAF6EE',
        border: 'none', borderRadius: 14,
        fontFamily: 'Inter, sans-serif', fontWeight: 600, fontSize: 16,
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 10,
        cursor: disabled ? 'not-allowed' : 'pointer',
        boxShadow: disabled ? 'none' : '0 1px 2px rgba(15,31,24,0.04), 0 8px 24px rgba(31,77,58,0.18)',
        transition: 'background .2s, color .2s',
      }}
    >
      {isGenerating ? (
        <><Loader2 size={18} strokeWidth={2} style={{ animation: 'spin 1s linear infinite' }}/><span>Generating…</span></>
      ) : (
        <span>Preview my card →</span>
      )}
    </button>
  );

  return (
    <>
      {/* ── Mobile / tablet ─────────────────────────────────────────────── */}
      <div className="relative lg:hidden" style={{ background: '#FAF6EE', minHeight: '100vh' }}>
        <div style={{ padding: '16px 20px 100px' }}>
          {/* Brand strip */}
          <EventBrandStrip eventName={eventName} compact />

          {/* Live preview card */}
          <div style={{
            marginTop: 14,
            background: '#FFFFFF',
            border: '1px solid #E5E0D4',
            borderRadius: 20,
            padding: '14px 14px 18px',
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
          }}>
            <div style={{
              alignSelf: 'flex-start',
              display: 'inline-flex', alignItems: 'center', gap: 6,
              padding: '4px 10px',
              background: '#E8EFEB', borderRadius: 999,
              fontFamily: 'JetBrains Mono, monospace',
              fontSize: 10, letterSpacing: '0.08em', textTransform: 'uppercase',
              color: '#1F4D3A',
            }}>
              <Eye size={11} strokeWidth={2.2}/> <span>Live preview</span>
            </div>
            <div className="w-full max-w-[300px]">
              <EventCardPreview
                backgroundUrl={backgroundUrl}
                backgroundWidth={backgroundWidth}
                backgroundHeight={backgroundHeight}
                zones={zones}
                values={values}
                photoUrls={photoUrls}
              />
            </div>
          </div>

          {/* Form */}
          <div style={{ marginTop: 20 }}>
            <FormBody
              editableZones={editableZones}
              values={values}
              photoUrls={photoUrls}
              photoFiles={photoFiles}
              errors={errors}
              onValueChange={onValueChange}
              onPhotoSelect={onPhotoSelect}
            />
          </div>

          {generateError && (
            <div style={{
              marginTop: 16,
              padding: '12px 14px',
              background: '#F6E3E1',
              border: '1px solid #B8423C',
              borderRadius: 12,
              fontFamily: 'Inter, sans-serif', fontSize: 13, color: '#B8423C',
            }}>
              {generateError}
            </div>
          )}
        </div>

        {/* Sticky bottom CTA */}
        <div style={{
          position: 'fixed', left: 0, right: 0, bottom: 0, zIndex: 20,
          padding: '14px 20px 20px',
          background: 'rgba(250,246,238,0.92)',
          backdropFilter: 'blur(14px)',
          WebkitBackdropFilter: 'blur(14px)',
          borderTop: '1px solid #E5E0D4',
        }}>
          <GenerateBtn/>
        </div>
      </div>

      {/* ── Desktop: two-column ─────────────────────────────────────────── */}
      <div
        className="hidden lg:grid"
        style={{
          height: '100vh', overflow: 'hidden',
          background: '#FAF6EE',
          gridTemplateColumns: '58% 42%',
        }}
      >
        {/* Left: sticky card preview */}
        <div style={{
          display: 'flex', flexDirection: 'column', gap: 24,
          padding: '32px 40px',
          background: 'linear-gradient(180deg, rgba(232,239,235,0.55) 0%, rgba(232,239,235,0) 100%)',
          overflow: 'hidden',
        }}>
          <div style={{ maxWidth: 460 }}>
            <EventBrandStrip eventName={eventName} compact />
          </div>

          <div style={{
            flex: 1, display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center', gap: 16,
          }}>
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              padding: '4px 10px',
              background: '#E8EFEB', borderRadius: 999,
              fontFamily: 'JetBrains Mono, monospace',
              fontSize: 10, letterSpacing: '0.08em', textTransform: 'uppercase',
              color: '#1F4D3A',
            }}>
              <Eye size={11} strokeWidth={2.2}/> <span>Live preview</span>
            </div>
            <div style={{ width: '100%', maxWidth: 420 }}>
              <EventCardPreview
                backgroundUrl={backgroundUrl}
                backgroundWidth={backgroundWidth}
                backgroundHeight={backgroundHeight}
                zones={zones}
                values={values}
                photoUrls={photoUrls}
                style={{
                  borderRadius: 16,
                  boxShadow: '0 4px 12px rgba(15,31,24,0.08), 0 24px 60px rgba(31,77,58,0.10)',
                }}
              />
            </div>
            <div style={{
              fontFamily: 'Inter, sans-serif', fontSize: 13, color: '#6B7A72',
              display: 'flex', alignItems: 'center', gap: 6,
            }}>
              <Pencil size={13} strokeWidth={2}/> Updates as you type
            </div>
          </div>
        </div>

        {/* Right: scrollable form */}
        <div style={{
          display: 'flex', flexDirection: 'column',
          background: '#FAF6EE',
          borderLeft: '1px solid #E5E0D4',
          height: '100vh', overflow: 'hidden',
        }}>
          {/* Header */}
          <div style={{ padding: '36px 40px 24px', flexShrink: 0 }}>
            <button
              onClick={onBack}
              style={{
                background: 'transparent', border: 'none', cursor: 'pointer',
                display: 'inline-flex', alignItems: 'center', gap: 6,
                fontFamily: 'Inter, sans-serif', fontSize: 13, color: '#6B7A72',
                padding: 0, marginBottom: 16,
              }}
            >
              <ArrowLeft size={14} strokeWidth={2}/> Back
            </button>
            <h1 style={{
              fontFamily: 'DM Sans, sans-serif', fontWeight: 700, fontSize: 28,
              letterSpacing: '-0.025em', lineHeight: 1.15, margin: 0, color: '#0F1F18',
            }}>Tell us about you</h1>
            <p style={{
              fontFamily: 'Inter, sans-serif', fontSize: 14, lineHeight: 1.5,
              color: '#6B7A72', margin: '8px 0 0',
            }}>
              The preview on the left updates as you type. Required fields are marked with{' '}
              <span style={{ color: '#1F4D3A' }}>*</span>.
            </p>
          </div>

          {/* Scrollable form area */}
          <div style={{ padding: '4px 40px 24px', overflowY: 'auto', flex: 1 }}>
            <FormBody
              editableZones={editableZones}
              values={values}
              photoUrls={photoUrls}
              photoFiles={photoFiles}
              errors={errors}
              onValueChange={onValueChange}
              onPhotoSelect={onPhotoSelect}
            />
            {generateError && (
              <div style={{
                marginTop: 16,
                padding: '12px 14px',
                background: '#F6E3E1',
                border: '1px solid #B8423C',
                borderRadius: 12,
                fontFamily: 'Inter, sans-serif', fontSize: 13, color: '#B8423C',
              }}>
                {generateError}
              </div>
            )}
          </div>

          {/* Sticky bottom */}
          <div style={{
            padding: '16px 40px 24px',
            borderTop: '1px solid #E5E0D4',
            background: '#FFFFFF',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16,
            flexShrink: 0,
          }}>
            <div style={{ fontFamily: 'Inter, sans-serif', fontSize: 13, color: '#6B7A72' }}>
              You can edit anything before downloading.
            </div>
            <GenerateBtn fullWidth={false}/>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </>
  );
}
