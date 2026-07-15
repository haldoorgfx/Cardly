'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { PublicNav } from '@/components/events/PublicNav';
import { MarketingFooter } from '@/components/marketing/MarketingFooter';

interface Props {
  slug: string;
  eventName: string;
  features: Record<string, boolean>;
  children: React.ReactNode;
}

/**
 * Standalone engagement sections that render on their own route (not the main
 * event page's tab bar). Landing on one of these from a share link/email shows
 * only the marketing header, so we surface a compact "Back to {event}" link.
 * Transactional funnels (register, waitlist, apply, cfp, check-in) are excluded.
 */
const ENGAGEMENT_SEGMENTS = new Set([
  'polls', 'q-and-a', 'community', 'leaderboard', 'feedback',
  'workshops', 'speed-networking', 'people', 'my-agenda', 'messages',
  'sessions', 'speakers', 'sponsors', 'schedule',
]);

export function EventShell({ slug, eventName, children }: Props) {
  const pathname = usePathname();
  // pathname → ['', 'e', <slug>, <segment>, ...]
  const segment = pathname.split('/')[3] ?? '';
  const showBackLink = ENGAGEMENT_SEGMENTS.has(segment);

  return (
    <div className="min-h-screen flex flex-col" style={{ background: '#FAF6EE' }}>
      <PublicNav />
      {showBackLink && (
        <div className="mx-auto w-full px-5 lg:px-10 pt-4" style={{ maxWidth: 1240 }}>
          <Link
            href={`/e/${slug}`}
            className="inline-flex items-center gap-1.5 h-8 pl-2.5 pr-3.5 rounded-full text-[13px] font-medium transition hover:opacity-80"
            style={{ background: '#E8EFEB', color: '#1F4D3A', textDecoration: 'none' }}
          >
            <ArrowLeft size={14} strokeWidth={2} />
            <span className="truncate max-w-[220px]">Back to {eventName}</span>
          </Link>
        </div>
      )}
      <main className="flex-1 min-w-0">{children}</main>
      <MarketingFooter />
    </div>
  );
}
