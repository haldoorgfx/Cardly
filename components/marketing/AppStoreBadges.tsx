import Link from 'next/link';
import { IOS_APP_URL, ANDROID_APP_URL } from '@/lib/appLinks';

/* Authentic-style App Store / Google Play badges: black pill, white Apple mark,
   the real 4-colour Google Play triangle, stacked caption + name. Recognisable
   everywhere (light or dark surfaces). Swap for the official store assets when
   the apps ship. The `onDark` prop is kept for call-site compatibility. */
export function AppStoreBadges({
  onDark = false, // eslint-disable-line @typescript-eslint/no-unused-vars
  size = 'md',
}: {
  onDark?: boolean;
  size?: 'sm' | 'md';
}) {
  const h = size === 'sm' ? 44 : 52;
  const bigSize = size === 'sm' ? 15 : 17;
  const smallSize = size === 'sm' ? 9.5 : 10.5;

  const base = {
    height: h,
    background: '#000',
    color: '#fff',
    border: '1px solid rgba(255,255,255,0.22)',
    borderRadius: 13,
    padding: '0 18px 0 15px',
  } as const;

  const sub = 'rgba(255,255,255,0.85)';

  return (
    <div className="flex flex-wrap items-center gap-3.5">
      {/* App Store */}
      <Link
        href={IOS_APP_URL}
        aria-label="Download Eventera on the App Store"
        className="inline-flex items-center gap-3 transition-transform hover:-translate-y-0.5"
        style={base}
      >
        <svg width={size === 'sm' ? 22 : 26} height={size === 'sm' ? 22 : 26} viewBox="0 0 24 24" fill="#fff" aria-hidden>
          <path d="M17.05 12.53c-.02-2.02 1.65-2.99 1.72-3.04-.94-1.37-2.4-1.56-2.92-1.58-1.24-.13-2.43.73-3.06.73-.63 0-1.6-.71-2.64-.69-1.36.02-2.61.79-3.31 2-1.41 2.44-.36 6.06 1.01 8.04.67.97 1.47 2.06 2.51 2.02 1.01-.04 1.39-.65 2.61-.65 1.22 0 1.56.65 2.63.63 1.09-.02 1.78-.99 2.44-1.96.77-1.12 1.09-2.21 1.11-2.27-.02-.01-2.13-.82-2.15-3.24zM15.03 6.6c.56-.68.94-1.62.83-2.56-.81.03-1.79.54-2.37 1.21-.52.6-.97 1.56-.85 2.48.9.07 1.83-.46 2.39-1.13z" />
        </svg>
        <span className="flex flex-col leading-none text-left">
          <span style={{ display: 'block', whiteSpace: 'nowrap', fontSize: smallSize, color: sub, fontFamily: 'Inter, sans-serif', letterSpacing: '0.01em' }}>Download on the</span>
          <span style={{ display: 'block', whiteSpace: 'nowrap', fontSize: bigSize, fontFamily: 'var(--theme-font-display, "Plus Jakarta Sans"), sans-serif', fontWeight: 600, letterSpacing: '-0.01em', marginTop: 2 }}>App Store</span>
        </span>
      </Link>

      {/* Google Play */}
      <Link
        href={ANDROID_APP_URL}
        aria-label="Get Eventera on Google Play"
        className="inline-flex items-center gap-3 transition-transform hover:-translate-y-0.5"
        style={base}
      >
        <svg width={size === 'sm' ? 22 : 26} height={size === 'sm' ? 22 : 26} viewBox="0 0 24 24" aria-hidden>
          <path fill="#00C3FF" d="M3.5 2.3 13.4 12 3.5 21.7c-.31-.2-.5-.55-.5-.99V3.29c0-.44.19-.79.5-.99z" />
          <path fill="#FF3D44" d="M3.5 2.3c.34-.22.77-.23 1.15-.02l11.3 6.42-3.05 3.05z" />
          <path fill="#00E676" d="M3.5 21.7c.34.22.77.23 1.15.02l11.3-6.42-3.05-3.05z" />
          <path fill="#FFCE00" d="M15.95 8.7l3.85 2.19c.9.51.9 1.71 0 2.22l-3.85 2.19L12.9 12z" />
        </svg>
        <span className="flex flex-col leading-none text-left">
          <span style={{ display: 'block', whiteSpace: 'nowrap', fontSize: smallSize, color: sub, fontFamily: 'Inter, sans-serif', letterSpacing: '0.06em', textTransform: 'uppercase' }}>Get it on</span>
          <span style={{ display: 'block', whiteSpace: 'nowrap', fontSize: bigSize, fontFamily: 'var(--theme-font-display, "Plus Jakarta Sans"), sans-serif', fontWeight: 600, letterSpacing: '-0.01em', marginTop: 2 }}>Google Play</span>
        </span>
      </Link>
    </div>
  );
}
