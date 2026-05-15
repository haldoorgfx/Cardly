'use client';

import { useState, useRef, useEffect, useLayoutEffect, type CSSProperties } from 'react';
import type { Zone } from '@/types/database';
import {
  Pencil, Check, Download, Upload, Copy, ChevronLeft,
  Layers, Camera, ArrowRight, Share2, Sparkles,
} from 'lucide-react';

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

const SYSTEM_FONTS_ATTENDEE = new Set([
  'georgia', 'times new roman', 'times', 'arial', 'helvetica',
  'verdana', 'trebuchet ms', 'courier new', 'courier',
  'sans-serif', 'serif', 'monospace',
]);

/* ── Social icons ─────────────────────────────────────────────────────────── */
function SocialIcon({ name }: { name: string }) {
  if (name === 'WhatsApp') return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="white">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
    </svg>
  );
  if (name === 'Instagram') return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="white">
      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/>
    </svg>
  );
  if (name === 'X') return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="white">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
    </svg>
  );
  if (name === 'LinkedIn') return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="white">
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
    </svg>
  );
  return null;
}

/* ── Confetti ─────────────────────────────────────────────────────────────── */
function Confetti() {
  const pieces = Array.from({ length: 24 }).map((_, i) => ({
    left: `${4 + (i / 23) * 92}%`,
    color: ['#1F4D3A', '#E8C57E', '#2A6A50', '#C9A45E', '#163828', '#E8EFEB'][i % 6],
    delay: `${(i * 0.06).toFixed(2)}s`,
    dur: `${2.8 + (i % 5) * 0.4}s`,
    size: i % 3 === 0 ? 10 : 7,
  }));
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-50">
      {pieces.map((p, i) => (
        <div key={i} className="absolute rounded-sm"
          style={{ left: p.left, top: '-12px', background: p.color,
            width: p.size, height: p.size,
            animation: `confettiFall ${p.dur} ease-in ${p.delay} forwards` }} />
      ))}
      <style>{`@keyframes confettiFall{0%{transform:translateY(0) rotate(0deg);opacity:1}100%{transform:translateY(105vh) rotate(720deg);opacity:0}}`}</style>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════ */
export default function AttendeeClient({
  variantId, eventName, backgroundUrl, backgroundWidth, backgroundHeight, zones,
}: Props) {

  /* ── State ──────────────────────────────────────────────────────────────── */
  const [values, setValues]                     = useState<FieldValues>({});
  const [photoFiles, setPhotoFiles]             = useState<Record<string, File>>({});
  const [photoUrls, setPhotoUrls]               = useState<Record<string, string>>({});
  const [screen, setScreen]                     = useState<Screen>('form');
  const [resultUrl, setResultUrl]               = useState<string | null>(null);
  const [error, setError]                       = useState('');
  const [toast, setToast]                       = useState<string | null>(null);
  const [downloaded, setDownloaded]             = useState(false);
  const [editingZoneId, setEditingZoneId]       = useState<string | null>(null);
  const [activePhotoZoneId, setActivePhotoZoneId] = useState<string | null>(null);
  const [photoDropActive, setPhotoDropActive]   = useState<string | null>(null);

  /* ── Refs ───────────────────────────────────────────────────────────────── */
  const fileInputRefs   = useRef<Record<string, HTMLInputElement | null>>({});
  const cardRef         = useRef<HTMLDivElement>(null);
  const [previewWidth, setPreviewWidth]         = useState(343);
  const [measuredHeights, setMeasuredHeights]   = useState<Record<string, number>>({});
  const measureSpanRefs = useRef<Record<string, HTMLSpanElement | null>>({});

  /* ── Measure card width ─────────────────────────────────────────────────── */
  useEffect(() => {
    const update = () => { if (cardRef.current) setPreviewWidth(cardRef.current.offsetWidth); };
    update();
    const ro = new ResizeObserver(update);
    if (cardRef.current) ro.observe(cardRef.current);
    return () => ro.disconnect();
  }, []);

  /* ── Measure text heights for reflow ───────────────────────────────────── */
  useLayoutEffect(() => {
    const heights: Record<string, number> = {};
    let changed = false;
    for (const [id, el] of Object.entries(measureSpanRefs.current)) {
      if (el) { const h = el.offsetHeight; heights[id] = h; if (h !== (measuredHeights[id] ?? 0)) changed = true; }
    }
    if (changed) setMeasuredHeights(heights);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [values, previewWidth]);

  /* ── Load Google Fonts ──────────────────────────────────────────────────── */
  useEffect(() => {
    const families = Array.from(new Set(
      zones.filter(z => z.font && !SYSTEM_FONTS_ATTENDEE.has(z.font.toLowerCase()))
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

  /* ── Helpers ────────────────────────────────────────────────────────────── */
  const photoZones    = zones.filter(z => z.type === 'photo');
  const textZones     = zones.filter(z => z.type === 'text' || z.type === 'custom');
  const requiredZones = zones.filter(z => z.required);
  const filledCount   = requiredZones.filter(z =>
    z.type === 'photo' ? !!photoFiles[z.id] : !!values[z.id]?.trim()
  ).length;
  const progressPct   = requiredZones.length > 0 ? (filledCount / requiredZones.length) * 100 : 100;
  const allDone       = zones.every(z => !z.required || (z.type === 'photo' ? !!photoFiles[z.id] : !!values[z.id]?.trim()));

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(null), 2200); };

  const handlePhotoSelect = (zoneId: string, file: File) => {
    setPhotoFiles(p => ({ ...p, [zoneId]: file }));
    setPhotoUrls(u => ({ ...u, [zoneId]: URL.createObjectURL(file) }));
  };

  const handleGenerate = async () => {
    setScreen('generating'); setError('');
    try {
      const fd = new FormData();
      fd.append('variantId', variantId);
      fd.append('fields', JSON.stringify(values));
      for (const [zoneId, file] of Object.entries(photoFiles))
        fd.append(`photo_${zoneId}`, file);

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
  const scale       = previewWidth / backgroundWidth;

  /* ─────────────────────────────────────────────────────────────────────────
     E3 — Success
  ───────────────────────────────────────────────────────────────────────── */
  if (screen === 'success') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-4 py-10"
        style={{ background: '#FAF6EE' }}>
        <Confetti />
        {/* Check circle */}
        <div className="h-20 w-20 rounded-full flex items-center justify-center mb-5 shadow-lg"
          style={{ background: '#1F4D3A' }}>
          <Check size={34} strokeWidth={2.5} color="white" />
        </div>
        <h2 className="font-display font-bold text-[#0F1F18] text-[28px] mb-1.5 text-center">
          You&apos;re all set, {firstName}!
        </h2>
        <p className="text-[#6B7A72] text-[14.5px] text-center max-w-[300px] mb-8">
          Your card is ready. Share it with your network.
        </p>
        {resultUrl && (
          <div className="mb-8 rounded-2xl overflow-hidden w-[150px] shadow-xl border border-[#E5E0D4]"
            style={{ aspectRatio: `${backgroundWidth}/${backgroundHeight}` }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={resultUrl} alt="Your card" className="w-full h-full object-cover" />
          </div>
        )}

        {/* Share buttons */}
        <div className="text-[10px] font-mono text-[#6B7A72] mb-3 tracking-widest">SHARE WITH YOUR NETWORK</div>
        <div className="grid grid-cols-4 gap-3 mb-8">
          {[
            { name: 'WhatsApp', bg: '#25D366', href: `https://wa.me/?text=${encodeURIComponent(cardCaption)}` },
            { name: 'Instagram', bg: 'linear-gradient(45deg,#f09433,#e6683c 25%,#dc2743 50%,#cc2366 75%,#bc1888)', href: '#' },
            { name: 'X',        bg: '#000000', href: `https://twitter.com/intent/tweet?text=${encodeURIComponent(cardCaption)}` },
            { name: 'LinkedIn', bg: '#0077b5', href: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent('https://cardly.app')}` },
          ].map(s => (
            <a key={s.name} href={s.href} target="_blank" rel="noopener noreferrer" className="flex flex-col items-center gap-2">
              <div className="h-12 w-12 rounded-2xl flex items-center justify-center shadow-md"
                style={{ background: s.bg }}>
                <SocialIcon name={s.name} />
              </div>
              <span className="text-[10px] font-mono text-[#6B7A72]">{s.name}</span>
            </a>
          ))}
        </div>

        {/* Caption copy */}
        <div className="w-full max-w-[340px] bg-white rounded-2xl p-4 mb-6 border border-[#E5E0D4] shadow-sm">
          <div className="text-[10px] font-mono text-[#6B7A72] mb-2">SUGGESTED CAPTION</div>
          <p className="text-[13px] text-[#3A4A42] leading-relaxed italic">&ldquo;{cardCaption}&rdquo;</p>
          <button onClick={() => { navigator.clipboard?.writeText(cardCaption); showToast('Caption copied!'); }}
            className="mt-3 text-[11px] font-mono text-[#1F4D3A] flex items-center gap-1.5 hover:underline transition">
            <Copy size={11} strokeWidth={2} />
            Copy caption
          </button>
        </div>

        <button onClick={() => { setScreen('result'); setDownloaded(false); }}
          className="text-[13px] text-[#6B7A72] hover:text-[#1F4D3A] transition">
          ← Back to my card
        </button>
        <div className="mt-8 text-[11px] font-mono text-[#6B7A72]/50">Made with Cardly</div>
      </div>
    );
  }

  /* ─────────────────────────────────────────────────────────────────────────
     E2 — Result
  ───────────────────────────────────────────────────────────────────────── */
  if (screen === 'result' && resultUrl) {
    return (
      <div className="min-h-screen flex flex-col items-center px-4 pt-8 pb-12"
        style={{ background: '#FAF6EE' }}>
        {toast && (
          <div className="fixed top-5 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 bg-[#1F4D3A] text-white text-[13px] font-medium px-4 py-2.5 rounded-xl shadow-lg whitespace-nowrap">
            <Check size={14} strokeWidth={2.5} />{toast}
          </div>
        )}
        <div className="w-full max-w-[375px]">
          {/* Top nav */}
          <div className="flex items-center justify-between mb-6">
            <button onClick={() => setScreen('form')}
              className="h-9 w-9 rounded-xl border border-[#E5E0D4] bg-white grid place-items-center text-[#6B7A72] hover:bg-[#E8EFEB] transition shadow-sm">
              <ChevronLeft size={16} strokeWidth={2} />
            </button>
            <div className="text-[11px] font-mono text-[#6B7A72] tracking-widest">YOUR CARD IS READY</div>
            <div className="flex items-center gap-1.5 text-[11px] font-mono text-[#1F4D3A]">
              <span className="h-1.5 w-1.5 rounded-full bg-[#2D7A4F] animate-pulse"/>LIVE
            </div>
          </div>

          {/* Card */}
          <div className="rounded-2xl overflow-hidden mb-2 border border-[#E5E0D4]"
            style={{ boxShadow: '0 20px 60px rgba(15,31,24,0.12)', aspectRatio: `${backgroundWidth}/${backgroundHeight}` }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={resultUrl} alt="Your personalized card" className="w-full h-full object-cover"/>
          </div>
          <div className="text-center text-[11px] font-mono text-[#6B7A72]/60 mb-5">
            {backgroundWidth} × {backgroundHeight}px · PNG
          </div>

          {/* Download CTA */}
          <button onClick={handleDownload}
            className="w-full h-14 rounded-2xl font-display font-bold text-[16px] text-white mb-3 flex items-center justify-center gap-2.5 transition hover:opacity-90"
            style={{ background: '#1F4D3A', boxShadow: '0 8px 24px rgba(31,77,58,0.3)' }}>
            <Download size={18} strokeWidth={2} />
            Download my card
          </button>

          {/* Share row */}
          <div className="grid grid-cols-4 gap-2 mb-5">
            {[
              { name: 'WhatsApp', bg: '#25D366', href: `https://wa.me/?text=${encodeURIComponent(cardCaption)}` },
              { name: 'Instagram', bg: 'linear-gradient(45deg,#f09433,#e6683c 25%,#dc2743 50%,#cc2366 75%,#bc1888)', href: '#' },
              { name: 'X',        bg: '#000000', href: `https://twitter.com/intent/tweet?text=${encodeURIComponent(cardCaption)}` },
              { name: 'LinkedIn', bg: '#0077b5', href: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent('https://cardly.app')}` },
            ].map(s => (
              <a key={s.name} href={s.href} target="_blank" rel="noopener noreferrer" className="flex flex-col items-center gap-1.5">
                <div className="h-11 w-full rounded-xl flex items-center justify-center shadow-sm"
                  style={{ background: s.bg }}>
                  <SocialIcon name={s.name} />
                </div>
                <span className="text-[9px] font-mono text-[#6B7A72] text-center">{s.name}</span>
              </a>
            ))}
          </div>

          {/* Caption */}
          <div className="bg-white border border-[#E5E0D4] rounded-2xl p-4 mb-5 shadow-sm">
            <div className="text-[10px] font-mono text-[#6B7A72] mb-2">SUGGESTED CAPTION</div>
            <p className="text-[12.5px] text-[#3A4A42] leading-relaxed italic">&ldquo;{cardCaption}&rdquo;</p>
            <button onClick={() => { navigator.clipboard?.writeText(cardCaption); showToast('Caption copied!'); }}
              className="mt-2 text-[11px] font-mono text-[#1F4D3A] flex items-center gap-1 hover:underline transition">
              <Copy size={11} strokeWidth={2} />
              Copy caption
            </button>
          </div>

          {/* Footer actions */}
          <div className="flex items-center gap-3">
            <button onClick={() => { setScreen('form'); setResultUrl(null); }}
              className="flex-1 py-3 rounded-xl text-[13px] text-[#6B7A72] border border-[#E5E0D4] bg-white hover:bg-[#E8EFEB] transition flex items-center justify-center gap-1.5 shadow-sm">
              <Pencil size={13} strokeWidth={2} />Edit my info
            </button>
            {downloaded && (
              <button onClick={() => setScreen('success')}
                className="flex-1 py-3 rounded-xl text-[13px] font-semibold text-white bg-[#1F4D3A] hover:bg-[#163828] transition flex items-center justify-center gap-1.5 shadow-sm">
                <Check size={13} strokeWidth={2.5} />Done
              </button>
            )}
          </div>

          <div className="mt-8 text-center text-[11px] font-mono text-[#6B7A72]/40">
            Powered by <span style={{ color: '#1F4D3A', fontWeight: 600 }}>Cardly</span>
          </div>
        </div>
      </div>
    );
  }

  /* ─────────────────────────────────────────────────────────────────────────
     Generating
  ───────────────────────────────────────────────────────────────────────── */
  if (screen === 'generating') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-4"
        style={{ background: '#FAF6EE' }}>
        <div className="text-center">
          {/* Animated logo ring */}
          <div className="relative inline-flex items-center justify-center h-24 w-24 mb-6">
            <div className="absolute inset-0 rounded-full" style={{ background: '#E8EFEB' }} />
            <svg className="absolute inset-0 animate-spin" width="96" height="96" viewBox="0 0 96 96">
              <circle cx="48" cy="48" r="44" fill="none" stroke="#E5E0D4" strokeWidth="3"/>
              <circle cx="48" cy="48" r="44" fill="none" stroke="#1F4D3A" strokeWidth="3"
                strokeLinecap="round" strokeDasharray="80 200" strokeDashoffset="0"/>
            </svg>
            <Sparkles size={28} strokeWidth={1.8} color="#1F4D3A" />
          </div>
          <h2 className="font-display font-bold text-[#0F1F18] text-[24px] mb-2">
            Creating your card…
          </h2>
          <p className="text-[#6B7A72] text-[14px]">Usually under 5 seconds.</p>
          {error && (
            <div className="mt-4 px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-[13px] text-red-700 max-w-[320px]">
              {error}
            </div>
          )}
        </div>
      </div>
    );
  }

  /* ─────────────────────────────────────────────────────────────────────────
     E1 — Form
  ───────────────────────────────────────────────────────────────────────── */
  const generateButton = (fullWidth = true) => (
    <button
      disabled={!allDone}
      onClick={handleGenerate}
      className={`${fullWidth ? 'w-full' : ''} h-14 rounded-2xl font-display font-bold text-[16px] transition flex items-center justify-center gap-2.5`}
      style={allDone
        ? { background: '#1F4D3A', color: 'white', boxShadow: '0 8px 24px rgba(31,77,58,0.28)' }
        : { background: '#E5E0D4', color: '#6B7A72', cursor: 'not-allowed' }}
    >
      {allDone ? (
        <>
          <Layers size={17} strokeWidth={2} />
          Generate my card
        </>
      ) : (
        requiredZones.length > 0
          ? `${requiredZones.length - filledCount} field${requiredZones.length - filledCount !== 1 ? 's' : ''} remaining`
          : 'Generate my card'
      )}
    </button>
  );

  return (
    <div
      className="min-h-screen"
      style={{ background: '#FAF6EE' }}
      onClick={() => { setEditingZoneId(null); setActivePhotoZoneId(null); }}
    >
      {/* Progress bar */}
      <div className="fixed top-0 left-0 right-0 z-30 h-[3px] bg-[#E5E0D4]">
        <div className="h-full transition-all duration-500 ease-out"
          style={{ width: `${progressPct}%`, background: 'linear-gradient(90deg,#1F4D3A,#E8C57E)' }}/>
      </div>

      {/* Toast */}
      {toast && (
        <div className="fixed top-5 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 bg-[#1F4D3A] text-white text-[13px] font-medium px-4 py-2.5 rounded-xl shadow-lg whitespace-nowrap">
          <Check size={13} strokeWidth={2.5} />{toast}
        </div>
      )}

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-32 md:pb-12">

        {/* ── Header ─────────────────────────────────────────────────────── */}
        <div className="mb-6 md:mb-8 flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="inline-flex items-center gap-1.5 text-[11px] font-mono text-[#1F4D3A] bg-[#E8EFEB] px-2.5 py-1 rounded-full mb-2">
              <span className="h-1.5 w-1.5 rounded-full bg-[#2D7A4F]" />
              GET YOUR CARD
            </div>
            <h1 className="font-display font-bold text-[#0F1F18] text-[22px] sm:text-[28px] leading-tight">
              {eventName}
            </h1>
            <p className="text-[13.5px] text-[#6B7A72] mt-1.5">
              Fill in your details below and download your personalised card.
            </p>
          </div>
          {/* Progress pill */}
          {requiredZones.length > 0 && (
            <div className="shrink-0 flex flex-col items-end gap-1.5 mt-1">
              <span className="text-[12px] font-mono text-[#3A4A42]">
                {filledCount}<span className="text-[#6B7A72]">/{requiredZones.length}</span>
              </span>
              <div className="h-1.5 w-20 rounded-full bg-[#E5E0D4] overflow-hidden">
                <div className="h-full rounded-full transition-all duration-400"
                  style={{ width: `${progressPct}%`, background: '#1F4D3A' }}/>
              </div>
            </div>
          )}
        </div>

        {/* ── Two-column layout ───────────────────────────────────────────── */}
        <div className="flex flex-col md:grid md:grid-cols-[1fr_340px] lg:grid-cols-[1fr_380px] md:gap-10 lg:gap-14 md:items-start">

          {/* ══ LEFT: Form panel (desktop) / below card (mobile) ══════════ */}
          <div className="order-2 md:order-1" onClick={e => e.stopPropagation()}>
            <div className="bg-white rounded-2xl border border-[#E5E0D4] shadow-sm overflow-hidden">

              {/* Photo zones */}
              {photoZones.map((z, idx) => (
                <div key={z.id}
                  className={`p-5 ${idx < photoZones.length - 1 || textZones.length > 0 ? 'border-b border-[#E5E0D4]' : ''}`}>
                  <label className="block text-[11px] font-mono text-[#6B7A72] tracking-widest mb-3">
                    {(z.label?.toUpperCase() || 'YOUR PHOTO')}{z.required && <span className="text-[#C97A2D] ml-0.5">*</span>}
                  </label>

                  {/* Drop zone */}
                  <div
                    className="relative rounded-xl overflow-hidden transition-all cursor-pointer"
                    style={{
                      border: photoDropActive === z.id
                        ? '2px dashed #1F4D3A'
                        : photoUrls[z.id]
                          ? '2px solid #E5E0D4'
                          : '2px dashed #C9C3B1',
                      background: photoDropActive === z.id ? '#E8EFEB' : photoUrls[z.id] ? '#fff' : '#FAF6EE',
                      minHeight: 140,
                    }}
                    onClick={() => fileInputRefs.current[z.id]?.click()}
                    onDragOver={e => { e.preventDefault(); setPhotoDropActive(z.id); }}
                    onDragLeave={() => setPhotoDropActive(null)}
                    onDrop={e => {
                      e.preventDefault(); setPhotoDropActive(null);
                      const file = e.dataTransfer.files[0];
                      if (file && file.type.startsWith('image/')) handlePhotoSelect(z.id, file);
                    }}
                  >
                    {photoUrls[z.id] ? (
                      <div className="relative">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={photoUrls[z.id]} alt="" className="w-full object-cover" style={{ maxHeight: 200 }}/>
                        <div className="absolute inset-0 bg-black/0 hover:bg-black/20 transition flex items-center justify-center opacity-0 hover:opacity-100">
                          <div className="bg-white/90 rounded-xl px-3 py-1.5 text-[12px] font-medium text-[#0F1F18] flex items-center gap-1.5">
                            <Camera size={13} strokeWidth={2} /> Change photo
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center gap-3 py-8 px-4">
                        <div className="h-12 w-12 rounded-xl bg-[#E8EFEB] grid place-items-center"
                          style={{ border: '1.5px dashed #6B7A72' }}>
                          <Upload size={20} strokeWidth={1.8} color="#1F4D3A" />
                        </div>
                        <div className="text-center">
                          <div className="text-[13.5px] font-semibold text-[#0F1F18]">
                            {photoDropActive === z.id ? 'Drop to upload' : 'Click to upload photo'}
                          </div>
                          <div className="text-[11.5px] text-[#6B7A72] mt-0.5">JPG or PNG · up to 10 MB</div>
                        </div>
                      </div>
                    )}
                  </div>

                  {photoUrls[z.id] && (
                    <button onClick={() => fileInputRefs.current[z.id]?.click()}
                      className="mt-2 text-[12px] font-mono text-[#1F4D3A] hover:underline transition">
                      Change photo →
                    </button>
                  )}
                </div>
              ))}

              {/* Text / custom zones */}
              {textZones.map((z, idx) => (
                <div key={z.id}
                  className={`p-5 ${idx < textZones.length - 1 ? 'border-b border-[#E5E0D4]' : ''}`}>
                  <label className="block text-[11px] font-mono text-[#6B7A72] tracking-widest mb-2">
                    {(z.label || 'TEXT').toUpperCase()}
                    {z.required && <span className="text-[#C97A2D] ml-0.5">*</span>}
                  </label>
                  {z.type === 'custom' && z.options ? (
                    <select
                      value={values[z.id] ?? ''}
                      onChange={e => setValues(v => ({ ...v, [z.id]: e.target.value }))}
                      className="w-full h-11 px-4 rounded-xl text-[14px] text-[#0F1F18] outline-none appearance-none cursor-pointer transition"
                      style={{
                        background: '#FAF6EE',
                        border: '1.5px solid #E5E0D4',
                        color: values[z.id] ? '#0F1F18' : '#6B7A72',
                      }}
                      onFocus={e => { e.currentTarget.style.borderColor = '#1F4D3A'; e.currentTarget.style.background = '#fff'; }}
                      onBlur={e => { e.currentTarget.style.borderColor = '#E5E0D4'; e.currentTarget.style.background = '#FAF6EE'; }}
                    >
                      <option value="" disabled>Select {z.label ?? 'option'}…</option>
                      {(z.options as string[]).map(opt => (
                        <option key={opt} value={opt}>{opt}</option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type="text"
                      value={values[z.id] ?? ''}
                      onChange={e => setValues(v => ({ ...v, [z.id]: e.target.value }))}
                      placeholder={z.placeholder || `Enter ${z.label || 'text'}…`}
                      className="w-full h-11 px-4 rounded-xl text-[14px] text-[#0F1F18] placeholder-[#6B7A72]/60 outline-none transition"
                      style={{
                        background: '#FAF6EE',
                        border: '1.5px solid #E5E0D4',
                      }}
                      onFocus={e => { e.currentTarget.style.borderColor = '#1F4D3A'; e.currentTarget.style.background = '#fff'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(31,77,58,0.1)'; }}
                      onBlur={e => { e.currentTarget.style.borderColor = '#E5E0D4'; e.currentTarget.style.background = '#FAF6EE'; e.currentTarget.style.boxShadow = 'none'; }}
                    />
                  )}
                </div>
              ))}

              {/* Error */}
              {error && (
                <div className="mx-5 mb-4 px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-[13px] text-red-700">
                  {error}
                </div>
              )}

              {/* CTA */}
              <div className="p-5 border-t border-[#E5E0D4]">
                {generateButton(true)}
                <div className="text-center mt-3 text-[11px] font-mono text-[#6B7A72]/50">
                  Powered by <span style={{ color: '#1F4D3A', fontWeight: 600 }}>Cardly</span>
                </div>
              </div>
            </div>
          </div>

          {/* ══ RIGHT: Card preview ════════════════════════════════════════ */}
          <div className="order-1 md:order-2 w-full mb-6 md:mb-0 md:sticky md:top-6"
            onClick={e => e.stopPropagation()}>

            {/* Hint */}
            <div className="flex items-center justify-between mb-3">
              <div className="text-[11px] font-mono text-[#6B7A72] tracking-wide">LIVE PREVIEW</div>
              <div className="text-[11px] text-[#6B7A72]">
                {editingZoneId ? 'Press Enter to confirm' : 'Tap a field on the card'}
              </div>
            </div>

            {/* Card */}
            <div
              ref={cardRef}
              className="relative overflow-hidden rounded-2xl border border-[#E5E0D4]"
              style={{
                aspectRatio: `${backgroundWidth}/${backgroundHeight}`,
                boxShadow: '0 20px 60px rgba(15,31,24,0.10), 0 4px 12px rgba(15,31,24,0.06)',
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={backgroundUrl} alt={eventName} className="w-full h-full object-cover" draggable={false}/>

              {zones.map(z => {
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

                /* Photo zone */
                if (z.type === 'photo') {
                  const br = z.shape === 'circle' ? '50%' : z.shape === 'rounded' ? '20%' : '6px';
                  const photoUrl = photoUrls[z.id];
                  const isActive = activePhotoZoneId === z.id;
                  return (
                    <div key={z.id} className="absolute" style={{ left: `${left}%`, top: `${top}%`, width: `${width}%`, height: `${height}%`, transition: 'top 0.15s ease', cursor: 'pointer' }}>
                      <div
                        className="w-full h-full overflow-hidden transition-all"
                        style={{
                          borderRadius: br,
                          outline: isActive ? '2.5px solid #E8C57E' : photoUrl ? 'none' : '2px dashed rgba(255,255,255,0.5)',
                          outlineOffset: '2px',
                        }}
                        onClick={e => {
                          e.stopPropagation();
                          setEditingZoneId(null);
                          if (!photoUrl) { fileInputRefs.current[z.id]?.click(); setActivePhotoZoneId(z.id); }
                          else setActivePhotoZoneId(isActive ? null : z.id);
                        }}
                      >
                        {photoUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={photoUrl} alt="" className="w-full h-full object-cover"/>
                        ) : (
                          <div className="w-full h-full flex flex-col items-center justify-center gap-1.5"
                            style={{ background: 'rgba(10,24,16,0.65)', backdropFilter: 'blur(6px)' }}>
                            <div className="rounded-full flex items-center justify-center"
                              style={{ width: '38%', aspectRatio: '1/1', border: '2px dashed rgba(255,255,255,0.5)' }}>
                              <Camera style={{ width: '40%', height: '40%' }} color="rgba(255,255,255,0.9)" strokeWidth={1.8} />
                            </div>
                            <span style={{ fontSize: `${Math.max(7, 8 * scale)}px`, color: 'rgba(255,255,255,0.85)', fontWeight: 600, letterSpacing: '0.03em' }}>
                              Add photo
                            </span>
                          </div>
                        )}
                      </div>
                      {/* Photo action popover */}
                      {isActive && (
                        <div className="absolute left-1/2 -translate-x-1/2 mt-2 z-20 rounded-xl shadow-lg border border-[#E5E0D4] bg-white p-2 flex flex-col gap-1 min-w-[140px]"
                          style={{ top: '100%' }}
                          onClick={e => e.stopPropagation()}>
                          <button onClick={() => { fileInputRefs.current[z.id]?.click(); setActivePhotoZoneId(null); }}
                            className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-[#E8EFEB] text-[12.5px] text-[#0F1F18] text-left transition">
                            <Upload size={13} strokeWidth={2} color="#1F4D3A"/>
                            {photoUrl ? 'Change photo' : 'Upload photo'}
                          </button>
                          {photoUrl && (
                            <button onClick={() => { setPhotoFiles(p => { const n = {...p}; delete n[z.id]; return n; }); setPhotoUrls(u => { const n = {...u}; delete n[z.id]; return n; }); setActivePhotoZoneId(null); }}
                              className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-red-50 text-[12.5px] text-red-600 text-left transition">
                              Remove
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  );
                }

                /* Static shape/image zones */
                if (z.type === 'shape' || z.type === 'image') return null;

                /* Label zone */
                if (z.type === 'label') {
                  const txt = z.sample || z.placeholder || '';
                  if (!txt) return null;
                  const jc = (z.verticalAlign ?? 'top') === 'bottom' ? 'flex-end' : (z.verticalAlign ?? 'top') === 'center' ? 'center' : 'flex-start';
                  return (
                    <div key={z.id} className="absolute overflow-hidden"
                      style={{ left: `${left}%`, top: `${top}%`, width: `${width}%`, height: `${height}%`, display: 'flex', flexDirection: 'column', justifyContent: jc, transition: 'top 0.15s ease' }}>
                      <span style={{ display: 'block', fontFamily: z.font, fontWeight: z.weight, fontSize: `${(z.size ?? 32) * scale}px`, color: z.color, lineHeight: z.lineHeight ?? 1.2, textAlign: z.align, wordBreak: 'break-word', letterSpacing: z.letterSpacing ? `${z.letterSpacing * scale}px` : undefined, textTransform: z.textTransform as 'none' | 'uppercase' | 'lowercase' | undefined }}>{txt}</span>
                    </div>
                  );
                }

                /* Text / custom zone */
                const isEditing  = editingZoneId === z.id;
                const typedVal   = values[z.id] ?? '';
                const ghostVal   = z.sample || z.placeholder || z.label || '';
                const displayVal = typedVal || ghostVal;
                const isGhost    = !typedVal;
                const jc         = (z.verticalAlign ?? 'top') === 'bottom' ? 'flex-end' : (z.verticalAlign ?? 'top') === 'center' ? 'center' : 'flex-start';
                const textStyle: CSSProperties = {
                  display: 'block', fontFamily: z.font, fontWeight: z.weight,
                  fontSize: `${(z.size ?? 32) * scale}px`, color: z.color ?? '#FFFFFF',
                  lineHeight: z.lineHeight ?? 1.2, textAlign: z.align,
                  letterSpacing: z.letterSpacing ? `${z.letterSpacing * scale}px` : undefined,
                  textTransform: z.textTransform as 'none' | 'uppercase' | 'lowercase' | undefined,
                  WebkitTextStroke: (z.strokeColor && (z.strokeWidth ?? 0) > 0) ? `${(z.strokeWidth ?? 0) * scale}px ${z.strokeColor}` : undefined,
                  textShadow: (z.shadowColor && (z.shadowBlur ?? 0) > 0) ? `${(z.shadowX ?? 0) * scale}px ${(z.shadowY ?? 0) * scale}px ${(z.shadowBlur ?? 0) * scale}px ${z.shadowColor}` : undefined,
                  wordBreak: 'break-word',
                };
                return (
                  <div key={z.id} className="absolute"
                    style={{ left: `${left}%`, top: `${top}%`, width: `${width}%`, minHeight: `${height}%`, display: 'flex', flexDirection: 'column', justifyContent: jc, transition: 'top 0.15s ease', cursor: 'text', outline: isEditing ? '2px solid rgba(232,197,126,0.9)' : isGhost ? '1.5px dashed rgba(232,197,126,0.45)' : 'none', outlineOffset: '2px', borderRadius: 3 }}
                    onClick={e => { e.stopPropagation(); setActivePhotoZoneId(null); setEditingZoneId(z.id); }}
                  >
                    {isEditing ? (
                      <textarea
                        autoFocus rows={1}
                        value={typedVal}
                        onChange={e => setValues(v => ({ ...v, [z.id]: e.target.value }))}
                        onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); setEditingZoneId(null); } }}
                        onBlur={() => setEditingZoneId(null)}
                        onClick={e => e.stopPropagation()}
                        style={{ ...textStyle, display: 'block', width: '100%', background: 'transparent', border: 'none', outline: 'none', resize: 'none', padding: 0, margin: 0, overflow: 'hidden', caretColor: z.color ?? '#FFFFFF', WebkitAppearance: 'none' }}
                        ref={el => { if (el) { el.style.height = 'auto'; el.style.height = el.scrollHeight + 'px'; } }}
                        onInput={e => { const t = e.currentTarget; t.style.height = 'auto'; t.style.height = t.scrollHeight + 'px'; }}
                      />
                    ) : (
                      <span style={{ ...textStyle, opacity: isGhost ? 0.5 : 1 }}>{displayVal || 'Tap to edit'}</span>
                    )}
                    {/* Pencil badge */}
                    {!isEditing && isGhost && (
                      <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/2"
                        style={{ background: 'rgba(31,77,58,0.9)', borderRadius: '50%', padding: 4 }}>
                        <Pencil size={9} strokeWidth={2.5} color="white" />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Mobile: quick action below card */}
            <p className="md:hidden text-[11.5px] text-[#6B7A72] mt-2.5 text-center">
              Tap any field on the card above to edit it directly
            </p>

            {/* Card dimensions badge */}
            <div className="hidden md:flex items-center justify-center mt-2.5">
              <span className="text-[10.5px] font-mono text-[#6B7A72]/70">
                {backgroundWidth} × {backgroundHeight}px
              </span>
            </div>
          </div>

        </div>
      </div>

      {/* Hidden measurement spans */}
      <div style={{ position: 'fixed', top: -9999, left: -9999, visibility: 'hidden', pointerEvents: 'none' }}>
        {zones.filter(z => z.type === 'text' || z.type === 'custom').map(z => {
          const spanWidth  = Math.round((z.w / backgroundWidth) * previewWidth);
          const displayVal = values[z.id] || z.sample || z.placeholder || 'Tap to edit';
          return (
            <span key={z.id} ref={el => { measureSpanRefs.current[z.id] = el; }}
              style={{ display: 'block', width: `${spanWidth}px`, fontFamily: z.font, fontWeight: z.weight ?? 700, fontSize: `${(z.size ?? 32) * scale}px`, lineHeight: z.lineHeight ?? 1.2, letterSpacing: z.letterSpacing ? `${z.letterSpacing * scale}px` : undefined, textTransform: z.textTransform, wordBreak: 'break-word', whiteSpace: 'pre-wrap' }}>
              {displayVal}
            </span>
          );
        })}
      </div>

      {/* Hidden file inputs */}
      {zones.filter(z => z.type === 'photo').map(z => (
        <input key={z.id} ref={el => { fileInputRefs.current[z.id] = el; }}
          type="file" accept="image/*" className="hidden"
          onChange={e => { const f = e.target.files?.[0]; if (f) { handlePhotoSelect(z.id, f); setActivePhotoZoneId(null); } }}/>
      ))}

      {/* Sticky mobile CTA */}
      <div className="fixed bottom-0 left-0 right-0 z-20 md:hidden"
        style={{ background: 'linear-gradient(to top, #FAF6EE 65%, transparent)', paddingTop: 20 }}>
        <div className="max-w-[420px] mx-auto px-5 pb-6 pt-2">
          {generateButton(true)}
          <div className="text-center mt-2.5 text-[10.5px] font-mono text-[#6B7A72]/50">
            Powered by <span style={{ color: '#1F4D3A', fontWeight: 600 }}>Cardly</span>
          </div>
        </div>
      </div>
    </div>
  );
}
