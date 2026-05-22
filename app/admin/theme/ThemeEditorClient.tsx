'use client';

import { useState, useCallback, useRef } from 'react';
import type { SiteSettings, ThemeColors } from '@/lib/theme/settings';
import { Check, Loader2, AlertCircle, Upload, X, Image } from 'lucide-react';

interface Props {
  settings: SiteSettings;
}

const SYSTEM_FONTS = [
  'DM Sans', 'Inter', 'JetBrains Mono', 'Georgia', 'Times New Roman',
  'Arial', 'Helvetica', 'Verdana', 'Courier New', 'Trebuchet MS',
];

const COLOR_LABELS: { key: keyof ThemeColors; label: string; desc: string }[] = [
  { key: 'primary',     label: 'Primary',      desc: 'Buttons, links, active states' },
  { key: 'primaryDark', label: 'Primary dark',  desc: 'Hover states, dark backgrounds' },
  { key: 'primarySoft', label: 'Primary soft',  desc: 'Subtle highlights, badges' },
  { key: 'accent',      label: 'Accent',        desc: 'Gold highlights, active nav indicators' },
  { key: 'accentDark',  label: 'Accent dark',   desc: 'Accent hover states' },
  { key: 'ink',         label: 'Ink',           desc: 'Body text, headings' },
  { key: 'inkSoft',     label: 'Ink soft',      desc: 'Secondary text' },
  { key: 'muted',       label: 'Muted',         desc: 'Placeholders, disabled text' },
  { key: 'cream',       label: 'Cream',         desc: 'App background' },
];

type SaveState = 'idle' | 'saving' | 'saved' | 'error';
type UploadState = 'idle' | 'uploading' | 'done' | 'error';

export function ThemeEditorClient({ settings }: Props) {
  const [form, setForm] = useState<SiteSettings>(settings);
  const [saveState, setSaveState] = useState<SaveState>('idle');
  const [errorMsg, setErrorMsg] = useState('');
  const [uploadState, setUploadState] = useState<UploadState>('idle');
  const [uploadError, setUploadError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleLogoUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadState('uploading');
    setUploadError('');

    try {
      const fd = new FormData();
      fd.append('file', file);

      const res = await fetch('/api/admin/upload-logo', { method: 'POST', body: fd });
      const json = await res.json();

      if (!res.ok) throw new Error(json.error ?? 'Upload failed');

      setForm(f => ({ ...f, logo_url: json.url }));
      setUploadState('done');
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : 'Upload failed');
      setUploadState('error');
    }

    // Reset so the same file can be re-selected
    if (fileInputRef.current) fileInputRef.current.value = '';
  }, []);

  const save = useCallback(async () => {
    setSaveState('saving');
    setErrorMsg('');
    try {
      const res = await fetch('/api/admin/theme', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          brand_name: form.brand_name,
          logo_url:   form.logo_url,
          colors:     form.colors,
          fonts:      form.fonts,
          gradients:  form.gradients,
        }),
      });
      if (!res.ok) {
        const j = await res.json();
        throw new Error(j.error ?? 'Unknown error');
      }
      setSaveState('saved');
      setTimeout(() => setSaveState('idle'), 2500);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Save failed');
      setSaveState('error');
    }
  }, [form]);

  const setColor = (key: keyof ThemeColors, val: string) =>
    setForm(f => ({ ...f, colors: { ...f.colors, [key]: val } }));

  const setFont = (key: 'display' | 'body' | 'mono', val: string) =>
    setForm(f => ({ ...f, fonts: { ...f.fonts, [key]: val } }));

  const setGradient = (val: string) =>
    setForm(f => ({ ...f, gradients: { ...f.gradients, hero: val } }));

  return (
    <div className="space-y-8">

      {/* Brand name */}
      <section className="bg-white rounded-2xl border p-6" style={{ borderColor: '#E5E0D4' }}>
        <h2 className="font-display font-semibold text-[15px] text-[#0F1F18] mb-4">Brand name</h2>
        <input
          value={form.brand_name}
          onChange={e => setForm(f => ({ ...f, brand_name: e.target.value }))}
          className="w-full h-10 px-3 rounded-lg border text-[14px] outline-none focus:ring-2 focus:ring-[#1F4D3A]/20 focus:border-[#1F4D3A]/40 transition"
          style={{ borderColor: '#E5E0D4' }}
          placeholder="Karta"
        />
        <p className="mt-2 text-[12px] text-[#6B7A72]">
          Shown in the nav when no logo is set, and in the browser tab title.
        </p>
      </section>

      {/* Logo upload */}
      <section className="bg-white rounded-2xl border p-6" style={{ borderColor: '#E5E0D4' }}>
        <h2 className="font-display font-semibold text-[15px] text-[#0F1F18] mb-1">Logo</h2>
        <p className="text-[12px] text-[#6B7A72] mb-5">
          When set, the logo replaces the brand name in the sidebar. Use a transparent PNG or SVG for best results.
        </p>

        {/* Preview + upload button */}
        <div className="flex items-center gap-4">
          {/* Preview box */}
          <div
            className="h-[72px] w-[160px] rounded-xl border flex items-center justify-center shrink-0 overflow-hidden"
            style={{ borderColor: '#E5E0D4', background: '#0F1F18' }}
          >
            {form.logo_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={form.logo_url}
                alt="Logo preview"
                className="max-h-[52px] max-w-[136px] object-contain"
              />
            ) : (
              <div className="flex flex-col items-center gap-1">
                <Image size={18} strokeWidth={1.5} style={{ color: 'rgba(255,255,255,0.2)' }} />
                <span className="text-[10px] font-mono" style={{ color: 'rgba(255,255,255,0.2)' }}>No logo</span>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex-1 space-y-2">
            <div className="flex items-center gap-2">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/webp,image/svg+xml"
                className="hidden"
                onChange={handleLogoUpload}
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadState === 'uploading'}
                className="inline-flex items-center gap-2 h-9 px-4 rounded-lg border text-[13px] font-medium transition hover:border-[#1F4D3A] hover:text-[#1F4D3A] disabled:opacity-50"
                style={{ borderColor: '#E5E0D4', color: '#3A4A42' }}
              >
                {uploadState === 'uploading' ? (
                  <Loader2 size={13} strokeWidth={2} className="animate-spin" />
                ) : (
                  <Upload size={13} strokeWidth={2} />
                )}
                {uploadState === 'uploading' ? 'Uploading…' : 'Upload logo'}
              </button>

              {form.logo_url && (
                <button
                  onClick={() => { setForm(f => ({ ...f, logo_url: null })); setUploadState('idle'); }}
                  className="inline-flex items-center gap-1.5 h-9 px-3 rounded-lg border text-[13px] transition hover:border-red-300 hover:text-red-500"
                  style={{ borderColor: '#E5E0D4', color: '#6B7A72' }}
                >
                  <X size={13} strokeWidth={2} />
                  Remove
                </button>
              )}
            </div>

            {uploadState === 'done' && (
              <div className="flex items-center gap-1.5 text-[12px] text-emerald-600">
                <Check size={12} strokeWidth={2.5} />
                Uploaded — click Save changes to apply
              </div>
            )}
            {uploadState === 'error' && (
              <div className="flex items-center gap-1.5 text-[12px] text-red-500">
                <AlertCircle size={12} strokeWidth={2} />
                {uploadError}
              </div>
            )}

            <p className="text-[11px] text-[#6B7A72]">PNG, JPG, WebP, or SVG · max 2 MB</p>
          </div>
        </div>

        {/* Dark background note */}
        <div className="mt-4 flex items-start gap-2 text-[11px] text-[#6B7A72] rounded-lg px-3 py-2.5" style={{ background: '#FAF6EE', border: '1px solid #E5E0D4' }}>
          <span className="shrink-0 mt-0.5">💡</span>
          The sidebar background is dark (<code className="font-mono text-[10px]">#0F1F18</code>). Use a white or light-coloured logo for best contrast.
        </div>
      </section>

      {/* Colors */}
      <section className="bg-white rounded-2xl border p-6" style={{ borderColor: '#E5E0D4' }}>
        <h2 className="font-display font-semibold text-[15px] text-[#0F1F18] mb-4">Brand colors</h2>
        <div className="space-y-3">
          {COLOR_LABELS.map(({ key, label, desc }) => (
            <div key={key} className="flex items-center gap-4">
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <label
                  htmlFor={`color-${key}`}
                  className="h-8 w-8 rounded-lg border-2 cursor-pointer shrink-0 transition hover:scale-105"
                  style={{ background: form.colors[key], borderColor: '#E5E0D4' }}
                  title="Click to pick color"
                >
                  <input
                    id={`color-${key}`}
                    type="color"
                    value={form.colors[key]}
                    onChange={e => setColor(key, e.target.value)}
                    className="sr-only"
                  />
                </label>
                <div className="min-w-0">
                  <div className="text-[13px] font-medium text-[#0F1F18]">{label}</div>
                  <div className="text-[11px] text-[#6B7A72] truncate">{desc}</div>
                </div>
              </div>
              <input
                value={form.colors[key]}
                onChange={e => setColor(key, e.target.value)}
                className="w-[96px] h-8 px-2 rounded-lg border font-mono text-[12px] outline-none focus:ring-2 focus:ring-[#1F4D3A]/20 focus:border-[#1F4D3A]/40 transition text-center shrink-0"
                style={{ borderColor: '#E5E0D4' }}
                placeholder="#000000"
                pattern="^#[0-9A-Fa-f]{6}$"
              />
            </div>
          ))}
        </div>
      </section>

      {/* Fonts */}
      <section className="bg-white rounded-2xl border p-6" style={{ borderColor: '#E5E0D4' }}>
        <h2 className="font-display font-semibold text-[15px] text-[#0F1F18] mb-4">Typography</h2>
        <div className="space-y-4">
          {([
            { key: 'display' as const, label: 'Display font',  desc: 'Headings and UI labels' },
            { key: 'body'    as const, label: 'Body font',     desc: 'Body text and UI elements' },
            { key: 'mono'    as const, label: 'Mono font',     desc: 'Code, IDs, badges' },
          ] as const).map(({ key, label, desc }) => (
            <div key={key}>
              <label className="block text-[13px] font-medium text-[#0F1F18] mb-1">{label}</label>
              <p className="text-[11px] text-[#6B7A72] mb-2">{desc}</p>
              <select
                value={form.fonts[key]}
                onChange={e => setFont(key, e.target.value)}
                className="w-full h-10 px-3 rounded-lg border text-[13px] outline-none focus:ring-2 focus:ring-[#1F4D3A]/20 focus:border-[#1F4D3A]/40 transition bg-white"
                style={{ borderColor: '#E5E0D4' }}
              >
                {SYSTEM_FONTS.map(f => (
                  <option key={f} value={f}>{f}</option>
                ))}
              </select>
            </div>
          ))}
        </div>
      </section>

      {/* Hero gradient */}
      <section className="bg-white rounded-2xl border p-6" style={{ borderColor: '#E5E0D4' }}>
        <h2 className="font-display font-semibold text-[15px] text-[#0F1F18] mb-1">Hero gradient</h2>
        <p className="text-[12px] text-[#6B7A72] mb-4">
          Used on hero sections and premium marketing surfaces. Enter a valid CSS gradient value.
        </p>
        <div
          className="h-14 rounded-xl mb-4"
          style={{ background: form.gradients.hero }}
        />
        <input
          value={form.gradients.hero}
          onChange={e => setGradient(e.target.value)}
          className="w-full h-10 px-3 rounded-lg border font-mono text-[12px] outline-none focus:ring-2 focus:ring-[#1F4D3A]/20 focus:border-[#1F4D3A]/40 transition"
          style={{ borderColor: '#E5E0D4' }}
          placeholder="linear-gradient(135deg, #1F4D3A 0%, #2A6A50 60%, #E8C57E 100%)"
        />
      </section>

      {/* Save bar */}
      <div
        className="sticky bottom-6 flex items-center justify-between gap-4 px-5 py-3.5 rounded-2xl shadow-lg"
        style={{ background: '#0F1F18', border: '1px solid rgba(255,255,255,0.08)' }}
      >
        <div className="text-[13px] text-white/60">
          Changes apply live across the whole product.
        </div>
        <div className="flex items-center gap-3">
          {saveState === 'error' && (
            <div className="flex items-center gap-1.5 text-[12px] text-red-400">
              <AlertCircle size={13} strokeWidth={2} />
              {errorMsg}
            </div>
          )}
          {saveState === 'saved' && (
            <div className="flex items-center gap-1.5 text-[12px] text-green-400">
              <Check size={13} strokeWidth={2.5} />
              Saved
            </div>
          )}
          <button
            onClick={save}
            disabled={saveState === 'saving'}
            className="inline-flex items-center gap-2 h-9 px-5 rounded-xl text-[13px] font-semibold text-[#0F1F18] disabled:opacity-60 transition hover:opacity-90"
            style={{ background: '#E8C57E' }}
          >
            {saveState === 'saving' && <Loader2 size={13} strokeWidth={2} className="animate-spin" />}
            {saveState === 'saving' ? 'Saving…' : 'Save changes'}
          </button>
        </div>
      </div>
    </div>
  );
}
