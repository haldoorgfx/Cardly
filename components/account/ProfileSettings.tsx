'use client';

import { useState, useRef } from 'react';
import Image from 'next/image';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/client';

const LANGUAGES = ['English', 'Français', 'Soomaali', 'العربية'] as const;

const emailSchema = z.string().trim().toLowerCase().email();

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
  { key: 'tickets',          label: 'Tickets & receipts',      sub: 'Confirmation, QR code, Eventera Card' },
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
    language: string | null;
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
  const [fullName, setFullName] = useState(profile.full_name ?? '');
  const [phone, setPhone] = useState(profile.phone ?? '');
  const [avatarUrl, setAvatarUrl] = useState(profile.avatar_url);
  const [photoUploading, setPhotoUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Change email
  const [newEmail, setNewEmail] = useState('');
  const [emailBusy, setEmailBusy] = useState(false);
  const [emailNotice, setEmailNotice] = useState<string | null>(null);
  const [emailError, setEmailError] = useState<string | null>(null);

  // Language (persisted to the profiles.language column)
  const [language, setLanguage] = useState(profile.language ?? 'English');

  // Delete account
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  async function handleChangeEmail() {
    setEmailError(null);
    setEmailNotice(null);
    const parsed = emailSchema.safeParse(newEmail);
    if (!parsed.success) {
      setEmailError('Enter a valid email address.');
      return;
    }
    setEmailBusy(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.updateUser({ email: parsed.data });
      if (error) throw error;
      setEmailNotice(`Check ${parsed.data} — your sign-in email changes only after you confirm via the link we sent.`);
      setNewEmail('');
    } catch (err) {
      console.error('Change email failed', err);
      setEmailError('Could not update your email. Please try again.');
    } finally {
      setEmailBusy(false);
    }
  }

  async function handleDeleteAccount() {
    setDeleteError(null);
    setDeleting(true);
    try {
      const res = await fetch('/api/account/delete', { method: 'POST' });
      if (!res.ok) {
        // Fall back to deleting the caller's own profile row directly (RLS-scoped).
        const supabase = createClient();
        const { error } = await supabase.from('profiles').delete().eq('id', profile.id);
        if (error) throw error;
      }
      const supabase = createClient();
      await supabase.auth.signOut().catch(() => {});
      window.location.href = '/';
    } catch (err) {
      console.error('Delete account failed', err);
      setDeleteError('We couldn’t delete your account right now. Please contact support.');
      setDeleting(false);
    }
  }

  function toggleInterest(i: string) {
    setInterests(prev => prev.includes(i) ? prev.filter(x => x !== i) : [...prev, i]);
    setSaved(false);
  }

  function togglePref(key: string, channel: 'email' | 'whatsapp') {
    const full = `${key}_${channel}`;
    setPrefs(p => ({ ...p, [full]: !p[full] }));
    setSaved(false);
  }

  async function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhotoUploading(true);
    try {
      const supabase = createClient();
      const ext = file.name.split('.').pop() ?? 'jpg';
      const path = `avatars/${profile.id}.${ext}`;
      const { error: upErr } = await supabase.storage.from('uploads').upload(path, file, { upsert: true, contentType: file.type });
      if (upErr) throw upErr;
      const { data: { publicUrl } } = supabase.storage.from('uploads').getPublicUrl(path);
      setAvatarUrl(publicUrl);
      await fetch('/api/account/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ avatar_url: publicUrl }),
      });
    } catch (err) {
      console.error('Photo upload failed', err);
    } finally {
      setPhotoUploading(false);
    }
  }

  async function save() {
    setSaving(true);
    await fetch('/api/account/profile', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        full_name: fullName || null,
        phone: phone || null,
        interests,
        city: city || null,
        notification_prefs: prefs,
        language,
      }),
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
          What you pick here shapes your discovery feed and how Eventera reaches you.
        </p>
      </div>

      {/* Identity card */}
      <div
        className="mt-8 p-5 sm:p-6 rounded-xl"
        style={{ background: '#FFFFFF', border: '1px solid #E5E0D4', boxShadow: '0 1px 2px rgba(15,31,24,0.04)' }}
      >
        {/* Avatar row */}
        <div className="flex items-center gap-5 mb-5">
          <div className="relative shrink-0 w-16 h-16 rounded-full overflow-hidden" style={{ border: '2px solid #E8C57E' }}>
            {avatarUrl ? (
              <Image src={avatarUrl} alt="" fill className="object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-white text-[22px] font-semibold"
                style={{ background: 'linear-gradient(135deg, #1F4D3A, #2A6A50)' }}>
                {(fullName || profile.email)[0].toUpperCase()}
              </div>
            )}
            {photoUploading && (
              <div className="absolute inset-0 flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.45)' }}>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-[13px] truncate" style={{ color: '#6B7A72' }}>{profile.email}</div>
          </div>
          <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoChange} />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={photoUploading}
            className="shrink-0 h-10 px-3.5 rounded-lg font-medium text-[13px] transition hover:bg-[#E8EFEB] disabled:opacity-50"
            style={{ border: '1px solid #1F4D3A', color: '#1F4D3A', fontFamily: '"DM Sans", sans-serif' }}
          >
            {photoUploading ? 'Uploading…' : 'Edit photo'}
          </button>
        </div>
        {/* Name + phone */}
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className="block text-[12px] mb-1.5 font-medium" style={{ color: '#6B7A72' }}>Display name</label>
            <input
              type="text"
              value={fullName}
              onChange={e => { setFullName(e.target.value); setSaved(false); }}
              placeholder="Your name"
              className="w-full h-10 px-3 rounded-lg text-[14px] outline-none transition"
              style={{ border: '1px solid #E5E0D4', background: '#FAFAF8', color: '#0F1F18', fontFamily: 'Inter, sans-serif' }}
              onFocus={e => { e.target.style.borderColor = '#1F4D3A'; e.target.style.boxShadow = '0 0 0 3px rgba(31,77,58,0.12)'; }}
              onBlur={e => { e.target.style.borderColor = '#E5E0D4'; e.target.style.boxShadow = 'none'; }}
            />
          </div>
          <div>
            <label className="block text-[12px] mb-1.5 font-medium" style={{ color: '#6B7A72' }}>Phone / WhatsApp</label>
            <input
              type="tel"
              value={phone}
              onChange={e => { setPhone(e.target.value); setSaved(false); }}
              placeholder="+254 700 000000"
              className="w-full h-10 px-3 rounded-lg text-[14px] outline-none transition"
              style={{ border: '1px solid #E5E0D4', background: '#FAFAF8', color: '#0F1F18', fontFamily: 'Inter, sans-serif' }}
              onFocus={e => { e.target.style.borderColor = '#1F4D3A'; e.target.style.boxShadow = '0 0 0 3px rgba(31,77,58,0.12)'; }}
              onBlur={e => { e.target.style.borderColor = '#E5E0D4'; e.target.style.boxShadow = 'none'; }}
            />
          </div>
        </div>
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
            <span style={{ fontFamily: 'Inter, system-ui, sans-serif', fontSize: 13, color: '#0F1F18' }}>
              {profile.phone.replace(/(\+\d{3})\s?\d+\s?\d+\s?(\d{2})$/, '$1 ·· ·· $2')}
            </span>
          </div>
        )}
      </div>

      {/* Language & region */}
      <div className="mt-10">
        <h2 className="font-medium text-[17px]" style={{ fontFamily: '"DM Sans", sans-serif', color: '#0F1F18' }}>
          Language &amp; region
        </h2>
        <p className="mt-1 text-[13px]" style={{ color: '#6B7A72' }}>
          Your preferred language. Saved with your preferences.
        </p>
        <div className="mt-4 w-full sm:max-w-[380px] grid gap-2">
          {LANGUAGES.map(l => (
            <button
              key={l}
              onClick={() => { setLanguage(l); setSaved(false); }}
              className="flex items-center gap-3 text-left px-4 py-3 rounded-xl font-medium text-[14px] transition-all"
              dir={l === 'العربية' ? 'rtl' : 'ltr'}
              style={{
                border: `1px solid ${language === l ? '#1F4D3A' : '#E5E0D4'}`,
                background: language === l ? '#E8EFEB' : '#FFFFFF',
                color: '#0F1F18',
                fontFamily: '"DM Sans", sans-serif',
              }}
            >
              <span
                className="inline-flex items-center justify-center shrink-0 rounded-full"
                style={{
                  width: 18, height: 18,
                  border: `2px solid ${language === l ? '#1F4D3A' : '#C4CCC7'}`,
                }}
              >
                {language === l && (
                  <span className="rounded-full" style={{ width: 8, height: 8, background: '#1F4D3A' }} />
                )}
              </span>
              <span className="flex-1">{l}</span>
            </button>
          ))}
        </div>
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
            setFullName(profile.full_name ?? '');
            setPhone(profile.phone ?? '');
            setAvatarUrl(profile.avatar_url);
            setInterests(profile.interests ?? []);
            setCity(profile.city ?? '');
            setPrefs(profile.notification_prefs ?? {});
            setLanguage(profile.language ?? 'English');
          }}
        >
          Cancel
        </button>
      </div>

      {/* Account */}
      <div className="mt-12">
        <h2 className="font-medium text-[17px]" style={{ fontFamily: '"DM Sans", sans-serif', color: '#0F1F18' }}>
          Account
        </h2>

        {/* Change email */}
        <div
          className="mt-4 p-5 rounded-xl"
          style={{ background: '#FFFFFF', border: '1px solid #E5E0D4', boxShadow: '0 1px 2px rgba(15,31,24,0.04)' }}
        >
          <div className="text-[14px] font-medium" style={{ color: '#0F1F18', fontFamily: '"DM Sans", sans-serif' }}>
            Change email
          </div>
          <p className="mt-1 text-[13px]" style={{ color: '#6B7A72' }}>
            We&rsquo;ll send a confirmation link to the new address. Your sign-in email changes only after you confirm it.
          </p>
          <div className="mt-4 text-[12px] mb-1.5 font-medium" style={{ color: '#6B7A72' }}>
            Current: <span style={{ color: '#0F1F18' }}>{profile.email}</span>
          </div>
          <div className="flex flex-col sm:flex-row gap-2.5">
            <input
              type="email"
              inputMode="email"
              autoComplete="email"
              value={newEmail}
              onChange={e => { setNewEmail(e.target.value); setEmailError(null); setEmailNotice(null); }}
              placeholder="new@email.com"
              className="flex-1 h-10 px-3 rounded-lg text-[14px] outline-none transition"
              style={{ border: '1px solid #E5E0D4', background: '#FAFAF8', color: '#0F1F18', fontFamily: 'Inter, sans-serif' }}
              onFocus={e => { e.target.style.borderColor = '#1F4D3A'; e.target.style.boxShadow = '0 0 0 3px rgba(31,77,58,0.12)'; }}
              onBlur={e => { e.target.style.borderColor = '#E5E0D4'; e.target.style.boxShadow = 'none'; }}
            />
            <button
              onClick={handleChangeEmail}
              disabled={emailBusy || !newEmail.trim()}
              className="h-10 px-4 rounded-lg font-medium text-[14px] text-white transition hover:opacity-90 disabled:opacity-50"
              style={{ background: '#1F4D3A', fontFamily: '"DM Sans", sans-serif' }}
            >
              {emailBusy ? 'Sending…' : 'Send confirmation'}
            </button>
          </div>
          {emailError && (
            <p className="mt-2.5 text-[13px]" style={{ color: '#B8423C' }}>{emailError}</p>
          )}
          {emailNotice && (
            <div
              className="mt-3 flex items-start gap-2.5 p-3 rounded-lg text-[13px]"
              style={{ background: '#E8EFEB', border: '1px solid rgba(31,77,58,0.18)', color: '#1F4D3A' }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#1F4D3A" strokeWidth="1.8" className="shrink-0 mt-0.5">
                <path d="M4 4h16v16H4z" /><path d="m4 6 8 6 8-6" />
              </svg>
              <span>{emailNotice}</span>
            </div>
          )}
        </div>

        {/* Delete account */}
        <div
          className="mt-4 p-5 rounded-xl"
          style={{ background: '#FFFFFF', border: '1px solid rgba(184,66,60,0.35)' }}
        >
          <div className="text-[14px] font-medium" style={{ color: '#B8423C', fontFamily: '"DM Sans", sans-serif' }}>
            Delete account
          </div>
          <p className="mt-1 text-[13px]" style={{ color: '#6B7A72' }}>
            This permanently removes your profile and data. This can&rsquo;t be undone.
          </p>
          <button
            onClick={() => { setShowDeleteDialog(true); setDeleteConfirm(''); setDeleteError(null); }}
            className="mt-4 h-10 px-4 rounded-lg font-medium text-[14px] transition hover:bg-[#FBEDEC]"
            style={{ border: '1px solid #B8423C', color: '#B8423C', fontFamily: '"DM Sans", sans-serif' }}
          >
            Delete my account
          </button>
        </div>
      </div>

      {/* Delete confirm dialog */}
      {showDeleteDialog && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center px-5"
          style={{ background: 'rgba(15,31,24,0.45)' }}
          onClick={() => { if (!deleting) setShowDeleteDialog(false); }}
        >
          <div
            className="w-full max-w-[420px] rounded-2xl p-6"
            style={{ background: '#FFFFFF', border: '1px solid #E5E0D4', boxShadow: '0 20px 48px rgba(15,31,24,0.24)' }}
            onClick={e => e.stopPropagation()}
          >
            <h3 className="text-[19px] font-medium" style={{ fontFamily: '"DM Sans", sans-serif', color: '#0F1F18' }}>
              Delete account?
            </h3>
            <p className="mt-2 text-[13px]" style={{ color: '#6B7A72' }}>
              This permanently removes your profile and all your data. This can&rsquo;t be undone.
              Type <span style={{ fontFamily: '"JetBrains Mono", monospace', color: '#B8423C' }}>DELETE</span> to confirm.
            </p>
            <input
              type="text"
              value={deleteConfirm}
              onChange={e => setDeleteConfirm(e.target.value)}
              placeholder="DELETE"
              autoFocus
              className="w-full h-10 px-3 mt-4 rounded-lg text-[14px] outline-none transition"
              style={{ border: '1px solid #E5E0D4', background: '#FAFAF8', color: '#0F1F18', fontFamily: 'Inter, sans-serif' }}
              onFocus={e => { e.target.style.borderColor = '#B8423C'; e.target.style.boxShadow = '0 0 0 3px rgba(184,66,60,0.12)'; }}
              onBlur={e => { e.target.style.borderColor = '#E5E0D4'; e.target.style.boxShadow = 'none'; }}
            />
            {deleteError && (
              <p className="mt-2.5 text-[13px]" style={{ color: '#B8423C' }}>{deleteError}</p>
            )}
            <div className="flex gap-3 mt-5">
              <button
                onClick={handleDeleteAccount}
                disabled={deleting || deleteConfirm.trim() !== 'DELETE'}
                className="h-10 px-5 rounded-lg font-medium text-[14px] text-white transition hover:opacity-90 disabled:opacity-50"
                style={{ background: '#B8423C', fontFamily: '"DM Sans", sans-serif' }}
              >
                {deleting ? 'Deleting…' : 'Delete permanently'}
              </button>
              <button
                onClick={() => setShowDeleteDialog(false)}
                disabled={deleting}
                className="h-10 px-5 rounded-lg font-medium text-[14px] transition hover:bg-[#E8EFEB] disabled:opacity-50"
                style={{ border: '1px solid #1F4D3A', color: '#1F4D3A', fontFamily: '"DM Sans", sans-serif' }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
