'use client';

import { usePathname } from 'next/navigation';
import { SegmentedTabs } from '@/components/dash';

const TABS = [
  { seg: '', label: 'Overview' },
  { seg: 'agenda', label: 'Agenda' },
  { seg: 'messages', label: 'Messages' },
  { seg: 'networking', label: 'Networking' },
  { seg: 'community', label: 'Community' },
  { seg: 'q-and-a', label: 'Q&A' },
  { seg: 'polls', label: 'Polls' },
  { seg: 'leaderboard', label: 'Leaderboard' },
  { seg: 'feedback', label: 'Feedback' },
];

export default function AttendingTabs({ slug }: { slug: string }) {
  const pathname = usePathname();
  const base = `/attending/${slug}`;
  return (
    <SegmentedTabs
      tabs={TABS.map((t) => {
        const href = t.seg ? `${base}/${t.seg}` : base;
        return { key: t.seg || 'overview', label: t.label, href, active: pathname === href };
      })}
    />
  );
}
