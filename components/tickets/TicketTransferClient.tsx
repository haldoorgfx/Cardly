'use client';

import { useState } from 'react';
import { ArrowRight, Check } from 'lucide-react';
import Link from 'next/link';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Registration = any;

interface Props { registration: Registration; }

type Stage = 'form' | 'sent';

export function TicketTransferClient({ registration: reg }: Props) {
  const [stage, setStage] = useState<Stage>('form');
  const [recipientEmail, setRecipientEmail] = useState('');
  const [recipientName, setRecipientName] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const ep = (reg.events?.event_pages as any[])?.[0];
  const eventTitle = ep?.title ?? reg.events?.name ?? 'Event';
  const ticketName = reg.ticket_types?.name ?? 'Ticket';
  const ticketNum = reg.qr_code_token ?? reg.id.slice(-6).toUpperCase();

  async function send() {
    if (!recipientEmail.trim() || !recipientName.trim()) return;
    setSending(true);
    setError('');
    const res = await fetch(`/api/tickets/${reg.id}/transfer`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ recipientEmail: recipientEmail.trim(), recipientName: recipientName.trim() }),
    });
    if (res.ok) {
      setStage('sent');
    } else {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? 'Failed to send transfer. Please try again.');
    }
    setSending(false);
  }

  return (
    <div className="max-w-md mx-auto px-5 py-10">
      {/* Ticket card */}
      <div className="rounded-2xl overflow-hidden mb-8" style={{ border: '1px solid #E5E0D4', background: '#FFFFFF' }}>
        {ep?.cover_image_url && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={ep.cover_image_url} alt="" className="w-full h-28 object-cover" />
        )}
        <div className="p-5">
          <div className="text-[11px] font-semibold tracking-[0.1em] uppercase mb-1" style={{ color: '#6B7A72', fontFamily: 'Inter, system-ui, sans-serif' }}>
            {ticketName}
          </div>
          <div className="font-display font-semibold text-[18px] mb-1" style={{ color: '#0F1F18', letterSpacing: '-0.01em' }}>
            {eventTitle}
          </div>
          {ep?.starts_at && (
            <div className="text-[13px]" style={{ color: '#6B7A72' }}>
              {new Date(ep.starts_at).toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'long', year: 'numeric' })}
            </div>
          )}
          <div className="mt-3 text-[12px]" style={{ color: '#3A4A42' }}>#{ticketNum}</div>
        </div>
      </div>

      {stage === 'form' && (
        <>
          <div className="mb-6">
            <h1 className="font-display font-semibold text-[22px] mb-1" style={{ color: '#0F1F18', letterSpacing: '-0.02em' }}>
              Transfer ticket
            </h1>
            <p className="text-[14px]" style={{ color: '#6B7A72' }}>
              The recipient will receive a new QR code. Your current QR becomes invalid when they claim the ticket.
            </p>
          </div>

          <div className="space-y-4 mb-6">
            <div>
              <label htmlFor="recipient-name" className="block text-[12px] font-medium mb-1.5" style={{ color: '#3A4A42' }}>Recipient&apos;s name</label>
              <input
                id="recipient-name"
                value={recipientName}
                onChange={e => setRecipientName(e.target.value)}
                placeholder="Fatima Ali"
                className="w-full px-4 py-3 rounded-xl border text-[15px] outline-none focus-visible:ring-2 focus-visible:ring-[#1F4D3A]/30"
                style={{ borderColor: '#E5E0D4', color: '#0F1F18' }}
              />
            </div>
            <div>
              <label htmlFor="recipient-email" className="block text-[12px] font-medium mb-1.5" style={{ color: '#3A4A42' }}>Recipient&apos;s email</label>
              <input
                id="recipient-email"
                type="email"
                value={recipientEmail}
                onChange={e => setRecipientEmail(e.target.value)}
                placeholder="fatima@example.com"
                className="w-full px-4 py-3 rounded-xl border text-[15px] outline-none focus-visible:ring-2 focus-visible:ring-[#1F4D3A]/30"
                style={{ borderColor: '#E5E0D4', color: '#0F1F18' }}
              />
            </div>
          </div>

          {error && (
            <div className="mb-4 px-4 py-3 rounded-xl text-[13px]" style={{ background: 'rgba(184,66,60,0.06)', color: '#B8423C', border: '1px solid rgba(184,66,60,0.15)' }}>
              {error}
            </div>
          )}

          <div className="flex gap-3">
            <Link href="/my-tickets" className="flex-1 py-3 rounded-2xl text-[14px] font-semibold text-center border transition hover:opacity-80" style={{ borderColor: '#E5E0D4', color: '#3A4A42' }}>
              Cancel
            </Link>
            <button
              onClick={send}
              disabled={sending || !recipientEmail.trim() || !recipientName.trim()}
              className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl text-[14px] font-semibold transition hover:opacity-90 disabled:opacity-40"
              style={{ background: '#1F4D3A', color: '#FAF6EE' }}>
              {sending ? 'Sending…' : <><ArrowRight size={15} /> Send transfer</>}
            </button>
          </div>
        </>
      )}

      {stage === 'sent' && (
        <div className="text-center py-8">
          <div className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4" style={{ background: '#E8EFEB' }}>
            <Check size={24} style={{ color: '#1F4D3A' }} />
          </div>
          <h2 className="font-display font-semibold text-[20px] mb-2" style={{ color: '#0F1F18' }}>Ticket transferred</h2>
          <p className="text-[14px] mb-6" style={{ color: '#6B7A72' }}>
            We&apos;ve emailed <strong style={{ color: '#0F1F18' }}>{recipientEmail}</strong> their check-in QR. This ticket has been removed from your account.
          </p>
          <Link href="/my-tickets" className="inline-flex px-6 py-3 rounded-2xl text-[14px] font-semibold" style={{ background: '#1F4D3A', color: '#FAF6EE' }}>
            Back to my tickets
          </Link>
        </div>
      )}
    </div>
  );
}
