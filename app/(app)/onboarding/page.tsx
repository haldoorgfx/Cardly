'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowRight, Calendar, Ticket, IdCard, Sparkles } from 'lucide-react';

type Step = 1 | 2;

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep]           = useState<Step>(1);
  const [orgName, setOrgName]     = useState('');
  const [saving, setSaving]       = useState(false);
  const [error, setError]         = useState('');

  const canContinue = orgName.trim().length >= 2;

  async function saveWorkspace() {
    if (!canContinue) return;
    setSaving(true);
    setError('');
    try {
      const res = await fetch('/api/orgs/onboard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: orgName.trim() }),
      });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error ?? 'Could not save workspace');
      }
      setStep(2);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div
      className="min-h-screen"
      style={{
        background: '#FAF6EE',
        backgroundImage: 'radial-gradient(circle, rgba(15,31,24,0.04) 1px, transparent 1px)',
        backgroundSize: '24px 24px',
      }}
    >
      {/* Topbar */}
      <header className="h-14 bg-white border-b flex items-center px-6 gap-3" style={{ borderColor: '#E5E0D4' }}>
        <span className="inline-block w-6 h-6 rounded-md shrink-0" style={{ background: 'linear-gradient(135deg, #1F4D3A 0%, #2A6A50 60%, #E8C57E 130%)' }} />
        <span className="font-display text-[18px] font-semibold tracking-tight text-primary">Karta</span>
        {/* Step dots */}
        <div className="flex items-center gap-2 ml-auto">
          {([1, 2] as const).map((s) => (
            <div key={s} className="flex items-center gap-2">
              <div
                className="h-6 w-6 rounded-full grid place-items-center text-[11px] font-mono font-medium transition-colors"
                style={step >= s ? { background: '#1F4D3A', color: 'white' } : { background: '#E5E0D4', color: '#6B7A72' }}
              >
                {s}
              </div>
              {s < 2 && <div className="w-6 h-px transition-colors" style={{ background: step > s ? '#1F4D3A' : '#E5E0D4' }} />}
            </div>
          ))}
          <span className="ml-2 text-[12px] font-mono text-muted">
            {step === 1 ? 'Workspace' : 'First event'}
          </span>
        </div>
      </header>

      <main className="max-w-[560px] mx-auto px-6 py-14">

        {/* ── Step 1 — Name your workspace ─────────────────────── */}
        {step === 1 && (
          <div>
            <div className="inline-grid place-items-center w-12 h-12 rounded-2xl mb-6 text-primary" style={{ background: '#E8EFEB' }}>
              <Sparkles size={22} strokeWidth={1.8} />
            </div>
            <h1 className="font-display text-[28px] font-semibold text-primary tracking-[-0.025em] mb-2">
              Welcome to Karta.
            </h1>
            <p className="text-[15px] text-ink-soft leading-[1.65] mb-8">
              Let&apos;s set up your workspace. This is the name your team and co-organizers will see — you can change it any time.
            </p>

            {error && (
              <div className="mb-5 px-4 py-3 rounded-lg text-[13px]" style={{ background: 'rgba(184,66,60,0.08)', border: '1px solid rgba(184,66,60,0.2)', color: '#B8423C' }}>
                {error}
              </div>
            )}

            <div className="mb-6">
              <label className="block font-mono text-[10px] tracking-[0.14em] uppercase text-muted mb-2">
                Workspace name
              </label>
              <input
                value={orgName}
                onChange={e => setOrgName(e.target.value)}
                placeholder="e.g. AfriTech Events"
                autoFocus
                onKeyDown={e => { if (e.key === 'Enter' && canContinue) saveWorkspace(); }}
                className="w-full h-12 px-4 rounded-lg text-[15px] outline-none transition"
                style={{
                  background: 'white',
                  border: `1px solid ${canContinue ? '#1F4D3A' : '#E5E0D4'}`,
                  color: '#0F1F18',
                  boxShadow: canContinue ? '0 0 0 3px rgba(31,77,58,0.08)' : 'none',
                }}
              />
              <p className="mt-2 text-[12px] text-muted">Your organization name, agency, or your own name.</p>
            </div>

            <button
              onClick={saveWorkspace}
              disabled={!canContinue || saving}
              className="inline-flex items-center gap-2 h-12 px-7 rounded-lg font-medium text-[14px] text-cream transition disabled:opacity-40"
              style={{ background: '#1F4D3A' }}
            >
              {saving ? 'Saving…' : 'Continue'}
              <ArrowRight size={15} strokeWidth={2.2} />
            </button>
          </div>
        )}

        {/* ── Step 2 — First event ─────────────────────────────── */}
        {step === 2 && (
          <div>
            <div className="inline-grid place-items-center w-12 h-12 rounded-2xl mb-6 text-primary" style={{ background: '#E8EFEB' }}>
              <Calendar size={22} strokeWidth={1.8} />
            </div>
            <h1 className="font-display text-[28px] font-semibold text-primary tracking-[-0.025em] mb-2">
              Ready to create your first event?
            </h1>
            <p className="text-[15px] text-ink-soft leading-[1.65] mb-8">
              You can set everything up now, or explore the dashboard first and come back when you&apos;re ready.
            </p>

            {/* Steps preview */}
            <div className="grid sm:grid-cols-3 gap-3 mb-8">
              {[
                { icon: <Calendar size={16} strokeWidth={1.8} />, label: 'Set up your event', body: 'Name, date, venue, cover.' },
                { icon: <Ticket size={16} strokeWidth={1.8} />,   label: 'Add tickets',        body: 'Free or paid registration.' },
                { icon: <IdCard size={16} strokeWidth={1.8} />,   label: 'Karta Card ready',   body: 'Every attendee gets one.' },
              ].map((s, i) => (
                <div key={i} className="bg-white rounded-xl border p-4" style={{ borderColor: '#E5E0D4' }}>
                  <span className="w-7 h-7 rounded-lg grid place-items-center text-primary mb-3" style={{ background: '#E8EFEB' }}>
                    {s.icon}
                  </span>
                  <div className="font-display text-[13px] font-semibold text-ink tracking-tight">{s.label}</div>
                  <p className="text-[12px] text-muted mt-1">{s.body}</p>
                </div>
              ))}
            </div>

            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
              <Link
                href="/events/new"
                className="inline-flex items-center gap-2 h-12 px-7 rounded-lg font-medium text-[14px] text-cream transition hover:bg-primary-dark"
                style={{ background: '#1F4D3A' }}
              >
                Create your first event
                <ArrowRight size={15} strokeWidth={2.2} />
              </Link>
              <Link
                href="/dashboard"
                className="text-[13px] text-muted hover:text-ink transition-colors"
              >
                Skip for now — go to dashboard
              </Link>
            </div>
          </div>
        )}

      </main>
    </div>
  );
}
