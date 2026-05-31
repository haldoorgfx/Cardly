import { ImageResponse } from 'next/og';

export const runtime = 'edge';

export async function GET() {
  return new ImageResponse(
    (
      <div
        style={{
          width: 1200, height: 630,
          background: 'linear-gradient(135deg, #1F4D3A 0%, #2A6A50 60%, #E8C57E 100%)',
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          fontFamily: 'sans-serif', padding: '60px 80px',
        }}
      >
        <div style={{ fontSize: 72, fontWeight: 700, color: '#FAF6EE', letterSpacing: '-2px', marginBottom: 24, display: 'flex' }}>
          Karta
        </div>
        <div style={{ fontSize: 28, color: 'rgba(250,246,238,0.75)', textAlign: 'center', maxWidth: 700, lineHeight: 1.4, display: 'flex' }}>
          Your design. Their personalization. One link.
        </div>
      </div>
    ),
    { width: 1200, height: 630 }
  );
}
