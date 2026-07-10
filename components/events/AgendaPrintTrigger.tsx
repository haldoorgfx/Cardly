'use client';

import { useEffect } from 'react';

interface Props {
  backHref: string;
}

export function AgendaPrintTrigger({ backHref }: Props) {
  useEffect(() => {
    window.print();
  }, []);

  return (
    <div
      className="no-print"
      style={{
        position: 'fixed',
        top: 16,
        right: 16,
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        zIndex: 100,
      }}
    >
      <a
        href={backHref}
        style={{
          display: 'inline-flex', alignItems: 'center', gap: 6,
          padding: '8px 16px', borderRadius: 10, fontSize: 13,
          color: '#6B7A72', textDecoration: 'none',
          background: 'white', border: '1px solid #E5E0D4',
        }}
      >
        ← Back
      </a>
      <button
        onClick={() => window.print()}
        style={{
          display: 'inline-flex', alignItems: 'center', gap: 6,
          padding: '8px 18px', borderRadius: 10, fontSize: 13, fontWeight: 600,
          background: '#1F4D3A', color: 'white', border: 'none', cursor: 'pointer',
        }}
      >
        Print / Save as PDF
      </button>
    </div>
  );
}
