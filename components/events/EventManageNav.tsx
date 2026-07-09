'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

type ActiveTab =
  | 'overview'
  | 'registrations'
  | 'tickets'
  | 'form'
  | 'sessions'
  | 'speakers'
  | 'page-setup'
  | 'promo-codes'
  | 'analytics'
  | 'q-and-a'
  | 'polls';

interface NavItem {
  key: ActiveTab;
  label: string;
  href: (id: string) => string;
}

const NAV_ITEMS: NavItem[] = [
  { key: 'overview',       label: 'Overview',      href: (id) => `/events/${id}` },
  { key: 'registrations',  label: 'Registrations', href: (id) => `/events/${id}/registrations` },
  { key: 'tickets',        label: 'Tickets',       href: (id) => `/events/${id}/tickets` },
  { key: 'form',           label: 'Form',          href: (id) => `/events/${id}/form` },
  { key: 'sessions',       label: 'Sessions',      href: (id) => `/events/${id}/sessions` },
  { key: 'speakers',       label: 'Speakers',      href: (id) => `/events/${id}/speakers` },
  { key: 'q-and-a',        label: 'Q&A',           href: (id) => `/events/${id}/q-and-a` },
  { key: 'polls',          label: 'Polls',         href: (id) => `/events/${id}/polls` },
  { key: 'promo-codes',    label: 'Promo codes',   href: (id) => `/events/${id}/promo-codes` },
  { key: 'page-setup',     label: 'Page setup',    href: (id) => `/events/${id}/page-setup` },
  { key: 'analytics',      label: 'Analytics',     href: (id) => `/events/${id}/event-analytics` },
];

interface EventManageNavProps {
  eventId: string;
  active: ActiveTab;
}

export function EventManageNav({ eventId, active }: EventManageNavProps) {
  return (
    <div
      className="border-b overflow-x-auto scrollbar-none"
      style={{ borderColor: '#E5E0D4' }}
    >
      <div className="flex items-end gap-0 min-w-max px-4 sm:px-6 lg:px-8">
        {NAV_ITEMS.map((item) => {
          const isActive = active === item.key;
          return (
            <Link
              key={item.key}
              href={item.href(eventId)}
              className="px-3.5 py-3 text-[13px] font-medium border-b-2 whitespace-nowrap transition-colors"
              style={
                isActive
                  ? { color: '#1F4D3A', borderColor: '#1F4D3A' }
                  : { color: '#6B7A72', borderColor: 'transparent' }
              }
            >
              {item.label}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
