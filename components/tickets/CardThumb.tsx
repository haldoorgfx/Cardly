'use client';

import { useState } from 'react';
import { IdCard } from 'lucide-react';

/**
 * Card thumbnail with a graceful fallback. If the stored eventera_card_url is
 * dead/404s, we show a placeholder instead of a broken-image icon + alt text.
 */
export function CardThumb({ src, alt }: { src: string; alt: string }) {
  const [failed, setFailed] = useState(false);

  if (failed) {
    return (
      <div className="absolute inset-0 grid place-items-center" style={{ color: '#9BB4A6' }}>
        <IdCard size={28} strokeWidth={1.6} />
      </div>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt}
      className="absolute inset-0 w-full h-full object-contain"
      onError={() => setFailed(true)}
    />
  );
}
