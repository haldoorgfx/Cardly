'use client';

import { X, ArrowRight, Sparkles, Lock } from 'lucide-react';

export type UpgradeFeature = {
  id: string;
  label: string;
  icon: React.ReactNode;
  minPlan: 'pro' | 'studio';
};

const FEATURE_COPY: Record<string, string> = {
  networking: 'Let attendees build profiles, message 1:1, and get matched by interests and goals. Turn your event into a network, not just a room.',
  'q-and-a': 'Run live Q&A and polls in every session. Surface the best questions and keep remote and in-room attendees equally engaged.',
  gamification: 'Award points for check-ins, sessions and connections, with a live leaderboard and badges that keep attendees moving all day.',
  sponsors: 'Give sponsors branded booths, lead retrieval and a measurable showcase — so you can prove ROI and sell next year\'s package.',
  virtual: 'Stream sessions to a polished online venue with chat and recordings, so remote attendees get the full experience.',
};

const PRO_BULLETS = ['Unlimited events', 'Agenda, speakers & networking', '1:1 attendee messaging', 'Watermark removed'];
const STUDIO_BULLETS = ['AI matchmaking & networking', 'Live Q&A, polls & gamification', 'Sponsor tools & lead retrieval', 'API access & multiple brand kits'];

interface Props {
  feature: UpgradeFeature | null;
  onClose: () => void;
}

export function UpgradeSlideOver({ feature, onClose }: Props) {
  const open = !!feature;
  const targetPlan = feature?.minPlan ?? 'pro';
  const bullets = targetPlan === 'studio' ? STUDIO_BULLETS : PRO_BULLETS;
  const planLabel = targetPlan === 'studio' ? 'Studio' : 'Pro';

  return (
    <div className={`fixed inset-0 z-50 ${open ? '' : 'pointer-events-none'}`}>
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="absolute inset-0 bg-[#0F1F18]/30 transition-opacity duration-200"
        style={{ opacity: open ? 1 : 0 }}
      />

      {/* Panel */}
      <div
        className="absolute right-0 top-0 h-full w-[380px] max-w-[90vw] flex flex-col transition-transform duration-250"
        style={{
          background: '#FAF6EE',
          borderLeft: '1px solid #E5E0D4',
          boxShadow: '-4px 0 40px rgba(15,31,24,0.12)',
          transform: open ? 'translateX(0)' : 'translateX(100%)',
        }}
      >
        {open && feature && (
          <>
            {/* Header */}
            <div className="flex items-center justify-between px-6 pt-5 pb-4" style={{ borderBottom: '1px solid #E5E0D4' }}>
              <span className="font-mono text-[10px] tracking-[0.2em] uppercase inline-flex items-center gap-1.5" style={{ color: '#C9A45E' }}>
                <Sparkles size={11} strokeWidth={1.8} /> {planLabel} feature
              </span>
              <button
                onClick={onClose}
                className="w-8 h-8 grid place-items-center rounded-lg transition hover:bg-[#E8EFEB]"
                style={{ color: '#6B7A72' }}
              >
                <X size={16} strokeWidth={2} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-6">
              {/* Hero card */}
              <div
                className="relative rounded-2xl p-6 mb-6 overflow-hidden"
                style={{ background: 'linear-gradient(140deg, #163828 0%, #1F4D3A 60%, #2A6A50 110%)' }}
              >
                <div
                  aria-hidden
                  className="absolute inset-0"
                  style={{ background: 'radial-gradient(60% 90% at 100% 0%, rgba(232,197,126,0.34), transparent 60%)' }}
                />
                <div className="relative">
                  <span className="inline-grid place-items-center w-11 h-11 rounded-xl mb-4"
                    style={{ background: 'rgba(250,246,238,0.1)', border: '1px solid rgba(250,246,238,0.15)', color: '#E8C57E' }}>
                    {feature.icon}
                  </span>
                  <div className="font-display text-[20px] font-semibold tracking-tight" style={{ color: '#FAF6EE' }}>
                    {feature.label}
                  </div>
                </div>
              </div>

              <p className="text-[14.5px] leading-[1.65]" style={{ color: '#3A4A42' }}>
                {FEATURE_COPY[feature.id] ?? 'Unlock the full Karta platform — networking, live engagement, sponsor tools and more.'}
              </p>

              <div className="mt-6 mb-3 font-mono text-[10px] tracking-[0.18em] uppercase" style={{ color: '#9BA8A1' }}>
                What you get on {planLabel}
              </div>
              <ul className="space-y-3">
                {bullets.map((b, i) => (
                  <li key={i} className="flex items-start gap-2.5 text-[14px]" style={{ color: '#3A4A42' }}>
                    <span className="mt-0.5 shrink-0" style={{ color: '#1F4D3A' }}>
                      <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                        <path d="M2 7l3.5 3.5L12 3.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </span>
                    {b}
                  </li>
                ))}
              </ul>

              {/* Lock callout */}
              <div className="mt-6 flex items-center gap-2.5 px-4 py-3 rounded-xl"
                style={{ background: 'rgba(232,197,126,0.12)', border: '1px solid rgba(232,197,126,0.3)' }}>
                <Lock size={13} strokeWidth={1.8} style={{ color: '#C9A45E', flexShrink: 0 }} />
                <span className="text-[12.5px]" style={{ color: '#6B7A72' }}>
                  Available on the <strong style={{ color: '#0F1F18' }}>{planLabel}</strong> plan and above.
                </span>
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-5 grid gap-2.5" style={{ borderTop: '1px solid #E5E0D4' }}>
              <a
                href="/settings/billing"
                className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-lg font-display font-medium text-[14px] text-white transition hover:bg-[#163828]"
                style={{ background: '#1F4D3A' }}
              >
                Upgrade to {planLabel} <ArrowRight size={14} strokeWidth={2} />
              </a>
              <button
                onClick={onClose}
                className="text-[13px] transition hover:text-[#0F1F18]"
                style={{ color: '#6B7A72' }}
              >
                Maybe later
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
