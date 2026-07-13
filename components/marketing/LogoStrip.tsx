/* Eventera — "trusted by" logo strip.
   NOTE: these are *invented* organizations with hand-drawn inline-SVG marks — not
   real companies. Putting real brands' logos here would imply endorsements Eventera
   doesn't have. Swap in genuine customer logos (as inline SVG or /public assets)
   once there are real, permissioned ones. Calm, monochrome, two-color discipline. */

import type { ReactNode } from 'react';
import s from './LogoStrip.module.css';

interface Brand {
  name: string;
  mark: ReactNode; // 24×24 viewBox, uses currentColor
}

const stroke = { fill: 'none', stroke: 'currentColor', strokeWidth: 1.7, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };

const BRANDS: Brand[] = [
  {
    name: 'Sahel Summit',
    mark: (
      <svg viewBox="0 0 24 24" aria-hidden><circle cx="12" cy="10" r="4.2" {...stroke} /><path d="M12 2.5v1.5M12 16v1.5M4.6 10h1.5M17.9 10h1.5M6.8 4.8l1 1M16.2 4.8l-1 1M3 20h18" {...stroke} /></svg>
    ),
  },
  {
    name: 'Nomad Fest',
    mark: (
      <svg viewBox="0 0 24 24" aria-hidden><path d="M12 3 3 20h18L12 3Z" {...stroke} /><path d="M12 9v11" {...stroke} /></svg>
    ),
  },
  {
    name: 'Ubuntu Foundation',
    mark: (
      <svg viewBox="0 0 24 24" aria-hidden><circle cx="9" cy="12" r="5.2" {...stroke} /><circle cx="15" cy="12" r="5.2" {...stroke} /></svg>
    ),
  },
  {
    name: 'Rift Ventures',
    mark: (
      <svg viewBox="0 0 24 24" aria-hidden><path d="M3 19 9 8l4 6 3-5 5 10Z" {...stroke} /></svg>
    ),
  },
  {
    name: 'Dune Expo',
    mark: (
      <svg viewBox="0 0 24 24" aria-hidden><path d="M3 15c3 0 3-4 6-4s3 4 6 4 3-4 6-4M3 20c3 0 3-3 6-3s3 3 6 3 3-3 6-3" {...stroke} /></svg>
    ),
  },
  {
    name: 'Kilifi Collective',
    mark: (
      <svg viewBox="0 0 24 24" aria-hidden><circle cx="6" cy="7" r="2.3" {...stroke} /><circle cx="18" cy="7" r="2.3" {...stroke} /><circle cx="12" cy="17" r="2.3" {...stroke} /><path d="M7.6 8.8 10.6 15M16.4 8.8 13.4 15M8.2 7h7.6" {...stroke} /></svg>
    ),
  },
];

export default function LogoStrip() {
  return (
    <section className={s.section} aria-label="Organizations that use Eventera">
      <div className={s.wrap}>
        <p className={s.kicker}>Trusted by teams running events across Africa &amp; the Gulf</p>
        <ul className={s.row}>
          {BRANDS.map((b) => (
            <li key={b.name} className={s.logo}>
              <span className={s.mark}>{b.mark}</span>
              <span className={s.word}>{b.name}</span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
