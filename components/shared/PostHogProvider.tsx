'use client';

import posthog from 'posthog-js';
import { PostHogProvider as PHProvider } from 'posthog-js/react';
import { useEffect } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';

// ── Boot PostHog once ─────────────────────────────────────────────────────────
function PostHogInit() {
  useEffect(() => {
    const key = process.env.NEXT_PUBLIC_POSTHOG_KEY;
    const host = process.env.NEXT_PUBLIC_POSTHOG_HOST ?? 'https://app.posthog.com';
    if (!key || posthog.__loaded) return;

    posthog.init(key, {
      api_host: host,
      capture_pageview: false,      // we fire pageviews manually below
      capture_pageleave: true,
      persistence: 'localStorage+cookie',
      autocapture: true,            // clicks, inputs, form submits
      session_recording: { maskAllInputs: true }, // never record passwords/PII
    });
  }, []);

  return null;
}

// ── Track page views on route change ─────────────────────────────────────────
function PostHogPageView() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (!pathname || !posthog.__loaded) return;
    const url = searchParams?.toString()
      ? `${pathname}?${searchParams}`
      : pathname;
    posthog.capture('$pageview', { $current_url: url });
  }, [pathname, searchParams]);

  return null;
}

// ── Provider wrapper (used in app/layout.tsx) ────────────────────────────────
export function PostHogProvider({ children }: { children: React.ReactNode }) {
  return (
    <PHProvider client={posthog}>
      <PostHogInit />
      <PostHogPageView />
      {children}
    </PHProvider>
  );
}

// ── Convenience re-export for event tracking in any component ─────────────────
// Usage: import { track } from '@/components/shared/PostHogProvider'
//        track('event_created', { event_id: id, plan: 'pro' })
export function track(event: string, properties?: Record<string, unknown>) {
  if (typeof window !== 'undefined' && posthog.__loaded) {
    posthog.capture(event, properties);
  }
}

// Usage: import { identify } from '@/components/shared/PostHogProvider'
//        identify(userId, { email, plan })
export function identify(userId: string, properties?: Record<string, unknown>) {
  if (typeof window !== 'undefined' && posthog.__loaded) {
    posthog.identify(userId, properties);
  }
}
