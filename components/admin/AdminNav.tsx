'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Palette, BookOpen, ScrollText, Users, LayoutGrid, Layers, Ticket,
  Flag, Image as ImageIcon, BarChart3, LayoutTemplate, CreditCard,
} from 'lucide-react';

const NAV = [
  { href: '/admin/collections',   label: 'Collections',    icon: Layers       },
  { href: '/admin/theme',         label: 'Theme & Brand',  icon: Palette      },
  { href: '/admin/templates',     label: 'Templates',      icon: LayoutTemplate },
  { href: '/admin/media',         label: 'Media',          icon: ImageIcon    },
  { href: '/admin/changelog',     label: 'Changelog',      icon: BookOpen     },
  { href: '/admin/users',         label: 'Users',          icon: Users        },
  { href: '/admin/registrations', label: 'Registrations',  icon: Ticket       },
  { href: '/admin/billing',       label: 'Billing',        icon: CreditCard   },
  { href: '/admin/analytics',     label: 'Analytics',      icon: BarChart3    },
  { href: '/admin/flags',         label: 'Flags',          icon: Flag         },
  { href: '/admin/audit',         label: 'Audit Log',      icon: ScrollText   },
];

export function AdminNav() {
  const pathname = usePathname();

  return (
    <aside
      className="w-[220px] shrink-0 flex flex-col sticky top-0 h-screen border-r"
      style={{ background: '#FFFFFF', borderColor: '#E5E0D4' }}
    >
      {/* Header */}
      <div
        className="h-14 flex items-center gap-3 px-4 shrink-0"
        style={{ borderBottom: '1px solid #E5E0D4' }}
      >
        <Link
          href="/dashboard"
          className="flex items-center gap-2.5 hover:opacity-80 transition-opacity"
        >
          <span
            className="inline-block w-6 h-6 rounded-md shrink-0"
            style={{ background: '#1F4D3A' }}
          />
          <span className="font-display text-[17px] font-bold tracking-tight" style={{ color: '#0F1F18' }}>
            Eventera
          </span>
        </Link>
        <span
          className=" text-[11.5px] tracking-[0.16em] uppercase px-1.5 py-0.5 rounded-md ml-auto shrink-0"
          style={{ background: '#E8EFEB', color: '#1F4D3A' }}
        >
          Admin
        </span>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-5 space-y-0.5 overflow-y-auto">
        <div className="px-2 mb-3 text-[12px] uppercase tracking-widest" style={{ color: '#65736B' }}>
          Platform
        </div>
        {NAV.map(({ href, label, icon: Icon }) => {
          const active = pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 py-[7px] rounded-lg text-[13px] transition-colors border-l-2 ${
                active ? 'font-medium pl-[8px] pr-2.5' : 'border-transparent px-2.5 hover:bg-[#F5F3EE]'
              }`}
              style={active
                ? { background: '#E8EFEB', color: '#1F4D3A', borderColor: '#1F4D3A' }
                : { color: '#3A4A42' }}
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
        style={{ borderTop: '1px solid #E5E0D4' }}
      >
        <Link
          href="/dashboard"
          className="flex items-center gap-3 px-2.5 py-[7px] rounded-lg text-[13px] transition-colors hover:bg-[#F5F3EE]"
          style={{ color: '#65736B' }}
        >
          <LayoutGrid size={14} strokeWidth={1.8} className="shrink-0" />
          Back to app
        </Link>
      </div>
    </aside>
  );
}
