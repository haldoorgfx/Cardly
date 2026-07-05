'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const TABS = [
  { label: 'General',      href: '/settings' },
  { label: 'Billing',      href: '/settings/billing' },
  { label: 'Developer',    href: '/settings/developer' },
  { label: 'Integrations', href: '/settings/integrations' },
  { label: 'White Label',  href: '/settings/white-label' },
];

export function SettingsTabs() {
  const pathname = usePathname();
  return (
    <div style={{ borderBottom: '1px solid #E5E0D4' }}>
      <div>
        <div className="flex items-center gap-0 overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
          {TABS.map(tab => {
            const active = tab.href === '/settings'
              ? pathname === '/settings'
              : pathname.startsWith(tab.href);
            return (
              <Link
                key={tab.href}
                href={tab.href}
                className="shrink-0 px-4 pt-3 pb-2.5 text-[13px] font-medium border-b-2 transition-colors whitespace-nowrap"
                style={{
                  borderColor: active ? '#1F4D3A' : 'transparent',
                  color: active ? '#1F4D3A' : '#6B7A72',
                }}
                onMouseEnter={e => { if (!active) (e.currentTarget as HTMLElement).style.color = '#0F1F18'; }}
                onMouseLeave={e => { if (!active) (e.currentTarget as HTMLElement).style.color = '#6B7A72'; }}
              >
                {tab.label}
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
