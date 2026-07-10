'use client';

import { MarketingNav } from '@/components/marketing/MarketingNav';

interface PublicNavProps {
  eventSlug?: string;
  eventName?: string;
}

/**
 * Unified site header. Event-scoped navigation now lives in the EventShell
 * sidebar, so this is a thin wrapper around the shared, sticky MarketingNav —
 * every public page (discovery, tickets, account, event pages, marketing)
 * renders the exact same rich header. Props are accepted for back-compat but
 * ignored.
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function PublicNav(_props: PublicNavProps = {}) {
  return <MarketingNav />;
}
