'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import QRCode from 'qrcode';
import { ChevronLeft, Check, Download } from 'lucide-react';
import CardPreviewClient from '../CardPreviewClient';
import type { Zone } from '@/types/database';

interface Props {
  eventId: string;
  eventName: string;
  shareUrl: string;
  slug: string;
  zonesCount: number;
  backgroundUrl: string;
  zones: Zone[];
  bgW: number;
  bgH: number;
}

export default function PublishClient({ eventId, eventName, shareUrl, zonesCount, backgroundUrl, zones, bgW, bgH }: Props) {
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
    <div className="min-h-screen bg-[#F5F5F5] flex flex-col">
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
      <header className="bg-white border-b border-neutral-200">
        <div className="max-w-[1200px] mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href={`/events/${eventId}`} className="h-8 w-8 rounded-md border border-neutral-200 hover:bg-neutral-50 grid place-items-center text-neutral-500 transition">
              <ChevronLeft size={16} strokeWidth={2} />
            </Link>
            <span className="text-[12px] text-neutral-500 hover:text-neutral-700">
              <Link href={`/events/${eventId}`}>{eventName}</Link>
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" /> Published
            </span>
            <Link href="/dashboard" className="h-8 px-3 border border-neutral-200 bg-white text-[13px] rounded-md hover:bg-neutral-50 transition inline-flex items-center">Dashboard</Link>
          </div>
        </div>
      </header>

      <main className="flex-1 px-4 sm:px-6 py-8 sm:py-12 max-w-[900px] mx-auto w-full">
        {/* Success header */}
        <div className="text-center mb-10">
          <div className="inline-flex h-12 w-12 rounded-full items-center justify-center bg-[#1F4D3A] text-white mb-4">
            <Check size={22} strokeWidth={2.5} />
          </div>
          <h1 className="text-xl font-semibold">
            {eventName} is live!
          </h1>
          <p className="text-[14px] text-neutral-500 mt-1">{zonesCount} zones defined · Ready for attendees</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Link share */}
          <div className="bg-white rounded-lg border border-neutral-200 p-5">
            <div className="text-xs font-medium text-neutral-500 uppercase tracking-wide mb-4">Share Link</div>
            <div className="font-mono text-[13px] text-neutral-600 bg-neutral-50 border border-neutral-200 rounded-md px-3 py-2 mb-3 truncate">
              {shareUrl}
            </div>
            <button
              onClick={handleCopy}
              className="w-full h-8 px-3 border border-neutral-200 bg-white text-[13px] rounded-md hover:bg-neutral-50 transition mb-3 flex items-center justify-center gap-2"
            >
              {copied ? (
                <>
                  <Check size={13} strokeWidth={2.5} />
                  Copied!
                </>
              ) : 'Copy link'}
            </button>
            <div className="grid grid-cols-2 gap-2">
              <a
                href={`https://wa.me/?text=${encodeURIComponent(`Get your personalized card for ${eventName}: ${shareUrl}`)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="h-8 rounded-md text-[13px] font-medium text-white text-center flex items-center justify-center"
                style={{ background: '#25D366' }}
              >
                WhatsApp
              </a>
              <a
                href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(`Get your personalized card: ${shareUrl}`)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="h-8 rounded-md text-[13px] font-medium text-white text-center bg-black flex items-center justify-center"
              >
                X / Twitter
              </a>
            </div>
          </div>

          {/* QR code */}
          <div className="bg-white rounded-lg border border-neutral-200 p-5">
            <div className="text-xs font-medium text-neutral-500 uppercase tracking-wide mb-4">QR Code</div>
            <div className="border border-neutral-200 rounded-lg p-4 flex justify-center mb-4">
              {qrDataUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={qrDataUrl} alt="QR code" width={140} height={140} className="rounded-md" />
              ) : (
                <div className="h-[140px] w-[140px] rounded-md bg-neutral-100 animate-pulse" />
              )}
            </div>
            <button
              onClick={handleDownloadQR}
              disabled={!qrDataUrl}
              className="w-full h-8 px-3 border border-neutral-200 bg-white text-[13px] rounded-md hover:bg-neutral-50 transition flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <Download size={13} strokeWidth={1.8} />
              Download QR
            </button>
          </div>

          {/* Embed snippet */}
          <div className="md:col-span-2 bg-white rounded-lg border border-neutral-200 p-5">
            <div className="text-xs font-medium text-neutral-500 uppercase tracking-wide mb-3">Embed in Your Site</div>
            <div className="bg-neutral-50 border border-neutral-200 rounded-md px-3 py-3 font-mono text-[12px] text-neutral-600 overflow-x-auto">
              {embedCode}
            </div>
          </div>

          {/* Preview card */}
          {backgroundUrl && (
            <div className="bg-white rounded-lg border border-neutral-200 p-5">
              <div className="text-xs font-medium text-neutral-500 uppercase tracking-wide mb-4">Preview</div>
              <div className="rounded-md overflow-hidden border border-neutral-200">
                <CardPreviewClient
                  backgroundUrl={backgroundUrl}
                  bgW={bgW}
                  bgH={bgH}
                  zones={zones}
                  eventName={eventName}
                  maxHeight={220}
                />
              </div>
            </div>
          )}

          {/* Next steps */}
          <div className="bg-white rounded-lg border border-neutral-200 p-5">
            <div className="text-xs font-medium text-neutral-500 uppercase tracking-wide mb-4">What Happens Next</div>
            <div className="space-y-3">
              {[
                'Attendees open the link on their phone',
                'They fill in their name and upload a photo',
                'They get a personalized PNG to share',
              ].map((step, i) => (
                <div key={i} className="flex items-start gap-3">
                  <span className="h-5 w-5 rounded-full bg-neutral-100 text-neutral-500 text-[11px] font-medium grid place-items-center shrink-0 mt-0.5">{i + 1}</span>
                  <span className="text-[13px] text-neutral-600">{step}</span>
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
