'use client';

import { useState } from 'react';

const PRESET_COLORS = [
  { name: 'Cardly Purple', hex: '#6c63ff' },
  { name: 'Cardly Pink', hex: '#f8a4d8' },
  { name: 'Ink', hex: '#0f0f1a' },
  { name: 'Gold', hex: '#ffd28a' },
  { name: 'Teal', hex: '#7be0c0' },
  { name: 'Coral', hex: '#ff6058' },
];

const PRESET_FONTS = [
  { name: 'DM Sans', sample: 'Aa', desc: 'Modern display' },
  { name: 'Inter', sample: 'Aa', desc: 'Clean body text' },
  { name: 'Space Grotesk', sample: 'Aa', desc: 'Technical feel' },
  { name: 'Playfair Display', sample: 'Aa', desc: 'Elegant serif' },
  { name: 'JetBrains Mono', sample: 'Aa', desc: 'Code & labels' },
];

export default function BrandKitPage() {
  const [primaryColor, setPrimaryColor] = useState('#6c63ff');
  const [secondaryColor, setSecondaryColor] = useState('#f8a4d8');
  const [font, setFont] = useState('DM Sans');
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="px-8 py-8 max-w-[900px]">
      {/* Header */}
      <div className="flex items-end justify-between flex-wrap gap-4 mb-8">
        <div>
          <div className="flex items-center gap-2 text-[12px] font-mono text-[#0f0f1a]/40">
            <span>WORKSPACE</span><span>/</span><span className="text-[#0f0f1a]/70">Brand Kit</span>
          </div>
          <h1 className="mt-2 font-display font-bold text-[34px] leading-tight">Brand Kit</h1>
          <p className="text-[#0f0f1a]/60 mt-1 text-[14.5px]">Set your default colors and typography. Applied across all new events.</p>
        </div>
        <button
          onClick={handleSave}
          className="inline-flex items-center gap-2 text-[13.5px] font-semibold text-white px-4 py-2.5 rounded-xl hover:opacity-95 transition"
          style={{ background: 'linear-gradient(135deg,#6c63ff,#f8a4d8)' }}
        >
          {saved ? (
            <>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
              Saved
            </>
          ) : 'Save changes'}
        </button>
      </div>

      <div className="space-y-6">
        {/* Brand Colors */}
        <div className="bg-white rounded-2xl border border-[#e5e5ea] p-6 shadow-soft">
          <div className="text-[11px] font-mono tracking-widest text-[#0f0f1a]/45 mb-5">BRAND COLORS</div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5">
            {/* Primary */}
            <div>
              <label className="block text-[12px] text-[#0f0f1a]/60 mb-2">Primary color</label>
              <div className="flex items-center gap-3">
                <div className="relative">
                  <input type="color" value={primaryColor} onChange={e => setPrimaryColor(e.target.value)} className="absolute inset-0 opacity-0 w-12 h-12 cursor-pointer" />
                  <div className="h-12 w-12 rounded-xl border border-[#e5e5ea] shadow-soft" style={{ background: primaryColor }} />
                </div>
                <div className="flex-1">
                  <input
                    type="text"
                    value={primaryColor}
                    onChange={e => setPrimaryColor(e.target.value)}
                    className="w-full h-10 px-3 rounded-xl border border-[#e5e5ea] font-mono text-[13px] bg-[#fafafa] focus:bg-white focus:border-[#6c63ff] outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Secondary */}
            <div>
              <label className="block text-[12px] text-[#0f0f1a]/60 mb-2">Secondary color</label>
              <div className="flex items-center gap-3">
                <div className="relative">
                  <input type="color" value={secondaryColor} onChange={e => setSecondaryColor(e.target.value)} className="absolute inset-0 opacity-0 w-12 h-12 cursor-pointer" />
                  <div className="h-12 w-12 rounded-xl border border-[#e5e5ea] shadow-soft" style={{ background: secondaryColor }} />
                </div>
                <div className="flex-1">
                  <input
                    type="text"
                    value={secondaryColor}
                    onChange={e => setSecondaryColor(e.target.value)}
                    className="w-full h-10 px-3 rounded-xl border border-[#e5e5ea] font-mono text-[13px] bg-[#fafafa] focus:bg-white focus:border-[#6c63ff] outline-none"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Presets */}
          <div className="text-[11px] text-[#0f0f1a]/50 mb-2">Presets</div>
          <div className="flex gap-2 flex-wrap">
            {PRESET_COLORS.map(c => (
              <button
                key={c.hex}
                onClick={() => setPrimaryColor(c.hex)}
                title={c.name}
                className="group relative h-9 w-9 rounded-xl border-2 transition"
                style={{ background: c.hex, borderColor: primaryColor === c.hex ? '#6c63ff' : 'transparent' }}
              >
                {primaryColor === c.hex && (
                  <span className="absolute inset-0 flex items-center justify-center">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Gradient preview */}
          <div className="mt-5">
            <div className="text-[11px] text-[#0f0f1a]/50 mb-2">Gradient preview</div>
            <div className="h-12 rounded-xl" style={{ background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})` }} />
          </div>
        </div>

        {/* Typography */}
        <div className="bg-white rounded-2xl border border-[#e5e5ea] p-6 shadow-soft">
          <div className="text-[11px] font-mono tracking-widest text-[#0f0f1a]/45 mb-5">TYPOGRAPHY</div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {PRESET_FONTS.map(f => (
              <button
                key={f.name}
                onClick={() => setFont(f.name)}
                className={`flex items-center gap-3 p-3 rounded-xl border-2 text-left transition ${font === f.name ? 'border-[#6c63ff] bg-[#6c63ff]/5' : 'border-[#e5e5ea] hover:border-[#6c63ff]/30'}`}
              >
                <span
                  className="h-10 w-10 rounded-lg grid place-items-center text-[#0f0f1a] text-[20px] font-semibold shrink-0 bg-[#fafafa]"
                  style={{ fontFamily: f.name }}
                >
                  {f.sample}
                </span>
                <div>
                  <div className="text-[13px] font-medium">{f.name}</div>
                  <div className="text-[11px] text-[#0f0f1a]/45">{f.desc}</div>
                </div>
                {font === f.name && (
                  <svg className="ml-auto text-[#6c63ff]" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Logo */}
        <div className="bg-white rounded-2xl border border-[#e5e5ea] p-6 shadow-soft">
          <div className="text-[11px] font-mono tracking-widest text-[#0f0f1a]/45 mb-5">WORKSPACE LOGO</div>
          <div className="flex items-center gap-5">
            <div className="h-16 w-16 rounded-2xl border-2 border-dashed border-[#e5e5ea] flex items-center justify-center text-[#0f0f1a]/30">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
            </div>
            <div>
              <div className="text-[13.5px] font-medium mb-1">Upload workspace logo</div>
              <div className="text-[12px] text-[#0f0f1a]/50 mb-3">PNG or SVG, min 200×200 px. Used in the footer of all cards.</div>
              <button className="text-[13px] font-medium text-[#6c63ff] border border-[#6c63ff]/30 px-4 py-1.5 rounded-lg hover:bg-[#6c63ff]/5 transition">
                Upload logo
              </button>
            </div>
          </div>
        </div>

        {/* Custom domain */}
        <div className="bg-white rounded-2xl border border-[#e5e5ea] p-6 shadow-soft">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="text-[11px] font-mono tracking-widest text-[#0f0f1a]/45 mb-1">CUSTOM DOMAIN</div>
              <div className="text-[13.5px] font-medium mt-3 mb-1">Share with your own domain</div>
              <div className="text-[12.5px] text-[#0f0f1a]/55 mb-4">Replace <span className="font-mono bg-[#fafafa] px-1.5 py-0.5 rounded text-[11px]">cardly.app/c/</span> with your custom subdomain.</div>
              <div className="flex items-center gap-2">
                <div className="flex-1 h-10 rounded-xl border border-[#e5e5ea] bg-[#fafafa] px-3 flex items-center text-[12px] font-mono text-[#0f0f1a]/40">
                  cards.yourcompany.com
                </div>
                <button className="h-10 px-4 rounded-xl text-[13px] font-medium text-[#0f0f1a]/50 border border-[#e5e5ea] bg-white cursor-not-allowed">
                  Configure
                </button>
              </div>
            </div>
            <div className="shrink-0 px-3 py-1.5 rounded-full text-[11px] font-mono text-[#6c63ff] bg-[#6c63ff]/10">
              PRO
            </div>
          </div>
        </div>

        {/* Footer text */}
        <div className="bg-white rounded-2xl border border-[#e5e5ea] p-6 shadow-soft">
          <div className="text-[11px] font-mono tracking-widest text-[#0f0f1a]/45 mb-3">CARD FOOTER</div>
          <div className="text-[12.5px] text-[#0f0f1a]/55 mb-3">Text shown at the bottom of every attendee card (free plan shows &ldquo;Made with Cardly&rdquo;).</div>
          <input
            type="text"
            defaultValue="Made with Cardly"
            disabled
            className="w-full h-10 px-3 rounded-xl border border-[#e5e5ea] bg-[#fafafa] text-[13px] font-mono text-[#0f0f1a]/40 cursor-not-allowed"
          />
          <div className="mt-2 text-[11px] text-[#0f0f1a]/40">Custom footer text available on Studio plan.</div>
        </div>
      </div>
    </div>
  );
}
