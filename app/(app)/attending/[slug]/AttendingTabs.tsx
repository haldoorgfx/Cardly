'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

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
    <div className="flex items-center gap-1 mb-6 overflow-x-auto pb-1 -mx-1 px-1">
      {TABS.map((t) => {
        const href = `/attending/${slug}/${t.seg}`;
        const active = pathname === href;
        return (
          <Link
            key={t.seg}
            href={href}
            className="inline-flex items-center h-8 px-3.5 rounded-full text-[13px] font-medium whitespace-nowrap transition-colors"
            style={{
              background: active ? '#1F4D3A' : 'transparent',
              color: active ? '#FFFFFF' : '#3A4A42',
              border: active ? '1px solid #1F4D3A' : '1px solid #E5E0D4',
            }}
          >
            {t.label}
          </Link>
        );
      })}
    </div>
  );
}
