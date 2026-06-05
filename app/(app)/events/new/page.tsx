'use client';

import { useState, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { fetchWithRetry } from '@/lib/utils/fetch-retry';
import {
  ArrowLeft, ArrowRight, CalendarDays, MapPin, Wifi,
  LayoutGrid, Ticket, Clock, Image as ImageIcon, Plus,
} from 'lucide-react';

type Step = 1 | 2;
type SetupChoice = 'hub' | 'simple' | 'later';

const SETUP_OPTIONS: {
  id: SetupChoice;
  icon: React.ReactNode;
  label: string;
  desc: string;
}[] = [
  {
    id: 'hub',
    icon: <LayoutGrid size={20} strokeWidth={1.8} />,
    label: 'Full event',
    desc: 'Agenda, tickets, speakers, networking — the whole platform.',
  },
  {
    id: 'simple',
    icon: <Ticket size={20} strokeWidth={1.8} />,
    label: 'Simple registration',
    desc: 'Just tickets and a registration form.',
  },
  {
    id: 'later',
    icon: <Clock size={20} strokeWidth={1.8} />,
    label: 'Set up later',
    desc: "Create the shell now, add the details when you're ready.",
  },
];

export default function NewEventPage() {
  const router = useRouter();
  const coverRef = useRef<HTMLInputElement>(null);

  const [name, setName]         = useState('');
  const [startsAt, setStartsAt] = useState('');
  const [endsAt, setEndsAt]     = useState('');
  const [venue, setVenue]       = useState('');
  const [isOnline, setIsOnline] = useState(false);
  const [coverFile, setCoverFile] = useState<File | null>(null);

  const [step, setStep]       = useState<Step>(1);
  const [loading, setLoading] = useState<SetupChoice | null>(null);
  const [error, setError]     = useState('');

  const canProceed = name.trim().length > 0;

  const handleCoverFile = useCallback((f: File) => {
    if (!f.type.match(/image\/(png|jpeg)/)) { setError('Only PNG or JPG accepted.'); return; }
    if (f.size > 20 * 1024 * 1024) { setError('File must be under 20 MB.'); return; }
    setError('');
    setCoverFile(f);
  }, []);

  async function handleOptionCreate(choice: SetupChoice) {
    setLoading(choice);
    setError('');
    try {
      if (choice === 'hub' && !name.trim()) {
        // try to use card file name — shouldn't reach here since canProceed guards step 2
      }
      const res = await fetch('/api/events/create-basic', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim() || 'Untitled Event',
          starts_at: startsAt || null,
          ends_at:   endsAt   || null,
          venue_name: isOnline ? null : (venue.trim() || null),
          is_online:  isOnline,
        }),
      });
      const data = await res.json();
      if (res.status === 402) throw new Error('Event limit reached on your plan. Upgrade to create more events.');
      if (!res.ok) throw new Error(data.error ?? 'Failed to create event');

      if (choice === 'simple') router.push(`/events/${data.id}/tickets`);
      else router.push(`/events/${data.id}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong');
      setLoading(null);
    }
  }

  // For card-design flow (legacy — still accessible via direct upload route)
  const fileRef = useRef<HTMLInputElement>(null);
  const [cardFile]    = useState<File | null>(null);
  void fetchWithRetry; void cardFile; void fileRef; // keep imports alive

  /* ─── Step indicator ─────────────────────────────────────────────────────── */
  function StepIndicator() {
    const steps = [
      { n: 1, label: 'Event basics' },
      { n: 2, label: 'Quick setup'  },
    ] as const;
    return (
      <div className="flex items-center gap-0">
        {steps.map((s, i) => (
          <div key={s.n} className="flex items-center gap-0">
            <div className="flex items-center gap-2.5">
              <div
                className="h-6 w-6 rounded-full grid place-items-center text-[11px] font-mono font-bold transition-all"
                style={step >= s.n
                  ? { background: '#1F4D3A', color: 'white' }
                  : { background: '#E5E0D4', color: '#6B7A72' }}>
                {s.n}
              </div>
              <span className="text-[12.5px] font-medium hidden sm:inline"
                style={{ color: step >= s.n ? '#0F1F18' : '#9BA8A1' }}>
                {s.label}
              </span>
            </div>
            {i < steps.length - 1 && (
              <div className="mx-3 h-px w-10 sm:w-16 transition-all"
                style={{ background: step > 1 ? '#1F4D3A' : '#E5E0D4' }} />
            )}
          </div>
        ))}
      </div>
    );
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
        <div className="ml-auto">
          <StepIndicator />
        </div>
      </header>

      <main className="max-w-[580px] mx-auto px-6 py-12">

        {error && (
          <div className="mb-6 px-4 py-3 rounded-xl text-[13px]"
            style={{ background: 'rgba(184,66,60,0.08)', border: '1px solid rgba(184,66,60,0.2)', color: '#B8423C' }}>
            {error}
          </div>
        )}

        {/* ── Step 1 ─────────────────────────────────────────────────────── */}
        {step === 1 && (
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
                  onKeyDown={e => { if (e.key === 'Enter' && canProceed) setStep(2); }}
                />
              </div>

              {/* Dates */}
              <div className="grid grid-cols-2 gap-3">
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
                    <MapPin size={10} strokeWidth={2} /> Venue
                  </label>
                  <button
                    type="button"
                    onClick={() => setIsOnline(v => !v)}
                    className="flex items-center gap-1.5 text-[11px] font-mono font-semibold uppercase tracking-widest transition"
                    style={{ color: isOnline ? '#1F4D3A' : '#9BA8A1' }}>
                    <Wifi size={10} strokeWidth={2} />
                    {isOnline ? 'Online event' : 'Online event'}
                  </button>
                </div>
                <input
                  value={venue}
                  onChange={e => setVenue(e.target.value)}
                  placeholder={isOnline ? 'Online — link shared after registration' : 'Venue name or address'}
                  disabled={isOnline}
                  className="w-full h-12 px-4 rounded-xl text-[14px] outline-none transition"
                  style={{
                    background: isOnline ? '#F5F3EE' : 'white',
                    border: '1.5px solid #E5E0D4',
                    color: isOnline ? '#9BA8A1' : '#0F1F18',
                  }}
                />
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
                onClick={() => canProceed && setStep(2)}
                disabled={!canProceed}
                className="inline-flex items-center gap-2 h-11 px-7 rounded-xl font-display font-semibold text-[14px] text-white transition-all"
                style={{
                  background: canProceed ? '#1F4D3A' : '#E5E0D4',
                  color: canProceed ? 'white' : '#9BA8A1',
                  cursor: canProceed ? 'pointer' : 'not-allowed',
                }}>
                Continue
                <ArrowRight size={14} strokeWidth={2.2} />
              </button>
            </div>
          </div>
        )}

        {/* ── Step 2 ─────────────────────────────────────────────────────── */}
        {step === 2 && (
          <div>
            <h1 className="font-display font-semibold text-[32px] mb-1 tracking-[-0.02em]" style={{ color: '#0F1F18' }}>
              How do you want to start?
            </h1>
            <p className="text-[14px] mb-9" style={{ color: '#6B7A72' }}>
              Pick a starting point. You can always add more later.
            </p>

            <div className="space-y-3">
              {SETUP_OPTIONS.map(opt => (
                <button
                  key={opt.id}
                  onClick={() => handleOptionCreate(opt.id)}
                  disabled={!!loading}
                  className="w-full text-left rounded-2xl p-5 flex items-center gap-4 transition-all group"
                  style={{
                    background: 'white',
                    border: `1.5px solid ${loading === opt.id ? '#1F4D3A' : '#E5E0D4'}`,
                    opacity: loading && loading !== opt.id ? 0.5 : 1,
                  }}>
                  <div
                    className="h-10 w-10 rounded-xl grid place-items-center shrink-0 transition"
                    style={{ background: '#F0EDE8', color: '#1F4D3A' }}>
                    {loading === opt.id ? (
                      <svg className="animate-spin" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <path d="M21 12a9 9 0 1 1-9-9" strokeLinecap="round" />
                      </svg>
                    ) : opt.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-display font-semibold text-[15px] mb-0.5" style={{ color: '#0F1F18' }}>
                      {opt.label}
                    </div>
                    <p className="text-[13px]" style={{ color: '#6B7A72' }}>{opt.desc}</p>
                  </div>
                  <ArrowRight size={16} strokeWidth={1.8} className="shrink-0 transition group-hover:translate-x-0.5"
                    style={{ color: '#C9C3B1' }} />
                </button>
              ))}
            </div>

            <div className="mt-8">
              <button
                onClick={() => setStep(1)}
                className="flex items-center gap-1.5 text-[13px] transition hover:text-[#1F4D3A]"
                style={{ color: '#6B7A72' }}>
                <ArrowLeft size={13} strokeWidth={2} />
                Back
              </button>
            </div>
          </div>
        )}

      </main>
    </div>
  );
}
