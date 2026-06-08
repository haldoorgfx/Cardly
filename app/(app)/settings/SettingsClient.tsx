'use client';

import { useState, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import { deleteAccount, signOut } from '@/app/(auth)/actions';
import { Check, ChevronDown } from 'lucide-react';

// ── Option lists ──────────────────────────────────────────────────────────────

const TIMEZONES = [
  { value: 'UTC',                    label: 'UTC' },
  { value: 'Africa/Nairobi',         label: 'Nairobi (EAT, UTC+3)' },
  { value: 'Africa/Lagos',           label: 'Lagos (WAT, UTC+1)' },
  { value: 'Africa/Johannesburg',    label: 'Johannesburg (SAST, UTC+2)' },
  { value: 'Africa/Cairo',           label: 'Cairo (EET, UTC+2)' },
  { value: 'Africa/Accra',           label: 'Accra (GMT, UTC+0)' },
  { value: 'Africa/Djibouti',        label: 'Djibouti (EAT, UTC+3)' },
  { value: 'Africa/Dar_es_Salaam',   label: 'Dar es Salaam (EAT, UTC+3)' },
  { value: 'Africa/Abidjan',         label: 'Abidjan (GMT, UTC+0)' },
  { value: 'Africa/Addis_Ababa',     label: 'Addis Ababa (EAT, UTC+3)' },
  { value: 'Africa/Kampala',         label: 'Kampala (EAT, UTC+3)' },
  { value: 'Africa/Kigali',          label: 'Kigali (CAT, UTC+2)' },
  { value: 'Africa/Mogadishu',       label: 'Mogadishu (EAT, UTC+3)' },
  { value: 'Europe/London',          label: 'London (GMT/BST)' },
  { value: 'Europe/Paris',           label: 'Paris (CET/CEST)' },
  { value: 'Europe/Amsterdam',       label: 'Amsterdam (CET/CEST)' },
  { value: 'America/New_York',       label: 'New York (ET)' },
  { value: 'America/Los_Angeles',    label: 'Los Angeles (PT)' },
  { value: 'America/Chicago',        label: 'Chicago (CT)' },
  { value: 'Asia/Dubai',             label: 'Dubai (GST, UTC+4)' },
  { value: 'Asia/Singapore',         label: 'Singapore (SGT, UTC+8)' },
  { value: 'Asia/Tokyo',             label: 'Tokyo (JST, UTC+9)' },
  { value: 'Asia/Riyadh',            label: 'Riyadh (AST, UTC+3)' },
  { value: 'Australia/Sydney',       label: 'Sydney (AEST/AEDT)' },
];

const LANGUAGES = [
  'English', 'French', 'Arabic', 'Swahili', 'Portuguese',
  'Spanish', 'Hausa', 'Amharic', 'Yoruba', 'Somali',
];

const DATE_FORMATS = [
  { value: 'DD MMM YYYY', label: 'DD MMM YYYY  (15 Jun 2026)' },
  { value: 'MM/DD/YYYY',  label: 'MM/DD/YYYY   (06/15/2026)' },
  { value: 'DD/MM/YYYY',  label: 'DD/MM/YYYY   (15/06/2026)' },
  { value: 'YYYY-MM-DD',  label: 'YYYY-MM-DD   (2026-06-15)' },
  { value: 'D MMM YYYY',  label: 'D MMM YYYY   (15 Jun 2026)' },
];

// ── Helpers ───────────────────────────────────────────────────────────────────

interface Profile {
  full_name: string | null;
  email: string | null;
  plan: string | null;
  role?: string | null;
  avatar_url?: string | null;
  organization?: string | null;
  timezone?: string | null;
  language?: string | null;
  currency?: string | null;
  date_format?: string | null;
  notify_registrations?: boolean | null;
  notify_daily_summary?: boolean | null;
  notify_card_shares?: boolean | null;
  notify_product_updates?: boolean | null;
}

interface Props {
  profile: Profile | null;
  userId: string;
}

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className="relative inline-flex h-6 w-11 shrink-0 rounded-full transition-colors duration-200"
      style={{ background: checked ? '#1F4D3A' : '#E5E0D4' }}
    >
      <span
        className="inline-block h-5 w-5 rounded-full bg-white shadow-sm transition-transform duration-200 mt-0.5"
        style={{ transform: checked ? 'translateX(21px)' : 'translateX(2px)' }}
      />
    </button>
  );
}

function SelectField({
  label, value, onChange, options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[] | string[];
}) {
  const opts = options.map(o => typeof o === 'string' ? { value: o, label: o } : o);
  return (
    <div>
      <label className="block text-[11px] font-mono tracking-widest text-[#6B7A72] uppercase mb-1.5">
        {label}
      </label>
      <div className="relative">
        <select
          value={value}
          onChange={e => onChange(e.target.value)}
          className="w-full h-10 pl-3 pr-8 rounded-xl border text-[13.5px] text-[#0F1F18] outline-none appearance-none transition cursor-pointer"
          style={{ background: 'white', borderColor: '#E5E0D4' }}
          onFocus={e => (e.target.style.borderColor = 'rgba(31,77,58,0.4)')}
          onBlur={e => (e.target.style.borderColor = '#E5E0D4')}
        >
          {opts.map(o => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
        <ChevronDown size={13} strokeWidth={2.5} className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: '#6B7A72' }} />
      </div>
    </div>
  );
}

function TextField({
  label, value, onChange, placeholder = '', readOnly = false,
}: {
  label: string;
  value: string;
  onChange?: (v: string) => void;
  placeholder?: string;
  readOnly?: boolean;
}) {
  return (
    <div>
      <label className="block text-[11px] font-mono tracking-widest text-[#6B7A72] uppercase mb-1.5">
        {label}
      </label>
      <input
        type="text"
        value={value}
        readOnly={readOnly}
        onChange={e => onChange?.(e.target.value)}
        placeholder={placeholder}
        className="w-full h-10 px-3 rounded-xl border text-[13.5px] outline-none transition"
        style={{
          background: readOnly ? '#F5F2EC' : 'white',
          borderColor: '#E5E0D4',
          color: readOnly ? '#6B7A72' : '#0F1F18',
          cursor: readOnly ? 'default' : undefined,
        }}
        onFocus={e => { if (!readOnly) e.target.style.borderColor = 'rgba(31,77,58,0.4)'; }}
        onBlur={e => (e.target.style.borderColor = '#E5E0D4')}
      />
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export default function SettingsClient({ profile, userId }: Props) {
  // Profile
  const [name, setName]               = useState(profile?.full_name ?? '');
  const [organization, setOrganization] = useState(profile?.organization ?? '');

  // Preferences
  const [timezone, setTimezone]     = useState(profile?.timezone   ?? 'UTC');
  const [language, setLanguage]     = useState(profile?.language   ?? 'English');
  const [dateFormat, setDateFormat] = useState(profile?.date_format ?? 'DD MMM YYYY');

  // Notifications
  const [notifyRegistrations,  setNotifyRegistrations]  = useState(profile?.notify_registrations  ?? true);
  const [notifyDailySummary,   setNotifyDailySummary]   = useState(profile?.notify_daily_summary  ?? true);
  const [notifyCardShares,     setNotifyCardShares]     = useState(profile?.notify_card_shares    ?? false);
  const [notifyProductUpdates, setNotifyProductUpdates] = useState(profile?.notify_product_updates ?? true);

  // Avatar
  const [avatarUrl, setAvatarUrl]           = useState(profile?.avatar_url ?? null);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  // Save state
  const [saving, setSaving] = useState(false);
  const [saved, setSaved]   = useState(false);
  const [error, setError]   = useState('');

  // Delete
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [deleting, setDeleting]           = useState(false);

  const nameInitials = name
    ? name.split(' ').map((w: string) => w[0]).slice(0, 2).join('').toUpperCase()
    : '?';

  const roleLabel =
    profile?.role === 'super_admin' ? 'Super Admin'
    : profile?.role === 'admin' ? 'Admin'
    : 'Owner';

  async function handleRemoveAvatar() {
    setAvatarUploading(true);
    await fetch('/api/profile', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ avatar_url: null }),
    });
    setAvatarUrl(null);
    setAvatarUploading(false);
  }

  async function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarUploading(true);
    const supabase = createClient();
    const ext = file.name.split('.').pop() ?? 'jpg';
    const path = `${userId}/avatar.${ext}`;
    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(path, file, { upsert: true, contentType: file.type });
    if (!uploadError) {
      const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(path);
      const url = urlData.publicUrl + `?t=${Date.now()}`;
      await fetch('/api/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ avatar_url: url }),
      });
      setAvatarUrl(url);
    }
    setAvatarUploading(false);
  }

  async function handleSave() {
    setSaving(true);
    setError('');
    const res = await fetch('/api/profile', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        full_name:              name.trim(),
        organization:           organization.trim(),
        timezone,
        language,
        date_format:            dateFormat,
        currency:               'USD',          // platform currency — always USD
        notify_registrations:   notifyRegistrations,
        notify_daily_summary:   notifyDailySummary,
        notify_card_shares:     notifyCardShares,
        notify_product_updates: notifyProductUpdates,
      }),
    });
    setSaving(false);
    if (res.ok) {
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } else {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? 'Save failed');
    }
  }

  async function handleDeleteAccount() {
    if (!deleteConfirm) { setDeleteConfirm(true); return; }
    setDeleting(true);
    await deleteAccount();
  }

  return (
    <div className="px-6 lg:px-8 py-8 max-w-[760px]">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 mb-8">
        <div>
          <h1 className="font-display font-semibold text-[24px] leading-tight text-[#0F1F18]">General</h1>
          <p className="text-[14px] text-[#6B7A72] mt-1">Account and workspace preferences</p>
        </div>
        <div className="flex flex-col items-end gap-1 shrink-0 mt-1">
          <button
            onClick={handleSave}
            disabled={saving}
            className="inline-flex items-center gap-2 h-9 px-5 rounded-xl text-[13.5px] font-semibold text-white transition disabled:opacity-60"
            style={{ background: saved ? '#2D7A4F' : '#1F4D3A' }}
          >
            <Check size={13} strokeWidth={2.5} />
            {saved ? 'Saved!' : saving ? 'Saving…' : 'Save changes'}
          </button>
          {error && <p className="text-[12px]" style={{ color: '#B8423C' }}>{error}</p>}
        </div>
      </div>

      <div className="space-y-5">

        {/* ── Profile ── */}
        <section className="bg-white rounded-2xl border p-6" style={{ borderColor: '#E5E0D4', boxShadow: '0 1px 2px rgba(15,31,24,0.04), 0 8px 24px rgba(15,31,24,0.06)' }}>
          <h2 className="font-display font-semibold text-[15px] tracking-tight text-[#0F1F18] mb-5">Profile</h2>

          {/* Avatar row */}
          <div className="flex items-center gap-4 mb-6">
            <input ref={avatarInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
            <div className="relative shrink-0">
              {avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={avatarUrl} alt="Avatar" className="h-14 w-14 rounded-full object-cover border" style={{ borderColor: '#E5E0D4' }} />
              ) : (
                <div
                  className="h-14 w-14 rounded-full grid place-items-center text-white font-display font-bold text-[18px]"
                  style={{ background: 'linear-gradient(135deg, #1F4D3A 0%, #2A6A50 60%, #E8C57E 130%)' }}
                >
                  {nameInitials}
                </div>
              )}
              {avatarUploading && (
                <div className="absolute inset-0 rounded-full bg-black/40 grid place-items-center">
                  <svg className="animate-spin" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
                    <path d="M21 12a9 9 0 1 1-9-9" strokeLinecap="round" />
                  </svg>
                </div>
              )}
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => avatarInputRef.current?.click()}
                disabled={avatarUploading}
                className="inline-flex items-center gap-2 h-8 px-4 rounded-lg border text-[13px] transition disabled:opacity-50"
                style={{ borderColor: '#E5E0D4', color: '#3A4A42', background: 'white' }}
              >
                {avatarUrl ? 'Change photo' : 'Upload photo'}
              </button>
              {avatarUrl && (
                <button
                  type="button"
                  onClick={handleRemoveAvatar}
                  disabled={avatarUploading}
                  className="inline-flex items-center gap-1.5 h-8 px-3 rounded-lg border text-[13px] transition disabled:opacity-50"
                  style={{ borderColor: 'rgba(184,66,60,0.3)', color: '#B8423C', background: 'transparent' }}
                >
                  Remove
                </button>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-4">
            <TextField label="Full Name" value={name} onChange={setName} />
            <TextField label="Email" value={profile?.email ?? ''} readOnly />
            <TextField label="Organization" value={organization} onChange={setOrganization} placeholder="Your company or event org" />
            <TextField label="Role" value={roleLabel} readOnly />
          </div>
        </section>

        {/* ── Preferences ── */}
        <section className="bg-white rounded-2xl border p-6" style={{ borderColor: '#E5E0D4', boxShadow: '0 1px 2px rgba(15,31,24,0.04), 0 8px 24px rgba(15,31,24,0.06)' }}>
          <h2 className="font-display font-semibold text-[15px] tracking-tight text-[#0F1F18] mb-5">Preferences</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-4">
            <SelectField
              label="Timezone"
              value={timezone}
              onChange={setTimezone}
              options={TIMEZONES}
            />
            <SelectField
              label="Language"
              value={language}
              onChange={setLanguage}
              options={LANGUAGES}
            />
            {/* Currency: platform-locked to USD, shown as read-only */}
            <div>
              <label className="block text-[11px] font-mono tracking-widest text-[#6B7A72] uppercase mb-1.5">
                Currency
              </label>
              <div
                className="flex items-center gap-2 h-10 px-3 rounded-xl border text-[13.5px]"
                style={{ background: '#F5F2EC', borderColor: '#E5E0D4', color: '#3A4A42' }}
              >
                <span className="font-medium text-[#1F4D3A]">USD</span>
                <span className="text-[#6B7A72]">· US Dollar</span>
                <span className="ml-auto text-[10px] font-mono px-1.5 py-0.5 rounded" style={{ background: '#E8EFEB', color: '#1F4D3A' }}>
                  Platform default
                </span>
              </div>
            </div>
            <SelectField
              label="Date Format"
              value={dateFormat}
              onChange={setDateFormat}
              options={DATE_FORMATS}
            />
          </div>
        </section>

        {/* ── Notifications ── */}
        <section className="bg-white rounded-2xl border p-6" style={{ borderColor: '#E5E0D4', boxShadow: '0 1px 2px rgba(15,31,24,0.04), 0 8px 24px rgba(15,31,24,0.06)' }}>
          <h2 className="font-display font-semibold text-[15px] tracking-tight text-[#0F1F18] mb-5">Notifications</h2>
          <div className="divide-y" style={{ borderColor: '#E5E0D4' }}>
            {[
              {
                label: 'New registrations',
                desc: 'Email me when someone registers for your event',
                checked: notifyRegistrations,
                onChange: setNotifyRegistrations,
              },
              {
                label: 'Daily summary',
                desc: "A daily digest of each event's registrations and activity",
                checked: notifyDailySummary,
                onChange: setNotifyDailySummary,
              },
              {
                label: 'Card shares',
                desc: 'Notify when attendees download or share their card',
                checked: notifyCardShares,
                onChange: setNotifyCardShares,
              },
              {
                label: 'Product updates',
                desc: 'News and announcements about new Karta features',
                checked: notifyProductUpdates,
                onChange: setNotifyProductUpdates,
              },
            ].map(item => (
              <div key={item.label} className="flex items-center justify-between gap-6 py-4">
                <div>
                  <div className="text-[13.5px] font-medium text-[#0F1F18]">{item.label}</div>
                  <div className="text-[12.5px] mt-0.5" style={{ color: '#6B7A72' }}>{item.desc}</div>
                </div>
                <Toggle checked={item.checked} onChange={item.onChange} />
              </div>
            ))}
          </div>
        </section>

        {/* ── Danger zone ── */}
        <section className="bg-white rounded-2xl border p-6" style={{ borderColor: 'rgba(184,66,60,0.25)' }}>
          <div className="flex items-center justify-between gap-6">
            <div>
              <div className="text-[13.5px] font-semibold mb-1" style={{ color: '#B8423C' }}>Delete account</div>
              <div className="text-[13px]" style={{ color: '#6B7A72' }}>
                Permanently removes your account and all events. This can&apos;t be undone.
              </div>
            </div>
            <div className="flex flex-col items-end gap-1.5 shrink-0">
              <button
                onClick={handleDeleteAccount}
                disabled={deleting}
                className="h-8 px-4 rounded-lg text-[13px] font-medium transition disabled:opacity-40"
                style={
                  deleteConfirm
                    ? { background: '#B8423C', color: 'white', border: 'none' }
                    : { background: 'white', border: '1px solid rgba(184,66,60,0.35)', color: '#B8423C' }
                }
              >
                {deleting ? 'Deleting…' : deleteConfirm ? 'Confirm — delete forever' : 'Delete'}
              </button>
              {deleteConfirm && !deleting && (
                <button onClick={() => setDeleteConfirm(false)} className="text-[11.5px] transition" style={{ color: '#6B7A72' }}>
                  Cancel
                </button>
              )}
            </div>
          </div>
        </section>

        {/* Sign out */}
        <div className="pt-2 pb-4">
          <button onClick={() => signOut()} className="text-[13px] transition" style={{ color: '#6B7A72' }}>
            Sign out of Karta →
          </button>
        </div>

      </div>
    </div>
  );
}
