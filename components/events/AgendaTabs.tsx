'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';

interface Props {
  eventId: string;
  eventName: string;
}

const TABS = [
  { key: 'agenda',    label: 'Sessions', segment: 'agenda' },
  { key: 'speakers',  label: 'Speakers', segment: 'speakers' },
] as const;

export function AgendaTabs({ eventId, eventName }: Props) {
  const pathname = usePathname();
  const segment = pathname.split('/').pop() ?? '';
  const active = TABS.find(t => t.segment === segment)?.key ?? 'agenda';

  return (
    <div className="sticky top-0 z-30 border-b bg-white" style={{ borderColor: '#E5E0D4' }}>
      <div className="px-4 sm:px-6 lg:px-8 pt-3 pb-0">
        <div className="flex items-center gap-1.5 text-[12px] mb-2.5" style={{ color: '#6B7A72' }}>
          <Link href={`/events/${eventId}`} className="inline-flex items-center gap-1 hover:text-[#1F4D3A] transition-colors">
            <ArrowLeft size={12} strokeWidth={2} />
            {eventName}
          </Link>
        </div>
        <div className="flex gap-0 overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
          {TABS.map(tab => (
            <Link
              key={tab.key}
              href={`/events/${eventId}/${tab.segment}`}
              className="flex-none text-[13px] font-medium px-3 pb-2.5 border-b-2 transition-colors whitespace-nowrap"
              style={{
                color: active === tab.key ? '#1F4D3A' : '#6B7A72',
                borderBottomColor: active === tab.key ? '#1F4D3A' : 'transparent',
              }}
            >
              {tab.label}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
