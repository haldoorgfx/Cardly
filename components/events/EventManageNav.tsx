'use client';

import Link from 'next/link';
import { ChevronRight } from 'lucide-react';

interface Props {
  eventId: string;
  eventName: string;
  active: 'overview' | 'event-page' | 'tickets' | 'form' | 'speakers' | 'sessions' | 'registrations' | 'promo-codes' | 'analytics';
}

const TABS = [
  { key: 'overview',      label: 'Overview',       href: (id: string) => `/events/${id}` },
  { key: 'event-page',    label: 'Event page',      href: (id: string) => `/events/${id}/event-page` },
  { key: 'tickets',       label: 'Tickets',         href: (id: string) => `/events/${id}/tickets` },
  { key: 'form',          label: 'Form',            href: (id: string) => `/events/${id}/form` },
  { key: 'speakers',      label: 'Speakers',        href: (id: string) => `/events/${id}/speakers` },
  { key: 'sessions',      label: 'Sessions',        href: (id: string) => `/events/${id}/sessions` },
  { key: 'registrations', label: 'Registrations',   href: (id: string) => `/events/${id}/registrations` },
  { key: 'promo-codes',   label: 'Promo codes',     href: (id: string) => `/events/${id}/promo-codes` },
  { key: 'analytics',     label: 'Analytics',       href: (id: string) => `/events/${id}/analytics` },
] as const;

export function EventManageNav({ eventId, eventName, active }: Props) {
  return (
    <div
      className="sticky top-0 z-30 border-b"
      style={{ background: 'white', borderColor: '#E5E0D4' }}
    >
      <div className="px-6 lg:px-8 pt-4 pb-0">
        {/* Breadcrumb */}
        <div className="flex items-center gap-1.5 text-[12px] mb-3" style={{ color: '#6B7A72' }}>
          <Link href="/dashboard" className="hover:text-[#1F4D3A] transition-colors">Events</Link>
          <ChevronRight size={12} strokeWidth={2} />
          <Link href={`/events/${eventId}`} className="hover:text-[#1F4D3A] transition-colors truncate max-w-[200px]">
            {eventName}
          </Link>
        </div>

        {/* Tab strip */}
        <div className="flex gap-0 overflow-x-auto no-scrollbar">
          {TABS.map(tab => (
            <Link
              key={tab.key}
              href={tab.href(eventId)}
              className="flex-none text-[13px] font-medium px-3 pb-3 border-b-2 transition-colors whitespace-nowrap"
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
