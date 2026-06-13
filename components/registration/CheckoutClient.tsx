'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { CreditCard, Smartphone, ChevronLeft } from 'lucide-react';

interface Ticket { id: string; name: string; price: number; currency: string | null }

interface Props {
  eventName: string;
  eventSlug: string;
  coverImage: string | null;
  startsAt: string | null;
  venueName: string | null;
  city: string | null;
  tickets: Ticket[];
}

const PAYMENT_METHODS = [
  { id: 'card', label: 'Card', desc: 'Visa, Mastercard — via Stripe', badges: ['VISA', 'MC'], icon: CreditCard },
  { id: 'mobile', label: 'Mobile money', desc: 'M-Pesa, Airtel, MTN — via Flutterwave', badges: ['M-PESA'], icon: Smartphone },
];

function fmtDateTime(iso: string) {
  return new Date(iso).toLocaleDateString('en', { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }).toUpperCase();
}

const HOLD_SECONDS = 10 * 60;

export function CheckoutClient({ eventName, eventSlug, coverImage, startsAt, venueName, city, tickets }: Props) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [method, setMethod] = useState('card');
  const [cardNum, setCardNum] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvc, setCvc] = useState('');
  const [promo, setPromo] = useState('');
  const [seconds, setSeconds] = useState(HOLD_SECONDS);
  const [submitting, setSubmitting] = useState(false);

  const ticket = tickets[0]; // Use first visible ticket for demo
  const ticketPrice = ticket?.price ?? 20;
  const platformFee = Math.round(ticketPrice * 0.06 * 100) / 100;
  const total = ticketPrice + platformFee;

  useEffect(() => {
    const t = setInterval(() => setSeconds(s => (s > 0 ? s - 1 : 0)), 1000);
    return () => clearInterval(t);
  }, []);

  const mins = Math.floor(seconds / 60).toString().padStart(2, '0');
  const secs = (seconds % 60).toString().padStart(2, '0');

  function handlePay(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setTimeout(() => setSubmitting(false), 2000);
  }

  return (
    <div style={{ background: '#FAF6EE', minHeight: '100vh' }}>
      {/* Header */}
      <div className="px-5 py-4 border-b flex items-center justify-between" style={{ background: '#FFFFFF', borderColor: '#E5E0D4' }}>
        <Link href={`/e/${eventSlug}`} className="flex items-center gap-1.5 text-[13px] font-medium transition hover:opacity-70"
          style={{ color: '#6B7A72', textDecoration: 'none' }}>
          <ChevronLeft size={15} /> {eventName}
        </Link>
        {seconds > 0 && (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full text-[12px] font-semibold"
            style={{ background: '#FDF6E3', border: '1px solid #EDD98A', color: seconds < 60 ? '#B8423C' : '#8B6914' }}>
            Tickets held for <span className="font-mono">{mins}:{secs}</span>
          </div>
        )}
      </div>

      <div className="max-w-4xl mx-auto px-5 py-8">
        <h1 className="font-display font-bold text-[26px] mb-6" style={{ color: '#0F1F18', letterSpacing: '-0.025em' }}>
          Checkout
        </h1>

        <form onSubmit={handlePay}>
          <div className="flex flex-col lg:flex-row gap-6">
            {/* Left: Form */}
            <div className="flex-1 space-y-5">
              {/* Step 1: Your details */}
              <div className="rounded-2xl p-5" style={{ background: '#FFFFFF', border: '1px solid #E5E0D4' }}>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-mono font-bold"
                    style={{ background: '#1F4D3A', color: '#FAF6EE' }}>1</div>
                  <h2 className="font-semibold text-[15px]" style={{ color: '#0F1F18' }}>Your details</h2>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[12px] font-semibold mb-1.5" style={{ color: '#6B7A72' }}>Full name</label>
                    <input value={name} onChange={e => setName(e.target.value)} required
                      placeholder="Amina Osman"
                      className="w-full px-4 py-3 rounded-xl text-[14px] outline-none"
                      style={{ background: '#FAF6EE', border: '1px solid #E5E0D4', color: '#0F1F18' }} />
                  </div>
                  <div>
                    <label className="block text-[12px] font-semibold mb-1.5" style={{ color: '#6B7A72' }}>Email</label>
                    <input value={email} onChange={e => setEmail(e.target.value)} required type="email"
                      placeholder="amina@example.com"
                      className="w-full px-4 py-3 rounded-xl text-[14px] outline-none"
                      style={{ background: '#FAF6EE', border: '1px solid #E5E0D4', color: '#0F1F18' }} />
                  </div>
                </div>
                <div className="mt-3 flex items-center justify-between px-4 py-3 rounded-xl"
                  style={{ background: '#E8EFEB', border: '1px solid #C9E0D4' }}>
                  <div className="flex items-center gap-2 text-[12px]" style={{ color: '#3A4A42' }}>
                    <span>📱</span> Ticket + Karta Card to WhatsApp too
                  </div>
                </div>
              </div>

              {/* Step 2: Payment */}
              <div className="rounded-2xl p-5" style={{ background: '#FFFFFF', border: '1px solid #E5E0D4' }}>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-mono font-bold"
                    style={{ background: '#1F4D3A', color: '#FAF6EE' }}>2</div>
                  <h2 className="font-semibold text-[15px]" style={{ color: '#0F1F18' }}>Payment</h2>
                </div>
                <div className="space-y-2">
                  {PAYMENT_METHODS.map(pm => {
                    const Icon = pm.icon;
                    const active = method === pm.id;
                    return (
                      <label key={pm.id} className="flex items-center gap-3 px-4 py-3 rounded-xl cursor-pointer transition"
                        style={{
                          background: active ? '#E8EFEB' : '#FAF6EE',
                          border: `1px solid ${active ? '#1F4D3A' : '#E5E0D4'}`,
                        }}>
                        <input type="radio" name="payment" value={pm.id} checked={active} onChange={() => setMethod(pm.id)} className="sr-only" />
                        <Icon size={16} style={{ color: active ? '#1F4D3A' : '#6B7A72', flexShrink: 0 }} />
                        <div className="flex-1">
                          <div className="font-semibold text-[13px]" style={{ color: '#0F1F18' }}>{pm.label}</div>
                          <div className="text-[12px]" style={{ color: '#6B7A72' }}>{pm.desc}</div>
                        </div>
                        <div className="flex gap-1">
                          {pm.badges.map(b => (
                            <span key={b} className="px-1.5 py-0.5 rounded text-[9px] font-bold"
                              style={{ background: '#E5E0D4', color: '#6B7A72' }}>{b}</span>
                          ))}
                        </div>
                      </label>
                    );
                  })}
                </div>

                {method === 'card' && (
                  <div className="mt-3 space-y-3">
                    <div>
                      <label className="block text-[12px] font-semibold mb-1.5" style={{ color: '#6B7A72' }}>Card number</label>
                      <input value={cardNum} onChange={e => setCardNum(e.target.value)}
                        placeholder="4242 4242 4242 4242"
                        className="w-full px-4 py-3 rounded-xl text-[14px] outline-none font-mono"
                        style={{ background: '#FAF6EE', border: '1px solid #E5E0D4', color: '#0F1F18' }} />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[12px] font-semibold mb-1.5" style={{ color: '#6B7A72' }}>Expiry</label>
                        <input value={expiry} onChange={e => setExpiry(e.target.value)}
                          placeholder="08 / 28"
                          className="w-full px-4 py-3 rounded-xl text-[14px] outline-none font-mono"
                          style={{ background: '#FAF6EE', border: '1px solid #E5E0D4', color: '#0F1F18' }} />
                      </div>
                      <div>
                        <label className="block text-[12px] font-semibold mb-1.5" style={{ color: '#6B7A72' }}>CVC</label>
                        <input value={cvc} onChange={e => setCvc(e.target.value)}
                          placeholder="•••" maxLength={4}
                          className="w-full px-4 py-3 rounded-xl text-[14px] outline-none font-mono"
                          style={{ background: '#FAF6EE', border: '1px solid #E5E0D4', color: '#0F1F18' }} />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Right: Order summary */}
            <div className="w-full lg:w-72 lg:shrink-0">
              <div className="lg:sticky lg:top-5 rounded-2xl p-5" style={{ background: '#FFFFFF', border: '1px solid #E5E0D4' }}>
                <h2 className="font-semibold text-[15px] mb-4" style={{ color: '#0F1F18' }}>Order summary</h2>

                {/* Event */}
                <div className="flex items-center gap-3 mb-4 pb-4 border-b" style={{ borderColor: '#E5E0D4' }}>
                  <div className="w-16 h-12 rounded-xl shrink-0 overflow-hidden"
                    style={{ background: 'linear-gradient(135deg, #1F4D3A, #2A6A50)' }}>
                    {coverImage && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={coverImage} alt="" className="w-full h-full object-cover" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <div className="font-semibold text-[13px] truncate" style={{ color: '#0F1F18' }}>{eventName}</div>
                    {(startsAt || venueName || city) && (
                      <div className="text-[10px] font-mono mt-0.5" style={{ color: '#6B7A72' }}>
                        {startsAt ? fmtDateTime(startsAt) : ''}
                        {(venueName || city) && ` · ${venueName ?? city}`}
                      </div>
                    )}
                  </div>
                </div>

                {/* Line items */}
                <div className="space-y-2 mb-4 pb-4 border-b" style={{ borderColor: '#E5E0D4' }}>
                  {ticket ? (
                    <div className="flex items-center justify-between text-[13px]">
                      <span style={{ color: '#3A4A42' }}>{ticket.name} × 1</span>
                      <span className="font-title font-semibold" style={{ color: '#0F1F18' }}>${ticketPrice.toFixed(2)}</span>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between text-[13px]">
                      <span style={{ color: '#3A4A42' }}>General × 1</span>
                      <span className="font-title font-semibold" style={{ color: '#0F1F18' }}>$20.00</span>
                    </div>
                  )}
                  <div className="flex items-center justify-between text-[12px]" style={{ color: '#6B7A72' }}>
                    <span>Platform fee</span>
                    <span className="font-title font-medium">${platformFee.toFixed(2)}</span>
                  </div>
                </div>

                {/* Promo */}
                <div className="flex gap-2 mb-4">
                  <input value={promo} onChange={e => setPromo(e.target.value)}
                    placeholder="Promo code"
                    className="flex-1 px-3 py-2 rounded-xl text-[13px] outline-none"
                    style={{ background: '#FAF6EE', border: '1px dashed #E5E0D4', color: '#0F1F18' }} />
                  <button type="button" className="px-3 py-2 rounded-xl text-[12px] font-semibold border transition hover:opacity-80"
                    style={{ borderColor: '#1F4D3A', color: '#1F4D3A' }}>
                    Apply
                  </button>
                </div>

                {/* Total */}
                <div className="flex items-center justify-between mb-4">
                  <span className="font-bold text-[15px]" style={{ color: '#0F1F18' }}>Total</span>
                  <span className="font-title font-bold text-[18px]" style={{ color: '#C9A45E' }}>
                    ${total.toFixed(2)}
                  </span>
                </div>

                <button type="submit" disabled={submitting}
                  className="w-full py-3.5 rounded-xl text-[14px] font-semibold transition hover:opacity-90 disabled:opacity-50"
                  style={{ background: '#E8C57E', color: '#0F1F18' }}>
                  {submitting ? 'Processing…' : `Pay $${total.toFixed(2)}`}
                </button>
                <p className="text-[11px] text-center mt-3" style={{ color: '#C9C3B1', lineHeight: 1.4 }}>
                  PCI-DSS compliant · refunds per the organizer&rsquo;s policy
                </p>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
