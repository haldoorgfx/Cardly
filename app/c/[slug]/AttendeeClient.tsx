'use client';

import {
  useState, useRef, useEffect, useLayoutEffect,
  useCallback, type CSSProperties,
} from 'react';
import type { Zone } from '@/types/database';
import {
  Check, Download, Upload, Copy, ChevronLeft, ChevronRight,
  Layers, Camera, Pencil, Sparkles, X,
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

const SYSTEM_FONTS = new Set([
  'georgia','times new roman','times','arial','helvetica',
  'verdana','trebuchet ms','courier new','courier',
  'sans-serif','serif','monospace',
]);

/* ── Social icons ─────────────────────────────────────────────────────────── */
function SI({ n }: { n: string }) {
  if (n === 'WhatsApp')  return <svg width="20" height="20" viewBox="0 0 24 24" fill="white"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/></svg>;
  if (n === 'Instagram') return <svg width="18" height="18" viewBox="0 0 24 24" fill="white"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg>;
  if (n === 'X')         return <svg width="16" height="16" viewBox="0 0 24 24" fill="white"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>;
  if (n === 'LinkedIn')  return <svg width="18" height="18" viewBox="0 0 24 24" fill="white"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>;
  return null;
}

function Confetti() {
  const p = Array.from({ length: 24 }).map((_, i) => ({
    left: `${4 + (i / 23) * 92}%`,
    color: ['#1F4D3A','#E8C57E','#2A6A50','#C9A45E','#163828','#E8EFEB'][i % 6],
    delay: `${(i * 0.06).toFixed(2)}s`, dur: `${2.8 + (i % 5) * 0.4}s`, size: i % 3 === 0 ? 10 : 7,
  }));
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-50">
      {p.map((x, i) => <div key={i} className="absolute rounded-sm" style={{ left: x.left, top: '-12px', background: x.color, width: x.size, height: x.size, animation: `cf ${x.dur} ease-in ${x.delay} forwards` }}/>)}
      <style>{`@keyframes cf{0%{transform:translateY(0) rotate(0);opacity:1}100%{transform:translateY(105vh) rotate(720deg);opacity:0}}`}</style>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════ */
export default function AttendeeClient({
  variantId, eventName, backgroundUrl, backgroundWidth, backgroundHeight, zones,
}: Props) {

  /* ── State ──────────────────────────────────────────────────────────────── */
  const [values, setValues]         = useState<FieldValues>({});
  const [photoFiles, setPhotoFiles] = useState<Record<string, File>>({});
  const [photoUrls, setPhotoUrls]   = useState<Record<string, string>>({});
  const [screen, setScreen]         = useState<Screen>('form');
  const [resultUrl, setResultUrl]   = useState<string | null>(null);
  const [error, setError]           = useState('');
  const [toast, setToast]           = useState<string | null>(null);
  const [downloaded, setDownloaded] = useState(false);
  const [activeIdx, setActiveIdx]   = useState(0);   // mobile field stepper
  const [dropActive, setDropActive] = useState(false);

  const fileInputRefs   = useRef<Record<string, HTMLInputElement | null>>({});
  const inputRef        = useRef<HTMLInputElement | null>(null);
  const cardRef         = useRef<HTMLDivElement>(null);
  const [previewW, setPreviewW]               = useState(360);
  const [measuredHeights, setMeasuredHeights] = useState<Record<string, number>>({});
  const measureRefs     = useRef<Record<string, HTMLSpanElement | null>>({});

  /* ── Derived ────────────────────────────────────────────────────────────── */
  // All user-editable fields in card-position order (top → bottom)
  const editableFields = [...zones.filter(z => z.type === 'photo' || z.type === 'text' || z.type === 'custom')]
    .sort((a, b) => a.y - b.y || a.x - b.x);

  const activeField   = editableFields[activeIdx] ?? null;
  const requiredZones = zones.filter(z => z.required);
  const filledCount   = requiredZones.filter(z =>
    z.type === 'photo' ? !!photoFiles[z.id] : !!values[z.id]?.trim()
  ).length;
  const progressPct   = requiredZones.length > 0 ? (filledCount / requiredZones.length) * 100 : 100;
  const allDone       = zones.every(z => !z.required || (z.type === 'photo' ? !!photoFiles[z.id] : !!values[z.id]?.trim()));
  const scale         = previewW / backgroundWidth;
  const isLastField   = activeIdx === editableFields.length - 1;

  /* ── Measurements ───────────────────────────────────────────────────────── */
  useEffect(() => {
    const update = () => { if (cardRef.current) setPreviewW(cardRef.current.offsetWidth); };
    update();
    const ro = new ResizeObserver(update);
    if (cardRef.current) ro.observe(cardRef.current);
    return () => ro.disconnect();
  }, []);

  useLayoutEffect(() => {
    const h: Record<string, number> = {}; let changed = false;
    for (const [id, el] of Object.entries(measureRefs.current)) {
      if (el) { const v = el.offsetHeight; h[id] = v; if (v !== (measuredHeights[id] ?? 0)) changed = true; }
    }
    if (changed) setMeasuredHeights(h);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [values, previewW]);

  /* ── Google Fonts ───────────────────────────────────────────────────────── */
  useEffect(() => {
    const families = Array.from(new Set(
      zones.filter(z => z.font && !SYSTEM_FONTS.has(z.font.toLowerCase()))
        .map(z => {
          const ws = new Set<number>();
          zones.filter(z2 => z2.font === z.font).forEach(z2 => ws.add(z2.weight ?? 400));
          return `${z.font!.replace(/\s+/g, '+')}:wght@${Array.from(ws).sort().join(';')}`;
        })
    ));
    if (!families.length) return;
    const id = 'cardly-gfonts';
    if (document.getElementById(id)) return;
    const link = document.createElement('link');
    link.id = id; link.rel = 'stylesheet';
    link.href = `https://fonts.googleapis.com/css2?${families.map(f => `family=${f}`).join('&')}&display=swap`;
    document.head.appendChild(link);
  }, [zones]);

  /* ── Helpers ────────────────────────────────────────────────────────────── */
  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(null), 2200); };

  const handlePhotoSelect = useCallback((zoneId: string, file: File) => {
    setPhotoFiles(p => ({ ...p, [zoneId]: file }));
    setPhotoUrls(u => ({ ...u, [zoneId]: URL.createObjectURL(file) }));
  }, []);

  const goNext = () => { if (activeIdx < editableFields.length - 1) setActiveIdx(i => i + 1); };
  const goPrev = () => { if (activeIdx > 0) setActiveIdx(i => i - 1); };

  // Focus text input when field changes
  useEffect(() => {
    if (activeField && activeField.type !== 'photo') {
      setTimeout(() => inputRef.current?.focus(), 80);
    }
  }, [activeIdx, activeField]);

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
    a.href = resultUrl; a.download = `${eventName.toLowerCase().replace(/\s+/g, '-')}-card.png`;
    a.click(); setDownloaded(true);
    showToast('Card saved!');
    setTimeout(() => setScreen('success'), 1600);
  };

  const firstName   = Object.values(values)[0]?.split(' ')[0] ?? 'You';
  const shortName   = eventName.replace(/^I am attending\s*/i,'').replace(/^I'm attending\s*/i,'').trim() || eventName;
  const caption     = `I'm attending ${shortName}! Get your personalized card 🎉`;
  const SHARE       = [
    { n:'WhatsApp',  bg:'#25D366',   href:`https://wa.me/?text=${encodeURIComponent(caption)}` },
    { n:'Instagram', bg:'linear-gradient(45deg,#f09433,#e6683c 25%,#dc2743 50%,#cc2366 75%,#bc1888)', href:'#' },
    { n:'X',         bg:'#000',      href:`https://twitter.com/intent/tweet?text=${encodeURIComponent(caption)}` },
    { n:'LinkedIn',  bg:'#0077b5',   href:`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent('https://cardly.app')}` },
  ];

  /* ── Shared overlay components ──────────────────────────────────────────── */
  const Toast = () => toast ? (
    <div className="fixed top-5 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 bg-[#1F4D3A] text-white text-[13px] font-medium px-4 py-2.5 rounded-xl shadow-lg whitespace-nowrap">
      <Check size={13} strokeWidth={2.5}/>{toast}
    </div>
  ) : null;

  /* ─────────────────────────────────────────────────────────────────────────
     Card renderer — used in both mobile and desktop views
     Zones are purely visual; clicking a zone on mobile switches activeIdx
  ───────────────────────────────────────────────────────────────────────── */
  const renderCard = (interactive = false) => (
    <div
      ref={cardRef}
      className="relative overflow-hidden rounded-2xl border border-black/10"
      style={{
        aspectRatio: `${backgroundWidth}/${backgroundHeight}`,
        boxShadow: '0 20px 60px rgba(15,31,24,0.18), 0 2px 8px rgba(15,31,24,0.08)',
      }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={backgroundUrl} alt={eventName} className="w-full h-full object-cover" draggable={false}/>

      {zones.map(z => {
        const accOff = (() => {
          let off = 0;
          for (const tz of zones) {
            if (tz.type !== 'text' && tz.type !== 'custom') continue;
            if (tz.id === z.id) continue;
            if (tz.y + tz.h <= z.y) { const mh = measuredHeights[tz.id]; if (mh) off += Math.max(0, mh / scale - tz.h); }
          }
          return off;
        })();

        const left   = (z.x / backgroundWidth)  * 100;
        const top    = ((z.y + accOff) / backgroundHeight) * 100;
        const width  = (z.w / backgroundWidth)  * 100;
        const height = (z.h / backgroundHeight) * 100;

        const isActive   = interactive && activeField?.id === z.id;
        const fieldIdx   = editableFields.findIndex(f => f.id === z.id);
        const isFilled   = z.type === 'photo' ? !!photoUrls[z.id] : !!values[z.id]?.trim();

        /* Photo zone */
        if (z.type === 'photo') {
          const br  = z.shape === 'circle' ? '50%' : z.shape === 'rounded' ? '20%' : '6px';
          const url = photoUrls[z.id];
          return (
            <div key={z.id} className="absolute" style={{ left:`${left}%`, top:`${top}%`, width:`${width}%`, height:`${height}%`, cursor: interactive ? 'pointer' : 'default' }}
              onClick={() => interactive && fieldIdx >= 0 && setActiveIdx(fieldIdx)}>
              <div className="w-full h-full overflow-hidden transition-all" style={{
                borderRadius: br,
                outline: isActive ? '3px solid #E8C57E' : (!isFilled && interactive) ? '2px dashed rgba(255,255,255,0.5)' : 'none',
                outlineOffset: '2px',
              }}>
                {url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={url} alt="" className="w-full h-full object-cover"/>
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center gap-1"
                    style={{ background:'rgba(15,31,24,0.5)', backdropFilter:'blur(4px)' }}>
                    <Camera style={{ width:'30%', height:'30%', opacity:0.8 }} color="white" strokeWidth={1.5}/>
                    <span style={{ fontSize:`${Math.max(6,7*scale)}px`, color:'rgba(255,255,255,0.8)', fontWeight:600 }}>
                      {isActive ? 'Tap to add' : 'Photo'}
                    </span>
                  </div>
                )}
              </div>
              {/* Active ring pulse */}
              {isActive && (
                <div className="absolute inset-0 pointer-events-none" style={{ borderRadius: br, boxShadow:'0 0 0 4px rgba(232,197,126,0.35)', animation:'pulse 1.5s ease-in-out infinite' }}/>
              )}
            </div>
          );
        }

        if (z.type === 'shape' || z.type === 'image') return null;

        /* Label zone */
        if (z.type === 'label') {
          const txt = z.sample || z.placeholder || '';
          if (!txt) return null;
          const jc = z.verticalAlign === 'bottom' ? 'flex-end' : z.verticalAlign === 'center' ? 'center' : 'flex-start';
          return (
            <div key={z.id} className="absolute overflow-hidden pointer-events-none"
              style={{ left:`${left}%`, top:`${top}%`, width:`${width}%`, height:`${height}%`, display:'flex', flexDirection:'column', justifyContent:jc }}>
              <span style={{ display:'block', fontFamily:z.font, fontWeight:z.weight, fontSize:`${(z.size??32)*scale}px`, color:z.color, lineHeight:z.lineHeight??1.2, textAlign:z.align, wordBreak:'break-word' }}>{txt}</span>
            </div>
          );
        }

        /* Text / custom zone */
        const typed   = values[z.id] ?? '';
        const ghost   = z.sample || z.placeholder || z.label || '';
        const display = typed || ghost;
        const isGhost = !typed;
        const jc      = z.verticalAlign === 'bottom' ? 'flex-end' : z.verticalAlign === 'center' ? 'center' : 'flex-start';
        const ts: CSSProperties = {
          display:'block', fontFamily:z.font, fontWeight:z.weight,
          fontSize:`${(z.size??32)*scale}px`, color:z.color??'#FFFFFF',
          lineHeight:z.lineHeight??1.2, textAlign:z.align,
          letterSpacing:z.letterSpacing ? `${z.letterSpacing*scale}px` : undefined,
          textTransform:z.textTransform as 'none'|'uppercase'|'lowercase'|undefined,
          WebkitTextStroke:(z.strokeColor&&(z.strokeWidth??0)>0)?`${(z.strokeWidth??0)*scale}px ${z.strokeColor}`:undefined,
          textShadow:(z.shadowColor&&(z.shadowBlur??0)>0)?`${(z.shadowX??0)*scale}px ${(z.shadowY??0)*scale}px ${(z.shadowBlur??0)*scale}px ${z.shadowColor}`:undefined,
          wordBreak:'break-word', opacity:isGhost?0.45:1,
        };
        return (
          <div key={z.id} className="absolute overflow-hidden"
            style={{
              left:`${left}%`, top:`${top}%`, width:`${width}%`, minHeight:`${height}%`,
              display:'flex', flexDirection:'column', justifyContent:jc,
              cursor: interactive ? 'pointer' : 'default',
              outline: isActive ? '2.5px solid rgba(232,197,126,0.9)' : 'none',
              outlineOffset: '3px', borderRadius: 3,
            }}
            onClick={() => interactive && fieldIdx >= 0 && setActiveIdx(fieldIdx)}>
            <span style={ts}>{display||''}</span>
            {/* Ripple on active */}
            {isActive && <div className="absolute inset-0 pointer-events-none" style={{ borderRadius:3, boxShadow:'0 0 0 4px rgba(232,197,126,0.2)', animation:'pulse 1.5s ease-in-out infinite' }}/>}
          </div>
        );
      })}
      <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:0.4}}`}</style>
    </div>
  );

  /* ─────────────────────────────────────────────────────────────────────────
     E3 — Success
  ───────────────────────────────────────────────────────────────────────── */
  if (screen === 'success') return (
    <div className="min-h-screen flex flex-col items-center justify-center px-5 py-10" style={{ background:'#FAF6EE' }}>
      <Confetti/><Toast/>
      <div className="h-20 w-20 rounded-full flex items-center justify-center mb-5 shadow-lg" style={{ background:'#1F4D3A' }}>
        <Check size={34} strokeWidth={2.5} color="white"/>
      </div>
      <h2 className="font-display font-bold text-[#0F1F18] text-[26px] mb-1 text-center">You&apos;re all set, {firstName}!</h2>
      <p className="text-[#6B7A72] text-[14px] text-center max-w-[280px] mb-8">Share your card with your network.</p>
      {resultUrl && (
        <div className="mb-8 rounded-2xl overflow-hidden w-[140px] shadow-xl border border-[#E5E0D4]" style={{ aspectRatio:`${backgroundWidth}/${backgroundHeight}` }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={resultUrl} alt="Your card" className="w-full h-full object-cover"/>
        </div>
      )}
      <div className="grid grid-cols-4 gap-3 mb-8 w-full max-w-[300px]">
        {SHARE.map(s => (
          <a key={s.n} href={s.href} target="_blank" rel="noopener noreferrer" className="flex flex-col items-center gap-2">
            <div className="h-12 w-12 rounded-2xl flex items-center justify-center shadow-md" style={{ background:s.bg }}><SI n={s.n}/></div>
            <span className="text-[10px] font-mono text-[#6B7A72]">{s.n}</span>
          </a>
        ))}
      </div>
      <div className="w-full max-w-[340px] bg-white rounded-2xl p-4 mb-6 border border-[#E5E0D4] shadow-sm">
        <div className="text-[10px] font-mono text-[#6B7A72] mb-2">SUGGESTED CAPTION</div>
        <p className="text-[13px] text-[#3A4A42] leading-relaxed italic">&ldquo;{caption}&rdquo;</p>
        <button onClick={() => { navigator.clipboard?.writeText(caption); showToast('Copied!'); }}
          className="mt-3 text-[11px] font-mono text-[#1F4D3A] flex items-center gap-1.5 hover:underline">
          <Copy size={11} strokeWidth={2}/>Copy caption
        </button>
      </div>
      <button onClick={() => { setScreen('result'); setDownloaded(false); }} className="text-[13px] text-[#6B7A72] hover:text-[#1F4D3A] transition">← Back to card</button>
      <div className="mt-8 text-[10.5px] font-mono text-[#6B7A72]/40">Made with Cardly</div>
    </div>
  );

  /* ─────────────────────────────────────────────────────────────────────────
     E2 — Result
  ───────────────────────────────────────────────────────────────────────── */
  if (screen === 'result' && resultUrl) return (
    <div className="min-h-screen flex flex-col items-center px-5 pt-8 pb-12" style={{ background:'#FAF6EE' }}>
      <Toast/>
      <div className="w-full max-w-[400px]">
        <div className="flex items-center justify-between mb-5">
          <button onClick={() => setScreen('form')} className="h-9 w-9 rounded-xl border border-[#E5E0D4] bg-white grid place-items-center text-[#6B7A72] hover:bg-[#E8EFEB] transition shadow-sm">
            <ChevronLeft size={16} strokeWidth={2}/>
          </button>
          <span className="text-[11px] font-mono text-[#6B7A72] tracking-widest">YOUR CARD IS READY</span>
          <div className="flex items-center gap-1.5 text-[11px] font-mono text-[#1F4D3A]">
            <span className="h-1.5 w-1.5 rounded-full bg-[#2D7A4F] animate-pulse"/>LIVE
          </div>
        </div>
        <div className="rounded-2xl overflow-hidden mb-2 border border-[#E5E0D4]" style={{ boxShadow:'0 20px 60px rgba(15,31,24,0.12)', aspectRatio:`${backgroundWidth}/${backgroundHeight}` }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={resultUrl} alt="Your card" className="w-full h-full object-cover"/>
        </div>
        <div className="text-center text-[11px] font-mono text-[#6B7A72]/60 mb-5">{backgroundWidth}×{backgroundHeight}px · PNG</div>
        <button onClick={handleDownload} className="w-full h-14 rounded-2xl font-display font-bold text-[16px] text-white mb-3 flex items-center justify-center gap-2.5 hover:opacity-90 transition" style={{ background:'#1F4D3A', boxShadow:'0 8px 24px rgba(31,77,58,0.28)' }}>
          <Download size={18} strokeWidth={2}/>Download my card
        </button>
        <div className="grid grid-cols-4 gap-2 mb-5">
          {SHARE.map(s => (
            <a key={s.n} href={s.href} target="_blank" rel="noopener noreferrer" className="flex flex-col items-center gap-1.5">
              <div className="h-11 w-full rounded-xl flex items-center justify-center shadow-sm" style={{ background:s.bg }}><SI n={s.n}/></div>
              <span className="text-[9px] font-mono text-[#6B7A72] text-center">{s.n}</span>
            </a>
          ))}
        </div>
        <div className="bg-white border border-[#E5E0D4] rounded-2xl p-4 mb-5 shadow-sm">
          <p className="text-[12.5px] text-[#3A4A42] leading-relaxed italic">&ldquo;{caption}&rdquo;</p>
          <button onClick={() => { navigator.clipboard?.writeText(caption); showToast('Copied!'); }}
            className="mt-2 text-[11px] font-mono text-[#1F4D3A] flex items-center gap-1 hover:underline">
            <Copy size={11} strokeWidth={2}/>Copy caption
          </button>
        </div>
        <div className="flex gap-3">
          <button onClick={() => { setScreen('form'); setResultUrl(null); }}
            className="flex-1 py-3 rounded-xl text-[13px] text-[#6B7A72] border border-[#E5E0D4] bg-white hover:bg-[#E8EFEB] transition flex items-center justify-center gap-1.5 shadow-sm">
            <Pencil size={13} strokeWidth={2}/>Edit
          </button>
          {downloaded && (
            <button onClick={() => setScreen('success')}
              className="flex-1 py-3 rounded-xl text-[13px] font-semibold text-white bg-[#1F4D3A] hover:bg-[#163828] transition flex items-center justify-center gap-1.5">
              <Check size={13} strokeWidth={2.5}/>Done
            </button>
          )}
        </div>
        <div className="mt-8 text-center text-[10.5px] font-mono text-[#6B7A72]/40">
          Powered by <span style={{ color:'#1F4D3A', fontWeight:600 }}>Cardly</span>
        </div>
      </div>
    </div>
  );

  /* ─────────────────────────────────────────────────────────────────────────
     Generating
  ───────────────────────────────────────────────────────────────────────── */
  if (screen === 'generating') return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4" style={{ background:'#FAF6EE' }}>
      <div className="relative inline-flex items-center justify-center h-24 w-24 mb-6">
        <div className="absolute inset-0 rounded-full bg-[#E8EFEB]"/>
        <svg className="absolute inset-0 animate-spin" width="96" height="96" viewBox="0 0 96 96">
          <circle cx="48" cy="48" r="44" fill="none" stroke="#E5E0D4" strokeWidth="3"/>
          <circle cx="48" cy="48" r="44" fill="none" stroke="#1F4D3A" strokeWidth="3" strokeLinecap="round" strokeDasharray="80 200"/>
        </svg>
        <Sparkles size={28} strokeWidth={1.8} color="#1F4D3A"/>
      </div>
      <h2 className="font-display font-bold text-[#0F1F18] text-[24px] mb-2">Creating your card…</h2>
      <p className="text-[#6B7A72] text-[14px]">Usually under 5 seconds.</p>
      {error && <div className="mt-4 px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-[13px] text-red-700 max-w-[320px]">{error}</div>}
    </div>
  );

  /* ─────────────────────────────────────────────────────────────────────────
     E1 — Form screen
     Mobile: card + bottom field panel
     Desktop: side-by-side
  ───────────────────────────────────────────────────────────────────────── */

  /* Bottom panel content for the active field */
  const renderFieldPanel = () => {
    if (!activeField) return null;
    const isFilled = activeField.type === 'photo'
      ? !!photoUrls[activeField.id]
      : !!values[activeField.id]?.trim();

    return (
      <div className="flex flex-col gap-3">
        {/* Field label + filled indicator */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-mono text-[#6B7A72] tracking-widest">
              {(activeField.label?.toUpperCase() || (activeField.type === 'photo' ? 'PHOTO' : 'TEXT'))}
              {activeField.required && <span className="text-[#C97A2D] ml-0.5">*</span>}
            </span>
          </div>
          {isFilled && (
            <span className="flex items-center gap-1 text-[11px] font-mono text-[#2D7A4F]">
              <Check size={11} strokeWidth={2.5}/>done
            </span>
          )}
        </div>

        {/* Photo field */}
        {activeField.type === 'photo' && (
          <div className="flex flex-col gap-2">
            {photoUrls[activeField.id] ? (
              <div className="flex items-center gap-3 p-3 rounded-xl border border-[#E5E0D4] bg-white">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={photoUrls[activeField.id]} alt="" className="h-12 w-12 rounded-lg object-cover border border-[#E5E0D4]"/>
                <div className="flex-1 min-w-0">
                  <div className="text-[13px] font-semibold text-[#0F1F18]">Photo added ✓</div>
                  <div className="text-[11.5px] text-[#6B7A72]">Looking good!</div>
                </div>
                <button onClick={() => fileInputRefs.current[activeField.id]?.click()}
                  className="shrink-0 text-[12px] text-[#1F4D3A] font-medium border border-[#1F4D3A]/30 px-3 py-1.5 rounded-lg hover:bg-[#E8EFEB] transition">
                  Change
                </button>
              </div>
            ) : (
              <div
                className="flex flex-col items-center gap-2.5 py-5 rounded-xl border-2 border-dashed transition cursor-pointer"
                style={{ borderColor: dropActive ? '#1F4D3A' : '#C9C3B1', background: dropActive ? '#E8EFEB' : '#FAF6EE' }}
                onClick={() => fileInputRefs.current[activeField.id]?.click()}
                onDragOver={e => { e.preventDefault(); setDropActive(true); }}
                onDragLeave={() => setDropActive(false)}
                onDrop={e => { e.preventDefault(); setDropActive(false); const f = e.dataTransfer.files[0]; if (f?.type.startsWith('image/')) handlePhotoSelect(activeField.id, f); }}
              >
                <div className="h-10 w-10 rounded-xl bg-[#E8EFEB] border border-[#C9C3B1] grid place-items-center">
                  <Upload size={18} strokeWidth={1.8} color="#1F4D3A"/>
                </div>
                <div className="text-center">
                  <div className="text-[13.5px] font-semibold text-[#0F1F18]">
                    {dropActive ? 'Drop to upload' : 'Tap to upload photo'}
                  </div>
                  <div className="text-[11px] text-[#6B7A72]">JPG or PNG · up to 10 MB</div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Text / custom field */}
        {(activeField.type === 'text' || activeField.type === 'custom') && (
          activeField.type === 'custom' && activeField.options ? (
            <select
              value={values[activeField.id] ?? ''}
              onChange={e => setValues(v => ({ ...v, [activeField.id]: e.target.value }))}
              className="w-full h-12 px-4 rounded-xl text-[15px] outline-none appearance-none"
              style={{ background:'#FAF6EE', border:'1.5px solid #E5E0D4', color: values[activeField.id] ? '#0F1F18' : '#6B7A72' }}
              onFocus={e => { e.currentTarget.style.borderColor='#1F4D3A'; e.currentTarget.style.boxShadow='0 0 0 3px rgba(31,77,58,0.1)'; e.currentTarget.style.background='#fff'; }}
              onBlur={e => { e.currentTarget.style.borderColor='#E5E0D4'; e.currentTarget.style.boxShadow='none'; e.currentTarget.style.background='#FAF6EE'; }}
            >
              <option value="" disabled>Select {activeField.label ?? 'option'}…</option>
              {(activeField.options as string[]).map(o => <option key={o} value={o}>{o}</option>)}
            </select>
          ) : (
            <input
              ref={inputRef}
              type="text"
              value={values[activeField.id] ?? ''}
              onChange={e => setValues(v => ({ ...v, [activeField.id]: e.target.value }))}
              onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); if (!isLastField) goNext(); } }}
              placeholder={activeField.placeholder || `Enter ${activeField.label || 'text'}…`}
              className="w-full h-12 px-4 rounded-xl text-[15px] text-[#0F1F18] placeholder-[#6B7A72]/50 outline-none transition"
              style={{ background:'#FAF6EE', border:'1.5px solid #E5E0D4' }}
              onFocus={e => { e.currentTarget.style.borderColor='#1F4D3A'; e.currentTarget.style.boxShadow='0 0 0 3px rgba(31,77,58,0.1)'; e.currentTarget.style.background='#fff'; }}
              onBlur={e => { e.currentTarget.style.borderColor='#E5E0D4'; e.currentTarget.style.boxShadow='none'; e.currentTarget.style.background='#FAF6EE'; }}
            />
          )
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen" style={{ background:'#FAF6EE' }}>
      {/* Progress bar */}
      <div className="fixed top-0 left-0 right-0 z-30 h-[3px] bg-[#E5E0D4]">
        <div className="h-full transition-all duration-500" style={{ width:`${progressPct}%`, background:'linear-gradient(90deg,#1F4D3A,#E8C57E)' }}/>
      </div>
      <Toast/>

      {/* ════════════════════════════════════════════════════════════════════
          MOBILE LAYOUT — card fills screen, bottom panel slides fields
      ════════════════════════════════════════════════════════════════════ */}
      <div className="md:hidden flex flex-col min-h-screen">

        {/* Header strip */}
        <div className="px-4 pt-6 pb-3 flex items-center justify-between">
          <div>
            <div className="text-[10.5px] font-mono text-[#1F4D3A] mb-0.5">{eventName}</div>
            <div className="flex gap-1">
              {editableFields.map((_, i) => (
                <button key={i} onClick={() => setActiveIdx(i)}
                  className="h-1.5 rounded-full transition-all duration-300"
                  style={{ width: activeIdx === i ? 20 : 6, background: activeIdx === i ? '#1F4D3A' : i < activeIdx ? '#2A6A50' : '#C9C3B1' }}
                />
              ))}
            </div>
          </div>
          <div className="text-[11px] font-mono text-[#6B7A72]">
            {filledCount}/{requiredZones.length} filled
          </div>
        </div>

        {/* Card — takes remaining space above panel */}
        <div className="flex-1 px-4 flex items-center">
          <div className="w-full">
            {renderCard(true)}
            <p className="text-center text-[11px] text-[#6B7A72] mt-2">
              Tap any field on the card to jump to it
            </p>
          </div>
        </div>

        {/* Bottom field panel — fixed */}
        <div className="shrink-0 px-4 pb-6 pt-4"
          style={{ background:'#FAF6EE', borderTop:'1.5px solid #E5E0D4', boxShadow:'0 -8px 24px rgba(15,31,24,0.06)' }}>

          {/* Step counter */}
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] font-mono text-[#6B7A72]">
              Step {activeIdx + 1} of {editableFields.length}
            </span>
            {allDone && (
              <span className="text-[11px] font-mono text-[#2D7A4F] flex items-center gap-1">
                <Check size={11} strokeWidth={2.5}/>All fields complete
              </span>
            )}
          </div>

          {/* Field input */}
          {renderFieldPanel()}

          {/* Navigation */}
          <div className="flex gap-2 mt-3">
            {activeIdx > 0 && (
              <button onClick={goPrev}
                className="h-12 w-12 rounded-xl border border-[#E5E0D4] bg-white grid place-items-center text-[#6B7A72] hover:bg-[#E8EFEB] transition shrink-0 shadow-sm">
                <ChevronLeft size={18} strokeWidth={2}/>
              </button>
            )}
            {!isLastField ? (
              <button onClick={goNext}
                className="flex-1 h-12 rounded-xl font-semibold text-[14px] flex items-center justify-center gap-2 transition"
                style={{ background:'#1F4D3A', color:'white', boxShadow:'0 4px 14px rgba(31,77,58,0.25)' }}>
                Next <ChevronRight size={16} strokeWidth={2.5}/>
              </button>
            ) : (
              <button
                disabled={!allDone}
                onClick={handleGenerate}
                className="flex-1 h-12 rounded-xl font-bold text-[14px] flex items-center justify-center gap-2 transition"
                style={allDone
                  ? { background:'#1F4D3A', color:'white', boxShadow:'0 4px 14px rgba(31,77,58,0.25)' }
                  : { background:'#E5E0D4', color:'#6B7A72', cursor:'not-allowed' }}>
                <Layers size={16} strokeWidth={2}/>
                {allDone ? 'Generate my card' : `${requiredZones.length - filledCount} more required`}
              </button>
            )}
          </div>

          {/* Skip to generate if all done */}
          {allDone && !isLastField && (
            <button onClick={handleGenerate}
              className="w-full mt-2 py-2 text-[12px] font-mono text-[#1F4D3A] flex items-center justify-center gap-1.5 hover:underline">
              <Layers size={13} strokeWidth={2}/>Skip to Generate my card
            </button>
          )}

          <div className="text-center mt-3 text-[10px] font-mono text-[#6B7A72]/40">
            Powered by <span style={{ color:'#1F4D3A', fontWeight:600 }}>Cardly</span>
          </div>
        </div>
      </div>

      {/* ════════════════════════════════════════════════════════════════════
          DESKTOP LAYOUT — form left, card right (sticky)
      ════════════════════════════════════════════════════════════════════ */}
      <div className="hidden md:block">
        <div className="max-w-5xl mx-auto px-6 lg:px-8 pt-8 pb-16">
          {/* Header */}
          <div className="mb-7 flex items-start justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-1.5 text-[11px] font-mono text-[#1F4D3A] bg-[#E8EFEB] px-2.5 py-1 rounded-full mb-2">
                <span className="h-1.5 w-1.5 rounded-full bg-[#2D7A4F]"/>GET YOUR CARD
              </div>
              <h1 className="font-display font-bold text-[#0F1F18] text-[26px] leading-tight">{eventName}</h1>
              <p className="text-[13.5px] text-[#6B7A72] mt-1">Fill in your details and download your personalised card.</p>
            </div>
            {requiredZones.length > 0 && (
              <div className="shrink-0 flex flex-col items-end gap-1.5 mt-1">
                <span className="text-[12px] font-mono text-[#3A4A42]">{filledCount}<span className="text-[#6B7A72]">/{requiredZones.length}</span></span>
                <div className="h-1.5 w-20 rounded-full bg-[#E5E0D4] overflow-hidden">
                  <div className="h-full rounded-full transition-all" style={{ width:`${progressPct}%`, background:'#1F4D3A' }}/>
                </div>
              </div>
            )}
          </div>

          <div className="grid grid-cols-[1fr_320px] lg:grid-cols-[1fr_360px] gap-10 lg:gap-14 items-start">
            {/* Left: full form */}
            <div>
              <div className="bg-white rounded-2xl border border-[#E5E0D4] shadow-sm overflow-hidden">
                {/* Photo zones */}
                {zones.filter(z => z.type === 'photo').map((z, i, arr) => (
                  <div key={z.id} className={`p-5 ${i < arr.length - 1 || textZones.length > 0 ? 'border-b border-[#E5E0D4]' : ''}`}>
                    <div className="flex items-center justify-between mb-3">
                      <label className="text-[11px] font-mono text-[#6B7A72] tracking-widest">
                        {(z.label?.toUpperCase() || 'PHOTO')}{z.required && <span className="text-[#C97A2D] ml-0.5">*</span>}
                      </label>
                      {photoUrls[z.id] && <button onClick={() => fileInputRefs.current[z.id]?.click()} className="text-[11.5px] text-[#1F4D3A] font-medium hover:underline flex items-center gap-1"><Pencil size={11} strokeWidth={2}/>Change</button>}
                    </div>
                    {photoUrls[z.id] ? (
                      <div className="relative rounded-xl overflow-hidden border border-[#E5E0D4] cursor-pointer group" onClick={() => fileInputRefs.current[z.id]?.click()}>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={photoUrls[z.id]} alt="" className="w-full object-cover" style={{ maxHeight:180 }}/>
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/25 transition flex items-center justify-center opacity-0 group-hover:opacity-100">
                          <span className="bg-white/90 rounded-xl px-3 py-1.5 text-[12px] font-medium text-[#0F1F18] flex items-center gap-1.5"><Camera size={13} strokeWidth={2}/>Change photo</span>
                        </div>
                      </div>
                    ) : (
                      <div className="rounded-xl transition-all cursor-pointer" style={{ border: dropActive ? '2px dashed #1F4D3A' : '2px dashed #C9C3B1', background: dropActive ? '#E8EFEB' : '#FAF6EE', padding:'28px 20px' }}
                        onClick={() => fileInputRefs.current[z.id]?.click()}
                        onDragOver={e => { e.preventDefault(); setDropActive(true); }}
                        onDragLeave={() => setDropActive(false)}
                        onDrop={e => { e.preventDefault(); setDropActive(false); const f = e.dataTransfer.files[0]; if (f?.type.startsWith('image/')) handlePhotoSelect(z.id, f); }}>
                        <div className="flex flex-col items-center gap-3">
                          <div className="h-12 w-12 rounded-xl bg-[#E8EFEB] border border-[#C9C3B1] grid place-items-center"><Upload size={20} strokeWidth={1.8} color="#1F4D3A"/></div>
                          <div className="text-center">
                            <div className="text-[13.5px] font-semibold text-[#0F1F18]">{dropActive ? 'Drop to upload' : 'Click to upload photo'}</div>
                            <div className="text-[11.5px] text-[#6B7A72] mt-0.5">Drag & drop or click · JPG, PNG · up to 10 MB</div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
                {/* Text zones */}
                {zones.filter(z => z.type === 'text' || z.type === 'custom').map((z, i, arr) => (
                  <div key={z.id} className={`p-5 ${i < arr.length - 1 ? 'border-b border-[#E5E0D4]' : ''}`}>
                    <label className="block text-[11px] font-mono text-[#6B7A72] tracking-widest mb-2">
                      {(z.label || 'TEXT').toUpperCase()}{z.required && <span className="text-[#C97A2D] ml-0.5">*</span>}
                    </label>
                    {z.type === 'custom' && z.options ? (
                      <select value={values[z.id]??''} onChange={e => setValues(v=>({...v,[z.id]:e.target.value}))}
                        className="w-full h-11 px-4 rounded-xl text-[14px] outline-none appearance-none"
                        style={{ background:'#FAF6EE', border:'1.5px solid #E5E0D4', color:values[z.id]?'#0F1F18':'#6B7A72' }}
                        onFocus={e=>{e.currentTarget.style.borderColor='#1F4D3A';e.currentTarget.style.boxShadow='0 0 0 3px rgba(31,77,58,0.1)';e.currentTarget.style.background='#fff';}}
                        onBlur={e=>{e.currentTarget.style.borderColor='#E5E0D4';e.currentTarget.style.boxShadow='none';e.currentTarget.style.background='#FAF6EE';}}>
                        <option value="" disabled>Select {z.label??'option'}…</option>
                        {(z.options as string[]).map(o=><option key={o} value={o}>{o}</option>)}
                      </select>
                    ) : (
                      <input type="text" value={values[z.id]??''} onChange={e=>setValues(v=>({...v,[z.id]:e.target.value}))}
                        placeholder={z.placeholder||`Enter ${z.label||'text'}…`}
                        className="w-full h-11 px-4 rounded-xl text-[14px] text-[#0F1F18] placeholder-[#6B7A72]/50 outline-none transition"
                        style={{ background:'#FAF6EE', border:'1.5px solid #E5E0D4' }}
                        onFocus={e=>{e.currentTarget.style.borderColor='#1F4D3A';e.currentTarget.style.boxShadow='0 0 0 3px rgba(31,77,58,0.1)';e.currentTarget.style.background='#fff';}}
                        onBlur={e=>{e.currentTarget.style.borderColor='#E5E0D4';e.currentTarget.style.boxShadow='none';e.currentTarget.style.background='#FAF6EE';}}/>
                    )}
                  </div>
                ))}
                {error && <div className="mx-5 mb-4 px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-[13px] text-red-700">{error}</div>}
                <div className="p-5 border-t border-[#E5E0D4]">
                  <button disabled={!allDone} onClick={handleGenerate}
                    className="w-full h-14 rounded-2xl font-display font-bold text-[16px] transition flex items-center justify-center gap-2.5"
                    style={allDone?{background:'#1F4D3A',color:'white',boxShadow:'0 8px 24px rgba(31,77,58,0.25)'}:{background:'#E5E0D4',color:'#6B7A72',cursor:'not-allowed'}}>
                    {allDone?<><Layers size={17} strokeWidth={2}/>Generate my card</>:`${requiredZones.length-filledCount} field${requiredZones.length-filledCount!==1?'s':''} remaining`}
                  </button>
                  <div className="text-center mt-3 text-[11px] font-mono text-[#6B7A72]/50">Powered by <span style={{ color:'#1F4D3A', fontWeight:600 }}>Cardly</span></div>
                </div>
              </div>
            </div>

            {/* Right: sticky card preview */}
            <div className="sticky top-6">
              <div className="flex items-center justify-between mb-2.5">
                <span className="text-[10.5px] font-mono text-[#6B7A72] tracking-widest">LIVE PREVIEW</span>
                <span className="text-[10.5px] font-mono text-[#6B7A72]/60">{backgroundWidth}×{backgroundHeight}</span>
              </div>
              {renderCard(false)}
              <div className="mt-2.5 flex items-center justify-center gap-1.5 text-[10.5px] font-mono text-[#6B7A72]/60">
                <span className="h-1.5 w-1.5 rounded-full bg-[#2D7A4F] animate-pulse"/>Updates live as you type
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Hidden measurement spans */}
      <div style={{ position:'fixed', top:-9999, left:-9999, visibility:'hidden', pointerEvents:'none' }}>
        {zones.filter(z => z.type==='text'||z.type==='custom').map(z => {
          const sw = Math.round((z.w/backgroundWidth)*previewW);
          const val = values[z.id]||z.sample||z.placeholder||'';
          return <span key={z.id} ref={el=>{measureRefs.current[z.id]=el;}} style={{ display:'block', width:`${sw}px`, fontFamily:z.font, fontWeight:z.weight??700, fontSize:`${(z.size??32)*scale}px`, lineHeight:z.lineHeight??1.2, letterSpacing:z.letterSpacing?`${z.letterSpacing*scale}px`:undefined, textTransform:z.textTransform, wordBreak:'break-word', whiteSpace:'pre-wrap' }}>{val}</span>;
        })}
      </div>

      {/* Hidden file inputs */}
      {zones.filter(z => z.type==='photo').map(z => (
        <input key={z.id} ref={el=>{fileInputRefs.current[z.id]=el;}}
          type="file" accept="image/*" className="hidden"
          onChange={e => { const f=e.target.files?.[0]; if(f) { handlePhotoSelect(z.id,f); if(!isLastField) setTimeout(goNext, 300); } }}/>
      ))}
    </div>
  );
}
