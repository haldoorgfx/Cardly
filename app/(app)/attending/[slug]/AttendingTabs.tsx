'use client';

import { usePathname } from 'next/navigation';
import { SegmentedTabs } from '@/components/dash';

const TABS = [
  { seg: 'agenda', label: 'My agenda' },
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
  return (
    <SegmentedTabs
      tabs={TABS.map((t) => {
        const href = `/attending/${slug}/${t.seg}`;
        return { key: t.seg, label: t.label, href, active: pathname === href };
      })}
    />
  );
}
