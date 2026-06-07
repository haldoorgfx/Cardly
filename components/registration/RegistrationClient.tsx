'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Check, Upload, Sparkles } from 'lucide-react';
import Image from 'next/image';

interface Ticket {
  id: string;
  name: string;
  description: string | null;
  price: number;
  currency: string;
  quantity: number | null;
  quantity_sold: number;
}

interface CanvasVariant {
  backgroundUrl: string;
  backgroundWidth: number | null;
  backgroundHeight: number | null;
}

interface Props {
  eventSlug: string;
  eventId: string;
  eventName: string;
  eventSubtitle: string;
  coverUrl: string | null;
  startsAt: string | null;
  city: string | null;
  tickets: Ticket[];
  canvasVariant: CanvasVariant | null;
}

const INPUT = 'w-full rounded-xl px-4 py-3 text-[15px] outline-none transition border focus:border-[#E8C57E] focus:ring-[3px] focus:ring-[rgba(232,197,126,0.15)]';

function fmt(price: number, currency: string) {
  if (price === 0) return 'Free';
  try {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: currency || 'USD', minimumFractionDigits: 0 }).format(price);
  } catch {
    return `${currency} ${price}`;
  }
}

function dateStr(iso: string | null) {
  if (!iso) return '';
  return new Date(iso).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });
}

export default function RegistrationClient({
  eventSlug, eventId, eventName, eventSubtitle,
  coverUrl, startsAt, city, tickets, canvasVariant,
}: Props) {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(tickets[0] ?? null);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('');
  const [cityVal, setCityVal] = useState('');
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const photoRef = useRef<HTMLInputElement>(null);

  const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  function validateDetails(): Record<string, string> {
    const errs: Record<string, string> = {};
    if (!name.trim()) errs.name = 'Full name is required';
    if (!email.trim()) errs.email = 'Email is required';
    else if (!EMAIL_RE.test(email)) errs.email = 'Enter a valid email address';
    return errs;
  }

  // 3 steps: Ticket → Details → Payment
  const STEPS = ['Ticket', 'Details', 'Payment'];
  const fee = selectedTicket && selectedTicket.price > 0 ? 1.50 : 0;
  const total = (selectedTicket?.price ?? 0) + fee;

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    setPhotoUrl(url);
  };

  const handleSubmit = async () => {
    setSubmitError('');
    setSubmitting(true);
    try {
      const res = await fetch(`/api/events/${eventId}/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-event-slug': eventSlug,
        },
        body: JSON.stringify({
          ticket_type_id: selectedTicket?.id,
          attendee_name: name,
          attendee_email: email,
          custom_fields: { role, city: cityVal },
        }),
      });

      const data = await res.json() as {
        registration_id?: string;
        qr_code_token?: string;
        error?: string;
        payment_required?: boolean;
        redirect_url?: string;
        client_secret?: string;
      };

      if (!res.ok) {
        setSubmitError(data.error ?? 'Registration failed. Please try again.');
        return;
      }

      // Paid ticket with external redirect (Flutterwave etc.)
      if (data.payment_required && data.redirect_url) {
        window.location.href = data.redirect_url;
        return;
      }

      // Free ticket OR Stripe → go to confirm page which handles card generation
      if (data.qr_code_token) {
        router.push(`/e/${eventSlug}/register/confirm?reg=${data.qr_code_token}`);
        return;
      }

      // Fallback
      setSubmitError('Registration created but something went wrong. Check your email for confirmation.');
    } catch {
      setSubmitError('Something went wrong. Check your connection and try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="max-w-[1000px] mx-auto px-10 py-10 pb-20"
      style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 48, alignItems: 'start' }}
    >
      {/* ── Left: form ── */}
      <div>
        {/* Step indicator */}
        <div className="flex items-center gap-2.5 mb-8">
          {STEPS.map((label, i) => (
            <div key={i} className="flex items-center gap-2.5">
              <div className="flex items-center gap-2">
                <div
                  className="w-6 h-6 rounded-full flex items-center justify-center font-mono text-[11px] shrink-0 transition-all"
                  style={{
                    background: i < step ? '#E8EFEB' : i === step ? '#1F4D3A' : 'transparent',
                    border: `1.5px solid ${i <= step ? '#1F4D3A' : '#E5E0D4'}`,
                    color: i === step ? 'white' : i < step ? '#1F4D3A' : '#6B7A72',
                  }}
                >
                  {i < step ? <Check size={10} strokeWidth={2.8} /> : i + 1}
                </div>
                <span className="text-[13px] font-medium hidden sm:block" style={{ color: i <= step ? '#1F4D3A' : '#6B7A72' }}>
                  {label}
                </span>
              </div>
              {i < STEPS.length - 1 && <div className="w-7 h-px" style={{ background: '#E5E0D4' }} />}
            </div>
          ))}
        </div>

        {/* Step 0: Ticket */}
        {step === 0 && (
          <div>
            <h2 className="font-display font-normal text-[28px] mb-1.5" style={{ color: '#1F4D3A', letterSpacing: '-0.02em' }}>
              Choose your ticket
            </h2>
            <p className="text-[14px] mb-6" style={{ color: '#6B7A72' }}>{eventSubtitle}</p>

            {tickets.length === 0 ? (
              <div className="rounded-2xl py-12 text-center text-[14px]" style={{ background: 'white', border: '1px solid #E5E0D4', color: '#6B7A72' }}>
                No tickets available yet.
              </div>
            ) : (
              <div className="space-y-3">
                {tickets.map((t: Ticket) => {
                  const sold = t.quantity !== null && t.quantity_sold >= t.quantity;
                  const isSelected = selectedTicket?.id === t.id;
                  return (
                    <button
                      key={t.id}
                      disabled={sold}
                      onClick={() => setSelectedTicket(t)}
                      className="w-full text-left flex items-center gap-4 p-5 rounded-2xl transition-all"
                      style={{
                        border: `1px solid ${isSelected ? '#1F4D3A' : '#E5E0D4'}`,
                        background: 'white',
                        boxShadow: isSelected ? 'inset 0 0 0 1px #1F4D3A' : 'none',
                        opacity: sold ? 0.5 : 1,
                      }}
                    >
                      <div
                        className="w-5 h-5 rounded-full shrink-0 border-2 transition-all"
                        style={{
                          borderColor: isSelected ? '#1F4D3A' : '#E5E0D4',
                          boxShadow: isSelected ? 'inset 0 0 0 5px #1F4D3A' : 'none',
                        }}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="font-display font-medium text-[16px]" style={{ color: '#0F1F18' }}>{t.name}</div>
                        {t.description && <div className="text-[13px] mt-0.5" style={{ color: '#6B7A72' }}>{t.description}</div>}
                        {sold && <div className="text-[12px] mt-1 font-medium" style={{ color: '#B8423C' }}>Sold out</div>}
                      </div>
                      <div className="font-mono font-medium text-[18px] shrink-0" style={{ color: t.price === 0 ? '#C9A45E' : '#1F4D3A' }}>
                        {fmt(t.price, t.currency)}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Step 1: Details */}
        {step === 1 && (
          <div>
            <h2 className="font-display font-normal text-[28px] mb-1.5" style={{ color: '#1F4D3A', letterSpacing: '-0.02em' }}>
              Your details
            </h2>
            <p className="text-[14px] mb-6" style={{ color: '#6B7A72' }}>
              This is how you&apos;ll appear on the attendee list and your Karta Card.
            </p>

            <div className="space-y-4">
              <div>
                <label className="block text-[12px] mb-1.5" style={{ color: fieldErrors.name ? '#B8423C' : '#6B7A72' }}>Full name</label>
                <input
                  type="text" value={name}
                  onChange={e => { setName(e.target.value); if (fieldErrors.name) setFieldErrors(p => ({ ...p, name: '' })); }}
                  placeholder="Amina Osman" className={INPUT}
                  style={{ borderColor: fieldErrors.name ? '#B8423C' : '#E5E0D4', background: 'white', color: '#0F1F18' }}
                />
                {fieldErrors.name && <p className="text-[12px] mt-1 font-medium" style={{ color: '#B8423C' }}>{fieldErrors.name}</p>}
              </div>
              <div>
                <label className="block text-[12px] mb-1.5" style={{ color: fieldErrors.email ? '#B8423C' : '#6B7A72' }}>Email</label>
                <input
                  type="email" value={email}
                  onChange={e => { setEmail(e.target.value); if (fieldErrors.email) setFieldErrors(p => ({ ...p, email: '' })); }}
                  placeholder="you@example.com" className={INPUT}
                  style={{ borderColor: fieldErrors.email ? '#B8423C' : '#E5E0D4', background: 'white', color: '#0F1F18' }}
                />
                {fieldErrors.email && <p className="text-[12px] mt-1 font-medium" style={{ color: '#B8423C' }}>{fieldErrors.email}</p>}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[12px] mb-1.5" style={{ color: '#6B7A72' }}>Company / role</label>
                  <input type="text" value={role} onChange={e => setRole(e.target.value)} placeholder="Founder, Sahel Pay" className={INPUT} style={{ borderColor: '#E5E0D4', background: 'white', color: '#0F1F18' }} />
                </div>
                <div>
                  <label className="block text-[12px] mb-1.5" style={{ color: '#6B7A72' }}>City</label>
                  <input type="text" value={cityVal} onChange={e => setCityVal(e.target.value)} placeholder="Nairobi" className={INPUT} style={{ borderColor: '#E5E0D4', background: 'white', color: '#0F1F18' }} />
                </div>
              </div>

              <div>
                <label className="block text-[12px] mb-2" style={{ color: '#6B7A72' }}>Add your photo — appears on your Karta Card</label>
                <input ref={photoRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoChange} />
                {photoUrl ? (
                  <div
                    className="rounded-2xl h-36 flex items-center justify-center gap-4 cursor-pointer"
                    style={{ border: '1.5px solid #1F4D3A', background: '#FAF6EE' }}
                    onClick={() => photoRef.current?.click()}
                  >
                    <Image src={photoUrl} alt="Preview" width={80} height={80} className="w-20 h-20 rounded-full object-cover" unoptimized />
                    <span className="text-[13px]" style={{ color: '#1F4D3A' }}>Click to change</span>
                  </div>
                ) : (
                  <div
                    className="rounded-2xl h-36 flex flex-col items-center justify-center gap-2 cursor-pointer transition-colors hover:border-[#E8C57E]"
                    style={{ border: '1.5px dashed #E5E0D4', background: 'white' }}
                    onClick={() => photoRef.current?.click()}
                  >
                    <Upload size={22} color="#6B7A72" />
                    <span className="text-[13px]" style={{ color: '#6B7A72' }}>Click to add your photo</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Payment */}
        {step === 2 && (
          <div>
            <h2 className="font-display font-normal text-[28px] mb-1.5" style={{ color: '#1F4D3A', letterSpacing: '-0.02em' }}>
              Payment
            </h2>
            {total > 0 && (
              <>
                <p className="text-[14px] mb-2" style={{ color: '#6B7A72' }}>
                  Secured by Karta Pay. You won&apos;t be charged until you confirm.
                </p>
                <div className="flex items-center gap-2 mb-6">
                  <span className="w-2 h-2 rounded-full" style={{ background: '#2D7A4F' }} />
                  <span className="font-mono text-[12px]" style={{ color: '#6B7A72' }}>Encrypted · PCI-DSS</span>
                </div>
              </>
            )}

            {total === 0 ? (
              <div className="rounded-2xl p-6 text-center" style={{ background: 'white', border: '1px solid #E5E0D4' }}>
                <div className="font-display font-medium text-[20px] mb-2" style={{ color: '#1F4D3A' }}>Free ticket</div>
                <p className="text-[14px]" style={{ color: '#6B7A72' }}>No payment required. Click confirm to complete registration.</p>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <label className="block text-[12px] mb-1.5" style={{ color: '#6B7A72' }}>Card number</label>
                  <input type="text" placeholder="4242 4242 4242 4242" maxLength={19} className={INPUT} style={{ borderColor: '#E5E0D4', background: 'white', color: '#0F1F18' }} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[12px] mb-1.5" style={{ color: '#6B7A72' }}>Expiry</label>
                    <input type="text" placeholder="MM / YY" maxLength={7} className={INPUT} style={{ borderColor: '#E5E0D4', background: 'white', color: '#0F1F18' }} />
                  </div>
                  <div>
                    <label className="block text-[12px] mb-1.5" style={{ color: '#6B7A72' }}>CVC</label>
                    <input type="text" placeholder="123" maxLength={4} className={INPUT} style={{ borderColor: '#E5E0D4', background: 'white', color: '#0F1F18' }} />
                  </div>
                </div>
                <div>
                  <label className="block text-[12px] mb-1.5" style={{ color: '#6B7A72' }}>Name on card</label>
                  <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Amina Osman" className={INPUT} style={{ borderColor: '#E5E0D4', background: 'white', color: '#0F1F18' }} />
                </div>
              </div>
            )}
          </div>
        )}

        {/* Nav buttons */}
        <div className="mt-8">
          {submitError && (
            <div className="mb-4 px-4 py-3 rounded-xl text-[13px] font-medium" style={{ background: '#FEF2F2', color: '#B8423C', border: '1px solid #FECACA' }}>
              {submitError}
            </div>
          )}
          <div className="flex items-center justify-between">
            <button
              onClick={() => setStep(s => s - 1)}
              className="px-5 py-2.5 rounded-xl font-medium text-[14px] transition-colors"
              style={{ visibility: step === 0 ? 'hidden' : 'visible', background: '#E8EFEB', color: '#1F4D3A' }}
            >
              ← Back
            </button>

            {step < 2 ? (
              <button
                onClick={() => {
                  if (step === 1) {
                    const errs = validateDetails();
                    if (Object.keys(errs).length > 0) { setFieldErrors(errs); return; }
                  }
                  setStep(s => s + 1);
                }}
                disabled={step === 0 && !selectedTicket}
                className="ml-auto px-6 py-2.5 rounded-xl font-medium text-[14px] text-white disabled:opacity-50"
                style={{ background: '#1F4D3A' }}
              >
                Continue →
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={submitting}
                className="ml-auto px-6 py-2.5 rounded-xl font-medium text-[14px] text-white disabled:opacity-50"
                style={{ background: '#1F4D3A' }}
              >
                {submitting ? 'Confirming…' : 'Confirm registration'}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ── Right: order summary + card teaser ── */}
      <aside className="sticky" style={{ top: 88 }}>
        <div className="rounded-2xl p-6" style={{ background: 'white', border: '1px solid #E5E0D4', boxShadow: '0 1px 2px rgba(15,31,24,0.04), 0 8px 24px rgba(15,31,24,0.06)' }}>
          {/* Event mini */}
          <div className="flex items-center gap-3 pb-4 mb-1" style={{ borderBottom: '1px solid #E5E0D4' }}>
            {coverUrl ? (
              <Image src={coverUrl} alt={eventName} width={48} height={48} className="w-12 h-12 rounded-xl object-cover shrink-0" unoptimized />
            ) : (
              <div className="w-12 h-12 rounded-xl shrink-0" style={{ background: 'linear-gradient(135deg, #1F4D3A, #2A6A50)' }} />
            )}
            <div>
              <div className="font-display font-medium text-[15px]" style={{ color: '#0F1F18' }}>{eventName}</div>
              {(startsAt || city) && (
                <div className="font-mono text-[12px] mt-0.5" style={{ color: '#6B7A72' }}>
                  {startsAt ? dateStr(startsAt) : ''}{city ? ` · ${city}` : ''}
                </div>
              )}
            </div>
          </div>

          {selectedTicket && (
            <>
              <div className="flex justify-between py-2.5 text-[14px]" style={{ color: '#3A4A42' }}>
                <span>{selectedTicket.name}</span>
                <span className="font-mono" style={{ color: '#0F1F18' }}>{fmt(selectedTicket.price, selectedTicket.currency)}</span>
              </div>
              {fee > 0 && (
                <div className="flex justify-between py-2.5 text-[14px]" style={{ color: '#3A4A42' }}>
                  <span>Service fee</span>
                  <span className="font-mono" style={{ color: '#0F1F18' }}>{fmt(fee, selectedTicket.currency)}</span>
                </div>
              )}
              <div className="flex justify-between items-baseline pt-3 mt-1" style={{ borderTop: '1px solid #E5E0D4' }}>
                <span className="font-display font-medium text-[15px]" style={{ color: '#0F1F18' }}>Total</span>
                <span className="font-mono font-medium text-[22px]" style={{ color: '#1F4D3A' }}>{fmt(total, selectedTicket.currency)}</span>
              </div>
            </>
          )}

          {/* Card teaser — shown at payment step */}
          {step === 2 && (
            <div className="mt-5 pt-4" style={{ borderTop: '1px solid #E5E0D4' }}>
              <div className="text-[11px] font-semibold uppercase tracking-wider mb-3 text-center" style={{ color: '#6B7A72' }}>
                Your Karta Card
              </div>
              {canvasVariant?.backgroundUrl ? (
                /* Real organizer design */
                <div className="rounded-xl overflow-hidden" style={{ border: '1px solid #E5E0D4', boxShadow: '0 2px 8px rgba(15,31,24,0.06)' }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={canvasVariant.backgroundUrl} alt="Event card design" className="w-full h-auto block" />
                  <div className="px-3 py-2 text-center text-[11px]" style={{ color: '#6B7A72', background: '#FAFAF8' }}>
                    Personalised with your details after registration
                  </div>
                </div>
              ) : (
                /* No canvas design yet — show generic indicator */
                <div
                  className="rounded-xl p-4 flex items-center gap-3"
                  style={{ background: 'rgba(31,77,58,0.05)', border: '1px solid rgba(31,77,58,0.15)' }}
                >
                  <Sparkles size={16} style={{ color: '#1F4D3A', flexShrink: 0 }} />
                  <div>
                    <div className="text-[13px] font-medium" style={{ color: '#1F4D3A' }}>Karta Card included</div>
                    <div className="text-[11px] mt-0.5" style={{ color: '#6B7A72' }}>Personalised card generated after registration</div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </aside>

      <style>{`
        @media (max-width: 900px) {
          .reg-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
}
