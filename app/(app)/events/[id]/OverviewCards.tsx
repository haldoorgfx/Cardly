'use client';

import Link from 'next/link';
import {
  Layout, Ticket, Users, LayoutGrid, UserCircle2, ScanLine,
  Network, MessageSquare, Briefcase, BarChart2, IdCard, Video,
  Lock, Sparkles,
} from 'lucide-react';
import { useUpgrade } from '@/components/app/PlanGate';

const PLAN_LABEL: Record<string, string> = { pro: 'Pro', studio: 'Studio' };

type CardDef = {
  id: string;
  label: string;
  icon: React.ReactNode;
  desc: string;
  href: string;
  minPlan?: 'pro' | 'studio';
  gold?: boolean;
  status?: string;
};

function buildCards(eventId: string, stats: { registered: number; cards: number }): CardDef[] {
  return [
    {
      id: 'event-page',
      label: 'Event Page',
      icon: <Layout size={20} strokeWidth={1.8} />,
      desc: 'Edit your public event page',
      href: `/events/${eventId}/event-page`,
      status: 'View →',
    },
    {
      id: 'tickets',
      label: 'Tickets',
      icon: <Ticket size={20} strokeWidth={1.8} />,
      desc: 'Manage ticket types and pricing',
      href: `/events/${eventId}/tickets`,
    },
    {
      id: 'registrations',
      label: 'Registrations',
      icon: <Users size={20} strokeWidth={1.8} />,
      desc: 'View and manage attendees',
      href: `/events/${eventId}/registrations`,
      status: stats.registered > 0 ? `${stats.registered} registered` : undefined,
    },
    {
      id: 'agenda',
      label: 'Agenda',
      icon: <LayoutGrid size={20} strokeWidth={1.8} />,
      desc: 'Build your event schedule',
      href: `/events/${eventId}/agenda`,
    },
    {
      id: 'speakers',
      label: 'Speakers',
      icon: <UserCircle2 size={20} strokeWidth={1.8} />,
      desc: 'Manage speakers and sessions',
      href: `/events/${eventId}/speakers`,
    },
    {
      id: 'check-in',
      label: 'Check-in',
      icon: <ScanLine size={20} strokeWidth={1.8} />,
      desc: 'Scan attendees at the door',
      href: `/events/${eventId}/check-in`,
      status: 'Go live →',
    },
    {
      id: 'networking',
      label: 'Networking',
      icon: <Network size={20} strokeWidth={1.8} />,
      desc: 'Attendee connections and matchmaking',
      href: `/events/${eventId}/engagement`,
      minPlan: 'pro',
    },
    {
      id: 'q-and-a',
      label: 'Q&A & Polls',
      icon: <MessageSquare size={20} strokeWidth={1.8} />,
      desc: 'Live session engagement',
      href: `/events/${eventId}/q-and-a`,
      minPlan: 'pro',
    },
    {
      id: 'sponsors',
      label: 'Sponsors',
      icon: <Briefcase size={20} strokeWidth={1.8} />,
      desc: 'Manage sponsors and exhibitors',
      href: `/events/${eventId}/engagement`,
      minPlan: 'studio',
    },
    {
      id: 'analytics',
      label: 'Analytics',
      icon: <BarChart2 size={20} strokeWidth={1.8} />,
      desc: 'Registration funnel and engagement data',
      href: `/events/${eventId}/analytics`,
      status: 'View →',
    },
    {
      id: 'karta-card',
      label: 'Karta Card',
      icon: <IdCard size={20} strokeWidth={1.8} />,
      desc: 'The personalized card every attendee gets',
      href: `/events/${eventId}/edit`,
      gold: true,
      status: stats.cards > 0 ? `${stats.cards} downloaded` : undefined,
    },
    {
      id: 'virtual',
      label: 'Virtual',
      icon: <Video size={20} strokeWidth={1.8} />,
      desc: 'Stream sessions online',
      href: `/events/${eventId}/engagement`,
      minPlan: 'studio',
    },
  ];
}

const PLAN_LEVEL: Record<string, number> = { free: 0, pro: 1, studio: 2 };
function planMeetsMin(userPlan: string, minPlan: 'pro' | 'studio'): boolean {
  return (PLAN_LEVEL[userPlan] ?? 0) >= (PLAN_LEVEL[minPlan] ?? 99);
}

interface Props {
  eventId:    string;
  plan:       string;
  registered: number;
  cards:      number;
}

export function OverviewCards({ eventId, plan, registered, cards }: Props) {
  const { openUpgrade } = useUpgrade();
  const cardDefs = buildCards(eventId, { registered, cards });

  return (
    <div>
      <div className="font-mono text-[10px] tracking-[0.2em] uppercase text-muted mb-3">
        Manage this event
      </div>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
        {cardDefs.map((card) => {
          const locked = !!card.minPlan && !planMeetsMin(plan, card.minPlan);

          const inner = (
            <>
              <div className="flex items-start justify-between mb-3">
                <span
                  className="w-10 h-10 rounded-xl grid place-items-center shrink-0"
                  style={
                    card.gold
                      ? { background: 'rgba(232,197,126,0.22)', color: '#C9A45E' }
                      : { background: '#E8EFEB', color: '#1F4D3A' }
                  }
                >
                  {card.icon}
                </span>
                {locked ? (
                  <span className="inline-flex items-center gap-1 font-mono text-[9px] tracking-[0.12em] uppercase px-1.5 py-1 rounded font-semibold" style={{ background: 'rgba(232,197,126,0.2)', color: '#C9A45E' }}>
                    <Lock size={9} strokeWidth={2.5} />
                    {PLAN_LABEL[card.minPlan!]}
                  </span>
                ) : card.status ? (
                  <span className="font-mono text-[10px] tracking-[0.06em]" style={{ color: card.gold ? '#C9A45E' : '#6B7A72' }}>
                    {card.status}
                  </span>
                ) : null}
              </div>

              <div
                className="font-display text-[15px] font-semibold tracking-tight flex items-center gap-1.5"
                style={{ color: card.gold ? '#C9A45E' : '#0F1F18' }}
              >
                {card.label}
                {card.gold && <Sparkles size={11} strokeWidth={2} style={{ color: '#C9A45E' }} />}
              </div>
              <p className="text-[13px] text-ink-soft mt-1 leading-[1.5]">{card.desc}</p>
            </>
          );

          const baseClass =
            'group text-left rounded-2xl border p-5 transition-all hover:-translate-y-0.5 ';

          if (locked) {
            return (
              <button
                key={card.id}
                onClick={() => openUpgrade({ id: card.id, label: card.label, minPlan: card.minPlan! })}
                className={baseClass + 'bg-surface hover:border-accent/40'}
                style={{ borderColor: '#E5E0D4' }}
              >
                {inner}
              </button>
            );
          }

          return (
            <Link
              key={card.id}
              href={card.href}
              className={
                baseClass +
                (card.gold
                  ? 'hover:border-accent/70'
                  : 'bg-surface hover:border-primary/40')
              }
              style={
                card.gold
                  ? {
                      background: 'linear-gradient(135deg, rgba(232,197,126,0.14), rgba(31,77,58,0.05))',
                      borderColor: 'rgba(232,197,126,0.5)',
                    }
                  : { borderColor: '#E5E0D4' }
              }
            >
              {inner}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
