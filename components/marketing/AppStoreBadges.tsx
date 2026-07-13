import Link from 'next/link';
import { IOS_APP_URL, ANDROID_APP_URL } from '@/lib/appLinks';

/* Official-style store badges, recolored to the brand system.
   onDark → light badges for dark forest surfaces; otherwise ink badges. */
export function AppStoreBadges({
  onDark = false,
  size = 'md',
}: {
  onDark?: boolean;
  size?: 'sm' | 'md';
}) {
  const bg = onDark ? '#FAF6EE' : '#0F1F18';
  const fg = onDark ? '#0F1F18' : '#FAF6EE';
  const sub = onDark ? 'rgba(15,31,24,0.62)' : 'rgba(250,246,238,0.72)';
  const h = size === 'sm' ? 44 : 52;
  const bigSize = size === 'sm' ? 15 : 17;
  const smallSize = size === 'sm' ? 9.5 : 10.5;

  const base = {
    height: h,
    background: bg,
    color: fg,
    borderRadius: 12,
    padding: '0 16px 0 14px',
  } as const;

  return (
    <div className="flex flex-wrap items-center gap-3">
      {/* App Store */}
      <Link
        href={IOS_APP_URL}
        aria-label="Download Eventera on the App Store"
        className="inline-flex items-center gap-2.5 transition hover:opacity-90"
        style={base}
      >
        <svg width={size === 'sm' ? 19 : 22} height={size === 'sm' ? 19 : 22} viewBox="0 0 24 24" fill={fg} aria-hidden>
          <path d="M17.05 12.54c-.02-2.05 1.68-3.03 1.75-3.08-.95-1.4-2.44-1.59-2.97-1.61-1.26-.13-2.47.74-3.11.74-.64 0-1.63-.72-2.68-.7-1.38.02-2.65.8-3.36 2.03-1.43 2.49-.37 6.17 1.03 8.19.68.99 1.5 2.1 2.56 2.06 1.03-.04 1.42-.66 2.67-.66 1.24 0 1.6.66 2.68.64 1.11-.02 1.81-1 2.49-2 .78-1.15 1.11-2.26 1.13-2.32-.02-.01-2.17-.83-2.19-3.3zM15.01 6.32c.57-.69.95-1.65.85-2.6-.82.03-1.81.54-2.39 1.23-.52.61-.98 1.58-.86 2.51.91.07 1.84-.46 2.4-1.14z" />
        </svg>
        <span className="flex flex-col leading-none text-left">
          <span style={{ fontSize: smallSize, color: sub, fontFamily: 'Inter, sans-serif', letterSpacing: '0.02em' }}>Download on the</span>
          <span style={{ fontSize: bigSize, fontFamily: 'var(--theme-font-display, "Plus Jakarta Sans"), sans-serif', fontWeight: 700, letterSpacing: '-0.02em', marginTop: 2 }}>App Store</span>
        </span>
      </Link>

      {/* Google Play */}
      <Link
        href={ANDROID_APP_URL}
        aria-label="Get Eventera on Google Play"
        className="inline-flex items-center gap-2.5 transition hover:opacity-90"
        style={base}
      >
        <svg width={size === 'sm' ? 18 : 21} height={size === 'sm' ? 18 : 21} viewBox="0 0 24 24" fill="none" aria-hidden>
          <path d="M3.6 2.3c-.25.26-.4.66-.4 1.18v17.04c0 .52.15.92.4 1.18l.06.05L13.2 12.1v-.2L3.66 2.25l-.06.05z" fill={fg} opacity="0.9" />
          <path d="M16.4 15.3l-3.2-3.2v-.2l3.2-3.2.07.04 3.79 2.15c1.08.61 1.08 1.62 0 2.24l-3.79 2.15-.07.04z" fill={fg} />
          <path d="M16.47 15.26L13.2 12 3.6 21.7c.36.37.94.42 1.6.05l11.27-6.49z" fill={fg} opacity="0.7" />
          <path d="M16.47 8.74L5.2 2.25c-.66-.38-1.24-.32-1.6.05L13.2 12l3.27-3.26z" fill={fg} opacity="0.5" />
        </svg>
        <span className="flex flex-col leading-none text-left">
          <span style={{ fontSize: smallSize, color: sub, fontFamily: 'Inter, sans-serif', letterSpacing: '0.06em', textTransform: 'uppercase' }}>Get it on</span>
          <span style={{ fontSize: bigSize, fontFamily: 'var(--theme-font-display, "Plus Jakarta Sans"), sans-serif', fontWeight: 700, letterSpacing: '-0.02em', marginTop: 2 }}>Google Play</span>
        </span>
      </Link>
    </div>
  );
}
