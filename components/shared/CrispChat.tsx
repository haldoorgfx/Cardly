'use client';

import { useEffect } from 'react';

// Crisp live chat widget — only loads when NEXT_PUBLIC_CRISP_WEBSITE_ID is set.
// Get your ID from: https://app.crisp.chat → Settings → Website → Setup instructions
export function CrispChat() {
  const websiteId = process.env.NEXT_PUBLIC_CRISP_WEBSITE_ID;

  useEffect(() => {
    if (!websiteId) return;

    // Crisp's official snippet
    const w = window as unknown as Record<string, unknown>;
    w.$crisp = [];
    w.CRISP_WEBSITE_ID = websiteId;

    const script = document.createElement('script');
    script.src = 'https://client.crisp.chat/l.js';
    script.async = true;
    document.head.appendChild(script);

    return () => {
      // Clean up on unmount (hot reload)
      document.head.removeChild(script);
    };
  }, [websiteId]);

  return null;
}
