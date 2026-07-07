'use client';

import { useState } from 'react';
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
  /** Which section to render. Omit to render all (legacy). The General
   *  settings sub-tabs pass one of these so each tab shows just its section
   *  while all state + the single Save persist everything together. */
  section?: 'preferences' | 'notifications' | 'account';
}

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className="relative inline-flex h-6 w-11 shrink-0 rounded-full transition-colors duration-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1F4D3A]"
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
      <label className="block text-[11px] tracking-widest text-[#6B7A72] uppercase mb-1.5">
        {label}
      </label>
      <div className="relative">
        <select
          value={value}
          onChange={e => onChange(e.target.value)}
          className="w-full h-10 pl-3 pr-8 rounded-lg border text-[13.5px] text-[#0F1F18] outline-none appearance-none transition cursor-pointer"
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

// ── Main component ────────────────────────────────────────────────────────────

export default function SettingsClient({ profile, section }: Props) {
  const show = (s: 'preferences' | 'notifications' | 'account') => !section || section === s;
  const showSaveBar = !section || section === 'preferences' || section === 'notifications';
  // Preferences
  const [timezone, setTimezone]     = useState(profile?.timezone   ?? 'UTC');
  const [language, setLanguage]     = useState(profile?.language   ?? 'English');
  const [dateFormat, setDateFormat] = useState(profile?.date_format ?? 'DD MMM YYYY');

  // Notifications
  const [notifyRegistrations,  setNotifyRegistrations]  = useState(profile?.notify_registrations  ?? true);
  const [notifyDailySummary,   setNotifyDailySummary]   = useState(profile?.notify_daily_summary  ?? true);
  const [notifyCardShares,     setNotifyCardShares]     = useState(profile?.notify_card_shares    ?? false);
  const [notifyProductUpdates, setNotifyProductUpdates] = useState(profile?.notify_product_updates ?? true);

  // Save state
  const [saving, setSaving] = useState(false);
  const [saved, setSaved]   = useState(false);
  const [error, setError]   = useState('');

  // Delete
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [deleting, setDeleting]           = useState(false);

  async function handleSave() {
    setSaving(true);
    setError('');
    const res = await fetch('/api/profile', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
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
    <div className="w-full">
      {/* Save bar — shown on Preferences + Notifications tabs (they share state) */}
      {showSaveBar && (
        <div className="flex items-center justify-end gap-3 mb-5">
          {error && <p className="text-[12px]" style={{ color: '#B8423C' }}>{error}</p>}
          <button
            onClick={handleSave}
            disabled={saving}
            className="inline-flex items-center gap-2 h-9 px-5 rounded-lg text-[13.5px] font-semibold text-white transition disabled:opacity-60 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1F4D3A]"
            style={{ background: saved ? '#2D7A4F' : '#1F4D3A' }}
          >
            <Check size={13} strokeWidth={2.5} />
            {saved ? 'Saved!' : saving ? 'Saving…' : 'Save changes'}
          </button>
        </div>
      )}

      <div className="space-y-5">

        {/* ── Preferences ── */}
        {show('preferences') && (
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
              <label className="block text-[11px] tracking-widest text-[#6B7A72] uppercase mb-1.5">
                Currency
              </label>
              <div
                className="flex items-center gap-2 h-10 px-3 rounded-xl border text-[13.5px]"
                style={{ background: '#F5F2EC', borderColor: '#E5E0D4', color: '#3A4A42' }}
              >
                <span className="font-medium text-[#1F4D3A]">USD</span>
                <span className="text-[#6B7A72]">· US Dollar</span>
                <span className="ml-auto text-[10px] px-1.5 py-0.5 rounded" style={{ background: '#E8EFEB', color: '#1F4D3A' }}>
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
        )}

        {/* ── Notifications ── */}
        {show('notifications') && (
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
                desc: 'News and announcements about new Eventera features',
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
        )}

        {/* ── Danger zone ── */}
        {show('account') && (
        <>
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
          <button onClick={() => signOut()} className="text-[13px] transition hover:text-[#0F1F18] rounded focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1F4D3A]" style={{ color: '#6B7A72' }}>
            Sign out of Eventera →
          </button>
        </div>
        </>
        )}

      </div>
    </div>
  );
}
