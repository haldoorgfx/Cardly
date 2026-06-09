'use client';

import { Download } from 'lucide-react';

interface Props {
  eventName: string;
  attendeeName?: string;
  outputUrl: string;
  createdAt: string;
}

export default function CardRedownload({ eventName, attendeeName, outputUrl, createdAt }: Props) {
  const handleDownload = () => {
    const a = document.createElement('a');
    a.href     = outputUrl;
    a.download = `${eventName.toLowerCase().replace(/\s+/g, '-')}-card.png`;
    a.click();
  };

  const date = new Date(createdAt).toLocaleDateString(undefined, {
    year: 'numeric', month: 'long', day: 'numeric',
  });

  return (
    <div style={{
      minHeight: '100vh', background: '#FAF6EE',
      fontFamily: 'Inter, sans-serif', color: '#0F1F18',
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center', padding: '40px 20px',
    }}>
      <div style={{ width: '100%', maxWidth: 440, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 24 }}>

        {/* Header */}
        <div style={{ textAlign: 'center' }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            padding: '6px 14px', background: '#E8EFEB', borderRadius: 999,
            fontFamily: 'Inter, system-ui, sans-serif', fontSize: 11,
            letterSpacing: '0.08em', textTransform: 'uppercase', color: '#1F4D3A',
            marginBottom: 16,
          }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#1F4D3A' }} />
            Your card · saved
          </div>
          <h1 style={{
            fontFamily: 'DM Sans, sans-serif', fontWeight: 700,
            fontSize: 32, lineHeight: 1.1, letterSpacing: '-0.03em',
            margin: '0 0 8px',
          }}>
            {attendeeName ? `${attendeeName}'s card` : 'Your event card'}
          </h1>
          <p style={{ margin: 0, fontSize: 14, color: '#6B7A72' }}>
            {eventName} · Generated {date}
          </p>
        </div>

        {/* Card image */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={outputUrl}
          alt={`${attendeeName ?? 'Your'} personalized card for ${eventName}`}
          style={{
            width: '100%', maxWidth: 340,
            borderRadius: 16,
            boxShadow: '0 4px 12px rgba(15,31,24,0.08), 0 24px 60px rgba(31,77,58,0.14)',
          }}
        />

        {/* Download */}
        <button
          onClick={handleDownload}
          style={{
            width: '100%', maxWidth: 340, height: 56,
            background: '#1F4D3A', color: '#FAF6EE',
            border: 'none', borderRadius: 14,
            fontFamily: 'Inter, sans-serif', fontWeight: 600, fontSize: 16,
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 10,
            cursor: 'pointer',
            boxShadow: '0 1px 2px rgba(15,31,24,0.04), 0 12px 32px rgba(31,77,58,0.22)',
          }}
        >
          <Download size={18} strokeWidth={2.2} /> Download PNG
        </button>

        <p style={{ fontSize: 12, color: '#6B7A72', textAlign: 'center', margin: 0 }}>
          Powered by <a href="https://karta.cre8so.com" style={{ color: '#1F4D3A', textDecoration: 'none', fontWeight: 600 }}>Karta</a>
        </p>
      </div>
    </div>
  );
}
