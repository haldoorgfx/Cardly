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

type Tool = { label: string; key: string; href: (slug: string) => string; feature: string | null; icon: LucideIcon };

/**
 * Link at the FINAL destination, never at a URL that redirects.
 *
 * These tiles used to point at `/e/[slug]/<tool>`. Six of those are rewritten by
 * next.config.mjs to `/attending/[slug]/…` — and this grid renders inside
 * app/(app), which is the very shell `/attending` lives in. So tapping a tile
 * left the app shell, made a server round trip for a 307, and rebuilt the same
 * shell it started in: a visible flash of the public page before the dashboard
 * reappeared. Pointing straight at the destination makes it a soft client-side
 * navigation within the layout instead — no round trip, no flash.
 *
 * The redirects stay in next.config.mjs: links already shared or emailed still
 * have to work. They are the fallback, not the path the product takes.
 *
 * Agenda and Speakers remain public — they are about the EVENT, not about this
 * attendee — but are linked as the tab they resolve to rather than the
 * redirecting sub-route, for the same reason.
 */
const TOOLS: Tool[] = [
  { label: 'Agenda',      key: 'schedule',    href: s => `/e/${s}?tab=schedule`,     feature: 'schedule',     icon: CalendarDays },
  { label: 'Speakers',    key: 'speakers',    href: s => `/e/${s}?tab=speakers`,     feature: 'speakers',     icon: Mic },
  { label: 'Network',     key: 'networking',  href: s => `/attending/${s}/networking`,  feature: 'networking',   icon: Users },
  { label: 'Q&A',         key: 'q-and-a',     href: s => `/attending/${s}/q-and-a`,     feature: 'qa',           icon: MessageCircle },
  { label: 'Polls',       key: 'polls',       href: s => `/attending/${s}/polls`,       feature: 'polls',        icon: BarChart3 },
  { label: 'Community',   key: 'community',   href: s => `/attending/${s}/community`,   feature: 'community',    icon: Newspaper },
  { label: 'Leaderboard', key: 'leaderboard', href: s => `/attending/${s}/leaderboard`, feature: 'gamification', icon: Trophy },
  { label: 'Feedback',    key: 'feedback',    href: s => `/attending/${s}/feedback`,    feature: null,           icon: Star },
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
            key={t.key}
            href={t.href(slug)}
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
