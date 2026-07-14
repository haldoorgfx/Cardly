import type { ReactNode } from 'react';
import SettingsClient from './SettingsClient';

// The account sections (Profile / Preferences / Notifications / Account) are now
// peers of Billing/Developer/etc. in the ONE settings tab bar, selected via the
// ?tab= query param. This component just renders the chosen section — no second
// tab row, no wrapper chrome.
export default function GeneralSettings({
  section,
  profileTab,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  profile,
  userId,
}: {
  section: 'profile' | 'notifications' | 'account';
  /** The shared profile/identity editor, rendered on the Profile section. */
  profileTab: ReactNode;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  profile: any;
  userId: string;
}) {
  if (section === 'profile') return <>{profileTab}</>;
  return <SettingsClient profile={profile} userId={userId} section={section} />;
}
