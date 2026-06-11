'use client';

import { useState } from 'react';
import { Bell, BarChart2, ExternalLink, Clock, Plus, CheckCircle2, X, Send } from 'lucide-react';

interface Props {
  eventId: string;
  eventName: string;
  registrantCount: number;
}

/* ── Compose modal ──────────────────────────────────────────────────────────── */
function ComposeModal({
  eventId, eventName, registrantCount, onClose,
}: {
  eventId: string;
  eventName: string;
  registrantCount: number;
  onClose: () => void;
}) {
  const [subject, setSubject]   = useState('');
  const [message, setMessage]   = useState('');
  const [sending, setSending]   = useState(false);
  const [sent, setSent]         = useState(false);
  const [error, setError]       = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  async function handleSend() {
    const errs: Record<string, string> = {};
    if (!subject.trim()) errs.subject = 'Subject is required';
    if (!message.trim()) errs.message = 'Message body is required';
    if (Object.keys(errs).length > 0) { setFieldErrors(errs); return; }

    setSending(true);
    setError('');
    try {
      const res = await fetch(`/api/events/${eventId}/communicate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subject: subject.trim(), message: message.trim() }),
      });
      const data = await res.json() as { sent?: number; error?: string };
      if (!res.ok) { setError(data.error ?? 'Failed to send'); return; }
      setSent(true);
    } catch {
      setError('Something went wrong. Check your connection and try again.');
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-2xl w-full max-w-[540px]" style={{ border: '1px solid #E5E0D4', boxShadow: '0 8px 40px rgba(15,31,24,0.18)' }}>
        <div className="flex items-center justify-between px-6 py-5" style={{ borderBottom: '1px solid #E5E0D4' }}>
          <div>
            <h3 className="font-display text-[16px] font-semibold" style={{ color: '#0F1F18' }}>New email</h3>
            <p className="text-[12.5px] mt-0.5" style={{ color: '#6B7A72' }}>
              Send to all confirmed attendees of {eventName}
            </p>
          </div>
          <button onClick={onClose} className="h-7 w-7 rounded-lg grid place-items-center hover:bg-[#F5F3EE]" style={{ color: '#6B7A72' }}>
            <X size={14} strokeWidth={2.2} />
          </button>
        </div>

        {sent ? (
          <div className="px-4 sm:px-6 py-10 text-center">
            <div className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4" style={{ background: '#E8EFEB' }}>
              <CheckCircle2 size={22} strokeWidth={2} style={{ color: '#1F4D3A' }} />
            </div>
            <h4 className="font-display text-[18px] font-semibold mb-1" style={{ color: '#0F1F18' }}>Email sent!</h4>
            <p className="text-[14px] mb-6" style={{ color: '#6B7A72' }}>
              Your message was delivered to {registrantCount} attendee{registrantCount !== 1 ? 's' : ''}.
            </p>
            <button onClick={onClose} className="px-6 py-2.5 rounded-xl text-[13px] font-medium text-white" style={{ background: '#1F4D3A' }}>
              Done
            </button>
          </div>
        ) : (
          <>
            <div className="px-4 sm:px-6 py-5 space-y-4">
              {error && (
                <div className="px-4 py-3 rounded-xl text-[13px] font-medium" style={{ background: '#FEF2F2', color: '#B8423C', border: '1px solid #FECACA' }}>
                  {error}
                </div>
              )}

              <div className="px-4 py-2.5 rounded-xl text-[12.5px] flex items-center gap-2" style={{ background: '#F5F7F5', border: '1px solid #E5E0D4' }}>
                <Bell size={13} strokeWidth={2} style={{ color: '#1F4D3A', flexShrink: 0 }} />
                <span style={{ color: '#3A4A42' }}>
                  To: <strong>{registrantCount} confirmed attendee{registrantCount !== 1 ? 's' : ''}</strong>
                </span>
              </div>

              <div>
                <label className="block text-[11px] font-mono uppercase tracking-widest mb-1.5" style={{ color: fieldErrors.subject ? '#B8423C' : '#6B7A72' }}>Subject *</label>
                <input
                  value={subject}
                  onChange={e => { setSubject(e.target.value); if (fieldErrors.subject) setFieldErrors(p => ({ ...p, subject: '' })); }}
                  placeholder="Important update about your registration"
                  autoFocus
                  className="w-full h-10 px-3 rounded-lg text-[14px] outline-none"
                  style={{ border: `1.5px solid ${fieldErrors.subject ? '#B8423C' : '#E5E0D4'}`, background: 'white', color: '#0F1F18' }}
                />
                {fieldErrors.subject && <p className="text-[12px] mt-1" style={{ color: '#B8423C' }}>{fieldErrors.subject}</p>}
              </div>

              <div>
                <label className="block text-[11px] font-mono uppercase tracking-widest mb-1.5" style={{ color: fieldErrors.message ? '#B8423C' : '#6B7A72' }}>Message *</label>
                <textarea
                  value={message}
                  onChange={e => { setMessage(e.target.value); if (fieldErrors.message) setFieldErrors(p => ({ ...p, message: '' })); }}
                  placeholder={`Hi [name],\n\nWe wanted to share an update about ${eventName}…`}
                  rows={7}
                  className="w-full px-3 py-2.5 rounded-lg text-[14px] outline-none resize-none leading-relaxed"
                  style={{ border: `1.5px solid ${fieldErrors.message ? '#B8423C' : '#E5E0D4'}`, background: 'white', color: '#0F1F18' }}
                />
                {fieldErrors.message && <p className="text-[12px] mt-1" style={{ color: '#B8423C' }}>{fieldErrors.message}</p>}
                <p className="text-[11.5px] mt-1" style={{ color: '#9BA8A1' }}>Plain text — line breaks are preserved in the email.</p>
              </div>
            </div>

            <div className="px-4 sm:px-6 pb-5 flex gap-3">
              <button onClick={onClose} className="flex-1 h-10 rounded-xl text-[13px] font-medium border transition" style={{ borderColor: '#E5E0D4', color: '#6B7A72' }}>
                Cancel
              </button>
              <button
                onClick={handleSend}
                disabled={sending || registrantCount === 0}
                className="flex-1 h-10 rounded-xl text-[13px] font-semibold text-white transition disabled:opacity-60 inline-flex items-center justify-center gap-1.5"
                style={{ background: '#1F4D3A' }}
              >
                {sending ? 'Sending…' : <><Send size={13} strokeWidth={2} /> Send to {registrantCount} attendee{registrantCount !== 1 ? 's' : ''}</>}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

/* ── Main view ──────────────────────────────────────────────────────────────── */
export function CommunicationsView({ eventId, eventName, registrantCount }: Props) {
  const [composeOpen, setComposeOpen] = useState(false);

  return (
    <div className="max-w-[1000px] mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
      {composeOpen && (
        <ComposeModal
          eventId={eventId}
          eventName={eventName}
          registrantCount={registrantCount}
          onClose={() => setComposeOpen(false)}
        />
      )}

      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-6 sm:mb-8 flex-wrap">
        <div>
          <h1 className="font-display font-semibold text-[22px]" style={{ color: '#0F1F18', letterSpacing: '-0.015em' }}>
            Communications
          </h1>
          <p className="text-[13px] mt-1" style={{ color: '#6B7A72' }}>
            Email your attendees and send updates
          </p>
        </div>
        <button
          onClick={() => setComposeOpen(true)}
          disabled={registrantCount === 0}
          className="inline-flex items-center gap-1.5 h-9 px-4 rounded-lg text-white text-[13px] font-semibold transition hover:opacity-90 disabled:opacity-50 shrink-0"
          style={{ background: '#1F4D3A' }}
        >
          <Plus size={14} strokeWidth={2.5} />
          New email
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <CommStat label="Attendees" value={registrantCount > 0 ? registrantCount.toString() : '—'} icon={<Bell size={15} strokeWidth={2} />} />
        <CommStat label="Avg. open rate" value="—" sub="no data yet" icon={<BarChart2 size={15} strokeWidth={2} />} />
        <CommStat label="Click rate" value="—" icon={<ExternalLink size={15} strokeWidth={2} />} />
        <CommStat label="Scheduled" value="1" icon={<Clock size={15} strokeWidth={2} />} accent />
      </div>

      {/* Automated campaigns panel */}
      <div className="rounded-2xl mb-4" style={{ border: '1px solid #E5E0D4', background: 'white' }}>
        <div className="flex items-center justify-between px-4 sm:px-5 py-4" style={{ borderBottom: '1px solid #E5E0D4' }}>
          <h2 className="text-[13px] font-semibold" style={{ color: '#0F1F18' }}>Automated campaigns</h2>
          <button
            onClick={() => setComposeOpen(true)}
            disabled={registrantCount === 0}
            className="inline-flex items-center gap-1 text-[12px] font-medium h-7 px-2.5 rounded-lg transition disabled:opacity-50"
            style={{ color: '#1F4D3A', background: 'rgba(31,77,58,0.06)' }}
          >
            <Plus size={12} strokeWidth={2.5} />
            Compose
          </button>
        </div>

        {/* Mobile card layout — shown below sm */}
        <div className="sm:hidden divide-y" style={{ borderColor: '#F5F0E8' }}>
          <CampaignCard
            subject="You're in! Here's everything you need"
            type="Confirmation"
            typeStyle={{ background: 'rgba(232,197,126,0.2)', color: '#9A7A3A' }}
            recipients={registrantCount > 0 ? registrantCount : null}
            status="Automated"
            statusStyle={{ background: 'rgba(31,77,58,0.08)', color: '#1F4D3A' }}
          />
          <CampaignCard
            subject="Your event is tomorrow"
            type="Reminder"
            typeStyle={{ background: '#F5F0E8', color: '#6B7A72' }}
            recipients={null}
            status="Scheduled"
            statusStyle={{ background: 'rgba(201,122,45,0.1)', color: '#C97A2D' }}
            statusSub="day before"
          />
        </div>

        {/* Desktop table — hidden on mobile */}
        <div className="hidden sm:block">
          {/* Table head */}
          <div
            className="grid px-5 py-2.5"
            style={{ gridTemplateColumns: '1fr 120px 100px 155px', borderBottom: '1px solid #E5E0D4', background: '#FAFAF8' }}
          >
            {['Subject', 'Type', 'Recipients', 'Status'].map(h => (
              <span key={h} className="text-[11px] font-medium" style={{ color: '#6B7A72', letterSpacing: '0.03em' }}>{h}</span>
            ))}
          </div>

          {/* Confirmation email row */}
          <div className="grid items-center px-5 py-3.5" style={{ gridTemplateColumns: '1fr 120px 100px 155px', borderBottom: '1px solid #F5F0E8' }}>
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="h-7 w-7 rounded-lg flex items-center justify-center shrink-0" style={{ background: 'rgba(31,77,58,0.08)' }}>
                <Bell size={13} strokeWidth={2} style={{ color: '#1F4D3A' }} />
              </div>
              <span className="text-[13px] truncate" style={{ color: '#0F1F18' }}>You&apos;re in! Here&apos;s everything you need</span>
            </div>
            <div><span className="inline-flex items-center h-5 px-2 rounded-full text-[11px] font-medium whitespace-nowrap" style={{ background: 'rgba(232,197,126,0.2)', color: '#9A7A3A' }}>Confirmation</span></div>
            <span className="text-[12.5px] font-mono" style={{ color: '#6B7A72' }}>
              {registrantCount > 0 ? registrantCount : '—'}
            </span>
            <div><span className="inline-flex items-center gap-1 h-5 px-2 rounded-full text-[11px] font-medium whitespace-nowrap" style={{ background: 'rgba(31,77,58,0.08)', color: '#1F4D3A' }}>
              Automated
            </span></div>
          </div>

          {/* Reminder row */}
          <div className="grid items-center px-5 py-3.5" style={{ gridTemplateColumns: '1fr 120px 100px 155px' }}>
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="h-7 w-7 rounded-lg flex items-center justify-center shrink-0" style={{ background: 'rgba(31,77,58,0.08)' }}>
                <Bell size={13} strokeWidth={2} style={{ color: '#1F4D3A' }} />
              </div>
              <span className="text-[13px] truncate" style={{ color: '#0F1F18' }}>Your event is tomorrow</span>
            </div>
            <div><span className="inline-flex items-center h-5 px-2 rounded-full text-[11px] font-medium whitespace-nowrap" style={{ background: '#F5F0E8', color: '#6B7A72' }}>Reminder</span></div>
            <span className="text-[12.5px] font-mono" style={{ color: '#6B7A72' }}>—</span>
            <div><span className="inline-flex items-center gap-1 h-5 px-2 rounded-full text-[11px] font-medium whitespace-nowrap" style={{ background: 'rgba(201,122,45,0.1)', color: '#C97A2D' }}>
              Scheduled · day before
            </span></div>
          </div>
        </div>

        {registrantCount === 0 && (
          <div className="px-5 py-6 text-center" style={{ borderTop: '1px solid #E5E0D4' }}>
            <p className="text-[13px]" style={{ color: '#6B7A72' }}>
              No registrants yet. Emails will go out automatically once attendees register.
            </p>
          </div>
        )}
      </div>

      {/* Info note */}
      <div className="flex items-start gap-2.5 px-4 py-3 rounded-xl text-[12.5px]" style={{ background: '#F5F7F5', border: '1px solid #E5E0D4' }}>
        <CheckCircle2 size={14} strokeWidth={2} style={{ color: '#1F4D3A', flexShrink: 0, marginTop: 1 }} />
        <span style={{ color: '#3A4A42' }}>
          Confirmation and reminder emails are sent automatically.
          Use <strong>Compose</strong> to send a custom update to all confirmed attendees.
        </span>
      </div>
    </div>
  );
}

/* ── Helpers ── */
/* ── Mobile campaign card ─────────────────────────────────────────────────── */
function CampaignCard({ subject, type, typeStyle, recipients, status, statusStyle, statusSub }: {
  subject: string;
  type: string;
  typeStyle: React.CSSProperties;
  recipients: number | null;
  status: string;
  statusStyle: React.CSSProperties;
  statusSub?: string;
}) {
  return (
    <div className="px-4 py-3.5">
      <div className="flex items-start gap-2.5 mb-2.5">
        <div className="h-7 w-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5" style={{ background: 'rgba(31,77,58,0.08)' }}>
          <Bell size={13} strokeWidth={2} style={{ color: '#1F4D3A' }} />
        </div>
        <span className="text-[13px] font-medium leading-snug" style={{ color: '#0F1F18' }}>{subject}</span>
      </div>
      <div className="flex items-center gap-2 flex-wrap pl-9">
        <span className="inline-flex items-center h-5 px-2 rounded-full text-[11px] font-medium" style={typeStyle}>{type}</span>
        {recipients !== null && (
          <span className="text-[12px] font-mono" style={{ color: '#6B7A72' }}>{recipients} recipients</span>
        )}
        <span className="inline-flex items-center gap-1 h-5 px-2 rounded-full text-[11px] font-medium" style={statusStyle}>
          {status}{statusSub && <span className="opacity-70">· {statusSub}</span>}
        </span>
      </div>
    </div>
  );
}

function CommStat({ label, value, sub, icon, accent }: {
  label: string; value: string; sub?: string; icon: React.ReactNode; accent?: boolean;
}) {
  return (
    <div className="rounded-2xl p-4" style={{ background: accent ? 'rgba(31,77,58,0.06)' : 'white', border: accent ? '1px solid rgba(31,77,58,0.2)' : '1px solid #E5E0D4' }}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-[11px] font-medium" style={{ color: '#6B7A72' }}>{label}</span>
        <span style={{ color: accent ? '#1F4D3A' : '#6B7A72' }}>{icon}</span>
      </div>
      <p className="text-[22px] font-bold" style={{ color: accent ? '#1F4D3A' : '#0F1F18' }}>{value}</p>
      {sub && <p className="text-[11px] mt-0.5" style={{ color: '#6B7A72' }}>{sub}</p>}
    </div>
  );
}
