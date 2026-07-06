'use client';

/**
 * Attendee-facing white-label context. Populated once by the server page from
 * the event owner's white-label settings, then read by any card-flow surface
 * that shows Eventera branding (the "powered by" line, brand wordmark, accents).
 */

import { createContext, useContext } from 'react';

export interface AttendeeBrand {
  brandName: string | null;
  primaryColor: string;
  hidePoweredBy: boolean;
}

const DEFAULT: AttendeeBrand = {
  brandName: null,
  primaryColor: '#1F4D3A',
  hidePoweredBy: false,
};

const Ctx = createContext<AttendeeBrand>(DEFAULT);

export function AttendeeBrandProvider({
  value,
  children,
}: {
  value: AttendeeBrand;
  children: React.ReactNode;
}) {
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAttendeeBrand(): AttendeeBrand {
  return useContext(Ctx);
}

/** The name to show in "powered by …" — the organizer's brand, or Eventera. */
export function poweredByName(brand: AttendeeBrand): string {
  return brand.brandName ?? 'eventera';
}

/**
 * Drop-in replacement for the hardcoded "powered by eventera" lines in the
 * attendee card flow. Renders nothing when the organizer has hidden it, and
 * swaps in their brand name otherwise.
 *   - default: light-background card screens
 *   - plain:   inherits surrounding color (organizer strip)
 *   - gradient: forest→gold wordmark on dark backgrounds (variant picker)
 */
export function PoweredByInline({ tone = 'default' }: { tone?: 'default' | 'plain' | 'gradient' }) {
  const brand = useAttendeeBrand();
  if (brand.hidePoweredBy) return null;
  const name = poweredByName(brand);

  if (tone === 'plain') return <>powered by {name}</>;

  if (tone === 'gradient') {
    return (
      <>
        Powered by{' '}
        <span
          style={{
            background: 'linear-gradient(135deg,#1F4D3A,#E8C57E)',
            WebkitBackgroundClip: 'text',
            backgroundClip: 'text',
            color: 'transparent',
          }}
        >
          {brand.brandName ?? 'Eventera'}
        </span>
      </>
    );
  }

  return <>powered by <span style={{ color: '#0F1F18', fontWeight: 500 }}>{name}</span></>;
}
