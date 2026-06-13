'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Check, ChevronLeft, ArrowRight, Plus, X, CalendarDays, Ticket, Layout } from 'lucide-react';

const STEPS = ['Welcome', 'Organization', 'Brand', 'First event', 'Invite team', 'Done'];

const EVENT_TYPES = [
  { id: 'tech',       label: 'Tech conference' },
  { id: 'festival',   label: 'Festival / concert' },
  { id: 'corporate',  label: 'Corporate / brand' },
  { id: 'ngo',        label: 'NGO / community' },
  { id: 'religious',  label: 'Religious' },
  { id: 'other',      label: 'Something else' },
];

const PRESETS = [
  { id: 'gold',  label: 'Forest & Gold',  grad: 'linear-gradient(155deg,#0D1F17,#1F4D3A 70%,#163828)', ring: '#E8C57E' },
  { id: 'plum',  label: 'Plum',           grad: 'linear-gradient(155deg,#14101f,#3a2a55 75%,#241733)', ring: '#C9A45E' },
  { id: 'clay',  label: 'Clay',           grad: 'linear-gradient(155deg,#1f120c,#5a3320 75%,#2b160c)', ring: '#E8C57E' },
  { id: 'ocean', label: 'Ocean',          grad: 'linear-gradient(155deg,#0c1420,#1e3a55 75%,#0b1a26)', ring: '#E8C57E' },
];

type Accent = { id: string; label: string; grad: string; ring: string };

const INPUT = 'w-full bg-white border border-[#E5E0D4] rounded-xl px-3.5 py-3 text-[14.5px] text-[#0F1F18] placeholder:text-[#6B7A72]/60 focus:border-[#E8C57E] outline-none transition-colors';
const LABEL = 'block  text-[9.5px] tracking-[0.14em] uppercase text-[#6B7A72] mb-1.5';

function MiniCard({ accent, name = 'Your Name', role = 'Attendee', eventLabel = 'Africa Tech Fest' }: {
  accent: Accent; name?: string; role?: string; eventLabel?: string;
}) {
  const w = 220;
  const h = w * 1.42;
  return (
    <div
      className="rounded-2xl overflow-hidden relative shrink-0"
      style={{ width: w, height: h, background: accent.grad, boxShadow: '0 24px 56px -18px rgba(13,31,23,0.6)' }}
    >
      <div className="absolute inset-0" style={{ background: 'radial-gradient(60% 45% at 50% 40%, rgba(232,197,126,0.22), transparent 65%)' }} />
      <div className="relative h-full flex flex-col" style={{ padding: w * 0.085 }}>
        <div className="flex items-center justify-between">
          <span className="font-display font-semibold" style={{ color: accent.ring, fontSize: w * 0.045 }}>{eventLabel}</span>
          <span className="" style={{ color: 'rgba(255,255,255,0.6)', fontSize: w * 0.037 }}>2026</span>
        </div>
        <div
          className="rounded-full mx-auto mt-auto grid place-items-center text-white font-display font-semibold"
          style={{ width: w * 0.36, height: w * 0.36, border: `2px solid ${accent.ring}`, background: 'linear-gradient(135deg,#C9A45E,#1F4D3A)', fontSize: w * 0.11 }}
        >
          {name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase() || 'AO'}
        </div>
        <div className="text-center text-white font-display font-medium mt-3" style={{ fontSize: w * 0.085 }}>
          {name || 'Your Name'}
        </div>
        <div className="text-center" style={{ color: 'rgba(255,255,255,0.7)', fontSize: w * 0.047, marginTop: 2 }}>
          {role || 'Attendee'}
        </div>
        <div className="flex items-center justify-between mt-auto" style={{ paddingTop: w * 0.05, borderTop: `1px solid ${accent.ring}40` }}>
          <span className="" style={{ color: accent.ring, fontSize: w * 0.04 }}>VIP</span>
          <span className="" style={{ color: 'rgba(255,255,255,0.6)', fontSize: w * 0.04 }}>12 MAR</span>
        </div>
      </div>
    </div>
  );
}

function ColorRow({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div>
      <label className={LABEL}>{label}</label>
      <div className="flex items-center gap-2">
        <label
          className="w-9 h-9 rounded-lg border border-[#E5E0D4] cursor-pointer shrink-0 overflow-hidden"
          style={{ background: value }}
        >
          <input type="color" value={value} onChange={e => onChange(e.target.value)} className="opacity-0 w-full h-full cursor-pointer" />
        </label>
        <input
          className={INPUT}
          value={value}
          maxLength={7}
          onChange={e => {
            const v = e.target.value;
            if (/^#[0-9a-fA-F]{0,6}$/.test(v)) onChange(v.length === 7 ? v : v);
          }}
        />
      </div>
    </div>
  );
}

export default function OnboardingClient() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  // Step 0 — event type
  const [evType, setEvType] = useState('tech');

  // Step 1 — org + logo
  const [orgName, setOrgName] = useState('');
  const [region, setRegion]   = useState('');
  const [currency, setCurrency] = useState('USD');
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);

  // Step 2 — brand
  const [accentId, setAccentId] = useState('gold');
  // Custom color state
  const [customMode, setCustomMode] = useState<'solid' | 'gradient'>('gradient');
  const [customSolid, setCustomSolid] = useState('#1F4D3A');
  const [customFrom, setCustomFrom]   = useState('#0D1F17');
  const [customTo, setCustomTo]       = useState('#2A6A50');
  const [customRing, setCustomRing]   = useState('#E8C57E');

  const customAccent: Accent = {
    id: 'custom',
    label: 'Custom',
    grad: customMode === 'solid' ? customSolid : `linear-gradient(155deg,${customFrom},${customTo})`,
    ring: customRing,
  };
  const ALL_ACCENTS: Accent[] = [...PRESETS, customAccent];
  const accent = ALL_ACCENTS.find(a => a.id === accentId) ?? PRESETS[0];

  // Step 3 — first event
  const [evName, setEvName]   = useState('');
  const [evStart, setEvStart] = useState('');
  const [evEnd, setEvEnd]     = useState('');
  const [venue, setVenue]     = useState('');

  // Step 4 — invite
  const [emails, setEmails]   = useState<string[]>([]);
  const [inviteInput, setInviteInput] = useState('');

  const addEmail = () => {
    const v = inviteInput.trim();
    if (v && !emails.includes(v)) setEmails(prev => [...prev, v]);
    setInviteInput('');
  };

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setLogoFile(file);
    setLogoPreview(URL.createObjectURL(file));
  };

  const next = () => setStep(s => Math.min(STEPS.length - 1, s + 1));
  const back = () => setStep(s => Math.max(0, s - 1));

  const handleFinish = async () => {
    setSubmitting(true);
    try {
      if (logoFile) {
        const fd = new FormData();
        fd.append('file', logoFile);
        fd.append('variant', 'light');
        await fetch('/api/brand/logo', { method: 'POST', body: fd });
      }
      await fetch('/api/onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ evType, orgName, region, currency, accent: accentId, evName, evStart, evEnd, venue, inviteEmails: emails }),
      });
    } catch {}
    router.push('/dashboard');
  };

  const DONE = step === STEPS.length - 1;

  return (
    <div className="min-h-screen flex flex-col lg:grid" style={{ gridTemplateColumns: '300px 1fr' }}>

      {/* ── Left progress panel ── */}
      <div
        className="hidden lg:flex flex-col px-8 py-8 relative overflow-hidden"
        style={{ background: 'linear-gradient(165deg,#0D1F17,#1F4D3A 65%,#235741)', color: '#FAF6EE' }}
      >
        <div className="absolute inset-0" style={{ background: 'radial-gradient(50% 40% at 80% 12%, rgba(232,197,126,0.22), transparent 60%)' }} />

        <div className="relative flex items-center gap-2.5 mb-12">
          <span className="w-8 h-8 rounded-lg" style={{ background: 'linear-gradient(135deg,#FAF6EE,#E8C57E)' }} />
          <span className="font-display text-[20px] font-bold tracking-tight">Karta</span>
        </div>

        <div className="relative flex-1">
          <div className=" text-[10px] tracking-[0.2em] uppercase mb-5" style={{ color: 'rgba(232,197,126,0.8)' }}>
            Get set up
          </div>
          <div className="flex flex-col gap-1">
            {STEPS.slice(0, 5).map((s, i) => {
              const done   = i < step;
              const active = i === step;
              return (
                <div key={i} className="flex items-center gap-3 py-2">
                  <span
                    className="w-6 h-6 rounded-full grid place-items-center  text-[11px] shrink-0"
                    style={{
                      background: done ? '#E8C57E' : active ? '#FAF6EE' : 'rgba(250,246,238,0.1)',
                      color: done || active ? '#163828' : 'rgba(250,246,238,0.5)',
                      border: done || active ? 'none' : '1px solid rgba(250,246,238,0.2)',
                    }}
                  >
                    {done ? <Check size={11} strokeWidth={2.5} /> : i + 1}
                  </span>
                  <span
                    className="text-[13.5px]"
                    style={{ color: active ? '#FAF6EE' : done ? 'rgba(250,246,238,0.7)' : 'rgba(250,246,238,0.45)', fontWeight: active ? 500 : 400 }}
                  >
                    {s}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        <p className="relative text-[12.5px] leading-relaxed" style={{ color: 'rgba(250,246,238,0.55)' }}>
          Takes about 2 minutes.<br />You can change anything later.
        </p>
      </div>

      {/* ── Right content ── */}
      <div className="flex flex-col min-h-screen" style={{ background: '#EFE9DC' }}>
        {/* Mobile progress bar */}
        <div className="lg:hidden h-1.5" style={{ background: '#E5E0D4' }}>
          <div
            className="h-full transition-all"
            style={{ width: `${(step / (STEPS.length - 1)) * 100}%`, background: '#1F4D3A' }}
          />
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-[600px] mx-auto px-6 sm:px-10 py-10 lg:py-16">

            {/* Step 0 — Welcome */}
            {step === 0 && (
              <div>
                <h1 className="font-display text-[30px] font-semibold tracking-[-0.025em]" style={{ color: '#1F4D3A' }}>
                  Welcome to Karta 👋
                </h1>
                <p className="mt-3 text-[15px] leading-[1.6]" style={{ color: '#3A4A42' }}>
                  Let&apos;s tailor your workspace. What kind of events do you run?
                </p>
                <div className="mt-7 grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {EVENT_TYPES.map(t => {
                    const on = evType === t.id;
                    return (
                      <button
                        key={t.id}
                        onClick={() => setEvType(t.id)}
                        className="flex items-center gap-3 text-left rounded-2xl border p-4 transition-all"
                        style={{
                          borderColor: on ? '#1F4D3A' : '#E5E0D4',
                          background: on ? 'rgba(232,239,235,0.5)' : 'white',
                          boxShadow: on ? '0 0 0 1px rgba(31,77,58,0.3)' : 'none',
                        }}
                      >
                        <span
                          className="w-9 h-9 rounded-xl grid place-items-center shrink-0 text-[18px]"
                          style={{ background: on ? '#1F4D3A' : '#E8EFEB', color: on ? '#FAF6EE' : '#1F4D3A' }}
                        >
                          {t.id === 'tech' ? '💻' : t.id === 'festival' ? '🎵' : t.id === 'corporate' ? '🏢' : t.id === 'ngo' ? '🌍' : t.id === 'religious' ? '🕊️' : '✨'}
                        </span>
                        <span className="text-[13px] font-medium" style={{ color: '#0F1F18' }}>{t.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Step 1 — Organization */}
            {step === 1 && (
              <div>
                <h1 className="font-display text-[28px] font-semibold tracking-[-0.025em]" style={{ color: '#1F4D3A' }}>
                  Set up your organization
                </h1>
                <p className="mt-3 text-[15px] leading-[1.6]" style={{ color: '#3A4A42' }}>
                  This is the brand attendees will see across your events.
                </p>
                <div className="mt-7 flex flex-col gap-4">
                  {/* Logo upload */}
                  <div className="flex items-center gap-4">
                    <label
                      className="w-16 h-16 rounded-2xl border-2 border-dashed grid place-items-center shrink-0 cursor-pointer transition-colors hover:border-[#E8C57E] overflow-hidden"
                      style={{
                        borderColor: logoPreview ? 'transparent' : 'rgba(31,77,58,0.35)',
                        background: logoPreview ? 'transparent' : 'white',
                        color: '#1F4D3A',
                      }}
                    >
                      <input
                        ref={logoInputRef}
                        type="file"
                        accept="image/png,image/jpeg,image/webp,image/svg+xml"
                        className="hidden"
                        onChange={handleLogoChange}
                      />
                      {logoPreview ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={logoPreview} alt="Logo preview" className="w-full h-full object-cover rounded-2xl" />
                      ) : (
                        <Plus size={20} />
                      )}
                    </label>
                    <div className="flex-1">
                      <div className="text-[13.5px] font-medium" style={{ color: '#0F1F18' }}>Organization logo</div>
                      <div className="text-[12px] mt-0.5" style={{ color: '#6B7A72' }}>PNG, JPG or SVG · max 5 MB</div>
                      {logoPreview && (
                        <button
                          onClick={() => { setLogoFile(null); setLogoPreview(null); if (logoInputRef.current) logoInputRef.current.value = ''; }}
                          className="mt-1 text-[12px] transition-colors"
                          style={{ color: '#B8423C' }}
                        >
                          Remove
                        </button>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className={LABEL}>Organization name</label>
                    <input className={INPUT} value={orgName} onChange={e => setOrgName(e.target.value)} placeholder="e.g. Sahel Ventures" />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className={LABEL}>Region</label>
                      <input className={INPUT} value={region} onChange={e => setRegion(e.target.value)} placeholder="East Africa" />
                    </div>
                    <div>
                      <label className={LABEL}>Currency</label>
                      <select className={INPUT} value={currency} onChange={e => setCurrency(e.target.value)}>
                        {['USD', 'EUR', 'GBP', 'KES', 'ETB', 'DJF', 'NGN', 'GHS', 'ZAR'].map(c => (
                          <option key={c} value={c}>{c}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Step 2 — Brand */}
            {step === 2 && (
              <div>
                <h1 className="font-display text-[28px] font-semibold tracking-[-0.025em]" style={{ color: '#1F4D3A' }}>
                  Pick your brand look
                </h1>
                <p className="mt-3 text-[15px] leading-[1.6]" style={{ color: '#3A4A42' }}>
                  This styles your event pages and the Karta Card every attendee shares.
                </p>

                <div className="mt-7 grid sm:grid-cols-[1fr_240px] gap-6 items-start">
                  {/* Theme list */}
                  <div className="flex flex-col gap-2">
                    {ALL_ACCENTS.map(a => {
                      const on = accentId === a.id;
                      return (
                        <div key={a.id}>
                          <button
                            onClick={() => setAccentId(a.id)}
                            className="w-full flex items-center gap-3 rounded-2xl border p-3 transition-all"
                            style={{
                              borderColor: on ? '#1F4D3A' : '#E5E0D4',
                              background: 'white',
                              boxShadow: on ? '0 0 0 1px rgba(31,77,58,0.3)' : 'none',
                            }}
                          >
                            <span
                              className="w-10 h-10 rounded-xl shrink-0"
                              style={{ background: a.id === 'custom' ? (customMode === 'solid' ? customSolid : `linear-gradient(135deg,${customFrom},${customTo})`) : a.grad }}
                            />
                            <span className="text-[13.5px] font-medium" style={{ color: '#0F1F18' }}>{a.label}</span>
                            {on && <Check size={16} strokeWidth={2.5} className="ml-auto" style={{ color: '#1F4D3A' }} />}
                          </button>

                          {/* Custom color controls — inline below the Custom button */}
                          {a.id === 'custom' && on && (
                            <div className="mt-2 p-4 rounded-2xl border border-[#E5E0D4] flex flex-col gap-3" style={{ background: '#FDFAF6' }}>
                              {/* Solid / Gradient toggle */}
                              <div className="flex gap-1 p-1 rounded-lg" style={{ background: '#F0EDE5' }}>
                                {(['solid', 'gradient'] as const).map(m => (
                                  <button
                                    key={m}
                                    onClick={() => setCustomMode(m)}
                                    className="flex-1 py-1.5 rounded-md text-[12.5px] font-medium capitalize transition-all"
                                    style={customMode === m
                                      ? { background: '#1F4D3A', color: 'white' }
                                      : { color: '#6B7A72' }}
                                  >
                                    {m}
                                  </button>
                                ))}
                              </div>

                              {customMode === 'solid' ? (
                                <ColorRow label="Card color" value={customSolid} onChange={setCustomSolid} />
                              ) : (
                                <div className="grid grid-cols-2 gap-3">
                                  <ColorRow label="From" value={customFrom} onChange={setCustomFrom} />
                                  <ColorRow label="To" value={customTo} onChange={setCustomTo} />
                                </div>
                              )}

                              <ColorRow label="Accent color" value={customRing} onChange={setCustomRing} />
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* Card preview */}
                  <div className="hidden sm:flex justify-center sticky top-8">
                    <MiniCard
                      accent={accent}
                      name={orgName || 'Adaeze O.'}
                      role="Founder · Sahel"
                      eventLabel={evName || 'Africa Tech Fest'}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Step 3 — First event */}
            {step === 3 && (
              <div>
                <h1 className="font-display text-[28px] font-semibold tracking-[-0.025em]" style={{ color: '#1F4D3A' }}>
                  Create your first event
                </h1>
                <p className="mt-3 text-[15px] leading-[1.6]" style={{ color: '#3A4A42' }}>
                  Just the essentials — you can flesh it out in the dashboard.
                </p>
                <div className="mt-7 flex flex-col gap-4">
                  <div>
                    <label className={LABEL}>Event name</label>
                    <input className={INPUT} value={evName} onChange={e => setEvName(e.target.value)} placeholder="Africa Tech Festival 2026" />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className={LABEL}>Starts</label>
                      <input type="date" className={INPUT} value={evStart} onChange={e => setEvStart(e.target.value)} />
                    </div>
                    <div>
                      <label className={LABEL}>Ends</label>
                      <input type="date" className={INPUT} value={evEnd} onChange={e => setEvEnd(e.target.value)} />
                    </div>
                  </div>
                  <div>
                    <label className={LABEL}>Venue</label>
                    <input className={INPUT} value={venue} onChange={e => setVenue(e.target.value)} placeholder="Djibouti Conference Centre" />
                  </div>
                </div>
              </div>
            )}

            {/* Step 4 — Invite team */}
            {step === 4 && (
              <div>
                <h1 className="font-display text-[28px] font-semibold tracking-[-0.025em]" style={{ color: '#1F4D3A' }}>
                  Invite your team
                </h1>
                <p className="mt-3 text-[15px] leading-[1.6]" style={{ color: '#3A4A42' }}>
                  Bring in co-organizers and check-in staff. Optional — add them anytime.
                </p>
                <div className="mt-7 flex flex-col gap-3">
                  {emails.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {emails.map((e, i) => (
                        <span
                          key={i}
                          className="inline-flex items-center gap-1.5 rounded-full pl-3 pr-2 py-1.5 text-[12.5px] font-medium"
                          style={{ background: '#E8EFEB', color: '#1F4D3A' }}
                        >
                          {e}
                          <button onClick={() => setEmails(prev => prev.filter((_, j) => j !== i))} style={{ color: 'rgba(31,77,58,0.6)' }}>
                            <X size={13} />
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                  <div>
                    <label className={LABEL}>Invite by email</label>
                    <input
                      type="email"
                      className={INPUT}
                      value={inviteInput}
                      onChange={e => setInviteInput(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addEmail())}
                      placeholder="teammate@company.com"
                    />
                  </div>
                  <button onClick={addEmail} className="text-[13px] font-medium text-left" style={{ color: '#1F4D3A' }}>
                    + Add another
                  </button>
                </div>
              </div>
            )}

            {/* Step 5 — Done */}
            {step === 5 && (
              <div className="text-center py-6">
                <div
                  className="inline-grid place-items-center w-16 h-16 rounded-2xl mb-6"
                  style={{ background: '#E8EFEB', color: '#1F4D3A' }}
                >
                  <Check size={30} strokeWidth={2} />
                </div>
                <h1 className="font-display text-[30px] font-semibold tracking-[-0.025em]" style={{ color: '#1F4D3A' }}>
                  You&apos;re all set{orgName ? `, ${orgName.split(' ')[0]}` : ''}.
                </h1>
                <p className="mt-3 text-[15px] leading-[1.6] max-w-[420px] mx-auto" style={{ color: '#3A4A42' }}>
                  Your workspace{evName ? ` and ${evName}` : ''} are ready. Publish your event page, open registration, and watch the cards roll in.
                </p>
                <div className="mt-8 grid sm:grid-cols-3 gap-3 text-left">
                  {[
                    { label: 'Publish event page', icon: <Layout size={16} />, href: '/dashboard' },
                    { label: 'Set up tickets',      icon: <Ticket size={16} />, href: '/dashboard' },
                    { label: 'Build your agenda',   icon: <CalendarDays size={16} />, href: '/dashboard' },
                  ].map((a, i) => (
                    <div
                      key={i}
                      className="rounded-2xl border p-4"
                      style={{ background: 'white', borderColor: '#E5E0D4' }}
                    >
                      <span
                        className="w-9 h-9 rounded-lg grid place-items-center mb-3"
                        style={{ background: '#E8EFEB', color: '#1F4D3A' }}
                      >
                        {a.icon}
                      </span>
                      <div className="text-[13px] font-medium leading-tight" style={{ color: '#0F1F18' }}>{a.label}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ── Footer nav ── */}
        <div
          className="border-t px-6 sm:px-10 py-4"
          style={{ borderColor: '#E5E0D4', background: 'rgba(239,233,220,0.8)', backdropFilter: 'blur(8px)' }}
        >
          <div className="max-w-[600px] mx-auto flex items-center justify-between">
            {step > 0 && step < 5 ? (
              <button
                onClick={back}
                className="inline-flex items-center gap-1.5 text-[13.5px] transition-colors"
                style={{ color: '#6B7A72' }}
              >
                <ChevronLeft size={15} /> Back
              </button>
            ) : <span />}

            {!DONE ? (
              <div className="flex items-center gap-3">
                {step === 4 && (
                  <button onClick={next} className="text-[13.5px]" style={{ color: '#6B7A72' }}>
                    Skip
                  </button>
                )}
                <button
                  onClick={next}
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-colors hover:bg-[#163828]"
                  style={{ background: '#1F4D3A', color: '#FAF6EE', boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.15), 0 4px 12px rgba(31,77,58,0.2)' }}
                >
                  {step === 0 ? 'Get started' : 'Continue'}
                  <ArrowRight size={16} />
                </button>
              </div>
            ) : (
              <button
                onClick={handleFinish}
                disabled={submitting}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-colors hover:bg-[#163828] mx-auto disabled:opacity-60"
                style={{ background: '#1F4D3A', color: '#FAF6EE', boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.15), 0 4px 12px rgba(31,77,58,0.2)' }}
              >
                {submitting ? 'Setting up…' : 'Enter your dashboard'}
                <ArrowRight size={16} />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Responsive: hide left panel on mobile */}
      <style>{`
        @media (max-width: 1024px) {
          .min-h-screen.grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
}
