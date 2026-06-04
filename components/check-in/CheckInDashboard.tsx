'use client';

import { useState } from 'react';
import { ScanLine, Settings, Check, Users, Clock, Search } from 'lucide-react';
import { QRScanner } from './QRScanner';
import type { RecentCheckin } from '@/app/(app)/events/[id]/check-in/page';

interface Props {
  eventId:           string;
  eventName:         string;
  eventStatus:       string;
  totalRegistrations: number;
  initialCheckedIn:  number;
  recentCheckins:    RecentCheckin[];
}

function timeAgo(iso: string | null): string {
  if (!iso) return '';
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (diff < 60)  return 'just now';
  if (diff < 120) return '1 min ago';
  if (diff < 3600) return `${Math.floor(diff / 60)} min ago`;
  return new Date(iso).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
}

function getInitials(name: string | null): string {
  if (!name) return '?';
  return name.split(' ').map((p) => p[0]).join('').toUpperCase().slice(0, 2);
}

const AVATAR_GRADS = [
  'linear-gradient(135deg,#1F4D3A,#2A6A50)',
  'linear-gradient(135deg,#2A6A50,#C9A45E)',
  'linear-gradient(135deg,#163828,#3E7E5E)',
  'linear-gradient(135deg,#1F4D3A,#2A6A50)',
  'linear-gradient(135deg,#2A6A50,#1F4D3A)',
];

export default function CheckInDashboard({
  eventId, eventName, eventStatus, totalRegistrations, initialCheckedIn, recentCheckins,
}: Props) {
  const [scannerOpen, setScannerOpen] = useState(false);
  const [checkedIn, setCheckedIn] = useState(initialCheckedIn);

  const pct = totalRegistrations > 0 ? Math.round((checkedIn / totalRegistrations) * 100) : 0;
  const isLive = eventStatus === 'published';

  if (scannerOpen) {
    return (
      <QRScanner
        eventId={eventId}
        eventName={eventName}
        totalRegistrations={totalRegistrations}
        initialCheckedIn={checkedIn}
        onCheckedIn={() => setCheckedIn((n) => n + 1)}
        onClose={() => setScannerOpen(false)}
      />
    );
  }

  return (
    <div className="min-h-full" style={{ background: '#FAF6EE' }}>
      <div className="max-w-[1100px] mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">

        {/* Page header */}
        <div className="flex items-start justify-between mb-6 gap-4 flex-wrap">
          <div>
            <h1 className="font-display text-[24px] font-semibold tracking-[-0.015em]" style={{ color: '#0F1F18' }}>Check-in</h1>
            <p className="text-[14px] mt-0.5 flex items-center gap-1.5" style={{ color: '#6B7A72' }}>
              {isLive && <span className="w-1.5 h-1.5 rounded-full animate-pulse inline-block" style={{ background: '#2D7A4F' }} />}
              {isLive ? 'Live · ' : ''}{eventName}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-[13.5px] font-medium border transition hover:border-[#1F4D3A]/40 hover:text-[#1F4D3A]"
              style={{ borderColor: '#E5E0D4', color: '#6B7A72', background: 'white' }}>
              <Settings size={14} strokeWidth={1.8} /> Settings
            </button>
            <button
              onClick={() => setScannerOpen(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-[13.5px] font-medium text-white transition hover:bg-[#163828]"
              style={{ background: '#1F4D3A' }}>
              <ScanLine size={15} strokeWidth={2} /> Open scanner
            </button>
          </div>
        </div>

        <div className="grid lg:grid-cols-[1fr_1.1fr] gap-5">

          {/* ── Scanner panel ── */}
          <div className="rounded-2xl p-6 relative overflow-hidden" style={{ background: '#163828' }}>
            <div aria-hidden className="absolute inset-0"
              style={{ background: 'radial-gradient(70% 60% at 50% 0%, rgba(232,197,126,0.18), transparent 60%)' }} />
            <div className="relative">
              <div className="flex items-center justify-between mb-5">
                <span className="font-mono text-[10px] tracking-[0.18em] uppercase" style={{ color: 'rgba(250,246,238,0.6)' }}>QR Scanner</span>
                <span className="inline-flex items-center gap-1.5 text-[9.5px] font-mono tracking-[0.1em] uppercase px-2 py-0.5 rounded-full border text-emerald-300" style={{ borderColor: 'rgba(52,211,153,0.3)', background: 'rgba(52,211,153,0.1)' }}>
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> Ready
                </span>
              </div>

              {/* Scanner frame */}
              <div className="aspect-square rounded-2xl grid place-items-center relative overflow-hidden mb-5"
                style={{ border: '2px solid rgba(250,246,238,0.15)', background: 'rgba(31,77,58,0.4)' }}>
                {/* Corner frames */}
                {(['tl','tr','bl','br'] as const).map((c) => (
                  <span key={c} className="absolute w-10 h-10" style={{
                    top:    c.startsWith('t') ? 16 : 'auto',
                    bottom: c.startsWith('b') ? 16 : 'auto',
                    left:   c.endsWith('l')   ? 16 : 'auto',
                    right:  c.endsWith('r')   ? 16 : 'auto',
                    borderTop:    c.startsWith('t') ? '2px solid #E8C57E' : 'none',
                    borderBottom: c.startsWith('b') ? '2px solid #E8C57E' : 'none',
                    borderLeft:   c.endsWith('l')   ? '2px solid #E8C57E' : 'none',
                    borderRight:  c.endsWith('r')   ? '2px solid #E8C57E' : 'none',
                    borderRadius: c === 'tl' ? '4px 0 0 0' : c === 'tr' ? '0 4px 0 0' : c === 'bl' ? '0 0 0 4px' : '0 0 4px 0',
                  }} />
                ))}
                {/* Scan line */}
                <span className="absolute left-6 right-6 h-0.5 rounded-full animate-[scan-line_2s_ease-in-out_infinite]"
                  style={{ background: 'rgba(232,197,126,0.7)', boxShadow: '0 0 12px #E8C57E', top: '50%' }} />
                <ScanLine size={56} style={{ color: 'rgba(250,246,238,0.18)' }} />
              </div>

              {/* Search input mockup */}
              <button
                onClick={() => setScannerOpen(true)}
                className="w-full flex items-center gap-2.5 rounded-xl px-4 py-3 text-left transition"
                style={{ background: 'rgba(250,246,238,0.1)', border: '1px solid rgba(250,246,238,0.15)' }}
                onMouseEnter={e => (e.currentTarget.style.background = 'rgba(250,246,238,0.15)')}
                onMouseLeave={e => (e.currentTarget.style.background = 'rgba(250,246,238,0.1)')}
              >
                <Search size={15} style={{ color: 'rgba(250,246,238,0.4)' }} />
                <span className="text-[13px]" style={{ color: 'rgba(250,246,238,0.45)' }}>Tap to open scanner…</span>
              </button>
            </div>
          </div>

          {/* ── Stats + feed ── */}
          <div className="grid gap-5 content-start">
            {/* 3 stat cards */}
            <div className="grid grid-cols-3 gap-4">
              {[
                { label: 'Checked in', value: checkedIn.toString(), icon: <Check size={18} strokeWidth={2} /> },
                { label: `of ${totalRegistrations}`, value: `${pct}%`, icon: <Users size={18} strokeWidth={1.8} /> },
                { label: 'Per hour', value: '—', icon: <Clock size={18} strokeWidth={1.8} /> },
              ].map((s, i) => (
                <div key={i} className="bg-white border rounded-2xl p-4" style={{ borderColor: '#E5E0D4' }}>
                  <div className="w-8 h-8 rounded-lg grid place-items-center mb-3" style={{ background: '#E8EFEB', color: '#1F4D3A' }}>
                    {s.icon}
                  </div>
                  <div className="font-mono text-[20px] tracking-tight" style={{ color: '#1F4D3A' }}>{s.value}</div>
                  <div className="font-mono text-[10px] tracking-[0.1em] uppercase mt-0.5" style={{ color: '#6B7A72' }}>{s.label}</div>
                </div>
              ))}
            </div>

            {/* Progress bar */}
            <div className="bg-white border rounded-2xl px-5 py-4" style={{ borderColor: '#E5E0D4' }}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[13px]" style={{ color: '#3A4A42' }}>Arrivals progress</span>
                <span className="font-mono text-[12px]" style={{ color: '#1F4D3A' }}>{checkedIn} / {totalRegistrations}</span>
              </div>
              <div className="h-2.5 rounded-full overflow-hidden" style={{ background: '#E5E0D4' }}>
                <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, background: '#1F4D3A' }} />
              </div>
            </div>

            {/* Live check-in feed */}
            <div className="bg-white border rounded-2xl overflow-hidden" style={{ borderColor: '#E5E0D4' }}>
              <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: '1px solid #E5E0D4' }}>
                <span className="font-display text-[14px] font-semibold" style={{ color: '#0F1F18' }}>Live check-in feed</span>
                <span className="inline-flex items-center gap-1.5 text-[9.5px] font-mono tracking-[0.1em] uppercase px-2 py-0.5 rounded-full border text-emerald-700" style={{ borderColor: '#BBF7D0', background: '#ECFDF5' }}>
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> Live
                </span>
              </div>

              {recentCheckins.length === 0 ? (
                <div className="px-5 py-8 text-center">
                  <p className="text-[13px]" style={{ color: '#6B7A72' }}>No check-ins yet. Open the scanner to start.</p>
                </div>
              ) : (
                <div className="divide-y" style={{ borderColor: 'rgba(229,224,212,0.6)' }}>
                  {recentCheckins.map((entry, i) => (
                    <div key={entry.id} className="flex items-center gap-3 px-5 py-3">
                      <div className="w-8 h-8 rounded-full grid place-items-center text-[11px] font-bold text-white shrink-0"
                        style={{ background: AVATAR_GRADS[i % AVATAR_GRADS.length] }}>
                        {getInitials(entry.attendee_name)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="text-[13.5px] font-medium truncate" style={{ color: '#0F1F18' }}>
                          {entry.attendee_name ?? 'Unknown attendee'}
                        </div>
                        {entry.ticket_type && (
                          <div className="font-mono text-[11px]" style={{ color: '#6B7A72' }}>{entry.ticket_type}</div>
                        )}
                      </div>
                      <Check size={16} strokeWidth={2.2} style={{ color: '#2D7A4F' }} className="shrink-0" />
                      <span className="font-mono text-[11px] w-[68px] text-right shrink-0" style={{ color: '#6B7A72' }}>
                        {timeAgo(entry.checked_in_at)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes scan-line {
          0%   { transform: translateY(-120px); opacity: 0.6; }
          50%  { transform: translateY(120px); opacity: 1; }
          100% { transform: translateY(-120px); opacity: 0.6; }
        }
      `}</style>
    </div>
  );
}
