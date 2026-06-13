'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

const INTERESTS = [
  'Tech', 'Music', 'Business', 'Culture', 'Food & drink',
  'Sports', 'Health', 'Film', 'Faith', 'Family', 'Education', 'Fashion',
];

const CITIES = [
  { name: 'Djibouti City, Djibouti', count: 42 },
  { name: 'Nairobi, Kenya', count: 186 },
  { name: 'Addis Ababa, Ethiopia', count: 94 },
  { name: 'Dar es Salaam, Tanzania', count: 73 },
];

interface Props {
  userId: string;
  userEmail: string;
  userName: string;
}

export default function OnboardingWizard({ userId, userEmail, userName }: Props) {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [interests, setInterests] = useState<string[]>([]);
  const [city, setCity] = useState('');
  const [citySearch, setCitySearch] = useState('');
  const [showCitySearch, setShowCitySearch] = useState(false);
  const [phone, setPhone] = useState('');
  const [savingPhone, setSavingPhone] = useState(false);
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);

  function toggleInterest(i: string) {
    setInterests(prev => prev.includes(i) ? prev.filter(x => x !== i) : [...prev, i]);
  }

  async function finish(skipPhone = false) {
    setSaving(true);
    const supabase = createClient();
    await supabase.from('profiles').update({
      interests,
      city: city || null,
      phone: skipPhone ? null : (phone || null),
      onboarding_done: true,
    }).eq('id', userId);
    setSaving(false);
    setDone(true);
  }

  async function verifyPhone() {
    setSavingPhone(true);
    const supabase = createClient();
    await supabase.from('profiles').update({ phone }).eq('id', userId);
    setSavingPhone(false);
    await finish();
  }

  const firstName = userName?.split(' ')[0] || userEmail.split('@')[0];
  const interestCount = interests.length;

  // ── Done state ──
  if (done) {
    return (
      <div className="text-center pt-6">
        <div className="w-[72px] h-[72px] rounded-full flex items-center justify-center mx-auto mt-8"
          style={{ background: '#2D7A4F' }}>
          <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3">
            <path d="M4 12.5l5.5 5.5L20 6.5" />
          </svg>
        </div>
        <h1 className="mt-6 text-[30px] font-normal" style={{ fontFamily: '"DM Sans", sans-serif', letterSpacing: '-0.024em', color: '#1F4D3A' }}>
          Your feed is ready, {firstName}
        </h1>
        <p className="mt-2 text-[14px] leading-relaxed" style={{ color: '#6B7A72' }}>
          {interests.slice(0, 3).join(', ')} {city ? `in ${city.split(',')[0]}` : ''} — events are waiting for you.
        </p>
        <button
          onClick={() => router.push('/my-tickets')}
          className="mt-7 h-12 px-8 rounded-lg font-medium text-[15px] text-white transition hover:opacity-90"
          style={{ background: '#1F4D3A', fontFamily: '"DM Sans", sans-serif' }}
        >
          Start discovering
        </button>
      </div>
    );
  }

  return (
    <div>
      {/* Progress bar */}
      <div className="flex items-center gap-2">
        {[1, 2, 3].map(s => (
          <div key={s} className="flex-1 h-1 rounded-full transition-colors"
            style={{ background: s <= step ? '#1F4D3A' : '#E5E0D4' }} />
        ))}
        <span className="ml-2.5 text-[12px] shrink-0" style={{ fontFamily: 'Inter, system-ui, sans-serif', color: '#6B7A72' }}>
          {step} / 3
        </span>
      </div>

      {/* ── Step 1: Interests ── */}
      {step === 1 && (
        <div>
          <h1 className="mt-9 text-[30px] font-normal" style={{ fontFamily: '"DM Sans", sans-serif', letterSpacing: '-0.024em', color: '#1F4D3A' }}>
            What are you into?
          </h1>
          <p className="mt-2 text-[14px] leading-relaxed" style={{ color: '#6B7A72' }}>
            Pick at least 3. This builds your &ldquo;For you&rdquo; feed — you can change it anytime.
          </p>

          <div className="flex flex-wrap gap-2.5 mt-7">
            {INTERESTS.map(i => (
              <button
                key={i}
                onClick={() => toggleInterest(i)}
                className="h-11 px-5 flex items-center gap-2 rounded-full font-medium text-[14px] transition-all"
                style={{
                  border: `1px solid ${interests.includes(i) ? '#1F4D3A' : '#E5E0D4'}`,
                  background: interests.includes(i) ? '#1F4D3A' : '#FFFFFF',
                  color: interests.includes(i) ? '#FFFFFF' : '#3A4A42',
                  fontFamily: '"DM Sans", sans-serif',
                }}
              >
                {interests.includes(i) && (
                  <span style={{ fontSize: 11, color: '#E8C57E' }}>✓</span>
                )}
                {i}
              </button>
            ))}
          </div>

          <p className="mt-4 text-[12px]" style={{ fontFamily: 'Inter, system-ui, sans-serif', color: '#6B7A72' }}>
            <strong style={{ color: '#1F4D3A', fontWeight: 500 }}>{interestCount}</strong>{' '}
            {interestCount >= 3 ? 'selected · nice — that\'s enough to start' : `selected · pick ${3 - interestCount} more`}
          </p>

          <div className="flex justify-end mt-11">
            <button
              onClick={() => setStep(2)}
              disabled={interestCount < 3}
              className="h-10 px-5 rounded-lg font-medium text-[14px] text-white transition hover:opacity-90 disabled:opacity-40"
              style={{ background: '#1F4D3A', fontFamily: '"DM Sans", sans-serif' }}
            >
              Continue
            </button>
          </div>
        </div>
      )}

      {/* ── Step 2: City ── */}
      {step === 2 && (
        <div>
          <h1 className="mt-9 text-[30px] font-normal" style={{ fontFamily: '"DM Sans", sans-serif', letterSpacing: '-0.024em', color: '#1F4D3A' }}>
            Where do you go out?
          </h1>
          <p className="mt-2 text-[14px] leading-relaxed" style={{ color: '#6B7A72' }}>
            Events near your home city come first in your feed.
          </p>

          <div className="mt-7 grid gap-2.5">
            {CITIES.map(c => (
              <button
                key={c.name}
                onClick={() => { setCity(c.name); setShowCitySearch(false); }}
                className="flex items-center gap-3.5 px-4 py-4 rounded-xl text-left transition-all"
                style={{
                  border: `1px solid ${city === c.name ? '#1F4D3A' : '#E5E0D4'}`,
                  background: city === c.name ? '#E8EFEB' : '#FFFFFF',
                }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#1F4D3A" strokeWidth="1.8">
                  <path d="M12 21s-6-5.2-6-10a6 6 0 0112 0c0 4.8-6 10-6 10z" />
                  <circle cx="12" cy="11" r="2.2" />
                </svg>
                <span className="flex-1 font-medium text-[15px]" style={{ fontFamily: '"DM Sans", sans-serif', color: '#0F1F18' }}>
                  {c.name}
                </span>
                <span style={{ fontFamily: 'Inter, system-ui, sans-serif', fontSize: 12, color: '#6B7A72' }}>
                  {c.count} events
                </span>
              </button>
            ))}

            {/* Search row */}
            {!showCitySearch ? (
              <button
                onClick={() => setShowCitySearch(true)}
                className="flex items-center gap-3.5 px-4 py-4 rounded-xl text-left"
                style={{ border: '1px solid #E5E0D4', background: '#FFFFFF' }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#6B7A72" strokeWidth="1.8">
                  <circle cx="11" cy="11" r="7" /><path d="M21 21l-4.3-4.3" />
                </svg>
                <span className="font-normal text-[15px]" style={{ fontFamily: '"DM Sans", sans-serif', color: '#6B7A72' }}>
                  Search another city…
                </span>
              </button>
            ) : (
              <div className="flex gap-2.5">
                <input
                  autoFocus
                  value={citySearch}
                  onChange={e => setCitySearch(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter' && citySearch.trim()) { setCity(citySearch.trim()); setShowCitySearch(false); } }}
                  placeholder="City name…"
                  className="flex-1 h-12 px-3.5 rounded-xl outline-none text-[15px]"
                  style={{ border: '1px solid #E8C57E', background: '#FFFFFF', color: '#0F1F18', fontFamily: '"Inter", sans-serif' }}
                />
                <button
                  onClick={() => { if (citySearch.trim()) { setCity(citySearch.trim()); setShowCitySearch(false); } }}
                  className="h-12 px-4 rounded-xl font-medium text-[14px] text-white"
                  style={{ background: '#1F4D3A' }}
                >
                  Set
                </button>
              </div>
            )}
          </div>

          <div className="flex items-center justify-between mt-11">
            <button onClick={() => setStep(1)} className="text-[13px] font-medium" style={{ color: '#6B7A72' }}>
              ← Back
            </button>
            <button
              onClick={() => setStep(3)}
              disabled={!city}
              className="h-10 px-5 rounded-lg font-medium text-[14px] text-white transition hover:opacity-90 disabled:opacity-40"
              style={{ background: '#1F4D3A', fontFamily: '"DM Sans", sans-serif' }}
            >
              Continue
            </button>
          </div>
        </div>
      )}

      {/* ── Step 3: WhatsApp ── */}
      {step === 3 && (
        <div>
          <h1 className="mt-9 text-[30px] font-normal" style={{ fontFamily: '"DM Sans", sans-serif', letterSpacing: '-0.024em', color: '#1F4D3A' }}>
            Tickets, straight to WhatsApp
          </h1>
          <p className="mt-2 text-[14px]" style={{ color: '#6B7A72' }}>
            Optional — but this is the good part.
          </p>

          <div className="mt-7 p-6 rounded-xl" style={{ border: '1px solid #E5E0D4', background: '#FFFFFF' }}>
            <div className="flex items-center gap-3">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#1F4D3A" strokeWidth="1.8">
                <path d="M21 11.5a8.5 8.5 0 01-12.4 7.5L3 21l2-5.4A8.5 8.5 0 1121 11.5z" />
              </svg>
              <span className="font-medium text-[16px]" style={{ fontFamily: '"DM Sans", sans-serif', color: '#0F1F18' }}>
                Connect WhatsApp
              </span>
            </div>
            <p className="mt-2.5 text-[13px] leading-relaxed" style={{ color: '#6B7A72' }}>
              Your QR ticket and Karta Card arrive as a message the moment you register. Reminders land 24h and 2h before doors — no app to install, nothing to print.
            </p>
            <div className="flex gap-2.5 mt-4">
              <input
                type="tel"
                value={phone}
                onChange={e => setPhone(e.target.value)}
                placeholder="+253 77 00 00 00"
                className="flex-1 h-12 px-3.5 rounded-lg outline-none text-[15px]"
                style={{
                  border: '1px solid #E5E0D4',
                  background: '#FAF6EE',
                  color: '#0F1F18',
                  fontFamily: 'Inter, system-ui, sans-serif',
                }}
                onFocus={e => (e.target.style.borderColor = '#E8C57E')}
                onBlur={e => (e.target.style.borderColor = '#E5E0D4')}
              />
              <button
                onClick={verifyPhone}
                disabled={!phone || savingPhone}
                className="h-12 px-4 rounded-lg font-medium text-[14px] text-white transition hover:opacity-90 disabled:opacity-50"
                style={{ background: '#1F4D3A', fontFamily: '"DM Sans", sans-serif' }}
              >
                {savingPhone ? '…' : 'Verify'}
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between mt-11">
            <button onClick={() => setStep(2)} className="text-[13px] font-medium" style={{ color: '#6B7A72' }}>
              ← Back
            </button>
            <button
              onClick={() => finish(false)}
              disabled={saving}
              className="h-12 px-8 rounded-lg font-medium text-[15px] text-white transition hover:opacity-90 disabled:opacity-50"
              style={{ background: '#E8C57E', color: '#0F1F18', fontFamily: '"DM Sans", sans-serif' }}
            >
              {saving ? 'Saving…' : 'Take me to my feed'}
            </button>
          </div>
          <button
            onClick={() => finish(true)}
            className="block mx-auto mt-4 text-[13px] underline underline-offset-[3px]"
            style={{ color: '#6B7A72' }}
          >
            Skip — email only for now
          </button>
        </div>
      )}
    </div>
  );
}
