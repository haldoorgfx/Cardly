'use client';

import { useState, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ChevronLeft, Upload, Check, ArrowRight } from 'lucide-react';

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
      if (res.status === 402 && data.error === 'PLAN_LIMIT') {
        throw new Error(`You've reached the event limit on your current plan. Upgrade to create more events.`);
      }
      if (!res.ok) throw new Error(data.error ?? 'Upload failed');
      router.push(`/events/${data.id}/edit`);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Something went wrong');
      setUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-50 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-neutral-100">
        <div className="max-w-[1200px] mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/dashboard" className="h-8 w-8 rounded-md hover:bg-neutral-100 grid place-items-center text-neutral-500 transition">
              <ChevronLeft size={16} strokeWidth={2} />
            </Link>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-[16px] text-[#0a0a0a]">Karta</span>
              <span className="text-neutral-300">·</span>
              <input
                value={eventName}
                onChange={e => setEventName(e.target.value)}
                placeholder="Event name"
                className="text-[14px] bg-transparent outline-none border-b border-dashed border-transparent hover:border-neutral-300 focus:border-neutral-500 px-1 w-28 sm:w-48 transition"
              />
            </div>
          </div>

          {/* Stepper */}
          <div className="hidden md:flex items-center gap-2 text-[13px]">
            <div className="flex items-center gap-2 text-[#0a0a0a]">
              <span className="w-6 h-6 rounded-full bg-[#0a0a0a] grid place-items-center text-[11px] font-semibold text-white">1</span>
              <span className="font-medium">Upload</span>
            </div>
            <div className="w-8 h-px bg-neutral-200" />
            <div className="flex items-center gap-2 text-neutral-400">
              <span className="w-6 h-6 rounded-full bg-neutral-100 border border-neutral-200 grid place-items-center text-[11px] font-semibold text-neutral-400">2</span>
              <span>Define zones</span>
            </div>
            <div className="w-8 h-px bg-neutral-200" />
            <div className="flex items-center gap-2 text-neutral-400">
              <span className="w-6 h-6 rounded-full bg-neutral-100 border border-neutral-200 grid place-items-center text-[11px] font-semibold text-neutral-400">3</span>
              <span>Publish</span>
            </div>
          </div>

          <div className="w-[88px]" />
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center px-6 py-8">
        <div className="w-full max-w-[680px]">
          <div className="mb-6">
            <h1 className="text-xl font-semibold text-[#0a0a0a]">Upload your design</h1>
            <p className="text-[13px] text-neutral-500 mt-1">Anything you&apos;d post on Instagram works. We&apos;ll place editable zones on top.</p>
          </div>

          {error && (
            <div className="mb-4 px-4 py-3 rounded-md bg-red-50 border border-red-200 text-[13px] text-red-700">{error}</div>
          )}

          {!preview ? (
            <div
              onDragOver={e => { e.preventDefault(); setDragging(true); }}
              onDragEnter={e => { e.preventDefault(); setDragging(true); }}
              onDragLeave={() => setDragging(false)}
              onDrop={onDrop}
              onClick={() => fileRef.current?.click()}
              className={`relative rounded-lg border-2 border-dashed cursor-pointer transition-colors duration-150 ${
                dragging
                  ? 'border-neutral-400 bg-neutral-50'
                  : 'border-neutral-300 bg-white hover:border-neutral-400'
              }`}
            >
              <div className="px-5 py-14 sm:py-20 text-center">
                {/* Upload icon */}
                <div className="inline-flex items-center justify-center h-12 w-12 rounded-lg bg-neutral-100 mb-5 text-neutral-500">
                  <Upload size={22} strokeWidth={2} />
                </div>

                <div className="text-lg font-semibold text-[#0a0a0a]">
                  {dragging ? 'Release to upload' : 'Upload a design'}
                </div>
                <div className="text-[13px] text-neutral-500 mt-1.5">
                  Drag and drop, or{' '}
                  <span className="text-[#0a0a0a] underline underline-offset-2 decoration-neutral-400">
                    browse files
                  </span>
                </div>

                <div className="flex items-center justify-center gap-2 flex-wrap mt-6">
                  {[
                    { label: 'PNG · JPG' },
                    { label: 'Up to 20 MB' },
                    { label: '4:5 · 1:1 · 9:16' },
                  ].map(({ label }) => (
                    <span key={label} className="inline-flex items-center text-[12px] px-2.5 py-1 rounded-md bg-neutral-100 border border-neutral-200 text-neutral-500">
                      {label}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-lg border border-neutral-200 p-5">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <div className="text-[13px] font-medium text-[#0a0a0a]">{file?.name}</div>
                  {dims && (
                    <div className="text-[12px] text-neutral-400 mt-0.5">
                      {dims.w} × {dims.h} · {aspectLabel()} · {formatSize(file?.size ?? 0)}
                    </div>
                  )}
                </div>
                <button onClick={() => { setFile(null); setPreview(null); setDims(null); }} className="text-[13px] text-neutral-500 hover:text-[#0a0a0a] transition">Replace</button>
              </div>
              <div className="grid grid-cols-12 gap-4">
                <div className="col-span-12 md:col-span-7 rounded-md overflow-hidden bg-neutral-100 border border-neutral-200" style={{ aspectRatio: '4/5' }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={preview} alt="Preview" className="w-full h-full object-cover" />
                </div>
                <div className="col-span-12 md:col-span-5 space-y-2.5">
                  <div className="p-3 rounded-md bg-emerald-50 border border-emerald-200">
                    <div className="flex items-center gap-2 text-[13px] font-medium text-emerald-700">
                      <Check size={13} strokeWidth={2.4} />
                      Looks great
                    </div>
                    <div className="text-[12px] text-emerald-700/80 mt-1">Ready for zone editing. Click Continue to add editable fields.</div>
                  </div>
                  {dims && (
                    <>
                      {[
                        { k: 'Dimensions', v: `${dims.w} × ${dims.h} px` },
                        { k: 'Aspect', v: aspectLabel() },
                        { k: 'File size', v: formatSize(file?.size ?? 0) },
                      ].map(row => (
                        <div key={row.k} className="flex items-center justify-between px-3 py-2 rounded-md bg-neutral-50 border border-neutral-100">
                          <div className="text-[12px] text-neutral-500">{row.k}</div>
                          <div className="text-[12px] font-medium text-[#0a0a0a]">{row.v}</div>
                        </div>
                      ))}
                    </>
                  )}
                </div>
              </div>
            </div>
          )}

          <input ref={fileRef} type="file" accept="image/png,image/jpeg" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); }} />

          {/* Event name field (below upload zone) */}
          {preview && (
            <div className="mt-4">
              <label className="block text-[13px] font-medium text-neutral-700 mb-1.5">Event name</label>
              <input
                value={eventName}
                onChange={e => setEventName(e.target.value)}
                placeholder="e.g. Design Week Lagos 2026"
                className="w-full h-9 border border-neutral-200 rounded-md bg-white px-3 text-[14px] outline-none focus:border-neutral-400 focus:ring-2 focus:ring-neutral-100 transition"
              />
            </div>
          )}

          <div className="mt-6 flex items-center justify-between">
            <Link href="/dashboard" className="text-[13px] text-neutral-500 hover:text-[#0a0a0a] transition">← Back</Link>
            <button
              disabled={!file || uploading}
              onClick={handleContinue}
              className={`h-9 px-4 rounded-md font-medium text-[14px] inline-flex items-center gap-2 transition ${
                file && !uploading
                  ? 'bg-[#0F1F18] text-white hover:bg-neutral-800'
                  : 'bg-neutral-200 text-neutral-400 cursor-not-allowed'
              }`}
            >
              {uploading ? 'Uploading…' : 'Continue to canvas'}
              {!uploading && (
                <ArrowRight size={14} strokeWidth={2.2} />
              )}
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
