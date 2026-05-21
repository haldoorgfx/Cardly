'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Palette, BookOpen, ScrollText, Users, LayoutGrid } from 'lucide-react';

const NAV = [
  { href: '/admin/theme',     label: 'Theme & Brand',  icon: Palette    },
  { href: '/admin/changelog', label: 'Changelog',      icon: BookOpen   },
  { href: '/admin/audit',     label: 'Audit Log',      icon: ScrollText },
  { href: '/admin/users',     label: 'Users',          icon: Users      },
];

export function AdminNav() {
  const pathname = usePathname();

  return (
    <aside
      className="w-[220px] shrink-0 flex flex-col sticky top-0 h-screen border-r"
      style={{ background: '#0F1F18', borderColor: 'rgba(255,255,255,0.07)' }}
    >
      {/* Header */}
      <div
        className="h-14 flex items-center gap-3 px-4 shrink-0"
        style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}
      >
        <Link
          href="/dashboard"
          className="flex items-center gap-2.5 hover:opacity-80 transition-opacity"
        >
          <span
            className="inline-block w-6 h-6 rounded-md shrink-0"
            style={{ background: 'linear-gradient(135deg, #FAF6EE 0%, #E8C57E 100%)' }}
          />
          <span className="font-display text-[17px] font-bold tracking-tight text-white">
            Karta
          </span>
        </Link>
        <span
          className="font-mono text-[9px] tracking-[0.16em] uppercase px-1.5 py-0.5 rounded-md ml-auto shrink-0"
          style={{ background: 'rgba(232,197,126,0.15)', color: '#E8C57E' }}
        >
          Admin
        </span>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-5 space-y-0.5">
        <div className="px-2 mb-3 text-[10px] font-mono text-white/25 uppercase tracking-widest">
          Platform
        </div>
        {NAV.map(({ href, label, icon: Icon }) => {
          const active = pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 px-2.5 py-[7px] rounded-lg text-[13px] transition-colors border-l-2 ${
                active
                  ? 'border-[#E8C57E] bg-white/[0.1] text-white font-medium pl-[8px]'
                  : 'border-transparent text-white/50 hover:text-white/85 hover:bg-white/[0.06]'
              }`}
            >
              <Icon size={14} strokeWidth={1.8} className="shrink-0" />
              {label}
            </Link>
          );
        })}
      </nav>

      {/* Back to app */}
      <div
        className="px-3 py-3 shrink-0"
        style={{ borderTop: '1px solid rgba(255,255,255,0.07)' }}
      >
        <Link
          href="/dashboard"
          className="flex items-center gap-3 px-2.5 py-[7px] rounded-lg text-[13px] text-white/40 hover:text-white/70 hover:bg-white/[0.06] transition-colors"
        >
          <LayoutGrid size={14} strokeWidth={1.8} className="shrink-0" />
          Back to app
        </Link>
      </div>
    </aside>
  );
}
