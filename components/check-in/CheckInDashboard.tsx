'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { ScanLine, Check, Users, Clock, Search, X, CheckCircle2, Smartphone, QrCode } from 'lucide-react';
import { QRScanner } from './QRScanner';
import type { RecentCheckin } from '@/app/(app)/events/[id]/check-in/page';

interface DashboardSearchResult {
  id: string;
  attendee_name: string | null;
  attendee_email: string | null;
  attendee_phone: string | null;
  status: string;
  checked_in_at: string | null;
  qr_code_token: string;
  amount_paid: number;
  currency: string;
  ticket_types: { name: string; price: number } | null;
}

interface FeedEntry {
  id: string;
  attendee_name: string | null;
  ticket_type: string | null;
  checked_in_at: string | null;
}

interface Props {
  eventId:            string;
  eventName:          string;
  eventStatus:        string;
  totalRegistrations: number;
  initialCheckedIn:   number;
  recentCheckins:     RecentCheckin[];
}

const AVATAR_GRADS = [
  'linear-gradient(135deg,#1F4D3A,#2A6A50)',
  'linear-gradient(135deg,#2A6A50,#C9A45E)',
  'linear-gradient(135deg,#163828,#3E7E5E)',
  'linear-gradient(135deg,#1F4D3A,#2A6A50)',
  'linear-gradient(135deg,#2A6A50,#1F4D3A)',
];

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
  return name.split(' ').map(p => p[0]).join('').toUpperCase().slice(0, 2);
}

function fmt(amount: number, currency: string): string {
  if (!amount) return 'Free';
  try { return new Intl.NumberFormat('en-US', { style: 'currency', currency, minimumFractionDigits: 0 }).format(amount); }
  catch { return `${currency} ${amount}`; }
}

/* ── Phone scanner modal ───────────────────────────────────────────────────── */
function PhoneScannerModal({ eventId, onClose }: { eventId: string; onClose: () => void }) {
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const scannerUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/events/${eventId}/check-in`
    : '';

  useEffect(() => {
    if (!scannerUrl) return;
    import('qrcode').then(QRCode =>
      QRCode.toDataURL(scannerUrl, { width: 280, margin: 2, color: { dark: '#0F1F18', light: '#FFFFFF' } })
    ).then(setQrDataUrl).catch(() => {});
  }, [scannerUrl]);

  function copyLink() {
    navigator.clipboard.writeText(scannerUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(10,15,12,0.72)', backdropFilter: 'blur(4px)' }}>
      <div className="w-full max-w-[380px] rounded-2xl bg-white overflow-hidden animate-dropIn"
        style={{ border: '1px solid #E5E0D4', boxShadow: '0 20px 60px rgba(15,31,24,0.32)' }}>

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: '1px solid #E5E0D4' }}>
          <div className="flex items-center gap-2">
            <Smartphone size={16} strokeWidth={1.8} style={{ color: '#1F4D3A' }} />
            <span className="font-display text-[15px] font-semibold" style={{ color: '#0F1F18' }}>Scan with phone</span>
          </div>
          <button onClick={onClose} className="h-7 w-7 rounded-lg grid place-items-center hover:bg-[#F5F3EE]"
            style={{ color: '#6B7A72' }}>
            <X size={14} />
          </button>
        </div>

        <div className="px-6 py-5">
          {/* Instructions */}
          <p className="text-[13px] mb-4 leading-relaxed" style={{ color: '#3A4A42' }}>
            Open this on your phone to use the camera as a QR scanner. Check-ins appear on this dashboard within seconds.
          </p>

          {/* Steps */}
          <div className="space-y-2 mb-5">
            {[
              'Point your phone camera at the QR code below',
              'Open the link — you\'ll go straight to the scanner',
              'Scan attendee badges — check-ins update here live',
            ].map((step, i) => (
              <div key={i} className="flex items-start gap-3">
                <span className="w-5 h-5 rounded-full grid place-items-center text-[11px] font-mono font-bold shrink-0 mt-0.5"
                  style={{ background: '#E8EFEB', color: '#1F4D3A' }}>{i + 1}</span>
                <span className="text-[13px]" style={{ color: '#3A4A42' }}>{step}</span>
              </div>
            ))}
          </div>

          {/* QR code */}
          <div className="rounded-2xl p-5 flex flex-col items-center gap-3 mb-4"
            style={{ background: '#F5F3EE', border: '1px solid #E5E0D4' }}>
            {qrDataUrl ? (
              <img src={qrDataUrl} alt="Scanner QR code" width={200} height={200} className="rounded-xl" />
            ) : (
              <div className="w-[200px] h-[200px] rounded-xl grid place-items-center" style={{ background: '#E5E0D4' }}>
                <QrCode size={40} style={{ color: '#9BA8A1' }} />
              </div>
            )}
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: '#2D7A4F' }} />
              <span className="font-mono text-[10px] tracking-[0.1em] uppercase" style={{ color: '#6B7A72' }}>Updates live</span>
            </div>
          </div>

          {/* Copy link fallback */}
          <button
            onClick={copyLink}
            className="w-full h-10 rounded-xl text-[13px] font-medium border transition flex items-center justify-center gap-2"
            style={{ borderColor: '#E5E0D4', color: copied ? '#2D7A4F' : '#3A4A42', background: copied ? '#ECFDF5' : 'white' }}>
            {copied ? '✓ Link copied!' : 'Copy link instead'}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Confirm check-in modal ────────────────────────────────────────────────── */
function AttendeeModal({ reg, eventId, onClose, onCheckedIn }: {
  reg: DashboardSearchResult;
  eventId: string;
  onClose: () => void;
  onCheckedIn: (id: string) => void;
}) {
  const [status, setStatus] = useState<'idle' | 'loading' | 'done' | 'error'>('idle');
  const isAlreadyIn = reg.status === 'checked_in' || status === 'done';

  async function doCheckIn() {
    setStatus('loading');
    try {
      const res  = await fetch(`/api/events/${eventId}/checkin`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ qr_code_token: reg.qr_code_token }),
      });
      const data = await res.json() as { result: string };
      if (data.result === 'success' || data.result === 'already_checked_in') {
        setStatus('done');
        onCheckedIn(reg.id);
      } else {
        setStatus('error');
      }
    } catch {
      setStatus('error');
    }
  }

  const checkedInTime = isAlreadyIn && reg.checked_in_at
    ? new Date(reg.checked_in_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
    : null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
      style={{ background: 'rgba(10,15,12,0.72)', backdropFilter: 'blur(4px)' }}>
      <div className="w-full max-w-[400px] rounded-2xl bg-white overflow-hidden animate-dropIn"
        style={{ border: '1px solid #E5E0D4', boxShadow: '0 20px 60px rgba(15,31,24,0.32)' }}>

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: '1px solid #E5E0D4' }}>
          <span className="font-display text-[15px] font-semibold" style={{ color: '#0F1F18' }}>
            {status === 'done' ? '✓ Checked in!' : isAlreadyIn ? 'Already checked in' : 'Confirm check-in'}
          </span>
          <button onClick={onClose} className="h-7 w-7 rounded-lg grid place-items-center hover:bg-[#F5F3EE]"
            style={{ color: '#6B7A72' }}>
            <X size={14} />
          </button>
        </div>

        <div className="px-6 py-5">
          {/* Avatar + name */}
          <div className="flex items-center gap-4 mb-5">
            <div className="w-12 h-12 rounded-full grid place-items-center text-[15px] font-bold text-white shrink-0"
              style={{ background: 'linear-gradient(135deg,#1F4D3A,#2A6A50)' }}>
              {getInitials(reg.attendee_name)}
            </div>
            <div>
              <div className="font-display text-[19px] font-semibold leading-snug" style={{ color: '#0F1F18' }}>
                {reg.attendee_name ?? 'Unknown attendee'}
              </div>
              <div className="text-[13px] mt-0.5" style={{ color: '#6B7A72' }}>{reg.attendee_email}</div>
            </div>
          </div>

          {/* Details */}
          <div className="rounded-xl p-4 mb-4 space-y-2.5" style={{ background: '#F5F3EE' }}>
            {reg.ticket_types && (
              <Row label="Ticket" value={reg.ticket_types.name} />
            )}
            {(reg.amount_paid ?? 0) > 0 && (
              <Row label="Amount paid" value={fmt(reg.amount_paid, reg.currency)} mono />
            )}
            {reg.attendee_phone && (
              <Row label="Phone" value={reg.attendee_phone} />
            )}
            <Row label="Badge ID" value={reg.qr_code_token.slice(0, 8).toUpperCase()} mono muted />
            <div className="flex items-center justify-between">
              <span className="text-[13px]" style={{ color: '#6B7A72' }}>Status</span>
              <span className={`text-[11px] font-mono uppercase px-2 py-0.5 rounded-full ${
                isAlreadyIn ? 'bg-emerald-50 text-emerald-700' :
                reg.status === 'pending' ? 'bg-amber-50 text-amber-700' : 'bg-[#E8EFEB] text-[#1F4D3A]'
              }`}>
                {isAlreadyIn ? 'checked in' : reg.status}
              </span>
            </div>
            {checkedInTime && (
              <Row label="Check-in time" value={checkedInTime} mono />
            )}
          </div>

          {/* Error */}
          {status === 'error' && (
            <div className="px-4 py-3 rounded-xl text-[13px] mb-3"
              style={{ background: '#FEF2F2', color: '#B8423C', border: '1px solid #FECACA' }}>
              Something went wrong. Try again.
            </div>
          )}

          {/* Action */}
          {isAlreadyIn ? (
            <div className="flex items-center justify-center gap-2 h-11 rounded-xl text-[14px] font-medium"
              style={{ background: '#ECFDF5', color: '#065F46' }}>
              <CheckCircle2 size={16} strokeWidth={2} />
              {status === 'done' ? 'Successfully checked in!' : `Already in${checkedInTime ? ` at ${checkedInTime}` : ''}`}
            </div>
          ) : (
            <button
              onClick={doCheckIn}
              disabled={status === 'loading'}
              className="w-full h-11 rounded-xl font-semibold text-[14px] text-white flex items-center justify-center gap-2 transition hover:opacity-90 disabled:opacity-60"
              style={{ background: '#1F4D3A' }}
            >
              {status === 'loading' ? 'Checking in…' : <><Check size={16} strokeWidth={2.5} /> Confirm check-in</>}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function Row({ label, value, mono, muted }: { label: string; value: string; mono?: boolean; muted?: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-[13px]" style={{ color: '#6B7A72' }}>{label}</span>
      <span className={mono ? 'font-mono text-[12px]' : 'text-[13px] font-medium'}
        style={{ color: muted ? '#9BA8A1' : '#0F1F18' }}>
        {value}
      </span>
    </div>
  );
}

/* ── Main dashboard ─────────────────────────────────────────────────────────── */
export default function CheckInDashboard({
  eventId, eventName, eventStatus, totalRegistrations, initialCheckedIn, recentCheckins,
}: Props) {
  const [scannerOpen, setScannerOpen]         = useState(false);
  const [phoneModalOpen, setPhoneModalOpen]   = useState(false);
  const [checkedIn, setCheckedIn]             = useState(initialCheckedIn);
  const [perHour, setPerHour]                 = useState(0);
  const [feed, setFeed]                       = useState<FeedEntry[]>(
    recentCheckins.map(r => ({ id: r.id, attendee_name: r.attendee_name, ticket_type: r.ticket_type, checked_in_at: r.checked_in_at }))
  );
  const [searchQuery, setSearchQuery]         = useState('');
  const [searchResults, setSearchResults]     = useState<DashboardSearchResult[]>([]);
  const [searching, setSearching]             = useState(false);
  const [selectedReg, setSelectedReg]         = useState<DashboardSearchResult | null>(null);
  const searchTimeout                         = useRef<ReturnType<typeof setTimeout> | null>(null);

  const pct    = totalRegistrations > 0 ? Math.round((checkedIn / totalRegistrations) * 100) : 0;
  const isLive = eventStatus === 'published';

  /* Live feed polling every 5s */
  const refreshFeed = useCallback(async () => {
    try {
      const res  = await fetch(`/api/events/${eventId}/checkin?feed=1`);
      const data = await res.json() as { feed: FeedEntry[]; totalCheckedIn: number; perHour: number };
      setFeed(data.feed ?? []);
      setCheckedIn(data.totalCheckedIn ?? 0);
      setPerHour(data.perHour ?? 0);
    } catch {}
  }, [eventId]);

  useEffect(() => {
    refreshFeed();
    const id = setInterval(refreshFeed, 5_000);
    return () => clearInterval(id);
  }, [refreshFeed]);

  /* Debounced search */
  useEffect(() => {
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    if (!searchQuery || searchQuery.length < 2) {
      setSearchResults([]);
      setSearching(false);
      return;
    }
    setSearching(true);
    searchTimeout.current = setTimeout(async () => {
      try {
        const res  = await fetch(`/api/events/${eventId}/checkin?q=${encodeURIComponent(searchQuery)}`);
        const data = await res.json() as { results: DashboardSearchResult[] };
        setSearchResults(data.results ?? []);
      } catch {
        setSearchResults([]);
      } finally {
        setSearching(false);
      }
    }, 280);
  }, [searchQuery, eventId]);

  function handleCheckedIn(id: string) {
    const now = new Date().toISOString();
    setCheckedIn(c => c + 1);
    setPerHour(c => c + 1);
    setSearchResults(prev => prev.map(r => r.id === id ? { ...r, status: 'checked_in', checked_in_at: now } : r));
    if (selectedReg?.id === id) setSelectedReg(prev => prev ? { ...prev, status: 'checked_in', checked_in_at: now } : null);
    setTimeout(refreshFeed, 800);
  }

  if (scannerOpen) {
    return (
      <QRScanner
        eventId={eventId}
        eventName={eventName}
        totalRegistrations={totalRegistrations}
        initialCheckedIn={checkedIn}
        onCheckedIn={() => { setCheckedIn(n => n + 1); setTimeout(refreshFeed, 800); }}
        onClose={() => { setScannerOpen(false); refreshFeed(); }}
      />
    );
  }

  const hasSearch = searchQuery.length >= 2;

  return (
    <div className="min-h-full" style={{ background: '#FAF6EE' }}>
      {selectedReg && (
        <AttendeeModal
          reg={selectedReg}
          eventId={eventId}
          onClose={() => setSelectedReg(null)}
          onCheckedIn={handleCheckedIn}
        />
      )}
      {phoneModalOpen && (
        <PhoneScannerModal
          eventId={eventId}
          onClose={() => setPhoneModalOpen(false)}
        />
      )}

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
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => setPhoneModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-[13.5px] font-medium border transition hover:border-[#1F4D3A]/40 hover:text-[#1F4D3A]"
              style={{ borderColor: '#E5E0D4', color: '#6B7A72', background: 'white' }}>
              <Smartphone size={14} strokeWidth={1.8} /> Scan with phone
            </button>
            <button
              onClick={() => setScannerOpen(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-[13.5px] font-medium text-white transition hover:bg-[#163828]"
              style={{ background: '#1F4D3A' }}>
              <ScanLine size={15} strokeWidth={2} /> Open scanner
            </button>
          </div>
        </div>

        <div className="grid lg:grid-cols-[1fr_1.1fr] gap-5 items-start">

          {/* ── Left: scanner / search panel ── */}
          <div className="rounded-2xl overflow-hidden relative flex flex-col" style={{ background: '#163828', minHeight: 380 }}>
            <div aria-hidden className="absolute inset-0 pointer-events-none"
              style={{ background: 'radial-gradient(70% 50% at 50% 0%, rgba(232,197,126,0.16), transparent 60%)' }} />
            <div className="relative flex flex-col h-full flex-1">

              {/* Panel header */}
              <div className="flex items-center justify-between px-5 pt-5 pb-3 shrink-0">
                <span className="font-mono text-[10px] tracking-[0.18em] uppercase"
                  style={{ color: 'rgba(250,246,238,0.55)' }}>
                  {hasSearch ? 'Search results' : 'QR Scanner'}
                </span>
                {hasSearch ? (
                  <span className="font-mono text-[10px]" style={{ color: 'rgba(250,246,238,0.35)' }}>
                    {searching ? 'searching…' : `${searchResults.length} found`}
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 text-[9.5px] font-mono tracking-[0.1em] uppercase px-2 py-0.5 rounded-full border"
                    style={{ color: 'rgb(110,231,183)', borderColor: 'rgba(52,211,153,0.3)', background: 'rgba(52,211,153,0.1)' }}>
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> Ready
                  </span>
                )}
              </div>

              {/* Content: scanner frame OR results */}
              <div className="flex-1 overflow-y-auto px-5">
                {!hasSearch && (
                  <>
                    {/* Clickable scanner frame */}
                    <button
                      onClick={() => setScannerOpen(true)}
                      className="w-full aspect-square rounded-2xl grid place-items-center relative overflow-hidden mb-4 transition-opacity hover:opacity-90"
                      style={{ border: '2px solid rgba(250,246,238,0.14)', background: 'rgba(31,77,58,0.45)' }}>
                      {(['tl','tr','bl','br'] as const).map(c => (
                        <span key={c} className="absolute w-9 h-9" style={{
                          top:    c.startsWith('t') ? 14 : 'auto',
                          bottom: c.startsWith('b') ? 14 : 'auto',
                          left:   c.endsWith('l')   ? 14 : 'auto',
                          right:  c.endsWith('r')   ? 14 : 'auto',
                          borderTop:    c.startsWith('t') ? '2px solid #E8C57E' : 'none',
                          borderBottom: c.startsWith('b') ? '2px solid #E8C57E' : 'none',
                          borderLeft:   c.endsWith('l')   ? '2px solid #E8C57E' : 'none',
                          borderRight:  c.endsWith('r')   ? '2px solid #E8C57E' : 'none',
                          borderRadius: c === 'tl' ? '4px 0 0 0' : c === 'tr' ? '0 4px 0 0' : c === 'bl' ? '0 0 0 4px' : '0 0 4px 0',
                        }} />
                      ))}
                      <span className="absolute left-5 right-5 h-0.5 rounded-full animate-[scan-line_2s_ease-in-out_infinite]"
                        style={{ background: 'rgba(232,197,126,0.7)', boxShadow: '0 0 10px #E8C57E', top: '50%' }} />
                      <ScanLine size={52} style={{ color: 'rgba(250,246,238,0.16)' }} />
                      <span className="absolute bottom-4 text-[12px]" style={{ color: 'rgba(250,246,238,0.4)' }}>
                        Tap to open camera scanner
                      </span>
                    </button>

                    {/* Hint */}
                    <p className="text-center text-[12px] pb-3" style={{ color: 'rgba(250,246,238,0.3)' }}>
                      Or search below by name, email, phone, or badge ID
                    </p>
                  </>
                )}

                {hasSearch && (
                  <div className="space-y-2 py-1 pb-3">
                    {searching && (
                      <div className="flex items-center justify-center py-10">
                        <div className="w-5 h-5 border-2 rounded-full animate-spin"
                          style={{ borderColor: 'rgba(250,246,238,0.2)', borderTopColor: '#E8C57E' }} />
                      </div>
                    )}
                    {!searching && searchResults.length === 0 && (
                      <div className="text-center py-12 text-[14px]" style={{ color: 'rgba(250,246,238,0.35)' }}>
                        No attendees found for &ldquo;{searchQuery}&rdquo;
                      </div>
                    )}
                    {searchResults.map(reg => {
                      const isIn = reg.status === 'checked_in';
                      return (
                        <button
                          key={reg.id}
                          onClick={() => setSelectedReg(reg)}
                          className="w-full text-left flex items-center gap-3 rounded-xl px-4 py-3 transition-colors"
                          style={{
                            background: isIn ? 'rgba(45,122,79,0.2)' : 'rgba(250,246,238,0.07)',
                            border: `1px solid ${isIn ? 'rgba(45,122,79,0.35)' : 'rgba(250,246,238,0.1)'}`,
                          }}
                        >
                          <div className="w-9 h-9 rounded-full grid place-items-center text-[12px] font-bold shrink-0"
                            style={{
                              background: isIn ? 'rgba(45,122,79,0.45)' : 'rgba(31,77,58,0.7)',
                              color: isIn ? '#4ADE80' : 'white',
                            }}>
                            {isIn ? <Check size={14} strokeWidth={2.5} /> : getInitials(reg.attendee_name)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-[13.5px] font-medium text-white truncate">
                              {reg.attendee_name ?? 'Unknown'}
                            </div>
                            <div className="text-[11.5px] truncate" style={{ color: 'rgba(250,246,238,0.45)' }}>
                              {[reg.ticket_types?.name, reg.attendee_email].filter(Boolean).join(' · ')}
                            </div>
                          </div>
                          {isIn ? (
                            <span className="text-[10px] font-mono shrink-0" style={{ color: '#4ADE80' }}>✓ IN</span>
                          ) : (
                            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full shrink-0"
                              style={{ background: 'rgba(232,197,126,0.15)', color: '#E8C57E' }}>
                              CHECK IN
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Search input — always visible at bottom */}
              <div className="px-5 pb-5 pt-2 shrink-0">
                <div className="relative">
                  <Search size={13} className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
                    style={{ color: 'rgba(250,246,238,0.3)' }} />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    placeholder="Name, email, phone, or badge ID…"
                    className="w-full rounded-xl pl-9 pr-9 py-2.5 text-[13px] outline-none"
                    style={{
                      background: 'rgba(250,246,238,0.09)',
                      border: '1px solid rgba(250,246,238,0.14)',
                      color: 'rgba(250,246,238,0.9)',
                      caretColor: '#E8C57E',
                    }}
                  />
                  {searchQuery && (
                    <button
                      onClick={() => { setSearchQuery(''); setSearchResults([]); }}
                      className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full grid place-items-center"
                      style={{ background: 'rgba(250,246,238,0.15)', color: 'rgba(250,246,238,0.6)' }}>
                      <X size={10} strokeWidth={2.5} />
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* ── Right: stats + feed ── */}
          <div className="grid gap-4 content-start">

            {/* 3 stat cards */}
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: 'Checked in',            value: checkedIn.toString(), icon: <Check size={17} strokeWidth={2} /> },
                { label: `of ${totalRegistrations}`, value: `${pct}%`,          icon: <Users size={17} strokeWidth={1.8} /> },
                { label: 'Last hour',              value: perHour > 0 ? String(perHour) : '—', icon: <Clock size={17} strokeWidth={1.8} /> },
              ].map((s, i) => (
                <div key={i} className="bg-white border rounded-2xl p-4" style={{ borderColor: '#E5E0D4' }}>
                  <div className="w-8 h-8 rounded-lg grid place-items-center mb-3" style={{ background: '#E8EFEB', color: '#1F4D3A' }}>
                    {s.icon}
                  </div>
                  <div className="font-mono text-[22px] tracking-tight leading-none" style={{ color: '#1F4D3A' }}>{s.value}</div>
                  <div className="font-mono text-[10px] tracking-[0.1em] uppercase mt-1.5" style={{ color: '#6B7A72' }}>{s.label}</div>
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
                <span className="inline-flex items-center gap-1.5 text-[9.5px] font-mono tracking-[0.1em] uppercase px-2 py-0.5 rounded-full border"
                  style={{ color: '#065F46', borderColor: '#BBF7D0', background: '#ECFDF5' }}>
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> Live
                </span>
              </div>

              {feed.length === 0 ? (
                <div className="px-5 py-8 text-center">
                  <p className="text-[13px]" style={{ color: '#6B7A72' }}>No check-ins yet. Open the scanner to start.</p>
                </div>
              ) : (
                <div className="max-h-[320px] overflow-y-auto divide-y" style={{ borderColor: 'rgba(229,224,212,0.6)' }}>
                  {feed.map((entry, i) => (
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
                      <Check size={14} strokeWidth={2.5} style={{ color: '#2D7A4F' }} className="shrink-0" />
                      <span className="font-mono text-[11px] w-[60px] text-right shrink-0" style={{ color: '#9BA8A1' }}>
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
          0%   { transform: translateY(-100px); opacity: 0.5; }
          50%  { transform: translateY(100px);  opacity: 1;   }
          100% { transform: translateY(-100px); opacity: 0.5; }
        }
        @keyframes dropIn {
          from { opacity: 0; transform: translateY(12px) scale(0.98); }
          to   { opacity: 1; transform: translateY(0)    scale(1);    }
        }
        .animate-dropIn { animation: dropIn 0.18s ease-out; }
      `}</style>
    </div>
  );
}
