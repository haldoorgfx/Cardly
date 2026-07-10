'use client';

// D2.7 — Mobile fallback screen (viewport < 768px)
// Shows a cream-background nudge to open the editor on desktop.
// Does NOT recreate the editor on phone.

import React, { useState } from 'react';
import { Monitor, Copy, Eye, Smartphone } from 'lucide-react';

interface MobileFallbackProps {
  eventId: string;
  eventName: string;
  variantSlug?: string;
}

export default function MobileFallback({ eventId, eventName, variantSlug }: MobileFallbackProps) {
  const [copied, setCopied] = useState(false);

  const editUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/events/${eventId}/edit`
    : `/events/${eventId}/edit`;

  const attendeeSlug = variantSlug ?? '';
  const attendeeUrl = attendeeSlug
    ? `/c/${attendeeSlug}`
    : `/events/${eventId}`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(editUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback: do nothing
    }
  };

  return (
    <div
      className="relative min-h-screen overflow-hidden"
      style={{ background: '#FAF6EE', fontFamily: 'Inter, sans-serif', color: '#0F1F18' }}
    >
      {/* Decorative blobs */}
      <div style={{
        position: 'absolute', width: 280, height: 280,
        top: -80, right: -80,
        borderRadius: '50%',
        background: '#E8EFEB', opacity: 0.7, filter: 'blur(40px)',
        pointerEvents: 'none',
      }} />
      <div style={{
        position: 'absolute', width: 220, height: 220,
        bottom: -60, left: -80,
        borderRadius: '50%',
        background: 'rgba(232,197,126,0.35)', filter: 'blur(40px)',
        pointerEvents: 'none',
      }} />

      {/* Header */}
      <div
        className="relative flex items-center justify-between"
        style={{ padding: '20px 20px 0', zIndex: 1 }}
      >
        <a href="/dashboard" className="flex items-center gap-2">
          <div style={{
            width: 24, height: 24, borderRadius: 6,
            background: '#1F4D3A', color: '#E8C57E',
            fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: 700, fontSize: 11,
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
          }}>cl</div>
          <span style={{
            fontFamily: 'Inter, system-ui, sans-serif', fontSize: 11,
            color: '#6B7A72', letterSpacing: '0.06em',
          }}>eventera</span>
        </a>
        <span style={{
          fontFamily: 'Inter, system-ui, sans-serif', fontSize: 10,
          color: '#6B7A72', letterSpacing: '0.1em', textTransform: 'uppercase', fontWeight: 600,
        }}>Editor</span>
      </div>

      {/* Center content */}
      <div
        className="relative flex flex-col items-center justify-center"
        style={{ minHeight: 'calc(100vh - 60px)', padding: '24px 20px', zIndex: 1 }}
      >
        <div style={{
          width: '100%', maxWidth: 360,
          background: '#FFFFFF',
          border: '1px solid #E5E0D4',
          borderRadius: 18,
          padding: '28px 24px 22px',
          boxShadow: '0 1px 2px rgba(15,31,24,0.04), 0 12px 32px rgba(15,31,24,0.08)',
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 18,
        }}>

          {/* Mono label */}
          <div style={{
            fontFamily: 'Inter, system-ui, sans-serif', fontSize: 10,
            color: '#6B7A72', letterSpacing: '0.1em',
            textTransform: 'uppercase', fontWeight: 600,
          }}>Editor · Desktop required</div>

          {/* Icon */}
          <div style={{
            position: 'relative',
            width: 92, height: 92, borderRadius: '50%',
            background: '#E8EFEB',
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            color: '#1F4D3A',
          }}>
            <Monitor size={42} strokeWidth={1.6} />
            {/* Phone "no" overlay */}
            <div style={{
              position: 'absolute',
              bottom: -4, right: -4,
              width: 30, height: 30, borderRadius: '50%',
              background: '#FFFFFF',
              border: '2px solid #FAF6EE',
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              color: '#B8423C',
              boxShadow: '0 2px 6px rgba(15,31,24,0.15)',
            }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="6" y="3" width="12" height="18" rx="2"/>
                <line x1="4" y1="4" x2="20" y2="20"/>
              </svg>
            </div>
          </div>

          {/* Headline */}
          <div style={{ textAlign: 'center' }}>
            <h1 style={{
              fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: 700,
              fontSize: 26, lineHeight: 1.15, letterSpacing: '-0.025em',
              margin: 0, color: '#0F1F18',
            }}>The editor works best on a laptop</h1>
            <p style={{
              fontFamily: 'Inter, sans-serif', fontSize: 14, lineHeight: 1.55,
              color: '#3A4A42', margin: '10px 0 0',
            }}>The canvas needs a larger screen to position zones precisely. Open this link on a laptop or tablet to keep editing.</p>
          </div>

          {/* Event meta chip */}
          <div style={{
            width: '100%',
            display: 'flex', alignItems: 'center', gap: 10,
            padding: '10px 12px',
            background: '#FAF6EE',
            border: '1px solid #E5E0D4',
            borderRadius: 10,
          }}>
            <div style={{
              width: 28, height: 28, borderRadius: '50%',
              background: '#1F4D3A', color: '#E8C57E',
              fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: 700, fontSize: 11,
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0,
            }}>
              {(eventName?.[0] ?? 'E').toUpperCase()}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{
                fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: 600, fontSize: 13,
                color: '#0F1F18', lineHeight: 1.2,
                whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
              }}>{eventName}</div>
              <div style={{
                fontFamily: 'Inter, system-ui, sans-serif', fontSize: 10,
                color: '#6B7A72', letterSpacing: '0.04em', marginTop: 2,
              }}>{(process.env.NEXT_PUBLIC_APP_URL ?? '').replace(/^https?:\/\//, '')}/events/{eventId.slice(0, 8)}</div>
            </div>
          </div>

          {/* CTAs */}
          <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 8 }}>
            <button
              onClick={handleCopy}
              style={{
                width: '100%', height: 50,
                background: '#1F4D3A', color: '#FAF6EE',
                border: 'none', borderRadius: 12,
                fontFamily: 'Inter, sans-serif', fontWeight: 600, fontSize: 15,
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                cursor: 'pointer',
                boxShadow: '0 1px 2px rgba(15,31,24,0.04), 0 8px 24px rgba(31,77,58,0.18)',
                transition: 'opacity 0.15s',
              }}
            >
              <Copy size={16} strokeWidth={2} />
              <span>{copied ? 'Copied!' : 'Copy editor link'}</span>
            </button>
            <a
              href={attendeeUrl}
              style={{
                width: '100%', height: 46,
                background: '#FFFFFF', color: '#0F1F18',
                border: '1.5px solid #E5E0D4', borderRadius: 12,
                fontFamily: 'Inter, sans-serif', fontWeight: 600, fontSize: 14,
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                textDecoration: 'none',
              }}
            >
              <Eye size={15} strokeWidth={1.8} />
              <span>View as attendee</span>
            </a>
          </div>

          {/* Pill */}
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            padding: '6px 10px',
            background: '#E8EFEB',
            borderRadius: 999,
            fontFamily: 'Inter, system-ui, sans-serif', fontSize: 10,
            color: '#1F4D3A', letterSpacing: '0.04em',
          }}>
            <Smartphone size={12} strokeWidth={1.8} />
            <span>Editing on phone · coming later</span>
          </div>
        </div>

        {/* Powered by */}
        <div style={{
          marginTop: 20,
          fontFamily: 'Inter, system-ui, sans-serif', fontSize: 11,
          color: '#6B7A72', letterSpacing: '0.04em',
        }}>
          powered by <span style={{ color: '#0F1F18', fontWeight: 500 }}>eventera</span>
        </div>
      </div>
    </div>
  );
}
