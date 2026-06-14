'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutGrid, CalendarDays, Mic, Store, Users, Compass } from 'lucide-react';
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

// Focused conversion / utility flows render without the sidebar — just the
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

      {focused ? (
        <main className="flex-1">{children}</main>
      ) : (
        <div className="flex-1 flex">
          {/* Desktop sidebar */}
          <aside
            className="hidden lg:flex flex-col w-[236px] shrink-0 sticky self-start"
            style={{ top: 64, height: 'calc(100vh - 64px)', background: '#FFFFFF', borderRight: '1px solid #E5E0D4' }}
          >
            <div className="px-5 pt-6 pb-4">
              <div className="text-[11px] font-semibold uppercase tracking-[0.1em] mb-1" style={{ color: '#6B7A72' }}>Event</div>
              <Link href={base} className="font-display font-semibold text-[15px] leading-snug line-clamp-2 hover:opacity-80 transition" style={{ color: '#0F1F18', letterSpacing: '-0.01em' }}>
                {eventName}
              </Link>
            </div>
            <nav className="px-3 flex-1">
              {sections.map(s => {
                const active = isActive(s.path, s.exact);
                const Icon = s.icon;
                return (
                  <Link
                    key={s.key}
                    href={`${base}${s.path}`}
                    className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-[14px] font-medium mb-0.5 transition-colors"
                    style={active
                      ? { background: '#E8EFEB', color: '#1F4D3A' }
                      : { color: '#3A4A42' }}
                  >
                    <Icon size={16} strokeWidth={active ? 2.2 : 1.8} />
                    {s.label}
                  </Link>
                );
              })}
            </nav>
            <div className="px-3 pb-5 mt-auto">
              <Link href="/events" className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-[13.5px] font-medium transition-colors" style={{ color: '#6B7A72' }}>
                <Compass size={15} strokeWidth={1.8} /> Discover events
              </Link>
            </div>
          </aside>

          {/* Main column */}
          <div className="flex-1 min-w-0 flex flex-col">
            {/* Mobile section tabs */}
            <nav
              className="lg:hidden flex items-center gap-1 overflow-x-auto px-4 py-2 sticky z-30"
              style={{ top: 64, background: 'rgba(250,246,238,0.92)', backdropFilter: 'blur(8px)', borderBottom: '1px solid #E5E0D4', scrollbarWidth: 'none' }}
            >
              {sections.map(s => {
                const active = isActive(s.path, s.exact);
                return (
                  <Link
                    key={s.key}
                    href={`${base}${s.path}`}
                    className="shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[13px] font-medium transition-colors"
                    style={active ? { background: '#1F4D3A', color: '#FFFFFF' } : { background: '#FFFFFF', color: '#3A4A42', border: '1px solid #E5E0D4' }}
                  >
                    {s.label}
                  </Link>
                );
              })}
            </nav>

            <div className="flex-1 min-w-0">{children}</div>
          </div>
        </div>
      )}

      <MarketingFooter />
    </div>
  );
}
