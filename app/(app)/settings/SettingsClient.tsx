'use client';

import { useState, useRef, useTransition } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { signOut, resetPassword, deleteAccount, updatePassword, updateEmail, signOutAllDevices } from '@/app/(auth)/actions';
import { Check, Mail, ArrowRight, Minus } from 'lucide-react';
import { DeveloperTab } from './DeveloperTab';

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

const TABS = ['Profile', 'Security', 'Notifications', 'Developer', 'Account'] as const;
type Tab = typeof TABS[number];

const PLANS: Record<string, { label: string; limit: string; features: { text: string; included: boolean }[] }> = {
  free: {
    label: 'Free',
    limit: '1 event max',
    features: [
      { text: '1 active event', included: true },
      { text: 'Unlimited attendees', included: true },
      { text: 'No watermark', included: false },
      { text: 'Download analytics', included: false },
    ],
  },
  pro: {
    label: 'Pro',
    limit: '10 events',
    features: [
      { text: '10 active events', included: true },
      { text: 'Unlimited attendees', included: true },
      { text: 'No watermark', included: true },
      { text: 'Download analytics', included: true },
    ],
  },
  studio: {
    label: 'Studio',
    limit: 'Unlimited',
    features: [
      { text: 'Unlimited events', included: true },
      { text: 'Unlimited attendees', included: true },
      { text: 'No watermark', included: true },
      { text: 'Priority support + onboarding', included: true },
    ],
  },
};

function CheckIcon() {
  return <Check size={11} strokeWidth={2.8} color="#1F4D3A" className="shrink-0" />;
}
function MinusIcon() {
  return <Minus size={11} strokeWidth={2.2} color="#6B7A72" className="shrink-0 opacity-40" />;
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-6 py-5 border-b last:border-0" style={{ borderColor: '#E5E0D4' }}>
      <div className="text-[13.5px] font-medium text-[#0F1F18] shrink-0 w-36 pt-0.5">{label}</div>
      <div className="flex-1 min-w-0">{children}</div>
    </div>
  );
}

function Toggle({ checked, onChange, disabled }: { checked: boolean; onChange: (v: boolean) => void; disabled?: boolean }) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className="relative inline-flex h-5 w-9 shrink-0 rounded-full transition-colors duration-200 disabled:opacity-50"
      style={{ background: checked ? '#1F4D3A' : '#E5E0D4' }}
    >
      <span
        className="inline-block h-4 w-4 rounded-full bg-white shadow-sm transition-transform duration-200 mt-0.5"
        style={{ transform: checked ? 'translateX(17px)' : 'translateX(2px)' }}
      />
    </button>
  );
}

function Banner({ type, msg, onDismiss }: { type: 'success' | 'error'; msg: string; onDismiss: () => void }) {
  return (
    <div className={`flex items-center gap-3 px-4 py-3 rounded-xl text-[13px] border mb-5 ${
      type === 'success'
        ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
        : 'bg-red-50 border-red-200 text-red-600'
    }`}>
      {type === 'success'
        ? <Check size={13} strokeWidth={2.5} />
        : <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
      }
      <span className="flex-1">{msg}</span>
      <button onClick={onDismiss} className="opacity-50 hover:opacity-100 transition">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
      </button>
    </div>
  );
}

export default function SettingsClient({ profile, userId }: Props) {
  const [activeTab, setActiveTab] = useState<Tab>('Profile');
  const [banner, setBanner] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);
  const [isPending, startTransition] = useTransition();

  // Profile tab state
  const [name, setName] = useState(profile?.full_name ?? '');
  const [avatarUrl, setAvatarUrl] = useState(profile?.avatar_url ?? null);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  // Security tab state
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [pwFocus, setPwFocus] = useState(false);
  const [cpwFocus, setCpwFocus] = useState(false);
  const [emailFocus, setEmailFocus] = useState(false);

  // Password reset (email link) state
  const [pwSending, setPwSending] = useState(false);
  const [pwSent, setPwSent] = useState(false);

  // Notifications
  const [notifyDownloads, setNotifyDownloads] = useState(profile?.notify_downloads ?? true);
  const [notifyViews, setNotifyViews] = useState(profile?.notify_views ?? false);

  // Account deletion
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);

  function showBanner(type: 'success' | 'error', msg: string) {
    setBanner({ type, msg });
  }

  // ── Avatar upload ──────────────────────────────────────────────────────────
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
    if (uploadError) {
      showBanner('error', 'Avatar upload failed: ' + uploadError.message);
      setAvatarUploading(false);
      return;
    }
    const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(path);
    const url = urlData.publicUrl + `?t=${Date.now()}`;

    const res = await fetch('/api/profile', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ avatar_url: url }),
    });
    if (res.ok) {
      setAvatarUrl(url);
      showBanner('success', 'Profile photo updated.');
    } else {
      showBanner('error', 'Failed to save avatar URL.');
    }
    setAvatarUploading(false);
  }

  // ── Save name ──────────────────────────────────────────────────────────────
  async function handleSaveName(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    const res = await fetch('/api/profile', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ full_name: name }),
    });
    if (res.ok) {
      showBanner('success', 'Name updated.');
    } else {
      const data = await res.json().catch(() => ({}));
      showBanner('error', data.error ?? 'Failed to save name.');
    }
  }

  // ── Change password (inline form, not email link) ─────────────────────────
  function handleChangePassword(e: React.FormEvent) {
    e.preventDefault();
    if (newPassword !== confirmPassword) { showBanner('error', "Passwords don't match."); return; }
    if (newPassword.length < 8) { showBanner('error', 'Password must be at least 8 characters.'); return; }
    startTransition(async () => {
      const fd = new FormData();
      fd.set('password', newPassword);
      const result = await updatePassword(fd);
      if (result?.error) {
        showBanner('error', result.error);
      } else {
        setNewPassword(''); setConfirmPassword('');
        showBanner('success', 'Password updated successfully.');
      }
    });
  }

  // ── Send password reset link ───────────────────────────────────────────────
  async function handlePasswordResetLink() {
    if (!profile?.email) return;
    setPwSending(true);
    const result = await resetPassword(profile.email);
    setPwSending(false);
    if (result && 'error' in result) {
      showBanner('error', result.error ?? 'Something went wrong.');
    } else {
      setPwSent(true);
    }
  }

  // ── Change email ───────────────────────────────────────────────────────────
  function handleChangeEmail(e: React.FormEvent) {
    e.preventDefault();
    if (!newEmail) return;
    startTransition(async () => {
      const fd = new FormData();
      fd.set('email', newEmail);
      const result = await updateEmail(fd);
      if (result?.error) {
        showBanner('error', result.error);
      } else {
        setNewEmail('');
        showBanner('success', 'Confirmation sent to your new address. Click the link to confirm the change.');
      }
    });
  }

  // ── Sign out all devices ───────────────────────────────────────────────────
  function handleSignOutAll() {
    startTransition(async () => {
      await signOutAllDevices();
    });
  }

  // ── Notification toggles ───────────────────────────────────────────────────
  async function handleToggle(key: 'notify_downloads' | 'notify_views', value: boolean) {
    if (key === 'notify_downloads') setNotifyDownloads(value);
    else setNotifyViews(value);
    await fetch('/api/profile', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ [key]: value }),
    });
  }

  // ── Export data ────────────────────────────────────────────────────────────
  function handleExport() {
    window.location.href = '/api/export-data';
  }

  // ── Delete account ─────────────────────────────────────────────────────────
  async function handleDeleteAccount() {
    if (!deleteConfirm) { setDeleteConfirm(true); return; }
    setDeleting(true);
    const result = await deleteAccount();
    if (result && 'error' in result) {
      showBanner('error', result.error ?? 'Deletion failed.');
      setDeleting(false);
      setDeleteConfirm(false);
    }
  }

  const plan = profile?.plan ?? 'free';
  const planInfo = PLANS[plan] ?? PLANS.free;
  const nameInitials = name
    ? name.split(' ').map((w: string) => w[0]).slice(0, 2).join('').toUpperCase()
    : '?';

  const isFocused = (f: boolean) => ({
    borderColor: f ? 'rgba(31,77,58,0.4)' : '#E5E0D4',
    background: '#FAF6EE',
    boxShadow: f ? '0 0 0 3px rgba(31,77,58,0.1)' : 'none',
  });

  return (
    <div className="min-h-full flex flex-col" style={{ background: '#F5F5F4' }}>

      {/* ── Page header ── */}
      <div className="relative overflow-hidden px-6 pt-7 pb-0 border-b shrink-0" style={{ background: 'white', borderColor: '#E5E0D4' }}>
        <div className="absolute pointer-events-none" style={{ top: '-50%', right: '-5%', width: 240, height: 240, background: 'radial-gradient(ellipse, rgba(31,77,58,0.06) 0%, transparent 70%)', filter: 'blur(40px)' }} />
        <div className="relative">
          <div className="flex items-center gap-1.5 text-[12px] font-mono text-[#6B7A72]/60 mb-3">
            <span>WORKSPACE</span><span>/</span><span className="text-[#6B7A72]">Settings</span>
          </div>
          <h1 className="font-display font-bold text-[28px] text-[#0F1F18] leading-tight tracking-tight mb-5">Settings</h1>
        </div>
        <div className="flex items-center gap-1 relative">
          {TABS.map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`relative px-4 py-3 text-[13.5px] font-medium transition-colors ${
                activeTab === tab ? 'text-[#0F1F18]' : 'text-[#6B7A72] hover:text-[#3A4A42]'
              }`}
            >
              {tab}
              {activeTab === tab && (
                <span className="absolute bottom-0 left-0 right-0 h-[2px] rounded-t" style={{ background: '#1F4D3A' }} />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* ── Tab content ── */}
      <div className="flex-1 px-6 py-6">
        <div className="max-w-2xl">

          {banner && (
            <Banner type={banner.type} msg={banner.msg} onDismiss={() => setBanner(null)} />
          )}

          {/* ─── Profile ─────────────────────────────────────────── */}
          {activeTab === 'Profile' && (
            <div className="space-y-4">
              {/* Avatar card */}
              <div className="bg-white rounded-2xl p-6 border" style={{ borderColor: '#E5E0D4', boxShadow: '0 1px 2px rgba(15,31,24,0.04)' }}>
                <div className="text-[13px] font-semibold text-[#0F1F18] mb-4">Profile photo</div>
                <div className="flex items-center gap-5">
                  <div className="relative shrink-0">
                    {avatarUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={avatarUrl} alt="Avatar" className="h-16 w-16 rounded-full object-cover border" style={{ borderColor: '#E5E0D4' }} />
                    ) : (
                      <div className="h-16 w-16 rounded-full grid place-items-center text-white font-display font-bold text-[20px]" style={{ background: 'linear-gradient(135deg, #1F4D3A 0%, #2A6A50 60%, #E8C57E 130%)' }}>
                        {nameInitials}
                      </div>
                    )}
                    {avatarUploading && (
                      <div className="absolute inset-0 rounded-full bg-black/40 grid place-items-center">
                        <svg className="animate-spin" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5"><path d="M21 12a9 9 0 1 1-9-9" strokeLinecap="round"/></svg>
                      </div>
                    )}
                  </div>
                  <div>
                    <input ref={avatarInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
                    <button
                      type="button"
                      onClick={() => avatarInputRef.current?.click()}
                      disabled={avatarUploading}
                      className="h-8 px-4 text-[13px] font-medium rounded-lg border transition hover:bg-[#F5F5F4] disabled:opacity-50"
                      style={{ borderColor: '#E5E0D4', color: '#3A4A42' }}
                    >
                      {avatarUploading ? 'Uploading…' : 'Change photo'}
                    </button>
                    <p className="mt-1.5 text-[12px] text-[#6B7A72]">JPG, PNG or WebP · max 2 MB</p>
                  </div>
                </div>
              </div>

              {/* Name card */}
              <form onSubmit={handleSaveName} className="bg-white rounded-2xl overflow-hidden border" style={{ borderColor: '#E5E0D4', boxShadow: '0 1px 2px rgba(15,31,24,0.04)' }}>
                <div className="px-6 divide-y" style={{ borderColor: '#E5E0D4' }}>
                  <Row label="Full name">
                    <input
                      type="text"
                      value={name}
                      onChange={e => setName(e.target.value)}
                      placeholder="Your name"
                      className="w-full h-9 px-3 rounded-lg text-[13.5px] text-[#0F1F18] placeholder:text-[#6B7A72]/40 transition focus:outline-none"
                      style={{ border: '1px solid #E5E0D4', background: '#FAF6EE' }}
                      onFocus={e => { e.currentTarget.style.borderColor = 'rgba(31,77,58,0.4)'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(31,77,58,0.1)'; }}
                      onBlur={e => { e.currentTarget.style.borderColor = '#E5E0D4'; e.currentTarget.style.boxShadow = 'none'; }}
                    />
                  </Row>
                  <Row label="Email">
                    <div className="h-9 px-3 flex items-center rounded-lg text-[13.5px] text-[#6B7A72]" style={{ border: '1px solid #E5E0D4', background: '#F5F2EC' }}>
                      {profile?.email}
                    </div>
                    <p className="text-[11.5px] text-[#6B7A72]/55 mt-1.5">Change your email in the Security tab.</p>
                  </Row>
                  {profile?.role && profile.role !== 'user' && (
                    <Row label="Role">
                      <span className="inline-flex items-center h-7 px-2.5 rounded-lg text-[12px] font-mono font-medium" style={{ background: 'rgba(31,77,58,0.08)', color: '#1F4D3A', border: '1px solid rgba(31,77,58,0.15)' }}>
                        {profile.role === 'super_admin' ? 'Super admin' : 'Admin'}
                      </span>
                    </Row>
                  )}
                </div>
                <div className="px-6 py-4 border-t flex items-center justify-end" style={{ borderColor: '#E5E0D4', background: '#FAF6EE' }}>
                  <button
                    type="submit"
                    disabled={isPending || !name.trim() || name === (profile?.full_name ?? '')}
                    className="inline-flex items-center gap-2 h-8 px-5 rounded-lg text-[13px] font-semibold text-white transition hover:opacity-90 disabled:opacity-40"
                    style={{ background: '#1F4D3A' }}
                  >
                    Save changes
                  </button>
                </div>
              </form>

              {/* Plan card */}
              <div className="bg-white rounded-2xl p-6 border" style={{ borderColor: '#E5E0D4', boxShadow: '0 1px 2px rgba(15,31,24,0.04)' }}>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-[11px] font-mono text-[#6B7A72]/60 uppercase tracking-widest mb-1">Plan</div>
                    <div className="flex items-center gap-2">
                      <span className="font-display font-bold text-[18px] text-[#0F1F18]">{planInfo.label}</span>
                      <span className="text-[11px] font-mono px-2 py-0.5 rounded-full" style={{ background: '#F0EDE8', color: '#6B7A72', border: '1px solid #E5E0D4' }}>{planInfo.limit}</span>
                    </div>
                  </div>
                  {plan !== 'studio' && (
                    <Link href="/pricing" className="inline-flex items-center gap-2 h-8 px-4 rounded-lg text-[13px] font-semibold text-white transition hover:opacity-90" style={{ background: '#1F4D3A' }}>
                      Upgrade <ArrowRight size={12} strokeWidth={2.2} />
                    </Link>
                  )}
                </div>
                <ul className="mt-4 space-y-2">
                  {planInfo.features.map(f => (
                    <li key={f.text} className="flex items-center gap-3">
                      <div className="h-5 w-5 rounded-full grid place-items-center shrink-0" style={f.included ? { background: 'rgba(31,77,58,0.08)', border: '1px solid rgba(31,77,58,0.15)' } : { background: '#F5F2EC', border: '1px solid #E5E0D4' }}>
                        {f.included ? <CheckIcon /> : <MinusIcon />}
                      </div>
                      <span className={`text-[13px] ${f.included ? 'text-[#3A4A42]' : 'text-[#6B7A72]'}`}>{f.text}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {/* ─── Security ─────────────────────────────────────────── */}
          {activeTab === 'Security' && (
            <div className="space-y-4">
              {/* Change password */}
              <form onSubmit={handleChangePassword} className="bg-white rounded-2xl overflow-hidden border" style={{ borderColor: '#E5E0D4', boxShadow: '0 1px 2px rgba(15,31,24,0.04)' }}>
                <div className="px-6 pt-5 pb-2">
                  <div className="text-[13.5px] font-semibold text-[#0F1F18] mb-0.5">Change password</div>
                  <div className="text-[13px] text-[#6B7A72] mb-4">Set a new password directly — no reset email needed.</div>
                  <div className="space-y-3">
                    <input type="password" placeholder="New password (8+ characters)" value={newPassword} onChange={e => setNewPassword(e.target.value)} minLength={8} required
                      className="w-full h-10 px-3.5 rounded-lg border text-[14px] text-[#0F1F18] placeholder:text-[#6B7A72]/60 transition focus:outline-none"
                      style={isFocused(pwFocus)} onFocus={() => setPwFocus(true)} onBlur={() => setPwFocus(false)} />
                    <input type="password" placeholder="Confirm new password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} minLength={8} required
                      className="w-full h-10 px-3.5 rounded-lg border text-[14px] text-[#0F1F18] placeholder:text-[#6B7A72]/60 transition focus:outline-none"
                      style={isFocused(cpwFocus)} onFocus={() => setCpwFocus(true)} onBlur={() => setCpwFocus(false)} />
                  </div>
                </div>
                <div className="px-6 py-4 border-t flex items-center gap-4 mt-2" style={{ borderColor: '#E5E0D4', background: '#FAF6EE' }}>
                  <button type="submit" disabled={isPending || !newPassword || !confirmPassword}
                    className="h-8 px-5 text-white text-[13px] font-semibold rounded-lg transition hover:opacity-90 disabled:opacity-40"
                    style={{ background: '#1F4D3A' }}>
                    Update password
                  </button>
                  <div className="h-4 w-px" style={{ background: '#E5E0D4' }} />
                  {pwSent ? (
                    <span className="text-[12.5px] text-emerald-600 flex items-center gap-1.5"><Check size={12} /> Reset link sent to {profile?.email}</span>
                  ) : (
                    <button type="button" onClick={handlePasswordResetLink} disabled={pwSending}
                      className="text-[12.5px] text-[#6B7A72] hover:text-[#1F4D3A] transition flex items-center gap-1.5 disabled:opacity-50">
                      <Mail size={12} />{pwSending ? 'Sending…' : 'Send reset link by email instead'}
                    </button>
                  )}
                </div>
              </form>

              {/* Change email */}
              <form onSubmit={handleChangeEmail} className="bg-white rounded-2xl overflow-hidden border" style={{ borderColor: '#E5E0D4', boxShadow: '0 1px 2px rgba(15,31,24,0.04)' }}>
                <div className="px-6 pt-5 pb-2">
                  <div className="text-[13.5px] font-semibold text-[#0F1F18] mb-0.5">Change email</div>
                  <div className="text-[13px] text-[#6B7A72] mb-4">
                    Current: <span className="text-[#0F1F18] font-medium">{profile?.email}</span><br />
                    We&apos;ll send a confirmation to the new address before switching.
                  </div>
                  <input type="email" placeholder="New email address" value={newEmail} onChange={e => setNewEmail(e.target.value)} required
                    className="w-full h-10 px-3.5 rounded-lg border text-[14px] text-[#0F1F18] placeholder:text-[#6B7A72]/60 transition focus:outline-none"
                    style={isFocused(emailFocus)} onFocus={() => setEmailFocus(true)} onBlur={() => setEmailFocus(false)} />
                </div>
                <div className="px-6 py-4 border-t mt-2" style={{ borderColor: '#E5E0D4', background: '#FAF6EE' }}>
                  <button type="submit" disabled={isPending || !newEmail}
                    className="h-8 px-5 text-white text-[13px] font-semibold rounded-lg transition hover:opacity-90 disabled:opacity-40"
                    style={{ background: '#1F4D3A' }}>
                    Send confirmation
                  </button>
                </div>
              </form>

              {/* Sign out all */}
              <div className="bg-white rounded-2xl p-6 border" style={{ borderColor: '#E5E0D4', boxShadow: '0 1px 2px rgba(15,31,24,0.04)' }}>
                <div className="flex items-start justify-between gap-6">
                  <div>
                    <div className="text-[13.5px] font-semibold text-[#0F1F18] mb-1">Sign out everywhere</div>
                    <div className="text-[13px] text-[#6B7A72]">Signs you out of all browsers and devices. You&apos;ll need to sign in again.</div>
                  </div>
                  <button type="button" onClick={handleSignOutAll} disabled={isPending}
                    className="shrink-0 h-8 px-4 rounded-lg text-[13px] font-medium border transition hover:bg-[#F5F5F4] disabled:opacity-50"
                    style={{ borderColor: '#E5E0D4', color: '#3A4A42' }}>
                    Sign out all devices
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ─── Notifications ────────────────────────────────────── */}
          {activeTab === 'Notifications' && (
            <div className="space-y-4">
              <div className="bg-white rounded-2xl p-6 border" style={{ borderColor: '#E5E0D4', boxShadow: '0 1px 2px rgba(15,31,24,0.04)' }}>
                <div className="text-[13.5px] font-semibold text-[#0F1F18] mb-5">Email notifications</div>
                <div className="space-y-5">
                  <div className="flex items-center justify-between gap-6">
                    <div>
                      <div className="text-[13px] font-medium text-[#0F1F18]">Card downloaded</div>
                      <div className="text-[12px] text-[#6B7A72] mt-0.5">Get an email when an attendee downloads their card.</div>
                    </div>
                    <Toggle checked={notifyDownloads} onChange={v => handleToggle('notify_downloads', v)} disabled={isPending} />
                  </div>
                  <div className="h-px" style={{ background: '#E5E0D4' }} />
                  <div className="flex items-center justify-between gap-6">
                    <div>
                      <div className="text-[13px] font-medium text-[#0F1F18]">Event viewed</div>
                      <div className="text-[12px] text-[#6B7A72] mt-0.5">Get an email when someone opens your event link.</div>
                    </div>
                    <Toggle checked={notifyViews} onChange={v => handleToggle('notify_views', v)} disabled={isPending} />
                  </div>
                </div>
              </div>
              <div className="px-4 py-3 rounded-xl border text-[12px] text-[#6B7A72]" style={{ borderColor: '#E5E0D4', background: 'white' }}>
                Preferences are saved. Email delivery requires SMTP configuration — contact support to enable.
              </div>
            </div>
          )}

          {/* ─── Developer ───────────────────────────────────────── */}
          {activeTab === 'Developer' && (
            <DeveloperTab plan={profile?.plan ?? 'free'} />
          )}

          {/* ─── Account ──────────────────────────────────────────── */}
          {activeTab === 'Account' && (
            <div className="space-y-4">
              {/* Sign out this device */}
              <div className="bg-white rounded-2xl p-6 border" style={{ borderColor: '#E5E0D4', boxShadow: '0 1px 2px rgba(15,31,24,0.04)' }}>
                <div className="flex items-start justify-between gap-6">
                  <div>
                    <div className="text-[13.5px] font-semibold text-[#0F1F18] mb-1">Sign out</div>
                    <div className="text-[13px] text-[#6B7A72]">Sign out of Karta on this device.</div>
                  </div>
                  <button type="button" onClick={() => signOut()}
                    className="shrink-0 h-8 px-4 rounded-lg text-[13px] font-medium border transition hover:bg-[#F5F5F4]"
                    style={{ borderColor: '#E5E0D4', color: '#3A4A42' }}>
                    Sign out
                  </button>
                </div>
              </div>

              {/* Export data */}
              <div className="bg-white rounded-2xl p-6 border" style={{ borderColor: '#E5E0D4', boxShadow: '0 1px 2px rgba(15,31,24,0.04)' }}>
                <div className="flex items-start justify-between gap-6">
                  <div>
                    <div className="text-[13.5px] font-semibold text-[#0F1F18] mb-1">Export your data</div>
                    <div className="text-[13px] text-[#6B7A72]">Download a JSON file with your profile, all events, and card statistics.</div>
                  </div>
                  <button type="button" onClick={handleExport}
                    className="shrink-0 h-8 px-4 rounded-lg text-[13px] font-medium border transition hover:bg-[#F5F5F4]"
                    style={{ borderColor: '#E5E0D4', color: '#3A4A42' }}>
                    Download export
                  </button>
                </div>
              </div>

              {/* Delete account */}
              <div className="bg-white rounded-2xl p-6 border border-red-200">
                <div className="flex items-start justify-between gap-6">
                  <div>
                    <div className="text-[13.5px] font-semibold text-red-600 mb-1">Delete account</div>
                    <div className="text-[13px] text-[#6B7A72]">
                      Permanently deletes your account and all event data. This cannot be undone.
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1.5 shrink-0">
                    <button type="button" onClick={handleDeleteAccount} disabled={deleting}
                      className="h-8 px-4 rounded-lg text-[13px] font-medium transition shrink-0 disabled:opacity-40"
                      style={deleteConfirm
                        ? { background: '#DC2626', color: 'white', border: 'none' }
                        : { background: 'white', border: '1px solid rgba(220,38,38,0.35)', color: '#DC2626' }
                      }>
                      {deleting ? 'Deleting…' : deleteConfirm ? 'Confirm — delete forever' : 'Delete account'}
                    </button>
                    {deleteConfirm && !deleting && (
                      <button type="button" onClick={() => setDeleteConfirm(false)}
                        className="text-[11.5px] text-[#6B7A72] hover:text-[#0F1F18] transition">
                        Cancel
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
