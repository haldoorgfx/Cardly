'use client';

import { useState } from 'react';
import Link from 'next/link';
import { signOut } from '@/app/(auth)/actions';

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
  free: 'Free (Sketch)',
  pro: 'Pro (Studio)',
  studio: 'Studio (Agency)',
};

export default function SettingsClient({ profile }: Props) {
  const [name, setName] = useState(profile?.full_name ?? '');
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);

  const [saveError, setSaveError] = useState<string | null>(null);

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

  const planLabel = PLAN_LABELS[profile?.plan ?? 'free'] ?? 'Free';

  return (
    <div className="px-8 py-8 max-w-[700px]">
      <div className="mb-8">
        <div className="flex items-center gap-2 text-[12px] font-mono text-[#0F1F18]/40">
          <span>WORKSPACE</span><span>/</span><span className="text-[#0F1F18]/70">Settings</span>
        </div>
        <h1 className="mt-2 font-display font-bold text-[34px] leading-tight">Settings</h1>
        <p className="text-[#0F1F18]/60 mt-1 text-[14.5px]">Manage your account and workspace preferences.</p>
      </div>

      <div className="space-y-5">
        {/* Profile */}
        <div className="bg-white rounded-2xl border border-[#E5E0D4] p-6 shadow-soft">
          <div className="text-[11px] font-mono tracking-widest text-[#0F1F18]/45 mb-5">PROFILE</div>
          <div className="flex items-center gap-4 mb-5">
            <div
              className="h-14 w-14 rounded-2xl grid place-items-center text-white font-display font-bold text-[20px] shrink-0"
              style={{ background: '#1F4D3A' }}
            >
              {name ? name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase() : '?'}
            </div>
            <div>
              <div className="font-display font-semibold text-[16px]">{name || 'Your name'}</div>
              <div className="text-[13px] text-[#0F1F18]/50">{profile?.email}</div>
            </div>
          </div>
          <div className="space-y-3">
            <label className="block">
              <div className="text-[12px] text-[#0F1F18]/60 mb-1.5">Full name</div>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                className="w-full h-10 px-3 rounded-xl border border-[#E5E0D4] bg-[#FAF6EE] text-[13.5px] focus:bg-white focus:border-[#1F4D3A] outline-none transition"
              />
            </label>
            <label className="block">
              <div className="text-[12px] text-[#0F1F18]/60 mb-1.5">Email</div>
              <input
                type="email"
                value={profile?.email ?? ''}
                disabled
                className="w-full h-10 px-3 rounded-xl border border-[#E5E0D4] bg-[#FAF6EE] text-[13.5px] text-[#0F1F18]/50 cursor-not-allowed"
              />
            </label>
          </div>
          {saveError && (
            <div className="mt-3 text-[12.5px] text-rose-600 bg-rose-50 px-3 py-2 rounded-xl">{saveError}</div>
          )}
          <button
            onClick={handleSave}
            disabled={saving || !name.trim()}
            className="mt-4 inline-flex items-center gap-2 text-[13.5px] font-semibold text-white px-4 py-2 rounded-xl hover:opacity-95 disabled:opacity-60 transition"
            style={{ background: '#1F4D3A' }}
          >
            {saved ? (
              <>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
                Saved
              </>
            ) : saving ? 'Saving…' : 'Save changes'}
          </button>
        </div>

        {/* Plan */}
        <div className="bg-white rounded-2xl border border-[#E5E0D4] p-6 shadow-soft">
          <div className="flex items-center justify-between mb-4">
            <div className="text-[11px] font-mono tracking-widest text-[#0F1F18]/45">PLAN</div>
            <span className="text-[11px] font-mono px-2.5 py-1 rounded-full text-[#1F4D3A] bg-[#1F4D3A]/10">{planLabel}</span>
          </div>
          <div className="space-y-2.5 text-[13px] mb-4">
            {profile?.plan === 'free' && (
              <>
                <div className="flex items-center gap-2 text-[#0F1F18]/70"><CheckIcon/> 1 active event</div>
                <div className="flex items-center gap-2 text-[#0F1F18]/40"><XIcon/> Watermark on cards</div>
                <div className="flex items-center gap-2 text-[#0F1F18]/40"><XIcon/> Custom domain</div>
              </>
            )}
            {profile?.plan === 'pro' && (
              <>
                <div className="flex items-center gap-2 text-[#0F1F18]/70"><CheckIcon/> 10 active events</div>
                <div className="flex items-center gap-2 text-[#0F1F18]/70"><CheckIcon/> No watermark</div>
                <div className="flex items-center gap-2 text-[#0F1F18]/40"><XIcon/> Custom domain</div>
              </>
            )}
            {profile?.plan === 'studio' && (
              <>
                <div className="flex items-center gap-2 text-[#0F1F18]/70"><CheckIcon/> Unlimited events</div>
                <div className="flex items-center gap-2 text-[#0F1F18]/70"><CheckIcon/> No watermark</div>
                <div className="flex items-center gap-2 text-[#0F1F18]/70"><CheckIcon/> Custom domain</div>
              </>
            )}
          </div>
          {profile?.plan !== 'studio' && (
            <Link href="/pricing" className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-white px-4 py-2 rounded-xl hover:opacity-95 transition" style={{ background: '#1F4D3A' }}>
              Upgrade plan →
            </Link>
          )}
        </div>

        {/* Password */}
        <div className="bg-white rounded-2xl border border-[#E5E0D4] p-6 shadow-soft">
          <div className="text-[11px] font-mono tracking-widest text-[#0F1F18]/45 mb-4">PASSWORD</div>
          <p className="text-[13px] text-[#0F1F18]/60 mb-3">Use a strong, unique password for your account.</p>
          <button className="text-[13px] font-medium text-[#1F4D3A] border border-[#1F4D3A]/30 px-4 py-2 rounded-xl hover:bg-[#1F4D3A]/5 transition">
            Change password
          </button>
        </div>

        {/* Danger zone */}
        <div className="bg-white rounded-2xl border border-rose-100 p-6">
          <div className="text-[11px] font-mono tracking-widest text-rose-400 mb-4">DANGER ZONE</div>
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <div className="text-[13.5px] font-medium">Delete account</div>
              <div className="text-[12.5px] text-[#0F1F18]/50 mt-0.5">Permanently delete your account and all data. This cannot be undone.</div>
            </div>
            <button className="text-[13px] font-medium text-rose-600 border border-rose-200 px-4 py-2 rounded-xl hover:bg-rose-50 transition">
              Delete account
            </button>
          </div>
          <div className="mt-4 pt-4 border-t border-[#FAF6EE] flex items-center justify-between flex-wrap gap-3">
            <div>
              <div className="text-[13.5px] font-medium">Sign out</div>
              <div className="text-[12.5px] text-[#0F1F18]/50 mt-0.5">Sign out of your account on this device.</div>
            </div>
            <button
              onClick={() => signOut()}
              className="text-[13px] font-medium text-[#0F1F18]/70 border border-[#E5E0D4] px-4 py-2 rounded-xl hover:bg-[#FAF6EE] transition"
            >
              Sign out
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
