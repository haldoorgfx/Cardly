'use client';

import { useEffect } from 'react';
import { StatusState } from '@/components/ui/status-state';

export default function PublicEventError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('[public event error]', error);
  }, [error]);

  return (
    <div
      style={{ background: '#FAF6EE', minHeight: '100vh' }}
      className="flex flex-col items-center justify-center px-6 py-16"
    >
      <div className="max-w-[360px]">
        {/*
          Public/attendee-facing: keep this friendly and generic — a random
          visitor has no context on organizer/internal concepts, so we don't
          use describeError() here (it can surface things like "session
          expired" that make no sense to someone who never signed in).
        */}
        <StatusState
          kind="error"
          title="This page didn't load"
          message="It might be a temporary issue — try refreshing, or head back home."
          primaryAction={{ label: 'Try again', onClick: reset }}
          secondaryAction={{ label: 'Home', href: '/' }}
        />
        {error.digest && (
          <p className="text-center text-[11px] text-muted -mt-3">ref: {error.digest}</p>
        )}
      </div>
    </div>
  );
}
