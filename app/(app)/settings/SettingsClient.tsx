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

const PLAN_LABELS: Record<string, string> = {
  free: 'Free (Sketch)',
  pro: 'Pro (Studio)',
  studio: 'Studio (Agency)',
};

export default function SettingsClient({ profile }: Props) {
  const [name, setName] = useState(profile?.full_name ?? '');
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    // In production, add a PATCH /api/profile route
    await new Promise(r => setTimeout(r, 600));
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const planLabel = PLAN_LABELS[profile?.plan ?? 'free'] ?? 'Free';

  return (
    <div className="px-8 py-8 max-w-[700px]">
      <div className="mb-8">
        <div className="flex items-center gap-2 text-[12px] font-mono text-[#0f0f1a]/40">
          <span>WORKSPACE</span><span>/</span><span className="text-[#0f0f1a]/70">Settings</span>
        </div>
        <h1 className="mt-2 font-display font-bold text-[34px] leading-tight">Settings</h1>
        <p className="text-[#0f0f1a]/60 mt-1 text-[14.5px]">Manage your account and workspace preferences.</p>
      </div>

      <div className="space-y-5">
        {/* Profile */}
        <div className="bg-white rounded-2xl border border-[#e5e5ea] p-6 shadow-soft">
          <div className="text-[11px] font-mono tracking-widest text-[#0f0f1a]/45 mb-5">PROFILE</div>
          <div className="flex items-center gap-4 mb-5">
            <div
              className="h-14 w-14 rounded-2xl grid place-items-center text-white font-display font-bold text-[20px] shrink-0"
              style={{ background: 'linear-gradient(135deg,#6c63ff,#f8a4d8)' }}
            >
              {name ? name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase() : '?'}
            </div>
            <div>
              <div className="font-display font-semibold text-[16px]">{name || 'Your name'}</div>
              <div className="text-[13px] text-[#0f0f1a]/50">{profile?.email}</div>
            </div>
          </div>
          <div className="space-y-3">
            <label className="block">
              <div className="text-[12px] text-[#0f0f1a]/60 mb-1.5">Full name</div>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                className="w-full h-10 px-3 rounded-xl border border-[#e5e5ea] bg-[#fafafa] text-[13.5px] focus:bg-white focus:border-[#6c63ff] outline-none transition"
              />
            </label>
            <label className="block">
              <div className="text-[12px] text-[#0f0f1a]/60 mb-1.5">Email</div>
              <input
                type="email"
                value={profile?.email ?? ''}
                disabled
                className="w-full h-10 px-3 rounded-xl border border-[#e5e5ea] bg-[#fafafa] text-[13.5px] text-[#0f0f1a]/50 cursor-not-allowed"
              />
            </label>
          </div>
          <button
            onClick={handleSave}
            disabled={saving}
            className="mt-4 inline-flex items-center gap-2 text-[13.5px] font-semibold text-white px-4 py-2 rounded-xl hover:opacity-95 transition"
            style={{ background: 'linear-gradient(135deg,#6c63ff,#f8a4d8)' }}
          >
            {saved ? '✓ Saved' : saving ? 'Saving…' : 'Save changes'}
          </button>
        </div>

        {/* Plan */}
        <div className="bg-white rounded-2xl border border-[#e5e5ea] p-6 shadow-soft">
          <div className="flex items-center justify-between mb-4">
            <div className="text-[11px] font-mono tracking-widest text-[#0f0f1a]/45">PLAN</div>
            <span className="text-[11px] font-mono px-2.5 py-1 rounded-full text-[#6c63ff] bg-[#6c63ff]/10">{planLabel}</span>
          </div>
          <div className="space-y-2.5 text-[13px] mb-4">
            {profile?.plan === 'free' && (
              <>
                <div className="flex items-center gap-2 text-[#0f0f1a]/70"><span className="text-emerald-500">✓</span> 1 active event</div>
                <div className="flex items-center gap-2 text-[#0f0f1a]/40"><span>✗</span> Watermark on cards</div>
                <div className="flex items-center gap-2 text-[#0f0f1a]/40"><span>✗</span> Custom domain</div>
              </>
            )}
            {profile?.plan === 'pro' && (
              <>
                <div className="flex items-center gap-2 text-[#0f0f1a]/70"><span className="text-emerald-500">✓</span> 10 active events</div>
                <div className="flex items-center gap-2 text-[#0f0f1a]/70"><span className="text-emerald-500">✓</span> No watermark</div>
                <div className="flex items-center gap-2 text-[#0f0f1a]/40"><span>✗</span> Custom domain</div>
              </>
            )}
            {profile?.plan === 'studio' && (
              <>
                <div className="flex items-center gap-2 text-[#0f0f1a]/70"><span className="text-emerald-500">✓</span> Unlimited events</div>
                <div className="flex items-center gap-2 text-[#0f0f1a]/70"><span className="text-emerald-500">✓</span> No watermark</div>
                <div className="flex items-center gap-2 text-[#0f0f1a]/70"><span className="text-emerald-500">✓</span> Custom domain</div>
              </>
            )}
          </div>
          {profile?.plan !== 'studio' && (
            <Link href="/pricing" className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-white px-4 py-2 rounded-xl hover:opacity-95 transition" style={{ background: 'linear-gradient(135deg,#6c63ff,#f8a4d8)' }}>
              Upgrade plan →
            </Link>
          )}
        </div>

        {/* Password */}
        <div className="bg-white rounded-2xl border border-[#e5e5ea] p-6 shadow-soft">
          <div className="text-[11px] font-mono tracking-widest text-[#0f0f1a]/45 mb-4">PASSWORD</div>
          <p className="text-[13px] text-[#0f0f1a]/60 mb-3">Use a strong, unique password for your account.</p>
          <button className="text-[13px] font-medium text-[#6c63ff] border border-[#6c63ff]/30 px-4 py-2 rounded-xl hover:bg-[#6c63ff]/5 transition">
            Change password
          </button>
        </div>

        {/* Danger zone */}
        <div className="bg-white rounded-2xl border border-rose-100 p-6">
          <div className="text-[11px] font-mono tracking-widest text-rose-400 mb-4">DANGER ZONE</div>
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <div className="text-[13.5px] font-medium">Delete account</div>
              <div className="text-[12.5px] text-[#0f0f1a]/50 mt-0.5">Permanently delete your account and all data. This cannot be undone.</div>
            </div>
            <button className="text-[13px] font-medium text-rose-600 border border-rose-200 px-4 py-2 rounded-xl hover:bg-rose-50 transition">
              Delete account
            </button>
          </div>
          <div className="mt-4 pt-4 border-t border-[#fafafa] flex items-center justify-between flex-wrap gap-3">
            <div>
              <div className="text-[13.5px] font-medium">Sign out</div>
              <div className="text-[12.5px] text-[#0f0f1a]/50 mt-0.5">Sign out of your account on this device.</div>
            </div>
            <button
              onClick={() => signOut()}
              className="text-[13px] font-medium text-[#0f0f1a]/70 border border-[#e5e5ea] px-4 py-2 rounded-xl hover:bg-[#fafafa] transition"
            >
              Sign out
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
