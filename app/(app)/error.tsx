'use client';

import { useEffect } from 'react';
import { StatusState, describeError } from '@/components/ui/status-state';

export default function AppError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error('[app error]', error);
  }, [error]);

  return (
    <div className="flex-1 grid place-items-center px-6 py-16">
      <div className="max-w-[400px]">
        <StatusState
          kind="error"
          title="Something went wrong"
          message={describeError(error, 'this page')}
          primaryAction={{ label: 'Try again', onClick: reset }}
          secondaryAction={{ label: 'Dashboard', href: '/dashboard' }}
        />
        {error.digest && (
          <p className="text-center text-[12.5px] text-muted -mt-3">ref: {error.digest}</p>
        )}
      </div>
    </div>
  );
}
