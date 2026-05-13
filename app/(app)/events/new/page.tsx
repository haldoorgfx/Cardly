'use client';

import { useState, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function NewEventPage() {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [eventName, setEventName] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [dims, setDims] = useState<{ w: number; h: number } | null>(null);
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  const handleFile = useCallback((f: File) => {
    if (!f.type.match(/image\/(png|jpeg)/)) {
      setError('Only PNG and JPG files are supported.');
      return;
    }
    if (f.size > 20 * 1024 * 1024) {
      setError('File must be under 20MB.');
      return;
    }
    setError('');
    setFile(f);
    const url = URL.createObjectURL(f);
    setPreview(url);
    const img = new Image();
    img.onload = () => setDims({ w: img.naturalWidth, h: img.naturalHeight });
    img.src = url;
  }, []);

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const f = e.dataTransfer.files[0];
    if (f) handleFile(f);
  }, [handleFile]);

  const formatSize = (bytes: number) => {
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const aspectLabel = () => {
    if (!dims) return '';
    const ratio = dims.w / dims.h;
    if (Math.abs(ratio - 4 / 5) < 0.05) return '4 : 5 (portrait)';
    if (Math.abs(ratio - 1) < 0.05) return '1 : 1 (square)';
    if (Math.abs(ratio - 9 / 16) < 0.05) return '9 : 16 (tall)';
    return `${dims.w} : ${dims.h}`;
  };

  const handleContinue = async () => {
    if (!file) return;
    setUploading(true);
    setError('');
    try {
      const name = eventName.trim() || file.name.replace(/\.[^.]+$/, '');
      const formData = new FormData();
      formData.append('file', file);
      formData.append('name', name);

      const res = await fetch('/api/events/create', { method: 'POST', body: formData });
      const data = await res.json();
      if (res.status === 403 && data.error === 'PLAN_LIMIT') {
        throw new Error(`You've reached the ${data.limit}-event limit on the free plan. Upgrade to create more events.`);
      }
      if (!res.ok) throw new Error(data.error ?? 'Upload failed');
      router.push(`/events/${data.id}/edit`);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Something went wrong');
      setUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF6EE] flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-[#E5E0D4]">
        <div className="max-w-[1200px] mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/dashboard" className="h-9 w-9 rounded-lg hover:bg-[#FAF6EE] grid place-items-center text-[#0F1F18]/60">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m15 18-6-6 6-6" /></svg>
            </Link>
            <div className="flex items-center gap-2">
              <span className="h-7 w-7 rounded-lg grid place-items-center text-white font-display font-bold text-[14px]" style={{ background: 'linear-gradient(135deg,#1F4D3A,#E8C57E)' }}>C</span>
              <div className="font-display font-bold text-[16px]">New event</div>
              <span className="text-[#0F1F18]/30">·</span>
              <input
                value={eventName}
                onChange={e => setEventName(e.target.value)}
                placeholder="Event name"
                className="text-[14px] font-medium bg-transparent outline-none border-b border-dashed border-transparent hover:border-[#E5E0D4] focus:border-[#1F4D3A] px-1 w-48"
              />
            </div>
          </div>

          {/* Stepper */}
          <div className="hidden md:flex items-center gap-2 text-[12.5px]">
            <div className="flex items-center gap-2 text-[#0F1F18]">
              <span className="w-7 h-7 rounded-full grid place-items-center font-mono text-[12px] font-semibold text-white" style={{ background: 'linear-gradient(135deg,#1F4D3A,#E8C57E)' }}>1</span>
              <span className="font-medium">Upload</span>
            </div>
            <div className="w-8 h-px bg-[#E5E0D4]" />
            <div className="flex items-center gap-2 text-[#0F1F18]/40">
              <span className="w-7 h-7 rounded-full bg-[#FAF6EE] grid place-items-center font-mono text-[12px] font-semibold text-[#0F1F18]/55">2</span>
              <span>Define zones</span>
            </div>
            <div className="w-8 h-px bg-[#E5E0D4]" />
            <div className="flex items-center gap-2 text-[#0F1F18]/40">
              <span className="w-7 h-7 rounded-full bg-[#FAF6EE] grid place-items-center font-mono text-[12px] font-semibold text-[#0F1F18]/55">3</span>
              <span>Publish</span>
            </div>
          </div>

          <div className="w-[88px]" />
        </div>
      </header>

      <main className="flex-1 grid place-items-center px-6 py-10">
        <div className="w-full max-w-[860px]">
          <div className="text-center mb-8">
            <div className="text-[11px] font-mono tracking-widest text-[#0F1F18]/45">STEP 1 OF 3</div>
            <h1 className="font-display font-bold text-[40px] leading-tight mt-2">Upload your design</h1>
            <p className="text-[15px] text-[#0F1F18]/60 mt-2 max-w-[520px] mx-auto">Anything you&apos;d post on Instagram works. We&apos;ll show it on a canvas where you can mark editable zones.</p>
          </div>

          {error && (
            <div className="mb-4 px-4 py-3 rounded-xl bg-rose-50 border border-rose-200 text-[13px] text-rose-700">{error}</div>
          )}

          {!preview ? (
            <div
              onDragOver={e => { e.preventDefault(); setDragging(true); }}
              onDragEnter={e => { e.preventDefault(); setDragging(true); }}
              onDragLeave={() => setDragging(false)}
              onDrop={onDrop}
              onClick={() => fileRef.current?.click()}
              className={`relative rounded-3xl border-2 border-dashed cursor-pointer overflow-hidden transition-all duration-200 ${
                dragging
                  ? 'border-[#1F4D3A] bg-[#1F4D3A]/[0.04] scale-[1.01]'
                  : 'border-[#E5E0D4] hover:border-[#1F4D3A]/50 bg-white'
              }`}
              style={{ boxShadow: dragging ? '0 0 0 4px rgba(31,77,58,0.08), 0 12px 40px rgba(31,77,58,0.1)' : '0 1px 2px rgba(15,31,24,0.04), 0 8px 24px rgba(15,31,24,0.05)' }}
            >
              {/* Ambient glow blobs */}
              <div className="absolute -top-16 -right-16 h-48 w-48 rounded-full bg-[#1F4D3A]/10 blur-3xl pointer-events-none" />
              <div className="absolute -bottom-16 -left-16 h-48 w-48 rounded-full bg-[#E8C57E]/15 blur-3xl pointer-events-none" />

              <div className="relative px-10 py-20 text-center">
                {/* Icon stack */}
                <div className="relative inline-flex items-center justify-center mb-7">
                  {/* Outer ring */}
                  <span className="absolute h-24 w-24 rounded-3xl border border-[#1F4D3A]/12 bg-[#1F4D3A]/[0.04]" />
                  {/* Inner icon */}
                  <span
                    className="relative h-16 w-16 rounded-2xl grid place-items-center text-white"
                    style={{ background: 'linear-gradient(135deg,#1F4D3A,#E8C57E)', boxShadow: '0 8px 24px rgba(31,77,58,0.32)' }}
                  >
                    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" />
                    </svg>
                  </span>
                </div>

                <div className="font-display font-bold text-[26px] text-[#0F1F18]">
                  {dragging ? 'Release to upload' : 'Drop your design here'}
                </div>
                <div className="text-[14.5px] text-[#0F1F18]/50 mt-2">
                  or{' '}
                  <span className="text-[#1F4D3A] font-semibold underline underline-offset-2 decoration-[#1F4D3A]/30">
                    browse files
                  </span>
                </div>

                <div className="flex items-center justify-center gap-2 flex-wrap mt-7">
                  {[
                    {
                      icon: <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>,
                      label: 'PNG · JPG',
                    },
                    {
                      icon: <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/></svg>,
                      label: 'Up to 20 MB',
                    },
                    {
                      icon: <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M21 3H3v18"/><path d="M7 12h10M7 17h6M7 7h14"/></svg>,
                      label: '4:5 · 1:1 · 9:16',
                    },
                  ].map(({ icon, label }) => (
                    <span key={label} className="inline-flex items-center gap-1.5 text-[12px] font-mono px-3 py-1.5 rounded-full bg-[#FAF6EE] border border-[#E5E0D4] text-[#0F1F18]/60">
                      {icon}
                      {label}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="mt-6 bg-white rounded-3xl border border-[#E5E0D4] p-6" style={{ boxShadow: '0 1px 2px rgba(15,31,24,0.04), 0 12px 32px rgba(15,31,24,0.06)' }}>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <div className="text-[11px] font-mono tracking-widest text-[#0F1F18]/45">UPLOADED</div>
                  <div className="font-display font-semibold text-[15px] mt-0.5">{file?.name}</div>
                  {dims && (
                    <div className="text-[12px] font-mono text-[#0F1F18]/50 mt-0.5">
                      {dims.w} × {dims.h} · {aspectLabel()} · {formatSize(file?.size ?? 0)}
                    </div>
                  )}
                </div>
                <button onClick={() => { setFile(null); setPreview(null); setDims(null); }} className="text-[13px] text-[#0F1F18]/55 hover:text-[#0F1F18]">Replace</button>
              </div>
              <div className="grid grid-cols-12 gap-5">
                <div className="col-span-12 md:col-span-7 rounded-2xl overflow-hidden bg-[#FAF6EE] border border-[#E5E0D4]" style={{ aspectRatio: '4/5' }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={preview} alt="Preview" className="w-full h-full object-cover" />
                </div>
                <div className="col-span-12 md:col-span-5 space-y-3">
                  <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200/60">
                    <div className="flex items-center gap-2 text-[13px] font-medium text-emerald-700">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4"><polyline points="20 6 9 17 4 12" /></svg>
                      Looks great
                    </div>
                    <div className="text-[12.5px] text-emerald-700/80 mt-1">Ready for zone editing. Click Continue to add your editable fields.</div>
                  </div>
                  {dims && (
                    <>
                      {[
                        { k: 'DIMENSIONS', v: `${dims.w} × ${dims.h} px` },
                        { k: 'ASPECT', v: aspectLabel() },
                        { k: 'FILE SIZE', v: formatSize(file?.size ?? 0) },
                      ].map(row => (
                        <div key={row.k} className="flex items-center justify-between p-3 rounded-xl bg-[#FAF6EE]">
                          <div className="text-[10.5px] font-mono tracking-widest text-[#0F1F18]/45">{row.k}</div>
                          <div className="font-mono text-[12.5px] text-[#0F1F18]">{row.v}</div>
                        </div>
                      ))}
                    </>
                  )}
                </div>
              </div>
            </div>
          )}

          <input ref={fileRef} type="file" accept="image/png,image/jpeg" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); }} />

          <div className="mt-7 flex items-center justify-between">
            <Link href="/dashboard" className="text-[13.5px] text-[#0F1F18]/55 hover:text-[#0F1F18]">← Back</Link>
            <button
              disabled={!file || uploading}
              onClick={handleContinue}
              className={`h-12 px-7 rounded-xl font-display font-semibold text-[15px] inline-flex items-center gap-2 transition ${file && !uploading ? 'text-white hover:opacity-95' : 'bg-[#E5E0D4] text-white/70 cursor-not-allowed'}`}
              style={file && !uploading ? { background: '#1F4D3A', boxShadow: '0 8px 24px rgba(31,77,58,0.35)' } : {}}
            >
              {uploading ? 'Uploading…' : 'Continue to canvas'}
              {!uploading && (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                  <path d="M5 12h14M13 6l6 6-6 6" />
                </svg>
              )}
            </button>
          </div>

          <div className="mt-8 text-center">
            <div className="text-[13px] text-[#0F1F18]/50">Don&apos;t have a design yet? <Link href="/dashboard" className="text-[#1F4D3A] font-medium">Browse example designs</Link> →</div>
          </div>
        </div>
      </main>
    </div>
  );
}
