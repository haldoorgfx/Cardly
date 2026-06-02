'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { X, Check, Zap } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

export interface UpgradeFeature {
  id: string;
  label: string;
  minPlan: 'pro' | 'studio';
  icon?: LucideIcon;
}

interface Props {
  feature: UpgradeFeature | null;
  onClose: () => void;
}

const FEATURE_DESCRIPTIONS: Record<string, string> = {
  team:         'Invite teammates to co-manage events with roles and permissions.',
  networking:   'Let attendees build profiles, message 1:1, and get matched by interests.',
  'q-and-a':    'Run live Q&A and polls in every session.',
  gamification: 'Award points for check-ins, sessions and connections with a live leaderboard.',
  sponsors:     'Give sponsors branded booths, lead retrieval and measurable ROI.',
  virtual:      'Stream sessions to a polished online venue with chat and recordings.',
};

const PRO_FEATURES = [
  'Unlimited events',
  'Agenda, speakers & networking',
  '1:1 messaging',
  'Watermark removed',
];

const STUDIO_FEATURES = [
  'AI matchmaking & networking',
  'Live Q&A, polls & gamification',
  'Sponsor tools & lead retrieval',
  'API access & multiple brand kits',
];

export default function UpgradeSlideOver({ feature, onClose }: Props) {
  const isOpen = !!feature;

  useEffect(() => {
    if (!isOpen) return;
    const handle = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handle);
    return () => document.removeEventListener('keydown', handle);
  }, [isOpen, onClose]);

  if (!feature) return null;

  const isPro = feature.minPlan === 'pro';
  const planLabel = isPro ? 'Pro' : 'Studio';
  const featureList = isPro ? PRO_FEATURES : STUDIO_FEATURES;
  const description = FEATURE_DESCRIPTIONS[feature.id] ?? `Upgrade to ${planLabel} to unlock ${feature.label}.`;
  const Icon = feature.icon ?? Zap;

  return (
    <div className="fixed inset-0 z-[300] flex justify-end">
      {/* Backdrop */}
      <div
        className="absolute inset-0"
        style={{ background: 'rgba(15,31,24,0.3)', backdropFilter: 'blur(2px)' }}
        onClick={onClose}
      />

      {/* Panel */}
      <div
        className="relative flex flex-col h-full shadow-2xl"
        style={{
          width: 380,
          background: '#FAF6EE',
          borderLeft: '1px solid #E5E0D4',
          animation: 'slideInRight 220ms cubic-bezier(0.22,1,0.36,1)',
        }}
      >
        {/* Header */}
        <div className="px-5 pt-5 pb-4 flex items-center justify-between border-b" style={{ borderColor: '#E5E0D4' }}>
          <span
            className="inline-flex items-center gap-1.5 font-mono uppercase px-2.5 py-1 rounded-full font-semibold"
            style={{
              fontSize: 10,
              letterSpacing: '0.14em',
              background: 'rgba(232,197,126,0.2)',
              color: '#C9A45E',
              border: '1px solid rgba(232,197,126,0.4)',
            }}
          >
            {planLabel} feature
          </span>
          <button
            onClick={onClose}
            className="h-8 w-8 rounded-lg grid place-items-center transition hover:bg-[#E8EFEB]"
            style={{ color: '#6B7A72' }}
          >
            <X size={16} strokeWidth={2} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-5 py-5 space-y-5">
          {/* Feature highlight card */}
          <div
            className="rounded-2xl p-5"
            style={{ background: 'linear-gradient(135deg, #163828 0%, #1F4D3A 55%, #2A6A50 100%)' }}
          >
            <div
              className="w-12 h-12 rounded-xl grid place-items-center mb-4"
              style={{ background: 'rgba(232,197,126,0.2)' }}
            >
              <Icon size={22} strokeWidth={1.7} color="#E8C57E" />
            </div>
            <div className="font-display font-bold text-[20px] text-[#FAF6EE] tracking-tight mb-2">
              {feature.label}
            </div>
            <p className="text-[13.5px] leading-[1.6]" style={{ color: 'rgba(250,246,238,0.7)' }}>
              {description}
            </p>
          </div>

          {/* What you get */}
          <div>
            <div
              className="font-mono uppercase mb-3"
              style={{ fontSize: 10, letterSpacing: '0.2em', color: '#6B7A72' }}
            >
              {planLabel} includes
            </div>
            <div className="space-y-2.5">
              {featureList.map((f, i) => (
                <div key={i} className="flex items-center gap-3">
                  <span
                    className="h-5 w-5 rounded-full grid place-items-center shrink-0"
                    style={{ background: '#E8EFEB' }}
                  >
                    <Check size={11} strokeWidth={2.5} color="#1F4D3A" />
                  </span>
                  <span style={{ fontSize: 13.5, color: '#3A4A42' }}>{f}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer CTA */}
        <div className="px-5 py-5 border-t space-y-3" style={{ borderColor: '#E5E0D4' }}>
          <Link
            href="/settings/billing"
            onClick={onClose}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-[14px] transition"
            style={{ background: '#1F4D3A', color: '#FAF6EE' }}
          >
            Upgrade to {planLabel}
          </Link>
          <Link
            href="/pricing"
            onClick={onClose}
            className="w-full flex items-center justify-center text-[13px] transition hover:text-[#1F4D3A]"
            style={{ color: '#6B7A72' }}
          >
            Learn more about plans
          </Link>
        </div>
      </div>

      <style>{`
        @keyframes slideInRight {
          from { transform: translateX(100%); }
          to   { transform: translateX(0); }
        }
      `}</style>
    </div>
  );
}
