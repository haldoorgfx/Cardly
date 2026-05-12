'use client';

import { useState, useRef, useEffect } from 'react';
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

const COUNTRIES = [
  'Lagos, Nigeria', 'Abuja, Nigeria', 'Cape Town, South Africa', 'Johannesburg, South Africa',
  'Nairobi, Kenya', 'Accra, Ghana', 'Kigali, Rwanda', 'Dakar, Senegal', 'Cairo, Egypt',
  'Addis Ababa, Ethiopia', 'Kampala, Uganda', 'Dar es Salaam, Tanzania', 'Lusaka, Zambia',
  'Harare, Zimbabwe', 'Maputo, Mozambique', 'Douala, Cameroon', 'Tunis, Tunisia',
  'Casablanca, Morocco', 'London, UK', 'New York, USA', 'Toronto, Canada', 'Dubai, UAE',
  'Amsterdam, Netherlands', 'Berlin, Germany', 'Paris, France', 'Other',
];

const AVATAR_PRESETS = [
  { id: 'a', gradient: 'linear-gradient(135deg,#ffd28a,#f8a4d8)' },
  { id: 'b', gradient: 'linear-gradient(135deg,#7be0c0,#6c63ff)' },
  { id: 'c', gradient: 'linear-gradient(135deg,#f8a4d8,#6c63ff)' },
  { id: 'd', gradient: 'linear-gradient(135deg,#1f8a5b,#ffd28a)' },
];

type Screen = 'form' | 'generating' | 'result' | 'success';

function Confetti() {
  const pieces = Array.from({ length: 20 }).map((_, i) => ({
    left: `${5 + (i / 19) * 90}%`,
    color: ['#6c63ff', '#f8a4d8', '#ffd28a', '#7be0c0', '#ff6058'][i % 5],
    delay: `${(i * 0.07).toFixed(2)}s`,
    dur: `${3 + (i % 4) * 0.5}s`,
  }));
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-50">
      {pieces.map((p, i) => (
        <div
          key={i}
          className="absolute w-2 h-2 rounded-sm"
          style={{
            left: p.left,
            top: '-10px',
            background: p.color,
            animation: `confettiFall ${p.dur} ease-in ${p.delay} forwards`,
          }}
        />
      ))}
      <style>{`
        @keyframes confettiFall {
          0% { transform: translateY(0) rotate(0deg); opacity: 1; }
          100% { transform: translateY(100vh) rotate(720deg); opacity: 0; }
        }
      `}</style>
    </div>
  );
}

export default function AttendeeClient({ eventId, eventName, backgroundUrl, backgroundWidth, backgroundHeight, zones }: Props) {
  const [values, setValues] = useState<FieldValues>({});
  const [photoFiles, setPhotoFiles] = useState<Record<string, File>>({});
  const [photoUrls, setPhotoUrls] = useState<Record<string, string>>({});
  const [selectedAvatar, setSelectedAvatar] = useState<string | null>(null);
  const [avatarPickerOpen, setAvatarPickerOpen] = useState<string | null>(null);
  const [screen, setScreen] = useState<Screen>('form');
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [toast, setToast] = useState<string | null>(null);
  const [downloaded, setDownloaded] = useState(false);
  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  const textZones = zones.filter(z => z.type === 'text' || z.type === 'custom');
  const photoZones = zones.filter(z => z.type === 'photo');

  // Progress bar
  const requiredZones = zones.filter(z => z.required);
  const filledCount = requiredZones.filter(z => {
    if (z.type === 'photo') return !!photoFiles[z.id] || !!selectedAvatar;
    return !!values[z.id]?.trim();
  }).length;
  const progressPct = requiredZones.length > 0 ? (filledCount / requiredZones.length) * 100 : 100;

  const isComplete = () => {
    for (const z of zones) {
      if (!z.required) continue;
      if (z.type === 'photo') {
        if (!photoFiles[z.id] && !selectedAvatar) return false;
      } else {
        if (!values[z.id]?.trim()) return false;
      }
    }
    return true;
  };

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2200);
  };

  const handlePhotoSelect = (zoneId: string, file: File) => {
    const url = URL.createObjectURL(file);
    setPhotoFiles(p => ({ ...p, [zoneId]: file }));
    setPhotoUrls(u => ({ ...u, [zoneId]: url }));
    setSelectedAvatar(null);
    setAvatarPickerOpen(null);
  };

  const handleAvatarSelect = (zoneId: string, avatarId: string) => {
    setSelectedAvatar(avatarId);
    setPhotoFiles(p => { const n = { ...p }; delete n[zoneId]; return n; });
    setPhotoUrls(u => { const n = { ...u }; delete n[zoneId]; return n; });
    setAvatarPickerOpen(null);
  };

  // Close avatar picker on outside click
  useEffect(() => {
    const handler = () => setAvatarPickerOpen(null);
    if (avatarPickerOpen) {
      setTimeout(() => window.addEventListener('click', handler), 10);
    }
    return () => window.removeEventListener('click', handler);
  }, [avatarPickerOpen]);

  const handleGenerate = async () => {
    setScreen('generating');
    setError('');
    try {
      const formData = new FormData();
      formData.append('eventId', eventId);
      formData.append('fields', JSON.stringify(values));

      for (const [zoneId, file] of Object.entries(photoFiles)) {
        formData.append(`photo_${zoneId}`, file);
      }

      // If avatar preset selected, generate a simple gradient image
      if (selectedAvatar && photoZones.length > 0 && Object.keys(photoFiles).length === 0) {
        const preset = AVATAR_PRESETS.find(a => a.id === selectedAvatar);
        if (preset) {
          // Create a canvas-based gradient avatar
          const canvas = document.createElement('canvas');
          canvas.width = 400;
          canvas.height = 400;
          const ctx = canvas.getContext('2d')!;
          const grd = ctx.createLinearGradient(0, 0, 400, 400);
          const parts = preset.gradient.match(/#[0-9a-fA-F]{6}/g) ?? ['#6c63ff', '#f8a4d8'];
          grd.addColorStop(0, parts[0]);
          grd.addColorStop(1, parts[1]);
          ctx.fillStyle = grd;
          ctx.fillRect(0, 0, 400, 400);
          // Add initials if name is provided
          const nameVal = Object.values(values)[0];
          if (nameVal) {
            ctx.fillStyle = 'rgba(255,255,255,0.9)';
            ctx.font = 'bold 140px sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            const initials = nameVal.split(' ').map((w: string) => w[0]).slice(0, 2).join('').toUpperCase();
            ctx.fillText(initials, 200, 210);
          }
          await new Promise<void>(resolve => canvas.toBlob(blob => {
            if (blob) {
              const zoneId = photoZones[0].id;
              const file = new File([blob], 'avatar.png', { type: 'image/png' });
              formData.append(`photo_${zoneId}`, file);
            }
            resolve();
          }, 'image/png'));
        }
      }

      const res = await fetch('/api/render', { method: 'POST', body: formData });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? 'Generation failed');
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      setResultUrl(url);
      setScreen('result');
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Something went wrong. Please try again.');
      setScreen('form');
    }
  };

  const handleDownload = () => {
    if (!resultUrl) return;
    const a = document.createElement('a');
    a.href = resultUrl;
    a.download = `${eventName.toLowerCase().replace(/\s+/g, '-')}-card.png`;
    a.click();
    setDownloaded(true);
    showToast('Card saved to your device!');
    setTimeout(() => setScreen('success'), 1800);
  };

  const firstName = Object.values(values)[0]?.split(' ')[0] ?? 'You';
  const eventShortName = eventName.replace(/^I am attending\s*/i, '').replace(/^I'm attending\s*/i, '').trim() || eventName;
  const cardCaption = `I'm attending ${eventShortName}! Get your personalized card 🎉`;

  // ─── E3 Success Screen ──────────────────────────────────────────────────────
  if (screen === 'success') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-4 py-8" style={{ background: 'linear-gradient(160deg,#0a0915 0%,#1b1240 60%,#3a1060 100%)' }}>
        <Confetti />

        {/* Check icon */}
        <div className="relative mb-6" style={{ animation: 'scaleIn 0.5s ease-out forwards' }}>
          <div className="h-20 w-20 rounded-full flex items-center justify-center" style={{ background: 'linear-gradient(135deg,#6c63ff,#f8a4d8)', boxShadow: '0 24px 60px rgba(108,99,255,0.45)' }}>
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>
        </div>

        <h2 className="font-display font-bold text-white text-[28px] mb-1.5 text-center">You&apos;re all set, {firstName}!</h2>
        <p className="text-white/60 text-[14.5px] text-center max-w-[300px] mb-8">
          Your card is ready. Now help fill the room — share it with your network.
        </p>

        {/* Mini card preview */}
        {resultUrl && (
          <div className="mb-8 rounded-2xl overflow-hidden shadow-lift w-[160px]" style={{ aspectRatio: `${backgroundWidth}/${backgroundHeight}` }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={resultUrl} alt="Your card" className="w-full h-full object-cover" />
          </div>
        )}

        {/* Share row */}
        <div className="text-[11px] font-mono text-white/40 mb-3 tracking-widest">SHARE WITH YOUR NETWORK</div>
        <div className="grid grid-cols-4 gap-3 mb-8">
          {[
            { name: 'WhatsApp', color: '#25D366', letter: 'w', href: `https://wa.me/?text=${encodeURIComponent(cardCaption)}` },
            { name: 'Instagram', color: '#E1306C', letter: '◉', href: '#' },
            { name: 'X', color: '#0f0f1a', letter: '𝕏', href: `https://twitter.com/intent/tweet?text=${encodeURIComponent(cardCaption)}` },
            { name: 'LinkedIn', color: '#0a66c2', letter: 'in', href: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent('https://cardly.app')}` },
          ].map(s => (
            <a
              key={s.name}
              href={s.href}
              target="_blank"
              rel="noopener noreferrer"
              className="flex flex-col items-center gap-2"
            >
              <div className="h-12 w-12 rounded-2xl flex items-center justify-center text-white font-bold text-[16px]" style={{ background: s.color, boxShadow: '0 4px 12px rgba(0,0,0,0.3)' }}>
                {s.letter}
              </div>
              <span className="text-[10px] font-mono text-white/40">{s.name}</span>
            </a>
          ))}
        </div>

        {/* Caption */}
        <div className="w-full max-w-[340px] bg-white/10 rounded-2xl p-4 mb-6 border border-white/10">
          <div className="text-[10px] font-mono text-white/40 mb-2">SUGGESTED CAPTION</div>
          <p className="text-[13px] text-white/80 leading-relaxed italic">&ldquo;{cardCaption}&rdquo;</p>
          <button
            onClick={() => { navigator.clipboard?.writeText(cardCaption); showToast('Caption copied!'); }}
            className="mt-3 text-[11px] font-mono text-[#6c63ff] flex items-center gap-1 hover:text-[#f8a4d8] transition"
          >
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
            Copy caption
          </button>
        </div>

        <button
          onClick={() => { setScreen('result'); setDownloaded(false); }}
          className="text-[13px] text-white/40 hover:text-white/60 transition"
        >
          ← Back to my card
        </button>

        <div className="mt-8 text-[11px] font-mono text-white/20">Made with Cardly</div>

        <style>{`
          @keyframes scaleIn { 0% { transform: scale(0.4); opacity:0;} 60% { transform: scale(1.1);} 100% { transform: scale(1); opacity:1;} }
        `}</style>
      </div>
    );
  }

  // ─── E2 Result / Preview Screen ─────────────────────────────────────────────
  if (screen === 'result' && resultUrl) {
    return (
      <div className="min-h-screen flex flex-col items-center px-4 pt-8 pb-12" style={{ background: 'linear-gradient(160deg,#0a0915 0%,#1b1240 60%,#3a1060 100%)' }}>
        {/* Toast */}
        {toast && (
          <div className="fixed top-16 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 bg-white text-[#0f0f1a] text-[13px] font-medium px-4 py-2.5 rounded-xl shadow-lift">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#6c63ff" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
            {toast}
          </div>
        )}

        <div className="w-full max-w-[375px]">
          <div className="flex items-center justify-between mb-6">
            <button onClick={() => setScreen('form')} className="h-9 w-9 rounded-xl bg-white/10 grid place-items-center text-white/70 hover:bg-white/20 transition">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m15 18-6-6 6-6"/></svg>
            </button>
            <div className="text-center">
              <div className="text-[11px] font-mono text-white/40 tracking-widest">YOUR CARD IS READY</div>
            </div>
            <div className="flex items-center gap-1.5 text-[11px] font-mono text-emerald-400">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
              LIVE
            </div>
          </div>

          {/* Card */}
          <div className="rounded-2xl overflow-hidden mb-3" style={{ boxShadow: '0 24px 60px rgba(108,99,255,0.35)', aspectRatio: `${backgroundWidth}/${backgroundHeight}` }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={resultUrl} alt="Your personalized card" className="w-full h-full object-cover" />
          </div>
          <div className="text-center text-[11px] font-mono text-white/30 mb-6">1080 × 1350 px · PNG · ready to share</div>

          {/* Download CTA */}
          <button
            onClick={handleDownload}
            className="w-full h-14 rounded-2xl font-display font-bold text-[16px] text-white mb-3 hover:opacity-95 transition flex items-center justify-center gap-2.5"
            style={{ background: 'linear-gradient(135deg,#6c63ff,#f8a4d8)', boxShadow: '0 8px 24px rgba(108,99,255,0.4)' }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/>
            </svg>
            Download my card
          </button>

          {/* Share row */}
          <div className="grid grid-cols-4 gap-2 mb-6">
            {[
              { name: 'WhatsApp', color: '#25D366', letter: 'w', href: `https://wa.me/?text=${encodeURIComponent(cardCaption)}` },
              { name: 'Instagram', color: '#E1306C', letter: '◉', href: '#' },
              { name: 'Post on X', color: '#0f0f1a', letter: '𝕏', href: `https://twitter.com/intent/tweet?text=${encodeURIComponent(cardCaption)}` },
              { name: 'LinkedIn', color: '#0a66c2', letter: 'in', href: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent('https://cardly.app')}` },
            ].map(s => (
              <a
                key={s.name}
                href={s.href}
                target="_blank"
                rel="noopener noreferrer"
                className="flex flex-col items-center gap-1.5"
              >
                <div className="h-12 w-full rounded-xl flex items-center justify-center text-white font-bold text-[15px]" style={{ background: s.color }}>
                  {s.letter}
                </div>
                <span className="text-[9px] font-mono text-white/40 text-center">{s.name}</span>
              </a>
            ))}
          </div>

          {/* Caption */}
          <div className="bg-white/8 border border-white/10 rounded-2xl p-4 mb-5">
            <div className="text-[10px] font-mono text-white/40 mb-2">SUGGESTED CAPTION</div>
            <p className="text-[12.5px] text-white/70 leading-relaxed italic">&ldquo;{cardCaption}&rdquo;</p>
            <button
              onClick={() => { navigator.clipboard?.writeText(cardCaption); showToast('Caption copied!'); }}
              className="mt-2 text-[11px] font-mono text-[#6c63ff] flex items-center gap-1 hover:text-[#f8a4d8] transition"
            >
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
              Copy caption
            </button>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => { setScreen('form'); setResultUrl(null); }}
              className="flex-1 py-3 rounded-xl text-[13px] text-white/50 border border-white/10 hover:bg-white/5 transition flex items-center justify-center gap-1.5"
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.12 2.12 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
              </svg>
              Edit my info
            </button>
            {downloaded && (
              <button
                onClick={() => setScreen('success')}
                className="flex-1 py-3 rounded-xl text-[13px] font-semibold text-[#6c63ff] border border-[#6c63ff]/30 hover:bg-[#6c63ff]/10 transition"
              >
                Done ✓
              </button>
            )}
          </div>

          <div className="mt-8 text-center text-[11px] font-mono text-white/20">
            Powered by <span style={{ background: 'linear-gradient(135deg,#6c63ff,#f8a4d8)', WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent' }}>Cardly</span>
          </div>
        </div>
      </div>
    );
  }

  // ─── Generating Screen ───────────────────────────────────────────────────────
  if (screen === 'generating') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-4" style={{ background: 'linear-gradient(160deg,#0a0915 0%,#1b1240 60%,#3a1060 100%)' }}>
        <div className="text-center">
          <div className="inline-flex h-20 w-20 rounded-full items-center justify-center mb-6 relative" style={{ background: 'linear-gradient(135deg,#6c63ff,#f8a4d8)' }}>
            <svg className="animate-spin text-white" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 12a9 9 0 1 1-6.219-8.56" strokeLinecap="round"/>
            </svg>
          </div>
          <h2 className="font-display font-bold text-white text-[24px] mb-2">Generating your card…</h2>
          <p className="text-white/50 text-[14px]">Compositing your design. Usually under 5 seconds.</p>
          {error && (
            <div className="mt-4 px-4 py-3 rounded-xl bg-rose-500/20 border border-rose-500/40 text-[13px] text-rose-300 max-w-[320px]">{error}</div>
          )}
        </div>
      </div>
    );
  }

  // ─── E1 Form Screen ──────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen flex flex-col items-center" style={{ background: 'linear-gradient(160deg,#0a0915 0%,#1b1240 60%,#3a1060 100%)' }}>
      {/* Progress bar */}
      <div className="fixed top-0 left-0 right-0 z-20 h-1 bg-white/10">
        <div
          className="h-full transition-all duration-500"
          style={{ width: `${progressPct}%`, background: 'linear-gradient(90deg,#6c63ff,#f8a4d8)' }}
        />
      </div>

      {/* Header */}
      <div className="w-full max-w-[375px] pt-8 pb-4 px-4">
        <div className="text-center">
          <div className="text-[11px] font-mono tracking-widest text-white/40 mb-1.5">GET YOUR CARD</div>
          <h1 className="font-display font-bold text-white text-[22px] leading-tight">{eventName}</h1>
        </div>
      </div>

      {/* Live card preview */}
      <div className="w-full max-w-[375px] px-4 mb-6">
        <div className="relative overflow-hidden rounded-2xl shadow-lift" style={{ aspectRatio: `${backgroundWidth}/${backgroundHeight}` }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={backgroundUrl} alt={eventName} className="w-full h-full object-cover" draggable={false} />

          {zones.map(z => {
            const left = (z.x / backgroundWidth) * 100;
            const top = (z.y / backgroundHeight) * 100;
            const width = (z.w / backgroundWidth) * 100;
            const height = (z.h / backgroundHeight) * 100;
            const borderRadius = z.type === 'photo' ? (z.shape === 'circle' ? '50%' : z.shape === 'rounded' ? '20%' : '4px') : '4px';

            if (z.type === 'photo') {
              const photoUrl = photoUrls[z.id];
              const avatarPreset = !photoUrl && selectedAvatar ? AVATAR_PRESETS.find(a => a.id === selectedAvatar) : null;
              return (
                <button
                  key={z.id}
                  onClick={() => fileInputRefs.current[z.id]?.click()}
                  className="absolute overflow-hidden border-2 border-white/40 hover:border-white/70 transition"
                  style={{ left: `${left}%`, top: `${top}%`, width: `${width}%`, height: `${height}%`, borderRadius }}
                >
                  {photoUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={photoUrl} alt="" className="w-full h-full object-cover" />
                  ) : avatarPreset ? (
                    <div className="w-full h-full flex items-center justify-center" style={{ background: avatarPreset.gradient }}>
                      <span className="text-white font-bold text-[14px]">
                        {Object.values(values)[0]?.split(' ').map((w: string) => w[0]).slice(0, 2).join('').toUpperCase() ?? '?'}
                      </span>
                    </div>
                  ) : (
                    <div className="w-full h-full bg-white/10 backdrop-blur-sm flex items-center justify-center text-white/60">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                        <rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/>
                      </svg>
                    </div>
                  )}
                </button>
              );
            }

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
                <span style={{
                  fontFamily: z.font, fontWeight: z.weight,
                  fontSize: `${(z.size ?? 32) * (375 / backgroundWidth)}px`,
                  color: z.color, lineHeight: 1.1, textAlign: z.align, wordBreak: 'break-word',
                }}>
                  {val}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Form */}
      <div className="w-full max-w-[375px] px-4 pb-32 space-y-4">
        {/* Photo zones */}
        {photoZones.map(z => (
          <div key={z.id}>
            <div className="flex items-center gap-2 mb-2">
              <label className="text-[12px] font-mono text-white/50 uppercase">{z.label}</label>
              {z.required && <span className="text-[10px] font-mono text-[#6c63ff] bg-[#6c63ff]/20 px-1.5 py-0.5 rounded">REQ</span>}
            </div>
            <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
              {/* Upload button */}
              <button
                onClick={() => fileInputRefs.current[z.id]?.click()}
                className="w-full h-14 rounded-xl border-2 border-dashed border-white/20 hover:border-white/40 transition flex items-center justify-center gap-3 text-white/60 hover:text-white/80 mb-3"
              >
                {photoUrls[z.id] ? (
                  <>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={photoUrls[z.id]} alt="" className="h-10 w-10 rounded-full object-cover" />
                    <span className="text-[13px]">Change photo</span>
                  </>
                ) : (
                  <>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>
                    </svg>
                    <span className="text-[13.5px]">Upload a photo</span>
                  </>
                )}
              </button>

              {/* Avatar presets */}
              <div>
                <div className="text-[10px] font-mono text-white/30 mb-2 text-center">OR CHOOSE AN AVATAR</div>
                <div className="grid grid-cols-4 gap-2">
                  {AVATAR_PRESETS.map(preset => (
                    <button
                      key={preset.id}
                      onClick={() => handleAvatarSelect(z.id, preset.id)}
                      className="relative h-12 rounded-xl border-2 transition overflow-hidden"
                      style={{ background: preset.gradient, borderColor: selectedAvatar === preset.id ? 'white' : 'transparent' }}
                    >
                      {selectedAvatar === preset.id && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>
                        </div>
                      )}
                    </button>
                  ))}
                </div>
                <div className="text-[10px] font-mono text-white/25 text-center mt-1.5">
                  Auto-crops to the {z.shape ?? 'circle'} shape
                </div>
              </div>
            </div>
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

        {/* Text zones */}
        {textZones.map(z => {
          if (z.type === 'custom' && z.options?.length) {
            // Dropdown for country / custom fields
            return (
              <div key={z.id}>
                <div className="flex items-center gap-2 mb-2">
                  <label className="text-[12px] font-mono text-white/50 uppercase">{z.label}</label>
                  {z.required && <span className="text-[10px] font-mono text-[#6c63ff] bg-[#6c63ff]/20 px-1.5 py-0.5 rounded">REQ</span>}
                </div>
                <select
                  value={values[z.id] ?? ''}
                  onChange={e => setValues(v => ({ ...v, [z.id]: e.target.value }))}
                  className="w-full h-12 px-4 rounded-xl bg-white/10 border border-white/20 text-white text-[15px] focus:outline-none focus:border-[#6c63ff]/60 transition appearance-none"
                  style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='rgba(255,255,255,0.4)' stroke-width='2' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E\")", backgroundRepeat: 'no-repeat', backgroundPosition: 'right 12px center' }}
                >
                  <option value="" disabled style={{ background: '#1b1240' }}>{z.placeholder ?? `Select ${z.label}`}</option>
                  {z.options.map(opt => (
                    <option key={opt} value={opt} style={{ background: '#1b1240' }}>{opt}</option>
                  ))}
                </select>
              </div>
            );
          }

          // Check if label suggests it's a location/country field
          const isLocation = z.label.toLowerCase().includes('city') || z.label.toLowerCase().includes('country') || z.label.toLowerCase().includes('location');

          return (
            <div key={z.id}>
              <div className="flex items-center gap-2 mb-2">
                <label className="text-[12px] font-mono text-white/50 uppercase">{z.label}</label>
                {z.required && <span className="text-[10px] font-mono text-[#6c63ff] bg-[#6c63ff]/20 px-1.5 py-0.5 rounded">REQ</span>}
              </div>
              {isLocation ? (
                <select
                  value={values[z.id] ?? ''}
                  onChange={e => setValues(v => ({ ...v, [z.id]: e.target.value }))}
                  className="w-full h-12 px-4 rounded-xl bg-white/10 border border-white/20 text-white text-[15px] focus:outline-none focus:border-[#6c63ff]/60 transition appearance-none"
                  style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='rgba(255,255,255,0.4)' stroke-width='2' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E\")", backgroundRepeat: 'no-repeat', backgroundPosition: 'right 12px center' }}
                >
                  <option value="" disabled style={{ background: '#1b1240' }}>{z.placeholder ?? 'Select city / country'}</option>
                  {COUNTRIES.map(c => (
                    <option key={c} value={c} style={{ background: '#1b1240' }}>{c}</option>
                  ))}
                </select>
              ) : (
                <input
                  type="text"
                  placeholder={z.placeholder ?? z.label}
                  value={values[z.id] ?? ''}
                  onChange={e => setValues(v => ({ ...v, [z.id]: e.target.value }))}
                  className="w-full h-12 px-4 rounded-xl bg-white/10 border border-white/20 text-white placeholder-white/30 text-[15px] focus:outline-none focus:border-[#6c63ff]/60 focus:bg-white/15 transition"
                />
              )}
            </div>
          );
        })}

        {error && (
          <div className="px-4 py-3 rounded-xl bg-rose-500/20 border border-rose-500/40 text-[13px] text-rose-300">{error}</div>
        )}
      </div>

      {/* Sticky CTA */}
      <div className="fixed bottom-0 left-0 right-0 z-10" style={{ background: 'linear-gradient(to top,rgba(10,9,21,0.98) 60%,transparent)' }}>
        <div className="max-w-[375px] mx-auto px-4 pb-6 pt-4">
          {/* Progress indicator */}
          <div className="flex items-center justify-between mb-3 px-1">
            <span className="text-[11px] font-mono text-white/35">{filledCount} of {requiredZones.length} required fields</span>
            <span className="text-[11px] font-mono text-white/35">{Math.round(progressPct)}%</span>
          </div>
          <button
            disabled={!isComplete()}
            onClick={handleGenerate}
            className="w-full h-14 rounded-2xl font-display font-bold text-[16px] transition"
            style={isComplete()
              ? { background: 'linear-gradient(135deg,#6c63ff,#f8a4d8)', color: 'white', boxShadow: '0 8px_24px rgba(108,99,255,0.4)' }
              : { background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.3)', cursor: 'not-allowed' }
            }
          >
            Generate my card →
          </button>
          <div className="text-center mt-2 text-[11px] font-mono text-white/25">
            Powered by <span style={{ background: 'linear-gradient(135deg,#6c63ff,#f8a4d8)', WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent' }}>Cardly</span>
          </div>
        </div>
      </div>
    </div>
  );
}
