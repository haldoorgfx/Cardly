'use client';

import { useEffect } from 'react';
import { StatusState, describeError } from '@/components/ui/status-state';

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error('[root error]', error);
  }, [error]);

  return (
    <div className="min-h-screen grid place-items-center px-6" style={{ background: '#FAF6EE' }}>
      <div className="max-w-[440px]">
        <div
          className="inline-grid h-16 w-16 rounded-2xl place-items-center text-white text-[28px] font-display font-bold mb-6 mx-auto"
          style={{ background: 'linear-gradient(135deg, #1F4D3A 0%, #2A6A50 60%, #E8C57E 100%)' }}
        >
          E
        </div>
        <StatusState
          kind="error"
          title="Something went wrong"
          message={`${describeError(error, 'this page')} The team has been notified.`}
          primaryAction={{ label: 'Try again', onClick: reset }}
          secondaryAction={{ label: 'Go home', href: '/' }}
        />
        {error.digest && (
          <p className="text-center text-[12.5px] text-muted -mt-3">Error ID: {error.digest}</p>
        )}
      </div>
    </div>
  );
}
