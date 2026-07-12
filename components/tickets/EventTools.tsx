'use client';

/**
 * EventToolsGrid — the attendee's quick-access grid for one event's tools.
 * Shared by the "Next up" hub on My Tickets and each ticket's detail hub.
 * Tools are opt-out: a tool shows unless the organizer switched its feature
 * off (`features[key] === false`). Feedback has no toggle — always available.
 */

import Link from 'next/link';
import {
  CalendarDays, Mic, Users, MessageCircle, BarChart3, Newspaper, Trophy, Star,
  type LucideIcon,
} from 'lucide-react';

export type EventFeatures = Record<string, boolean>;

const featureOn = (f: EventFeatures, key: string | null) => key === null || f[key] !== false;

type Tool = { label: string; route: string; feature: string | null; icon: LucideIcon };

const TOOLS: Tool[] = [
  { label: 'Agenda',      route: 'schedule',    feature: 'schedule',     icon: CalendarDays },
  { label: 'Speakers',    route: 'speakers',    feature: 'speakers',     icon: Mic },
  { label: 'Network',     route: 'people',      feature: 'networking',   icon: Users },
  { label: 'Q&A',         route: 'q-and-a',     feature: 'qa',           icon: MessageCircle },
  { label: 'Polls',       route: 'polls',       feature: 'polls',        icon: BarChart3 },
  { label: 'Community',   route: 'community',   feature: 'newsfeed',     icon: Newspaper },
  { label: 'Leaderboard', route: 'leaderboard', feature: 'gamification', icon: Trophy },
  { label: 'Feedback',    route: 'feedback',    feature: null,           icon: Star },
];

export function EventToolsGrid({ slug, features }: { slug: string; features: EventFeatures }) {
  const tools = TOOLS.filter(t => featureOn(features, t.feature));
  if (!slug || tools.length === 0) return null;

  return (
    <div className="grid grid-cols-4 gap-2 sm:gap-2.5">
      {tools.map(t => {
        const Icon = t.icon;
        return (
          <Link
            key={t.route}
            href={`/e/${slug}/${t.route}`}
            className="group flex flex-col items-center justify-center gap-2 rounded-xl py-3 px-1 transition-colors hover:bg-[#FAF6EE]"
            style={{ background: '#FFFFFF', border: '1px solid #E5E0D4' }}
          >
            <span
              className="grid place-items-center rounded-full transition-colors group-hover:brightness-95"
              style={{ width: 40, height: 40, background: '#E8EFEB', color: '#1F4D3A' }}
            >
              <Icon size={19} strokeWidth={1.9} />
            </span>
            <span className="text-[12px] font-medium text-center leading-tight" style={{ color: '#0F1F18' }}>
              {t.label}
            </span>
          </Link>
        );
      })}
    </div>
  );
}
