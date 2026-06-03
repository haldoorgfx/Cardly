'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  Layout, Ticket, Users, CalendarDays, User, ScanLine,
  Network, MessageSquare, Briefcase, BarChart2, CreditCard,
  Video, Lock, Sparkles,
} from 'lucide-react';
import { UpgradeSlideOver, type UpgradeFeature } from '@/components/app/UpgradeSlideOver';

const PLAN_LEVEL: Record<string, number> = { free: 0, pro: 1, studio: 2 };

function planMeets(userPlan: string, minPlan?: string): boolean {
  if (!minPlan) return true;
  return (PLAN_LEVEL[userPlan] ?? 0) >= (PLAN_LEVEL[minPlan] ?? 0);
}

const PLAN_LABEL: Record<string, string> = { pro: 'Pro', studio: 'Studio' };

interface FeatureCard extends UpgradeFeature {
  desc: string;
  href: string;
  status?: string;
  gold?: boolean;
}

interface Props {
  eventId: string;
  plan: string;
  stats: {
    registrations: number;
    checkedIn: number;
    downloads: number;
    sessions: number;
    speakers: number;
    ticketTypes: number;
  };
}

export default function EventFeatureGrid({ eventId, plan, stats }: Props) {
  const [upgradeFeature, setUpgradeFeature] = useState<UpgradeFeature | null>(null);

  const cards: FeatureCard[] = [
    {
      id: 'event-page',
      label: 'Event Page',
      icon: <Layout size={22} strokeWidth={1.7} />,
      desc: 'Edit your public event page',
      href: `/events/${eventId}/event-page`,
      status: 'Edit →',
    },
    {
      id: 'tickets',
      label: 'Tickets',
      icon: <Ticket size={22} strokeWidth={1.7} />,
      desc: 'Manage ticket types and pricing',
      href: `/events/${eventId}/tickets`,
      status: stats.ticketTypes > 0
        ? `${stats.ticketTypes} type${stats.ticketTypes !== 1 ? 's' : ''}`
        : 'Set up →',
    },
    {
      id: 'registrations',
      label: 'Registrations',
      icon: <Users size={22} strokeWidth={1.7} />,
      desc: 'View and manage attendees',
      href: `/events/${eventId}/registrations`,
      status: stats.registrations > 0
        ? `${stats.registrations} registered`
        : 'None yet',
    },
    {
      id: 'agenda',
      label: 'Agenda',
      icon: <CalendarDays size={22} strokeWidth={1.7} />,
      desc: 'Build your event schedule',
      href: `/events/${eventId}/sessions`,
      status: stats.sessions > 0
        ? `${stats.sessions} session${stats.sessions !== 1 ? 's' : ''}`
        : 'Build →',
    },
    {
      id: 'speakers',
      label: 'Speakers',
      icon: <User size={22} strokeWidth={1.7} />,
      desc: 'Manage speakers and bios',
      href: `/events/${eventId}/speakers`,
      status: stats.speakers > 0
        ? `${stats.speakers} speaker${stats.speakers !== 1 ? 's' : ''}`
        : 'Add →',
    },
    {
      id: 'check-in',
      label: 'Check-in',
      icon: <ScanLine size={22} strokeWidth={1.7} />,
      desc: 'Scan attendees at the door',
      href: `/events/${eventId}/check-in`,
      status: stats.checkedIn > 0 ? `${stats.checkedIn} checked in` : 'Go live →',
    },
    {
      id: 'networking',
      label: 'Networking',
      icon: <Network size={22} strokeWidth={1.7} />,
      desc: 'Attendee connections and matchmaking',
      href: `/events/${eventId}/engagement`,
      minPlan: 'pro',
    },
    {
      id: 'q-and-a',
      label: 'Q&A & Polls',
      icon: <MessageSquare size={22} strokeWidth={1.7} />,
      desc: 'Live session engagement',
      href: `/events/${eventId}/q-and-a`,
      minPlan: 'pro',
    },
    {
      id: 'sponsors',
      label: 'Sponsors',
      icon: <Briefcase size={22} strokeWidth={1.7} />,
      desc: 'Manage sponsors and exhibitors',
      href: `/events/${eventId}/sponsors`,
      minPlan: 'studio',
    },
    {
      id: 'e-analytics',
      label: 'Analytics',
      icon: <BarChart2 size={22} strokeWidth={1.7} />,
      desc: 'Registration funnel and engagement data',
      href: `/events/${eventId}/analytics`,
      status: 'View →',
    },
    {
      id: 'karta-card',
      label: 'Karta Card',
      icon: <CreditCard size={22} strokeWidth={1.7} />,
      desc: 'The personalized card every attendee gets',
      href: `/events/${eventId}/edit`,
      status: stats.downloads > 0 ? `${stats.downloads} downloaded` : 'Set up →',
      gold: true,
    },
    {
      id: 'virtual',
      label: 'Virtual',
      icon: <Video size={22} strokeWidth={1.7} />,
      desc: 'Stream sessions online',
      href: `/events/${eventId}/virtual`,
      minPlan: 'studio',
    },
  ];

  return (
    <>
      <p className="font-mono text-[10px] tracking-[0.2em] uppercase mb-3" style={{ color: '#6B7A72' }}>
        Manage this event
      </p>

      <div className="grid sm:grid-cols-2 gap-4">
        {cards.map(card => {
          const locked = !planMeets(plan, card.minPlan);

          /* ── Locked ─────────────────────────────────────── */
          if (locked) {
            return (
              <button
                key={card.id}
                onClick={() => setUpgradeFeature({ id: card.id, label: card.label, icon: card.icon, minPlan: card.minPlan! })}
                className="group text-left rounded-2xl border p-5 transition-all duration-150 hover:-translate-y-0.5 hover:border-[#C9C3B1]"
                style={{ background: 'white', borderColor: '#E5E0D4', boxShadow: '0 1px 2px rgba(15,31,24,0.04)' }}
              >
                <div className="flex items-start justify-between mb-3">
                  <span className="w-10 h-10 rounded-xl grid place-items-center" style={{ background: '#E8EFEB', color: '#1F4D3A' }}>
                    {card.icon}
                  </span>
                  <span
                    className="inline-flex items-center gap-1 font-mono text-[9px] tracking-[0.12em] uppercase px-1.5 py-1 rounded-md font-semibold"
                    style={{ background: 'rgba(232,197,126,0.18)', color: '#C9A45E' }}
                  >
                    <Lock size={9} strokeWidth={2.5} /> {PLAN_LABEL[card.minPlan!]}
                  </span>
                </div>
                <div className="font-display text-[15px] font-semibold tracking-tight" style={{ color: '#0F1F18' }}>
                  {card.label}
                </div>
                <p className="text-[13px] mt-1 leading-[1.5]" style={{ color: '#6B7A72' }}>{card.desc}</p>
              </button>
            );
          }

          /* ── Gold (Karta Card) ───────────────────────────── */
          if (card.gold) {
            return (
              <Link
                key={card.id}
                href={card.href}
                className="group text-left rounded-2xl border p-5 transition-all duration-150 hover:-translate-y-0.5 block"
                style={{
                  background: 'linear-gradient(135deg, rgba(232,197,126,0.16), rgba(31,77,58,0.06))',
                  borderColor: 'rgba(232,197,126,0.55)',
                  textDecoration: 'none',
                  boxShadow: '0 1px 2px rgba(15,31,24,0.04)',
                }}
              >
                <div className="flex items-start justify-between mb-3">
                  <span className="w-10 h-10 rounded-xl grid place-items-center" style={{ background: 'rgba(232,197,126,0.22)', color: '#C9A45E' }}>
                    {card.icon}
                  </span>
                  {card.status && (
                    <span className="font-mono text-[10px] tracking-[0.08em]" style={{ color: '#C9A45E' }}>
                      {card.status}
                    </span>
                  )}
                </div>
                <div className="font-display text-[15px] font-semibold tracking-tight flex items-center gap-1.5" style={{ color: '#C9A45E' }}>
                  {card.label}
                  <Sparkles size={11} strokeWidth={2} />
                </div>
                <p className="text-[13px] mt-1 leading-[1.5]" style={{ color: '#6B7A72' }}>{card.desc}</p>
              </Link>
            );
          }

          /* ── Standard ───────────────────────────────────── */
          return (
            <Link
              key={card.id}
              href={card.href}
              className="group text-left rounded-2xl border p-5 transition-all duration-150 hover:-translate-y-0.5 hover:border-[#1F4D3A]/40 block"
              style={{ background: 'white', borderColor: '#E5E0D4', textDecoration: 'none', boxShadow: '0 1px 2px rgba(15,31,24,0.04)' }}
            >
              <div className="flex items-start justify-between mb-3">
                <span className="w-10 h-10 rounded-xl grid place-items-center" style={{ background: '#E8EFEB', color: '#1F4D3A' }}>
                  {card.icon}
                </span>
                {card.status && (
                  <span className="font-mono text-[10px] tracking-[0.08em]" style={{ color: '#6B7A72' }}>
                    {card.status}
                  </span>
                )}
              </div>
              <div className="font-display text-[15px] font-semibold tracking-tight" style={{ color: '#0F1F18' }}>
                {card.label}
              </div>
              <p className="text-[13px] mt-1 leading-[1.5]" style={{ color: '#6B7A72' }}>{card.desc}</p>
            </Link>
          );
        })}
      </div>

      <UpgradeSlideOver feature={upgradeFeature} onClose={() => setUpgradeFeature(null)} />
    </>
  );
}
