'use client';

import {
  useState, useRef, useEffect, useLayoutEffect, useCallback, type CSSProperties,
} from 'react';
import Cropper from 'react-easy-crop';
import type { Area } from 'react-easy-crop';
import type { Zone } from '@/types/database';
import {
  Check, Download, Copy, ChevronLeft, ChevronRight,
  Layers, Camera, Pencil, Sparkles, Upload, X, ZoomIn, ZoomOut,
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
  if (n==='WhatsApp')  return <svg width="20" height="20" viewBox="0 0 24 24" fill="white"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/></svg>;
  if (n==='Instagram') return <svg width="18" height="18" viewBox="0 0 24 24" fill="white"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg>;
  if (n==='X')         return <svg width="16" height="16" viewBox="0 0 24 24" fill="white"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>;
  if (n==='LinkedIn')  return <svg width="18" height="18" viewBox="0 0 24 24" fill="white"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>;
  return null;
}

/* ── Crop helper — draw cropped area to canvas, return JPEG blob ─────────── */
async function getCroppedBlob(
  imageSrc: string,
  crop: Area,
): Promise<Blob> {
  const image = new window.Image();
  image.crossOrigin = 'anonymous';
  await new Promise<void>((resolve, reject) => {
    image.onload  = () => resolve();
    image.onerror = () => reject(new Error('Failed to load image'));
    image.src = imageSrc;
  });
  const canvas = document.createElement('canvas');
  canvas.width  = Math.round(crop.width);
  canvas.height = Math.round(crop.height);
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('No canvas context');
  ctx.drawImage(
    image,
    Math.round(crop.x), Math.round(crop.y),
    Math.round(crop.width), Math.round(crop.height),
    0, 0,
    Math.round(crop.width), Math.round(crop.height),
  );
  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      blob => blob ? resolve(blob) : reject(new Error('Canvas is empty')),
      'image/jpeg', 0.93,
    );
  });
}

function Confetti() {
  const p = Array.from({ length: 24 }).map((_,i) => ({
    left:`${4+(i/23)*92}%`,
    color:['#1F4D3A','#E8C57E','#2A6A50','#C9A45E','#163828','#E8EFEB'][i%6],
    delay:`${(i*0.06).toFixed(2)}s`, dur:`${2.8+(i%5)*0.4}s`, size:i%3===0?10:7,
  }));
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-50">
      {p.map((x,i) => <div key={i} className="absolute rounded-sm" style={{ left:x.left, top:'-12px', background:x.color, width:x.size, height:x.size, animation:`cf ${x.dur} ease-in ${x.delay} forwards` }}/>)}
      <style>{`@keyframes cf{0%{transform:translateY(0) rotate(0);opacity:1}100%{transform:translateY(105vh) rotate(720deg);opacity:0}}`}</style>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════ */
export default function AttendeeClient({
  variantId, eventName, backgroundUrl, backgroundWidth, backgroundHeight, zones,
}: Props) {

  const [values, setValues]           = useState<FieldValues>({});
  const [photoFiles, setPhotoFiles]   = useState<Record<string, File>>({});
  const [photoUrls, setPhotoUrls]     = useState<Record<string, string>>({});
  const [screen, setScreen]           = useState<Screen>('form');
  const [resultUrl, setResultUrl]     = useState<string | null>(null);
  const [error, setError]             = useState('');
  const [toast, setToast]             = useState<string | null>(null);
  const [downloaded, setDownloaded]   = useState(false);
  const [activeZoneId, setActiveZoneId] = useState<string | null>(null);
  const [dropActive, setDropActive]   = useState(false);

  /* ── Crop modal state ──────────────────────────────────────────────────── */
  const [cropTarget, setCropTarget] = useState<{
    zoneId: string; zone: Zone; srcUrl: string; file: File;
  } | null>(null);
  const [cropPos, setCropPos]   = useState<{x: number; y: number}>({ x: 0, y: 0 });
  const [cropZoom, setCropZoom] = useState(1);
  const [croppedAreaPx, setCroppedAreaPx] = useState<Area | null>(null);

  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({});
  const sheetInputRef = useRef<HTMLTextAreaElement | null>(null);
  const cardRef       = useRef<HTMLDivElement>(null);
  const [previewW, setPreviewW]               = useState(375);
  const [measuredHeights, setMeasuredHeights] = useState<Record<string, number>>({});
  const measureRefs   = useRef<Record<string, HTMLSpanElement | null>>({});

  /* ── Measurements ───────────────────────────────────────────────────────── */
  useEffect(() => {
    const update = () => { if (cardRef.current) setPreviewW(cardRef.current.offsetWidth); };
    update();
    const ro = new ResizeObserver(update);
    if (cardRef.current) ro.observe(cardRef.current);
    return () => ro.disconnect();
  }, []);

  useLayoutEffect(() => {
    const h: Record<string,number> = {}; let changed = false;
    for (const [id, el] of Object.entries(measureRefs.current)) {
      if (el) { const v = el.offsetHeight; h[id]=v; if (v!==(measuredHeights[id]??0)) changed=true; }
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
          zones.filter(z2 => z2.font===z.font).forEach(z2 => ws.add(z2.weight??400));
          return `${z.font!.replace(/\s+/g,'+')}:wght@${Array.from(ws).sort().join(';')}`;
        })
    ));
    if (!families.length) return;
    const id = 'cardly-gfonts';
    if (document.getElementById(id)) return;
    const link = document.createElement('link');
    link.id=id; link.rel='stylesheet';
    link.href=`https://fonts.googleapis.com/css2?${families.map(f=>`family=${f}`).join('&')}&display=swap`;
    document.head.appendChild(link);
  }, [zones]);

  /* ── Focus sheet input when zone activates ──────────────────────────────── */
  useEffect(() => {
    const z = zones.find(z => z.id === activeZoneId);
    if (z && z.type !== 'photo') {
      setTimeout(() => sheetInputRef.current?.focus(), 60);
    }
  }, [activeZoneId, zones]);

  /* ── Derived ────────────────────────────────────────────────────────────── */
  const editableFields = [...zones.filter(z => z.type==='photo'||z.type==='text'||z.type==='custom')]
    .sort((a,b) => a.y-b.y||a.x-b.x);
  const textZones     = zones.filter(z => z.type==='text'||z.type==='custom');
  const requiredZones = zones.filter(z => z.required);
  const filledCount   = requiredZones.filter(z =>
    z.type==='photo' ? !!photoFiles[z.id] : !!values[z.id]?.trim()
  ).length;
  const progressPct   = requiredZones.length>0 ? (filledCount/requiredZones.length)*100 : 100;
  const allDone       = zones.every(z => !z.required||(z.type==='photo'?!!photoFiles[z.id]:!!values[z.id]?.trim()));
  const scale         = previewW / backgroundWidth;

  const activeZone    = zones.find(z => z.id===activeZoneId) ?? null;
  const activeFieldIdx = editableFields.findIndex(f => f.id===activeZoneId);
  const hasNext       = activeFieldIdx < editableFields.length-1;
  const hasPrev       = activeFieldIdx > 0;

  const showToast = (msg: string) => { setToast(msg); setTimeout(()=>setToast(null),2200); };

  /* Open crop modal after file selection */
  const handlePhotoSelect = useCallback((zoneId: string, file: File) => {
    const zone = zones.find(z => z.id === zoneId);
    if (!zone) return;
    const srcUrl = URL.createObjectURL(file);
    setCropPos({ x: 0, y: 0 });
    setCropZoom(1);
    setCroppedAreaPx(null);
    setCropTarget({ zoneId, zone, srcUrl, file });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [zones]);

  /* Confirm crop — create cropped blob and store it */
  const handleCropConfirm = useCallback(async () => {
    if (!cropTarget || !croppedAreaPx) return;
    try {
      const blob = await getCroppedBlob(cropTarget.srcUrl, croppedAreaPx);
      const croppedFile = new File([blob], cropTarget.file.name, { type: 'image/jpeg' });
      const croppedUrl  = URL.createObjectURL(blob);
      setPhotoFiles(p => ({ ...p, [cropTarget.zoneId]: croppedFile }));
      setPhotoUrls(u  => ({ ...u, [cropTarget.zoneId]: croppedUrl }));
      const zoneId = cropTarget.zoneId;
      setCropTarget(null);
      // Auto-advance
      const idx = editableFields.findIndex(f => f.id === zoneId);
      if (idx < editableFields.length - 1) setTimeout(() => setActiveZoneId(editableFields[idx + 1].id), 350);
      else setActiveZoneId(null);
    } catch (err) {
      console.error('[crop]', err);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cropTarget, croppedAreaPx, editableFields]);

  const handleGenerate = async () => {
    setScreen('generating'); setError('');
    try {
      const fd = new FormData();
      fd.append('variantId',variantId);
      fd.append('fields',JSON.stringify(values));
      for (const [zoneId, file] of Object.entries(photoFiles)) fd.append(`photo_${zoneId}`,file);
      const res = await fetch('/api/render',{method:'POST',body:fd});
      if (!res.ok) { const d=await res.json().catch(()=>({})); throw new Error(d.error??'Generation failed'); }
      setResultUrl(URL.createObjectURL(await res.blob()));
      setScreen('result');
    } catch(e: unknown) {
      setError(e instanceof Error ? e.message : 'Something went wrong.');
      setScreen('form');
    }
  };

  const handleDownload = () => {
    if (!resultUrl) return;
    const a=document.createElement('a');
    a.href=resultUrl; a.download=`${eventName.toLowerCase().replace(/\s+/g,'-')}-card.png`;
    a.click(); setDownloaded(true); showToast('Card saved!');
    setTimeout(()=>setScreen('success'),1600);
  };

  const firstName = Object.values(values)[0]?.split(' ')[0]??'You';
  const shortName = eventName.replace(/^I am attending\s*/i,'').replace(/^I'm attending\s*/i,'').trim()||eventName;
  const caption   = `I'm attending ${shortName}! Get your personalized card 🎉`;
  const SHARE     = [
    {n:'WhatsApp',bg:'#25D366',href:`https://wa.me/?text=${encodeURIComponent(caption)}`},
    {n:'Instagram',bg:'linear-gradient(45deg,#f09433,#e6683c 25%,#dc2743 50%,#cc2366 75%,#bc1888)',href:'#'},
    {n:'X',bg:'#000',href:`https://twitter.com/intent/tweet?text=${encodeURIComponent(caption)}`},
    {n:'LinkedIn',bg:'#0077b5',href:`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent('https://cardly.app')}`},
  ];

  const Toast = () => toast ? (
    <div className="fixed top-5 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 bg-[#1F4D3A] text-white text-[13px] font-medium px-4 py-2.5 rounded-xl shadow-lg whitespace-nowrap">
      <Check size={13} strokeWidth={2.5}/>{toast}
    </div>
  ) : null;

  /* ─────────────────────────────────────────────────────────────────────────
     Success / Result / Generating — shared across mobile + desktop
  ───────────────────────────────────────────────────────────────────────── */
  if (screen==='success') return (
    <div className="min-h-screen flex flex-col items-center justify-center px-5 py-10" style={{background:'#FAF6EE'}}>
      <Confetti/><Toast/>
      <div className="h-20 w-20 rounded-full flex items-center justify-center mb-5 shadow-lg" style={{background:'#1F4D3A'}}>
        <Check size={34} strokeWidth={2.5} color="white"/>
      </div>
      <h2 className="font-display font-bold text-[#0F1F18] text-[26px] mb-1 text-center">You&apos;re all set, {firstName}!</h2>
      <p className="text-[#6B7A72] text-[14px] text-center max-w-[280px] mb-8">Share your card with the world.</p>
      {resultUrl && (
        <div className="mb-8 rounded-2xl overflow-hidden w-[140px] shadow-xl border border-[#E5E0D4]" style={{aspectRatio:`${backgroundWidth}/${backgroundHeight}`}}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={resultUrl} alt="Your card" className="w-full h-full object-cover"/>
        </div>
      )}
      <div className="grid grid-cols-4 gap-3 mb-8 w-full max-w-[300px]">
        {SHARE.map(s=>(
          <a key={s.n} href={s.href} target="_blank" rel="noopener noreferrer" className="flex flex-col items-center gap-2">
            <div className="h-12 w-12 rounded-2xl flex items-center justify-center shadow-md" style={{background:s.bg}}><SI n={s.n}/></div>
            <span className="text-[10px] font-mono text-[#6B7A72]">{s.n}</span>
          </a>
        ))}
      </div>
      <div className="w-full max-w-[340px] bg-white rounded-2xl p-4 mb-6 border border-[#E5E0D4] shadow-sm">
        <p className="text-[13px] text-[#3A4A42] leading-relaxed italic">&ldquo;{caption}&rdquo;</p>
        <button onClick={()=>{navigator.clipboard?.writeText(caption);showToast('Copied!');}}
          className="mt-3 text-[11px] font-mono text-[#1F4D3A] flex items-center gap-1.5 hover:underline">
          <Copy size={11} strokeWidth={2}/>Copy caption
        </button>
      </div>
      <button onClick={()=>{setScreen('result');setDownloaded(false);}} className="text-[13px] text-[#6B7A72] hover:text-[#1F4D3A] transition">← Back to card</button>
      <div className="mt-8 text-[10.5px] font-mono text-[#6B7A72]/40">Made with Cardly</div>
    </div>
  );

  if (screen==='result'&&resultUrl) return (
    <div className="min-h-screen flex flex-col items-center px-5 pt-8 pb-12" style={{background:'#FAF6EE'}}>
      <Toast/>
      <div className="w-full max-w-[400px]">
        <div className="flex items-center justify-between mb-5">
          <button onClick={()=>setScreen('form')} className="h-9 w-9 rounded-xl border border-[#E5E0D4] bg-white grid place-items-center text-[#6B7A72] hover:bg-[#E8EFEB] transition shadow-sm">
            <ChevronLeft size={16} strokeWidth={2}/>
          </button>
          <span className="text-[11px] font-mono text-[#6B7A72] tracking-widest">YOUR CARD IS READY</span>
          <div className="flex items-center gap-1.5 text-[11px] font-mono text-[#1F4D3A]">
            <span className="h-1.5 w-1.5 rounded-full bg-[#2D7A4F] animate-pulse"/>LIVE
          </div>
        </div>
        <div className="rounded-2xl overflow-hidden mb-2 border border-[#E5E0D4]" style={{boxShadow:'0 20px 60px rgba(15,31,24,0.12)',aspectRatio:`${backgroundWidth}/${backgroundHeight}`}}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={resultUrl} alt="Your card" className="w-full h-full object-cover"/>
        </div>
        <div className="text-center text-[11px] font-mono text-[#6B7A72]/60 mb-5">{backgroundWidth}×{backgroundHeight}px · PNG</div>
        <button onClick={handleDownload} className="w-full h-14 rounded-2xl font-display font-bold text-[16px] text-white mb-3 flex items-center justify-center gap-2.5 hover:opacity-90 transition" style={{background:'#1F4D3A',boxShadow:'0 8px 24px rgba(31,77,58,0.28)'}}>
          <Download size={18} strokeWidth={2}/>Download my card
        </button>
        <div className="grid grid-cols-4 gap-2 mb-5">
          {SHARE.map(s=>(
            <a key={s.n} href={s.href} target="_blank" rel="noopener noreferrer" className="flex flex-col items-center gap-1.5">
              <div className="h-11 w-full rounded-xl flex items-center justify-center shadow-sm" style={{background:s.bg}}><SI n={s.n}/></div>
              <span className="text-[9px] font-mono text-[#6B7A72] text-center">{s.n}</span>
            </a>
          ))}
        </div>
        <div className="bg-white border border-[#E5E0D4] rounded-2xl p-4 mb-5 shadow-sm">
          <p className="text-[12.5px] text-[#3A4A42] leading-relaxed italic">&ldquo;{caption}&rdquo;</p>
          <button onClick={()=>{navigator.clipboard?.writeText(caption);showToast('Copied!');}}
            className="mt-2 text-[11px] font-mono text-[#1F4D3A] flex items-center gap-1 hover:underline">
            <Copy size={11} strokeWidth={2}/>Copy caption
          </button>
        </div>
        <div className="flex gap-3">
          <button onClick={()=>{setScreen('form');setResultUrl(null);}} className="flex-1 py-3 rounded-xl text-[13px] text-[#6B7A72] border border-[#E5E0D4] bg-white hover:bg-[#E8EFEB] transition flex items-center justify-center gap-1.5 shadow-sm">
            <Pencil size={13} strokeWidth={2}/>Edit
          </button>
          {downloaded&&(
            <button onClick={()=>setScreen('success')} className="flex-1 py-3 rounded-xl text-[13px] font-semibold text-white bg-[#1F4D3A] hover:bg-[#163828] transition flex items-center justify-center gap-1.5">
              <Check size={13} strokeWidth={2.5}/>Done
            </button>
          )}
        </div>
        <div className="mt-8 text-center text-[10.5px] font-mono text-[#6B7A72]/40">
          Powered by <span style={{color:'#1F4D3A',fontWeight:600}}>Cardly</span>
        </div>
      </div>
    </div>
  );

  if (screen==='generating') return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4" style={{background:'#FAF6EE'}}>
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
      {error&&<div className="mt-4 px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-[13px] text-red-700 max-w-[320px]">{error}</div>}
    </div>
  );

  /* ─────────────────────────────────────────────────────────────────────────
     E1 — Form
  ───────────────────────────────────────────────────────────────────────── */

  /* Render a zone on the card — text/photo with beautiful placeholders */
  const renderZone = (z: Zone) => {
    const accOff = (() => {
      let off = 0;
      for (const tz of zones) {
        if (tz.type!=='text'&&tz.type!=='custom') continue;
        if (tz.id===z.id) continue;
        if (tz.y+tz.h<=z.y) { const mh=measuredHeights[tz.id]; if (mh) off+=Math.max(0,mh/scale-tz.h); }
      }
      return off;
    })();

    const left   = (z.x/backgroundWidth)*100;
    const top    = ((z.y+accOff)/backgroundHeight)*100;
    const width  = (z.w/backgroundWidth)*100;
    const height = (z.h/backgroundHeight)*100;
    const isActive = activeZoneId===z.id;

    /* ── Photo zone ─────────────────────────────────────────────────────── */
    if (z.type==='photo') {
      const shortDim = Math.min(z.w, z.h) * scale;
      const br  = z.shape==='circle'?'50%'
        : z.shape==='rounded'?`${((z.cornerRadius??18)/100)*shortDim}px`
        : z.shape==='hexagon'?'0'
        : '10px';
      const clipPath = z.shape==='hexagon'
        ? 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)'
        : undefined;
      const url = photoUrls[z.id];
      return (
        <div key={z.id} className="absolute" style={{left:`${left}%`,top:`${top}%`,width:`${width}%`,height:`${height}%`,zIndex:2}}
          onClick={()=>{setActiveZoneId(z.id); fileInputRefs.current[z.id]?.click();}}>
          <div className="w-full h-full overflow-hidden relative cursor-pointer" style={{
            borderRadius:br,
            clipPath,
            outline: isActive?'3px solid rgba(232,197,126,1)':'none',
            outlineOffset:'3px',
            transition:'outline 0.2s ease',
          }}>
            {url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={url} alt="" className="w-full h-full object-cover"/>
            ) : (
              /* Beautiful photo placeholder */
              <div className="w-full h-full flex flex-col items-center justify-center gap-2 relative overflow-hidden"
                style={{
                  background:'rgba(15,31,24,0.42)',
                  backdropFilter:'blur(12px)',
                  WebkitBackdropFilter:'blur(12px)',
                }}>
                {/* Subtle radial glow */}
                <div className="absolute inset-0 opacity-30"
                  style={{background:'radial-gradient(circle at 50% 40%, rgba(232,197,126,0.4) 0%, transparent 70%)'}}/>
                {/* Camera icon */}
                <div className="relative flex items-center justify-center rounded-full"
                  style={{
                    width:`${Math.max(32, Math.min(z.w,z.h)*0.32*scale)}px`,
                    height:`${Math.max(32, Math.min(z.w,z.h)*0.32*scale)}px`,
                    background:'rgba(255,255,255,0.15)',
                    border:'1.5px solid rgba(255,255,255,0.35)',
                    backdropFilter:'blur(4px)',
                  }}>
                  <Camera color="rgba(255,255,255,0.9)" strokeWidth={1.5}
                    style={{width:`${Math.max(14, Math.min(z.w,z.h)*0.14*scale)}px`, height:'auto'}}/>
                </div>
                <span style={{
                  color:'rgba(255,255,255,0.85)',
                  fontSize:`${Math.max(8, Math.min(z.w,z.h)*0.085*scale)}px`,
                  fontFamily:'Inter, sans-serif',
                  fontWeight:600,
                  letterSpacing:'0.03em',
                  textAlign:'center',
                }}>
                  {z.label||'Add photo'}
                </span>
                {/* Dashed border hint */}
                <div className="absolute inset-1 pointer-events-none" style={{
                  borderRadius:br,
                  border:'1.5px dashed rgba(255,255,255,0.25)',
                }}/>
              </div>
            )}
            {/* Tap-to-change overlay for filled photos */}
            {url && (
              <div className="absolute inset-0 opacity-0 hover:opacity-100 active:opacity-100 transition-opacity flex items-center justify-center"
                style={{background:'rgba(0,0,0,0.35)', borderRadius:br, clipPath}}>
                <div className="flex flex-col items-center gap-1">
                  <Camera color="white" size={Math.max(14, 18*scale)} strokeWidth={1.8}/>
                  <span style={{color:'white',fontSize:`${Math.max(8,10*scale)}px`,fontWeight:600}}>Change</span>
                </div>
              </div>
            )}
          </div>
        </div>
      );
    }

    if (z.type==='shape'||z.type==='image') return null;

    /* ── Label zone (static) ────────────────────────────────────────────── */
    if (z.type==='label') {
      const txt = z.sample||z.placeholder||'';
      if (!txt) return null;
      const jc = z.verticalAlign==='bottom'?'flex-end':z.verticalAlign==='center'?'center':'flex-start';
      return (
        <div key={z.id} className="absolute overflow-hidden pointer-events-none"
          style={{left:`${left}%`,top:`${top}%`,width:`${width}%`,height:`${height}%`,display:'flex',flexDirection:'column',justifyContent:jc}}>
          <span style={{display:'block',fontFamily:z.font,fontWeight:z.weight,fontSize:`${(z.size??32)*scale}px`,color:z.color,lineHeight:z.lineHeight??1.2,textAlign:z.align,wordBreak:'break-word'}}>{txt}</span>
        </div>
      );
    }

    /* ── Text / custom zone ─────────────────────────────────────────────── */
    const typed   = values[z.id]??'';
    const ghost   = z.sample||z.placeholder||z.label||'';
    const isFilled = !!typed.trim();
    const jc      = z.verticalAlign==='bottom'?'flex-end':z.verticalAlign==='center'?'center':'flex-start';

    const textStyle: CSSProperties = {
      display:'block', fontFamily:z.font, fontWeight:z.weight,
      fontSize:`${(z.size??32)*scale}px`, color:z.color??'#FFFFFF',
      lineHeight:z.lineHeight??1.2, textAlign:z.align,
      letterSpacing:z.letterSpacing?`${z.letterSpacing*scale}px`:undefined,
      textTransform:z.textTransform as 'none'|'uppercase'|'lowercase'|undefined,
      WebkitTextStroke:(z.strokeColor&&(z.strokeWidth??0)>0)?`${(z.strokeWidth??0)*scale}px ${z.strokeColor}`:undefined,
      textShadow:(z.shadowColor&&(z.shadowBlur??0)>0)?`${(z.shadowX??0)*scale}px ${(z.shadowY??0)*scale}px ${(z.shadowBlur??0)*scale}px ${z.shadowColor}`:undefined,
      wordBreak:'break-word',
    };

    return (
      <div key={z.id} className="absolute cursor-pointer" style={{
        left:`${left}%`, top:`${top}%`, width:`${width}%`, minHeight:`${height}%`,
        display:'flex', flexDirection:'column', justifyContent:jc, zIndex:2,
      }}
        onClick={e=>{e.stopPropagation(); setActiveZoneId(z.id);}}>

        {isFilled ? (
          /* ── Filled: real text + subtle active ring ── */
          <div style={{
            position:'relative',
            outline: isActive ? '2px solid rgba(232,197,126,0.9)' : 'none',
            outlineOffset: '3px',
            borderRadius: 4,
          }}>
            {/* field label tag above the text — only visible when active */}
            {isActive && z.label && (
              <div style={{
                position:'absolute', bottom:'100%', left:0,
                marginBottom: Math.max(2, 3*scale),
                background:'rgba(232,197,126,0.95)',
                borderRadius: Math.max(3, 4*scale),
                padding:`${Math.max(1,2*scale)}px ${Math.max(3,5*scale)}px`,
                whiteSpace:'nowrap',
                pointerEvents:'none',
              }}>
                <span style={{fontSize:Math.max(8,10*scale),fontWeight:700,color:'#0F1F18',fontFamily:'Inter,sans-serif',letterSpacing:'0.01em'}}>
                  {z.label}
                </span>
              </div>
            )}
            <span style={textStyle}>{typed}</span>
          </div>
        ) : (
          /* ── Empty: frosted pill showing label + pencil ── */
          <div style={{
            borderRadius: Math.max(6, 8*scale),
            background: isActive ? 'rgba(232,197,126,0.15)' : 'rgba(15,31,24,0.55)',
            backdropFilter:'blur(12px)',
            WebkitBackdropFilter:'blur(12px)',
            border: isActive
              ? '2px solid rgba(232,197,126,0.85)'
              : '1.5px solid rgba(255,255,255,0.22)',
            padding:`${Math.max(5,7*scale)}px ${Math.max(8,11*scale)}px`,
            display:'flex', flexDirection:'column', gap: Math.max(2, 3*scale),
            transition:'all 0.18s ease',
            boxShadow: isActive ? '0 0 0 3px rgba(232,197,126,0.12)' : '0 1px 6px rgba(0,0,0,0.18)',
          }}>
            {/* Field label title — always visible so attendee knows what to fill */}
            <div style={{display:'flex', alignItems:'center', justifyContent:'space-between', gap:4}}>
              <span style={{
                fontSize: Math.max(8, 10*scale),
                fontWeight: 700,
                fontFamily: 'Inter, sans-serif',
                letterSpacing: '0.03em',
                color: isActive ? 'rgba(232,197,126,1)' : 'rgba(255,255,255,0.5)',
                textTransform:'uppercase',
              }}>
                {z.label || 'Text'}{z.required ? ' *' : ''}
              </span>
              <div style={{
                background: isActive ? 'rgba(232,197,126,0.85)' : 'rgba(255,255,255,0.18)',
                borderRadius:'50%',
                width: Math.max(16, 18*scale),
                height: Math.max(16, 18*scale),
                display:'flex', alignItems:'center', justifyContent:'center',
                flexShrink:0,
              }}>
                <Pencil color={isActive?'#0F1F18':'rgba(255,255,255,0.85)'} strokeWidth={2.2}
                  style={{width:Math.max(7,9*scale),height:'auto'}}/>
              </div>
            </div>
            {/* Placeholder hint */}
            <span style={{
              ...textStyle,
              fontSize: Math.max(9, (z.size??32)*scale*0.7),
              opacity: 0.4,
              overflow:'hidden',
              whiteSpace:'nowrap',
              textOverflow:'ellipsis',
            }}>{ghost || (isActive ? 'Start typing…' : 'Tap to fill')}</span>
          </div>
        )}
      </div>
    );
  };

  /* Bottom editing sheet for mobile */
  const sheetOpen = !!activeZoneId;

  return (
    <div className="min-h-screen bg-[#0F1F18]" onClick={()=>setActiveZoneId(null)}>

      {/* Progress bar */}
      <div className="fixed top-0 left-0 right-0 z-40 h-[3px]" style={{background:'rgba(255,255,255,0.1)'}}>
        <div className="h-full transition-all duration-500" style={{width:`${progressPct}%`,background:'linear-gradient(90deg,#1F4D3A,#E8C57E)'}}/>
      </div>

      <Toast/>

      {/* ════════════════════════════════════════════════════════════════════
          MOBILE — full-screen card + bottom editing sheet
      ════════════════════════════════════════════════════════════════════ */}
      <div className="md:hidden flex flex-col min-h-screen">

        {/* Minimal top bar */}
        <div className="px-4 pt-6 pb-2 flex items-center justify-between shrink-0">
          <div>
            <p className="text-[10px] font-mono tracking-widest" style={{color:'rgba(255,255,255,0.35)'}}>GET YOUR CARD</p>
            <h1 className="text-[14px] font-semibold text-white leading-tight truncate max-w-[220px]">{eventName}</h1>
          </div>
          {/* Progress dots */}
          <div className="flex items-center gap-1.5">
            {editableFields.map((_,i) => {
              const f = editableFields[i];
              const filled = f.type==='photo' ? !!photoFiles[f.id] : !!values[f.id]?.trim();
              return (
                <div key={i} className="rounded-full transition-all duration-300"
                  style={{
                    width: filled ? 8 : 6, height: filled ? 8 : 6,
                    background: filled ? '#E8C57E' : 'rgba(255,255,255,0.25)',
                  }}/>
              );
            })}
          </div>
        </div>

        {/* Field chips — horizontal scroll, one per editable zone */}
        {editableFields.length > 0 && (
          <div className="flex items-center gap-2 px-3 pb-1 overflow-x-auto shrink-0" style={{scrollbarWidth:'none'}}>
            {editableFields.map((f, i) => {
              const filled = f.type==='photo' ? !!photoFiles[f.id] : !!values[f.id]?.trim();
              const isAct  = activeZoneId===f.id;
              return (
                <button key={f.id} onClick={e=>{e.stopPropagation(); setActiveZoneId(f.id);}}
                  className="shrink-0 flex items-center gap-1 px-3 py-1 rounded-full text-[11px] font-medium transition-all"
                  style={{
                    background: isAct  ? '#E8C57E' : filled ? 'rgba(45,122,79,0.35)' : 'rgba(255,255,255,0.1)',
                    color:      isAct  ? '#0F1F18' : filled ? '#5DD08A'               : 'rgba(255,255,255,0.6)',
                    border:     isAct  ? 'none'    : filled ? '1px solid rgba(45,122,79,0.5)' : '1px solid rgba(255,255,255,0.14)',
                    boxShadow:  isAct  ? '0 2px 8px rgba(232,197,126,0.3)' : 'none',
                  }}>
                  {filled && <Check size={10} strokeWidth={2.8}/>}
                  {f.required && !filled && <span style={{color:'rgba(232,197,126,0.7)',fontSize:10}}>·</span>}
                  {f.label || `Field ${i+1}`}
                </button>
              );
            })}
          </div>
        )}

        {/* Card — fills available space */}
        <div className="flex-1 px-3 pb-2 flex items-center" onClick={e=>e.stopPropagation()}>
          <div ref={cardRef} className="w-full relative overflow-hidden rounded-2xl"
            style={{
              aspectRatio:`${backgroundWidth}/${backgroundHeight}`,
              boxShadow:'0 24px 64px rgba(0,0,0,0.5), 0 4px 16px rgba(0,0,0,0.3)',
            }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={backgroundUrl} alt={eventName} className="w-full h-full object-cover" draggable={false}/>
            {zones.map(renderZone)}
          </div>
        </div>

        {/* Hint when nothing active */}
        {!sheetOpen && (
          <p className="text-center pb-2 text-[11px]" style={{color:'rgba(255,255,255,0.35)'}}>
            Tap any field on the card to fill it in
          </p>
        )}

        {/* Generate CTA when all done and sheet closed */}
        {allDone && !sheetOpen && (
          <div className="px-4 pb-6 shrink-0">
            <button onClick={handleGenerate}
              className="w-full h-14 rounded-2xl font-display font-bold text-[16px] text-white flex items-center justify-center gap-2.5 transition hover:opacity-90"
              style={{background:'#1F4D3A', boxShadow:'0 8px 28px rgba(31,77,58,0.5)'}}>
              <Layers size={17} strokeWidth={2}/>Generate my card
            </button>
            <p className="text-center mt-2 text-[10px] font-mono" style={{color:'rgba(255,255,255,0.25)'}}>
              Powered by <span style={{color:'rgba(232,197,126,0.7)'}}>Cardly</span>
            </p>
          </div>
        )}

        {/* ── Bottom editing sheet ─────────────────────────────────────── */}
        <div
          className="fixed left-0 right-0 bottom-0 z-30 transition-transform duration-300 ease-out"
          style={{transform: sheetOpen ? 'translateY(0)' : 'translateY(100%)'}}
          onClick={e=>e.stopPropagation()}
        >
          <div className="rounded-t-3xl overflow-hidden"
            style={{
              background:'rgba(15,28,20,0.97)',
              backdropFilter:'blur(20px)',
              WebkitBackdropFilter:'blur(20px)',
              border:'1px solid rgba(255,255,255,0.1)',
              borderBottom:'none',
              boxShadow:'0 -8px 40px rgba(0,0,0,0.5)',
            }}>

            {/* Handle bar */}
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-10 h-1 rounded-full" style={{background:'rgba(255,255,255,0.2)'}}/>
            </div>

            <div className="px-5 pb-8 pt-2">
              {activeZone && (
                <>
                  {/* Field header: title + nav */}
                  <div className="flex items-start justify-between gap-3 mb-3">
                    {/* Label + hint */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-[18px] font-bold text-white leading-tight truncate">
                          {activeZone.label || 'Enter text'}
                        </h3>
                        {activeZone.required && (
                          <span className="shrink-0 text-[9px] font-mono tracking-wider px-1.5 py-0.5 rounded-md"
                            style={{background:'rgba(232,197,126,0.15)', color:'#E8C57E', border:'1px solid rgba(232,197,126,0.25)'}}>
                            REQUIRED
                          </span>
                        )}
                      </div>
                      {activeZone.placeholder && (
                        <p className="text-[12px] mt-0.5 leading-snug" style={{color:'rgba(255,255,255,0.38)'}}>
                          {activeZone.placeholder}
                        </p>
                      )}
                    </div>
                    {/* Nav controls */}
                    <div className="flex items-center gap-1.5 shrink-0">
                      <span className="text-[10px] font-mono" style={{color:'rgba(255,255,255,0.25)'}}>
                        {activeFieldIdx+1}/{editableFields.length}
                      </span>
                      {hasPrev && (
                        <button onClick={()=>setActiveZoneId(editableFields[activeFieldIdx-1].id)}
                          className="h-8 w-8 rounded-xl grid place-items-center transition"
                          style={{background:'rgba(255,255,255,0.08)', border:'1px solid rgba(255,255,255,0.12)'}}>
                          <ChevronLeft size={14} color="rgba(255,255,255,0.7)" strokeWidth={2.5}/>
                        </button>
                      )}
                      {hasNext && (
                        <button onClick={()=>setActiveZoneId(editableFields[activeFieldIdx+1].id)}
                          className="h-8 px-3 rounded-xl flex items-center gap-1 text-[12px] font-semibold transition"
                          style={{background:'rgba(31,77,58,0.7)', color:'white', border:'1px solid rgba(31,77,58,0.5)'}}>
                          Next<ChevronRight size={13} strokeWidth={2.5}/>
                        </button>
                      )}
                      <button onClick={()=>setActiveZoneId(null)}
                        className="h-8 w-8 rounded-xl grid place-items-center transition"
                        style={{background:'rgba(255,255,255,0.08)', border:'1px solid rgba(255,255,255,0.12)'}}>
                        <X size={14} color="rgba(255,255,255,0.6)" strokeWidth={2}/>
                      </button>
                    </div>
                  </div>

                  {/* Photo field */}
                  {activeZone.type==='photo' && (
                    <div className="flex flex-col gap-2">
                      {photoUrls[activeZone.id] ? (
                        <div className="flex items-center gap-3 p-3 rounded-2xl"
                          style={{background:'rgba(255,255,255,0.06)', border:'1px solid rgba(255,255,255,0.1)'}}>
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={photoUrls[activeZone.id]} alt="" className="h-12 w-12 rounded-xl object-cover"/>
                          <div className="flex-1">
                            <div className="text-[13px] font-semibold text-white">Photo added ✓</div>
                            <div className="text-[11px]" style={{color:'rgba(255,255,255,0.45)'}}>Looking great!</div>
                          </div>
                          <button onClick={()=>fileInputRefs.current[activeZone.id]?.click()}
                            className="text-[12px] font-medium px-3 py-1.5 rounded-xl transition"
                            style={{background:'rgba(31,77,58,0.6)', color:'#E8C57E', border:'1px solid rgba(31,77,58,0.5)'}}>
                            Change
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={()=>fileInputRefs.current[activeZone.id]?.click()}
                          onDragOver={e=>{e.preventDefault();setDropActive(true);}}
                          onDragLeave={()=>setDropActive(false)}
                          onDrop={e=>{e.preventDefault();setDropActive(false);const f=e.dataTransfer.files[0];if(f?.type.startsWith('image/'))handlePhotoSelect(activeZone.id,f);}}
                          className="w-full py-7 rounded-2xl flex flex-col items-center gap-3 transition"
                          style={{
                            background: dropActive?'rgba(31,77,58,0.25)':'rgba(255,255,255,0.05)',
                            border: dropActive?'2px dashed rgba(232,197,126,0.7)':'2px dashed rgba(255,255,255,0.18)',
                          }}>
                          <div className="h-12 w-12 rounded-2xl flex items-center justify-center"
                            style={{background:'rgba(31,77,58,0.5)', border:'1px solid rgba(31,77,58,0.7)'}}>
                            <Upload size={20} strokeWidth={1.8} color="#E8C57E"/>
                          </div>
                          <div className="text-center">
                            <div className="text-[14px] font-semibold text-white">Tap to upload photo</div>
                            <div className="text-[11.5px] mt-0.5" style={{color:'rgba(255,255,255,0.4)'}}>JPG or PNG · up to 10 MB</div>
                          </div>
                        </button>
                      )}
                    </div>
                  )}

                  {/* Text / custom field */}
                  {(activeZone.type==='text'||activeZone.type==='custom') && (
                    activeZone.type==='custom'&&activeZone.options ? (
                      <select
                        value={values[activeZone.id]??''}
                        onChange={e=>setValues(v=>({...v,[activeZone.id]:e.target.value}))}
                        className="w-full h-12 px-4 rounded-xl text-[15px] outline-none appearance-none"
                        style={{background:'rgba(255,255,255,0.08)', border:'1.5px solid rgba(255,255,255,0.15)', color:values[activeZone.id]?'white':'rgba(255,255,255,0.4)'}}>
                        <option value="" disabled>Select {activeZone.label??'option'}…</option>
                        {(activeZone.options as string[]).map(o=><option key={o} value={o} style={{background:'#0F1F18'}}>{o}</option>)}
                      </select>
                    ) : (
                      <div>
                        {/* ── Live preview strip ─────────────────────────────────────────
                            Shows the text in the zone's actual font/colour as you type.
                            Visible even when the full card is hidden behind the keyboard. */}
                        <div className="mb-3 px-4 py-3 rounded-2xl relative overflow-hidden"
                          style={{
                            background: 'rgba(255,255,255,0.05)',
                            border: '1px solid rgba(255,255,255,0.09)',
                            minHeight: 52,
                          }}>
                          {/* Subtle label */}
                          <div className="absolute top-2 right-3 text-[9px] font-mono tracking-widest"
                            style={{color:'rgba(255,255,255,0.2)'}}>PREVIEW</div>
                          <span style={{
                            display: 'block',
                            fontFamily: activeZone.font ?? 'Inter',
                            fontWeight: activeZone.weight ?? 700,
                            /* clamp to a readable size in the sheet — never larger than 36px */
                            fontSize: Math.min(36, Math.max(14, (activeZone.size ?? 32) * (previewW / backgroundWidth) * 2.4)),
                            color: activeZone.color ?? '#FFFFFF',
                            textAlign: activeZone.align ?? 'left',
                            lineHeight: activeZone.lineHeight ?? 1.2,
                            letterSpacing: activeZone.letterSpacing
                              ? `${activeZone.letterSpacing}px` : undefined,
                            textTransform: activeZone.textTransform as 'none'|'uppercase'|'lowercase'|undefined,
                            wordBreak: 'break-word',
                            opacity: values[activeZone.id]?.trim() ? 1 : 0.28,
                            transition: 'opacity 0.15s ease',
                          }}>
                            {values[activeZone.id]?.trim() || activeZone.placeholder || activeZone.label || 'Start typing…'}
                          </span>
                        </div>
                        <textarea
                          ref={sheetInputRef}
                          value={values[activeZone.id]??''}
                          onChange={e=>{
                            const raw = e.target.value;
                            const val = activeZone.maxChars ? raw.slice(0, activeZone.maxChars) : raw;
                            setValues(v=>({...v,[activeZone.id]:val}));
                          }}
                          onKeyDown={e=>{
                            if(e.key==='Enter'&&!e.shiftKey){
                              e.preventDefault();
                              if(hasNext) setActiveZoneId(editableFields[activeFieldIdx+1].id);
                              else setActiveZoneId(null);
                            }
                          }}
                          placeholder={activeZone.placeholder||`Enter ${activeZone.label||'text'}…`}
                          rows={2}
                          className="w-full px-4 py-3 rounded-xl text-[15px] text-white placeholder-white/30 outline-none resize-none transition"
                          style={{
                            background:'rgba(255,255,255,0.08)',
                            border:'1.5px solid rgba(232,197,126,0.5)',
                            boxShadow:'0 0 0 3px rgba(232,197,126,0.1)',
                            caretColor:'#E8C57E',
                            lineHeight:'1.5',
                          }}
                        />
                        {activeZone.maxChars && (
                          <div className="flex justify-end mt-1">
                            <span className="text-[10.5px] font-mono transition-colors" style={{
                              color: (values[activeZone.id]?.length??0) >= activeZone.maxChars
                                ? '#E57373'
                                : (values[activeZone.id]?.length??0) >= activeZone.maxChars * 0.8
                                  ? '#E8C57E'
                                  : 'rgba(255,255,255,0.28)',
                            }}>
                              {values[activeZone.id]?.length??0}/{activeZone.maxChars}
                            </span>
                          </div>
                        )}
                      </div>
                    )
                  )}

                  {/* Generate if last field + all done */}
                  {!hasNext && allDone && (
                    <button onClick={()=>{setActiveZoneId(null); setTimeout(handleGenerate,100);}}
                      className="w-full h-12 rounded-xl font-bold text-[15px] text-white flex items-center justify-center gap-2 mt-3 transition hover:opacity-90"
                      style={{background:'#1F4D3A', boxShadow:'0 4px 16px rgba(31,77,58,0.4)'}}>
                      <Layers size={16} strokeWidth={2}/>Generate my card
                    </button>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ════════════════════════════════════════════════════════════════════
          DESKTOP — form left + sticky card right
      ════════════════════════════════════════════════════════════════════ */}
      <div className="hidden md:block" style={{background:'#FAF6EE'}}>
        <div className="max-w-5xl mx-auto px-6 lg:px-8 pt-8 pb-16">
          <div className="mb-7 flex items-start justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-1.5 text-[11px] font-mono text-[#1F4D3A] bg-[#E8EFEB] px-2.5 py-1 rounded-full mb-2">
                <span className="h-1.5 w-1.5 rounded-full bg-[#2D7A4F]"/>GET YOUR CARD
              </div>
              <h1 className="font-display font-bold text-[#0F1F18] text-[26px] leading-tight">{eventName}</h1>
              <p className="text-[13.5px] text-[#6B7A72] mt-1">Fill in your details and download your personalised card.</p>
            </div>
            {requiredZones.length>0&&(
              <div className="shrink-0 flex flex-col items-end gap-1.5 mt-1">
                <span className="text-[12px] font-mono text-[#3A4A42]">{filledCount}<span className="text-[#6B7A72]">/{requiredZones.length}</span></span>
                <div className="h-1.5 w-20 rounded-full bg-[#E5E0D4] overflow-hidden">
                  <div className="h-full rounded-full transition-all" style={{width:`${progressPct}%`,background:'#1F4D3A'}}/>
                </div>
              </div>
            )}
          </div>
          <div className="grid grid-cols-[1fr_320px] lg:grid-cols-[1fr_360px] gap-10 lg:gap-14 items-start">
            {/* Form */}
            <div>
              <div className="bg-white rounded-2xl border border-[#E5E0D4] shadow-sm overflow-hidden">
                {zones.filter(z=>z.type==='photo').map((z,i,arr)=>(
                  <div key={z.id} className={`p-5 ${i<arr.length-1||textZones.length>0?'border-b border-[#E5E0D4]':''}`}>
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <label className="block text-[13.5px] font-semibold text-[#0F1F18]">
                          {z.label||'Photo'}{z.required&&<span className="text-[#C97A2D] ml-0.5">*</span>}
                        </label>
                        {z.placeholder&&<p className="text-[11.5px] text-[#6B7A72] mt-0.5">{z.placeholder}</p>}
                      </div>
                      {photoUrls[z.id]&&<button onClick={()=>fileInputRefs.current[z.id]?.click()} className="text-[11.5px] text-[#1F4D3A] font-medium hover:underline flex items-center gap-1"><Pencil size={11} strokeWidth={2}/>Change</button>}
                    </div>
                    {photoUrls[z.id]?(
                      <div className="relative rounded-xl overflow-hidden border border-[#E5E0D4] cursor-pointer group" onClick={()=>fileInputRefs.current[z.id]?.click()}>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={photoUrls[z.id]} alt="" className="w-full object-cover" style={{maxHeight:180}}/>
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/25 transition flex items-center justify-center opacity-0 group-hover:opacity-100">
                          <span className="bg-white/90 rounded-xl px-3 py-1.5 text-[12px] font-medium text-[#0F1F18] flex items-center gap-1.5"><Camera size={13} strokeWidth={2}/>Change photo</span>
                        </div>
                      </div>
                    ):(
                      <div className="rounded-xl transition-all cursor-pointer" style={{border:dropActive?'2px dashed #1F4D3A':'2px dashed #C9C3B1',background:dropActive?'#E8EFEB':'#FAF6EE',padding:'28px 20px'}}
                        onClick={()=>fileInputRefs.current[z.id]?.click()}
                        onDragOver={e=>{e.preventDefault();setDropActive(true);}}
                        onDragLeave={()=>setDropActive(false)}
                        onDrop={e=>{e.preventDefault();setDropActive(false);const f=e.dataTransfer.files[0];if(f?.type.startsWith('image/'))handlePhotoSelect(z.id,f);}}>
                        <div className="flex flex-col items-center gap-3">
                          <div className="h-12 w-12 rounded-xl bg-[#E8EFEB] border border-[#C9C3B1] grid place-items-center"><Upload size={20} strokeWidth={1.8} color="#1F4D3A"/></div>
                          <div className="text-center">
                            <div className="text-[13.5px] font-semibold text-[#0F1F18]">{dropActive?'Drop to upload':'Click to upload photo'}</div>
                            <div className="text-[11.5px] text-[#6B7A72] mt-0.5">Drag & drop or click · JPG, PNG · up to 10 MB</div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
                {textZones.map((z,i,arr)=>(
                  <div key={z.id} className={`p-5 ${i<arr.length-1?'border-b border-[#E5E0D4]':''}`}>
                    {/* Field label */}
                    <div className="mb-2">
                      <label className="block text-[13.5px] font-semibold text-[#0F1F18]">
                        {z.label||'Text'}{z.required&&<span className="text-[#C97A2D] ml-0.5">*</span>}
                      </label>
                      {z.placeholder&&<p className="text-[11.5px] text-[#6B7A72] mt-0.5">{z.placeholder}</p>}
                    </div>
                    {z.type==='custom'&&z.options?(
                      <select value={values[z.id]??''} onChange={e=>setValues(v=>({...v,[z.id]:e.target.value}))}
                        className="w-full h-11 px-4 rounded-xl text-[14px] outline-none appearance-none transition"
                        style={{background:'#FAF6EE',border:'1.5px solid #E5E0D4',color:values[z.id]?'#0F1F18':'#6B7A72'}}
                        onFocus={e=>{e.currentTarget.style.borderColor='#1F4D3A';e.currentTarget.style.boxShadow='0 0 0 3px rgba(31,77,58,0.1)';e.currentTarget.style.background='#fff';}}
                        onBlur={e=>{e.currentTarget.style.borderColor='#E5E0D4';e.currentTarget.style.boxShadow='none';e.currentTarget.style.background='#FAF6EE';}}>
                        <option value="" disabled>Select {z.label??'option'}…</option>
                        {(z.options as string[]).map(o=><option key={o} value={o}>{o}</option>)}
                      </select>
                    ):(
                      <div>
                        <textarea
                          value={values[z.id]??''}
                          onChange={e=>{
                            const raw=e.target.value;
                            const val=z.maxChars?raw.slice(0,z.maxChars):raw;
                            setValues(v=>({...v,[z.id]:val}));
                          }}
                          placeholder={z.placeholder||`Enter ${z.label||'text'}…`}
                          rows={2}
                          className="w-full px-4 py-2.5 rounded-xl text-[14px] text-[#0F1F18] placeholder-[#6B7A72]/50 outline-none resize-none transition"
                          style={{background:'#FAF6EE',border:'1.5px solid #E5E0D4',lineHeight:'1.5'}}
                          onFocus={e=>{e.currentTarget.style.borderColor='#1F4D3A';e.currentTarget.style.boxShadow='0 0 0 3px rgba(31,77,58,0.1)';e.currentTarget.style.background='#fff';}}
                          onBlur={e=>{e.currentTarget.style.borderColor='#E5E0D4';e.currentTarget.style.boxShadow='none';e.currentTarget.style.background='#FAF6EE';}}
                        />
                        {z.maxChars&&(
                          <div className="flex justify-end mt-1">
                            <span className="text-[10.5px] font-mono" style={{
                              color:(values[z.id]?.length??0)>=z.maxChars?'#B8423C'
                                :(values[z.id]?.length??0)>=z.maxChars*0.8?'#C97A2D':'#6B7A72',
                            }}>
                              {values[z.id]?.length??0}/{z.maxChars}
                            </span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
                {error&&<div className="mx-5 mb-4 px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-[13px] text-red-700">{error}</div>}
                <div className="p-5 border-t border-[#E5E0D4]">
                  <button disabled={!allDone} onClick={handleGenerate}
                    className="w-full h-14 rounded-2xl font-display font-bold text-[16px] transition flex items-center justify-center gap-2.5"
                    style={allDone?{background:'#1F4D3A',color:'white',boxShadow:'0 8px 24px rgba(31,77,58,0.25)'}:{background:'#E5E0D4',color:'#6B7A72',cursor:'not-allowed'}}>
                    {allDone?<><Layers size={17} strokeWidth={2}/>Generate my card</>:`${requiredZones.length-filledCount} field${requiredZones.length-filledCount!==1?'s':''} remaining`}
                  </button>
                  <div className="text-center mt-3 text-[11px] font-mono text-[#6B7A72]/50">Powered by <span style={{color:'#1F4D3A',fontWeight:600}}>Cardly</span></div>
                </div>
              </div>
            </div>
            {/* Card preview */}
            <div className="sticky top-6">
              <div className="flex items-center justify-between mb-2.5">
                <span className="text-[10.5px] font-mono text-[#6B7A72] tracking-widest">LIVE PREVIEW</span>
                <span className="text-[10.5px] font-mono text-[#6B7A72]/60">{backgroundWidth}×{backgroundHeight}</span>
              </div>
              <div ref={cardRef} className="relative overflow-hidden rounded-2xl border border-[#E5E0D4]"
                style={{aspectRatio:`${backgroundWidth}/${backgroundHeight}`,boxShadow:'0 16px 48px rgba(15,31,24,0.10)'}}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={backgroundUrl} alt={eventName} className="w-full h-full object-cover" draggable={false}/>
                {zones.map(z => {
                  const accOff = (() => {
                    let off=0;
                    for (const tz of zones) {
                      if (tz.type!=='text'&&tz.type!=='custom') continue;
                      if (tz.id===z.id) continue;
                      if (tz.y+tz.h<=z.y) { const mh=measuredHeights[tz.id]; if (mh) off+=Math.max(0,mh/scale-tz.h); }
                    }
                    return off;
                  })();
                  const left=(z.x/backgroundWidth)*100, top=((z.y+accOff)/backgroundHeight)*100;
                  const width=(z.w/backgroundWidth)*100, height=(z.h/backgroundHeight)*100;
                  if (z.type==='photo') {
                    const sd = Math.min(z.w, z.h) * scale;
                    const br = z.shape==='circle'?'50%':z.shape==='rounded'?`${((z.cornerRadius??18)/100)*sd}px`:z.shape==='hexagon'?'0':'6px';
                    const cp = z.shape==='hexagon'?'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)':undefined;
                    const url=photoUrls[z.id];
                    return (
                      <div key={z.id} className="absolute pointer-events-none" style={{left:`${left}%`,top:`${top}%`,width:`${width}%`,height:`${height}%`}}>
                        <div className="w-full h-full overflow-hidden" style={{borderRadius:br,clipPath:cp}}>
                          {url?(
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={url} alt="" className="w-full h-full object-cover"/>
                          ):(
                            <div className="w-full h-full flex flex-col items-center justify-center gap-1" style={{background:'rgba(15,31,24,0.5)',backdropFilter:'blur(4px)'}}>
                              <Camera style={{width:'28%',height:'28%',opacity:0.7}} color="white" strokeWidth={1.5}/>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  }
                  if (z.type==='shape'||z.type==='image') return null;
                  if (z.type==='label') {
                    const txt=z.sample||z.placeholder||''; if (!txt) return null;
                    const jc=z.verticalAlign==='bottom'?'flex-end':z.verticalAlign==='center'?'center':'flex-start';
                    return <div key={z.id} className="absolute overflow-hidden pointer-events-none" style={{left:`${left}%`,top:`${top}%`,width:`${width}%`,height:`${height}%`,display:'flex',flexDirection:'column',justifyContent:jc}}><span style={{display:'block',fontFamily:z.font,fontWeight:z.weight,fontSize:`${(z.size??32)*scale}px`,color:z.color,lineHeight:z.lineHeight??1.2,textAlign:z.align,wordBreak:'break-word'}}>{txt}</span></div>;
                  }
                  const typed=values[z.id]??''; const ghost=z.sample||z.placeholder||z.label||'';
                  const jc=z.verticalAlign==='bottom'?'flex-end':z.verticalAlign==='center'?'center':'flex-start';
                  const ts: CSSProperties={display:'block',fontFamily:z.font,fontWeight:z.weight,fontSize:`${(z.size??32)*scale}px`,color:z.color??'#FFFFFF',lineHeight:z.lineHeight??1.2,textAlign:z.align,letterSpacing:z.letterSpacing?`${z.letterSpacing*scale}px`:undefined,textTransform:z.textTransform as 'none'|'uppercase'|'lowercase'|undefined,wordBreak:'break-word',opacity:typed?1:0.38};
                  /* no overflow-hidden so text can grow and push zones below */
                  return <div key={z.id} className="absolute pointer-events-none" style={{left:`${left}%`,top:`${top}%`,width:`${width}%`,minHeight:`${height}%`,display:'flex',flexDirection:'column',justifyContent:jc}}><span style={ts}>{typed||ghost}</span></div>;
                })}
              </div>
              <div className="mt-2.5 flex items-center justify-center gap-1.5 text-[10.5px] font-mono text-[#6B7A72]/60">
                <span className="h-1.5 w-1.5 rounded-full bg-[#2D7A4F] animate-pulse"/>Updates live as you type
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Hidden measurement spans */}
      <div style={{position:'fixed',top:-9999,left:-9999,visibility:'hidden',pointerEvents:'none'}}>
        {zones.filter(z=>z.type==='text'||z.type==='custom').map(z=>{
          const sw=Math.round((z.w/backgroundWidth)*previewW);
          const val=values[z.id]||z.sample||z.placeholder||'';
          return <span key={z.id} ref={el=>{measureRefs.current[z.id]=el;}} style={{display:'block',width:`${sw}px`,fontFamily:z.font,fontWeight:z.weight??700,fontSize:`${(z.size??32)*scale}px`,lineHeight:z.lineHeight??1.2,letterSpacing:z.letterSpacing?`${z.letterSpacing*scale}px`:undefined,textTransform:z.textTransform,wordBreak:'break-word',whiteSpace:'pre-wrap'}}>{val}</span>;
        })}
      </div>

      {/* Hidden file inputs */}
      {zones.filter(z=>z.type==='photo').map(z=>(
        <input key={z.id} ref={el=>{fileInputRefs.current[z.id]=el;}}
          type="file" accept="image/*" className="hidden"
          onChange={e=>{const f=e.target.files?.[0];if(f)handlePhotoSelect(z.id,f);if(e.target)e.target.value='';}}/>
      ))}

      {/* ─── Crop modal ──────────────────────────────────────────────────── */}
      {cropTarget && (() => {
        const z = cropTarget.zone;
        const aspect = z.w / z.h;
        const isCircle = z.shape === 'circle';
        return (
          <div
            className="fixed inset-0 z-50 flex flex-col"
            style={{ background: 'rgba(10,20,14,0.97)', backdropFilter: 'blur(8px)' }}
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 pt-5 pb-3 shrink-0">
              <div>
                <div className="text-[10.5px] font-mono tracking-widest" style={{ color: 'rgba(255,255,255,0.4)' }}>
                  CROP PHOTO
                </div>
                <div className="text-[15px] font-semibold text-white mt-0.5">{z.label || 'Photo'}</div>
              </div>
              <button
                onClick={() => setCropTarget(null)}
                className="h-9 w-9 rounded-xl grid place-items-center transition"
                style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)' }}
              >
                <X size={16} color="rgba(255,255,255,0.7)" strokeWidth={2} />
              </button>
            </div>

            {/* Shape hint */}
            <div className="px-5 pb-3 shrink-0">
              <div className="inline-flex items-center gap-1.5 text-[10.5px] font-mono px-2.5 py-1 rounded-full"
                style={{ background: 'rgba(232,197,126,0.1)', border: '1px solid rgba(232,197,126,0.3)', color: '#E8C57E' }}>
                <span className="h-1.5 w-1.5 rounded-full bg-[#E8C57E]" />
                {isCircle ? 'Circle crop' : z.shape === 'rounded' ? 'Rounded crop' : 'Square crop'} · drag to reposition
              </div>
            </div>

            {/* Cropper area */}
            <div className="flex-1 relative">
              <Cropper
                image={cropTarget.srcUrl}
                crop={cropPos}
                zoom={cropZoom}
                aspect={aspect}
                cropShape={isCircle ? 'round' : 'rect'}
                onCropChange={setCropPos}
                onZoomChange={setCropZoom}
                onCropComplete={(_croppedArea: Area, croppedAreaPixels: Area) => {
                  setCroppedAreaPx(croppedAreaPixels);
                }}
                style={{
                  containerStyle: { background: 'transparent' },
                  cropAreaStyle: {
                    border: '2px solid rgba(232,197,126,0.9)',
                    boxShadow: '0 0 0 9999px rgba(10,20,14,0.65)',
                  },
                  mediaStyle: {},
                }}
                showGrid={false}
                zoomWithScroll
              />
            </div>

            {/* Zoom slider + actions */}
            <div className="px-5 pt-4 pb-8 shrink-0">
              {/* Zoom control */}
              <div className="flex items-center gap-3 mb-5">
                <button
                  onClick={() => setCropZoom(z => Math.max(1, z - 0.1))}
                  className="h-9 w-9 rounded-xl grid place-items-center shrink-0 transition"
                  style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)' }}
                >
                  <ZoomOut size={15} color="rgba(255,255,255,0.7)" strokeWidth={2} />
                </button>
                <input
                  type="range" min={1} max={3} step={0.01}
                  value={cropZoom}
                  onChange={e => setCropZoom(Number(e.target.value))}
                  className="flex-1"
                  style={{ accentColor: '#E8C57E', height: 4 }}
                />
                <button
                  onClick={() => setCropZoom(z => Math.min(3, z + 0.1))}
                  className="h-9 w-9 rounded-xl grid place-items-center shrink-0 transition"
                  style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)' }}
                >
                  <ZoomIn size={15} color="rgba(255,255,255,0.7)" strokeWidth={2} />
                </button>
              </div>
              {/* Action buttons */}
              <div className="flex gap-3">
                <button
                  onClick={() => setCropTarget(null)}
                  className="flex-1 h-12 rounded-2xl text-[14px] font-medium transition"
                  style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.7)' }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleCropConfirm}
                  className="flex-1 h-12 rounded-2xl text-[15px] font-bold text-white transition"
                  style={{ background: '#1F4D3A', boxShadow: '0 6px 20px rgba(31,77,58,0.5)' }}
                >
                  Use this crop
                </button>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
