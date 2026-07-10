'use client';

import { useMemo, useState, useTransition } from 'react';
import { Mail, MessageCircle, Smartphone, Bell, Send, AlertTriangle, CheckCircle2, Users } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { CommsTabs } from '@/components/communications/CommsTabs';
import type { ChannelAvailability } from '@/lib/notifications/channels';
import type { AudienceSpec, DispatchResult } from '@/lib/notifications/broadcast';

const C = { ink: '#0F1F18', muted: '#6B7A72', border: '#E5E0D4', primary: '#1F4D3A', soft: '#E8EFEB', cream: '#FAF6EE', danger: '#B8423C', warning: '#C97A2D', success: '#2D7A4F' };

export interface TicketOption { id: string; name: string; count: number; }

type ChannelKey = 'email' | 'inapp' | 'whatsapp' | 'sms';
const CHANNEL_META: { key: ChannelKey; label: string; icon: React.ReactNode; rate: number }[] = [
  { key: 'email', label: 'Email', icon: <Mail size={15} strokeWidth={2} />, rate: 0 },
  { key: 'inapp', label: 'In-app', icon: <Bell size={15} strokeWidth={2} />, rate: 0 },
  { key: 'whatsapp', label: 'WhatsApp', icon: <MessageCircle size={15} strokeWidth={2} />, rate: 0.02 },
  { key: 'sms', label: 'SMS', icon: <Smartphone size={15} strokeWidth={2} />, rate: 0.03 },
];

interface Props {
  eventSlug: string;
  ticketOptions: TicketOption[];
  allCount: number;
  checkedInCount: number;
  availability: ChannelAvailability;
  sendBroadcast: (audience: AudienceSpec, channels: { email: boolean; inapp: boolean; whatsapp: boolean; sms: boolean }, body: string) => Promise<{ ok?: boolean; error?: string; results?: DispatchResult; recipientCount?: number }>;
}

export function BroadcastClient({ eventSlug, ticketOptions, allCount, checkedInCount, availability, sendBroadcast }: Props) {
  const [audKind, setAudKind] = useState<'all' | 'checked_in' | 'ticket_type'>('all');
  const [ticketId, setTicketId] = useState<string>(ticketOptions[0]?.id ?? '');
  const [channels, setChannels] = useState({ email: availability.email.available, inapp: true, whatsapp: false, sms: false });
  const [body, setBody] = useState('');
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pending, start] = useTransition();
  const [error, setError] = useState('');
  const [result, setResult] = useState<{ results: DispatchResult; recipientCount: number } | null>(null);

  const recipientCount = useMemo(() => {
    if (audKind === 'all') return allCount;
    if (audKind === 'checked_in') return checkedInCount;
    return ticketOptions.find((t) => t.id === ticketId)?.count ?? 0;
  }, [audKind, ticketId, allCount, checkedInCount, ticketOptions]);

  const anyChannel = channels.email || channels.inapp || channels.whatsapp || channels.sms;
  const estCost = useMemo(() => CHANNEL_META.reduce((sum, c) => sum + (channels[c.key] && availability[c.key].available ? c.rate * recipientCount : 0), 0), [channels, availability, recipientCount]);

  function toggleChannel(k: ChannelKey) {
    if (!availability[k].available) return;
    setChannels((p) => ({ ...p, [k]: !p[k] }));
  }

  function currentSpec(): AudienceSpec {
    return audKind === 'ticket_type' ? { kind: 'ticket_type', ticketTypeId: ticketId } : { kind: audKind };
  }

  function doSend() {
    setError('');
    start(async () => {
      const r = await sendBroadcast(currentSpec(), channels, body);
      setConfirmOpen(false);
      if (r.error) { setError(r.error); return; }
      if (r.results) setResult({ results: r.results, recipientCount: r.recipientCount ?? 0 });
    });
  }

  const canOpen = anyChannel && body.trim().length > 0 && recipientCount > 0;

  if (result) return <ResultView eventSlug={eventSlug} data={result} onNew={() => { setResult(null); setBody(''); }} />;

  return (
    <div className="min-h-full" style={{ background: C.cream }}>
      <div className="max-w-[760px] mx-auto px-4 sm:px-6 py-8 pb-24">
        <CommsTabs eventSlug={eventSlug} active="broadcast" />
        <h1 className="font-display font-semibold text-[24px] sm:text-[28px] leading-tight" style={{ color: C.ink, letterSpacing: '-0.015em' }}>New broadcast</h1>
        <p className="text-[14px] mt-1 mb-5" style={{ color: C.muted }}>Send a one-off announcement. We only deliver on channels that are configured.</p>

        {error && <div className="mb-5 rounded-xl px-4 py-3 text-[13px] font-medium" style={{ background: '#FBEDEC', color: C.danger, border: '1px solid #F0CFCD' }}>{error}</div>}

        {/* Audience */}
        <div className="bg-white rounded-2xl p-5 mb-4" style={{ border: `1px solid ${C.border}` }}>
          <div className="text-[13px] font-semibold mb-3" style={{ color: C.ink }}>Audience</div>
          <div className="space-y-2">
            <AudienceRow label="All registrants" count={allCount} active={audKind === 'all'} onClick={() => setAudKind('all')} />
            <AudienceRow label="Checked-in only" count={checkedInCount} active={audKind === 'checked_in'} onClick={() => setAudKind('checked_in')} />
            {ticketOptions.length > 0 && (
              <div className="rounded-xl px-3.5 py-3" style={{ background: audKind === 'ticket_type' ? C.soft : 'white', border: `1px solid ${audKind === 'ticket_type' ? C.primary : C.border}` }}>
                <button type="button" onClick={() => setAudKind('ticket_type')} className="flex items-center gap-2 text-[13.5px] font-medium w-full text-left" style={{ color: C.ink }}>
                  <span className="h-4 w-4 rounded-full flex items-center justify-center shrink-0" style={{ border: `1.5px solid ${audKind === 'ticket_type' ? C.primary : C.border}`, background: audKind === 'ticket_type' ? C.primary : 'transparent' }}>{audKind === 'ticket_type' && <span className="h-1.5 w-1.5 rounded-full bg-white" />}</span>
                  By ticket type
                </button>
                {audKind === 'ticket_type' && (
                  <select value={ticketId} onChange={(e) => setTicketId(e.target.value)} className="w-full h-9 px-3 rounded-lg text-[13.5px] outline-none mt-2.5" style={{ border: `1px solid ${C.border}`, background: 'white', color: C.ink }}>
                    {ticketOptions.map((t) => <option key={t.id} value={t.id}>{t.name} · {t.count}</option>)}
                  </select>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Channels */}
        <div className="bg-white rounded-2xl p-5 mb-4" style={{ border: `1px solid ${C.border}` }}>
          <div className="text-[13px] font-semibold mb-3" style={{ color: C.ink }}>Channels</div>
          <div className="grid grid-cols-2 gap-2.5">
            {CHANNEL_META.map((c) => {
              const av = availability[c.key];
              const on = channels[c.key] && av.available;
              return (
                <button key={c.key} type="button" onClick={() => toggleChannel(c.key)} disabled={!av.available} title={av.available ? undefined : av.reason ?? ''} className="text-left rounded-xl px-3.5 py-3 transition disabled:cursor-not-allowed" style={{ background: on ? C.soft : av.available ? 'white' : C.cream, border: `1px solid ${on ? C.primary : C.border}`, opacity: av.available ? 1 : 0.75 }}>
                  <div className="flex items-center gap-2">
                    <span style={{ color: on ? C.primary : C.muted }}>{c.icon}</span>
                    <span className="text-[13.5px] font-medium" style={{ color: on ? C.primary : C.ink }}>{c.label}</span>
                  </div>
                  <div className="text-[11px] mt-1" style={{ color: av.available ? C.muted : C.warning }}>{av.available ? (c.rate === 0 ? 'Free' : `est. ~$${c.rate.toFixed(2)}/msg`) : av.reason}</div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Message */}
        <div className="bg-white rounded-2xl p-5 mb-4" style={{ border: `1px solid ${C.border}` }}>
          <div className="flex items-center justify-between mb-2">
            <div className="text-[13px] font-semibold" style={{ color: C.ink }}>Message</div>
            <span className="text-[12px]" style={{ color: body.length > 4096 ? C.danger : C.muted }}>{body.length} / 4096</span>
          </div>
          <textarea value={body} onChange={(e) => setBody(e.target.value)} rows={6} placeholder="Write your announcement…" className="w-full px-3 py-2.5 rounded-lg text-[14px] outline-none resize-none leading-relaxed" style={{ border: `1px solid ${C.border}`, background: 'white', color: C.ink }} />
          <div className="flex items-center justify-between mt-3 flex-wrap gap-2">
            <span className="text-[12px]" style={{ color: C.muted }}>Estimated cost: <strong style={{ color: C.ink }}>${estCost.toFixed(2)}</strong> — assumes ~$0.02/WhatsApp, ~$0.03/SMS; email &amp; in-app are free</span>
            <button type="button" disabled={!canOpen} onClick={() => setConfirmOpen(true)} className="inline-flex items-center gap-1.5 h-10 px-5 rounded-lg text-[13px] font-semibold text-white transition disabled:opacity-50" style={{ background: C.primary }}><Send size={14} strokeWidth={2} /> Review &amp; send</button>
          </div>
        </div>
      </div>

      {confirmOpen && (
        <Modal open onClose={() => !pending && setConfirmOpen(false)} title="Send this broadcast?" subtitle="This delivers immediately and can't be undone" maxWidth={460}
          footer={<>
            <button onClick={() => setConfirmOpen(false)} disabled={pending} className="h-10 px-4 rounded-lg text-[13px] font-medium border disabled:opacity-50" style={{ borderColor: C.border, color: C.muted }}>Cancel</button>
            <button onClick={doSend} disabled={pending} className="h-10 px-5 rounded-lg text-[13px] font-semibold text-white disabled:opacity-60 inline-flex items-center gap-1.5" style={{ background: C.primary }}>{pending ? 'Sending…' : <><Send size={13} strokeWidth={2} /> Send to {recipientCount}</>}</button>
          </>}>
          <div className="flex items-start gap-2.5 rounded-xl px-4 py-3 mb-3" style={{ background: C.soft, border: `1px solid ${C.border}` }}>
            <Users size={16} strokeWidth={2} style={{ color: C.primary, marginTop: 1 }} />
            <span className="text-[13px]" style={{ color: C.ink }}>Delivering to <strong>{recipientCount}</strong> recipient{recipientCount !== 1 ? 's' : ''} on {CHANNEL_META.filter((c) => channels[c.key] && availability[c.key].available).map((c) => c.label).join(', ')}.</span>
          </div>
          {(!availability.whatsapp.available && channels.whatsapp) && <p className="text-[12px]" style={{ color: C.warning }}>WhatsApp will be skipped — {availability.whatsapp.reason}</p>}
        </Modal>
      )}
    </div>
  );
}

function AudienceRow({ label, count, active, onClick }: { label: string; count: number; active: boolean; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className="w-full flex items-center justify-between rounded-xl px-3.5 py-3 text-left transition" style={{ background: active ? C.soft : 'white', border: `1px solid ${active ? C.primary : C.border}` }}>
      <span className="flex items-center gap-2 text-[13.5px] font-medium" style={{ color: C.ink }}>
        <span className="h-4 w-4 rounded-full flex items-center justify-center shrink-0" style={{ border: `1.5px solid ${active ? C.primary : C.border}`, background: active ? C.primary : 'transparent' }}>{active && <span className="h-1.5 w-1.5 rounded-full bg-white" />}</span>
        {label}
      </span>
      <span className="text-[12.5px]" style={{ color: C.muted }}>{count}</span>
    </button>
  );
}

function ResultView({ eventSlug, data, onNew }: { eventSlug: string; data: { results: DispatchResult; recipientCount: number }; onNew: () => void }) {
  const { results, recipientCount } = data;
  const rows: { key: ChannelKey; label: string }[] = [
    { key: 'email', label: 'Email' }, { key: 'inapp', label: 'In-app' }, { key: 'whatsapp', label: 'WhatsApp' }, { key: 'sms', label: 'SMS' },
  ];
  const totalSent = results.email.sent + results.inapp.sent + results.whatsapp.sent + results.sms.sent;
  const totalFailed = results.email.failed + results.inapp.failed + results.whatsapp.failed + results.sms.failed;
  const failedAll = totalSent === 0 && totalFailed > 0;

  return (
    <div className="min-h-full" style={{ background: C.cream }}>
      <div className="max-w-[600px] mx-auto px-4 sm:px-6 py-8 pb-24">
        <CommsTabs eventSlug={eventSlug} active="broadcast" />
        <div className="bg-white rounded-2xl p-6 text-center mb-5" style={{ border: `1px solid ${C.border}` }}>
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full" style={{ background: failedAll ? '#FBEDEC' : C.soft }}>
            {failedAll ? <AlertTriangle size={22} strokeWidth={2} style={{ color: C.danger }} /> : <CheckCircle2 size={22} strokeWidth={2} style={{ color: C.primary }} />}
          </div>
          <h2 className="font-display text-[19px] font-semibold" style={{ color: C.ink }}>{failedAll ? 'Broadcast failed' : 'Broadcast recorded'}</h2>
          <p className="text-[13.5px] mt-1" style={{ color: C.muted }}>{failedAll ? 'Nothing could be delivered — see the per-channel breakdown below.' : `Resolved to ${recipientCount} recipient${recipientCount !== 1 ? 's' : ''}. Delivered ${totalSent} message${totalSent !== 1 ? 's' : ''}.`}</p>
        </div>
        <div className="bg-white rounded-2xl overflow-hidden mb-5" style={{ border: `1px solid ${C.border}` }}>
          {rows.map((r, i) => {
            const cr = results[r.key];
            return (
              <div key={r.key} className="flex items-center justify-between px-4 py-3" style={{ borderTop: i === 0 ? 'none' : `1px solid ${C.border}` }}>
                <span className="text-[13.5px] font-medium" style={{ color: C.ink }}>{r.label}</span>
                <span className="flex items-center gap-3 text-[12.5px]">
                  <span style={{ color: C.success }}>{cr.sent} sent</span>
                  <span style={{ color: C.muted }}>{cr.skipped} skipped</span>
                  <span style={{ color: cr.failed > 0 ? C.danger : C.muted }}>{cr.failed} failed</span>
                </span>
              </div>
            );
          })}
        </div>
        <button onClick={onNew} className="h-10 px-5 rounded-lg text-[13px] font-semibold text-white" style={{ background: C.primary }}>New broadcast</button>
      </div>
    </div>
  );
}
