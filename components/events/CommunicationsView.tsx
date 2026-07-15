'use client';

import { useState } from 'react';
import { Bell, BarChart2, ExternalLink, Plus, CheckCircle2, Send, Copy, Check, X, Sparkles } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { ERAButton } from '@/components/ai/ERAButton';
import { PageShell, PageHeader } from '@/components/dash';

interface Props {
  eventId: string;
  eventName: string;
  registrantCount: number;
  plan?: 'free' | 'pro' | 'studio';
  eventDate?: string;
  eventVenue?: string;
  eventDescription?: string;
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
    <Modal
      open
      onClose={onClose}
      title="New email"
      subtitle={`Send to all confirmed attendees of ${eventName}`}
      maxWidth={540}
      footer={sent ? (
        <button onClick={onClose} className="h-10 px-5 rounded-lg text-[13px] font-semibold text-white" style={{ background: '#1F4D3A' }}>Done</button>
      ) : (
        <>
          <button onClick={onClose} className="h-10 px-4 rounded-lg text-[13px] font-medium border" style={{ borderColor: '#E5E0D4', color: '#6B7A72' }}>Cancel</button>
          <button
            onClick={handleSend}
            disabled={sending || registrantCount === 0}
            className="h-10 px-5 rounded-lg text-[13px] font-semibold text-white transition disabled:opacity-60 inline-flex items-center justify-center gap-1.5"
            style={{ background: '#1F4D3A' }}
          >
            {sending ? 'Sending…' : <><Send size={13} strokeWidth={2} /> Send to {registrantCount}</>}
          </button>
        </>
      )}
    >
        {sent ? (
          <div className="py-6 text-center">
            <div className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4" style={{ background: '#E8EFEB' }}>
              <CheckCircle2 size={22} strokeWidth={2} style={{ color: '#1F4D3A' }} />
            </div>
            <h4 className="font-display text-[18px] font-semibold mb-1" style={{ color: '#0F1F18' }}>Email sent!</h4>
            <p className="text-[14px]" style={{ color: '#6B7A72' }}>
              Your message was delivered to {registrantCount} attendee{registrantCount !== 1 ? 's' : ''}.
            </p>
          </div>
        ) : (
          <>
            <div className="space-y-4">
              {error && (
                <div className="px-4 py-3 rounded-xl text-[13px] font-medium" style={{ background: '#FEF2F2', color: '#B8423C', border: '1px solid #FECACA' }}>
                  {error}
                </div>
              )}

              <div className="px-4 py-2.5 rounded-xl text-[12.5px] flex items-center gap-2" style={{ background: '#F5F7F5', border: '1px solid #E5E0D4' }}>
                <Bell size={13} strokeWidth={2} style={{ color: '#6B7A72', flexShrink: 0 }} />
                <span style={{ color: '#3A4A42' }}>
                  To: <strong>{registrantCount} confirmed attendee{registrantCount !== 1 ? 's' : ''}</strong>
                </span>
              </div>

              <div>
                <label className="block text-[12.5px] uppercase tracking-widest mb-1.5" style={{ color: fieldErrors.subject ? '#B8423C' : '#6B7A72' }}>Subject *</label>
                <input
                  value={subject}
                  aria-invalid={!!fieldErrors.subject}
                  onChange={e => { setSubject(e.target.value); if (fieldErrors.subject) setFieldErrors(p => ({ ...p, subject: '' })); }}
                  placeholder="Important update about your registration"
                  autoFocus
                  className="w-full h-10 px-3 rounded-lg text-[14px] outline-none"
                  style={{ border: `1.5px solid ${fieldErrors.subject ? '#B8423C' : '#E5E0D4'}`, background: 'white', color: '#0F1F18' }}
                />
                {fieldErrors.subject && <p className="text-[12px] mt-1" style={{ color: '#B8423C' }}>{fieldErrors.subject}</p>}
              </div>

              <div>
                <label className="block text-[12.5px] uppercase tracking-widest mb-1.5" style={{ color: fieldErrors.message ? '#B8423C' : '#6B7A72' }}>Message *</label>
                <textarea
                  value={message}
                  aria-invalid={!!fieldErrors.message}
                  onChange={e => { setMessage(e.target.value); if (fieldErrors.message) setFieldErrors(p => ({ ...p, message: '' })); }}
                  placeholder={`Hi [name],\n\nWe wanted to share an update about ${eventName}…`}
                  rows={7}
                  className="w-full px-3 py-2.5 rounded-lg text-[14px] outline-none resize-none leading-relaxed"
                  style={{ border: `1.5px solid ${fieldErrors.message ? '#B8423C' : '#E5E0D4'}`, background: 'white', color: '#0F1F18' }}
                />
                {fieldErrors.message && <p className="text-[12px] mt-1" style={{ color: '#B8423C' }}>{fieldErrors.message}</p>}
                <p className="text-[13px] mt-1" style={{ color: '#9BA8A1' }}>Plain text — line breaks are preserved in the email.</p>
              </div>
            </div>
          </>
        )}
    </Modal>
  );
}

/* ── Campaign draft modal ───────────────────────────────────────────────────── */
function CampaignDraftModal({ draft, onClose }: { draft: string; onClose: () => void }) {
  const [copied, setCopied] = useState(false);

  function handleCopy() {
    navigator.clipboard.writeText(draft).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-2xl overflow-hidden w-full max-w-[520px]" style={{ border: '1px solid #E5E0D4', boxShadow: '0 8px 40px rgba(15,31,24,0.18)' }}>
        <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: '1px solid #E5E0D4' }}>
          <div>
            <div className="flex items-center gap-2 mb-0.5">
              <span className="inline-flex items-center gap-[3px] text-[12px] font-bold tracking-[0.07em] px-1.5 py-0.5 rounded-[5px] text-white" style={{ background: 'linear-gradient(135deg, #1F4D3A 0%, #2A6A50 100%)', boxShadow: '0 1px 4px rgba(31,77,58,0.3)' }}>
                <Sparkles size={8} strokeWidth={2.5} />ERA
              </span>
              <h3 className="font-display text-[15px] font-semibold" style={{ color: '#0F1F18' }}>Campaign draft</h3>
            </div>
            <p className="text-[12px]" style={{ color: '#6B7A72' }}>Copy and paste into your messaging tool</p>
          </div>
          <button onClick={onClose} className="h-7 w-7 rounded-lg grid place-items-center" style={{ color: '#6B7A72' }}>
            <X size={14} strokeWidth={2.2} />
          </button>
        </div>
        <div className="px-6 py-5">
          <pre className="text-[13px] whitespace-pre-wrap font-sans rounded-xl p-4" style={{ background: '#F5F9F6', border: '1px solid rgba(31,77,58,0.12)', color: '#0F1F18', lineHeight: 1.7 }}>{draft}</pre>
        </div>
        <div className="flex gap-2 px-6 pb-5">
          <button
            onClick={handleCopy}
            className="inline-flex items-center gap-1.5 h-9 px-4 rounded-lg text-[13px] font-semibold text-white transition hover:opacity-90"
            style={{ background: '#1F4D3A' }}
          >
            {copied ? <><Check size={13} strokeWidth={2} /> Copied!</> : <><Copy size={13} strokeWidth={2} /> Copy</>}
          </button>
          <button onClick={onClose} className="h-9 px-4 rounded-lg text-[13px] font-medium border" style={{ borderColor: '#E5E0D4', color: '#6B7A72' }}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Main view ──────────────────────────────────────────────────────────────── */
export function CommunicationsView({ eventId, eventName, registrantCount, plan = 'free', eventDate = '', eventVenue = '', eventDescription = '' }: Props) {
  const [composeOpen, setComposeOpen] = useState(false);
  const [campaignDraft, setCampaignDraft] = useState('');
  const [campaignType, setCampaignType] = useState<'email' | 'whatsapp'>('email');

  return (
    <PageShell width="wide">
      {composeOpen && (
        <ComposeModal
          eventId={eventId}
          eventName={eventName}
          registrantCount={registrantCount}
          onClose={() => setComposeOpen(false)}
        />
      )}
      {campaignDraft && (
        <CampaignDraftModal draft={campaignDraft} onClose={() => setCampaignDraft('')} />
      )}

      {/* Header */}
      <PageHeader
        title="Communications"
        subtitle="Email your attendees and send updates"
        actions={
          <button
            onClick={() => setComposeOpen(true)}
            disabled={registrantCount === 0}
            className="inline-flex items-center gap-1.5 h-9 px-4 rounded-lg text-white text-[13px] font-semibold transition hover:opacity-90 disabled:opacity-50 shrink-0"
            style={{ background: '#1F4D3A' }}
          >
            <Plus size={14} strokeWidth={2.5} />
            New email
          </button>
        }
      />

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
        <CommStat label="Attendees" value={registrantCount > 0 ? registrantCount.toString() : '—'} icon={<Bell size={15} strokeWidth={2} />} />
        <CommStat label="Avg. open rate" value="—" sub="no data yet" icon={<BarChart2 size={15} strokeWidth={2} />} />
        <CommStat label="Click rate" value="—" icon={<ExternalLink size={15} strokeWidth={2} />} />
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
        </div>

        {/* Desktop table — hidden on mobile */}
        <div className="hidden sm:block">
          {/* Table head */}
          <div
            className="grid px-5 py-2.5"
            style={{ gridTemplateColumns: '1fr 120px 100px 155px', borderBottom: '1px solid #E5E0D4', background: '#FAFAF8' }}
          >
            {['Subject', 'Type', 'Recipients', 'Status'].map(h => (
              <span key={h} className="text-[12.5px] font-medium" style={{ color: '#6B7A72', letterSpacing: '0.03em' }}>{h}</span>
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
            <div><span className="inline-flex items-center h-5 px-2 rounded-full text-[12.5px] font-medium whitespace-nowrap" style={{ background: 'rgba(232,197,126,0.2)', color: '#9A7A3A' }}>Confirmation</span></div>
            <span className="text-[12.5px]" style={{ color: '#6B7A72' }}>
              {registrantCount > 0 ? registrantCount : '—'}
            </span>
            <div><span className="inline-flex items-center gap-1 h-5 px-2 rounded-full text-[12.5px] font-medium whitespace-nowrap" style={{ background: 'rgba(31,77,58,0.08)', color: '#1F4D3A' }}>
              Automated
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

      {/* ERA Campaign Draft */}
      <div className="rounded-2xl mb-4 overflow-hidden" style={{ border: '1px solid rgba(31,77,58,0.18)', boxShadow: '0 1px 8px rgba(31,77,58,0.05)' }}>
        {/* ERA section header */}
        <div className="flex items-center gap-2.5 px-5 py-3" style={{ background: 'linear-gradient(135deg, #1F4D3A 0%, #2A6A50 100%)' }}>
          <Sparkles size={13} strokeWidth={2} color="white" style={{ opacity: 0.88 }} />
          <span className="text-[12.5px] font-bold tracking-[0.1em] uppercase" style={{ color: 'rgba(255,255,255,0.85)' }}>ERA · Campaign Draft</span>
        </div>
        <div className="p-5" style={{ background: 'white' }}>
        <div className="flex items-center justify-between mb-3">
          <div>
            <p className="text-[13px] font-medium" style={{ color: '#0F1F18' }}>Draft a message to promote this event</p>
            <p className="text-[12px] mt-0.5" style={{ color: '#6B7A72' }}>ERA will write an email or WhatsApp message ready to send</p>
          </div>
          <div className="flex items-center gap-1 rounded-lg p-0.5" style={{ background: '#F5F0E8', border: '1px solid #E5E0D4' }}>
            {(['email', 'whatsapp'] as const).map(t => (
              <button
                key={t}
                onClick={() => setCampaignType(t)}
                className="h-7 px-3 rounded-md text-[12px] font-medium transition"
                style={{
                  background: campaignType === t ? 'white' : 'transparent',
                  color: campaignType === t ? '#1F4D3A' : '#6B7A72',
                  boxShadow: campaignType === t ? '0 1px 3px rgba(15,31,24,0.08)' : 'none',
                }}
              >
                {t === 'email' ? 'Email' : 'WhatsApp'}
              </button>
            ))}
          </div>
        </div>
        <ERAButton
          label={'Draft ' + (campaignType === 'email' ? 'email' : 'WhatsApp message') + ' with ERA'}
          plan={plan}
          requiresStudio
          onFetch={async () => {
            const res = await fetch('/api/era/write-campaign', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                event: { name: eventName, date: eventDate, venue: eventVenue, description: eventDescription },
                type: campaignType,
              }),
            });
            const data = await res.json() as { result?: string; error?: string };
            if (!res.ok) throw new Error(data.error ?? 'ERA_FAILED');
            return data.result as string;
          }}
          onApply={(text) => setCampaignDraft(text)}
        />
        </div>
      </div>

      {/* Info note */}
      <div className="flex items-start gap-2.5 px-4 py-3 rounded-xl text-[12.5px]" style={{ background: '#F5F7F5', border: '1px solid #E5E0D4' }}>
        <CheckCircle2 size={14} strokeWidth={2} style={{ color: '#6B7A72', flexShrink: 0, marginTop: 1 }} />
        <span style={{ color: '#3A4A42' }}>
          Confirmation and reminder emails are sent automatically.
          Use <strong>Compose</strong> to send a custom update to all confirmed attendees.
        </span>
      </div>
    </PageShell>
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
        <span className="inline-flex items-center h-5 px-2 rounded-full text-[12.5px] font-medium" style={typeStyle}>{type}</span>
        {recipients !== null && (
          <span className="text-[12px]" style={{ color: '#6B7A72' }}>{recipients} recipients</span>
        )}
        <span className="inline-flex items-center gap-1 h-5 px-2 rounded-full text-[12.5px] font-medium" style={statusStyle}>
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
        <span className="text-[12.5px] font-medium" style={{ color: '#6B7A72' }}>{label}</span>
        <span style={{ color: accent ? '#1F4D3A' : '#6B7A72' }}>{icon}</span>
      </div>
      <p className="text-[22px] font-bold" style={{ color: '#0F1F18' }}>{value}</p>
      {sub && <p className="text-[12.5px] mt-0.5" style={{ color: '#6B7A72' }}>{sub}</p>}
    </div>
  );
}
