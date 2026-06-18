'use client';

import { useState } from 'react';
import { ArrowLeft, Check, Users, DoorOpen } from 'lucide-react';
import Link from 'next/link';

interface Ticket { id: string; name: string; price: number; currency: string; quantity: number | null; }

interface Props {
  eventId: string;
  eventSlug: string;
  eventName: string;
  tickets: Ticket[];
  checkedIn: number;
  walkInsToday: number;
  maxCapacity?: number | null;
  confirmedCount?: number;
}

type Step = 'info' | 'ticket' | 'payment' | 'success';

interface WalkInForm {
  name: string;
  email: string;
  phone: string;
  ticketId: string;
  payment: 'card' | 'cash';
}

function fmtPrice(price: number, currency: string) {
  if (price === 0) return 'Free';
  try { return new Intl.NumberFormat(undefined, { style: 'currency', currency, minimumFractionDigits: 0 }).format(price); }
  catch { return `${currency} ${price}`; }
}

export function WalkInClient({ eventId, eventSlug, eventName, tickets, checkedIn, walkInsToday, maxCapacity, confirmedCount = 0 }: Props) {
  const [step, setStep] = useState<Step>('info');
  const [form, setForm] = useState<WalkInForm>({ name: '', email: '', phone: '', ticketId: tickets[0]?.id ?? '', payment: 'card' });
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [result, setResult] = useState<{ name: string; ticketName: string; ticketNumber: string } | null>(null);
  const [localWalkIns, setLocalWalkIns] = useState(walkInsToday);
  const [localConfirmed, setLocalConfirmed] = useState(confirmedCount);

  const remaining = maxCapacity != null ? maxCapacity - localConfirmed : null;
  const isFull = remaining !== null && remaining <= 0;

  const selectedTicket = tickets.find(t => t.id === form.ticketId);

  function setField(field: keyof WalkInForm, value: string) {
    setForm(prev => ({ ...prev, [field]: value }));
  }

  async function submit() {
    if (!form.name.trim() || !form.email.trim()) return;
    setSubmitting(true);
    setSubmitError(null);
    const res = await fetch(`/api/events/${eventId}/walk-in`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });
    if (res.ok) {
      const data = await res.json();
      setResult({
        name: form.name,
        ticketName: selectedTicket?.name ?? 'General',
        ticketNumber: data.ticket_number ?? data.id?.slice(-6).toUpperCase() ?? 'WALKIN',
      });
      setLocalWalkIns(w => w + 1);
      setLocalConfirmed(c => c + 1);
      setStep('success');
    } else {
      const data = await res.json() as { error?: string };
      setSubmitError(data.error ?? 'Registration failed');
    }
    setSubmitting(false);
  }

  function reset() {
    setForm({ name: '', email: '', phone: '', ticketId: tickets[0]?.id ?? '', payment: 'card' });
    setStep('info');
    setResult(null);
  }

  return (
    <div className="min-h-screen" style={{ background: '#0F1F18' }}>
      {/* Header */}
      <div className="sticky top-0 z-10 flex items-center justify-between px-5 py-4" style={{ background: '#0F1F18', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
        <div className="flex items-center gap-3">
          <Link href={`/events/${eventSlug}/check-in`} className="p-2 rounded-lg hover:opacity-70 transition" style={{ color: 'rgba(255,255,255,0.5)' }}>
            <ArrowLeft size={18} />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold tracking-[0.14em] px-2 py-0.5 rounded-full" style={{ background: '#E8C57E', color: '#0F1F18', fontFamily: 'Inter, system-ui, sans-serif' }}>
                DOOR MODE
              </span>
            </div>
            <div className="text-[13px] font-semibold mt-0.5" style={{ color: '#FAF6EE' }}>{eventName}</div>
          </div>
        </div>
        <div className="flex items-center gap-4 text-[12px]" style={{ color: 'rgba(255,255,255,0.5)', fontFamily: 'Inter, system-ui, sans-serif' }}>
          <span className="flex items-center gap-1.5"><Users size={12} /> {checkedIn} checked in</span>
          <span className="flex items-center gap-1.5"><DoorOpen size={12} /> {localWalkIns} walk-ins</span>
          {remaining !== null && (
            <span className="flex items-center gap-1.5" style={{ color: remaining <= 5 ? '#E8C57E' : 'rgba(255,255,255,0.5)' }}>
              {remaining} spot{remaining !== 1 ? 's' : ''} left
            </span>
          )}
        </div>
      </div>

      {isFull && (
        <div className="max-w-xl mx-auto px-5 pt-6">
          <div className="rounded-xl px-4 py-3 text-[13px] font-medium" style={{ background: 'rgba(184,66,60,0.15)', border: '1px solid rgba(184,66,60,0.3)', color: '#ff8080' }}>
            This event is at full capacity — walk-in registration is not available.
          </div>
        </div>
      )}

      {step === 'success' && result ? (
        <div className="max-w-md mx-auto px-5 py-16 text-center">
          <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6" style={{ background: 'rgba(45,122,79,0.2)', border: '2px solid #2D7A4F' }}>
            <Check size={28} style={{ color: '#2D7A4F' }} />
          </div>
          <h2 className="font-display font-bold text-[28px] mb-2" style={{ color: '#FAF6EE', letterSpacing: '-0.02em' }}>
            Welcome, {result.name.split(' ')[0]}!
          </h2>
          <p className="text-[14px] mb-2" style={{ color: 'rgba(255,255,255,0.5)' }}>{result.ticketName}</p>
          <div className="text-[20px] font-semibold mb-8" style={{ color: '#E8C57E', fontFamily: 'Inter, system-ui, sans-serif' }}>
            #{result.ticketNumber}
          </div>
          <p className="text-[13px] mb-8" style={{ color: 'rgba(255,255,255,0.4)' }}>
            QR code + Eventera Card sent to WhatsApp &amp; email.
          </p>
          <button onClick={reset} className="w-full py-3 rounded-2xl text-[15px] font-semibold transition hover:opacity-90"
            style={{ background: '#1F4D3A', color: '#FAF6EE' }}>
            Register next attendee
          </button>
        </div>
      ) : (
        <div className="max-w-xl mx-auto px-5 py-8">
          {/* Step indicator */}
          <div className="flex items-center gap-2 mb-8">
            {(['info', 'ticket', 'payment'] as Step[]).map((s, i) => (
              <div key={s} className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold transition"
                  style={{
                    background: step === s ? '#E8C57E' : ['info', 'ticket', 'payment'].indexOf(step) > i ? '#2D7A4F' : 'rgba(255,255,255,0.1)',
                    color: step === s ? '#0F1F18' : 'rgba(255,255,255,0.5)',
                  }}>
                  {['info', 'ticket', 'payment'].indexOf(step) > i ? <Check size={10} /> : i + 1}
                </div>
                <span className="text-[12px]" style={{ color: step === s ? '#FAF6EE' : 'rgba(255,255,255,0.4)' }}>
                  {s === 'info' ? 'Attendee' : s === 'ticket' ? 'Ticket' : 'Payment'}
                </span>
                {i < 2 && <div className="w-8 h-px" style={{ background: 'rgba(255,255,255,0.12)' }} />}
              </div>
            ))}
          </div>

          {/* Step 1: Attendee info */}
          {step === 'info' && (
            <div className="rounded-2xl p-6" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
              <h2 className="font-display font-semibold text-[20px] mb-6" style={{ color: '#FAF6EE' }}>Attendee info</h2>
              <div className="space-y-4">
                {[
                  { label: 'Full name', key: 'name', type: 'text', placeholder: 'Amina Hassan' },
                  { label: 'Email', key: 'email', type: 'email', placeholder: 'amina@example.com' },
                  { label: 'WhatsApp / Phone', key: 'phone', type: 'tel', placeholder: '+253 77 00 00 00' },
                ].map(f => (
                  <div key={f.key}>
                    <label className="block text-[12px] font-medium mb-1.5" style={{ color: 'rgba(255,255,255,0.5)' }}>{f.label}</label>
                    <input
                      type={f.type}
                      value={form[f.key as keyof WalkInForm]}
                      onChange={e => setField(f.key as keyof WalkInForm, e.target.value)}
                      placeholder={f.placeholder}
                      className="w-full px-4 py-3 rounded-xl text-[15px] outline-none transition"
                      style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: '#FAF6EE' }}
                      onFocus={e => e.currentTarget.style.borderColor = '#E8C57E'}
                      onBlur={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'}
                    />
                  </div>
                ))}
              </div>
              <button
                onClick={() => setStep('ticket')}
                disabled={!form.name.trim() || !form.email.trim()}
                className="w-full mt-6 py-3 rounded-2xl text-[15px] font-semibold transition hover:opacity-90 disabled:opacity-40"
                style={{ background: '#E8C57E', color: '#0F1F18' }}>
                Continue
              </button>
            </div>
          )}

          {/* Step 2: Ticket */}
          {step === 'ticket' && (
            <div className="rounded-2xl p-6" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
              <h2 className="font-display font-semibold text-[20px] mb-6" style={{ color: '#FAF6EE' }}>Select ticket</h2>
              {tickets.length === 0 ? (
                <p className="text-[14px]" style={{ color: 'rgba(255,255,255,0.5)' }}>No tickets available</p>
              ) : (
                <div className="space-y-3">
                  {tickets.map(t => (
                    <button
                      key={t.id}
                      onClick={() => setField('ticketId', t.id)}
                      className="w-full text-left px-4 py-4 rounded-xl transition"
                      style={{
                        background: form.ticketId === t.id ? 'rgba(232,197,126,0.12)' : 'rgba(255,255,255,0.04)',
                        border: form.ticketId === t.id ? '1px solid rgba(232,197,126,0.4)' : '1px solid rgba(255,255,255,0.08)',
                      }}>
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-[15px] font-semibold" style={{ color: '#FAF6EE' }}>{t.name}</div>
                          {t.quantity != null && t.quantity > 0 && <div className="text-[12px] mt-0.5" style={{ color: 'rgba(255,255,255,0.4)' }}>{t.quantity} available</div>}
                        </div>
                        <div className="text-[18px] font-bold" style={{ color: form.ticketId === t.id ? '#E8C57E' : 'rgba(255,255,255,0.7)' }}>
                          {fmtPrice(t.price, t.currency || 'USD')}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
              <div className="flex gap-3 mt-6">
                <button onClick={() => setStep('info')} className="flex-1 py-3 rounded-2xl text-[14px] font-semibold border transition hover:opacity-70" style={{ borderColor: 'rgba(255,255,255,0.15)', color: 'rgba(255,255,255,0.6)' }}>
                  Back
                </button>
                <button onClick={() => setStep('payment')} disabled={!form.ticketId} className="flex-1 py-3 rounded-2xl text-[15px] font-semibold transition hover:opacity-90 disabled:opacity-40" style={{ background: '#E8C57E', color: '#0F1F18' }}>
                  Continue
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Payment */}
          {step === 'payment' && (
            <div className="rounded-2xl p-6" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
              <h2 className="font-display font-semibold text-[20px] mb-6" style={{ color: '#FAF6EE' }}>Payment</h2>

              {/* Summary */}
              <div className="rounded-xl p-4 mb-6" style={{ background: 'rgba(255,255,255,0.04)' }}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[14px]" style={{ color: 'rgba(255,255,255,0.6)' }}>{selectedTicket?.name}</span>
                  <span className="text-[16px] font-semibold" style={{ color: '#FAF6EE' }}>{fmtPrice(selectedTicket?.price ?? 0, selectedTicket?.currency || 'USD')}</span>
                </div>
                <div className="text-[12px]" style={{ color: 'rgba(255,255,255,0.4)' }}>{form.name} · {form.email}</div>
              </div>

              {/* Payment method */}
              {selectedTicket && selectedTicket.price > 0 && (
                <div className="grid grid-cols-2 gap-3 mb-6">
                  {[
                    { id: 'card', label: 'Tap to pay', sub: 'Card or phone' },
                    { id: 'cash', label: 'Cash', sub: 'Mark as paid' },
                  ].map(opt => (
                    <button key={opt.id} onClick={() => setField('payment', opt.id)}
                      className="py-4 rounded-xl transition"
                      style={{
                        background: form.payment === opt.id ? 'rgba(232,197,126,0.12)' : 'rgba(255,255,255,0.04)',
                        border: form.payment === opt.id ? '1px solid rgba(232,197,126,0.4)' : '1px solid rgba(255,255,255,0.08)',
                      }}>
                      <div className="text-[15px] font-semibold" style={{ color: '#FAF6EE' }}>{opt.label}</div>
                      <div className="text-[11px]" style={{ color: 'rgba(255,255,255,0.4)' }}>{opt.sub}</div>
                    </button>
                  ))}
                </div>
              )}

              {submitError && (
                <div className="mb-4 px-3 py-2.5 rounded-xl text-[13px]" style={{ background: 'rgba(184,66,60,0.15)', border: '1px solid rgba(184,66,60,0.3)', color: '#ff8080' }}>
                  {submitError}
                </div>
              )}
              <div className="flex gap-3">
                <button onClick={() => setStep('ticket')} className="flex-1 py-3 rounded-2xl text-[14px] font-semibold border transition hover:opacity-70" style={{ borderColor: 'rgba(255,255,255,0.15)', color: 'rgba(255,255,255,0.6)' }}>
                  Back
                </button>
                <button onClick={submit} disabled={submitting || isFull} className="flex-1 py-3 rounded-2xl text-[15px] font-semibold transition hover:opacity-90 disabled:opacity-50" style={{ background: '#E8C57E', color: '#0F1F18' }}>
                  {submitting ? 'Registering…' : 'Register & check in'}
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
