'use client';

import { useState, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import { deleteAccount, signOut } from '@/app/(auth)/actions';
import { Check } from 'lucide-react';

interface Profile {
  full_name: string | null;
  email: string | null;
  plan: string | null;
  role?: string | null;
  avatar_url?: string | null;
  notify_downloads?: boolean;
  notify_views?: boolean;
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

export default function SettingsClient({ profile, userId }: Props) {
  const [name, setName] = useState(profile?.full_name ?? '');
  const [organization, setOrganization] = useState('');
  const [timezone, setTimezone] = useState('WAT · Lagos (GMT+1)');
  const [language, setLanguage] = useState('English');
  const [currency, setCurrency] = useState('USD · $ Dollar');
  const [dateFormat, setDateFormat] = useState('DD MMM YYYY');

  const [notifyRegistrations, setNotifyRegistrations] = useState(true);
  const [notifyDailySummary, setNotifyDailySummary] = useState(true);
  const [notifyCardShares, setNotifyCardShares] = useState(false);
  const [notifyProductUpdates, setNotifyProductUpdates] = useState(true);

  const [avatarUrl, setAvatarUrl] = useState(profile?.avatar_url ?? null);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const nameInitials = name
    ? name.split(' ').map((w: string) => w[0]).slice(0, 2).join('').toUpperCase()
    : '?';

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
    await fetch('/api/profile', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ full_name: name }),
    });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  }

  async function handleDeleteAccount() {
    if (!deleteConfirm) { setDeleteConfirm(true); return; }
    setDeleting(true);
    await deleteAccount();
  }

  const roleLabel =
    profile?.role === 'super_admin' ? 'Super Admin'
    : profile?.role === 'admin' ? 'Admin'
    : 'Owner';

  return (
    <div className="px-8 py-8 max-w-[720px]">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 mb-8">
        <div>
          <h1 className="font-display font-bold text-[32px] leading-tight text-[#0F1F18]">Settings</h1>
          <p className="text-[14px] text-[#6B7A72] mt-1">Account and workspace preferences</p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="inline-flex items-center gap-2 h-9 px-5 rounded-xl text-[13.5px] font-semibold text-white bg-primary hover:opacity-95 disabled:opacity-60 transition shrink-0 mt-1"
        >
          <Check size={13} strokeWidth={2.5} />
          {saved ? 'Saved' : saving ? 'Saving…' : 'Save changes'}
        </button>
      </div>

      <div className="space-y-5">

        {/* Profile */}
        <section className="bg-white rounded-2xl border border-border p-6 shadow-soft">
          <h2 className="font-semibold text-[15px] text-[#0F1F18] mb-5">Profile</h2>

          {/* Avatar row */}
          <div className="flex items-center gap-4 mb-6">
            <input
              ref={avatarInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleAvatarChange}
            />
            <div className="relative shrink-0">
              {avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={avatarUrl}
                  alt="Avatar"
                  className="h-14 w-14 rounded-full object-cover border border-border"
                />
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
            <button
              type="button"
              onClick={() => avatarInputRef.current?.click()}
              disabled={avatarUploading}
              className="inline-flex items-center gap-2 h-8 px-4 rounded-lg border border-border text-[13px] text-[#3A4A42] hover:bg-cream transition disabled:opacity-50"
            >
              Change photo
            </button>
          </div>

          {/* Form fields grid */}
          <div className="grid grid-cols-2 gap-x-4 gap-y-4">
            <div>
              <label className="block text-[11px] font-mono tracking-widest text-[#6B7A72] uppercase mb-1.5">
                Full Name
              </label>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                className="w-full h-10 px-3 rounded-xl border border-border bg-white text-[13.5px] text-[#0F1F18] focus:border-primary/40 focus:ring-2 focus:ring-primary/10 outline-none transition"
              />
            </div>
            <div>
              <label className="block text-[11px] font-mono tracking-widest text-[#6B7A72] uppercase mb-1.5">
                Email
              </label>
              <input
                type="email"
                value={profile?.email ?? ''}
                readOnly
                className="w-full h-10 px-3 rounded-xl border border-border text-[13.5px] text-[#6B7A72] outline-none cursor-default"
                style={{ background: '#F5F2EC' }}
              />
            </div>
            <div>
              <label className="block text-[11px] font-mono tracking-widest text-[#6B7A72] uppercase mb-1.5">
                Organization
              </label>
              <input
                type="text"
                value={organization}
                onChange={e => setOrganization(e.target.value)}
                placeholder="Your organization"
                className="w-full h-10 px-3 rounded-xl border border-border bg-white text-[13.5px] text-[#0F1F18] placeholder:text-[#6B7A72]/50 focus:border-primary/40 focus:ring-2 focus:ring-primary/10 outline-none transition"
              />
            </div>
            <div>
              <label className="block text-[11px] font-mono tracking-widest text-[#6B7A72] uppercase mb-1.5">
                Role
              </label>
              <input
                type="text"
                value={roleLabel}
                readOnly
                className="w-full h-10 px-3 rounded-xl border border-border text-[13.5px] text-[#6B7A72] outline-none cursor-default"
                style={{ background: '#F5F2EC' }}
              />
            </div>
          </div>
        </section>

        {/* Preferences */}
        <section className="bg-white rounded-2xl border border-border p-6 shadow-soft">
          <h2 className="font-semibold text-[15px] text-[#0F1F18] mb-5">Preferences</h2>
          <div className="grid grid-cols-2 gap-x-4 gap-y-4">
            {[
              { label: 'TIMEZONE', value: timezone, onChange: setTimezone },
              { label: 'LANGUAGE', value: language, onChange: setLanguage },
              { label: 'CURRENCY', value: currency, onChange: setCurrency },
              { label: 'DATE FORMAT', value: dateFormat, onChange: setDateFormat },
            ].map(({ label, value, onChange }) => (
              <div key={label}>
                <label className="block text-[11px] font-mono tracking-widest text-[#6B7A72] uppercase mb-1.5">
                  {label}
                </label>
                <input
                  type="text"
                  value={value}
                  onChange={e => onChange(e.target.value)}
                  className="w-full h-10 px-3 rounded-xl border border-border bg-white text-[13.5px] text-[#0F1F18] focus:border-primary/40 focus:ring-2 focus:ring-primary/10 outline-none transition"
                />
              </div>
            ))}
          </div>
        </section>

        {/* Notifications */}
        <section className="bg-white rounded-2xl border border-border p-6 shadow-soft">
          <h2 className="font-semibold text-[15px] text-[#0F1F18] mb-5">Notifications</h2>
          <div className="divide-y divide-border">
            {[
              {
                label: 'New registrations',
                desc: 'Email me when someone registers',
                checked: notifyRegistrations,
                onChange: setNotifyRegistrations,
              },
              {
                label: 'Daily summary',
                desc: "A digest of each event's activity",
                checked: notifyDailySummary,
                onChange: setNotifyDailySummary,
              },
              {
                label: 'Card shares',
                desc: 'Notify when attendees share cards',
                checked: notifyCardShares,
                onChange: setNotifyCardShares,
              },
              {
                label: 'Product updates',
                desc: 'News about new Karta features',
                checked: notifyProductUpdates,
                onChange: setNotifyProductUpdates,
              },
            ].map(item => (
              <div key={item.label} className="flex items-center justify-between gap-6 py-4">
                <div>
                  <div className="text-[13.5px] font-medium text-[#0F1F18]">{item.label}</div>
                  <div className="text-[12.5px] text-[#6B7A72] mt-0.5">{item.desc}</div>
                </div>
                <Toggle checked={item.checked} onChange={item.onChange} />
              </div>
            ))}
          </div>
        </section>

        {/* Delete account */}
        <section className="bg-white rounded-2xl border p-6" style={{ borderColor: 'rgba(184,66,60,0.25)' }}>
          <div className="flex items-center justify-between gap-6">
            <div>
              <div className="text-[13.5px] font-semibold text-[#B8423C] mb-1">Delete account</div>
              <div className="text-[13px] text-[#6B7A72]">
                Permanently remove your account and all events. This can&apos;t be undone.
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
                <button
                  onClick={() => setDeleteConfirm(false)}
                  className="text-[11.5px] text-[#6B7A72] hover:text-[#0F1F18] transition"
                >
                  Cancel
                </button>
              )}
            </div>
          </div>
        </section>

        {/* Sign out link at bottom */}
        <div className="pt-2 pb-4">
          <button
            onClick={() => signOut()}
            className="text-[13px] text-[#6B7A72] hover:text-[#0F1F18] transition"
          >
            Sign out of Karta →
          </button>
        </div>

      </div>
    </div>
  );
}
