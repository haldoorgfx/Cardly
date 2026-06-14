'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutGrid, CalendarDays, Mic, Store, Users } from 'lucide-react';
import { PublicNav } from '@/components/events/PublicNav';
import { MarketingFooter } from '@/components/marketing/MarketingFooter';

type Features = Record<string, boolean>;

interface Props {
  slug: string;
  eventName: string;
  features: Features;
  children: React.ReactNode;
}

const SECTIONS = [
  { key: 'overview', label: 'Overview', icon: LayoutGrid,   path: '',          feature: null,         exact: true },
  { key: 'schedule', label: 'Schedule', icon: CalendarDays, path: '/schedule', feature: 'schedule',   exact: false },
  { key: 'speakers', label: 'Speakers', icon: Mic,          path: '/speakers', feature: 'speakers',   exact: false },
  { key: 'sponsors', label: 'Sponsors', icon: Store,        path: '/sponsors', feature: 'sponsors',   exact: false },
  { key: 'network',  label: 'Network',  icon: Users,        path: '/people',   feature: 'networking', exact: false },
] as const;

// Focused conversion / utility flows render without the section tabs — just the
// consistent header + content + footer, so nothing distracts from the task.
const FOCUSED = /\/(register|waitlist|checkout|confirm|lead-scanner|check-in)(\/|$)/;

export function EventShell({ slug, eventName, features, children }: Props) {
  const pathname = usePathname();
  const base = `/e/${slug}`;
  const focused = FOCUSED.test(pathname);

  // Opt-out model: a feature shows unless explicitly set false.
  const sections = SECTIONS.filter(s => !s.feature || features[s.feature] !== false);

  const isActive = (path: string, exact: boolean) => {
    const href = `${base}${path}`;
    return exact ? pathname === href : pathname === href || pathname.startsWith(href + '/');
  };

  return (
    <div className="min-h-screen flex flex-col" style={{ background: '#FAF6EE' }}>
      <PublicNav />

      {/* Sticky event section tabs — the one place to reach every part of the event */}
      {!focused && (
        <div
          className="sticky z-30"
          style={{ top: 64, background: 'rgba(250,246,238,0.92)', backdropFilter: 'blur(10px)', borderBottom: '1px solid #E5E0D4' }}
        >
          <div className="max-w-[1100px] mx-auto px-4 sm:px-6 flex items-center gap-1 overflow-x-auto" style={{ height: 52, scrollbarWidth: 'none' }}>
            <span className="hidden lg:flex items-center mr-4 shrink-0 font-display font-semibold text-[13.5px] max-w-[200px] truncate" style={{ color: '#0F1F18', letterSpacing: '-0.01em' }}>
              {eventName}
            </span>
            {sections.map(s => {
              const active = isActive(s.path, s.exact);
              const Icon = s.icon;
              return (
                <Link
                  key={s.key}
                  href={`${base}${s.path}`}
                  className="shrink-0 inline-flex items-center gap-1.5 px-3.5 h-full text-[14px] font-medium border-b-2 transition-colors"
                  style={active
                    ? { color: '#1F4D3A', borderColor: '#1F4D3A' }
                    : { color: '#6B7A72', borderColor: 'transparent' }}
                >
                  <Icon size={15} strokeWidth={active ? 2.2 : 1.8} />
                  {s.label}
                </Link>
              );
            })}
          </div>
        </div>
      )}

      <main className="flex-1 min-w-0">{children}</main>

      <MarketingFooter />
    </div>
  );
}
