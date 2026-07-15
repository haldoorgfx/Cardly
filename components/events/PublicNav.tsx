'use client';

import { MarketingNav } from '@/components/marketing/MarketingNav';

interface PublicNavProps {
  eventSlug?: string;
  eventName?: string;
}

/**
 * Unified site header — a thin wrapper around the shared, sticky MarketingNav
 * so every public page (discovery, tickets, account, event pages, marketing)
 * renders the exact same rich header. There is no event sidebar; standalone
 * section routes get a "Back to {event}" link from EventShell instead. Props
 * are accepted for back-compat but ignored.
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function PublicNav(_props: PublicNavProps = {}) {
  return <MarketingNav />;
}
