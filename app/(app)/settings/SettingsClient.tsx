'use client';

import { useState } from 'react';
import Link from 'next/link';
import { signOut, resetPassword, deleteAccount } from '@/app/(auth)/actions';

interface Profile {
  full_name: string | null;
  email: string | null;
  plan: string | null;
}

interface Props {
  profile: Profile | null;
  userId: string;
}

const TABS = ['Profile', 'Plan', 'Security', 'Account'] as const;
type Tab = typeof TABS[number];

const PLANS: Record<string, { label: string; limit: string; color: string; features: { text: string; included: boolean }[] }> = {
  free: {
    label: 'Free',
    limit: '1 event max',
    color: '#6B7A72',
    features: [
      { text: '1 active event', included: true },
      { text: 'Unlimited attendees', included: true },
      { text: 'Cardly watermark on cards', included: false },
      { text: 'Download analytics', included: false },
    ],
  },
  pro: {
    label: 'Pro',
    limit: '10 events',
    color: '#1F4D3A',
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
    color: '#1F4D3A',
    features: [
      { text: 'Unlimited events', included: true },
      { text: 'Unlimited attendees', included: true },
      { text: 'No watermark', included: true },
      { text: 'Priority support + onboarding', included: true },
    ],
  },
};

function CheckIcon() {
  return (
    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#1F4D3A" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

function MinusIcon() {
  return (
    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#6B7A72" strokeWidth="2.2" strokeLinecap="round" className="shrink-0 opacity-40">
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-6 py-5 border-b last:border-0" style={{ borderColor: '#E5E0D4' }}>
      <div className="text-[13.5px] font-medium text-[#0F1F18] shrink-0 w-36 pt-0.5">{label}</div>
      <div className="flex-1 min-w-0">{children}</div>
    </div>
  );
}

export default function SettingsClient({ profile }: Props) {
  const [activeTab, setActiveTab] = useState<Tab>('Profile');

  const [name, setName] = useState(profile?.full_name ?? '');
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const [pwSending, setPwSending] = useState(false);
  const [pwSent, setPwSent] = useState(false);
  const [pwError, setPwError] = useState<string | null>(null);

  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const handleSave = async () => {
    if (!name.trim()) return;
    setSaving(true);
    setSaveError(null);
    try {
      const res = await fetch('/api/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ full_name: name }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setSaveError(data.error ?? 'Failed to save');
      } else {
        setSaved(true);
        setTimeout(() => setSaved(false), 2500);
      }
    } catch {
      setSaveError('Network error — please try again');
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordReset = async () => {
    if (!profile?.email) return;
    setPwSending(true);
    setPwError(null);
    const result = await resetPassword(profile.email);
    setPwSending(false);
    if (result && 'error' in result) {
      setPwError(result.error ?? 'Something went wrong');
    } else {
      setPwSent(true);
    }
  };

  const handleDeleteAccount = async () => {
    if (!deleteConfirm) { setDeleteConfirm(true); return; }
    setDeleting(true);
    setDeleteError(null);
    const result = await deleteAccount();
    if (result && 'error' in result) {
      setDeleteError(result.error);
      setDeleting(false);
    }
  };

  const plan = profile?.plan ?? 'free';
  const planInfo = PLANS[plan] ?? PLANS.free;
  const nameInitials = name
    ? name.split(' ').map((w: string) => w[0]).slice(0, 2).join('').toUpperCase()
    : '?';

  return (
    <div className="min-h-full flex flex-col" style={{ background: '#F5F5F4' }}>

      {/* ── Page header ── */}
      <div
        className="relative overflow-hidden px-6 pt-7 pb-0 border-b shrink-0"
        style={{ background: 'white', borderColor: '#E5E0D4' }}
      >
        {/* Mesh blob */}
        <div
          className="absolute pointer-events-none"
          style={{ top: '-50%', right: '-5%', width: 240, height: 240, background: 'radial-gradient(ellipse, rgba(31,77,58,0.06) 0%, transparent 70%)', filter: 'blur(40px)' }}
        />

        <div className="relative">
          {/* Breadcrumb */}
          <div className="flex items-center gap-1.5 text-[12px] font-mono text-[#6B7A72]/60 mb-3">
            <span>WORKSPACE</span>
            <span>/</span>
            <span className="text-[#6B7A72]">Settings</span>
          </div>

          <h1 className="font-display font-bold text-[28px] text-[#0F1F18] leading-tight tracking-tight mb-5">
            Settings
          </h1>
        </div>

        {/* ── Tab bar ── */}
        <div className="flex items-center gap-1 relative">
          {TABS.map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`relative px-4 py-3 text-[13.5px] font-medium transition-colors ${
                activeTab === tab
                  ? 'text-[#0F1F18]'
                  : 'text-[#6B7A72] hover:text-[#3A4A42]'
              }`}
            >
              {tab}
              {activeTab === tab && (
                <span
                  className="absolute bottom-0 left-0 right-0 h-[2px] rounded-t"
                  style={{ background: '#1F4D3A' }}
                />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* ── Tab content ── */}
      <div className="flex-1 px-6 py-6">
        <div className="max-w-2xl">

          {/* ─── Profile tab ─────────────────────────────────────── */}
          {activeTab === 'Profile' && (
            <div className="bg-white rounded-2xl overflow-hidden" style={{ border: '1px solid #E5E0D4', boxShadow: '0 1px 2px rgba(15,31,24,0.04)' }}>
              {/* Avatar row */}
              <div className="px-6 py-6 border-b flex items-center gap-4" style={{ borderColor: '#E5E0D4', background: '#FAF6EE' }}>
                <div
                  className="h-14 w-14 rounded-2xl grid place-items-center text-white font-display font-bold text-[18px] shrink-0"
                  style={{ background: 'linear-gradient(135deg, #1F4D3A 0%, #2A6A50 60%, #E8C57E 130%)' }}
                >
                  {nameInitials}
                </div>
                <div>
                  <div className="font-display font-semibold text-[15px] text-[#0F1F18]">{name || 'Your name'}</div>
                  <div className="text-[13px] text-[#6B7A72] mt-0.5">{profile?.email}</div>
                  <div
                    className="inline-flex items-center mt-1.5 px-2 py-0.5 rounded-md text-[11px] font-mono font-medium"
                    style={plan === 'studio'
                      ? { background: 'linear-gradient(135deg,#1F4D3A,#2A6A50)', color: 'white' }
                      : plan === 'pro'
                      ? { background: '#E8EFEB', color: '#1F4D3A' }
                      : { background: '#F0EDE8', color: '#6B7A72' }
                    }
                  >
                    {planInfo.label}
                  </div>
                </div>
              </div>

              {/* Fields */}
              <div className="px-6 divide-y" style={{ borderColor: '#E5E0D4' }}>
                <Row label="Full name">
                  <input
                    type="text"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleSave()}
                    placeholder="Your name"
                    className="w-full h-9 px-3 rounded-lg text-[13.5px] text-[#0F1F18] placeholder:text-[#6B7A72]/40 transition focus:outline-none"
                    style={{ border: '1px solid #E5E0D4', background: '#FAF6EE' }}
                    onFocus={e => { e.currentTarget.style.borderColor = 'rgba(31,77,58,0.4)'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(31,77,58,0.1)'; }}
                    onBlur={e => { e.currentTarget.style.borderColor = '#E5E0D4'; e.currentTarget.style.boxShadow = 'none'; }}
                  />
                </Row>
                <Row label="Email">
                  <input
                    type="email"
                    value={profile?.email ?? ''}
                    disabled
                    className="w-full h-9 px-3 rounded-lg text-[13.5px] text-[#6B7A72]/60 cursor-not-allowed"
                    style={{ border: '1px solid #E5E0D4', background: '#F5F2EC' }}
                  />
                  <p className="text-[11.5px] text-[#6B7A72]/55 mt-1.5">Email cannot be changed.</p>
                </Row>
              </div>

              {/* Save footer */}
              <div className="px-6 py-4 border-t flex items-center gap-3" style={{ borderColor: '#E5E0D4', background: '#FAF6EE' }}>
                {saveError && (
                  <p className="text-[12.5px] text-[#B8423C] flex-1">{saveError}</p>
                )}
                {saved && (
                  <span className="text-[12.5px] text-emerald-600 flex-1">Changes saved.</span>
                )}
                <div className="ml-auto" />
                <button
                  onClick={handleSave}
                  disabled={saving || !name.trim()}
                  className="inline-flex items-center gap-2 h-8 px-5 rounded-lg text-[13px] font-semibold text-white transition hover:opacity-90 disabled:opacity-40"
                  style={{ background: '#1F4D3A' }}
                >
                  {saved ? (
                    <>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
                      Saved
                    </>
                  ) : saving ? 'Saving…' : 'Save changes'}
                </button>
              </div>
            </div>
          )}

          {/* ─── Plan tab ────────────────────────────────────────── */}
          {activeTab === 'Plan' && (
            <div className="bg-white rounded-2xl overflow-hidden" style={{ border: '1px solid #E5E0D4', boxShadow: '0 1px 2px rgba(15,31,24,0.04)' }}>
              {/* Current plan header */}
              <div className="px-6 py-6 border-b" style={{ borderColor: '#E5E0D4', background: '#FAF6EE' }}>
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <div className="text-[11px] font-mono text-[#6B7A72]/60 uppercase tracking-widest mb-1.5">Current plan</div>
                    <div className="flex items-center gap-3">
                      <span
                        className="font-display font-bold text-[22px] tracking-tight"
                        style={{ color: plan === 'free' ? '#3A4A42' : '#0F1F18' }}
                      >
                        {planInfo.label}
                      </span>
                      <span
                        className="px-2.5 py-0.5 rounded-full text-[11px] font-mono font-medium"
                        style={plan === 'studio'
                          ? { background: 'linear-gradient(135deg,#1F4D3A,#2A6A50)', color: 'white' }
                          : plan === 'pro'
                          ? { background: '#E8EFEB', border: '1px solid rgba(31,77,58,0.2)', color: '#1F4D3A' }
                          : { background: '#F0EDE8', border: '1px solid #E5E0D4', color: '#6B7A72' }
                        }
                      >
                        {planInfo.limit}
                      </span>
                    </div>
                  </div>
                  {plan !== 'studio' && (
                    <Link
                      href="/pricing"
                      className="inline-flex items-center gap-2 h-9 px-5 rounded-xl text-[13px] font-semibold text-white transition hover:opacity-90 shrink-0"
                      style={{ background: '#1F4D3A' }}
                    >
                      Upgrade
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg>
                    </Link>
                  )}
                </div>
              </div>

              {/* Features */}
              <div className="px-6 py-5">
                <div className="text-[11px] font-mono text-[#6B7A72]/60 uppercase tracking-widest mb-4">What&apos;s included</div>
                <ul className="space-y-3">
                  {planInfo.features.map((f) => (
                    <li key={f.text} className="flex items-center gap-3">
                      <div
                        className="h-5 w-5 rounded-full grid place-items-center shrink-0"
                        style={f.included
                          ? { background: 'rgba(31,77,58,0.08)', border: '1px solid rgba(31,77,58,0.15)' }
                          : { background: '#F5F2EC', border: '1px solid #E5E0D4' }
                        }
                      >
                        {f.included ? <CheckIcon /> : <MinusIcon />}
                      </div>
                      <span className={`text-[13.5px] ${f.included ? 'text-[#3A4A42]' : 'text-[#6B7A72]'}`}>{f.text}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {plan !== 'studio' && (
                <div className="px-6 py-4 border-t" style={{ borderColor: '#E5E0D4', background: '#FAF6EE' }}>
                  <p className="text-[12.5px] text-[#6B7A72]">
                    Compare all features on the{' '}
                    <Link href="/pricing" className="text-[#1F4D3A] font-medium hover:underline">pricing page →</Link>
                  </p>
                </div>
              )}
            </div>
          )}

          {/* ─── Security tab ────────────────────────────────────── */}
          {activeTab === 'Security' && (
            <div className="bg-white rounded-2xl overflow-hidden" style={{ border: '1px solid #E5E0D4', boxShadow: '0 1px 2px rgba(15,31,24,0.04)' }}>
              <div className="px-6 divide-y" style={{ borderColor: '#E5E0D4' }}>
                <Row label="Password">
                  {pwSent ? (
                    <div
                      className="flex items-center gap-3 rounded-xl px-4 py-3"
                      style={{ background: 'rgba(31,77,58,0.06)', border: '1px solid rgba(31,77,58,0.15)' }}
                    >
                      <div className="h-7 w-7 rounded-full grid place-items-center shrink-0" style={{ background: 'rgba(31,77,58,0.12)' }}>
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#1F4D3A" strokeWidth="2.2" strokeLinecap="round">
                          <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/>
                        </svg>
                      </div>
                      <div>
                        <div className="text-[13px] font-medium text-[#1F4D3A]">Reset link sent</div>
                        <div className="text-[12px] text-[#6B7A72]">Check your inbox at {profile?.email}</div>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <p className="text-[13px] text-[#6B7A72]">
                          We&apos;ll email a secure reset link to{' '}
                          <span className="font-medium text-[#0F1F18]">{profile?.email}</span>
                        </p>
                        {pwError && <p className="text-[12px] text-[#B8423C] mt-1">{pwError}</p>}
                      </div>
                      <button
                        onClick={handlePasswordReset}
                        disabled={pwSending}
                        className="h-8 px-4 rounded-lg text-[13px] font-medium transition hover:bg-[#E8EFEB] disabled:opacity-40 shrink-0"
                        style={{ background: 'white', border: '1px solid #E5E0D4', color: '#3A4A42' }}
                      >
                        {pwSending ? 'Sending…' : 'Send reset link'}
                      </button>
                    </div>
                  )}
                </Row>

                <Row label="Two-factor auth">
                  <div className="flex items-center justify-between gap-4">
                    <p className="text-[13px] text-[#6B7A72]">Add an extra layer of security to your account.</p>
                    <span
                      className="px-2.5 py-0.5 rounded-full text-[11px] font-mono"
                      style={{ background: '#F0EDE8', color: '#6B7A72', border: '1px solid #E5E0D4' }}
                    >
                      Coming soon
                    </span>
                  </div>
                </Row>
              </div>
            </div>
          )}

          {/* ─── Account tab ─────────────────────────────────────── */}
          {activeTab === 'Account' && (
            <div className="bg-white rounded-2xl overflow-hidden" style={{ border: '1px solid #E5E0D4', boxShadow: '0 1px 2px rgba(15,31,24,0.04)' }}>
              {/* Danger header */}
              <div className="px-6 py-4 border-b" style={{ borderColor: '#E5E0D4', background: 'rgba(184,66,60,0.03)' }}>
                <div className="text-[13px] font-semibold text-[#B8423C]">Danger zone</div>
                <p className="text-[12.5px] text-[#6B7A72] mt-0.5">Irreversible actions — proceed with caution.</p>
              </div>

              <div className="px-6 divide-y" style={{ borderColor: '#E5E0D4' }}>
                {/* Sign out */}
                <Row label="Sign out">
                  <div className="flex items-center justify-between gap-4">
                    <p className="text-[13px] text-[#6B7A72]">Sign out of Cardly on this device.</p>
                    <button
                      onClick={() => signOut()}
                      className="h-8 px-4 rounded-lg text-[13px] font-medium transition hover:bg-[#E8EFEB] shrink-0"
                      style={{ background: 'white', border: '1px solid #E5E0D4', color: '#3A4A42' }}
                    >
                      Sign out
                    </button>
                  </div>
                </Row>

                {/* Delete account */}
                <Row label="Delete account">
                  <div className="flex items-start justify-between gap-4">
                    <p className="text-[13px] text-[#6B7A72]">
                      Permanently delete your account and all event data.
                      <br />
                      <span className="text-[#B8423C]/80">This cannot be undone.</span>
                    </p>
                    <div className="flex flex-col items-end gap-1.5 shrink-0">
                      <button
                        onClick={handleDeleteAccount}
                        disabled={deleting}
                        className="h-8 px-4 rounded-lg text-[13px] font-medium transition shrink-0 disabled:opacity-40"
                        style={deleteConfirm
                          ? { background: '#B8423C', color: 'white', border: 'none' }
                          : { background: 'white', border: '1px solid rgba(184,66,60,0.35)', color: '#B8423C' }
                        }
                      >
                        {deleting ? 'Deleting…' : deleteConfirm ? 'Confirm — delete forever' : 'Delete account'}
                      </button>
                      {deleteConfirm && !deleting && (
                        <button
                          onClick={() => setDeleteConfirm(false)}
                          className="text-[11.5px] text-[#6B7A72] hover:text-[#0F1F18] transition"
                        >
                          Cancel
                        </button>
                      )}
                      {deleteError && <p className="text-[11px] text-[#B8423C]">{deleteError}</p>}
                    </div>
                  </div>
                </Row>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
