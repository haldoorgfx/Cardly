'use client';

import { useState, useTransition } from 'react';
import { Mail, MessageCircle, Smartphone, Lock } from 'lucide-react';
import { CommsTabs } from '@/components/communications/CommsTabs';
import type { AutomationRow, JourneyStep } from '@/components/communications/whatsapp-model';
import type { ChannelAvailability } from '@/lib/notifications/channels';

const C = { ink: '#0F1F18', muted: '#6B7A72', border: '#E5E0D4', primary: '#1F4D3A', soft: '#E8EFEB', cream: '#FAF6EE', danger: '#B8423C', warning: '#C97A2D' };

type ChannelKey = 'email' | 'whatsapp' | 'sms';

const STEP_META: Record<JourneyStep, { title: string; when: string }> = {
  registration: { title: 'On registration', when: 'The moment someone registers' },
  d7: { title: '7 days before', when: 'A week ahead of the event' },
  d1: { title: '1 day before', when: 'The day before it starts' },
  h1: { title: '1 hour before', when: 'Final reminder, one hour out' },
  during: { title: 'During the event', when: 'While the event is live' },
  post: { title: 'After the event', when: 'A thank-you / follow-up' },
};

const CHANNELS: { key: ChannelKey; label: string; icon: React.ReactNode; costHint?: string }[] = [
  { key: 'email', label: 'Email', icon: <Mail size={14} strokeWidth={2} /> },
  { key: 'whatsapp', label: 'WhatsApp', icon: <MessageCircle size={14} strokeWidth={2} />, costHint: 'est. ~$0.02 / message' },
  { key: 'sms', label: 'SMS', icon: <Smartphone size={14} strokeWidth={2} />, costHint: 'est. ~$0.03 / message' },
];

interface Props {
  eventSlug: string;
  rows: AutomationRow[];
  availability: ChannelAvailability;
  saveStep: (step: string, enabled: boolean, channels: { email: boolean; whatsapp: boolean; sms: boolean }) => Promise<{ ok?: boolean; error?: string }>;
}

export function AutomationsClient({ eventSlug, rows: initial, availability, saveStep }: Props) {
  const [rows, setRows] = useState<AutomationRow[]>(initial);
  const [pending, start] = useTransition();
  const [savingStep, setSavingStep] = useState<string | null>(null);
  const [error, setError] = useState('');

  function persist(next: AutomationRow) {
    setSavingStep(next.step);
    setError('');
    start(async () => {
      const r = await saveStep(next.step, next.enabled, next.channels);
      setSavingStep(null);
      if (r.error) { setError(r.error); setRows(initial); }
    });
  }

  function toggleEnabled(step: JourneyStep) {
    setRows((prev) => {
      const next = prev.map((r) => (r.step === step ? { ...r, enabled: !r.enabled } : r));
      const changed = next.find((r) => r.step === step)!;
      persist(changed);
      return next;
    });
  }

  function toggleChannel(step: JourneyStep, ch: ChannelKey) {
    if (!availability[ch].available) return;
    setRows((prev) => {
      const next = prev.map((r) => (r.step === step ? { ...r, channels: { ...r.channels, [ch]: !r.channels[ch] } } : r));
      const changed = next.find((r) => r.step === step)!;
      persist(changed);
      return next;
    });
  }

  return (
    <div className="min-h-full" style={{ background: C.cream }}>
      <div className="max-w-[820px] mx-auto px-4 sm:px-6 py-8 pb-24">
        <CommsTabs eventSlug={eventSlug} active="automations" />

        <h1 className="font-display font-semibold text-[24px] sm:text-[28px] leading-tight" style={{ color: C.ink, letterSpacing: '-0.015em' }}>Attendee journey</h1>
        <p className="text-[14px] mt-1 mb-5" style={{ color: C.muted }}>Choose when to reach attendees and on which channels. Changes save as you toggle.</p>

        {error && <div className="mb-5 rounded-xl px-4 py-3 text-[13px] font-medium" style={{ background: '#FBEDEC', color: C.danger, border: '1px solid #F0CFCD' }}>{error}</div>}

        {/* Unavailable-channel notices */}
        {(!availability.whatsapp.available || !availability.sms.available) && (
          <div className="mb-5 rounded-xl px-4 py-3.5" style={{ background: 'rgba(201,122,45,0.08)', border: '1px solid rgba(201,122,45,0.3)' }}>
            {!availability.whatsapp.available && <p className="text-[12.5px]" style={{ color: '#5A4520' }}>WhatsApp — {availability.whatsapp.reason}</p>}
            {!availability.sms.available && <p className="text-[12.5px] mt-1" style={{ color: '#5A4520' }}>SMS — {availability.sms.reason}</p>}
          </div>
        )}

        {/* Vertical timeline */}
        <div className="relative pl-6">
          <div className="absolute left-[9px] top-2 bottom-2 w-px" style={{ background: C.border }} />
          <div className="space-y-4">
            {rows.map((row) => {
              const meta = STEP_META[row.step];
              return (
                <div key={row.step} className="relative">
                  <div className="absolute -left-6 top-4 h-[18px] w-[18px] rounded-full border-2 flex items-center justify-center" style={{ background: row.enabled ? C.primary : 'white', borderColor: row.enabled ? C.primary : C.border }}>
                    {row.enabled && <div className="h-1.5 w-1.5 rounded-full bg-white" />}
                  </div>
                  <div className="bg-white rounded-2xl p-4 sm:p-5" style={{ border: `1px solid ${C.border}` }}>
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="text-[15px] font-semibold" style={{ color: C.ink }}>{meta.title}</div>
                        <div className="text-[12.5px] mt-0.5" style={{ color: C.muted }}>{meta.when}</div>
                      </div>
                      <Switch on={row.enabled} disabled={savingStep === row.step && pending} onClick={() => toggleEnabled(row.step)} />
                    </div>

                    {row.enabled && (
                      <div className="mt-4 pt-4 grid grid-cols-1 sm:grid-cols-3 gap-2.5" style={{ borderTop: `1px solid ${C.border}` }}>
                        {CHANNELS.map((c) => {
                          const av = availability[c.key];
                          const on = row.channels[c.key] && av.available;
                          return (
                            <button
                              key={c.key}
                              type="button"
                              onClick={() => toggleChannel(row.step, c.key)}
                              disabled={!av.available}
                              title={av.available ? undefined : av.reason ?? ''}
                              className="text-left rounded-xl px-3 py-2.5 transition disabled:cursor-not-allowed"
                              style={{ background: on ? C.soft : av.available ? 'white' : C.cream, border: `1px solid ${on ? C.primary : C.border}`, opacity: av.available ? 1 : 0.7 }}
                            >
                              <div className="flex items-center justify-between">
                                <span className="inline-flex items-center gap-1.5 text-[13px] font-medium" style={{ color: on ? C.primary : C.ink }}>{c.icon}{c.label}</span>
                                {av.available ? (
                                  <span className="h-4 w-4 rounded-full flex items-center justify-center" style={{ background: on ? C.primary : 'transparent', border: `1.5px solid ${on ? C.primary : C.border}` }}>{on && <span className="h-1.5 w-1.5 rounded-full bg-white" />}</span>
                                ) : (
                                  <Lock size={12} strokeWidth={2} style={{ color: C.muted }} />
                                )}
                              </div>
                              <div className="text-[11px] mt-1" style={{ color: av.available ? C.muted : C.warning }}>
                                {av.available ? (c.costHint ?? 'Included') : (av.reason ?? 'Not available')}
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

function Switch({ on, onClick, disabled }: { on: boolean; onClick: () => void; disabled?: boolean }) {
  return (
    <button type="button" onClick={onClick} disabled={disabled} aria-pressed={on} className="relative h-6 w-11 rounded-full transition disabled:opacity-60 shrink-0" style={{ background: on ? C.primary : C.border }}>
      <span className="absolute top-0.5 h-5 w-5 rounded-full bg-white transition-all" style={{ left: on ? '22px' : '2px', boxShadow: '0 1px 2px rgba(0,0,0,0.15)' }} />
    </button>
  );
}
