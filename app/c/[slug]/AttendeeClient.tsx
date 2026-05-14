'use client';

import { useState, useRef, useEffect, useLayoutEffect, type CSSProperties } from 'react';
import type { Zone } from '@/types/database';

interface Props {
  variantId: string;
  eventName: string;
  backgroundUrl: string;
  backgroundWidth: number;
  backgroundHeight: number;
  zones: Zone[];
}

type FieldValues = Record<string, string>;
type Screen = 'form' | 'generating' | 'result' | 'success';

const AVATAR_PRESETS = [
  { id: 'a', gradient: 'linear-gradient(135deg,#ffd28a,#E8C57E)' },
  { id: 'b', gradient: 'linear-gradient(135deg,#7be0c0,#1F4D3A)' },
  { id: 'c', gradient: 'linear-gradient(135deg,#E8C57E,#1F4D3A)' },
  { id: 'd', gradient: 'linear-gradient(135deg,#1f8a5b,#ffd28a)' },
];

const SYSTEM_FONTS_ATTENDEE = new Set([
  'georgia', 'times new roman', 'times', 'arial', 'helvetica',
  'verdana', 'trebuchet ms', 'courier new', 'courier',
  'sans-serif', 'serif', 'monospace',
]);

function Confetti() {
  const pieces = Array.from({ length: 20 }).map((_, i) => ({
    left: `${5 + (i / 19) * 90}%`,
    color: ['#1F4D3A', '#E8C57E', '#ffd28a', '#7be0c0', '#ff6058'][i % 5],
    delay: `${(i * 0.07).toFixed(2)}s`,
    dur: `${3 + (i % 4) * 0.5}s`,
  }));
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-50">
      {pieces.map((p, i) => (
        <div key={i} className="absolute w-2 h-2 rounded-sm"
          style={{ left: p.left, top: '-10px', background: p.color,
            animation: `confettiFall ${p.dur} ease-in ${p.delay} forwards` }} />
      ))}
      <style>{`@keyframes confettiFall{0%{transform:translateY(0) rotate(0deg);opacity:1}100%{transform:translateY(100vh) rotate(720deg);opacity:0}}`}</style>
    </div>
  );
}

// ── Icons ──────────────────────────────────────────────────────────────────────
const IconPencil = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
    <path d="M18.5 2.5a2.12 2.12 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
  </svg>
);
const IconCheck = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
    <polyline points="20 6 9 17 4 12"/>
  </svg>
);
const IconDownload = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/>
    <line x1="12" y1="3" x2="12" y2="15"/>
  </svg>
);
const IconUpload = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
    <polyline points="17 8 12 3 7 8"/>
    <line x1="12" y1="3" x2="12" y2="15"/>
  </svg>
);

export default function AttendeeClient({ variantId, eventName, backgroundUrl, backgroundWidth, backgroundHeight, zones }: Props) {
  // ── Field / photo state ──────────────────────────────────────────────────────
  const [values, setValues]               = useState<FieldValues>({});
  const [photoFiles, setPhotoFiles]       = useState<Record<string, File>>({});
  const [photoUrls, setPhotoUrls]         = useState<Record<string, string>>({});
  const [selectedAvatar, setSelectedAvatar] = useState<string | null>(null);
  const [screen, setScreen]               = useState<Screen>('form');
  const [resultUrl, setResultUrl]         = useState<string | null>(null);
  const [error, setError]                 = useState('');
  const [toast, setToast]                 = useState<string | null>(null);
  const [downloaded, setDownloaded]       = useState(false);

  // ── Interaction state ────────────────────────────────────────────────────────
  const [editingZoneId, setEditingZoneId]         = useState<string | null>(null);
  const [activePhotoZoneId, setActivePhotoZoneId] = useState<string | null>(null);
  // ── Refs / measurements ──────────────────────────────────────────────────────
  const fileInputRefs    = useRef<Record<string, HTMLInputElement | null>>({});
  const cardRef          = useRef<HTMLDivElement>(null);
  const [previewWidth, setPreviewWidth]       = useState(343);
  const [measuredHeights, setMeasuredHeights] = useState<Record<string, number>>({});
  const measureSpanRefs  = useRef<Record<string, HTMLSpanElement | null>>({});


  // Measure card width on mount + resize
  useEffect(() => {
    const update = () => { if (cardRef.current) setPreviewWidth(cardRef.current.offsetWidth); };
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);

  // Measure text heights for live reflow
  useLayoutEffect(() => {
    const heights: Record<string, number> = {};
    let changed = false;
    for (const [id, el] of Object.entries(measureSpanRefs.current)) {
      if (el) {
        const h = el.offsetHeight;
        heights[id] = h;
        if (h !== (measuredHeights[id] ?? 0)) changed = true;
      }
    }
    if (changed) setMeasuredHeights(heights);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [values, previewWidth]);

  // Load Google Fonts used by zones
  useEffect(() => {
    const families = Array.from(new Set(
      zones
        .filter(z => z.font && !SYSTEM_FONTS_ATTENDEE.has(z.font.toLowerCase()))
        .map(z => {
          const weights = new Set<number>();
          zones.filter(z2 => z2.font === z.font).forEach(z2 => weights.add(z2.weight ?? 400));
          return `${z.font!.replace(/\s+/g, '+')}:wght@${Array.from(weights).sort().join(';')}`;
        })
    ));
    if (!families.length) return;
    const id = 'cardly-attendee-gfonts';
    if (document.getElementById(id)) return;
    const link = document.createElement('link');
    link.id = id; link.rel = 'stylesheet';
    link.href = `https://fonts.googleapis.com/css2?${families.map(f => `family=${f}`).join('&')}&display=swap`;
    document.head.appendChild(link);
  }, [zones]);

  // ── Helpers ──────────────────────────────────────────────────────────────────
  const photoZones = zones.filter(z => z.type === 'photo');

  const requiredZones = zones.filter(z => z.required);
  const filledCount = requiredZones.filter(z =>
    z.type === 'photo' ? (!!photoFiles[z.id] || !!selectedAvatar) : !!values[z.id]?.trim()
  ).length;
  const progressPct = requiredZones.length > 0 ? (filledCount / requiredZones.length) * 100 : 100;

  const isComplete = () => zones.every(z => {
    if (!z.required) return true;
    return z.type === 'photo' ? (!!photoFiles[z.id] || !!selectedAvatar) : !!values[z.id]?.trim();
  });

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(null), 2200); };

  const handlePhotoSelect = (zoneId: string, file: File) => {
    setPhotoFiles(p => ({ ...p, [zoneId]: file }));
    setPhotoUrls(u => ({ ...u, [zoneId]: URL.createObjectURL(file) }));
    setSelectedAvatar(null);
  };

  const handleAvatarSelect = (zoneId: string, avatarId: string) => {
    setSelectedAvatar(avatarId);
    setPhotoFiles(p => { const n = { ...p }; delete n[zoneId]; return n; });
    setPhotoUrls(u => { const n = { ...u }; delete n[zoneId]; return n; });
  };

  const handleGenerate = async () => {
    setScreen('generating'); setError('');
    try {
      const fd = new FormData();
      fd.append('variantId', variantId);
      fd.append('fields', JSON.stringify(values));

      for (const [zoneId, file] of Object.entries(photoFiles))
        fd.append(`photo_${zoneId}`, file);

      // Avatar preset → gradient PNG
      if (selectedAvatar && photoZones.length > 0 && Object.keys(photoFiles).length === 0) {
        const preset = AVATAR_PRESETS.find(a => a.id === selectedAvatar);
        if (preset) {
          const canvas = document.createElement('canvas');
          canvas.width = canvas.height = 400;
          const ctx = canvas.getContext('2d')!;
          const grd = ctx.createLinearGradient(0, 0, 400, 400);
          const parts = preset.gradient.match(/#[0-9a-fA-F]{6}/g) ?? ['#1F4D3A', '#E8C57E'];
          grd.addColorStop(0, parts[0]); grd.addColorStop(1, parts[1]);
          ctx.fillStyle = grd; ctx.fillRect(0, 0, 400, 400);
          const nameVal = Object.values(values)[0];
          if (nameVal) {
            ctx.fillStyle = 'rgba(255,255,255,0.9)';
            ctx.font = 'bold 140px sans-serif';
            ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
            ctx.fillText(nameVal.split(' ').map((w: string) => w[0]).slice(0, 2).join('').toUpperCase(), 200, 210);
          }
          await new Promise<void>(resolve => canvas.toBlob(blob => {
            if (blob) fd.append(`photo_${photoZones[0].id}`, new File([blob], 'avatar.png', { type: 'image/png' }));
            resolve();
          }, 'image/png'));
        }
      }

      const res = await fetch('/api/render', { method: 'POST', body: fd });
      if (!res.ok) { const d = await res.json().catch(() => ({})); throw new Error(d.error ?? 'Generation failed'); }
      setResultUrl(URL.createObjectURL(await res.blob()));
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

  const firstName   = Object.values(values)[0]?.split(' ')[0] ?? 'You';
  const shortName   = eventName.replace(/^I am attending\s*/i, '').replace(/^I'm attending\s*/i, '').trim() || eventName;
  const cardCaption = `I'm attending ${shortName}! Get your personalized card 🎉`;

  // ── E3 Success ───────────────────────────────────────────────────────────────
  if (screen === 'success') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-4 py-8"
        style={{ background: 'linear-gradient(160deg,#070f0b 0%,#0F1F18 55%,#0a1810 100%)' }}>
        <Confetti />
        <div className="h-20 w-20 rounded-full flex items-center justify-center mb-6"
          style={{ background: '#1F4D3A', boxShadow: '0 24px 60px rgba(31,77,58,0.45)' }}>
          <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
        </div>
        <h2 className="font-display font-bold text-white text-[28px] mb-1.5 text-center">You&apos;re all set, {firstName}!</h2>
        <p className="text-white/60 text-[14.5px] text-center max-w-[300px] mb-8">Your card is ready. Share it with your network.</p>
        {resultUrl && (
          <div className="mb-8 rounded-2xl overflow-hidden shadow-lift w-[160px]" style={{ aspectRatio: `${backgroundWidth}/${backgroundHeight}` }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={resultUrl} alt="Your card" className="w-full h-full object-cover" />
          </div>
        )}
        <div className="text-[11px] font-mono text-white/40 mb-3 tracking-widest">SHARE WITH YOUR NETWORK</div>
        <div className="grid grid-cols-4 gap-3 mb-8">
          {[
            { name: 'WhatsApp', color: '#25D366', letter: 'w', href: `https://wa.me/?text=${encodeURIComponent(cardCaption)}` },
            { name: 'Instagram', color: '#E1306C', letter: '◉', href: '#' },
            { name: 'X', color: '#0F1F18', letter: '𝕏', href: `https://twitter.com/intent/tweet?text=${encodeURIComponent(cardCaption)}` },
            { name: 'LinkedIn', color: '#0a66c2', letter: 'in', href: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent('https://cardly.app')}` },
          ].map(s => (
            <a key={s.name} href={s.href} target="_blank" rel="noopener noreferrer" className="flex flex-col items-center gap-2">
              <div className="h-12 w-12 rounded-2xl flex items-center justify-center text-white font-bold text-[16px]"
                style={{ background: s.color, boxShadow: '0 4px 12px rgba(0,0,0,0.3)' }}>{s.letter}</div>
              <span className="text-[10px] font-mono text-white/40">{s.name}</span>
            </a>
          ))}
        </div>
        <div className="w-full max-w-[340px] bg-white/10 rounded-2xl p-4 mb-6 border border-white/10">
          <div className="text-[10px] font-mono text-white/40 mb-2">SUGGESTED CAPTION</div>
          <p className="text-[13px] text-white/80 leading-relaxed italic">&ldquo;{cardCaption}&rdquo;</p>
          <button onClick={() => { navigator.clipboard?.writeText(cardCaption); showToast('Caption copied!'); }}
            className="mt-3 text-[11px] font-mono text-[#E8C57E] flex items-center gap-1.5">
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
            Copy caption
          </button>
        </div>
        <button onClick={() => { setScreen('result'); setDownloaded(false); }} className="text-[13px] text-white/40 hover:text-white/60 transition">← Back to my card</button>
        <div className="mt-8 text-[11px] font-mono text-white/20">Made with Cardly</div>
      </div>
    );
  }

  // ── E2 Result ────────────────────────────────────────────────────────────────
  if (screen === 'result' && resultUrl) {
    return (
      <div className="min-h-screen flex flex-col items-center px-4 pt-8 pb-12"
        style={{ background: 'linear-gradient(160deg,#070f0b 0%,#0F1F18 55%,#0a1810 100%)' }}>
        {toast && (
          <div className="fixed top-16 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 bg-white text-[#0F1F18] text-[13px] font-medium px-4 py-2.5 rounded-xl shadow-lift">
            <IconCheck />{toast}
          </div>
        )}
        <div className="w-full max-w-[375px]">
          <div className="flex items-center justify-between mb-6">
            <button onClick={() => setScreen('form')} className="h-9 w-9 rounded-xl bg-white/10 grid place-items-center text-white/70 hover:bg-white/20 transition">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m15 18-6-6 6-6"/></svg>
            </button>
            <div className="text-[11px] font-mono text-white/40 tracking-widest">YOUR CARD IS READY</div>
            <div className="flex items-center gap-1.5 text-[11px] font-mono text-emerald-400">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse"/>LIVE
            </div>
          </div>
          <div className="rounded-2xl overflow-hidden mb-3" style={{ boxShadow: '0 24px 60px rgba(31,77,58,0.35)', aspectRatio: `${backgroundWidth}/${backgroundHeight}` }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={resultUrl} alt="Your personalized card" className="w-full h-full object-cover"/>
          </div>
          <div className="text-center text-[11px] font-mono text-white/30 mb-6">{backgroundWidth} × {backgroundHeight} px · PNG · ready to share</div>
          <button onClick={handleDownload}
            className="w-full h-14 rounded-2xl font-display font-bold text-[16px] text-white mb-3 hover:opacity-95 transition flex items-center justify-center gap-2.5"
            style={{ background: '#1F4D3A', boxShadow: '0 8px 24px rgba(31,77,58,0.4)' }}>
            <IconDownload/>Download my card
          </button>
          <div className="grid grid-cols-4 gap-2 mb-6">
            {[
              { name: 'WhatsApp', color: '#25D366', letter: 'w', href: `https://wa.me/?text=${encodeURIComponent(cardCaption)}` },
              { name: 'Instagram', color: '#E1306C', letter: '◉', href: '#' },
              { name: 'X', color: '#0F1F18', letter: '𝕏', href: `https://twitter.com/intent/tweet?text=${encodeURIComponent(cardCaption)}` },
              { name: 'LinkedIn', color: '#0a66c2', letter: 'in', href: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent('https://cardly.app')}` },
            ].map(s => (
              <a key={s.name} href={s.href} target="_blank" rel="noopener noreferrer" className="flex flex-col items-center gap-1.5">
                <div className="h-12 w-full rounded-xl flex items-center justify-center text-white font-bold text-[15px]" style={{ background: s.color }}>{s.letter}</div>
                <span className="text-[9px] font-mono text-white/40 text-center">{s.name}</span>
              </a>
            ))}
          </div>
          <div className="bg-white/[0.06] border border-white/10 rounded-2xl p-4 mb-5">
            <div className="text-[10px] font-mono text-white/40 mb-2">SUGGESTED CAPTION</div>
            <p className="text-[12.5px] text-white/70 leading-relaxed italic">&ldquo;{cardCaption}&rdquo;</p>
            <button onClick={() => { navigator.clipboard?.writeText(cardCaption); showToast('Caption copied!'); }}
              className="mt-2 text-[11px] font-mono text-[#E8C57E] flex items-center gap-1">
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
              Copy caption
            </button>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={() => { setScreen('form'); setResultUrl(null); }}
              className="flex-1 py-3 rounded-xl text-[13px] text-white/50 border border-white/10 hover:bg-white/5 transition flex items-center justify-center gap-1.5">
              <IconPencil/>Edit my info
            </button>
            {downloaded && (
              <button onClick={() => setScreen('success')}
                className="flex-1 py-3 rounded-xl text-[13px] font-semibold text-[#1F4D3A] border border-[#1F4D3A]/30 hover:bg-[#1F4D3A]/10 transition flex items-center justify-center gap-1.5">
                <IconCheck/>Done
              </button>
            )}
          </div>
          <div className="mt-8 text-center text-[11px] font-mono text-white/20">
            Powered by <span style={{ background: 'linear-gradient(135deg,#1F4D3A,#E8C57E)', WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent' }}>Cardly</span>
          </div>
        </div>
      </div>
    );
  }

  // ── Generating ───────────────────────────────────────────────────────────────
  if (screen === 'generating') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-4"
        style={{ background: 'linear-gradient(160deg,#070f0b 0%,#0F1F18 55%,#0a1810 100%)' }}>
        <div className="text-center">
          <div className="inline-flex h-20 w-20 rounded-full items-center justify-center mb-6 relative" style={{ background: '#1F4D3A' }}>
            <svg className="animate-spin text-white" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12a9 9 0 1 1-6.219-8.56" strokeLinecap="round"/></svg>
          </div>
          <h2 className="font-display font-bold text-white text-[24px] mb-2">Generating your card…</h2>
          <p className="text-white/50 text-[14px]">Compositing your design. Usually under 5 seconds.</p>
          {error && <div className="mt-4 px-4 py-3 rounded-xl bg-rose-500/20 border border-rose-500/40 text-[13px] text-rose-300 max-w-[320px]">{error}</div>}
        </div>
      </div>
    );
  }

  // ── E1 Form ──────────────────────────────────────────────────────────────────
  const scale = previewWidth / backgroundWidth;

  const generateButton = (fullWidth = true) => (
    <button
      disabled={!isComplete()}
      onClick={handleGenerate}
      className={`${fullWidth ? 'w-full' : ''} h-14 rounded-2xl font-display font-bold text-[16px] transition flex items-center justify-center gap-2`}
      style={isComplete()
        ? { background: 'linear-gradient(135deg,#1F4D3A,#2A6A50)', color: 'white', boxShadow: '0 8px 24px rgba(31,77,58,0.45)' }
        : { background: 'rgba(255,255,255,0.07)', color: 'rgba(255,255,255,0.25)', cursor: 'not-allowed' }}
    >
      {isComplete() ? (
        <>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
            <path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/>
          </svg>
          Generate my card
        </>
      ) : (
        requiredZones.length > 0
          ? `Fill in ${requiredZones.length - filledCount} more field${requiredZones.length - filledCount !== 1 ? 's' : ''}`
          : 'Generate my card'
      )}
    </button>
  );

  return (
    <div
      className="min-h-screen pb-40 md:pb-12"
      style={{ background: 'linear-gradient(160deg,#070f0b 0%,#0F1F18 55%,#0a1810 100%)' }}
      onClick={() => { setEditingZoneId(null); setActivePhotoZoneId(null); }}
    >
      {/* Progress bar — full width, fixed top */}
      <div className="fixed top-0 left-0 right-0 z-20 h-[3px] bg-white/10">
        <div className="h-full transition-all duration-500" style={{ width: `${progressPct}%`, background: 'linear-gradient(90deg,#1F4D3A,#E8C57E)' }}/>
      </div>

      {/* Toast */}
      {toast && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 bg-[#1F4D3A] text-white text-[13px] font-medium px-4 py-2.5 rounded-2xl shadow-lift whitespace-nowrap">
          <IconCheck/>{toast}
        </div>
      )}

      {/* Main container */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-7 pb-40 md:pb-12">

        {/* Header — full width */}
        <div className="mb-6 md:mb-8">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <div className="text-[10px] font-mono tracking-widest text-white/35 mb-1">GET YOUR CARD</div>
              <h1 className="font-display font-bold text-white text-[20px] sm:text-[26px] leading-tight">{eventName}</h1>
              <p className="text-[13px] text-white/45 mt-1">Fill in your details and download your personalized card.</p>
            </div>
            {/* Progress pill */}
            {requiredZones.length > 0 && (
              <div className="shrink-0 flex items-center gap-1 mt-1">
                <span className="text-[11px] font-mono text-white/35">{filledCount}/{requiredZones.length}</span>
                <div className="h-1.5 w-16 rounded-full bg-white/10 overflow-hidden">
                  <div className="h-full rounded-full transition-all duration-300" style={{ width: `${progressPct}%`, background: '#E8C57E' }}/>
                </div>
              </div>
            )}
          </div>
          {/* Hint — mobile only line */}
          <p className="text-[12px] text-white/40 mt-1">
            {editingZoneId ? 'Tap outside or press Enter to confirm'
             : activePhotoZoneId ? 'Choose how to add your photo'
             : 'Tap a field on the card to personalise'}
          </p>
        </div>

        {/* Two-column on desktop, single column on mobile */}
        <div className="flex flex-col md:grid md:grid-cols-[1fr_360px] lg:grid-cols-[1fr_400px] md:gap-10 lg:gap-14 md:items-start">

          {/* === LEFT: Desktop form panel (hidden on mobile) === */}
          <div className="hidden md:flex flex-col gap-6" onClick={e => e.stopPropagation()}>
            <div className="text-[11px] font-mono text-white/40 tracking-widest">YOUR DETAILS</div>

            {/* Photo zones */}
            {zones.filter(z => z.type === 'photo').map(z => (
              <div key={z.id}>
                <div className="text-[11px] font-mono text-white/40 mb-2 tracking-widest">
                  {(z.label?.toUpperCase() || 'YOUR PHOTO')}{z.required ? ' *' : ''}
                </div>
                <button
                  onClick={() => fileInputRefs.current[z.id]?.click()}
                  className="w-full rounded-2xl border-2 border-dashed border-white/20 hover:border-[#E8C57E]/50 transition overflow-hidden relative"
                  style={{ aspectRatio: '1/1', maxHeight: 200, background: 'rgba(255,255,255,0.04)', display: 'block' }}
                >
                  {photoUrls[z.id] ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={photoUrls[z.id]} alt="" className="w-full h-full object-cover"/>
                  ) : selectedAvatar && !photoUrls[z.id] ? (
                    (() => {
                      const preset = AVATAR_PRESETS.find(a => a.id === selectedAvatar);
                      return preset ? (
                        <div className="absolute inset-0 flex items-center justify-center" style={{ background: preset.gradient }}>
                          <span className="text-white font-bold text-[28px]">
                            {Object.values(values)[0]?.split(' ').map((w: string) => w[0]).slice(0, 2).join('').toUpperCase() ?? '?'}
                          </span>
                        </div>
                      ) : null;
                    })()
                  ) : (
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
                      <div className="h-14 w-14 rounded-2xl grid place-items-center text-white/80" style={{ background: 'rgba(31,77,58,0.6)' }}>
                        <IconUpload/>
                      </div>
                      <div className="text-center px-4">
                        <div className="text-[13.5px] font-semibold text-white/80">Click to upload your photo</div>
                        <div className="text-[11px] text-white/35 mt-0.5 font-mono">JPG or PNG · up to 10 MB</div>
                      </div>
                    </div>
                  )}
                </button>
                {photoUrls[z.id] && (
                  <button onClick={() => fileInputRefs.current[z.id]?.click()} className="mt-2 text-[12px] font-mono text-white/40 hover:text-white/60 transition">
                    Change photo →
                  </button>
                )}
                {/* Avatar option below photo upload */}
                {!photoUrls[z.id] && (
                  <div className="mt-3">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="flex-1 h-px bg-white/10"/>
                      <span className="text-[10px] font-mono text-white/25">OR PICK AN AVATAR</span>
                      <div className="flex-1 h-px bg-white/10"/>
                    </div>
                    <div className="grid grid-cols-4 gap-2">
                      {AVATAR_PRESETS.map(preset => (
                        <button key={preset.id}
                          onClick={() => { handleAvatarSelect(z.id, preset.id); }}
                          className="relative h-11 rounded-xl border-2 transition overflow-hidden"
                          style={{ background: preset.gradient, borderColor: selectedAvatar === preset.id ? '#E8C57E' : 'transparent' }}>
                          {selectedAvatar === preset.id && (
                            <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>
                            </div>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}

            {/* Text / custom zones */}
            {zones.filter(z => z.type === 'text' || z.type === 'custom').map(z => (
              <div key={z.id}>
                <div className="text-[11px] font-mono text-white/40 mb-2 tracking-widest">
                  {(z.label || 'TEXT').toUpperCase()}{z.required ? ' *' : ''}
                </div>
                <input
                  type="text"
                  value={values[z.id] ?? ''}
                  onChange={e => setValues(v => ({ ...v, [z.id]: e.target.value }))}
                  placeholder={z.placeholder || `Enter ${z.label || 'text'}…`}
                  className="w-full h-12 px-4 rounded-xl text-[14px] text-white placeholder-white/25 outline-none transition"
                  style={{
                    background: 'rgba(255,255,255,0.08)',
                    border: '1.5px solid rgba(255,255,255,0.12)',
                  }}
                  onFocus={e => { e.currentTarget.style.borderColor = 'rgba(31,77,58,0.8)'; e.currentTarget.style.background = 'rgba(255,255,255,0.11)'; }}
                  onBlur={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)'; e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; }}
                />
              </div>
            ))}

            {/* Error — desktop */}
            {error && (
              <div className="px-4 py-3 rounded-xl bg-rose-500/20 border border-rose-500/40 text-[13px] text-rose-300">{error}</div>
            )}

            {/* Generate button — desktop */}
            {generateButton(true)}

            <div className="text-center text-[11px] font-mono text-white/25">
              Powered by <span style={{ background: 'linear-gradient(135deg,#1F4D3A,#E8C57E)', WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent' }}>Cardly</span>
            </div>
          </div>

          {/* === RIGHT: Card preview === */}
          <div className="w-full" onClick={e => e.stopPropagation()}>
            <div
              ref={cardRef}
              className="relative overflow-hidden rounded-2xl"
              style={{
                aspectRatio: `${backgroundWidth}/${backgroundHeight}`,
                boxShadow: '0 24px 60px rgba(0,0,0,0.4)',
              }}
              onClick={e => e.stopPropagation()}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={backgroundUrl} alt={eventName} className="w-full h-full object-cover" draggable={false}/>

              {zones.map(z => {
                // Accumulated offset for text reflow
                const accumulatedOffset = (() => {
                  let offset = 0;
                  for (const tz of zones) {
                    if (tz.type !== 'text' && tz.type !== 'custom') continue;
                    if (tz.id === z.id) continue;
                    const tzBottom = tz.y + tz.h;
                    if (tzBottom <= z.y) {
                      const mh = measuredHeights[tz.id];
                      if (mh) offset += Math.max(0, mh / scale - tz.h);
                    }
                  }
                  return offset;
                })();

                const left   = (z.x / backgroundWidth)  * 100;
                const top    = ((z.y + accumulatedOffset) / backgroundHeight) * 100;
                const width  = (z.w / backgroundWidth)  * 100;
                const height = (z.h / backgroundHeight) * 100;

                // ── Photo zone ────────────────────────────────────────────────
                if (z.type === 'photo') {
                  const br = z.shape === 'circle' ? '50%' : z.shape === 'rounded' ? '20%' : '6px';
                  const photoUrl = photoUrls[z.id];
                  const avatarPreset = !photoUrl && selectedAvatar ? AVATAR_PRESETS.find(a => a.id === selectedAvatar) : null;
                  const isActive = activePhotoZoneId === z.id;

                  return (
                    <div
                      key={z.id}
                      className="absolute"
                      style={{
                        left: `${left}%`, top: `${top}%`, width: `${width}%`, height: `${height}%`,
                        transition: 'top 0.15s ease',
                        cursor: 'pointer',
                      }}
                    >
                      <div
                        className="w-full h-full overflow-hidden"
                        style={{
                          borderRadius: br,
                          outline: isActive ? '2.5px solid rgba(232,197,126,0.9)'
                            : photoUrl ? 'none' : '2px dashed rgba(255,255,255,0.3)',
                          outlineOffset: '2px',
                        }}
                        onClick={e => {
                          e.stopPropagation();
                          setEditingZoneId(null);
                          if (!photoUrl) {
                            fileInputRefs.current[z.id]?.click();
                            setActivePhotoZoneId(z.id);
                          } else {
                            setActivePhotoZoneId(isActive ? null : z.id);
                          }
                        }}
                      >
                        {photoUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={photoUrl} alt="" className="w-full h-full object-cover"/>
                        ) : avatarPreset ? (
                          <div className="w-full h-full flex items-center justify-center" style={{ background: avatarPreset.gradient }}>
                            <span className="text-white font-bold" style={{ fontSize: `${14 * scale}px` }}>
                              {Object.values(values)[0]?.split(' ').map((w: string) => w[0]).slice(0, 2).join('').toUpperCase() ?? '?'}
                            </span>
                          </div>
                        ) : (
                          // Improved photo placeholder
                          <div className="w-full h-full flex flex-col items-center justify-center gap-2"
                            style={{ background: 'rgba(10,24,16,0.7)', backdropFilter: 'blur(4px)' }}>
                            <div className="rounded-full flex items-center justify-center border-2 border-dashed border-white/40"
                              style={{ width: '42%', aspectRatio: '1/1', background: 'rgba(31,77,58,0.4)' }}>
                              <svg viewBox="0 0 24 24" fill="none" style={{ width: '45%', height: '45%' }}>
                                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" stroke="rgba(255,255,255,0.9)" strokeWidth="1.8" strokeLinecap="round"/>
                                <polyline points="17 8 12 3 7 8" stroke="rgba(255,255,255,0.9)" strokeWidth="1.8" strokeLinecap="round"/>
                                <line x1="12" y1="3" x2="12" y2="15" stroke="rgba(255,255,255,0.9)" strokeWidth="1.8" strokeLinecap="round"/>
                              </svg>
                            </div>
                            <span style={{
                              fontSize: `${Math.max(7, 8.5 * scale)}px`,
                              color: 'rgba(255,255,255,0.85)',
                              fontWeight: 600,
                              letterSpacing: '0.04em',
                              textAlign: 'center',
                            }}>Add photo</span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                }

                // ── Static zones (shape/image) — not user-editable, skip ────
                if (z.type === 'shape' || z.type === 'image') {
                  return null;
                }

                // ── Label zone ────────────────────────────────────────────────
                if (z.type === 'label') {
                  const txt = z.sample || z.placeholder || '';
                  if (!txt) return null;
                  const lva = z.verticalAlign ?? 'top';
                  const jc  = lva === 'bottom' ? 'flex-end' : lva === 'center' ? 'center' : 'flex-start';
                  return (
                    <div
                      key={z.id}
                      className="absolute overflow-hidden"
                      style={{
                        left: `${left}%`, top: `${top}%`, width: `${width}%`, height: `${height}%`,
                        display: 'flex', flexDirection: 'column', justifyContent: jc,
                        transition: 'top 0.15s ease',
                      }}
                    >
                      <span style={{
                        display: 'block', fontFamily: z.font, fontWeight: z.weight,
                        fontSize: `${(z.size ?? 32) * scale}px`, color: z.color,
                        lineHeight: z.lineHeight ?? 1.2, textAlign: z.align, wordBreak: 'break-word',
                        letterSpacing: z.letterSpacing ? `${z.letterSpacing * scale}px` : undefined,
                        textTransform: z.textTransform as 'none' | 'uppercase' | 'lowercase' | undefined,
                      }}>{txt}</span>
                    </div>
                  );
                }

                // ── Text / custom zone ────────────────────────────────────────
                const isEditing   = editingZoneId === z.id;
                const typedVal    = values[z.id] ?? '';
                const ghostVal    = z.sample || z.placeholder || z.label || '';
                const displayVal  = typedVal || ghostVal;
                const isGhost     = !typedVal;
                const vAlign      = z.verticalAlign ?? 'top';
                const jc          = vAlign === 'bottom' ? 'flex-end' : vAlign === 'center' ? 'center' : 'flex-start';

                const textStyle: CSSProperties = {
                  display: 'block',
                  fontFamily: z.font, fontWeight: z.weight,
                  fontSize: `${(z.size ?? 32) * scale}px`,
                  color: z.color ?? '#FFFFFF',
                  lineHeight: z.lineHeight ?? 1.2,
                  textAlign: z.align,
                  letterSpacing: z.letterSpacing ? `${z.letterSpacing * scale}px` : undefined,
                  textTransform: z.textTransform as 'none' | 'uppercase' | 'lowercase' | undefined,
                  WebkitTextStroke: (z.strokeColor && (z.strokeWidth ?? 0) > 0)
                    ? `${(z.strokeWidth ?? 0) * scale}px ${z.strokeColor}` : undefined,
                  textShadow: (z.shadowColor && (z.shadowBlur ?? 0) > 0)
                    ? `${(z.shadowX ?? 0) * scale}px ${(z.shadowY ?? 0) * scale}px ${(z.shadowBlur ?? 0) * scale}px ${z.shadowColor}` : undefined,
                  wordBreak: 'break-word',
                };

                return (
                  <div
                    key={z.id}
                    className="absolute"
                    style={{
                      left: `${left}%`, top: `${top}%`, width: `${width}%`,
                      minHeight: `${height}%`,
                      display: 'flex', flexDirection: 'column', justifyContent: jc,
                      transition: 'top 0.15s ease',
                      cursor: 'text',
                      outline: isEditing ? '2px solid rgba(232,197,126,0.9)'
                        : isGhost ? '1.5px dashed rgba(232,197,126,0.4)'
                        : 'none',
                      outlineOffset: '2px',
                      borderRadius: 3,
                    }}
                    onClick={e => {
                      e.stopPropagation();
                      setActivePhotoZoneId(null);
                      setEditingZoneId(z.id);
                    }}
                  >
                    {isEditing ? (
                      <textarea
                        autoFocus
                        value={typedVal}
                        onChange={e => setValues(v => ({ ...v, [z.id]: e.target.value }))}
                        onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); setEditingZoneId(null); } }}
                        onBlur={() => setEditingZoneId(null)}
                        onClick={e => e.stopPropagation()}
                        rows={1}
                        style={{
                          ...textStyle, display: 'block', width: '100%',
                          background: 'transparent', border: 'none', outline: 'none',
                          resize: 'none', padding: 0, margin: 0, overflow: 'hidden',
                          caretColor: z.color ?? '#FFFFFF', WebkitAppearance: 'none',
                        }}
                        ref={el => { if (el) { el.style.height = 'auto'; el.style.height = el.scrollHeight + 'px'; } }}
                        onInput={e => { const t = e.currentTarget; t.style.height = 'auto'; t.style.height = t.scrollHeight + 'px'; }}
                      />
                    ) : (
                      <span style={{ ...textStyle, opacity: isGhost ? 0.5 : 1 }}>
                        {displayVal || 'Tap to edit'}
                      </span>
                    )}

                    {/* Pencil badge (ghost state) */}
                    {!isEditing && isGhost && (
                      <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/2"
                        style={{ background: 'rgba(31,77,58,0.9)', borderRadius: '50%', padding: 4 }}>
                        <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
                          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                          <path d="M18.5 2.5a2.12 2.12 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                        </svg>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Hint — mobile only */}
            <p className="md:hidden text-[11.5px] text-white/40 mt-3 text-center">Tap any field on the card to edit</p>

            {/* Photo action panel — below card (show on both, only when active) */}
            {activePhotoZoneId && (() => {
              const z = zones.find(zn => zn.id === activePhotoZoneId);
              if (!z) return null;
              return (
                <div className="w-full mt-3" onClick={e => e.stopPropagation()}>
                  <div className="bg-white/[0.06] border border-white/[0.08] rounded-2xl p-4">
                    <div className="text-[10px] font-mono text-white/35 mb-3 tracking-widest">ADD YOUR PHOTO</div>
                    <button
                      onClick={() => fileInputRefs.current[z.id]?.click()}
                      className="w-full h-12 rounded-xl border border-white/15 hover:border-white/35 flex items-center justify-center gap-2.5 transition mb-3"
                      style={{ background: 'rgba(31,77,58,0.3)', color: 'rgba(255,255,255,0.85)' }}
                    >
                      {photoUrls[z.id] ? (
                        <>
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={photoUrls[z.id]} alt="" className="h-7 w-7 rounded-full object-cover"/>
                          <span className="text-[13.5px] font-medium">Change photo</span>
                        </>
                      ) : (
                        <>
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>
                          </svg>
                          <span className="text-[13.5px] font-medium">Upload your photo</span>
                        </>
                      )}
                    </button>
                    <div className="flex items-center gap-2 mb-3">
                      <div className="flex-1 h-px bg-white/10"/>
                      <span className="text-[10px] font-mono text-white/25">OR PICK AN AVATAR</span>
                      <div className="flex-1 h-px bg-white/10"/>
                    </div>
                    <div className="grid grid-cols-4 gap-2">
                      {AVATAR_PRESETS.map(preset => (
                        <button key={preset.id}
                          onClick={() => { handleAvatarSelect(z.id, preset.id); setActivePhotoZoneId(null); }}
                          className="relative h-11 rounded-xl border-2 transition overflow-hidden"
                          style={{ background: preset.gradient, borderColor: selectedAvatar === preset.id ? '#E8C57E' : 'transparent' }}>
                          {selectedAvatar === preset.id && (
                            <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>
                            </div>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* Error — mobile */}
            {error && (
              <div className="md:hidden mt-3 px-4 py-3 rounded-xl bg-rose-500/20 border border-rose-500/40 text-[13px] text-rose-300">{error}</div>
            )}
          </div>
        </div>
      </div>

      {/* Hidden measurement spans */}
      <div style={{ position: 'fixed', top: -9999, left: -9999, visibility: 'hidden', pointerEvents: 'none' }}>
        {zones.filter(z => z.type === 'text' || z.type === 'custom').map(z => {
          const spanWidth = Math.round((z.w / backgroundWidth) * previewWidth);
          const displayVal = values[z.id] || z.sample || z.placeholder || 'Tap to edit';
          return (
            <span key={z.id} ref={el => { measureSpanRefs.current[z.id] = el; }}
              style={{
                display: 'block', width: `${spanWidth}px`,
                fontFamily: z.font, fontWeight: z.weight ?? 700,
                fontSize: `${(z.size ?? 32) * scale}px`, lineHeight: z.lineHeight ?? 1.2,
                letterSpacing: z.letterSpacing ? `${z.letterSpacing * scale}px` : undefined,
                textTransform: z.textTransform, wordBreak: 'break-word', whiteSpace: 'pre-wrap',
              }}>{displayVal}</span>
          );
        })}
      </div>

      {/* Hidden file inputs */}
      {zones.filter(z => z.type === 'photo').map(z => (
        <input key={z.id} ref={el => { fileInputRefs.current[z.id] = el; }}
          type="file" accept="image/*" className="hidden"
          onChange={e => { const f = e.target.files?.[0]; if (f) { handlePhotoSelect(z.id, f); setActivePhotoZoneId(null); } }}/>
      ))}

      {/* Sticky bottom CTA — mobile only */}
      <div className="fixed bottom-0 left-0 right-0 z-10 md:hidden"
        style={{ background: 'linear-gradient(to top, rgba(7,15,11,1) 60%, transparent)' }}>
        <div className="max-w-[390px] mx-auto px-5 pb-7 pt-5">
          {generateButton(true)}
          <div className="text-center mt-2 text-[10px] font-mono text-white/20">
            Powered by <span style={{ background: 'linear-gradient(135deg,#1F4D3A,#E8C57E)', WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent' }}>Cardly</span>
          </div>
        </div>
      </div>
    </div>
  );
}
