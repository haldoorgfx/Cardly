'use client';

import { useState, useTransition } from 'react';

interface Props {
  sponsorId: string;
  companyName: string;
}

/**
 * Lets a public booth-page visitor request a meeting with the exhibitor —
 * the missing web half of migration 060's meeting_requests table. Posts to
 * /api/sponsors/[sponsorId]/meetings (no login required), which lands in the
 * exhibitor's Meetings tab (components/exhibitor/MeetingsTab.tsx) for them to
 * accept, propose a new time, or decline.
 */
export function RequestMeetingButton({ sponsorId, companyName }: Props) {
  const [open, setOpen]         = useState(false);
  const [name, setName]         = useState('');
  const [email, setEmail]       = useState('');
  const [message, setMessage]   = useState('');
  const [error, setError]       = useState<string | null>(null);
  const [sent, setSent]         = useState(false);
  const [isPending, startTransition] = useTransition();

  function close() {
    setOpen(false);
    setError(null);
  }

  function handleSubmit() {
    if (!email.trim()) { setError('Enter your email so they can reply.'); return; }
    setError(null);
    startTransition(async () => {
      const res = await fetch(`/api/sponsors/${sponsorId}/meetings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requester_name: name.trim() || null,
          requester_email: email.trim(),
          message: message.trim() || null,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) { setError(data.error ?? 'Could not send request'); return; }
      setSent(true);
    });
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex items-center justify-center w-full py-3 rounded-xl font-medium text-[14px] transition-colors hover:bg-[#F0EBE3]"
        style={{ background: 'transparent', border: '1px solid #E5E0D4', color: '#0F1F18' }}
      >
        Request a meeting
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40" onClick={close} />
          <div className="relative bg-white rounded-2xl w-full max-w-[380px]" style={{ border: '1px solid #E5E0D4', boxShadow: '0 8px 40px rgba(15,31,24,0.18)' }}>
            <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: '1px solid #E5E0D4' }}>
              <div className="font-display text-[15px] font-semibold" style={{ color: '#0F1F18' }}>
                {sent ? 'Request sent' : 'Request a meeting'}
              </div>
              <button onClick={close} aria-label="Close" className="w-10 h-10 rounded-lg grid place-items-center hover:bg-[#F5F3EE]" style={{ color: '#65736B' }}>
                <svg width={14} height={14} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {sent ? (
              <div className="px-5 py-6">
                <p className="text-[13.5px] leading-relaxed" style={{ color: '#3A4A42' }}>
                  {companyName} will follow up at your booth request by email.
                </p>
                <button
                  onClick={close}
                  className="mt-4 w-full py-2.5 rounded-xl text-[13.5px] font-medium text-white"
                  style={{ background: '#1F4D3A' }}
                >
                  Done
                </button>
              </div>
            ) : (
              <>
                <div className="px-5 py-4 space-y-3">
                  <div className="text-[13px]" style={{ color: '#3A4A42' }}>
                    Send <b style={{ color: '#0F1F18' }}>{companyName}</b> a request to meet at their booth.
                  </div>
                  <input
                    type="text"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    aria-label="Your name"
                    placeholder="Your name (optional)"
                    className="w-full rounded-xl px-3 py-2.5 text-[13.5px] outline-none"
                    style={{ border: '1px solid #E5E0D4', background: '#FAF6EE', color: '#0F1F18' }}
                  />
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    aria-label="Your email"
                    placeholder="you@company.com"
                    className="w-full rounded-xl px-3 py-2.5 text-[13.5px] outline-none"
                    style={{ border: '1px solid #E5E0D4', background: '#FAF6EE', color: '#0F1F18' }}
                  />
                  <textarea
                    value={message}
                    onChange={e => setMessage(e.target.value)}
                    rows={3}
                    aria-label="Message"
                    placeholder="What would you like to discuss? (optional)"
                    className="w-full rounded-xl px-3 py-2.5 text-[13.5px] outline-none resize-none"
                    style={{ border: '1px solid #E5E0D4', background: '#FAF6EE', color: '#0F1F18' }}
                  />
                  {error && <div className="text-[12.5px]" style={{ color: '#B8423C' }}>{error}</div>}
                </div>
                <div className="px-5 pb-5 flex gap-2">
                  <button
                    onClick={close}
                    className="px-4 py-2.5 rounded-xl text-[13.5px] font-medium border"
                    style={{ borderColor: '#E5E0D4', color: '#65736B' }}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSubmit}
                    disabled={isPending}
                    className="flex-1 py-2.5 rounded-xl text-[13.5px] font-medium text-white transition"
                    style={{ background: '#1F4D3A', opacity: isPending ? 0.6 : 1 }}
                  >
                    {isPending ? 'Sending…' : 'Send request'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
