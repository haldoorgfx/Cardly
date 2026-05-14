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

function CheckIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
      <polyline points="20 6 9 17 4 12"/>
    </svg>
  );
}

function XIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" className="shrink-0 opacity-40">
      <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
    </svg>
  );
}

const PLAN_LABELS: Record<string, string> = {
  free: 'Free',
  pro: 'Pro',
  studio: 'Studio',
};

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
    // On success, deleteAccount() redirects to "/" — no need to handle here
  };

  const plan = profile?.plan ?? 'free';
  const planLabel = PLAN_LABELS[plan] ?? 'Free';
  const nameInitials = name
    ? name.split(' ').map((w: string) => w[0]).slice(0, 2).join('').toUpperCase()
    : '?';

  return (
    <div className="max-w-[640px] px-6 py-8">
      <h1 className="text-xl font-semibold text-[#0F1F18] mb-8">Settings</h1>

      {/* Profile */}
      <section className="pb-8 border-b border-neutral-100 mb-8">
        <div className="flex flex-col gap-2 md:grid md:grid-cols-[200px_1fr] md:gap-8">
          <div>
            <h2 className="text-[14px] font-semibold text-neutral-900">Profile</h2>
            <p className="text-[13px] text-neutral-500 mt-1">Your name and email.</p>
          </div>
          <div className="space-y-4">
            {/* Avatar row */}
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-[#1F4D3A] grid place-items-center text-white font-semibold text-[14px] shrink-0">
                {nameInitials}
              </div>
              <div>
                <div className="text-[14px] font-medium text-[#0F1F18]">{name || 'Your name'}</div>
                <div className="text-[12px] text-neutral-500">{profile?.email}</div>
              </div>
            </div>
            <div>
              <label className="block text-[13px] font-medium text-neutral-700 mb-1.5">Full name</label>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                className="w-full h-9 px-3 rounded-md border border-neutral-200 bg-white text-[14px] focus:outline-none focus:ring-2 focus:ring-neutral-900/10 focus:border-neutral-400 transition"
              />
            </div>
            <div>
              <label className="block text-[13px] font-medium text-neutral-700 mb-1.5">Email</label>
              <input
                type="email"
                value={profile?.email ?? ''}
                disabled
                className="w-full h-9 px-3 rounded-md border border-neutral-200 bg-neutral-50 text-[14px] text-neutral-400 cursor-not-allowed"
              />
            </div>
            {saveError && <p className="text-[12px] text-red-600">{saveError}</p>}
            <button
              onClick={handleSave}
              disabled={saving || !name.trim()}
              className="h-8 px-4 bg-[#0F1F18] text-white text-[13px] font-medium rounded-md hover:bg-neutral-800 disabled:opacity-40 transition inline-flex items-center gap-1.5"
            >
              {saved ? '✓ Saved' : saving ? 'Saving…' : 'Save changes'}
            </button>
          </div>
        </div>
      </section>

      {/* Plan */}
      <section className="pb-8 border-b border-neutral-100 mb-8">
        <div className="flex flex-col gap-2 md:grid md:grid-cols-[200px_1fr] md:gap-8">
          <div>
            <h2 className="text-[14px] font-semibold text-neutral-900">Plan</h2>
            <p className="text-[13px] text-neutral-500 mt-1">Your current subscription.</p>
          </div>
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-2 rounded-md border border-neutral-200 bg-white mb-3">
              <span className="text-[13px] font-medium text-[#0F1F18]">{planLabel}</span>
              <span className="h-1 w-1 rounded-full bg-neutral-300"/>
              {plan === 'free' && <span className="text-[12px] text-neutral-500">1 event max</span>}
              {plan === 'pro' && <span className="text-[12px] text-neutral-500">10 events</span>}
              {plan === 'studio' && <span className="text-[12px] text-neutral-500">Unlimited</span>}
            </div>
            <div className="space-y-1.5 mb-4 text-[13px]">
              {plan === 'free' && (
                <>
                  <div className="flex items-center gap-2 text-neutral-700"><CheckIcon/> 1 active event</div>
                  <div className="flex items-center gap-2 text-neutral-400"><XIcon/> Watermark on cards</div>
                  <div className="flex items-center gap-2 text-neutral-400"><XIcon/> Custom domain</div>
                </>
              )}
              {plan === 'pro' && (
                <>
                  <div className="flex items-center gap-2 text-neutral-700"><CheckIcon/> 10 active events</div>
                  <div className="flex items-center gap-2 text-neutral-700"><CheckIcon/> No watermark</div>
                  <div className="flex items-center gap-2 text-neutral-400"><XIcon/> Custom domain</div>
                </>
              )}
              {plan === 'studio' && (
                <>
                  <div className="flex items-center gap-2 text-neutral-700"><CheckIcon/> Unlimited events</div>
                  <div className="flex items-center gap-2 text-neutral-700"><CheckIcon/> No watermark</div>
                  <div className="flex items-center gap-2 text-neutral-700"><CheckIcon/> Custom domain</div>
                </>
              )}
            </div>
            {profile?.plan !== 'studio' && (
              <Link
                href="/pricing"
                className="h-8 px-4 bg-[#0F1F18] text-white text-[13px] font-medium rounded-md hover:bg-neutral-800 transition inline-flex items-center"
              >
                Upgrade →
              </Link>
            )}
          </div>
        </div>
      </section>

      {/* Password */}
      <section className="pb-8 border-b border-neutral-100 mb-8">
        <div className="flex flex-col gap-2 md:grid md:grid-cols-[200px_1fr] md:gap-8">
          <div>
            <h2 className="text-[14px] font-semibold text-neutral-900">Password</h2>
            <p className="text-[13px] text-neutral-500 mt-1">Reset via email link.</p>
          </div>
          <div>
            {pwSent ? (
              <p className="text-[13px] text-emerald-600">
                Reset link sent to {profile?.email}. Check your inbox.
              </p>
            ) : (
              <>
                <p className="text-[13px] text-neutral-500 mb-3">
                  A reset link will be sent to <strong className="text-neutral-700">{profile?.email}</strong>.
                </p>
                {pwError && <p className="text-[12px] text-red-600 mb-2">{pwError}</p>}
                <button
                  onClick={handlePasswordReset}
                  disabled={pwSending}
                  className="h-8 px-4 border border-neutral-200 bg-white text-[13px] font-medium rounded-md hover:bg-neutral-50 disabled:opacity-40 transition"
                >
                  {pwSending ? 'Sending…' : 'Send reset link'}
                </button>
              </>
            )}
          </div>
        </div>
      </section>

      {/* Danger zone */}
      <section>
        <div className="flex flex-col gap-2 md:grid md:grid-cols-[200px_1fr] md:gap-8">
          <div>
            <h2 className="text-[14px] font-semibold text-red-600">Danger zone</h2>
            <p className="text-[13px] text-neutral-500 mt-1">Irreversible actions.</p>
          </div>
          <div className="space-y-4">
            {/* Sign out row */}
            <div className="flex items-center justify-between py-3 border-b border-neutral-100">
              <div>
                <div className="text-[13px] font-medium text-[#0F1F18]">Sign out</div>
                <div className="text-[12px] text-neutral-500">Sign out of this device.</div>
              </div>
              <button
                onClick={() => signOut()}
                className="h-8 px-3 border border-neutral-200 bg-white text-[13px] rounded-md hover:bg-neutral-50 transition"
              >
                Sign out
              </button>
            </div>
            {/* Delete account row */}
            <div className="flex items-center justify-between py-3">
              <div>
                <div className="text-[13px] font-medium text-[#0F1F18]">Delete account</div>
                <div className="text-[12px] text-neutral-500">Permanently delete your account and all data.</div>
              </div>
              <div className="flex flex-col items-end gap-1">
                <button
                  onClick={handleDeleteAccount}
                  disabled={deleting}
                  className="h-8 px-3 border border-red-200 text-red-600 text-[13px] rounded-md hover:bg-red-50 disabled:opacity-40 transition"
                >
                  {deleting ? 'Deleting…' : deleteConfirm ? 'Confirm delete' : 'Delete account'}
                </button>
                {deleteConfirm && !deleting && (
                  <p className="text-[11px] text-red-500">This cannot be undone. Click again to confirm.</p>
                )}
                {deleteError && <p className="text-[11px] text-red-600">{deleteError}</p>}
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
