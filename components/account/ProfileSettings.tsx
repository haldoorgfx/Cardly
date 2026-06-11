'use client';

import { useState } from 'react';
import Image from 'next/image';

const INTERESTS = [
  'Tech', 'Music', 'Business', 'Culture', 'Food & drink',
  'Sports', 'Health', 'Film', 'Faith', 'Family', 'Education', 'Fashion',
];

const CITIES = [
  'Djibouti City, Djibouti',
  'Nairobi, Kenya',
  'Addis Ababa, Ethiopia',
  'Dar es Salaam, Tanzania',
  'Kampala, Uganda',
  'Lagos, Nigeria',
];

type NotifPrefs = Record<string, boolean>;

const NOTIF_ROWS: { key: string; label: string; sub: string }[] = [
  { key: 'tickets',          label: 'Tickets & receipts',      sub: 'Confirmation, QR code, Karta Card' },
  { key: 'reminders',        label: 'Event reminders',         sub: '24 hours and 2 hours before doors' },
  { key: 'agenda_changes',   label: 'Agenda changes',          sub: 'Session moved, cancelled or rescheduled' },
  { key: 'organizer_follows',label: 'Organizers you follow',   sub: 'New event published' },
  { key: 'waitlist',         label: 'Waitlist updates',        sub: 'A spot opened for you' },
  { key: 'recommendations',  label: 'Recommendations',         sub: 'Weekly digest for your city' },
];

interface Props {
  profile: {
    id: string;
    full_name: string | null;
    email: string;
    avatar_url: string | null;
    interests: string[] | null;
    city: string | null;
    phone: string | null;
    whatsapp_verified: boolean | null;
    notification_prefs: NotifPrefs | null;
  };
}

function Toggle({ on, onChange }: { on: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!on)}
      className="relative shrink-0 transition-colors"
      style={{
        width: 40, height: 23,
        borderRadius: 100,
        background: on ? '#1F4D3A' : '#E5E0D4',
        border: 'none',
      }}
    >
      <span
        className="absolute top-[2.5px] transition-transform"
        style={{
          left: 3,
          width: 18, height: 18,
          borderRadius: '50%',
          background: '#fff',
          boxShadow: '0 1px 3px rgba(0,0,0,0.15)',
          transform: on ? 'translateX(16px)' : 'translateX(0)',
        }}
      />
    </button>
  );
}

export default function ProfileSettings({ profile }: Props) {
  const [interests, setInterests] = useState<string[]>(profile.interests ?? []);
  const [city, setCity] = useState(profile.city ?? '');
  const [showCityPicker, setShowCityPicker] = useState(false);
  const [prefs, setPrefs] = useState<NotifPrefs>(profile.notification_prefs ?? {});
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  function toggleInterest(i: string) {
    setInterests(prev => prev.includes(i) ? prev.filter(x => x !== i) : [...prev, i]);
    setSaved(false);
  }

  function togglePref(key: string, channel: 'email' | 'whatsapp') {
    const full = `${key}_${channel}`;
    setPrefs(p => ({ ...p, [full]: !p[full] }));
    setSaved(false);
  }

  async function save() {
    setSaving(true);
    await fetch('/api/account/profile', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ interests, city: city || null, notification_prefs: prefs }),
    });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  }

  return (
    <div className="max-w-[760px] mx-auto px-5 pb-24" style={{ paddingTop: 44 }}>
      {/* Header */}
      <div>
        <h1 className="font-normal text-[32px]" style={{ fontFamily: '"DM Sans", sans-serif', letterSpacing: '-0.025em', color: '#1F4D3A' }}>
          Profile &amp; preferences
        </h1>
        <p className="mt-2 text-[14px]" style={{ color: '#6B7A72' }}>
          What you pick here shapes your discovery feed and how Karta reaches you.
        </p>
      </div>

      {/* Identity card */}
      <div
        className="flex items-center gap-5 mt-8 p-5 sm:p-6 rounded-xl"
        style={{ background: '#FFFFFF', border: '1px solid #E5E0D4', boxShadow: '0 1px 2px rgba(15,31,24,0.04)' }}
      >
        <div className="relative shrink-0 w-16 h-16 rounded-full overflow-hidden" style={{ border: '2px solid #E8C57E' }}>
          {profile.avatar_url ? (
            <Image src={profile.avatar_url} alt="" fill className="object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-white text-[22px] font-semibold"
              style={{ background: 'linear-gradient(135deg, #1F4D3A, #2A6A50)' }}>
              {(profile.full_name ?? profile.email)[0].toUpperCase()}
            </div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-medium text-[19px] truncate" style={{ fontFamily: '"DM Sans", sans-serif', color: '#0F1F18' }}>
            {profile.full_name ?? profile.email.split('@')[0]}
          </div>
          <div className="text-[13px] mt-0.5 truncate" style={{ color: '#6B7A72' }}>
            {profile.email}
          </div>
        </div>
        <button
          className="shrink-0 h-10 px-3.5 rounded-lg font-medium text-[13px] transition hover:bg-[#E8EFEB]"
          style={{ border: '1px solid #1F4D3A', color: '#1F4D3A', fontFamily: '"DM Sans", sans-serif' }}
        >
          Edit photo
        </button>
      </div>

      {/* Interests */}
      <div className="mt-10">
        <h2 className="font-medium text-[17px]" style={{ fontFamily: '"DM Sans", sans-serif', color: '#0F1F18' }}>
          Your interests
        </h2>
        <p className="mt-1 text-[13px]" style={{ color: '#6B7A72' }}>
          Pick at least 3 — your &ldquo;For you&rdquo; feed is built from these.
        </p>
        <div className="flex flex-wrap gap-2 mt-4">
          {INTERESTS.map(i => (
            <button
              key={i}
              onClick={() => toggleInterest(i)}
              className="h-9 px-4 flex items-center gap-2 rounded-full font-medium text-[13px] transition-all"
              style={{
                border: `1px solid ${interests.includes(i) ? '#1F4D3A' : '#E5E0D4'}`,
                background: interests.includes(i) ? '#1F4D3A' : '#FFFFFF',
                color: interests.includes(i) ? '#FFFFFF' : '#3A4A42',
                fontFamily: '"DM Sans", sans-serif',
              }}
            >
              {interests.includes(i) && <span style={{ fontSize: 11, color: '#E8C57E' }}>✓</span>}
              {i}
            </button>
          ))}
        </div>
      </div>

      {/* Home city */}
      <div className="mt-10">
        <h2 className="font-medium text-[17px]" style={{ fontFamily: '"DM Sans", sans-serif', color: '#0F1F18' }}>
          Home city
        </h2>
        <p className="mt-1 text-[13px]" style={{ color: '#6B7A72' }}>Events near here come first.</p>

        {!showCityPicker ? (
          <div
            className="mt-4 flex items-center gap-3 h-12 px-4 rounded-xl w-full sm:max-w-[380px]"
            style={{ border: '1px solid #E5E0D4', background: '#FFFFFF' }}
          >
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#6B7A72" strokeWidth="1.8">
              <path d="M12 21s-6-5.2-6-10a6 6 0 0112 0c0 4.8-6 10-6 10z" />
              <circle cx="12" cy="11" r="2.2" />
            </svg>
            <span className="flex-1 text-[14px]" style={{ color: city ? '#0F1F18' : '#9BA8A1' }}>
              {city || 'Not set'}
            </span>
            <button
              onClick={() => setShowCityPicker(true)}
              className="text-[13px] font-medium hover:underline"
              style={{ color: '#1F4D3A' }}
            >
              {city ? 'Change' : 'Set'}
            </button>
          </div>
        ) : (
          <div className="mt-4 w-full sm:max-w-[380px] grid gap-2">
            {CITIES.map(c => (
              <button
                key={c}
                onClick={() => { setCity(c); setShowCityPicker(false); setSaved(false); }}
                className="text-left px-4 py-3 rounded-xl font-medium text-[14px] transition-all"
                style={{
                  border: `1px solid ${city === c ? '#1F4D3A' : '#E5E0D4'}`,
                  background: city === c ? '#E8EFEB' : '#FFFFFF',
                  color: '#0F1F18',
                  fontFamily: '"DM Sans", sans-serif',
                }}
              >
                {c}
              </button>
            ))}
            <button onClick={() => setShowCityPicker(false)} className="text-[13px] mt-1" style={{ color: '#6B7A72' }}>
              Cancel
            </button>
          </div>
        )}
      </div>

      {/* Notification matrix */}
      <div className="mt-10">
        <h2 className="font-medium text-[17px]" style={{ fontFamily: '"DM Sans", sans-serif', color: '#0F1F18' }}>
          Notifications
        </h2>
        <p className="mt-1 text-[13px]" style={{ color: '#6B7A72' }}>
          Choose how each kind of update reaches you.
        </p>

        <div className="mt-4 rounded-xl overflow-hidden" style={{ border: '1px solid #E5E0D4' }}>
          {/* Header — hidden on mobile (toggles shown inline with label instead) */}
          <div
            className="hidden sm:grid items-center px-5 py-3"
            style={{ gridTemplateColumns: '1fr 100px 120px', background: '#F5F3EE', borderBottom: '1px solid #E5E0D4' }}
          >
            <span className="text-[11px] font-medium uppercase tracking-[0.06em]" style={{ color: '#6B7A72' }}>Type</span>
            <span className="text-[11px] font-medium uppercase tracking-[0.06em] text-center" style={{ color: '#6B7A72' }}>Email</span>
            <span className="text-[11px] font-medium uppercase tracking-[0.06em] text-center" style={{ color: '#6B7A72' }}>WhatsApp</span>
          </div>

          {NOTIF_ROWS.map((row, i) => (
            <div
              key={row.key}
              className="px-5 py-4"
              style={{ borderBottom: i < NOTIF_ROWS.length - 1 ? '1px solid #E5E0D4' : 'none' }}
            >
              {/* Desktop: 3-column grid */}
              <div className="hidden sm:grid items-center" style={{ gridTemplateColumns: '1fr 100px 120px' }}>
                <div>
                  <div className="text-[14px]" style={{ color: '#0F1F18' }}>{row.label}</div>
                  <div className="text-[12px] mt-0.5" style={{ color: '#6B7A72' }}>{row.sub}</div>
                </div>
                <div className="flex justify-center">
                  <Toggle on={prefs[`${row.key}_email`] !== false} onChange={() => togglePref(row.key, 'email')} />
                </div>
                <div className="flex justify-center">
                  <Toggle on={!!prefs[`${row.key}_whatsapp`]} onChange={() => togglePref(row.key, 'whatsapp')} />
                </div>
              </div>
              {/* Mobile: label + two toggles in a row */}
              <div className="sm:hidden">
                <div className="text-[14px]" style={{ color: '#0F1F18' }}>{row.label}</div>
                <div className="text-[12px] mt-0.5 mb-3" style={{ color: '#6B7A72' }}>{row.sub}</div>
                <div className="flex items-center gap-6">
                  <div className="flex items-center gap-2">
                    <Toggle on={prefs[`${row.key}_email`] !== false} onChange={() => togglePref(row.key, 'email')} />
                    <span className="text-[12px]" style={{ color: '#6B7A72' }}>Email</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Toggle on={!!prefs[`${row.key}_whatsapp`]} onChange={() => togglePref(row.key, 'whatsapp')} />
                    <span className="text-[12px]" style={{ color: '#6B7A72' }}>WhatsApp</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* WhatsApp connected banner */}
        {profile.whatsapp_verified && profile.phone && (
          <div
            className="flex items-center gap-3.5 mt-6 p-4 rounded-xl"
            style={{ background: '#E8EFEB', border: '1px solid rgba(31,77,58,0.18)' }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#1F4D3A" strokeWidth="1.8">
              <path d="M21 11.5a8.5 8.5 0 01-12.4 7.5L3 21l2-5.4A8.5 8.5 0 1121 11.5z" />
            </svg>
            <div className="flex-1 text-[13px] font-medium" style={{ color: '#1F4D3A' }}>
              WhatsApp connected. Tickets and reminders arrive as messages.
            </div>
            <span style={{ fontFamily: '"JetBrains Mono", monospace', fontSize: 13, color: '#0F1F18' }}>
              {profile.phone.replace(/(\+\d{3})\s?\d+\s?\d+\s?(\d{2})$/, '$1 ·· ·· $2')}
            </span>
          </div>
        )}
      </div>

      {/* Save buttons */}
      <div className="flex gap-3 mt-9">
        <button
          onClick={save}
          disabled={saving}
          className="h-10 px-5 rounded-lg font-medium text-[14px] text-white transition hover:opacity-90 disabled:opacity-50"
          style={{ background: '#1F4D3A', fontFamily: '"DM Sans", sans-serif' }}
        >
          {saving ? 'Saving…' : saved ? '✓ Saved' : 'Save preferences'}
        </button>
        <button
          className="h-10 px-5 rounded-lg font-medium text-[14px] transition hover:bg-[#E8EFEB]"
          style={{ border: '1px solid #1F4D3A', color: '#1F4D3A', fontFamily: '"DM Sans", sans-serif' }}
          onClick={() => {
            setInterests(profile.interests ?? []);
            setCity(profile.city ?? '');
            setPrefs(profile.notification_prefs ?? {});
          }}
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
