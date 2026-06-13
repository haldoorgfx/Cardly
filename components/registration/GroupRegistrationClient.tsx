'use client';

import { useState, useMemo } from 'react';
import { Plus, Minus, ChevronDown, ChevronUp, CheckCircle2, ArrowLeft, Users } from 'lucide-react';
import Link from 'next/link';

interface TicketType {
  id: string;
  name: string;
  description: string | null;
  price: number;
  currency: string;
  quantity: number | null;
  quantity_sold: number;
}

interface AttendeeFields {
  name: string;
  email: string;
  whatsapp: string;
}

interface Props {
  eventId: string;
  eventName: string;
  eventSlug: string;
  tickets: TicketType[];
  maxCapacity?: number | null;
  confirmedCount?: number;
}

function fmt(price: number, currency: string) {
  if (price === 0) return 'Free';
  try {
    return new Intl.NumberFormat(undefined, { style: 'currency', currency: currency || 'USD', minimumFractionDigits: 0 }).format(price);
  } catch {
    return `${currency} ${price}`;
  }
}

function initials(name: string) {
  return name.split(' ').filter(Boolean).map(w => w[0]).slice(0, 2).join('').toUpperCase() || '?';
}

const DEMO_TICKETS: TicketType[] = [
  { id: 't1', name: 'General', description: 'Full access to all sessions', price: 0, currency: 'USD', quantity: null, quantity_sold: 0 },
  { id: 't2', name: 'VIP', description: 'Front-row seating + networking dinner', price: 150, currency: 'USD', quantity: 50, quantity_sold: 12 },
  { id: 't3', name: 'Student', description: 'Valid student ID required at door', price: 0, currency: 'USD', quantity: 100, quantity_sold: 34 },
];

export function GroupRegistrationClient({ eventId, eventName, eventSlug, tickets: dbTickets, maxCapacity, confirmedCount = 0 }: Props) {
  const tickets = dbTickets.length > 0 ? dbTickets : DEMO_TICKETS;

  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [attendees, setAttendees] = useState<Record<string, AttendeeFields[]>>({});
  const [expandedTicketId, setExpandedTicketId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [confirmedAttendees, setConfirmedAttendees] = useState<{ name: string; ticket: string }[]>([]);

  const remaining = maxCapacity != null ? maxCapacity - confirmedCount : null;

  const totalTickets = useMemo(() => Object.values(quantities).reduce((a, b) => a + b, 0), [quantities]);
  const totalPrice = useMemo(() =>
    tickets.reduce((sum, t) => sum + (quantities[t.id] ?? 0) * t.price, 0)
  , [tickets, quantities]);
  const primaryCurrency = tickets[0]?.currency ?? 'USD';

  function setQty(ticketId: string, delta: number) {
    setQuantities(prev => {
      const current = prev[ticketId] ?? 0;
      const next = Math.max(0, current + delta);
      // Sync attendee array size
      setAttendees(a => {
        const arr = a[ticketId] ?? [];
        const filled: AttendeeFields[] = Array.from({ length: next }, (_, i) =>
          arr[i] ?? { name: '', email: '', whatsapp: '' }
        );
        return { ...a, [ticketId]: filled };
      });
      return { ...prev, [ticketId]: next };
    });
  }

  function updateAttendee(ticketId: string, index: number, field: keyof AttendeeFields, val: string) {
    setAttendees(prev => {
      const arr = [...(prev[ticketId] ?? [])];
      arr[index] = { ...arr[index], [field]: val };
      return { ...prev, [ticketId]: arr };
    });
  }

  function isAttendeeComplete(a: AttendeeFields) {
    return a.name.trim().length > 0 && a.email.trim().includes('@');
  }

  function completedCount(ticketId: string) {
    return (attendees[ticketId] ?? []).filter(isAttendeeComplete).length;
  }

  async function submit() {
    setSubmitting(true);
    const seats: { ticketTypeId: string; name: string; email: string; whatsapp: string }[] = [];
    for (const t of tickets) {
      const qty = quantities[t.id] ?? 0;
      for (let i = 0; i < qty; i++) {
        const a = attendees[t.id]?.[i] ?? { name: '', email: '', whatsapp: '' };
        seats.push({ ticketTypeId: t.id, name: a.name, email: a.email, whatsapp: a.whatsapp });
      }
    }

    const res = await fetch(`/api/events/${eventId}/group-register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ seats }),
    });

    setSubmitting(false);
    if (res.ok) {
      setConfirmedAttendees(seats.map(s => ({
        name: s.name || 'Attendee',
        ticket: tickets.find(t => t.id === s.ticketTypeId)?.name ?? 'Ticket',
      })));
      setSuccess(true);
    } else {
      const data = await res.json() as { error?: string };
      setSubmitError(data.error ?? 'Registration failed. Please try again.');
    }
  }

  if (success) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-5 py-12"
        style={{ background: '#FAF6EE' }}>
        {/* Fan of cards */}
        <div className="relative mb-8" style={{ height: 140, width: 220 }}>
          {confirmedAttendees.slice(0, 3).map((a, i) => {
            const offsets = [{ rotate: -8, x: -30, y: 10 }, { rotate: 3, x: 10, y: 0 }, { rotate: 12, x: 50, y: 8 }];
            const o = offsets[i] ?? offsets[0];
            return (
              <div key={i}
                className="absolute w-36 h-24 rounded-2xl flex flex-col items-center justify-center shadow-lg"
                style={{
                  background: 'linear-gradient(135deg, #1F4D3A, #2A6A50)',
                  transform: `rotate(${o.rotate}deg) translate(${o.x}px, ${o.y}px)`,
                  border: '1px solid rgba(232,197,126,0.3)',
                  left: '50%', top: '50%', marginLeft: -72, marginTop: -48,
                  zIndex: i,
                }}>
                <div className="w-10 h-10 rounded-full flex items-center justify-center font-display font-bold text-[14px] mb-1"
                  style={{ background: 'rgba(232,197,126,0.2)', color: '#E8C57E' }}>
                  {initials(a.name)}
                </div>
                <div className="text-[10px] font-semibold" style={{ color: '#FAF6EE' }}>{a.name.split(' ')[0] || 'Guest'}</div>
                <div className="text-[9px]" style={{ color: 'rgba(255,255,255,0.5)' }}>{a.ticket}</div>
              </div>
            );
          })}
        </div>

        <div className="text-center mb-6">
          <CheckCircle2 size={28} style={{ color: '#2D7A4F' }} className="mx-auto mb-3" />
          <h2 className="font-display font-bold text-[26px] mb-2" style={{ color: '#0F1F18', letterSpacing: '-0.02em' }}>
            Seats confirmed!
          </h2>
          <p className="text-[14px]" style={{ color: '#6B7A72' }}>
            {confirmedAttendees.length} ticket{confirmedAttendees.length !== 1 ? 's' : ''} registered for {eventName}.
            <br />Check your emails for the ticket links.
          </p>
        </div>

        <div className="flex flex-col gap-2 w-full max-w-xs">
          <Link href={`/e/${eventSlug}`}
            className="flex items-center justify-center py-3 rounded-2xl text-[14px] font-semibold transition hover:opacity-90"
            style={{ background: '#1F4D3A', color: '#FAF6EE' }}>
            Back to event
          </Link>
          <Link href="/my-tickets"
            className="flex items-center justify-center py-3 rounded-2xl text-[14px] font-semibold border transition hover:opacity-80"
            style={{ borderColor: '#E5E0D4', color: '#3A4A42' }}>
            View tickets wallet
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div style={{ background: '#FAF6EE', minHeight: '100vh' }}>
      {/* Header */}
      <div className="sticky top-0 z-10 px-5 h-14 flex items-center gap-3 border-b"
        style={{ background: 'rgba(250,246,238,0.95)', backdropFilter: 'blur(12px)', borderColor: '#E5E0D4' }}>
        <Link href={`/e/${eventSlug}`} style={{ color: '#6B7A72' }}><ArrowLeft size={18} /></Link>
        <span className="font-display font-semibold text-[16px]" style={{ color: '#0F1F18' }}>Group Registration</span>
        <div className="ml-auto flex items-center gap-2">
          {remaining !== null && (
            <span className="text-[12px] font-medium px-2.5 py-0.5 rounded-full"
              style={{ background: remaining <= 5 ? '#FEF3C7' : '#E8EFEB', color: remaining <= 5 ? '#92400E' : '#1F4D3A' }}>
              {remaining} spot{remaining !== 1 ? 's' : ''} left
            </span>
          )}
          {totalTickets > 0 && (
            <span className="flex items-center gap-1 text-[13px] font-semibold" style={{ color: '#1F4D3A' }}>
              <Users size={14} /> {totalTickets} seat{totalTickets !== 1 ? 's' : ''}
            </span>
          )}
        </div>
      </div>

      {/* Full capacity banner */}
      {remaining !== null && remaining <= 0 && (
        <div className="px-5 py-3 text-[13px] font-medium text-center" style={{ background: '#FEF3C7', color: '#92400E', borderBottom: '1px solid #FDE68A' }}>
          This event is at full capacity — no more registrations can be accepted.
        </div>
      )}

      {/* Submit error banner */}
      {submitError && (
        <div className="px-5 py-3 text-[13px] font-medium text-center" style={{ background: '#FEF2F2', color: '#B91C1C', borderBottom: '1px solid #FECACA' }}>
          {submitError}
        </div>
      )}

      <div className="max-w-[860px] mx-auto px-5 py-6 flex flex-col lg:flex-row gap-6">
        {/* Left — ticket selector + attendee forms */}
        <div className="flex-1 min-w-0">
          <h2 className="font-display font-semibold text-[18px] mb-4" style={{ color: '#0F1F18', letterSpacing: '-0.01em' }}>
            Select tickets
          </h2>

          <div className="flex flex-col gap-3 mb-6">
            {tickets.map(t => {
              const qty = quantities[t.id] ?? 0;
              const isExpanded = expandedTicketId === t.id && qty > 0;
              const completed = completedCount(t.id);

              return (
                <div key={t.id} className="rounded-2xl overflow-hidden" style={{ background: '#FFFFFF', border: '1px solid #E5E0D4' }}>
                  {/* Ticket header */}
                  <div className="flex items-center gap-4 px-5 py-4">
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-[15px]" style={{ color: '#0F1F18' }}>{t.name}</div>
                      {t.description && <div className="text-[12px] mt-0.5 truncate" style={{ color: '#6B7A72' }}>{t.description}</div>}
                    </div>
                    <div className="text-[14px] font-semibold mr-2" style={{ color: '#1F4D3A' }}>
                      {fmt(t.price, t.currency)}
                    </div>
                    {/* Qty controls */}
                    <div className="flex items-center gap-2">
                      <button onClick={() => setQty(t.id, -1)} disabled={qty === 0}
                        className="w-8 h-8 rounded-full flex items-center justify-center transition hover:opacity-80 disabled:opacity-30"
                        style={{ background: '#F5F2EC', border: '1px solid #E5E0D4', color: '#3A4A42' }}>
                        <Minus size={13} />
                      </button>
                      <span className="font-semibold text-[15px] w-6 text-center" style={{ color: '#0F1F18', fontFamily: 'Inter, system-ui, sans-serif' }}>
                        {qty}
                      </span>
                      <button onClick={() => setQty(t.id, 1)}
                        className="w-8 h-8 rounded-full flex items-center justify-center transition hover:opacity-80"
                        style={{ background: '#1F4D3A', color: '#FAF6EE' }}>
                        <Plus size={13} />
                      </button>
                    </div>
                  </div>

                  {/* Seat accordion toggle */}
                  {qty > 0 && (
                    <button className="w-full flex items-center justify-between px-5 py-2.5 text-[13px] font-medium transition hover:opacity-80 border-t"
                      style={{ borderColor: '#F0EDE6', background: '#FAFAF8', color: '#1F4D3A' }}
                      onClick={() => setExpandedTicketId(isExpanded ? null : t.id)}>
                      <span>
                        {qty} seat{qty !== 1 ? 's' : ''} · {completed}/{qty} filled
                      </span>
                      {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                    </button>
                  )}

                  {/* Seat forms */}
                  {isExpanded && (
                    <div className="border-t" style={{ borderColor: '#F0EDE6' }}>
                      {Array.from({ length: qty }).map((_, i) => {
                        const a = attendees[t.id]?.[i] ?? { name: '', email: '', whatsapp: '' };
                        const done = isAttendeeComplete(a);
                        return (
                          <div key={i} className="px-5 py-4" style={{ borderBottom: i < qty - 1 ? '1px solid #F0EDE6' : 'none' }}>
                            <div className="flex items-center gap-2 mb-3">
                              <div className="w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold shrink-0"
                                style={{ background: done ? '#2D7A4F' : '#E5E0D4', color: done ? '#FAF6EE' : '#6B7A72' }}>
                                {done ? '✓' : i + 1}
                              </div>
                              <span className="font-semibold text-[13px]" style={{ color: '#0F1F18' }}>
                                {t.name} · Seat {i + 1}
                              </span>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                              <input
                                value={a.name}
                                onChange={e => updateAttendee(t.id, i, 'name', e.target.value)}
                                placeholder="Full name"
                                className="px-3 py-2.5 rounded-xl border text-[14px] outline-none transition"
                                style={{ borderColor: '#E5E0D4', background: '#FAF6EE', color: '#0F1F18' }}
                              />
                              <input
                                type="email"
                                value={a.email}
                                onChange={e => updateAttendee(t.id, i, 'email', e.target.value)}
                                placeholder="Email address"
                                className="px-3 py-2.5 rounded-xl border text-[14px] outline-none transition"
                                style={{ borderColor: '#E5E0D4', background: '#FAF6EE', color: '#0F1F18' }}
                              />
                              <input
                                value={a.whatsapp}
                                onChange={e => updateAttendee(t.id, i, 'whatsapp', e.target.value)}
                                placeholder="WhatsApp (optional)"
                                className="px-3 py-2.5 rounded-xl border text-[14px] outline-none transition sm:col-span-2"
                                style={{ borderColor: '#E5E0D4', background: '#FAF6EE', color: '#0F1F18' }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Right — sticky order summary */}
        <div className="lg:w-72 shrink-0">
          <div className="sticky top-20 rounded-2xl p-5" style={{ background: '#FFFFFF', border: '1px solid #E5E0D4' }}>
            <h3 className="font-semibold text-[15px] mb-4" style={{ color: '#0F1F18' }}>Order summary</h3>

            {totalTickets === 0 ? (
              <p className="text-[13px] text-center py-4" style={{ color: '#C9C3B1' }}>Select tickets above</p>
            ) : (
              <>
                <div className="flex flex-col gap-2 mb-4">
                  {tickets.filter(t => (quantities[t.id] ?? 0) > 0).map(t => (
                    <div key={t.id} className="flex items-center justify-between text-[13px]">
                      <span style={{ color: '#3A4A42' }}>
                        {quantities[t.id]}× {t.name}
                      </span>
                      <span className="font-semibold" style={{ color: '#0F1F18', fontFamily: 'Inter, system-ui, sans-serif' }}>
                        {t.price === 0 ? 'Free' : fmt((quantities[t.id] ?? 0) * t.price, t.currency)}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="flex items-center justify-between pt-3 border-t mb-4"
                  style={{ borderColor: '#E5E0D4' }}>
                  <span className="font-semibold text-[14px]" style={{ color: '#0F1F18' }}>Total</span>
                  <span className="font-display font-bold text-[20px]" style={{ color: '#1F4D3A', letterSpacing: '-0.02em' }}>
                    {totalPrice === 0 ? 'Free' : fmt(totalPrice, primaryCurrency)}
                  </span>
                </div>
              </>
            )}

            <button
              onClick={submit}
              disabled={totalTickets === 0 || submitting || (remaining !== null && remaining <= 0)}
              className="w-full py-3 rounded-2xl text-[14px] font-semibold transition hover:opacity-90 disabled:opacity-40"
              style={{ background: '#1F4D3A', color: '#FAF6EE' }}>
              {submitting ? 'Processing…' : (remaining !== null && remaining <= 0) ? 'Event full' : totalPrice === 0 ? `Register ${totalTickets || ''} seats` : `Pay ${fmt(totalPrice, primaryCurrency)}`}
            </button>

            <p className="text-[11px] text-center mt-3" style={{ color: '#C9C3B1' }}>
              Each attendee receives their own QR ticket by email
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
