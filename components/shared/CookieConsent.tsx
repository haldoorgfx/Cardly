'use client';

import { useEffect, useState } from 'react';
import { getConsent, setConsent } from '@/lib/consent';

export function CookieConsent() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Show only until the visitor has made a choice.
    if (!getConsent()) setVisible(true);
  }, []);

  if (!visible) return null;

  const choose = (v: 'accepted' | 'rejected') => {
    setConsent(v);
    setVisible(false);
  };

  return (
    <div
      style={{
        position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)',
        zIndex: 9999, width: 'min(600px, calc(100vw - 32px))',
        background: '#0F1F18', color: '#FAF6EE',
        borderRadius: 16, padding: '16px 20px',
        display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap',
        boxShadow: '0 8px 32px rgba(15,31,24,0.3)',
        fontFamily: 'Inter, sans-serif', fontSize: 14,
      }}
    >
      <p style={{ margin: 0, flex: '1 1 260px', lineHeight: 1.5, color: 'rgba(250,246,238,0.8)' }}>
        We use a required cookie to keep you signed in. With your consent we also
        use analytics and support tools (PostHog, Crisp) to improve Eventera.{' '}
        <a href="/privacy" style={{ color: '#E8C57E', textDecoration: 'underline' }}>Privacy policy</a>.
      </p>
      <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
        <button
          onClick={() => choose('rejected')}
          style={{
            background: 'transparent', color: 'rgba(250,246,238,0.85)',
            border: '1px solid rgba(250,246,238,0.25)', borderRadius: 10,
            padding: '8px 16px', fontSize: 13, fontWeight: 600, cursor: 'pointer',
            whiteSpace: 'nowrap',
          }}
        >
          Reject
        </button>
        <button
          onClick={() => choose('accepted')}
          style={{
            background: '#1F4D3A', color: '#FAF6EE',
            border: 'none', borderRadius: 10,
            padding: '8px 18px', fontSize: 13, fontWeight: 600,
            cursor: 'pointer', whiteSpace: 'nowrap',
          }}
        >
          Accept
        </button>
      </div>
    </div>
  );
}
