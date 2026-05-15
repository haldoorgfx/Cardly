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

/* ── Plan config ───────────────────────────────────────────────────────── */
const PLANS: Record<string, { label: string; limit: string; features: { text: string; included: boolean }[] }> = {
  free: {
    label: 'Free',
    limit: '1 event max',
    features: [
      { text: '1 active event', included: true },
      { text: 'Unlimited attendees', included: true },
      { text: 'Watermark on cards', included: false },
      { text: 'No analytics', included: false },
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
      { text: 'Priority support', included: true },
    ],
  },
};

/* ── Small icons ───────────────────────────────────────────────────────── */
function CheckIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#1F4D3A" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

function MinusIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" className="shrink-0 opacity-30">
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  );
}

/* ── Section card wrapper ───────────────────────────────────────────────── */
function SectionCard({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="bg-white rounded-2xl overflow-hidden"
      style={{ border: '1px solid #E5E0D4', boxShadow: '0 1px 2px rgba(15,31,24,0.04)' }}
    >
      {children}
    </div>
  );
}

/* ── Section header inside card ─────────────────────────────────────────── */
function SectionHeader({ title, desc, danger }: { title: string; desc: string; danger?: boolean }) {
  return (
    <div className="px-6 py-5 border-b" style={{ borderColor: '#E5E0D4', background: danger ? 'rgba(184,66,60,0.03)' : '#FAF6EE' }}>
      <h2 className={`font-display font-semibold text-[15px] ${danger ? 'text-[#B8423C]' : 'text-[#0F1F18]'}`}>{title}</h2>
      <p className="text-[13px] text-[#6B7A72] mt-0.5">{desc}</p>
    </div>
  );
}

/* ── Main component ─────────────────────────────────────────────────────── */
export default function SettingsClient({ profile }: Props) {
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
    <div className="min-h-full" style={{ background: '#F5F5F4' }}>
      <div className="max-w-[720px] mx-auto px-4 sm:px-6 py-8">

        {/* Page header */}
        <div className="mb-8">
          <div className="text-[11px] font-mono text-[#6B7A72]/50 tracking-widest uppercase mb-2">Account</div>
          <h1 className="font-display font-bold text-[28px] text-[#0F1F18] tracking-tight">Settings</h1>
          <p className="text-[14px] text-[#6B7A72] mt-1">Manage your profile, plan, and account preferences.</p>
        </div>

        <div className="space-y-4">

          {/* ── Profile ── */}
          <SectionCard>
            <SectionHeader title="Profile" desc="Your public name and account email." />
            <div className="p-6 space-y-5">

              {/* Avatar row */}
              <div className="flex items-center gap-4">
                <div
                  className="h-14 w-14 rounded-2xl grid place-items-center text-white font-display font-bold text-[18px] shrink-0"
                  style={{ background: 'linear-gradient(135deg, #1F4D3A 0%, #2A6A50 60%, #E8C57E 130%)' }}
                >
                  {nameInitials}
                </div>
                <div>
                  <div className="font-display font-semibold text-[16px] text-[#0F1F18]">{name || 'Your name'}</div>
                  <div className="text-[13px] text-[#6B7A72] mt-0.5">{profile?.email}</div>
                </div>
              </div>

              {/* Fields */}
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[12px] font-medium text-[#3A4A42] mb-1.5 uppercase tracking-wide font-mono">
                    Full name
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleSave()}
                    placeholder="Your name"
                    className="w-full h-10 px-3.5 rounded-xl text-[14px] text-[#0F1F18] placeholder:text-[#6B7A72]/40 transition focus:outline-none"
                    style={{ border: '1px solid #E5E0D4', background: '#FAF6EE' }}
                    onFocus={e => { e.currentTarget.style.borderColor = 'rgba(31,77,58,0.4)'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(31,77,58,0.1)'; }}
                    onBlur={e => { e.currentTarget.style.borderColor = '#E5E0D4'; e.currentTarget.style.boxShadow = 'none'; }}
                  />
                </div>
                <div>
                  <label className="block text-[12px] font-medium text-[#3A4A42] mb-1.5 uppercase tracking-wide font-mono">
                    Email
                  </label>
                  <input
                    type="email"
                    value={profile?.email ?? ''}
                    disabled
                    className="w-full h-10 px-3.5 rounded-xl text-[14px] text-[#6B7A72]/60 cursor-not-allowed"
                    style={{ border: '1px solid #E5E0D4', background: '#F5F2EC' }}
                  />
                  <p className="text-[11px] text-[#6B7A72]/50 mt-1.5">Email cannot be changed.</p>
                </div>
              </div>

              {saveError && (
                <p className="text-[13px] text-[#B8423C] bg-red-50 border border-red-200 rounded-lg px-4 py-2.5">{saveError}</p>
              )}

              <div className="flex items-center gap-3">
                <button
                  onClick={handleSave}
                  disabled={saving || !name.trim()}
                  className="inline-flex items-center gap-2 h-9 px-5 rounded-xl text-[13px] font-semibold text-white transition hover:opacity-90 disabled:opacity-40"
                  style={{ background: '#1F4D3A' }}
                >
                  {saved ? (
                    <>
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
                      Saved
                    </>
                  ) : saving ? 'Saving…' : 'Save changes'}
                </button>
                {saved && <span className="text-[12px] text-emerald-600">Changes saved successfully.</span>}
              </div>
            </div>
          </SectionCard>

          {/* ── Plan ── */}
          <SectionCard>
            <SectionHeader title="Plan" desc="Your current subscription and usage." />
            <div className="p-6">
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-6">
                {/* Plan badge + features */}
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-4">
                    <div
                      className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl"
                      style={plan === 'studio'
                        ? { background: 'linear-gradient(135deg, #1F4D3A, #2A6A50)', color: 'white' }
                        : plan === 'pro'
                        ? { background: '#E8EFEB', border: '1px solid rgba(31,77,58,0.2)', color: '#1F4D3A' }
                        : { background: '#F5F2EC', border: '1px solid #E5E0D4', color: '#3A4A42' }
                      }
                    >
                      <span className="font-display font-semibold text-[14px]">{planInfo.label}</span>
                      <span className="text-[11px] opacity-70">· {planInfo.limit}</span>
                    </div>
                  </div>
                  <ul className="space-y-2.5">
                    {planInfo.features.map((f) => (
                      <li key={f.text} className="flex items-center gap-2.5">
                        <div
                          className="h-5 w-5 rounded-full grid place-items-center shrink-0"
                          style={f.included
                            ? { background: 'rgba(31,77,58,0.08)', border: '1px solid rgba(31,77,58,0.15)' }
                            : { background: '#F5F2EC', border: '1px solid #E5E0D4' }
                          }
                        >
                          {f.included ? <CheckIcon /> : <MinusIcon />}
                        </div>
                        <span className={`text-[13px] ${f.included ? 'text-[#3A4A42]' : 'text-[#6B7A72]'}`}>
                          {f.text}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* CTA */}
                {plan !== 'studio' && (
                  <div className="shrink-0">
                    <Link
                      href="/pricing"
                      className="inline-flex items-center gap-2 h-9 px-5 rounded-xl text-[13px] font-semibold text-white transition hover:opacity-90"
                      style={{ background: '#1F4D3A' }}
                    >
                      Upgrade plan
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg>
                    </Link>
                    <p className="text-[11px] text-[#6B7A72] mt-2 text-right">No credit card required</p>
                  </div>
                )}
              </div>
            </div>
          </SectionCard>

          {/* ── Password ── */}
          <SectionCard>
            <SectionHeader title="Password" desc="Reset your password via a secure email link." />
            <div className="p-6">
              {pwSent ? (
                <div
                  className="flex items-center gap-3 rounded-xl px-4 py-3"
                  style={{ background: 'rgba(31,77,58,0.06)', border: '1px solid rgba(31,77,58,0.15)' }}
                >
                  <div className="h-8 w-8 rounded-full grid place-items-center shrink-0" style={{ background: 'rgba(31,77,58,0.12)' }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#1F4D3A" strokeWidth="2.2" strokeLinecap="round">
                      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/>
                    </svg>
                  </div>
                  <div>
                    <div className="text-[13px] font-medium text-[#1F4D3A]">Reset link sent</div>
                    <div className="text-[12px] text-[#6B7A72]">Check your inbox at {profile?.email}</div>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div>
                    <p className="text-[13px] text-[#3A4A42]">
                      A secure reset link will be sent to{' '}
                      <span className="font-medium text-[#0F1F18]">{profile?.email}</span>.
                    </p>
                    {pwError && <p className="text-[12px] text-[#B8423C] mt-1.5">{pwError}</p>}
                  </div>
                  <button
                    onClick={handlePasswordReset}
                    disabled={pwSending}
                    className="inline-flex items-center gap-2 h-9 px-5 rounded-xl text-[13px] font-medium transition hover:bg-[#E8EFEB] disabled:opacity-40 shrink-0"
                    style={{ background: 'white', border: '1px solid #E5E0D4', color: '#3A4A42' }}
                  >
                    {pwSending ? 'Sending…' : 'Send reset link'}
                  </button>
                </div>
              )}
            </div>
          </SectionCard>

          {/* ── Danger zone ── */}
          <SectionCard>
            <SectionHeader title="Danger zone" desc="Irreversible actions. Proceed with caution." danger />
            <div className="p-6 space-y-0 divide-y" style={{ borderColor: '#E5E0D4' }}>

              {/* Sign out row */}
              <div className="flex items-center justify-between py-4 first:pt-0">
                <div>
                  <div className="text-[14px] font-medium text-[#0F1F18]">Sign out</div>
                  <div className="text-[12px] text-[#6B7A72] mt-0.5">Sign out of this device and session.</div>
                </div>
                <button
                  onClick={() => signOut()}
                  className="inline-flex items-center gap-2 h-8 px-4 rounded-lg text-[13px] font-medium transition hover:bg-[#E8EFEB] shrink-0"
                  style={{ background: 'white', border: '1px solid #E5E0D4', color: '#3A4A42' }}
                >
                  Sign out
                </button>
              </div>

              {/* Delete account row */}
              <div className="flex items-start justify-between gap-4 py-4 last:pb-0">
                <div>
                  <div className="text-[14px] font-medium text-[#0F1F18]">Delete account</div>
                  <div className="text-[12px] text-[#6B7A72] mt-0.5">Permanently delete your account and all event data. This cannot be undone.</div>
                </div>
                <div className="flex flex-col items-end gap-1.5 shrink-0">
                  <button
                    onClick={handleDeleteAccount}
                    disabled={deleting}
                    className="inline-flex items-center gap-2 h-8 px-4 rounded-lg text-[13px] font-medium transition shrink-0 disabled:opacity-40"
                    style={deleteConfirm
                      ? { background: '#B8423C', color: 'white', border: 'none' }
                      : { background: 'white', border: '1px solid rgba(184,66,60,0.3)', color: '#B8423C' }
                    }
                  >
                    {deleting ? 'Deleting…' : deleteConfirm ? 'Tap again to confirm' : 'Delete account'}
                  </button>
                  {deleteConfirm && !deleting && (
                    <p className="text-[11px] text-[#B8423C]/70">This will erase all your events and data.</p>
                  )}
                  {deleteError && <p className="text-[11px] text-[#B8423C]">{deleteError}</p>}
                </div>
              </div>
            </div>
          </SectionCard>

        </div>

        {/* Footer note */}
        <p className="mt-8 text-center text-[12px] text-[#6B7A72]/50">
          Cardly © 2026 · <a href="#" className="hover:text-[#3A4A42] transition">Privacy</a> · <a href="#" className="hover:text-[#3A4A42] transition">Terms</a>
        </p>
      </div>
    </div>
  );
}
