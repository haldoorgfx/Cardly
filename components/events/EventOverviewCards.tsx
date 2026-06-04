'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  Layout, Ticket, Users, CalendarDays, User, ScanLine, Bell,
  Network, MessageSquare, Trophy, Briefcase, BarChart2, Video, Sparkles,
} from 'lucide-react';
import { UpgradeSlideOver, type UpgradeFeature } from '@/components/app/UpgradeSlideOver';

export type OverviewCard = {
  id: string;
  label: string;
  desc: string;
  iconId: string;
  href: string;
  badge: string | null;
  badgeGreen?: boolean;
  gold?: boolean;
  minPlan?: 'pro' | 'studio';
};

const ICON_MAP: Record<string, React.ReactNode> = {
  layout:    <Layout size={18} strokeWidth={1.8} />,
  ticket:    <Ticket size={18} strokeWidth={1.8} />,
  users:     <Users size={18} strokeWidth={1.8} />,
  calendar:  <CalendarDays size={18} strokeWidth={1.8} />,
  user:      <User size={18} strokeWidth={1.8} />,
  scan:      <ScanLine size={18} strokeWidth={1.8} />,
  bell:      <Bell size={18} strokeWidth={1.8} />,
  network:   <Network size={18} strokeWidth={1.8} />,
  message:   <MessageSquare size={18} strokeWidth={1.8} />,
  trophy:    <Trophy size={18} strokeWidth={1.8} />,
  briefcase: <Briefcase size={18} strokeWidth={1.8} />,
  chart:     <BarChart2 size={18} strokeWidth={1.8} />,
  video:     <Video size={18} strokeWidth={1.8} />,
  sparkles:  <Sparkles size={18} strokeWidth={1.8} />,
};

interface Props {
  cards: OverviewCard[];
  userPlan: string;
}

const PLAN_LEVEL: Record<string, number> = { free: 0, pro: 1, studio: 2 };
function canAccess(userPlan: string, minPlan?: 'pro' | 'studio') {
  if (!minPlan) return true;
  return (PLAN_LEVEL[userPlan] ?? 0) >= PLAN_LEVEL[minPlan];
}

export function EventOverviewCards({ cards, userPlan }: Props) {
  const [upgradeFeature, setUpgradeFeature] = useState<UpgradeFeature | null>(null);

  return (
    <>
      <div className="grid sm:grid-cols-2 gap-4">
        {cards.map(card => {
          const icon = ICON_MAP[card.iconId] ?? <Sparkles size={18} strokeWidth={1.8} />;
          const locked = !canAccess(userPlan, card.minPlan);

          if (locked) {
            return (
              <button
                key={card.id}
                onClick={() => setUpgradeFeature({
                  id: card.id,
                  label: card.label,
                  icon,
                  minPlan: card.minPlan!,
                })}
                className="group flex flex-col p-5 rounded-2xl transition-all hover:-translate-y-0.5 text-left w-full"
                style={{ background: 'white', border: '1px solid #E5E0D4', boxShadow: '0 1px 2px rgba(15,31,24,0.04)' }}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="h-10 w-10 rounded-xl grid place-items-center shrink-0" style={{ background: '#E8EFEB', color: '#1F4D3A' }}>
                    {icon}
                  </div>
                  <span className="inline-flex items-center gap-1 font-mono text-[9px] tracking-[0.12em] uppercase px-1.5 py-1 rounded"
                    style={{ background: 'rgba(232,197,126,0.2)', color: '#C9A45E' }}>
                    🔒 {card.minPlan === 'studio' ? 'Studio' : 'Pro'}
                  </span>
                </div>
                <p className="font-display text-[14.5px] font-semibold leading-tight" style={{ color: '#0F1F18', letterSpacing: '-0.01em' }}>
                  {card.label}
                </p>
                <p className="text-[12.5px] mt-1 flex-1" style={{ color: '#6B7A72', lineHeight: 1.5 }}>
                  {card.desc}
                </p>
              </button>
            );
          }

          return (
            <Link
              key={card.id}
              href={card.href}
              className="group flex flex-col p-5 rounded-2xl transition-all hover:-translate-y-0.5"
              style={{
                background: card.gold
                  ? 'linear-gradient(135deg, rgba(232,197,126,0.16), rgba(31,77,58,0.06))'
                  : 'white',
                border: '1px solid #E5E0D4',
                boxShadow: '0 1px 2px rgba(15,31,24,0.04)',
                textDecoration: 'none',
              }}
              onMouseEnter={e => (e.currentTarget.style.borderColor = 'rgba(31,77,58,0.4)')}
              onMouseLeave={e => (e.currentTarget.style.borderColor = '#E5E0D4')}
            >
              <div className="flex items-start justify-between mb-3">
                <div
                  className="h-10 w-10 rounded-xl grid place-items-center shrink-0"
                  style={card.gold
                    ? { background: 'rgba(232,197,126,0.25)', color: '#C9A45E' }
                    : { background: '#E8EFEB', color: '#1F4D3A' }
                  }
                >
                  {card.iconId === 'sparkles' ? <Sparkles size={18} strokeWidth={1.8} /> : icon}
                </div>
                {card.badge && (
                  <span className="text-[11px] font-mono shrink-0 ml-2"
                    style={{ color: card.badgeGreen ? '#2D7A4F' : '#6B7A72' }}>
                    {card.badge}
                  </span>
                )}
              </div>
              <p className="font-display text-[14.5px] font-semibold leading-tight" style={{ color: '#0F1F18', letterSpacing: '-0.01em' }}>
                {card.label}
                {card.gold && <Sparkles size={11} strokeWidth={2} className="inline ml-1" style={{ color: '#C9A45E', verticalAlign: 'middle' }} />}
              </p>
              <p className="text-[12.5px] mt-1 flex-1" style={{ color: '#6B7A72', lineHeight: 1.5 }}>
                {card.desc}
              </p>
            </Link>
          );
        })}
      </div>

      <UpgradeSlideOver feature={upgradeFeature} onClose={() => setUpgradeFeature(null)} />
    </>
  );
}
