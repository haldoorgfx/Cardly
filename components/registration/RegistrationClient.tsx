'use client';

import { useState, useRef } from 'react';
import { Check, Upload } from 'lucide-react';
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

interface Props {
  eventSlug: string;
  eventId: string;
  eventName: string;
  eventSubtitle: string;
  coverUrl: string | null;
  startsAt: string | null;
  city: string | null;
  tickets: Ticket[];
}

const ACCENTS = [
  { gradient: 'linear-gradient(135deg,#1F4D3A,#0D1F17)', label: 'Forest' },
  { gradient: 'linear-gradient(135deg,#3a2a55,#14101f)', label: 'Midnight' },
  { gradient: 'linear-gradient(135deg,#5a3320,#1f120c)', label: 'Amber' },
  { gradient: 'linear-gradient(135deg,#1e3a55,#0c1420)', label: 'Ocean' },
];

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
  coverUrl, startsAt, city, tickets,
}: Props) {
  const [step, setStep] = useState(0);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(tickets[0] ?? null);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('');
  const [cityVal, setCityVal] = useState('');
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [accent, setAccent] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [done, setDone] = useState(false);
  const [regId, setRegId] = useState<string | null>(null);
  const photoRef = useRef<HTMLInputElement>(null);

  const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  function validateDetails(): Record<string, string> {
    const errs: Record<string, string> = {};
    if (!name.trim()) errs.name = 'Full name is required';
    if (!email.trim()) errs.email = 'Email is required';
    else if (!EMAIL_RE.test(email)) errs.email = 'Enter a valid email address';
    return errs;
  }

  const STEPS = ['Ticket', 'Details', 'Payment', 'Your card'];
  const fee = selectedTicket && selectedTicket.price > 0 ? 1.50 : 0; // $1.50 service fee
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
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ticket_type_id: selectedTicket?.id,
          attendee_name: name,
          attendee_email: email,
          custom_fields: { role, city: cityVal, accent: String(accent) },
        }),
      });
      const data = await res.json() as { registration_id?: string; error?: string };
      if (!res.ok) {
        setSubmitError(data.error ?? 'Registration failed. Please try again.');
        return;
      }
      if (data.registration_id) setRegId(data.registration_id);
      setDone(true);
    } catch {
      setSubmitError('Something went wrong. Check your connection and try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (done) {
    const eventUrl = `https://karta.cre8so.com/e/${eventSlug}`;
    const shareText = `I'm attending ${eventName}! Join me →`;
    const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText + ' ' + eventUrl)}`;
    const linkedinUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(eventUrl)}`;
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(shareText + ' ' + eventUrl)}`;

    return (
      <div
        className="reg-success-grid max-w-[820px] mx-auto px-6 py-12"
        style={{ display: 'grid', gridTemplateColumns: '1fr 260px', gap: 48, alignItems: 'start' }}
      >
        {/* ── Left: confirmation + share ── */}
        <div>
          <div className="w-14 h-14 rounded-full flex items-center justify-center mb-5" style={{ background: '#E8EFEB' }}>
            <Check size={26} strokeWidth={2.5} color="#1F4D3A" />
          </div>
          <h2 className="font-display font-normal text-[30px] mb-3" style={{ color: '#1F4D3A', letterSpacing: '-0.02em' }}>
            You&apos;re registered!
          </h2>
          <p className="text-[15px] mb-2" style={{ color: '#6B7A72' }}>
            A confirmation has been sent to <strong style={{ color: '#0F1F18' }}>{email}</strong>.
          </p>
          <p className="text-[15px] mb-8" style={{ color: '#6B7A72' }}>
            See you at {eventName}.
          </p>

          {/* Share your card */}
          <div className="mb-5">
            <p className="text-[13px] font-semibold uppercase tracking-wider mb-3" style={{ color: '#6B7A72' }}>
              Share your Karta Card
            </p>
            <div className="flex gap-2 flex-wrap">
              <a
                href={twitterUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-[13px] font-medium transition hover:opacity-80"
                style={{ background: '#0F1F18', color: 'white' }}
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.734-8.85L1.254 2.25H8.08l4.253 5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
                Post on X
              </a>
              <a
                href={linkedinUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-[13px] font-medium transition hover:opacity-80"
                style={{ background: '#0A66C2', color: 'white' }}
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
                Share on LinkedIn
              </a>
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-[13px] font-medium transition hover:opacity-80"
                style={{ background: '#25D366', color: 'white' }}
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                WhatsApp
              </a>
            </div>
          </div>

          <p className="text-[12px] mb-8" style={{ color: '#6B7A72' }}>
            💡 Screenshot your Karta Card and post it on social media to spread the word!
          </p>

          <a
            href={`/e/${eventSlug}`}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-medium text-[15px] text-white transition hover:opacity-90"
            style={{ background: '#1F4D3A' }}
          >
            Go to event →
          </a>
        </div>

        {/* ── Right: Karta Card preview ── */}
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wider text-center mb-3" style={{ color: '#6B7A72' }}>
            Your Karta Card
          </p>
          <div
            className="w-full rounded-2xl overflow-hidden relative"
            style={{ aspectRatio: '5/7', background: ACCENTS[accent].gradient }}
          >
            <div className="absolute inset-0 p-5 flex flex-col">
              <div className="font-display font-semibold text-[11px] tracking-wider" style={{ color: '#E8C57E' }}>
                {eventName.toUpperCase()}
              </div>
              <div className="flex-1 flex flex-col items-center justify-center">
                {photoUrl ? (
                  <Image src={photoUrl} alt="" width={80} height={80} className="w-20 h-20 rounded-full object-cover border-2 mb-3" style={{ borderColor: '#E8C57E' }} unoptimized />
                ) : (
                  <div className="w-20 h-20 rounded-full border-2 mb-3 flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.08)', borderColor: '#E8C57E' }}>
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="rgba(232,197,126,0.5)" strokeWidth="1.5"><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/></svg>
                  </div>
                )}
                <div className="font-display font-medium text-[20px] text-white text-center leading-tight">
                  {name || 'Your Name'}
                </div>
                <div className="font-mono text-[11px] mt-1 text-center" style={{ color: '#E8C57E' }}>
                  {role || eventSubtitle}
                </div>
              </div>
              <div className="font-mono text-[10px] text-center" style={{ color: 'rgba(255,255,255,0.4)' }}>
                KARTA
              </div>
            </div>
          </div>
        </div>

        {/* Mobile: stack */}
        <style>{`@media(max-width:640px){.reg-success-grid{grid-template-columns:1fr!important}}`}</style>
      </div>
    );
  }

  return (
    <div
      className="max-w-[1000px] mx-auto px-10 py-10 pb-20"
      style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 48, alignItems: 'start' }}
    >
      {/* Left: form */}
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

        {/* Step 1: Ticket */}
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
                {tickets.map(t => {
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
                      <div
                        className="font-mono font-medium text-[18px] shrink-0"
                        style={{ color: t.price === 0 ? '#C9A45E' : '#1F4D3A' }}
                      >
                        {fmt(t.price, t.currency)}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Step 2: Details */}
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
                  type="text"
                  value={name}
                  onChange={e => { setName(e.target.value); if (fieldErrors.name) setFieldErrors(p => ({ ...p, name: '' })); }}
                  placeholder="Amina Osman"
                  className={INPUT}
                  style={{ borderColor: fieldErrors.name ? '#B8423C' : '#E5E0D4', background: 'white', color: '#0F1F18' }}
                />
                {fieldErrors.name && <p className="text-[12px] mt-1 font-medium" style={{ color: '#B8423C' }}>{fieldErrors.name}</p>}
              </div>
              <div>
                <label className="block text-[12px] mb-1.5" style={{ color: fieldErrors.email ? '#B8423C' : '#6B7A72' }}>Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={e => { setEmail(e.target.value); if (fieldErrors.email) setFieldErrors(p => ({ ...p, email: '' })); }}
                  placeholder="you@example.com"
                  className={INPUT}
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

        {/* Step 3: Payment */}
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

        {/* Step 4: Card personalization */}
        {step === 3 && (
          <div>
            <h2 className="font-display font-normal text-[28px] mb-1.5" style={{ color: '#1F4D3A', letterSpacing: '-0.02em' }}>
              Personalize your card
            </h2>
            <p className="text-[14px] mb-6" style={{ color: '#6B7A72' }}>
              Pick an accent. Your Karta Card generates the moment you confirm.
            </p>
            <div className="flex gap-3 mb-6">
              {ACCENTS.map((a, i) => (
                <button
                  key={i}
                  onClick={() => setAccent(i)}
                  className="w-9 h-9 rounded-full border-2 transition-all"
                  style={{
                    background: a.gradient,
                    borderColor: accent === i ? '#0F1F18' : 'transparent',
                  }}
                  title={a.label}
                />
              ))}
            </div>
            <p className="text-[13px] max-w-[380px]" style={{ color: '#6B7A72' }}>
              The gold frame, your name and ticket tier are locked to the {eventName} template. Everything else is yours.
            </p>
          </div>
        )}

        {/* Nav */}
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
            {step < 3 ? (
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

      {/* Right: summary + live card preview */}
      <aside className="sticky" style={{ top: 88 }}>
        {step < 3 ? (
          /* Order summary */
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
          </div>
        ) : (
          /* Live card preview */
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-wider text-center mb-4" style={{ color: '#6B7A72' }}>
              Live preview
            </div>
            <div
              className="w-full rounded-2xl overflow-hidden relative"
              style={{ aspectRatio: '5/7', background: ACCENTS[accent].gradient }}
            >
              <div className="absolute inset-0 p-6 flex flex-col">
                <div className="font-display font-semibold text-[13px] tracking-wider" style={{ color: '#E8C57E' }}>
                  {eventName.toUpperCase()}
                </div>
                <div className="flex-1 flex flex-col items-center justify-center">
                  {photoUrl ? (
                    <Image src={photoUrl} alt="" width={92} height={92} className="w-24 h-24 rounded-full object-cover border-2 mb-4" style={{ borderColor: '#E8C57E' }} unoptimized />
                  ) : (
                    <div className="w-24 h-24 rounded-full border-2 mb-4 flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.08)', borderColor: '#E8C57E' }}>
                      <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="rgba(232,197,126,0.45)" strokeWidth="1.5"><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/></svg>
                    </div>
                  )}
                  <div className="font-display font-medium text-[24px] text-white text-center">
                    {name || 'Your Name'}
                  </div>
                  <div className="font-mono text-[12px] mt-1 text-center" style={{ color: '#E8C57E' }}>
                    {role || 'Your Role'}
                  </div>
                </div>
                <div className="font-mono text-[11px] text-center" style={{ color: 'rgba(255,255,255,0.5)' }}>
                  KARTA
                </div>
              </div>
            </div>
          </div>
        )}
      </aside>

      {/* Responsive */}
      <style>{`
        @media (max-width: 900px) {
          .reg-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
}
