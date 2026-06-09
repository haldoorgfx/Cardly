'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Check, Upload, Sparkles, ArrowRight, ShieldCheck, Ticket } from 'lucide-react';
import Image from 'next/image';
import type { Zone } from '@/types/database';
import EventCardPreview from '@/app/c/[slug]/components/EventCardPreview';
import EventBrandStrip from '@/app/c/[slug]/components/EventBrandStrip';

interface TicketType {
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
  zones: Zone[];
}

interface Props {
  eventSlug: string;
  eventId: string;
  eventName: string;
  eventSubtitle: string;
  coverUrl: string | null;
  startsAt: string | null;
  city: string | null;
  tickets: TicketType[];
  canvasVariant: CanvasVariant | null;
  initialName?: string;
  initialEmail?: string;
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

/** Map form values to zone values based on label similarity */
function buildZoneValues(
  zones: Zone[],
  name: string,
  role: string,
  photoUrl: string | null,
): { values: Record<string, string>; photoUrls: Record<string, string> } {
  const values: Record<string, string> = {};
  const photoUrls: Record<string, string> = {};

  for (const zone of zones) {
    if (zone.hidden) continue;
    const label = (zone.label ?? '').toLowerCase();

    if (zone.type === 'photo') {
      if (photoUrl) photoUrls[zone.id] = photoUrl;
      continue;
    }

    if (zone.type === 'text' || zone.type === 'custom') {
      if (label.includes('name')) {
        if (name) values[zone.id] = name;
      } else if (
        label.includes('role') || label.includes('title') || label.includes('job') ||
        label.includes('company') || label.includes('org')
      ) {
        if (role) values[zone.id] = role;
      }
    }
  }

  return { values, photoUrls };
}

// â”€â”€ Arrival Screen (step -1) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function ArrivalStep({
  eventName,
  canvasVariant,
  onStart,
}: {
  eventName: string;
  canvasVariant: CanvasVariant | null;
  onStart: () => void;
}) {
  const demoValues = canvasVariant
    ? Object.fromEntries(
        canvasVariant.zones
          .filter(z => (z.type === 'text' || z.type === 'custom') && !z.hidden)
          .map(z => [z.id, z.placeholder ?? z.label ?? '']),
      )
    : {};

  return (
    <div
      className="relative min-h-screen overflow-hidden"
      style={{ background: '#FAF6EE', fontFamily: 'Inter, sans-serif', color: '#0F1F18' }}
    >
      {/* Decorative blobs */}
      <div className="pointer-events-none absolute" style={{
        width: 320, height: 320, top: 40, right: -80,
        borderRadius: '50%', background: '#E8EFEB',
        filter: 'blur(48px)', opacity: 0.9,
      }}/>
      <div className="pointer-events-none absolute" style={{
        width: 260, height: 260, bottom: -60, left: -60,
        borderRadius: '50%', background: 'rgba(232,197,126,0.32)',
        filter: 'blur(48px)',
      }}/>

      {/* â”€â”€ Mobile / tablet: single column â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <div className="relative z-10 flex flex-col lg:hidden">
        <div className="px-5 pt-5">
          <EventBrandStrip eventName={eventName} compact />
        </div>

        {canvasVariant && (
          <div className="mt-5 px-5 flex justify-center">
            <div
              className="w-full max-w-[320px]"
              style={{ animation: 'cardFloat 4s ease-in-out infinite' }}
            >
              <EventCardPreview
                backgroundUrl={canvasVariant.backgroundUrl}
                backgroundWidth={canvasVariant.backgroundWidth ?? 1200}
                backgroundHeight={canvasVariant.backgroundHeight ?? 800}
                zones={canvasVariant.zones}
                values={demoValues}
                photoUrls={{}}
                style={{
                  borderRadius: 18,
                  boxShadow: '0 4px 12px rgba(15,31,24,0.08), 0 24px 60px rgba(31,77,58,0.12)',
                }}
              />
            </div>
          </div>
        )}

        <div className="mt-6 px-5">
          <h1 style={{
            fontFamily: 'DM Sans, sans-serif',
            fontWeight: 700, fontSize: 28, lineHeight: 1.15,
            letterSpacing: '-0.02em', margin: 0, color: '#0F1F18',
          }}>
            Register &amp; get your personalized card
          </h1>
          <p style={{
            fontFamily: 'Inter, sans-serif',
            fontSize: 15, lineHeight: 1.55,
            color: '#3A4A42', margin: '8px 0 16px',
          }}>
            Get your ticket + a personalized badge to share everywhere.
          </p>
          <div className="flex flex-col gap-2">
            {[
              { icon: <Ticket size={13} strokeWidth={2} />, text: 'Event ticket with QR check-in' },
              { icon: <Sparkles size={13} strokeWidth={2} />, text: 'Personalized Karta Card badge' },
              { icon: <ShieldCheck size={13} strokeWidth={2} />, text: 'Download & share in seconds' },
            ].map(item => (
              <div key={item.text} className="flex items-center gap-2" style={{ color: '#3A4A42', fontSize: 14 }}>
                <span style={{ color: '#1F4D3A' }}>{item.icon}</span>
                {item.text}
              </div>
            ))}
          </div>
        </div>

        <div className="flex-1" style={{ minHeight: 24 }}/>

        <div className="px-5 pb-8 pt-4 flex flex-col gap-3 mt-auto">
          <button
            onClick={onStart}
            className="w-full flex items-center justify-center gap-2.5 transition-transform active:scale-[0.98]"
            style={{
              height: 56, padding: '0 24px',
              background: '#1F4D3A', color: '#FAF6EE',
              border: 'none', borderRadius: 14,
              fontFamily: 'Inter, sans-serif', fontWeight: 600, fontSize: 16,
              boxShadow: '0 1px 2px rgba(15,31,24,0.04), 0 8px 24px rgba(31,77,58,0.18)',
              cursor: 'pointer',
            }}
          >
            <span>Register &amp; get my card</span>
            <ArrowRight size={18} strokeWidth={2}/>
          </button>

          <div style={{
            fontFamily: 'Inter, system-ui, sans-serif',
            fontSize: 11, color: '#6B7A72',
            letterSpacing: '0.04em', textAlign: 'center',
          }}>
            powered by <span style={{ color: '#0F1F18', fontWeight: 500 }}>karta</span>
          </div>
        </div>
      </div>

      {/* â”€â”€ Desktop: two-column â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <div className="relative z-10 hidden lg:flex flex-col" style={{ minHeight: '100vh' }}>
        <div className="px-10 pt-6 flex items-center justify-between gap-6">
          <div style={{ flex: '0 1 460px', minWidth: 0 }}>
            <EventBrandStrip eventName={eventName} compact />
          </div>
          <div style={{
            fontFamily: 'Inter, system-ui, sans-serif',
            fontSize: 11, color: '#6B7A72', letterSpacing: '0.04em',
          }}>
            powered by <span style={{ color: '#0F1F18', fontWeight: 500 }}>karta</span>
          </div>
        </div>

        <div
          className="flex-1 mx-auto w-full grid items-center"
          style={{
            maxWidth: 1200,
            padding: '0 40px',
            gridTemplateColumns: '60% 40%',
            gap: 56,
          }}
        >
          {/* Left: card hero */}
          {canvasVariant ? (
            <div className="flex items-center justify-center">
              <div
                style={{
                  maxWidth: 480, width: '100%',
                  animation: 'cardFloat 4s ease-in-out infinite',
                }}
              >
                <EventCardPreview
                  backgroundUrl={canvasVariant.backgroundUrl}
                  backgroundWidth={canvasVariant.backgroundWidth ?? 1200}
                  backgroundHeight={canvasVariant.backgroundHeight ?? 800}
                  zones={canvasVariant.zones}
                  values={demoValues}
                  photoUrls={{}}
                  style={{
                    borderRadius: 20,
                    boxShadow: '0 4px 12px rgba(15,31,24,0.08), 0 24px 60px rgba(31,77,58,0.12)',
                  }}
                />
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center">
              <div
                className="rounded-2xl"
                style={{
                  width: 360, height: 240,
                  background: 'linear-gradient(135deg, #1F4D3A 0%, #2A6A50 60%, #E8C57E 100%)',
                  opacity: 0.15,
                }}
              />
            </div>
          )}

          {/* Right: copy + CTA */}
          <div className="flex flex-col gap-7" style={{ maxWidth: 420 }}>
            <div className="inline-flex self-start items-center gap-2 px-3 py-1.5" style={{
              background: '#E8EFEB', color: '#1F4D3A', borderRadius: 999,
              fontFamily: 'Inter, system-ui, sans-serif',
              fontSize: 11, letterSpacing: '0.08em', textTransform: 'uppercase',
            }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#1F4D3A' }}/>
              You&apos;re invited
            </div>

            <h1 style={{
              fontFamily: 'DM Sans, sans-serif',
              fontWeight: 700, fontSize: 48, lineHeight: 1.05,
              letterSpacing: '-0.03em', margin: 0, color: '#0F1F18',
            }}>
              Register &amp; get your personalized card.
            </h1>

            <div className="flex flex-col gap-2.5">
              {[
                { icon: <Ticket size={15} strokeWidth={2} />, text: 'Event ticket with QR check-in' },
                { icon: <Sparkles size={15} strokeWidth={2} />, text: 'Personalized Karta Card badge' },
                { icon: <ShieldCheck size={15} strokeWidth={2} />, text: 'Download & share in seconds' },
              ].map(item => (
                <div key={item.text} className="flex items-center gap-2.5" style={{ color: '#3A4A42', fontSize: 16 }}>
                  <span style={{ color: '#1F4D3A' }}>{item.icon}</span>
                  {item.text}
                </div>
              ))}
            </div>

            <button
              onClick={onStart}
              className="inline-flex items-center gap-2.5 transition-transform active:scale-[0.98]"
              style={{
                height: 56, padding: '0 28px',
                background: '#1F4D3A', color: '#FAF6EE',
                border: 'none', borderRadius: 14,
                fontFamily: 'Inter, sans-serif', fontWeight: 600, fontSize: 16,
                boxShadow: '0 1px 2px rgba(15,31,24,0.04), 0 8px 24px rgba(31,77,58,0.18)',
                cursor: 'pointer', alignSelf: 'flex-start',
              }}
            >
              <span>Register &amp; get my card</span>
              <ArrowRight size={18} strokeWidth={2}/>
            </button>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes cardFloat {
          0%, 100% { transform: translateY(0px); }
          50%       { transform: translateY(-8px); }
        }
      `}</style>
    </div>
  );
}

// â”€â”€ Main RegistrationClient â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
/** Pick the best default ticket: skip sold-out and invitation-only, prefer non-VIP */
function pickDefaultTicket(tickets: TicketType[]): TicketType | null {
  const available = tickets.filter(t => !(t.quantity !== null && t.quantity_sold >= t.quantity));
  if (available.length === 0) return tickets[0] ?? null;
  const notInvite = available.filter(t => {
    const combined = `${t.name ?? ''} ${t.description ?? ''}`.toLowerCase();
    return !combined.includes('invitation only') && !combined.includes('invite only') && !combined.includes('speaker') && !combined.includes('vip');
  });
  return (notInvite[0] ?? available[0]) ?? null;
}

export default function RegistrationClient({
  eventSlug, eventId, eventName, eventSubtitle,
  coverUrl, startsAt, city, tickets, canvasVariant,
  initialName = '', initialEmail = '',
}: Props) {
  const router = useRouter();
  // step -1 = arrival, 0 = ticket, 1 = details, 2 = payment
  const [step, setStep] = useState<-1 | 0 | 1 | 2>(-1);
  const [selectedTicket, setSelectedTicket] = useState<TicketType | null>(() => pickDefaultTicket(tickets));
  const [name, setName] = useState(initialName);
  const [email, setEmail] = useState(initialEmail);
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

  // 3 form steps: Ticket â†’ Details â†’ Payment
  const STEPS = ['Ticket', 'Details', 'Payment'];
  // 3.5% platform fee, rounded to 2 decimal places
  const fee = selectedTicket && selectedTicket.price > 0
    ? Math.round(selectedTicket.price * 0.035 * 100) / 100
    : 0;
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

      if (data.payment_required && data.redirect_url) {
        window.location.href = data.redirect_url;
        return;
      }

      if (data.qr_code_token) {
        router.push(`/e/${eventSlug}/register/confirm?reg=${data.qr_code_token}`);
        return;
      }

      setSubmitError('Registration created but something went wrong. Check your email for confirmation.');
    } catch {
      setSubmitError('Something went wrong. Check your connection and try again.');
    } finally {
      setSubmitting(false);
    }
  };

  // â”€â”€ Arrival screen â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  if (step === -1) {
    return (
      <ArrivalStep
        eventName={eventName}
        canvasVariant={canvasVariant}
        onStart={() => setStep(0)}
      />
    );
  }

  // â”€â”€ Build live card preview values from current form state â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const { values: previewValues, photoUrls: previewPhotoUrls } = canvasVariant
    ? buildZoneValues(canvasVariant.zones, name, role, photoUrl)
    : { values: {}, photoUrls: {} };

  return (
    <div className="min-h-screen" style={{ background: '#FAF6EE' }}>
      <div
        className="max-w-[1100px] mx-auto px-5 py-8 pb-20"
        style={{ display: 'grid', gridTemplateColumns: canvasVariant ? '1fr 340px' : '1fr', gap: 48, alignItems: 'start' }}
      >
        {/* â”€â”€ Left: form â”€â”€ */}
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
                  {tickets.map((t: TicketType) => {
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
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                onClick={() => {
                  if (step === 0) setStep(-1);
                  else setStep(s => (s - 1) as -1 | 0 | 1 | 2);
                }}
                className="px-5 py-2.5 rounded-xl font-medium text-[14px] transition-colors"
                style={{ background: '#E8EFEB', color: '#1F4D3A' }}
              >
                â† Back
              </button>

              {step < 2 ? (
                <button
                  onClick={() => {
                    if (step === 1) {
                      const errs = validateDetails();
                      if (Object.keys(errs).length > 0) { setFieldErrors(errs); return; }
                    }
                    setStep(s => (s + 1) as -1 | 0 | 1 | 2);
                  }}
                  disabled={step === 0 && !selectedTicket}
                  className="ml-auto px-6 py-2.5 rounded-xl font-medium text-[14px] text-white disabled:opacity-50"
                  style={{ background: '#1F4D3A' }}
                >
                  Continue â†’
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

        {/* â”€â”€ Right: order summary + live card preview â”€â”€ */}
        {canvasVariant && (
          <aside className="sticky hidden lg:block" style={{ top: 88 }}>
            {/* Live card preview */}
            <div className="mb-4">
              <div className="text-[11px] font-semibold uppercase tracking-wider mb-3" style={{ color: '#6B7A72', fontFamily: 'Inter, system-ui, sans-serif' }}>
                Your Karta Card
              </div>
              <EventCardPreview
                backgroundUrl={canvasVariant.backgroundUrl}
                backgroundWidth={canvasVariant.backgroundWidth ?? 1200}
                backgroundHeight={canvasVariant.backgroundHeight ?? 800}
                zones={canvasVariant.zones}
                values={previewValues}
                photoUrls={previewPhotoUrls}
                style={{
                  borderRadius: 16,
                  boxShadow: '0 4px 12px rgba(15,31,24,0.08), 0 16px 40px rgba(31,77,58,0.10)',
                }}
              />
              {step === 1 && (
                <p className="text-[11px] mt-2 text-center" style={{ color: '#6B7A72' }}>
                  Preview updates as you type
                </p>
              )}
            </div>

            {/* Order summary */}
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
          </aside>
        )}

        {/* No canvas variant: show order summary only */}
        {!canvasVariant && (
          <aside className="sticky hidden lg:block" style={{ top: 88 }}>
            <div className="rounded-2xl p-6" style={{ background: 'white', border: '1px solid #E5E0D4', boxShadow: '0 1px 2px rgba(15,31,24,0.04), 0 8px 24px rgba(15,31,24,0.06)' }}>
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

                  {/* Card teaser — shown at payment step when no canvas variant */}
                  {step === 2 && (
                    <div className="mt-5 pt-4" style={{ borderTop: '1px solid #E5E0D4' }}>
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
                    </div>
                  )}
                </>
              )}
            </div>
          </aside>
        )}
      </div>
    </div>
  );
}
