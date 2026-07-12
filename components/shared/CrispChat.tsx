'use client';

import { useEffect } from 'react';
import { analyticsAllowed, CONSENT_EVENT } from '@/lib/consent';

// Crisp live chat widget — loads only when NEXT_PUBLIC_CRISP_WEBSITE_ID is set
// AND the visitor has accepted cookies (Crisp sets its own cookies).
export function CrispChat() {
  const websiteId = process.env.NEXT_PUBLIC_CRISP_WEBSITE_ID;

  useEffect(() => {
    if (!websiteId) return;
    let script: HTMLScriptElement | null = null;

    const boot = () => {
      if (script || !analyticsAllowed()) return;
      // Crisp's official snippet
      const w = window as unknown as Record<string, unknown>;
      w.$crisp = [];
      w.CRISP_WEBSITE_ID = websiteId;
      script = document.createElement('script');
      script.src = 'https://client.crisp.chat/l.js';
      script.async = true;
      document.head.appendChild(script);
    };

    boot();
    window.addEventListener(CONSENT_EVENT, boot);
    return () => {
      window.removeEventListener(CONSENT_EVENT, boot);
      if (script && script.parentNode) script.parentNode.removeChild(script);
    };
  }, [websiteId]);

  return null;
}
