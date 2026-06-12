'use client';

import { useState, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { fetchWithRetry } from '@/lib/utils/fetch-retry';
import { track } from '@/components/shared/PostHogProvider';
import { PlacesAutocomplete, type PlaceResult } from '@/components/shared/PlacesAutocomplete';
import {
  ArrowLeft, ArrowRight, CalendarDays, Wifi,
  Image as ImageIcon, Plus,
} from 'lucide-react';

export default function NewEventPage() {
  const router = useRouter();
  const coverRef = useRef<HTMLInputElement>(null);

  const [name, setName]         = useState('');
  const [startsAt, setStartsAt] = useState('');
  const [endsAt, setEndsAt]     = useState('');
  const [venue, setVenue]       = useState('');
  const [placeData, setPlaceData] = useState<PlaceResult | null>(null);
  const [isOnline, setIsOnline] = useState(false);
  const [coverFile, setCoverFile] = useState<File | null>(null);

  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');

  const canProceed = name.trim().length > 0;

  const handleCoverFile = useCallback((f: File) => {
    if (!f.type.match(/image\/(png|jpeg)/)) { setError('Only PNG or JPG accepted.'); return; }
    if (f.size > 20 * 1024 * 1024) { setError('File must be under 20 MB.'); return; }
    setError('');
    setCoverFile(f);
  }, []);

  // For card-design flow (legacy — still accessible via direct upload route)
  const fileRef = useRef<HTMLInputElement>(null);
  const [cardFile]    = useState<File | null>(null);
  void fetchWithRetry; void cardFile; void fileRef; // keep imports alive

  async function handleCreate() {
    if (!canProceed) return;
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/events/create-basic', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          starts_at: startsAt || null,
          ends_at:   endsAt   || null,
          venue_name:    isOnline ? null : (placeData?.venue_name || venue.trim() || null),
          venue_address: isOnline ? null : (placeData?.venue_address || null),
          venue_lat:     isOnline ? null : (placeData?.lat ?? null),
          venue_lng:     isOnline ? null : (placeData?.lng ?? null),
          city:          isOnline ? null : (placeData?.city || null),
          country:       isOnline ? null : (placeData?.country || null),
          is_online:  isOnline,
        }),
      });
      const data = await res.json();
      if (res.status === 402) throw new Error('Event limit reached on your plan. Upgrade to create more events.');
      if (!res.ok) throw new Error(data.error ?? 'Failed to create event');

      track('event_created', { event_id: data.id });
      router.push(`/events/${data.id}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong');
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen" style={{
      background: '#FAF6EE',
      backgroundImage: 'radial-gradient(circle, rgba(15,31,24,0.04) 1px, transparent 1px)',
      backgroundSize: '24px 24px',
    }}>

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <header className="h-14 bg-white border-b flex items-center px-6 gap-4" style={{ borderColor: '#E5E0D4' }}>
        <Link
          href="/dashboard"
          className="flex items-center gap-1.5 text-[13px] font-medium transition hover:text-[#1F4D3A]"
          style={{ color: '#6B7A72' }}>
          <ArrowLeft size={14} strokeWidth={2} />
          Back to events
        </Link>
      </header>

      <main className="max-w-[580px] mx-auto px-4 sm:px-6 py-12">

        {error && (
          <div className="mb-6 px-4 py-3 rounded-xl text-[13px]"
            style={{ background: 'rgba(184,66,60,0.08)', border: '1px solid rgba(184,66,60,0.2)', color: '#B8423C' }}>
            {error}
          </div>
        )}

        <div>
          <h1 className="font-display font-semibold text-[32px] mb-1 tracking-[-0.02em]" style={{ color: '#0F1F18' }}>
            Let&apos;s set up your event
          </h1>
          <p className="text-[14px] mb-9" style={{ color: '#6B7A72' }}>
            The essentials — you can change all of this later.
          </p>

          <div className="space-y-5">
            {/* Event name */}
            <div>
              <label className="block text-[11px] font-mono font-semibold uppercase tracking-widest mb-2"
                style={{ color: '#6B7A72' }}>
                Event Name
              </label>
              <input
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="e.g. Africa Fintech Forum 2026"
                autoFocus
                className="w-full h-12 px-4 rounded-xl text-[14.5px] outline-none transition"
                style={{
                  background: 'white',
                  border: `1.5px solid ${name.trim() ? '#1F4D3A' : '#E5E0D4'}`,
                  color: '#0F1F18',
                }}
                onKeyDown={e => { if (e.key === 'Enter' && canProceed) handleCreate(); }}
              />
            </div>

            {/* Dates */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-mono font-semibold uppercase tracking-widest mb-2"
                  style={{ color: '#6B7A72' }}>
                  <span className="inline-flex items-center gap-1.5"><CalendarDays size={10} strokeWidth={2} /> Starts</span>
                </label>
                <input
                  type="datetime-local"
                  value={startsAt}
                  onChange={e => setStartsAt(e.target.value)}
                  className="w-full h-12 px-3 rounded-xl text-[13px] font-mono outline-none transition"
                  style={{ background: 'white', border: '1.5px solid #E5E0D4', color: '#0F1F18' }}
                />
              </div>
              <div>
                <label className="block text-[11px] font-mono font-semibold uppercase tracking-widest mb-2"
                  style={{ color: '#6B7A72' }}>
                  Ends
                </label>
                <input
                  type="datetime-local"
                  value={endsAt}
                  onChange={e => setEndsAt(e.target.value)}
                  className="w-full h-12 px-3 rounded-xl text-[13px] font-mono outline-none transition"
                  style={{ background: 'white', border: '1.5px solid #E5E0D4', color: '#0F1F18' }}
                />
              </div>
            </div>

            {/* Venue */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-[11px] font-mono font-semibold uppercase tracking-widest flex items-center gap-1.5"
                  style={{ color: '#6B7A72' }}>
                  Venue
                </label>
                <button
                  type="button"
                  onClick={() => { setIsOnline(v => !v); setPlaceData(null); setVenue(''); }}
                  className="flex items-center gap-1.5 text-[11px] font-mono font-semibold uppercase tracking-widest transition"
                  style={{ color: isOnline ? '#1F4D3A' : '#9BA8A1' }}>
                  <Wifi size={10} strokeWidth={2} />
                  {isOnline ? 'Switch to in-person' : 'Online event'}
                </button>
              </div>
              {isOnline ? (
                <div className="w-full h-12 px-4 rounded-xl flex items-center text-[14px]"
                  style={{ background: '#F5F3EE', border: '1.5px solid #E5E0D4', color: '#9BA8A1' }}>
                  Online — streaming link shared after registration
                </div>
              ) : (
                <PlacesAutocomplete
                  value={venue}
                  onChange={v => { setVenue(v); if (!v) setPlaceData(null); }}
                  onPlaceSelected={p => { setPlaceData(p); setVenue(p.venue_name || p.venue_address); }}
                  placeholder="Search venue name or address"
                />
              )}
              {placeData && (
                <p className="mt-1.5 text-[12px] pl-1" style={{ color: '#6B7A72' }}>
                  📍 {placeData.venue_address}
                </p>
              )}
            </div>

            {/* Cover photo */}
            <div>
              <button
                type="button"
                onClick={() => coverRef.current?.click()}
                className="w-full h-12 px-4 rounded-xl flex items-center gap-3 transition hover:border-[#1F4D3A]/40"
                style={{
                  border: '1.5px dashed #C9C3B1',
                  background: 'white',
                  color: coverFile ? '#0F1F18' : '#9BA8A1',
                }}>
                <ImageIcon size={16} strokeWidth={1.8} />
                {coverFile ? (
                  <span className="text-[13.5px] truncate">{coverFile.name}</span>
                ) : (
                  <span className="text-[13.5px]">
                    Upload cover photo
                    <span className="ml-2 text-[12px]" style={{ color: '#C9C3B1' }}>— optional, add later</span>
                  </span>
                )}
                {!coverFile && <Plus size={14} strokeWidth={2} className="ml-auto" />}
              </button>
              <input ref={coverRef} type="file" accept="image/png,image/jpeg" className="hidden"
                onChange={e => { const f = e.target.files?.[0]; if (f) handleCoverFile(f); }} />
            </div>
          </div>

          <div className="flex justify-end mt-9">
            <button
              onClick={handleCreate}
              disabled={!canProceed || loading}
              className="inline-flex items-center gap-2 h-11 px-7 rounded-xl font-display font-semibold text-[14px] text-white transition-all"
              style={{
                background: canProceed && !loading ? '#1F4D3A' : '#E5E0D4',
                color: canProceed && !loading ? 'white' : '#9BA8A1',
                cursor: canProceed && !loading ? 'pointer' : 'not-allowed',
              }}>
              {loading ? (
                <>
                  <svg className="animate-spin" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M21 12a9 9 0 1 1-9-9" strokeLinecap="round" />
                  </svg>
                  Creating…
                </>
              ) : (
                <>
                  Create event
                  <ArrowRight size={14} strokeWidth={2.2} />
                </>
              )}
            </button>
          </div>
        </div>

      </main>
    </div>
  );
}
