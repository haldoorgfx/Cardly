'use client';

import { useState, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { fetchWithRetry } from '@/lib/utils/fetch-retry';
import { ArrowLeft, ArrowRight, CalendarDays, MapPin, Wifi, LayoutGrid, Image, Clock } from 'lucide-react';

type Step = 1 | 2;
type SetupChoice = 'hub' | 'card' | 'later';

export default function NewEventPage() {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);

  // Step 1 — basics
  const [name, setName] = useState('');
  const [startsAt, setStartsAt] = useState('');
  const [endsAt, setEndsAt] = useState('');
  const [venue, setVenue] = useState('');
  const [isOnline, setIsOnline] = useState(false);

  // Step 2 — setup choice
  const [choice, setChoice] = useState<SetupChoice>('hub');
  const [cardFile, setCardFile] = useState<File | null>(null);
  const [cardPreview, setCardPreview] = useState<string | null>(null);

  const [step, setStep] = useState<Step>(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleCardFile = useCallback((f: File) => {
    if (!f.type.match(/image\/(png|jpeg)/)) { setError('Only PNG and JPG files are supported.'); return; }
    if (f.size > 20 * 1024 * 1024) { setError('File must be under 20 MB.'); return; }
    setError('');
    setCardFile(f);
    setCardPreview(URL.createObjectURL(f));
  }, []);

  async function handleCreate() {
    setLoading(true);
    setError('');
    try {
      if (choice === 'card') {
        // Old card-upload flow
        if (!cardFile) { setError('Please upload a card design image.'); setLoading(false); return; }
        const formData = new FormData();
        formData.append('file', cardFile);
        formData.append('name', name.trim() || cardFile.name.replace(/\.[^.]+$/, ''));
        if (startsAt) formData.append('starts_at', startsAt);
        if (endsAt) formData.append('ends_at', endsAt);
        const res = await fetchWithRetry('/api/events/create', { method: 'POST', body: formData }, { attempts: 3, baseDelay: 1000 });
        const data = await res.json();
        if (res.status === 402 && data.error === 'PLAN_LIMIT') throw new Error('Event limit reached on your plan. Upgrade to create more events.');
        if (!res.ok) throw new Error(data.error ?? 'Upload failed');
        router.push(`/events/${data.id}/edit`);
      } else {
        // Full event hub or later — create basic event
        const res = await fetch('/api/events/create-basic', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: name.trim() || 'Untitled Event',
            starts_at: startsAt || null,
            ends_at: endsAt || null,
            venue_name: isOnline ? null : (venue.trim() || null),
            is_online: isOnline,
          }),
        });
        const data = await res.json();
        if (res.status === 402) throw new Error('Event limit reached on your plan. Upgrade to create more events.');
        if (!res.ok) throw new Error(data.error ?? 'Failed to create event');
        router.push(`/events/${data.id}`);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong');
      setLoading(false);
    }
  }

  const canProceed = name.trim().length > 0;

  return (
    <div className="min-h-screen" style={{ background: '#FAF6EE', backgroundImage: 'radial-gradient(circle, rgba(15,31,24,0.04) 1px, transparent 1px)', backgroundSize: '24px 24px' }}>
      {/* Header */}
      <header className="h-14 bg-white border-b flex items-center px-6 gap-4" style={{ borderColor: '#E5E0D4' }}>
        <Link href="/dashboard" className="h-8 w-8 rounded-lg border grid place-items-center transition hover:bg-[#FAF6EE]" style={{ borderColor: '#E5E0D4', color: '#6B7A72' }}>
          <ArrowLeft size={15} strokeWidth={2} />
        </Link>
        <span className="font-display font-medium text-[15px]" style={{ color: '#1F4D3A' }}>Create event</span>
        {/* Step indicator */}
        <div className="flex items-center gap-2 ml-auto">
          {([1, 2] as const).map(s => (
            <div key={s} className="flex items-center gap-2">
              <div
                className="h-6 w-6 rounded-full grid place-items-center text-[11px] font-mono font-medium transition"
                style={step >= s
                  ? { background: '#1F4D3A', color: 'white' }
                  : { background: '#E5E0D4', color: '#6B7A72' }}
              >
                {s}
              </div>
              {s < 2 && <div className="w-8 h-px" style={{ background: step > s ? '#1F4D3A' : '#E5E0D4' }} />}
            </div>
          ))}
          <span className="ml-2 text-[12px] font-mono" style={{ color: '#6B7A72' }}>
            {step === 1 ? 'Basics' : 'Setup'}
          </span>
        </div>
      </header>

      <main className="max-w-[580px] mx-auto px-6 py-12">
        {error && (
          <div className="mb-6 px-4 py-3 rounded-lg text-[13px]" style={{ background: 'rgba(184,66,60,0.08)', border: '1px solid rgba(184,66,60,0.2)', color: '#B8423C' }}>
            {error}
          </div>
        )}

        {/* ── Step 1 — Event basics ─────────────────────────────── */}
        {step === 1 && (
          <div>
            <h1 className="font-display font-medium text-[28px] mb-1" style={{ color: '#0F1F18', letterSpacing: '-0.02em' }}>
              Create your event
            </h1>
            <p className="text-[14px] mb-8" style={{ color: '#6B7A72' }}>
              Give your event a name and the key details. Everything else can be added later.
            </p>

            <div className="space-y-5">
              {/* Event name */}
              <div>
                <label className="block text-[12px] font-medium mb-1.5" style={{ color: '#3A4A42' }}>
                  Event name <span style={{ color: '#B8423C' }}>*</span>
                </label>
                <input
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="e.g. AfriTech Summit 2026"
                  autoFocus
                  className="w-full h-11 px-4 rounded-lg text-[14px] outline-none transition"
                  style={{ background: 'white', border: `1px solid ${name.trim() ? '#1F4D3A' : '#E5E0D4'}`, color: '#0F1F18' }}
                  onKeyDown={e => { if (e.key === 'Enter' && canProceed) setStep(2); }}
                />
              </div>

              {/* Dates */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[12px] font-medium mb-1.5 flex items-center gap-1.5" style={{ color: '#3A4A42' }}>
                    <CalendarDays size={12} strokeWidth={2} />
                    Start
                  </label>
                  <input
                    type="datetime-local"
                    value={startsAt}
                    onChange={e => setStartsAt(e.target.value)}
                    className="w-full h-11 px-3 rounded-lg text-[13px] font-mono outline-none transition"
                    style={{ background: 'white', border: '1px solid #E5E0D4', color: '#0F1F18' }}
                  />
                </div>
                <div>
                  <label className="block text-[12px] font-medium mb-1.5 flex items-center gap-1.5" style={{ color: '#3A4A42' }}>
                    <Clock size={12} strokeWidth={2} />
                    End
                  </label>
                  <input
                    type="datetime-local"
                    value={endsAt}
                    onChange={e => setEndsAt(e.target.value)}
                    className="w-full h-11 px-3 rounded-lg text-[13px] font-mono outline-none transition"
                    style={{ background: 'white', border: '1px solid #E5E0D4', color: '#0F1F18' }}
                  />
                </div>
              </div>

              {/* Location */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-[12px] font-medium flex items-center gap-1.5" style={{ color: '#3A4A42' }}>
                    <MapPin size={12} strokeWidth={2} />
                    Location
                  </label>
                  <button
                    type="button"
                    onClick={() => setIsOnline(v => !v)}
                    className="flex items-center gap-1.5 text-[12px] font-medium transition"
                    style={{ color: isOnline ? '#1F4D3A' : '#6B7A72' }}
                  >
                    <Wifi size={12} strokeWidth={2} />
                    {isOnline ? 'Online event' : 'Mark as online'}
                  </button>
                </div>
                <input
                  value={venue}
                  onChange={e => setVenue(e.target.value)}
                  placeholder={isOnline ? 'Online — link shared after registration' : 'Venue name or address'}
                  disabled={isOnline}
                  className="w-full h-11 px-4 rounded-lg text-[14px] outline-none transition"
                  style={{
                    background: isOnline ? '#F0EDE8' : 'white',
                    border: '1px solid #E5E0D4',
                    color: isOnline ? '#6B7A72' : '#0F1F18',
                  }}
                />
              </div>
            </div>

            <div className="flex justify-end mt-8">
              <button
                onClick={() => canProceed && setStep(2)}
                disabled={!canProceed}
                className="inline-flex items-center gap-2 h-11 px-6 rounded-lg font-display font-medium text-[14px] text-white transition"
                style={{ background: canProceed ? '#1F4D3A' : '#E5E0D4', color: canProceed ? 'white' : '#6B7A72' }}
              >
                Continue
                <ArrowRight size={14} strokeWidth={2.2} />
              </button>
            </div>
          </div>
        )}

        {/* ── Step 2 — Setup choice ─────────────────────────────── */}
        {step === 2 && (
          <div>
            <button onClick={() => setStep(1)} className="flex items-center gap-2 text-[13px] mb-6 transition hover:text-[#1F4D3A]" style={{ color: '#6B7A72' }}>
              <ArrowLeft size={13} strokeWidth={2} />
              Back
            </button>

            <h1 className="font-display font-medium text-[28px] mb-1" style={{ color: '#0F1F18', letterSpacing: '-0.02em' }}>
              How would you like to start?
            </h1>
            <p className="text-[14px] mb-8" style={{ color: '#6B7A72' }}>
              Creating <strong style={{ color: '#0F1F18', fontFamily: 'var(--font-dm-sans, DM Sans, sans-serif)' }}>{name}</strong>. Choose your starting point — you can change anything later.
            </p>

            <div className="space-y-3">
              {/* Full event hub */}
              <button
                onClick={() => setChoice('hub')}
                className="w-full text-left rounded-xl p-5 transition"
                style={{
                  background: choice === 'hub' ? '#E8EFEB' : 'white',
                  border: `1px solid ${choice === 'hub' ? '#1F4D3A' : '#E5E0D4'}`,
                }}
              >
                <div className="flex items-start gap-4">
                  <div className="h-10 w-10 rounded-lg grid place-items-center shrink-0 mt-0.5" style={{ background: choice === 'hub' ? '#1F4D3A' : '#E8EFEB', color: choice === 'hub' ? 'white' : '#1F4D3A' }}>
                    <LayoutGrid size={18} strokeWidth={1.8} />
                  </div>
                  <div>
                    <div className="font-display font-medium text-[15px] mb-1" style={{ color: '#0F1F18' }}>
                      Set up the full event hub
                      <span className="ml-2 text-[10px] font-mono font-medium px-2 py-0.5 rounded-full" style={{ background: '#1F4D3A', color: '#E8C57E' }}>Recommended</span>
                    </div>
                    <p className="text-[13px]" style={{ color: '#6B7A72' }}>
                      Tickets, registration form, agenda, speakers, networking, Q&A, analytics — the full platform.
                    </p>
                  </div>
                </div>
              </button>

              {/* Card design first */}
              <button
                onClick={() => setChoice('card')}
                className="w-full text-left rounded-xl p-5 transition"
                style={{
                  background: choice === 'card' ? '#E8EFEB' : 'white',
                  border: `1px solid ${choice === 'card' ? '#1F4D3A' : '#E5E0D4'}`,
                }}
              >
                <div className="flex items-start gap-4">
                  <div className="h-10 w-10 rounded-lg grid place-items-center shrink-0 mt-0.5" style={{ background: choice === 'card' ? '#1F4D3A' : '#E8EFEB', color: choice === 'card' ? 'white' : '#1F4D3A' }}>
                    <Image size={18} strokeWidth={1.8} />
                  </div>
                  <div className="flex-1">
                    <div className="font-display font-medium text-[15px] mb-1" style={{ color: '#0F1F18' }}>
                      Upload a Karta Card design first
                    </div>
                    <p className="text-[13px]" style={{ color: '#6B7A72' }}>
                      Upload your card design image and go straight to the canvas editor to define zones.
                    </p>
                  </div>
                </div>

                {/* File upload — only shown when card is selected */}
                {choice === 'card' && (
                  <div className="mt-4 pt-4" style={{ borderTop: '1px solid #E5E0D4' }}>
                    {!cardPreview ? (
                      <div
                        onClick={() => fileRef.current?.click()}
                        className="rounded-lg border-2 border-dashed p-6 text-center cursor-pointer transition"
                        style={{ borderColor: 'rgba(31,77,58,0.25)', background: 'rgba(31,77,58,0.02)' }}
                      >
                        <p className="text-[13px]" style={{ color: '#1F4D3A' }}>
                          Click to upload PNG or JPG · Up to 20 MB
                        </p>
                      </div>
                    ) : (
                      <div className="flex items-center gap-3">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={cardPreview} alt="Card preview" className="h-16 w-16 rounded-lg object-cover border" style={{ borderColor: '#E5E0D4' }} />
                        <div className="flex-1 min-w-0">
                          <p className="text-[13px] font-medium truncate" style={{ color: '#0F1F18' }}>{cardFile?.name}</p>
                        </div>
                        <button onClick={e => { e.stopPropagation(); setCardFile(null); setCardPreview(null); }} className="text-[12px]" style={{ color: '#6B7A72' }}>Remove</button>
                      </div>
                    )}
                    <input ref={fileRef} type="file" accept="image/png,image/jpeg" className="hidden"
                      onChange={e => { const f = e.target.files?.[0]; if (f) handleCardFile(f); }} />
                  </div>
                )}
              </button>

              {/* Set up later */}
              <button
                onClick={() => setChoice('later')}
                className="w-full text-left rounded-xl p-4 transition"
                style={{
                  background: choice === 'later' ? '#E8EFEB' : 'white',
                  border: `1px solid ${choice === 'later' ? '#1F4D3A' : '#E5E0D4'}`,
                }}
              >
                <div className="flex items-center gap-3">
                  <div className="h-3 w-3 rounded-full border-2 shrink-0" style={{ borderColor: choice === 'later' ? '#1F4D3A' : '#C9C3B1', background: choice === 'later' ? '#1F4D3A' : 'transparent' }} />
                  <div>
                    <span className="font-display font-medium text-[14px]" style={{ color: '#0F1F18' }}>I&apos;ll set up later</span>
                    <span className="text-[13px] ml-2" style={{ color: '#6B7A72' }}>Just create the event.</span>
                  </div>
                </div>
              </button>
            </div>

            <div className="flex items-center justify-between mt-8">
              <Link href="/dashboard" className="text-[13px]" style={{ color: '#6B7A72' }}>
                Cancel
              </Link>
              <button
                onClick={handleCreate}
                disabled={loading || (choice === 'card' && !cardFile)}
                className="inline-flex items-center gap-2 h-11 px-7 rounded-lg font-display font-medium text-[14px] text-white transition disabled:opacity-50"
                style={{ background: '#1F4D3A' }}
              >
                {loading ? 'Creating…' : 'Create event →'}
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
