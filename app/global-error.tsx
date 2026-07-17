'use client';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body style={{ margin: 0, fontFamily: 'Inter, sans-serif', background: '#FAF6EE' }}>
        <div
          style={{
            minHeight: '100vh',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '2rem',
            textAlign: 'center',
          }}
        >
          <div
            style={{
              width: 48,
              height: 48,
              borderRadius: '50%',
              background: '#E8EFEB',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '1.5rem',
              fontSize: 24,
            }}
          >
            ⚠
          </div>
          <h1
            style={{
              fontSize: '1.5rem',
              fontWeight: 600,
              color: '#0F1F18',
              margin: '0 0 0.5rem',
              letterSpacing: '-0.02em',
            }}
          >
            Something went wrong
          </h1>
          <p style={{ color: '#65736B', margin: '0 0 2rem', maxWidth: 380 }}>
            An unexpected error occurred. Please try again, or contact support if the problem persists.
          </p>
          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
            <button
              onClick={reset}
              style={{
                background: '#1F4D3A',
                color: '#fff',
                border: 'none',
                borderRadius: 8,
                padding: '0.625rem 1.5rem',
                fontSize: '0.9375rem',
                fontWeight: 500,
                cursor: 'pointer',
              }}
            >
              Try again
            </button>
            {/*
              Plain <a>, not next/link — this file replaces the root layout
              when React itself has crashed, so it must not depend on router
              context or any component that could itself fail to render.
            */}
            <a
              href="/"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                background: 'transparent',
                color: '#0F1F18',
                border: '1px solid #E5E0D4',
                borderRadius: 8,
                padding: '0.625rem 1.5rem',
                fontSize: '0.9375rem',
                fontWeight: 500,
                textDecoration: 'none',
              }}
            >
              Go home
            </a>
          </div>
          {error.digest && (
            <p style={{ color: '#65736B', fontSize: '0.75rem', marginTop: '1.5rem' }}>
              Error ID: {error.digest}
            </p>
          )}
        </div>
      </body>
    </html>
  );
}
