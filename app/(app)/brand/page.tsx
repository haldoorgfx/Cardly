'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Check } from 'lucide-react';

const BRAND_COLORS = [
  { name: 'Forest', hex: '#1F403A' },
  { name: 'Deep',   hex: '#163828' },
  { name: 'Sage',   hex: '#2A6A50' },
  { name: 'Gold',   hex: '#E8C57E' },
  { name: 'Cream',  hex: '#FAF6EE' },
  { name: 'Ink',    hex: '#0F1F18' },
];

type Logos = { light?: string; dark?: string };

export default function BrandKitPage() {
  const [loading, setLoading] = useState(true);
  const [logos, setLogos] = useState<Logos>({});
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [logoUploading, setLogoUploading] = useState<string | null>(null);

  const lightRef = useRef<HTMLInputElement>(null);
  const darkRef  = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch('/api/brand')
      .then(r => r.json())
      .then(data => { if (data.logos) setLogos(data.logos); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    setSaving(true);
    await fetch('/api/brand', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    }).catch(() => {});
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const handleLogoUpload = useCallback(async (variant: string, file: File) => {
    setLogoUploading(variant);
    const fd = new FormData();
    fd.append('file', file);
    fd.append('variant', variant);
    try {
      const res = await fetch('/api/brand/logo', { method: 'POST', body: fd });
      const data = await res.json();
      if (res.ok) setLogos(prev => ({ ...prev, [variant]: data.url }));
    } catch { /* ignore */ }
    setLogoUploading(null);
  }, []);

  if (loading) {
    return (
      <div className="px-4 sm:px-6 lg:px-8 py-8">
        <div className="animate-pulse space-y-4">
          <div className="h-10 bg-[#F0EDE8] rounded-xl w-40" />
          <div className="h-64 bg-[#F0EDE8] rounded-2xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 mb-8">
        <div>
          <h1 className="font-display font-bold text-[32px] leading-tight text-[#0F1F18]">Brand Kit</h1>
          <p className="text-[14px] text-[#6B7A72] mt-1">Applied to event pages and Eventera Cards</p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="inline-flex items-center gap-2 h-9 px-5 rounded-xl text-[13.5px] font-semibold text-white bg-primary hover:opacity-95 disabled:opacity-60 transition shrink-0 mt-1"
        >
          <Check size={13} strokeWidth={2.5} />
          {saved ? 'Saved' : saving ? 'Saving…' : 'Save brand kit'}
        </button>
      </div>

      {/* Two-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_300px] xl:grid-cols-[minmax(0,1fr)_340px] gap-5">

        {/* Left column */}
        <div className="space-y-5">

          {/* Logo */}
          <section className="bg-white rounded-2xl border border-border p-6 shadow-soft">
            <h2 className="font-semibold text-[15px] text-[#0F1F18] mb-5">Logo</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Primary logo — light bg */}
              <div>
                <input
                  ref={lightRef}
                  type="file"
                  accept="image/png,image/svg+xml,image/jpeg"
                  className="hidden"
                  onChange={e => {
                    const f = e.target.files?.[0];
                    if (f) handleLogoUpload('light', f);
                    e.target.value = '';
                  }}
                />
                <button
                  onClick={() => lightRef.current?.click()}
                  disabled={logoUploading === 'light'}
                  className="w-full rounded-xl aspect-[4/3] border border-border bg-white flex flex-col items-center justify-center gap-2 hover:border-primary/40 transition group relative overflow-hidden"
                >
                  {logoUploading === 'light' ? (
                    <svg className="animate-spin text-primary" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <path d="M21 12a9 9 0 1 1-9-9" strokeLinecap="round"/>
                    </svg>
                  ) : logos.light ? (
                    <>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={logos.light} alt="Primary logo" className="max-h-16 max-w-full object-contain" />
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
                        <span className="text-white text-[12px] font-semibold">Replace</span>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="h-8 w-8 rounded-lg bg-[#E8EFEB] grid place-items-center">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#1F4D3A" strokeWidth="2" strokeLinecap="round">
                          <rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M9 21V9"/>
                        </svg>
                      </div>
                      <span className="text-[12px] text-[#6B7A72]">Primary logo</span>
                    </>
                  )}
                </button>
              </div>

              {/* Logo on dark bg */}
              <div>
                <input
                  ref={darkRef}
                  type="file"
                  accept="image/png,image/svg+xml,image/jpeg"
                  className="hidden"
                  onChange={e => {
                    const f = e.target.files?.[0];
                    if (f) handleLogoUpload('dark', f);
                    e.target.value = '';
                  }}
                />
                <button
                  onClick={() => darkRef.current?.click()}
                  disabled={logoUploading === 'dark'}
                  className="w-full rounded-xl aspect-[4/3] flex flex-col items-center justify-center gap-2 hover:opacity-90 transition group relative overflow-hidden"
                  style={{ background: '#1F4D3A' }}
                >
                  {logoUploading === 'dark' ? (
                    <svg className="animate-spin text-white" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <path d="M21 12a9 9 0 1 1-9-9" strokeLinecap="round"/>
                    </svg>
                  ) : logos.dark ? (
                    <>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={logos.dark} alt="Logo on dark" className="max-h-16 max-w-full object-contain" />
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
                        <span className="text-white text-[12px] font-semibold">Replace</span>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="h-8 w-8 rounded-lg grid place-items-center" style={{ background: 'rgba(250,246,238,0.15)' }}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="rgba(250,246,238,0.7)" strokeWidth="2" strokeLinecap="round">
                          <rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M9 21V9"/>
                        </svg>
                      </div>
                      <span className="text-[12px]" style={{ color: 'rgba(250,246,238,0.6)' }}>Logo on dark</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </section>

          {/* Colors */}
          <section className="bg-white rounded-2xl border border-border p-6 shadow-soft">
            <h2 className="font-semibold text-[15px] text-[#0F1F18] mb-5">Colors</h2>
            <div className="grid grid-cols-2 gap-3">
              {BRAND_COLORS.map(color => (
                <div key={color.hex} className="flex items-center gap-2.5">
                  <div
                    className="h-9 w-9 rounded-lg shrink-0 border"
                    style={{
                      background: color.hex,
                      borderColor: color.hex === '#FAF6EE' ? '#E5E0D4' : 'transparent',
                    }}
                  />
                  <div className="min-w-0">
                    <div className="text-[12.5px] font-medium text-[#0F1F18] leading-tight">{color.name}</div>
                    <div className="text-[10.5px] text-[#6B7A72] truncate">{color.hex}</div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Typography */}
          <section className="bg-white rounded-2xl border border-border p-6 shadow-soft">
            <h2 className="font-semibold text-[15px] text-[#0F1F18] mb-5">Typography</h2>
            <div className="divide-y divide-border">
              <div className="flex items-center justify-between py-4">
                <div>
                  <div className="font-display font-bold text-[24px] text-[#0F1F18] leading-none">DM Sans</div>
                  <div className="text-[12px] text-[#6B7A72] mt-1">Display · headings</div>
                </div>
                <span
                  className="h-7 px-3 rounded-full text-[12px] font-medium grid place-items-center"
                  style={{ background: '#F0EDE8', color: '#3A4A42', border: '1px solid #E5E0D4' }}
                >
                  Heading
                </span>
              </div>
              <div className="flex items-center justify-between py-4">
                <div>
                  <div className="font-sans text-[20px] text-[#0F1F18] leading-none">Inter</div>
                  <div className="text-[12px] text-[#6B7A72] mt-1">Body · UI</div>
                </div>
                <span
                  className="h-7 px-3 rounded-full text-[12px] font-medium grid place-items-center"
                  style={{ background: '#F0EDE8', color: '#3A4A42', border: '1px solid #E5E0D4' }}
                >
                  Body
                </span>
              </div>
            </div>
          </section>
        </div>

        {/* Right column — Card preview */}
        <div className="bg-white rounded-2xl border border-border p-6 shadow-soft flex flex-col">
          <h2 className="font-semibold text-[15px] text-[#0F1F18] mb-5">Card preview</h2>

          {/* Karta card mockup */}
          <div className="flex-1 flex flex-col items-center justify-center">
            <div
              className="w-full max-w-[220px] rounded-2xl overflow-hidden shadow-lift"
              style={{ background: 'linear-gradient(145deg, #163828 0%, #1F4D3A 60%, #2A5A44 100%)' }}
            >
              {/* Card top */}
              <div className="px-5 pt-5 pb-4">
                <div className="flex items-center justify-between mb-6">
                  <div
                    className="text-[9px] tracking-widest uppercase"
                    style={{ color: 'rgba(232,197,126,0.8)' }}
                  >
                    AFRICA TECH FEST
                  </div>
                  <div
                    className="h-4 w-4 rounded-sm"
                    style={{ background: 'rgba(232,197,126,0.35)' }}
                  />
                </div>

                <div
                  className="text-[8px] tracking-widest uppercase mb-3"
                  style={{ color: 'rgba(250,246,238,0.45)' }}
                >
                  I&apos;M SPEAKING AT
                </div>

                {/* Avatar */}
                <div
                  className="h-10 w-10 rounded-full grid place-items-center text-[13px] font-bold mb-3"
                  style={{ background: '#E8C57E', color: '#163828' }}
                >
                  KM
                </div>

                {/* Name */}
                <div className="font-display font-bold text-[18px] text-white leading-tight mb-1">
                  Kwame Mensah
                </div>
                <div
                  className="text-[10px]"
                  style={{ color: 'rgba(250,246,238,0.6)' }}
                >
                  Product Engineer · Paystack
                </div>
              </div>

              {/* Card footer */}
              <div
                className="px-5 py-3 flex items-center justify-between"
                style={{ background: 'rgba(0,0,0,0.2)' }}
              >
                <div
                  className="text-[9px] tracking-widest uppercase"
                  style={{ color: 'rgba(250,246,238,0.45)' }}
                >
                  12 MAR · LAGOS
                </div>
              </div>
            </div>

            <p className="text-[12px] text-[#6B7A72] text-center mt-5 leading-relaxed">
              Your brand kit is automatically applied to every attendee&apos;s Eventera Card.
            </p>
          </div>
        </div>

      </div>
    </div>
  );
}
