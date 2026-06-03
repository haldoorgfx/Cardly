'use client';

import React from 'react';
import Link from 'next/link';
import { X, Sparkles, Check, ArrowRight } from 'lucide-react';

export type UpgradeFeature = {
  id: string;
  label: string;
  minPlan: 'pro' | 'studio';
};

const PLAN_LABEL: Record<string, string> = { pro: 'Pro', studio: 'Studio' };

const FEATURE_INFO: Record<string, string> = {
  team: 'Invite teammates to co-manage events with roles and permissions. Hand off check-in, the agenda and registrations without sharing a single login.',
  networking: 'Let attendees build profiles, message 1:1, and get matched to the right people by interests and goals. Turn your event into a network, not just a room.',
  'q-and-a': 'Run live Q&A and polls in every session. Surface the best questions and keep remote and in-room attendees equally engaged.',
  gamification: 'Award points for check-ins, sessions and connections, with a live leaderboard and badges that keep attendees moving all day.',
  sponsors: 'Give sponsors branded booths, lead retrieval and a measurable showcase — so you can prove ROI and sell next year\'s package.',
  virtual: 'Stream sessions to a polished online venue with chat and recordings, so remote attendees get the full experience.',
  events: 'Run more events simultaneously, lift the registration cap, and access the full agenda builder, speaker directory and networking tools.',
};

const PLAN_BULLETS: Record<string, string[]> = {
  pro: [
    'Unlimited events',
    'Full agenda builder + speaker directory',
    'Attendee networking + 1:1 messaging',
    'Remove Karta watermark',
  ],
  studio: [
    'AI matchmaking & networking',
    'Live Q&A, polls & gamification',
    'Sponsor tools & lead retrieval',
    'API access + multiple brand kits',
  ],
};

interface Props {
  feature: UpgradeFeature | null;
  onClose: () => void;
}

export function UpgradeSlideOver({ feature, onClose }: Props) {
  const open = !!feature;
  const targetPlan = feature?.minPlan ?? 'pro';
  const info = feature ? (FEATURE_INFO[feature.id] ?? 'Unlock the full Karta platform — networking, live engagement, sponsor tools and more.') : '';
  const bullets = PLAN_BULLETS[targetPlan] ?? [];

  return (
    <div className={`fixed inset-0 z-[200] ${open ? '' : 'pointer-events-none'}`}>
      {/* Backdrop */}
      <div
        onClick={onClose}
        className={`absolute inset-0 bg-ink/30 transition-opacity duration-200 ${open ? 'opacity-100' : 'opacity-0'}`}
      />

      {/* Panel */}
      <div
        className={`absolute right-0 top-0 h-full w-[380px] max-w-[90vw] flex flex-col border-l transition-transform duration-250 ${open ? 'translate-x-0' : 'translate-x-full'}`}
        style={{ background: '#FAF6EE', borderColor: '#E5E0D4' }}
      >
        {open && (
          <>
            {/* Header */}
            <div
              className="flex items-center justify-between px-6 pt-5 pb-4 border-b shrink-0"
              style={{ borderColor: '#E5E0D4' }}
            >
              <span className="font-mono text-[10px] tracking-[0.2em] uppercase text-accent-dark inline-flex items-center gap-1.5">
                <Sparkles size={12} strokeWidth={2} style={{ color: '#C9A45E' }} />
                {PLAN_LABEL[targetPlan]} feature
              </span>
              <button
                onClick={onClose}
                className="w-8 h-8 grid place-items-center rounded-lg text-muted hover:bg-primary-soft hover:text-primary transition-colors"
              >
                <X size={18} strokeWidth={2} />
              </button>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto px-6 py-6">
              {/* Hero panel */}
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
                  <div
                    className="inline-grid place-items-center w-11 h-11 rounded-xl bg-cream/10 border border-cream/15 mb-4"
                    style={{ color: '#E8C57E' }}
                  >
                    <Sparkles size={22} strokeWidth={1.8} />
                  </div>
                  <div className="font-display text-[20px] font-semibold text-cream tracking-tight">
                    {feature.label}
                  </div>
                </div>
              </div>

              <p className="text-ink-soft text-[14.5px] leading-[1.6] mb-6">{info}</p>

              <div className="font-mono text-[10px] tracking-[0.18em] uppercase text-muted mb-3">
                What you get on {PLAN_LABEL[targetPlan]}
              </div>
              <ul className="space-y-2.5">
                {bullets.map((b) => (
                  <li key={b} className="flex items-start gap-2.5 text-[14px] text-ink-soft">
                    <Check size={15} strokeWidth={2.5} className="mt-0.5 shrink-0 text-primary" />
                    {b}
                  </li>
                ))}
              </ul>
            </div>

            {/* Footer */}
            <div className="px-6 py-5 border-t shrink-0 grid gap-2.5" style={{ borderColor: '#E5E0D4' }}>
              <Link
                href="/settings/billing"
                onClick={onClose}
                className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-lg bg-primary text-cream font-medium hover:bg-primary-dark transition-colors text-[14px]"
              >
                Upgrade to {PLAN_LABEL[targetPlan]} <ArrowRight size={15} strokeWidth={2} />
              </Link>
              <button
                onClick={onClose}
                className="text-[13px] text-muted hover:text-primary transition-colors"
              >
                Learn more about plans
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
