'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutGrid, CalendarDays, Mic, Store, Users } from 'lucide-react';
import { useEventShell } from './EventShellContext';

const SECTIONS = [
  { key: 'overview', label: 'Overview', icon: LayoutGrid,   path: '',          feature: null,         exact: true  },
  { key: 'schedule', label: 'Schedule', icon: CalendarDays, path: '/schedule', feature: 'schedule',   exact: false },
  { key: 'speakers', label: 'Speakers', icon: Mic,          path: '/speakers', feature: 'speakers',   exact: false },
  { key: 'sponsors', label: 'Sponsors', icon: Store,        path: '/sponsors', feature: 'sponsors',   exact: false },
  { key: 'network',  label: 'Network',  icon: Users,        path: '/people',   feature: 'networking', exact: false },
] as const;

export function EventSectionTabs() {
  const { slug, features } = useEventShell();
  const pathname = usePathname();
  const base = `/e/${slug}`;

  const sections = SECTIONS.filter(s => !s.feature || features[s.feature] !== false);

  const isActive = (path: string, exact: boolean) => {
    const href = `${base}${path}`;
    return exact ? pathname === href : pathname === href || pathname.startsWith(href + '/');
  };

  return (
    <div
      className="sticky z-30"
      style={{ top: 65, background: 'rgba(250,246,238,0.92)', backdropFilter: 'blur(10px)', borderBottom: '1px solid #E5E0D4' }}
    >
      <div
        className="max-w-[1200px] mx-auto px-5 lg:px-10 flex items-center gap-1 overflow-x-auto"
        style={{ height: 52, scrollbarWidth: 'none' }}
      >
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
                : { color: '#65736B', borderColor: 'transparent' }}
            >
              <Icon size={15} strokeWidth={active ? 2.2 : 1.8} />
              {s.label}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
