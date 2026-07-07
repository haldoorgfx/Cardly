'use client';

import { useState } from 'react';
import type { ReactNode } from 'react';
import SettingsClient from './SettingsClient';

// The General settings page used to be one long scroll: the full profile editor,
// then workspace preferences, then notifications, then the danger zone — all
// stacked. This splits it into sub-tabs so each group is a short, scannable
// page. State + saving still live inside each section component, so nothing is
// lost by switching tabs.

type SubTab = 'profile' | 'preferences' | 'notifications' | 'account';

const SUBTABS: { id: SubTab; label: string }[] = [
  { id: 'profile',       label: 'Profile' },
  { id: 'preferences',   label: 'Preferences' },
  { id: 'notifications', label: 'Notifications' },
  { id: 'account',       label: 'Account' },
];

export default function GeneralSettings({
  profileTab,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  profile,
  userId,
}: {
  /** The shared profile/identity editor, rendered on the Profile sub-tab. */
  profileTab: ReactNode;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  profile: any;
  userId: string;
}) {
  const [tab, setTab] = useState<SubTab>('profile');

  return (
    <div className="w-full max-w-[820px]">
      {/* Sub-tab pills — horizontally scrollable on narrow screens */}
      <div
        role="tablist"
        aria-label="Settings sections"
        className="inline-flex gap-1 p-1 rounded-xl mb-6 max-w-full overflow-x-auto"
        style={{ background: '#F0EDE6', scrollbarWidth: 'none' }}
      >
        {SUBTABS.map(t => {
          const active = t.id === tab;
          return (
            <button
              key={t.id}
              role="tab"
              aria-selected={active}
              onClick={() => setTab(t.id)}
              className="shrink-0 h-8 px-4 rounded-lg text-[13px] font-medium transition-colors whitespace-nowrap focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1F4D3A]"
              style={{
                background: active ? '#FFFFFF' : 'transparent',
                color: active ? '#1F4D3A' : '#6B7A72',
                boxShadow: active ? '0 1px 2px rgba(15,31,24,0.08)' : 'none',
              }}
            >
              {t.label}
            </button>
          );
        })}
      </div>

      {/* One section at a time */}
      {tab === 'profile' ? (
        profileTab
      ) : (
        <SettingsClient profile={profile} userId={userId} section={tab} />
      )}
    </div>
  );
}
