'use client';

import { useState } from 'react';
import Link from 'next/link';

const PRESET_SWATCHES = [
  { name: 'Cardly Purple', hex: '#6c63ff' },
  { name: 'Cardly Pink', hex: '#f8a4d8' },
  { name: 'Ink', hex: '#0f0f1a' },
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

export default function BrandKitPage() {
  const [primaryColor, setPrimaryColor] = useState('#6c63ff');
  const [secondaryColor, setSecondaryColor] = useState('#f8a4d8');
  const [selectedPair, setSelectedPair] = useState(0);
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [customColors, setCustomColors] = useState<{ name: string; hex: string }[]>([]);
  const [editingName, setEditingName] = useState<string | null>(null);

  const allSwatches = [...PRESET_SWATCHES, ...customColors];

  const handleSave = async () => {
    setSaving(true);
    await new Promise(r => setTimeout(r, 600));
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const addColor = () => {
    setCustomColors(prev => [...prev, { name: 'Custom color', hex: '#' + Math.floor(Math.random() * 0xffffff).toString(16).padStart(6, '0') }]);
  };

  return (
    <div className="px-8 py-8 max-w-[1100px]">
      {/* Header */}
      <div className="flex items-end justify-between flex-wrap gap-4 mb-10">
        <div>
          <div className="flex items-center gap-2 text-[12px] font-mono text-[#0f0f1a]/40">
            <span>WORKSPACE</span><span>/</span><span className="text-[#0f0f1a]/70">Brand Kit</span>
          </div>
          <h1 className="mt-2 font-display font-bold text-[34px] leading-tight">Brand Kit</h1>
          <p className="text-[#0f0f1a]/60 mt-1 text-[14.5px] max-w-[540px]">
            One source of truth for every event. Updates here propagate to all new events.
          </p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="inline-flex items-center gap-2 text-[13.5px] font-semibold text-white px-5 py-2.5 rounded-xl hover:opacity-95 disabled:opacity-70 transition"
          style={{ background: 'linear-gradient(135deg,#6c63ff,#f8a4d8)' }}
        >
          {saved ? (
            <>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
              Saved
            </>
          ) : saving ? 'Saving…' : 'Save changes'}
        </button>
      </div>

      <div className="space-y-6">

        {/* LOGO */}
        <section className="bg-white rounded-2xl border border-[#e5e5ea] p-6 shadow-soft">
          <div className="flex items-center justify-between mb-6">
            <div>
              <div className="text-[11px] font-mono tracking-widest text-[#0f0f1a]/45">LOGO</div>
              <div className="font-display font-semibold text-[16px] mt-0.5">Light & dark variants</div>
            </div>
            <button className="text-[12.5px] font-medium text-[#6c63ff] hover:underline">Upload new +</button>
          </div>

          <div className="grid grid-cols-3 gap-3">
            {/* Light variant */}
            <div>
              <div className="rounded-xl bg-white border border-[#e5e5ea] aspect-[4/3] flex items-center justify-center p-5 hover:border-[#6c63ff]/30 transition cursor-pointer group">
                <div className="text-center">
                  <div className="h-10 w-10 rounded-xl mx-auto mb-2 grid place-items-center text-white text-[13px] font-display font-bold" style={{ background: 'linear-gradient(135deg,#6c63ff,#f8a4d8)' }}>C</div>
                  <div className="font-display font-bold text-[15px]">cardly.</div>
                </div>
              </div>
              <div className="mt-1.5 text-[10px] font-mono text-[#0f0f1a]/40 text-center">LIGHT · PNG</div>
            </div>

            {/* Dark variant */}
            <div>
              <div className="rounded-xl bg-[#0f0f1a] aspect-[4/3] flex items-center justify-center p-5 cursor-pointer hover:opacity-90 transition">
                <div className="text-center">
                  <div className="h-10 w-10 rounded-xl mx-auto mb-2 grid place-items-center text-white text-[13px] font-display font-bold" style={{ background: 'linear-gradient(135deg,#6c63ff,#f8a4d8)' }}>C</div>
                  <div className="font-display font-bold text-[15px] text-white">cardly.</div>
                </div>
              </div>
              <div className="mt-1.5 text-[10px] font-mono text-[#0f0f1a]/40 text-center">DARK · PNG</div>
            </div>

            {/* Transparent/checkerboard */}
            <div>
              <div
                className="rounded-xl aspect-[4/3] flex items-center justify-center p-5 cursor-pointer hover:opacity-90 transition border border-[#e5e5ea]"
                style={{
                  backgroundImage: 'linear-gradient(45deg,#e5e5ea 25%,transparent 25%,transparent 75%,#e5e5ea 75%),linear-gradient(45deg,#e5e5ea 25%,#f8f8fa 25%,#f8f8fa 75%,#e5e5ea 75%)',
                  backgroundSize: '14px 14px',
                  backgroundPosition: '0 0, 7px 7px',
                }}
              >
                <div className="text-center">
                  <div className="h-10 w-10 rounded-xl mx-auto mb-2 grid place-items-center text-white text-[13px] font-display font-bold" style={{ background: 'linear-gradient(135deg,#6c63ff,#f8a4d8)' }}>C</div>
                  <div className="font-display font-bold text-[15px]">cardly.</div>
                </div>
              </div>
              <div className="mt-1.5 text-[10px] font-mono text-[#0f0f1a]/40 text-center">TRANSPARENT · SVG</div>
            </div>
          </div>

          <div className="mt-5 flex items-center gap-2 p-3 rounded-xl bg-[#fafafa] border border-dashed border-[#e5e5ea] hover:border-[#6c63ff]/30 transition cursor-pointer">
            <div className="h-10 w-10 rounded-xl bg-white border border-[#e5e5ea] grid place-items-center text-[#0f0f1a]/40 shrink-0">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>
              </svg>
            </div>
            <div>
              <div className="text-[13px] font-medium">Upload logo files</div>
              <div className="text-[11.5px] text-[#0f0f1a]/45">PNG, SVG or AI — up to 5MB each</div>
            </div>
          </div>
        </section>

        {/* COLORS */}
        <section className="bg-white rounded-2xl border border-[#e5e5ea] p-6 shadow-soft">
          <div className="flex items-center justify-between mb-6">
            <div>
              <div className="text-[11px] font-mono tracking-widest text-[#0f0f1a]/45">COLORS</div>
              <div className="font-display font-semibold text-[16px] mt-0.5">
                Brand palette · {allSwatches.length} colors
              </div>
            </div>
            <button onClick={addColor} className="text-[12.5px] font-medium text-[#6c63ff] hover:underline">+ Add color</button>
          </div>

          {/* Primary + Secondary */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div>
              <div className="text-[11px] font-mono text-[#0f0f1a]/45 mb-2">PRIMARY</div>
              <div className="flex items-center gap-3 p-3 rounded-xl border border-[#e5e5ea] hover:border-[#6c63ff]/30 transition">
                <input
                  type="color"
                  value={primaryColor}
                  onChange={e => setPrimaryColor(e.target.value)}
                  className="h-10 w-10 rounded-lg cursor-pointer border-0 bg-transparent p-0"
                />
                <div>
                  <div className="font-mono text-[13px] font-medium">{primaryColor.toUpperCase()}</div>
                  <div className="text-[11px] text-[#0f0f1a]/45">Primary brand color</div>
                </div>
              </div>
            </div>
            <div>
              <div className="text-[11px] font-mono text-[#0f0f1a]/45 mb-2">SECONDARY</div>
              <div className="flex items-center gap-3 p-3 rounded-xl border border-[#e5e5ea] hover:border-[#6c63ff]/30 transition">
                <input
                  type="color"
                  value={secondaryColor}
                  onChange={e => setSecondaryColor(e.target.value)}
                  className="h-10 w-10 rounded-lg cursor-pointer border-0 bg-transparent p-0"
                />
                <div>
                  <div className="font-mono text-[13px] font-medium">{secondaryColor.toUpperCase()}</div>
                  <div className="text-[11px] text-[#0f0f1a]/45">Accent / secondary color</div>
                </div>
              </div>
            </div>
          </div>

          {/* Live gradient preview */}
          <div className="rounded-xl h-16 mb-6 relative overflow-hidden" style={{ background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})` }}>
            <div className="absolute inset-0 flex items-center px-5">
              <span className="text-white font-display font-bold text-[18px] opacity-90">Your brand gradient</span>
            </div>
          </div>

          {/* Palette swatches */}
          <div className="grid grid-cols-4 sm:grid-cols-8 gap-3">
            {allSwatches.map((swatch, i) => (
              <div key={i} className="group">
                <div
                  className="aspect-square rounded-xl cursor-pointer border-2 border-white hover:scale-105 transition-transform"
                  style={{ background: swatch.hex, boxShadow: '0 2px 8px rgba(0,0,0,0.12)' }}
                  title={swatch.hex}
                />
                <div className="mt-1.5 text-[10px] font-mono text-[#0f0f1a]/45 text-center truncate">{swatch.hex}</div>
              </div>
            ))}
          </div>
        </section>

        {/* TYPOGRAPHY */}
        <section className="bg-white rounded-2xl border border-[#e5e5ea] p-6 shadow-soft">
          <div className="flex items-center justify-between mb-6">
            <div>
              <div className="text-[11px] font-mono tracking-widest text-[#0f0f1a]/45">TYPOGRAPHY</div>
              <div className="font-display font-semibold text-[16px] mt-0.5">Display &amp; body pair</div>
            </div>
          </div>

          {/* Type pair selector */}
          <div className="flex items-center gap-2 mb-6 flex-wrap">
            {TYPE_PAIRS.map((pair, i) => (
              <button
                key={i}
                onClick={() => setSelectedPair(i)}
                className={`h-8 px-3.5 rounded-lg text-[12px] font-medium transition ${selectedPair === i ? 'bg-[#0f0f1a] text-white' : 'bg-white border border-[#e5e5ea] text-[#0f0f1a]/65 hover:bg-[#fafafa]'}`}
              >
                {pair.label}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Display */}
            <div className="rounded-xl border border-[#e5e5ea] p-5">
              <div className="text-[10px] font-mono text-[#0f0f1a]/40 mb-3 uppercase tracking-widest">
                Display · {TYPE_PAIRS[selectedPair].display}
              </div>
              <div
                className="font-display font-bold leading-[0.95] text-[40px]"
                style={{ letterSpacing: '-0.03em', fontFamily: `"${TYPE_PAIRS[selectedPair].display}", sans-serif` }}
              >
                Africa is shipping.
              </div>
              <div className="mt-3 flex gap-2">
                {['800', '700', '600', '500'].map(w => (
                  <span key={w} className="text-[10px] font-mono text-[#0f0f1a]/45 px-2 py-0.5 rounded bg-[#fafafa] border border-[#e5e5ea]">{w}</span>
                ))}
              </div>
            </div>

            {/* Body */}
            <div className="rounded-xl border border-[#e5e5ea] p-5">
              <div className="text-[10px] font-mono text-[#0f0f1a]/40 mb-3 uppercase tracking-widest">
                Body · {TYPE_PAIRS[selectedPair].body}
              </div>
              <p className="text-[15px] leading-relaxed text-[#0f0f1a]/80">
                A continent&apos;s worth of builders, designers, and operators are converging on Cape Town this November. Be there.
              </p>
              <div className="mt-3 flex gap-2">
                {['400', '500', '600'].map(w => (
                  <span key={w} className="text-[10px] font-mono text-[#0f0f1a]/45 px-2 py-0.5 rounded bg-[#fafafa] border border-[#e5e5ea]">{w}</span>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* DOMAIN + CARD DEFAULTS */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

          {/* Custom domain */}
          <section className="bg-white rounded-2xl border border-[#e5e5ea] p-6 shadow-soft">
            <div className="flex items-center justify-between mb-1">
              <div className="text-[11px] font-mono tracking-widest text-[#0f0f1a]/45">CUSTOM DOMAIN</div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full text-[#6c63ff] bg-[#6c63ff]/10">PRO</span>
            </div>
            <div className="font-display font-semibold text-[16px] mt-0.5 mb-4">Where your cards live</div>
            <div className="flex items-center gap-2 p-3 rounded-xl border border-[#e5e5ea] bg-[#fafafa] mb-3">
              <span className="text-[13px] font-mono text-[#0f0f1a]/40">cards.</span>
              <input
                type="text"
                placeholder="yourcompany.com"
                disabled
                className="flex-1 bg-transparent text-[13px] font-mono text-[#0f0f1a]/50 outline-none placeholder-[#0f0f1a]/30 cursor-not-allowed"
              />
            </div>
            <p className="text-[12.5px] text-[#0f0f1a]/50 mb-4">
              Instead of <span className="font-mono">cardly.app/c/slug</span>, attendees visit <span className="font-mono">cards.yourbrand.com/slug</span>.
            </p>
            <Link
              href="/pricing"
              className="inline-flex items-center gap-1.5 text-[12.5px] font-semibold text-white px-4 py-2 rounded-xl hover:opacity-95 transition"
              style={{ background: 'linear-gradient(135deg,#6c63ff,#f8a4d8)' }}
            >
              Upgrade to unlock →
            </Link>
          </section>

          {/* Card footer text */}
          <section className="bg-white rounded-2xl border border-[#e5e5ea] p-6 shadow-soft">
            <div className="text-[11px] font-mono tracking-widest text-[#0f0f1a]/45 mb-1">CARD FOOTER</div>
            <div className="font-display font-semibold text-[16px] mt-0.5 mb-4">Default watermark text</div>
            <label className="block">
              <div className="text-[11.5px] text-[#0f0f1a]/55 mb-1.5">Footer text (all events)</div>
              <input
                type="text"
                defaultValue="Made with Cardly"
                className="w-full h-10 px-3 rounded-xl border border-[#e5e5ea] text-[13.5px] bg-[#fafafa] focus:bg-white focus:border-[#6c63ff]/40 focus:ring-2 focus:ring-[#6c63ff]/10 outline-none transition"
              />
            </label>
            <div className="mt-3 flex items-center gap-2">
              <div className="h-8 flex-1 rounded-lg flex items-center justify-center text-white/70 text-[11px] font-mono" style={{ background: 'linear-gradient(135deg,#6c63ff,#f8a4d8)' }}>
                PREVIEW OF FOOTER TEXT
              </div>
            </div>
            <p className="mt-3 text-[11.5px] text-[#0f0f1a]/45">
              Remove branding entirely on the <Link href="/pricing" className="text-[#6c63ff]">Pro plan</Link>.
            </p>
          </section>
        </div>

      </div>
    </div>
  );
}
