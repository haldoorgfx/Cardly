'use client';

import { useState, useTransition, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';

interface Sponsor {
  id: string;
  company_name: string;
  tagline: string | null;
  description: string | null;
  website_url: string | null;
  booth_location: string | null;
  logo_url: string | null;
  tier: string | null;
}

interface Props {
  sponsor: Sponsor;
  token: string;
}

function Field({ label, value, onChange, area, readOnly }: {
  label: string;
  value: string;
  onChange?: (v: string) => void;
  area?: boolean;
  readOnly?: boolean;
}) {
  return (
    <div>
      <div className=" text-[9.5px] tracking-[0.14em] uppercase mb-1.5" style={{ color: '#6B7A72' }}>{label}</div>
      {area ? (
        <textarea
          value={value}
          onChange={e => onChange?.(e.target.value)}
          rows={4}
          readOnly={readOnly}
          aria-label={label}
          className="w-full border rounded-lg px-3 py-2.5 text-[13.5px] leading-relaxed outline-none focus:ring-2 resize-none"
          style={{ background: readOnly ? 'rgba(250,246,238,0.5)' : 'white', borderColor: '#E5E0D4', color: '#0F1F18', '--tw-ring-color': 'rgba(31,77,58,0.15)' } as React.CSSProperties}
        />
      ) : (
        <input
          type="text"
          value={value}
          onChange={e => onChange?.(e.target.value)}
          readOnly={readOnly}
          aria-label={label}
          className="w-full border rounded-lg px-3 py-2.5 text-[13.5px] outline-none focus:ring-2"
          style={{ background: readOnly ? 'rgba(250,246,238,0.5)' : 'white', borderColor: '#E5E0D4', color: readOnly ? '#3A4A42' : '#0F1F18', '--tw-ring-color': 'rgba(31,77,58,0.15)' } as React.CSSProperties}
        />
      )}
    </div>
  );
}

export function BoothTab({ sponsor, token }: Props) {
  const [form, setForm] = useState({
    company_name: sponsor.company_name,
    tagline:      sponsor.tagline      ?? '',
    description:  sponsor.description  ?? '',
    website_url:  sponsor.website_url  ?? '',
  });
  const [logoUrl, setLogoUrl]         = useState(sponsor.logo_url ?? '');
  const [logoUploading, setLogoUploading] = useState(false);
  const [saved, setSaved]             = useState(false);
  const [isPending, startTransition]  = useTransition();
  const fileRef                       = useRef<HTMLInputElement>(null);

  function set(key: keyof typeof form) {
    return (v: string) => setForm(f => ({ ...f, [key]: v }));
  }

  async function handleLogoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setLogoUploading(true);
    try {
      const supabase = createClient();
      const ext  = file.name.split('.').pop() ?? 'png';
      const path = `sponsors/${sponsor.id}/logo.${ext}`;
      const { error: uploadErr } = await supabase.storage
        .from('avatars') // reuse existing public bucket
        .upload(path, file, { upsert: true, contentType: file.type });
      if (uploadErr) throw uploadErr;
      const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(path);
      const url = urlData.publicUrl + `?t=${Date.now()}`;
      // Save to DB
      await fetch('/api/exhibitor/booth', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, logo_url: url }),
      });
      setLogoUrl(url);
    } finally {
      setLogoUploading(false);
    }
  }

  function handleSave() {
    startTransition(async () => {
      await fetch('/api/exhibitor/booth', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, ...form }),
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    });
  }

  const tierLabel = sponsor.tier
    ? sponsor.tier.charAt(0).toUpperCase() + sponsor.tier.slice(1).toLowerCase()
    : null;

  return (
    <div className="grid lg:grid-cols-[1fr_300px] gap-5">
      {/* Left — editable profile */}
      <div className="grid gap-5 content-start">
        <div className="bg-white rounded-2xl border" style={{ borderColor: '#E5E0D4' }}>
          <div className="px-5 pt-4 pb-3 border-b" style={{ borderColor: 'rgba(229,224,212,0.7)' }}>
            <div className="font-display text-[14px] font-semibold tracking-tight" style={{ color: '#0F1F18' }}>Booth profile</div>
          </div>
          <div className="p-5 grid gap-4">
            <Field label="Company name" value={form.company_name} onChange={set('company_name')} />
            <Field label="Tagline"      value={form.tagline}      onChange={set('tagline')} />
            <Field label="About"        value={form.description}  onChange={set('description')} area />
            <div className="grid grid-cols-2 gap-4">
              <Field label="Website" value={form.website_url} onChange={set('website_url')} />
              <Field label="Booth location" value={sponsor.booth_location ?? '—'} readOnly />
            </div>
          </div>
          <div className="px-5 pb-5">
            <button
              onClick={handleSave}
              disabled={isPending}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-[13.5px] font-medium text-white transition-colors"
              style={{ background: saved ? '#2D7A4F' : isPending ? '#2A6A50' : '#1F4D3A' }}
            >
              <svg width={15} height={15} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
              </svg>
              {saved ? 'Saved!' : isPending ? 'Saving…' : 'Save profile'}
            </button>
          </div>
        </div>
      </div>

      {/* Right — logo + visibility */}
      <div className="grid gap-5 content-start">
        <div className="bg-white rounded-2xl border" style={{ borderColor: '#E5E0D4' }}>
          <div className="px-5 pt-4 pb-3 border-b" style={{ borderColor: 'rgba(229,224,212,0.7)' }}>
            <div className="font-display text-[14px] font-semibold tracking-tight" style={{ color: '#0F1F18' }}>Logo</div>
          </div>
          <div className="p-5">
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleLogoUpload}
            />
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              disabled={logoUploading}
              className="w-full aspect-[3/2] rounded-xl border-2 border-dashed grid place-items-center transition-colors relative overflow-hidden"
              style={{ borderColor: 'rgba(31,77,58,0.35)', background: 'rgba(250,246,238,0.5)' }}
            >
              {logoUploading && (
                <div className="absolute inset-0 bg-white/70 grid place-items-center z-10">
                  <svg className="animate-spin" width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="#1F4D3A" strokeWidth={2.5}>
                    <path d="M21 12a9 9 0 1 1-9-9" strokeLinecap="round" />
                  </svg>
                </div>
              )}
              {logoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={logoUrl} alt="Logo" className="max-h-full max-w-full object-contain rounded-lg p-2" />
              ) : (
                <div className="text-center" style={{ color: '#1F4D3A' }}>
                  <svg width={20} height={20} fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24" className="mx-auto">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                  </svg>
                  <div className="text-[11.5px] mt-1.5 font-medium">Click to upload logo</div>
                  <div className="text-[10.5px] mt-0.5" style={{ color: '#6B7A72' }}>PNG, JPG, SVG</div>
                </div>
              )}
            </button>
            {logoUrl && (
              <button
                onClick={() => fileRef.current?.click()}
                disabled={logoUploading}
                className="mt-2.5 w-full text-[12px] py-1.5 rounded-lg border transition-colors"
                style={{ borderColor: '#E5E0D4', color: '#6B7A72' }}
              >
                Replace logo
              </button>
            )}
          </div>
        </div>

        <div className="bg-white rounded-2xl border" style={{ borderColor: '#E5E0D4' }}>
          <div className="px-5 pt-4 pb-3 border-b" style={{ borderColor: 'rgba(229,224,212,0.7)' }}>
            <div className="font-display text-[14px] font-semibold tracking-tight" style={{ color: '#0F1F18' }}>Visibility</div>
          </div>
          <div className="p-5 flex items-center justify-between">
            <div>
              <div className="text-[13px] font-medium" style={{ color: '#0F1F18' }}>Featured booth</div>
              <div className="text-[11.5px] mt-0.5" style={{ color: '#6B7A72' }}>{tierLabel ?? 'Sponsor'} perk</div>
            </div>
            <span className="inline-flex items-center gap-1.5 text-[11px] font-medium px-2.5 py-1 rounded-full border" style={{ background: 'rgba(45,122,79,0.08)', color: '#2D7A4F', borderColor: 'rgba(45,122,79,0.2)' }}>
              <span className="w-1.5 h-1.5 rounded-full" style={{ background: '#2D7A4F' }} />
              On
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
