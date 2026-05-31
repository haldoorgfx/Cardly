'use client';

import { useEffect, useState } from 'react';

const STORAGE_KEY = 'karta_cookie_consent';

export function CookieConsent() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!localStorage.getItem(STORAGE_KEY)) setVisible(true);
  }, []);

  if (!visible) return null;

  const accept = () => {
    localStorage.setItem(STORAGE_KEY, 'accepted');
    setVisible(false);
  };

  return (
    <div
      style={{
        position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)',
        zIndex: 9999, width: 'min(560px, calc(100vw - 32px))',
        background: '#0F1F18', color: '#FAF6EE',
        borderRadius: 16, padding: '16px 20px',
        display: 'flex', alignItems: 'center', gap: 16,
        boxShadow: '0 8px 32px rgba(15,31,24,0.3)',
        fontFamily: 'Inter, sans-serif', fontSize: 14,
      }}
    >
      <p style={{ margin: 0, flex: 1, lineHeight: 1.5, color: 'rgba(250,246,238,0.8)' }}>
        We use a session cookie to keep you signed in. No tracking or advertising cookies.{' '}
        <a href="/privacy" style={{ color: '#E8C57E', textDecoration: 'underline' }}>Privacy policy</a>.
      </p>
      <button
        onClick={accept}
        style={{
          flexShrink: 0,
          background: '#1F4D3A', color: '#FAF6EE',
          border: 'none', borderRadius: 10,
          padding: '8px 18px', fontSize: 13, fontWeight: 600,
          cursor: 'pointer', whiteSpace: 'nowrap',
        }}
      >
        Got it
      </button>
    </div>
  );
}
