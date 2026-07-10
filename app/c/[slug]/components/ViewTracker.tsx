'use client';

import { useEffect } from 'react';

/**
 * Fires a view increment once per browser session per event.
 * Uses sessionStorage so a page refresh in the same tab doesn't double-count.
 * The server-side fire-and-forget RPC in page.tsx has been removed in favour
 * of this client-side deduped approach.
 */
export function ViewTracker({ eventId }: { eventId: string }) {
  useEffect(() => {
    const key = `eventera_viewed_${eventId}`;
    if (sessionStorage.getItem(key)) return;
    sessionStorage.setItem(key, '1');
    fetch('/api/view', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ eventId }),
    }).catch(() => { /* best-effort */ });
  }, [eventId]);

  return null;
}
