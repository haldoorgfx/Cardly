'use client';

import { useState, useRef } from 'react';
import type { Zone } from '@/types/database';

interface Props {
  eventId: string;
  eventName: string;
  backgroundUrl: string;
  backgroundWidth: number;
  backgroundHeight: number;
  zones: Zone[];
}

type FieldValues = Record<string, string>;

export default function AttendeeClient({ eventId, eventName, backgroundUrl, backgroundWidth, backgroundHeight, zones }: Props) {
  const [values, setValues] = useState<FieldValues>({});
  const [photoFiles, setPhotoFiles] = useState<Record<string, File>>({});
  const [photoUrls, setPhotoUrls] = useState<Record<string, string>>({});
  const [generating, setGenerating] = useState(false);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [error, setError] = useState('');
  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  const textZones = zones.filter(z => z.type === 'text' || z.type === 'custom');
  const photoZones = zones.filter(z => z.type === 'photo');

  const handlePhotoSelect = (zoneId: string, file: File) => {
    const url = URL.createObjectURL(file);
    setPhotoFiles(p => ({ ...p, [zoneId]: file }));
    setPhotoUrls(u => ({ ...u, [zoneId]: url }));
  };

  const isComplete = () => {
    for (const z of zones) {
      if (!z.required) continue;
      if (z.type === 'photo') {
        if (!photoFiles[z.id]) return false;
      } else {
        if (!values[z.id]?.trim()) return false;
      }
    }
    return true;
  };

  const handleGenerate = async () => {
    setGenerating(true);
    setError('');
    try {
      const formData = new FormData();
      formData.append('eventId', eventId);
      formData.append('fields', JSON.stringify(values));

      for (const [zoneId, file] of Object.entries(photoFiles)) {
        formData.append(`photo_${zoneId}`, file);
      }

      const res = await fetch('/api/render', { method: 'POST', body: formData });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? 'Generation failed');
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      setResultUrl(url);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Something went wrong');
      setGenerating(false);
    }
  };

  const handleDownload = () => {
    if (!resultUrl) return;
    const a = document.createElement('a');
    a.href = resultUrl;
    a.download = `${eventName.toLowerCase().replace(/\s+/g, '-')}-card.png`;
    a.click();
  };

  // Show success/preview screen
  if (resultUrl) {
    return (
      <div className="min-h-screen bg-[#0f0f1a] flex flex-col items-center justify-center px-4 py-8">
        <div className="w-full max-w-[375px]">
          <div className="text-center mb-6">
            <div className="inline-flex h-12 w-12 rounded-full items-center justify-center text-white mb-3" style={{ background: 'linear-gradient(135deg,#6c63ff,#f8a4d8)' }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
            <h2 className="font-display font-bold text-white text-[24px]">Your card is ready!</h2>
            <p className="text-white/60 text-[14px] mt-1">Download and share on social media</p>
          </div>

          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={resultUrl} alt="Your card" className="w-full rounded-2xl shadow-lift mb-6" />

          <button
            onClick={handleDownload}
            className="w-full py-4 rounded-2xl font-display font-bold text-[16px] text-white mb-3 hover:opacity-95 transition"
            style={{ background: 'linear-gradient(135deg,#6c63ff,#f8a4d8)' }}
          >
            Download PNG
          </button>

          <div className="grid grid-cols-2 gap-3 mb-6">
            <a
              href={`https://wa.me/?text=${encodeURIComponent(`Check out my card for ${eventName}! ✨`)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="py-3 rounded-2xl text-[14px] font-medium text-white text-center"
              style={{ background: '#25D366' }}
            >
              Share on WhatsApp
            </a>
            <a
              href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(`I'm attending ${eventName}! ✨`)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="py-3 rounded-2xl text-[14px] font-medium text-white text-center bg-black border border-white/20"
            >
              Share on X
            </a>
          </div>

          <button
            onClick={() => { setResultUrl(null); setGenerating(false); }}
            className="w-full text-center text-[13px] text-white/50 hover:text-white/70"
          >
            ← Edit my info
          </button>

          <div className="mt-8 text-center text-[11px] font-mono text-white/30">
            Made with Cardly
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0f0f1a] flex flex-col items-center justify-start px-4 pt-8 pb-24">
      {/* Event header */}
      <div className="w-full max-w-[375px] mb-6">
        <div className="text-center">
          <div className="text-[11px] font-mono tracking-widest text-white/40 mb-1">GET YOUR CARD</div>
          <h1 className="font-display font-bold text-white text-[24px] leading-tight">{eventName}</h1>
        </div>
      </div>

      {/* Live card preview */}
      <div className="w-full max-w-[375px] relative mb-8">
        <div className="relative overflow-hidden rounded-2xl shadow-lift" style={{ aspectRatio: `${backgroundWidth}/${backgroundHeight}` }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={backgroundUrl} alt={eventName} className="w-full h-full object-cover" draggable={false} />

          {/* Live zone overlays */}
          {zones.map(z => {
            const left = (z.x / backgroundWidth) * 100;
            const top = (z.y / backgroundHeight) * 100;
            const width = (z.w / backgroundWidth) * 100;
            const height = (z.h / backgroundHeight) * 100;

            if (z.type === 'photo') {
              const photoUrl = photoUrls[z.id];
              return (
                <button
                  key={z.id}
                  onClick={() => fileInputRefs.current[z.id]?.click()}
                  className="absolute overflow-hidden border-2 border-white/40 hover:border-white/70 transition"
                  style={{
                    left: `${left}%`, top: `${top}%`, width: `${width}%`, height: `${height}%`,
                    borderRadius: z.shape === 'circle' ? '50%' : z.shape === 'rounded' ? '20%' : '4px',
                  }}
                >
                  {photoUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={photoUrl} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-white/10 backdrop-blur-sm flex items-center justify-center text-white/70">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="8.5" cy="8.5" r="1.5" />
                        <polyline points="21 15 16 10 5 21" />
                      </svg>
                    </div>
                  )}
                </button>
              );
            }

            // Text zone live preview
            const val = values[z.id];
            if (!val) return null;
            return (
              <div
                key={z.id}
                className="absolute pointer-events-none overflow-hidden flex items-center"
                style={{
                  left: `${left}%`, top: `${top}%`, width: `${width}%`, height: `${height}%`,
                  justifyContent: z.align === 'center' ? 'center' : z.align === 'right' ? 'flex-end' : 'flex-start',
                }}
              >
                <span
                  style={{
                    fontFamily: z.font,
                    fontWeight: z.weight,
                    fontSize: `${(z.size ?? 32) * (375 / backgroundWidth)}px`,
                    color: z.color,
                    lineHeight: 1.1,
                    textAlign: z.align,
                    wordBreak: 'break-word',
                  }}
                >
                  {val}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Form */}
      <div className="w-full max-w-[375px] space-y-4">
        {textZones.map(z => (
          <div key={z.id}>
            <label className="block text-[12px] font-mono text-white/50 mb-1.5">
              {z.label.toUpperCase()}{z.required && ' *'}
            </label>
            <input
              type="text"
              placeholder={z.placeholder ?? z.label}
              value={values[z.id] ?? ''}
              onChange={e => setValues(v => ({ ...v, [z.id]: e.target.value }))}
              className="w-full h-12 px-4 rounded-xl bg-white/10 border border-white/20 text-white placeholder-white/30 text-[15px] focus:outline-none focus:border-[#6c63ff]/60 focus:bg-white/15 transition"
            />
          </div>
        ))}

        {photoZones.map(z => (
          <div key={z.id}>
            <label className="block text-[12px] font-mono text-white/50 mb-1.5">
              {z.label.toUpperCase()}{z.required && ' *'}
            </label>
            <button
              onClick={() => fileInputRefs.current[z.id]?.click()}
              className="w-full h-16 rounded-xl border-2 border-dashed border-white/20 hover:border-white/40 transition flex items-center justify-center gap-3 text-white/60 hover:text-white/80"
            >
              {photoUrls[z.id] ? (
                <>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={photoUrls[z.id]} alt="" className="h-10 w-10 rounded-full object-cover" />
                  <span className="text-[13px]">Change photo</span>
                </>
              ) : (
                <>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="8.5" cy="8.5" r="1.5" />
                    <polyline points="21 15 16 10 5 21" />
                  </svg>
                  <span className="text-[14px]">Tap to add photo</span>
                </>
              )}
            </button>
            <input
              ref={el => { fileInputRefs.current[z.id] = el; }}
              type="file"
              accept="image/*"
              capture="user"
              className="hidden"
              onChange={e => { const f = e.target.files?.[0]; if (f) handlePhotoSelect(z.id, f); }}
            />
          </div>
        ))}

        {error && (
          <div className="px-4 py-3 rounded-xl bg-rose-500/20 border border-rose-500/40 text-[13px] text-rose-300">{error}</div>
        )}
      </div>

      {/* Sticky CTA */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-[#0f0f1a]/90 backdrop-blur-sm border-t border-white/10">
        <div className="max-w-[375px] mx-auto">
          <button
            disabled={!isComplete() || generating}
            onClick={handleGenerate}
            className={`w-full h-14 rounded-2xl font-display font-bold text-[16px] transition ${isComplete() && !generating ? 'text-white hover:opacity-95' : 'bg-white/10 text-white/40 cursor-not-allowed'}`}
            style={isComplete() && !generating ? { background: 'linear-gradient(135deg,#6c63ff,#f8a4d8)' } : {}}
          >
            {generating ? (
              <span className="flex items-center justify-center gap-2">
                <span className="h-4 w-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                Generating your card…
              </span>
            ) : (
              'Generate my card'
            )}
          </button>
          <div className="text-center mt-2 text-[11px] font-mono text-white/30">Made with Cardly</div>
        </div>
      </div>
    </div>
  );
}
