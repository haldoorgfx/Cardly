import { ImageResponse } from 'next/og';

// Apple touch icon (add-to-homescreen on iOS). Next.js serves this at
// /apple-icon and injects the <link rel="apple-touch-icon"> automatically.
export const runtime = 'edge';
export const size = { width: 180, height: 180 };
export const contentType = 'image/png';

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #1F4D3A 0%, #2A6A50 60%, #E8C57E 100%)',
          color: '#FAF6EE',
          fontSize: 118,
          fontWeight: 700,
          fontFamily: 'sans-serif',
          letterSpacing: '-4px',
        }}
      >
        E
      </div>
    ),
    { ...size },
  );
}
