'use client';
import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';

// ONE settings tab bar. The account sub-sections (Profile / Preferences /
// Notifications / Account) live on the /settings route and switch via ?tab=;
// Billing / Developer / Integrations / White Label are their own routes. Having
// a single row avoids the old two-stacked-tab-bars look.
const TABS = [
  { label: 'Profile',       href: '/settings',                    tab: null },
  { label: 'Preferences',   href: '/settings?tab=preferences',    tab: 'preferences' },
  { label: 'Notifications', href: '/settings?tab=notifications',  tab: 'notifications' },
  { label: 'Billing',       href: '/settings/billing',            tab: undefined },
  { label: 'Developer',     href: '/settings/developer',          tab: undefined },
  { label: 'Integrations',  href: '/settings/integrations',       tab: undefined },
  { label: 'White Label',   href: '/settings/white-label',        tab: undefined },
  { label: 'Account',       href: '/settings?tab=account',        tab: 'account' },
] as const;

export function SettingsTabs() {
  const pathname = usePathname();
  const params = useSearchParams();
  const currentTab = params.get('tab'); // null on Profile, else the section

  function isActive(t: (typeof TABS)[number]) {
    // Route-based tabs (Billing, etc.) — tab is undefined
    if (t.tab === undefined) return pathname.startsWith(t.href);
    // /settings sub-section tabs — compare the ?tab= value
    return pathname === '/settings' && currentTab === t.tab;
  }

  return (
    <div style={{ borderBottom: '1px solid #E5E0D4' }}>
      <div className="flex items-center gap-0 overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
        {TABS.map(tab => {
          const active = isActive(tab);
          return (
            <Link
              key={tab.label}
              href={tab.href}
              scroll={false}
              className="shrink-0 px-4 pt-3 pb-2.5 text-[13px] font-medium border-b-2 transition-colors whitespace-nowrap focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[#1F4D3A]"
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
  );
}
