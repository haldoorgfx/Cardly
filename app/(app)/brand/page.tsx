'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { Check, ArrowRight } from 'lucide-react';

const PRESET_SWATCHES = [
  { name: 'Forest Green', hex: '#1F4D3A' },
  { name: 'Cream Gold', hex: '#E8C57E' },
  { name: 'Ink', hex: '#0F1F18' },
  { name: 'Gold', hex: '#ffd28a' },
  { name: 'Teal', hex: '#7be0c0' },
  { name: 'Coral', hex: '#ff6058' },
  { name: 'Forest', hex: '#1f8a5b' },
  { name: 'Cobalt', hex: '#0a66c2' },
];

const TYPE_PAIRS = [
  { display: 'DM Sans', body: 'Inter', label: 'Modern & Clean' },
  { display: 'Playfair Display', body: 'Inter', label: 'Elegant Serif' },
  { display: 'Space Grotesk', body: 'Inter', label: 'Technical' },
  { display: 'JetBrains Mono', body: 'Inter', label: 'Code Aesthetic' },
];

type Logos = { light?: string; dark?: string; transparent?: string };

export default function BrandKitPage() {
  const [loading, setLoading] = useState(true);
  const [primaryColor, setPrimaryColor] = useState('#1F4D3A');
  const [secondaryColor, setSecondaryColor] = useState('#E8C57E');
  const [selectedPair, setSelectedPair] = useState(0);
  const [footerText, setFooterText] = useState('Made with Cardly');
  const [logos, setLogos] = useState<Logos>({});
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [logoUploading, setLogoUploading] = useState<string | null>(null);
  const [logoError, setLogoError] = useState<string | null>(null);
  const [copiedHex, setCopiedHex] = useState<string | null>(null);

  const lightRef = useRef<HTMLInputElement>(null);
  const darkRef = useRef<HTMLInputElement>(null);
  const transparentRef = useRef<HTMLInputElement>(null);
  const variantRefs: Record<string, React.RefObject<HTMLInputElement>> = {
    light: lightRef, dark: darkRef, transparent: transparentRef,
  };

  // Load brand kit on mount
  useEffect(() => {
    fetch('/api/brand')
      .then(r => r.json())
      .then(data => {
        if (data.primaryColor) setPrimaryColor(data.primaryColor);
        if (data.secondaryColor) setSecondaryColor(data.secondaryColor);
        if (typeof data.fontPair === 'number') setSelectedPair(data.fontPair);
        if (data.footerText) setFooterText(data.footerText);
        if (data.logos) setLogos(data.logos);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setSaveError(null);
    try {
      const res = await fetch('/api/brand', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ primaryColor, secondaryColor, fontPair: selectedPair, footerText }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        setSaveError(d.error ?? 'Failed to save');
      } else {
        setSaved(true);
        setTimeout(() => setSaved(false), 2500);
      }
    } catch {
      setSaveError('Network error — please try again');
    } finally {
      setSaving(false);
    }
  };

  const handleLogoUpload = useCallback(async (variant: string, file: File) => {
    setLogoUploading(variant);
    setLogoError(null);
    const fd = new FormData();
    fd.append('file', file);
    fd.append('variant', variant);
    try {
      const res = await fetch('/api/brand/logo', { method: 'POST', body: fd });
      const data = await res.json();
      if (!res.ok) { setLogoError(data.error ?? 'Upload failed'); return; }
      setLogos(prev => ({ ...prev, [variant]: data.url }));
    } catch {
      setLogoError('Upload failed — please try again');
    } finally {
      setLogoUploading(null);
    }
  }, []);

  const copyHex = (hex: string) => {
    navigator.clipboard.writeText(hex).then(() => {
      setCopiedHex(hex);
      setTimeout(() => setCopiedHex(null), 1500);
    });
  };

  if (loading) {
    return (
      <div className="px-8 py-8 max-w-[1100px]">
        <div className="animate-pulse space-y-6">
          <div className="h-10 bg-[#F0EDE8] rounded-xl w-48" />
          {[1, 2, 3].map(i => (
            <div key={i} className="h-48 bg-[#F0EDE8] rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="px-8 py-8 max-w-[1100px]">
      {/* Header */}
      <div className="flex items-end justify-between flex-wrap gap-4 mb-10">
        <div>
          <div className="flex items-center gap-2 text-[12px] font-mono text-[#0F1F18]/40">
            <span>WORKSPACE</span><span>/</span><span className="text-[#0F1F18]/70">Brand Kit</span>
          </div>
          <h1 className="mt-2 font-display font-bold text-[34px] leading-tight">Brand Kit</h1>
          <p className="text-[#0F1F18]/60 mt-1 text-[14.5px] max-w-[540px]">
            One source of truth for every event. Updates here propagate to all new events.
          </p>
        </div>
        <div className="flex flex-col items-end gap-2">
          {saveError && (
            <div className="text-[12px] text-rose-600 bg-rose-50 px-3 py-1.5 rounded-xl border border-rose-100">{saveError}</div>
          )}
          <button
            onClick={handleSave}
            disabled={saving}
            className="inline-flex items-center gap-2 text-[13.5px] font-semibold text-white px-5 py-2.5 rounded-xl bg-primary hover:opacity-95 disabled:opacity-70 transition"
          >
            {saved ? (
              <>
                <Check size={14} strokeWidth={2.5} />
                Saved
              </>
            ) : saving ? 'Saving…' : 'Save changes'}
          </button>
        </div>
      </div>

      <div className="space-y-6">

        {/* LOGO */}
        <section className="bg-white rounded-2xl border border-border p-6 shadow-soft">
          <div className="flex items-center justify-between mb-6">
            <div>
              <div className="text-[11px] font-mono tracking-widest text-[#0F1F18]/45">LOGO</div>
              <div className="font-display font-semibold text-[16px] mt-0.5">Light, dark &amp; transparent variants</div>
            </div>
          </div>

          {logoError && (
            <div className="mb-4 text-[12.5px] text-rose-600 bg-rose-50 px-3 py-2 rounded-xl border border-rose-100">{logoError}</div>
          )}

          <div className="grid grid-cols-3 gap-3">
            {([
              { key: 'light' as const, label: 'LIGHT · PNG', bg: 'bg-white border border-border', textColor: 'text-[#0F1F18]', checker: false },
              { key: 'dark' as const, label: 'DARK · PNG', bg: 'bg-[#0F1F18]', textColor: 'text-white', checker: false },
              { key: 'transparent' as const, label: 'TRANSPARENT · SVG', bg: '', textColor: 'text-[#0F1F18]', checker: true },
            ]).map(({ key, label, bg, textColor, checker }) => (
              <div key={key}>
                <input
                  ref={variantRefs[key]}
                  type="file"
                  accept="image/png,image/svg+xml,image/jpeg"
                  className="hidden"
                  onChange={e => { const f = e.target.files?.[0]; if (f) handleLogoUpload(key, f); e.target.value = ''; }}
                />
                <button
                  onClick={() => variantRefs[key].current?.click()}
                  disabled={logoUploading === key}
                  className={`w-full rounded-xl aspect-[4/3] flex flex-col items-center justify-center p-4 relative overflow-hidden transition group border-2 border-dashed border-transparent hover:border-primary/40 ${bg}`}
                  style={checker ? {
                    backgroundImage: 'linear-gradient(45deg,#E5E0D4 25%,transparent 25%,transparent 75%,#E5E0D4 75%),linear-gradient(45deg,#E5E0D4 25%,#f8f8fa 25%,#f8f8fa 75%,#E5E0D4 75%)',
                    backgroundSize: '14px 14px', backgroundPosition: '0 0, 7px 7px',
                    border: '1px solid #E5E0D4',
                  } : undefined}
                >
                  {logoUploading === key ? (
                    <svg className="animate-spin text-primary" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 12a9 9 0 1 1-9-9" strokeLinecap="round"/></svg>
                  ) : logos[key] ? (
                    <>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={logos[key]} alt={`${key} logo`} className="max-h-16 max-w-full object-contain" />
                      <div className={`absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition flex items-center justify-center`}>
                        <span className="text-white text-[12px] font-semibold">Replace</span>
                      </div>
                    </>
                  ) : (
                    <div className="text-center">
                      <div className="h-10 w-10 rounded-xl mx-auto mb-2 grid place-items-center text-white text-[13px] font-display font-bold opacity-40 bg-primary">C</div>
                      <div className={`font-display font-bold text-[15px] opacity-30 ${textColor}`}>cardly.</div>
                      <div className={`mt-2 text-[11px] ${textColor} opacity-40`}>Click to upload</div>
                    </div>
                  )}
                </button>
                <div className="mt-1.5 text-[10px] font-mono text-[#0F1F18]/40 text-center">{label}</div>
              </div>
            ))}
          </div>
          <p className="mt-4 text-[12px] text-[#0F1F18]/40">PNG, SVG or JPG — up to 5 MB each. Click any variant to upload.</p>
        </section>

        {/* COLORS */}
        <section className="bg-white rounded-2xl border border-border p-6 shadow-soft">
          <div className="flex items-center justify-between mb-6">
            <div>
              <div className="text-[11px] font-mono tracking-widest text-[#0F1F18]/45">COLORS</div>
              <div className="font-display font-semibold text-[16px] mt-0.5">Brand palette</div>
            </div>
          </div>

          {/* Primary + Secondary pickers */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            {[
              { label: 'PRIMARY', value: primaryColor, onChange: setPrimaryColor, desc: 'Main brand color' },
              { label: 'SECONDARY', value: secondaryColor, onChange: setSecondaryColor, desc: 'Accent / gradient end' },
            ].map(({ label, value, onChange, desc }) => (
              <div key={label}>
                <div className="text-[11px] font-mono text-[#0F1F18]/45 mb-2">{label}</div>
                <label className="flex items-center gap-3 p-3 rounded-xl border border-border hover:border-primary/40 transition cursor-pointer">
                  <div className="relative">
                    <div className="h-10 w-10 rounded-lg border border-border" style={{ background: value }} />
                    <input
                      type="color"
                      value={value}
                      onChange={e => onChange(e.target.value)}
                      className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                    />
                  </div>
                  <div>
                    <div className="font-mono text-[13px] font-semibold">{value.toUpperCase()}</div>
                    <div className="text-[11px] text-[#0F1F18]/45">{desc}</div>
                  </div>
                </label>
              </div>
            ))}
          </div>

          {/* Live gradient preview */}
          <div
            className="rounded-2xl h-20 mb-6 relative overflow-hidden flex items-center px-6"
            style={{ background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})` }}
          >
            <span className="text-white font-display font-bold text-[20px] opacity-90 tracking-tight">Your brand gradient</span>
            <div className="ml-auto flex items-center gap-2">
              <span className="text-[11px] font-mono text-white/70 bg-white/15 px-2.5 py-1 rounded-lg">{primaryColor.toUpperCase()}</span>
              <ArrowRight size={12} strokeWidth={2.2} color="white" style={{ opacity: 0.6 }} />
              <span className="text-[11px] font-mono text-white/70 bg-white/15 px-2.5 py-1 rounded-lg">{secondaryColor.toUpperCase()}</span>
            </div>
          </div>

          {/* Preset swatches — click to copy hex */}
          <div className="text-[11px] font-mono text-[#0F1F18]/40 mb-3">PRESET SWATCHES — click to copy</div>
          <div className="grid grid-cols-4 sm:grid-cols-8 gap-3">
            {PRESET_SWATCHES.map((swatch) => (
              <button
                key={swatch.hex}
                onClick={() => copyHex(swatch.hex)}
                className="group relative"
                title={`${swatch.name} · ${swatch.hex}`}
              >
                <div
                  className="aspect-square rounded-xl border-2 border-white hover:scale-110 transition-transform"
                  style={{ background: swatch.hex, boxShadow: '0 2px 8px rgba(0,0,0,0.12)' }}
                />
                {copiedHex === swatch.hex && (
                  <div className="absolute inset-0 rounded-xl flex items-center justify-center bg-black/60">
                    <Check size={12} strokeWidth={2.8} color="white" />
                  </div>
                )}
                <div className="mt-1.5 text-[9px] font-mono text-[#0F1F18]/45 text-center truncate">{swatch.hex}</div>
              </button>
            ))}
          </div>
        </section>

        {/* TYPOGRAPHY */}
        <section className="bg-white rounded-2xl border border-border p-6 shadow-soft">
          <div className="flex items-center justify-between mb-6">
            <div>
              <div className="text-[11px] font-mono tracking-widest text-[#0F1F18]/45">TYPOGRAPHY</div>
              <div className="font-display font-semibold text-[16px] mt-0.5">Display &amp; body pair</div>
            </div>
            <div className="text-[12px] text-[#0F1F18]/45 font-mono">
              {TYPE_PAIRS[selectedPair].display} / {TYPE_PAIRS[selectedPair].body}
            </div>
          </div>

          <div className="flex items-center gap-2 mb-6 flex-wrap">
            {TYPE_PAIRS.map((pair, i) => (
              <button
                key={i}
                onClick={() => setSelectedPair(i)}
                className={`h-8 px-3.5 rounded-lg text-[12px] font-medium transition ${
                  selectedPair === i ? 'bg-[#0F1F18] text-white' : 'bg-white border border-border text-[#0F1F18]/65 hover:bg-cream'
                }`}
              >
                {pair.label}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="rounded-xl border border-border p-5">
              <div className="text-[10px] font-mono text-[#0F1F18]/40 mb-3 uppercase tracking-widest">
                Display · {TYPE_PAIRS[selectedPair].display}
              </div>
              <div
                className="font-bold leading-[0.95] text-[40px]"
                style={{ letterSpacing: '-0.03em', fontFamily: `"${TYPE_PAIRS[selectedPair].display}", sans-serif` }}
              >
                Africa is shipping.
              </div>
              <div className="mt-3 flex gap-2">
                {['800', '700', '600', '500'].map(w => (
                  <span key={w} className="text-[10px] font-mono text-[#0F1F18]/45 px-2 py-0.5 rounded bg-cream border border-border">{w}</span>
                ))}
              </div>
            </div>

            <div className="rounded-xl border border-border p-5">
              <div className="text-[10px] font-mono text-[#0F1F18]/40 mb-3 uppercase tracking-widest">
                Body · {TYPE_PAIRS[selectedPair].body}
              </div>
              <p className="text-[15px] leading-relaxed text-[#0F1F18]/80" style={{ fontFamily: `"${TYPE_PAIRS[selectedPair].body}", sans-serif` }}>
                A continent&apos;s worth of builders, designers, and operators are converging on Cape Town this November. Be there.
              </p>
              <div className="mt-3 flex gap-2">
                {['400', '500', '600'].map(w => (
                  <span key={w} className="text-[10px] font-mono text-[#0F1F18]/45 px-2 py-0.5 rounded bg-cream border border-border">{w}</span>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* DOMAIN + CARD DEFAULTS */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

          {/* Custom domain */}
          <section className="bg-white rounded-2xl border border-border p-6 shadow-soft">
            <div className="flex items-center justify-between mb-1">
              <div className="text-[11px] font-mono tracking-widest text-[#0F1F18]/45">CUSTOM DOMAIN</div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full text-primary bg-primary/10">PRO</span>
            </div>
            <div className="font-display font-semibold text-[16px] mt-0.5 mb-4">Where your cards live</div>
            <div className="flex items-center gap-2 p-3 rounded-xl border border-border bg-cream mb-3">
              <span className="text-[13px] font-mono text-[#0F1F18]/40 shrink-0">cards.</span>
              <input
                type="text"
                placeholder="yourcompany.com"
                disabled
                className="flex-1 bg-transparent text-[13px] font-mono text-[#0F1F18]/50 outline-none placeholder-[#0F1F18]/30 cursor-not-allowed"
              />
            </div>
            <p className="text-[12.5px] text-[#0F1F18]/50 mb-4">
              Instead of <span className="font-mono text-[#0F1F18]/70">cardly.app/c/slug</span>, attendees visit <span className="font-mono text-[#0F1F18]/70">cards.yourbrand.com/slug</span>.
            </p>
            <Link
              href="/pricing"
              className="inline-flex items-center gap-1.5 text-[12.5px] font-semibold text-white px-4 py-2 rounded-xl bg-primary hover:opacity-95 transition"
            >
              Upgrade to unlock
              <ArrowRight size={12} strokeWidth={2.2} />
            </Link>
          </section>

          {/* Card footer text */}
          <section className="bg-white rounded-2xl border border-border p-6 shadow-soft">
            <div className="text-[11px] font-mono tracking-widest text-[#0F1F18]/45 mb-1">CARD FOOTER</div>
            <div className="font-display font-semibold text-[16px] mt-0.5 mb-4">Default watermark text</div>
            <label className="block">
              <div className="text-[11.5px] text-[#0F1F18]/55 mb-1.5">Footer text shown on all cards</div>
              <input
                type="text"
                value={footerText}
                onChange={e => setFooterText(e.target.value)}
                maxLength={60}
                className="w-full h-10 px-3 rounded-xl border border-border text-[13.5px] bg-cream focus:bg-white focus:border-primary/40 focus:ring-2 focus:ring-primary/10 outline-none transition"
              />
            </label>
            {/* Live preview */}
            <div className="mt-3 rounded-xl overflow-hidden">
              <div className="h-24 rounded-t-xl" style={{ background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})` }} />
              <div className="py-2 px-3 bg-cream border border-t-0 border-border rounded-b-xl flex items-center justify-center">
                <span className="text-[11px] font-mono text-[#0F1F18]/40">{footerText || 'Made with Cardly'}</span>
              </div>
            </div>
            <p className="mt-3 text-[11.5px] text-[#0F1F18]/45">
              Remove branding on the <Link href="/pricing" className="text-primary hover:underline">Pro plan</Link>.
            </p>
          </section>

        </div>
      </div>
    </div>
  );
}
