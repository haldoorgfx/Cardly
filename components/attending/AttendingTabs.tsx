'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ExternalLink } from 'lucide-react';

export interface AttendingTab {
  href: string;
  label: string;
}

/**
 * Header + tab rail for the attendee's event workspace.
 *
 * Deliberately the same anatomy as the organizer, speaker and sponsor
 * workspaces — event name, then a horizontal rail of the tools that event has
 * enabled — so a person who is an attendee at one event and a speaker at
 * another isn't learning two different products.
 */
export function AttendingTabs({
  eventName,
  eventSlug,
  tabs,
  children,
}: {
  eventName: string;
  eventSlug: string;
  tabs: AttendingTab[];
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <div>
      <div style={{ borderBottom: '1px solid #E5E0D4', background: '#FFFFFF' }}>
        <div className="mx-auto w-full px-4 sm:px-6 lg:px-8 pt-6" style={{ maxWidth: 1100 }}>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <div
                className="text-[11px] font-medium uppercase tracking-[0.14em] mb-1.5"
                style={{ color: '#65736B' }}
              >
                You&apos;re attending
              </div>
              <h1
                className="font-display font-bold text-[22px] sm:text-[26px] truncate"
                style={{ color: '#0F1F18', letterSpacing: '-0.02em' }}
              >
                {eventName}
              </h1>
            </div>
            {/* The public event page is a different thing from this workspace —
                that one is about the event, this one is about you. Linking out
                explicitly beats leaving people to guess where the programme is. */}
            <Link
              href={`/e/${eventSlug}`}
              className="inline-flex items-center gap-1.5 h-9 px-3 rounded-lg text-[13px] font-medium transition hover:opacity-80 shrink-0"
              style={{ background: '#E8EFEB', color: '#1F4D3A', textDecoration: 'none' }}
            >
              <ExternalLink size={14} strokeWidth={2} />
              Event page
            </Link>
          </div>

          {tabs.length > 1 && (
            <div className="flex gap-1 mt-5 -mb-px overflow-x-auto">
              {tabs.map(t => {
                const active =
                  pathname === t.href ||
                  (t.href.split('/').length > 3 && pathname.startsWith(`${t.href}/`));
                return (
                  <Link
                    key={t.href}
                    href={t.href}
                    className="shrink-0 px-3 h-10 flex items-center text-[13.5px] font-medium transition"
                    style={{
                      color: active ? '#1F4D3A' : '#65736B',
                      borderBottom: `2px solid ${active ? '#1F4D3A' : 'transparent'}`,
                      textDecoration: 'none',
                    }}
                  >
                    {t.label}
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <div className="mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 sm:py-10" style={{ maxWidth: 1100 }}>
        {children}
      </div>
    </div>
  );
}
