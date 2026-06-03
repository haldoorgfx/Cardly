'use client';

import { X, Sparkles, ArrowRight, Check } from 'lucide-react';
import Link from 'next/link';
import type { ReactNode } from 'react';

const FEATURE_INFO: Record<string, string> = {
  team:         'Invite teammates to co-manage events with roles and permissions. Hand off check-in, the agenda and registrations without sharing a single login.',
  networking:   'Let attendees build profiles, message 1:1, and get matched to the right people by interests and goals. Turn your event into a network, not just a room.',
  'q-and-a':    'Run live Q&A and polls in every session. Surface the best questions and keep remote and in-room attendees equally engaged.',
  gamification: 'Award points for check-ins, sessions and connections, with a live leaderboard and badges that keep attendees moving all day.',
  sponsors:     'Give sponsors branded booths, lead retrieval and a measurable showcase — so you can prove ROI and sell next year\'s package.',
  virtual:      'Stream sessions to a polished online venue with chat and recordings, so remote attendees get the full experience.',
};

const PLAN_LABEL: Record<string, string> = { free: 'Free', pro: 'Pro', studio: 'Studio' };

const PRO_FEATURES = [
  'Unlimited events',
  'Agenda, speakers & networking',
  '1:1 messaging between attendees',
  'Watermark removed from cards',
];

const STUDIO_FEATURES = [
  'AI matchmaking & networking',
  'Live Q&A, polls & gamification',
  'Sponsor tools & lead retrieval',
  'API access & multiple brand kits',
];

export interface UpgradeFeature {
  id: string;
  label: string;
  icon: ReactNode;
  minPlan: string;
}

interface Props {
  feature: UpgradeFeature | null;
  onClose: () => void;
}

export function UpgradeSlideOver({ feature, onClose }: Props) {
  const open = !!feature;
  const targetPlan = feature?.minPlan ?? 'pro';
  const info = feature ? (FEATURE_INFO[feature.id] ?? null) : null;

  return (
    <div className={`fixed inset-0 z-50 ${open ? '' : 'pointer-events-none'}`}>
      {/* Backdrop */}
      <div
        onClick={onClose}
        className={`absolute inset-0 transition-opacity duration-200 ${open ? 'opacity-100' : 'opacity-0'}`}
        style={{ background: 'rgba(15,31,24,0.35)' }}
      />
      {/* Panel */}
      <div
        className={`absolute right-0 top-0 h-full w-[380px] max-w-[90vw] flex flex-col transition-transform duration-300 ease-out ${open ? 'translate-x-0' : 'translate-x-full'}`}
        style={{ background: '#FAF6EE', borderLeft: '1px solid #E5E0D4', boxShadow: '-4px 0 40px rgba(15,31,24,0.14)' }}
      >
        {open && feature && (
          <>
            {/* Header */}
            <div className="flex items-center justify-between px-6 pt-5 pb-4" style={{ borderBottom: '1px solid rgba(229,224,212,0.7)' }}>
              <span className="font-mono text-[10px] tracking-[0.2em] uppercase inline-flex items-center gap-1.5" style={{ color: '#C9A45E' }}>
                <Sparkles size={11} strokeWidth={2} /> {PLAN_LABEL[targetPlan]} feature
              </span>
              <button
                onClick={onClose}
                className="w-8 h-8 grid place-items-center rounded-lg transition-colors hover:bg-[#E8EFEB]"
                style={{ color: '#6B7A72' }}
              >
                <X size={18} strokeWidth={1.8} />
              </button>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto px-6 py-6">
              {/* Feature banner */}
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
                  <span
                    className="inline-grid place-items-center w-11 h-11 rounded-xl mb-4"
                    style={{ background: 'rgba(250,246,238,0.1)', border: '1px solid rgba(250,246,238,0.15)', color: '#E8C57E' }}
                  >
                    {feature.icon}
                  </span>
                  <div className="font-display text-[20px] font-semibold tracking-tight" style={{ color: '#FAF6EE' }}>
                    {feature.label}
                  </div>
                </div>
              </div>

              <p className="text-[14.5px] leading-[1.6]" style={{ color: '#6B7A72' }}>
                {info ?? 'Unlock the full Karta platform — networking, live engagement, sponsor tools and more.'}
              </p>

              <div className="mt-6 font-mono text-[10px] tracking-[0.18em] uppercase mb-3" style={{ color: '#6B7A72' }}>
                What you get on {PLAN_LABEL[targetPlan]}
              </div>
              <ul className="space-y-2.5">
                {(targetPlan === 'studio' ? STUDIO_FEATURES : PRO_FEATURES).map((f, i) => (
                  <li key={i} className="flex items-start gap-2.5 text-[14px]" style={{ color: '#3A4A42' }}>
                    <span className="mt-0.5 shrink-0" style={{ color: '#1F4D3A' }}>
                      <Check size={15} strokeWidth={2} />
                    </span>
                    {f}
                  </li>
                ))}
              </ul>
            </div>

            {/* Footer */}
            <div className="px-6 py-5 grid gap-2.5" style={{ borderTop: '1px solid rgba(229,224,212,0.7)' }}>
              <Link
                href="/settings/billing"
                onClick={onClose}
                className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-lg font-display font-medium text-[14px] transition-colors hover:opacity-90"
                style={{ background: '#1F4D3A', color: '#FAF6EE', textDecoration: 'none' }}
              >
                Upgrade to {PLAN_LABEL[targetPlan]} <ArrowRight size={15} strokeWidth={2} />
              </Link>
              <Link
                href="/pricing"
                onClick={onClose}
                className="text-[13px] text-center transition-colors hover:text-[#1F4D3A] block"
                style={{ color: '#6B7A72', textDecoration: 'none' }}
              >
                View all plans
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
