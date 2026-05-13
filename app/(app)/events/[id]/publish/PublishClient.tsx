'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import QRCode from 'qrcode';

interface Props {
  eventId: string;
  eventName: string;
  shareUrl: string;
  slug: string;
  zonesCount: number;
  backgroundUrl: string;
}

export default function PublishClient({ eventId, eventName, shareUrl, zonesCount, backgroundUrl }: Props) {
  const [copied, setCopied] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState('');
  const [confettiDone, setConfettiDone] = useState(false);

  useEffect(() => {
    QRCode.toDataURL(shareUrl, {
      width: 200,
      margin: 2,
      color: { dark: '#0F1F18', light: '#ffffff' },
    }).then(setQrDataUrl);
    const t = setTimeout(() => setConfettiDone(true), 3000);
    return () => clearTimeout(t);
  }, [shareUrl]);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadQR = () => {
    if (!qrDataUrl) return;
    const a = document.createElement('a');
    a.href = qrDataUrl;
    a.download = `cardly-qr-${eventName.toLowerCase().replace(/\s+/g, '-')}.png`;
    a.click();
  };

  const embedCode = `<iframe src="${shareUrl}" width="375" height="812" frameborder="0" allow="camera"></iframe>`;

  return (
    <div className="min-h-screen bg-[#FAF6EE] flex flex-col">
      {/* Confetti dots */}
      {!confettiDone && (
        <div className="fixed inset-0 pointer-events-none overflow-hidden z-50">
          {Array.from({ length: 40 }).map((_, i) => (
            <div
              key={i}
              className="absolute w-2 h-2 rounded-full opacity-0"
              style={{
                left: `${Math.random() * 100}%`,
                top: '-8px',
                background: ['#1F4D3A', '#E8C57E', '#ffd28a', '#7be0c0', '#ff6058'][i % 5],
                animation: `fall ${1.5 + Math.random() * 2}s ease-in ${Math.random() * 0.8}s forwards`,
              }}
            />
          ))}
        </div>
      )}

      {/* Header */}
      <header className="bg-white border-b border-[#E5E0D4]">
        <div className="max-w-[1200px] mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href={`/events/${eventId}`} className="h-9 w-9 rounded-lg hover:bg-[#FAF6EE] grid place-items-center text-[#0F1F18]/60">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m15 18-6-6 6-6" /></svg>
            </Link>
            <span className="h-7 w-7 rounded-lg grid place-items-center text-white font-display font-bold text-[14px]" style={{ background: '#1F4D3A' }}>C</span>
            <div className="font-display font-bold text-[16px]">{eventName}</div>
          </div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 text-[12px] font-medium text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-full">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" /> Published
            </span>
            <Link href="/dashboard" className="text-[13px] text-[#0F1F18]/60 hover:text-[#0F1F18] ml-2">Dashboard →</Link>
          </div>
        </div>
      </header>

      <main className="flex-1 px-6 py-12 max-w-[900px] mx-auto w-full">
        {/* Success header */}
        <div className="text-center mb-10">
          <div className="inline-flex h-20 w-20 rounded-full items-center justify-center text-white mb-5 shadow-lift" style={{ background: '#1F4D3A' }}>
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>
          <h1 className="font-display font-bold text-[40px] leading-tight">
            <span style={{ background: 'linear-gradient(135deg,#1F4D3A,#E8C57E)', WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent' }}>
              {eventName}
            </span>{' '}
            is live!
          </h1>
          <p className="text-[16px] text-[#0F1F18]/60 mt-2">{zonesCount} zones defined · Ready for attendees</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Link share */}
          <div className="bg-white rounded-2xl border border-[#E5E0D4] p-6 shadow-soft">
            <div className="text-[11px] font-mono tracking-widest text-[#0F1F18]/45 mb-4">SHARE LINK</div>
            <div className="flex items-center gap-2 bg-[#FAF6EE] rounded-xl border border-[#E5E0D4] px-3 py-3 mb-4">
              <span className="text-[12px] font-mono text-[#0F1F18]/70 flex-1 truncate">{shareUrl}</span>
            </div>
            <button
              onClick={handleCopy}
              className="w-full py-3 rounded-xl font-display font-semibold text-[15px] text-white hover:opacity-95 transition mb-3"
              style={{ background: '#1F4D3A' }}
            >
              {copied ? (
                <span className="inline-flex items-center justify-center gap-2">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
                  Copied!
                </span>
              ) : 'Copy link'}
            </button>
            <div className="grid grid-cols-2 gap-2">
              <a
                href={`https://wa.me/?text=${encodeURIComponent(`Get your personalized card for ${eventName}: ${shareUrl}`)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="py-2.5 rounded-xl text-[13px] font-medium text-white text-center"
                style={{ background: '#25D366' }}
              >
                WhatsApp
              </a>
              <a
                href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(`Get your personalized card: ${shareUrl}`)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="py-2.5 rounded-xl text-[13px] font-medium text-white text-center bg-black"
              >
                X / Twitter
              </a>
            </div>
          </div>

          {/* QR code */}
          <div className="bg-white rounded-2xl border border-[#E5E0D4] p-6 shadow-soft">
            <div className="text-[11px] font-mono tracking-widest text-[#0F1F18]/45 mb-4">QR CODE</div>
            <div className="flex justify-center mb-4">
              {qrDataUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={qrDataUrl} alt="QR code" width={160} height={160} className="rounded-xl border border-[#E5E0D4]" />
              ) : (
                <div className="h-40 w-40 rounded-xl bg-[#FAF6EE] border border-[#E5E0D4] animate-pulse" />
              )}
            </div>
            <button
              onClick={handleDownloadQR}
              disabled={!qrDataUrl}
              className="w-full py-2.5 rounded-xl text-[13px] font-medium text-[#0F1F18]/80 border border-[#E5E0D4] hover:bg-[#FAF6EE] transition flex items-center justify-center gap-2"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" />
              </svg>
              Download QR
            </button>
          </div>

          {/* Embed snippet */}
          <div className="md:col-span-2 bg-white rounded-2xl border border-[#E5E0D4] p-6 shadow-soft">
            <div className="text-[11px] font-mono tracking-widest text-[#0F1F18]/45 mb-3">EMBED IN YOUR SITE</div>
            <div className="bg-[#0F1F18] rounded-xl p-4 font-mono text-[12px] text-emerald-400 overflow-x-auto">
              {embedCode}
            </div>
          </div>

          {/* Preview card */}
          {backgroundUrl && (
            <div className="bg-white rounded-2xl border border-[#E5E0D4] p-6 shadow-soft flex flex-col items-center">
              <div className="text-[11px] font-mono tracking-widest text-[#0F1F18]/45 mb-4 self-start">PREVIEW</div>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={backgroundUrl} alt="Design preview" className="rounded-xl max-h-48 object-cover shadow-soft" />
            </div>
          )}

          {/* Next steps */}
          <div className="bg-white rounded-2xl border border-[#E5E0D4] p-6 shadow-soft">
            <div className="text-[11px] font-mono tracking-widest text-[#0F1F18]/45 mb-4">WHAT HAPPENS NEXT</div>
            <div className="space-y-3">
              {[
                'Attendees open the link on their phone',
                'They fill in their name and upload a photo',
                'They get a personalized PNG to share',
              ].map((step, i) => (
                <div key={i} className="flex items-start gap-3">
                  <span className="h-6 w-6 rounded-full bg-[#1F4D3A]/10 text-[#1F4D3A] text-[11px] font-mono font-semibold grid place-items-center shrink-0 mt-0.5">{i + 1}</span>
                  <span className="text-[13px] text-[#0F1F18]/70">{step}</span>
                </div>
              ))}
            </div>
            <Link
              href={`/events/${eventId}`}
              className="mt-5 block text-center text-[13px] text-[#1F4D3A] font-medium hover:underline"
            >
              View event analytics →
            </Link>
          </div>
        </div>
      </main>

      <style>{`
        @keyframes fall {
          0% { opacity: 1; transform: translateY(0) rotate(0deg); }
          100% { opacity: 0; transform: translateY(100vh) rotate(720deg); }
        }
      `}</style>
    </div>
  );
}
