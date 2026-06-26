'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronLeft, ChevronRight, Check } from 'lucide-react';
import { CardZoneFill } from './CardZoneFill';
import { PhotoCropModal } from './PhotoCropModal';
import { StripePaymentStep } from './StripePaymentStep';
import { WaafiPayStep } from './WaafiPayStep';
import type { Database, Zone } from '@/types/database';

type TicketRow = Database['public']['Tables']['ticket_types']['Row'];
type FieldRow = Database['public']['Tables']['registration_form_fields']['Row'];
type EventPageRow = Database['public']['Tables']['event_pages']['Row'];

interface Variant {
  id: string;
  zones: Zone[];
  background_url: string | null;
  background_width: number | null;
  background_height: number | null;
}

interface Props {
  eventSlug: string;
  eventId: string;
  page: EventPageRow;
  tickets: TicketRow[];
  formFields: FieldRow[];
  variant: Variant | null;
  preselectedTicketId?: string;
}

type CropTarget = { zone: Zone; srcUrl: string; file: File };

export function RegistrationFlow({ eventSlug, eventId, page, tickets, formFields, variant, preselectedTicketId }: Props) {
  const router = useRouter();

  const [step, setStep] = useState(0);
  const [selectedTicketId, setSelectedTicketId] = useState(preselectedTicketId ?? tickets[0]?.id ?? '');

  // Access code unlock
  const [accessCodeInput, setAccessCodeInput] = useState('');
  const [accessCodeVisible, setAccessCodeVisible] = useState(false);
  const [accessCodeError, setAccessCodeError] = useState('');
  const [unlocking, setUnlocking] = useState(false);
  const [unlockedTickets, setUnlockedTickets] = useState<TicketRow[]>([]);

  // PWYW
  const [chosenPrice, setChosenPrice] = useState<string>('');

  // Step 1 — personal details
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [customFieldValues, setCustomFieldValues] = useState<Record<string, string>>({});

  // Step 2 (paid) — payment state (shared across processors)
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [pendingRegId, setPendingRegId] = useState<string | null>(null);
  const [pendingRegToken, setPendingRegToken] = useState<string | null>(null);
  const [paymentAmount, setPaymentAmount] = useState(0);
  const [paymentCurrency, setPaymentCurrency] = useState('USD');
  const [paymentProcessor, setPaymentProcessor] = useState<'stripe' | 'flutterwave' | 'waafipay' | 'free'>('stripe');
  const [creatingPayment, setCreatingPayment] = useState(false);

  // Step 2 (free) — card zones
  const [zoneValues, setZoneValues] = useState<Record<string, string>>({});
  const [photoFiles, setPhotoFiles] = useState<Record<string, File>>({});
  const [photoUrls, setPhotoUrls] = useState<Record<string, string>>({});
  const [cropTarget, setCropTarget] = useState<CropTarget | null>(null);

  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [zoneErrors, setZoneErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const visibleTickets = [...tickets.filter(t => t.is_visible), ...unlockedTickets];
  const selectedTicket = visibleTickets.find(t => t.id === selectedTicketId);
  const isPWYW = !!(selectedTicket?.min_price && selectedTicket.min_price > 0);
  const effectivePrice = isPWYW ? (parseFloat(chosenPrice) || 0) : (selectedTicket?.price ?? 0);
  const isPaid = effectivePrice > 0;
  const isSoldOut = (t: TicketRow) => t.quantity !== null && t.quantity_sold >= t.quantity;

  // Dynamic steps: paid = Ticket/Details/Payment/Your card (4), free = Ticket/Details/Your card (3)
  const STEPS = isPaid
    ? [{ label: 'Ticket' }, { label: 'Details' }, { label: 'Payment' }, { label: 'Your card' }]
    : [{ label: 'Ticket' }, { label: 'Details' }, { label: 'Your card' }];

  // -- Validation -----------------------------------------------
  function validateDetails(): boolean {
    const errs: Record<string, string> = {};
    if (!name.trim()) errs['name'] = 'Name is required';
    if (!email.trim()) errs['email'] = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) errs['email'] = 'Enter a valid email';
    for (const f of formFields) {
      if (f.is_required && !customFieldValues[f.id]?.trim()) {
        errs[f.id] = `${f.label} is required`;
      }
    }
    setFieldErrors(errs);
    return Object.keys(errs).length === 0;
  }

  function validateZones(): boolean {
    if (!variant) return true;
    const errs: Record<string, string> = {};
    for (const z of variant.zones) {
      if (!z.required) continue;
      if (z.type === 'photo') {
        if (!photoFiles[z.id]) errs[z.id] = 'Photo is required';
      } else if (z.type === 'text' || z.type === 'custom') {
        if (!zoneValues[z.id]?.trim()) errs[z.id] = `${z.label ?? 'This field'} is required`;
      }
    }
    setZoneErrors(errs);
    return Object.keys(errs).length === 0;
  }

  // -- Access code unlock ----------------------------------------
  async function handleUnlock() {
    if (!accessCodeInput.trim()) return;
    setUnlocking(true);
    setAccessCodeError('');
    try {
      const res = await fetch(`/api/events/${eventId}/unlock`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: accessCodeInput.trim() }),
      });
      const data = await res.json();
      if (!data.tickets?.length) {
        setAccessCodeError('No tickets found for this code.');
      } else {
        setUnlockedTickets(data.tickets as TicketRow[]);
        setSelectedTicketId(data.tickets[0].id);
        setAccessCodeVisible(false);
      }
    } catch {
      setAccessCodeError('Could not verify code. Try again.');
    } finally {
      setUnlocking(false);
    }
  }

  // -- Navigation -----------------------------------------------
  async function handleNext() {
    if (step === 1) {
      if (!validateDetails()) return;

      if (isPaid && selectedTicket) {
        // Paid: create registration + PaymentIntent now so we have a clientSecret
        setCreatingPayment(true);
        setSubmitError('');
        try {
          const res = await fetch(`/api/events/${eventId}/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              attendee_name: name.trim(),
              attendee_email: email.trim().toLowerCase(),
              attendee_phone: phone.trim() || undefined,
              ticket_type_id: selectedTicketId,
              custom_fields: customFieldValues,
              ...(unlockedTickets.find(t => t.id === selectedTicketId) ? { access_code: accessCodeInput.trim() } : {}),
              ...(isPWYW ? { chosen_price: parseFloat(chosenPrice) || 0 } : {}),
            }),
          });
          const data = await res.json();
          if (!res.ok) {
            setSubmitError(data.detail ?? data.error ?? 'Registration failed');
            return;
          }

          // Flutterwave: redirect immediately
          if (data.payment_processor === 'flutterwave' && data.redirect_url) {
            window.location.href = data.redirect_url;
            return;
          }

          setPaymentProcessor(data.payment_processor ?? 'stripe');
          setClientSecret(data.client_secret ?? null);
          setPendingRegId(data.registration_id);
          setPendingRegToken(data.qr_code_token);
          setPaymentAmount(data.amount ?? 0);
          setPaymentCurrency(data.currency ?? 'USD');
        } catch {
          setSubmitError('Could not set up payment. Please try again.');
          return;
        } finally {
          setCreatingPayment(false);
        }
      }
    }

    setStep(s => Math.min(s + 1, STEPS.length - 1));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function handleBack() {
    setStep(s => Math.max(s - 1, 0));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  // -- Photo crop -----------------------------------------------
  const handlePhotoSelect = useCallback((zone: Zone, file: File, srcUrl: string) => {
    setCropTarget({ zone, srcUrl, file });
  }, []);

  const handleCropConfirm = useCallback((file: File, previewUrl: string) => {
    if (!cropTarget) return;
    setPhotoFiles(p => ({ ...p, [cropTarget.zone.id]: file }));
    setPhotoUrls(p => ({ ...p, [cropTarget.zone.id]: previewUrl }));
    setCropTarget(null);
  }, [cropTarget]);

  const handlePhotoClear = useCallback((zoneId: string) => {
    setPhotoFiles(p => { const n = { ...p }; delete n[zoneId]; return n; });
    setPhotoUrls(p => { const n = { ...p }; delete n[zoneId]; return n; });
  }, []);

  // -- Submit ---------------------------------------------------
  async function handleSubmit() {
    if (!validateZones()) return;
    setSubmitting(true);
    setSubmitError('');

    try {
      // 1. Create registration
      const regRes = await fetch(`/api/events/${eventId}/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          attendee_name: name.trim(),
          attendee_email: email.trim().toLowerCase(),
          attendee_phone: phone.trim() || undefined,
          ticket_type_id: selectedTicketId,
          custom_fields: customFieldValues,
          ...(unlockedTickets.find(t => t.id === selectedTicketId) ? { access_code: accessCodeInput.trim() } : {}),
        }),
      });
      const regData = await regRes.json();
      if (!regRes.ok) {
        const msg = regData.detail ?? regData.error ?? 'Registration failed';
        setSubmitError(msg === 'TICKET_SOLD_OUT' ? 'Sorry, this ticket just sold out.' : msg);
        setSubmitting(false);
        return;
      }

      const { registration_id, qr_code_token, variant_id } = regData as {
        registration_id: string;
        qr_code_token: string;
        variant_id: string | null;
      };

      const useVariantId = variant_id ?? variant?.id;

      // 2. Generate card (if variant available)
      if (useVariantId) {
        const fd = new FormData();
        fd.append('variantId', useVariantId);

        // Pre-populate name zone: find first text zone and use attendee name if empty
        const enrichedZoneValues = { ...zoneValues };
        if (variant?.zones) {
          const firstTextZone = variant.zones.find(z => z.type === 'text' && !z.hidden);
          if (firstTextZone && !enrichedZoneValues[firstTextZone.id]) {
            enrichedZoneValues[firstTextZone.id] = name.trim();
          }
        }
        fd.append('fields', JSON.stringify(enrichedZoneValues));
        // No idempotency key for the flow-time preview render — it's best-effort.
        // ConfirmPage uses registration.id (valid UUID) as its idempotency key.
        fd.append('registrationId', registration_id);
        for (const [zoneId, file] of Object.entries(photoFiles)) {
          fd.append(`photo_${zoneId}`, file);
        }

        const renderRes = await fetch('/api/render', { method: 'POST', body: fd });
        if (renderRes.ok) {
          const cardId = renderRes.headers.get('x-card-id');
          // Only send PATCH if cardId is available; otherwise the render API already
          // updated eventera_card_url directly via registrationId.
          if (cardId) {
            fetch(`/api/events/${eventId}/registrations`, {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                registrationId: registration_id,
                eventera_card_zone_data: enrichedZoneValues,
                eventera_card_url: `/c/${eventSlug}/card/${cardId}`,
              }),
            }).catch(() => {});
          }

          // Store card blob in sessionStorage for immediate download on confirm page
          const blob = await renderRes.blob();
          const cardDataUrl = await blobToDataUrl(blob);
          try {
            sessionStorage.setItem(`card_${qr_code_token}`, cardDataUrl);
          } catch {
            // sessionStorage might be full — ignore
          }
        }
        // If render fails, we still proceed — the user has their QR code
      }

      // 3. Redirect to confirm page
      router.push(`/e/${eventSlug}/register/confirm?reg=${qr_code_token}`);
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
      setSubmitting(false);
    }
  }

  // -- Summary sidebar ------------------------------------------
  const summaryTicket = selectedTicket;

  return (
    <div style={{ background: '#FAF6EE', minHeight: '100vh' }}>
      <div className="max-w-[960px] mx-auto px-4 sm:px-6 pt-8 pb-32">

        {/* Step indicator */}
        <div className="flex items-center justify-center mb-10">
          {STEPS.map((s, i) => (
            <div key={i} className="flex items-center">
              <div className="flex flex-col items-center">
                <div
                  className="h-7 w-7 rounded-full flex items-center justify-center text-[12px] font-semibold transition"
                  style={{
                    background: i < step ? '#1F4D3A' : i === step ? '#1F4D3A' : 'white',
                    color: i <= step ? 'white' : '#6B7A72',
                    border: i > step ? '1.5px solid #E5E0D4' : 'none',
                  }}
                >
                  {i < step ? <Check size={13} strokeWidth={2.5} /> : i + 1}
                </div>
                <div
                  className="text-[11px] font-medium mt-1 hidden sm:block"
                  style={{ color: i === step ? '#1F4D3A' : '#6B7A72' }}
                >
                  {s.label}
                </div>
              </div>
              {i < STEPS.length - 1 && (
                <div
                  className="h-px w-12 sm:w-20 mx-1 sm:mx-2"
                  style={{ background: i < step ? '#1F4D3A' : '#E5E0D4' }}
                />
              )}
            </div>
          ))}
        </div>

        {/* Main grid */}
        <div className="flex flex-col lg:grid gap-6 lg:gap-8" style={{ gridTemplateColumns: 'minmax(0,1fr) 300px' }}>
          {/* -- Form area -- */}
          <div>
            {/* Step 0 — Ticket selection */}
            {step === 0 && (
              <div>
                <h2 className="font-display font-semibold text-[22px] mb-2" style={{ color: '#0F1F18', letterSpacing: '-0.015em' }}>
                  Choose your ticket
                </h2>
                <p className="text-[14px] mb-6" style={{ color: '#6B7A72' }}>{page.title}</p>
                <div className="space-y-3">
                  {visibleTickets.map(t => {
                    const sold = isSoldOut(t);
                    const sel = selectedTicketId === t.id;
                    const remaining = t.quantity !== null ? t.quantity - t.quantity_sold : null;
                    return (
                      <button
                        key={t.id}
                        disabled={sold}
                        onClick={() => !sold && setSelectedTicketId(t.id)}
                        className="w-full text-left flex items-start gap-3 p-4 rounded-xl transition"
                        style={{
                          border: sel ? '2px solid #1F4D3A' : '1px solid #E5E0D4',
                          background: sel ? 'rgba(31,77,58,0.04)' : 'white',
                          opacity: sold ? 0.5 : 1,
                          cursor: sold ? 'not-allowed' : 'pointer',
                        }}
                      >
                        <div
                          className="mt-0.5 shrink-0 rounded-full flex items-center justify-center"
                          style={{
                            width: 20, height: 20,
                            border: sel ? '1.5px solid #1F4D3A' : '1.5px solid #C9C3B1',
                            background: sel ? '#1F4D3A' : 'transparent',
                          }}
                        >
                          {sel && <div className="w-2.5 h-2.5 rounded-full bg-white" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-[15px] font-medium" style={{ color: sold ? '#6B7A72' : '#0F1F18' }}>
                              {t.name}
                            </span>
                            <span
                              className="text-[15px] font-medium shrink-0"
                              style={{ fontFamily: 'Inter, system-ui, sans-serif', color: t.price === 0 ? '#2D7A4F' : '#1F4D3A' }}
                            >
                              {sold ? 'Sold out' : t.min_price ? `${t.currency} ${t.min_price}+` : t.price === 0 ? 'Free' : `${t.currency} ${t.price}`}
                            </span>
                          </div>
                          {t.description && <div className="text-[13px] mt-1" style={{ color: '#6B7A72' }}>{t.description}</div>}
                          {remaining !== null && !sold && remaining <= 20 && (
                            <div className="text-[12px] mt-1" style={{ color: '#C97A2D' }}>{remaining} left</div>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>

                {/* PWYW price input */}
                {isPWYW && selectedTicket && (
                  <div className="mt-4 p-4 rounded-xl" style={{ background: 'white', border: '1px solid #E5E0D4' }}>
                    <label className="block text-[13px] font-medium mb-2" style={{ color: '#0F1F18' }}>
                      Choose your amount ({selectedTicket.currency})
                    </label>
                    <div className="flex items-center gap-2">
                      <span className="text-[15px] font-medium" style={{ color: '#6B7A72' }}>{selectedTicket.currency}</span>
                      <input
                        type="number"
                        min={selectedTicket.min_price ?? 0}
                        step="1"
                        value={chosenPrice}
                        onChange={e => setChosenPrice(e.target.value)}
                        placeholder={String(selectedTicket.min_price ?? 0)}
                        className="flex-1 h-10 px-3 rounded-lg text-[15px] outline-none transition"
                        style={{ background: '#FAF6EE', border: '1px solid #E5E0D4', color: '#0F1F18', fontFamily: 'Inter, system-ui, sans-serif' }}
                        onFocus={e => (e.target.style.borderColor = '#E8C57E')}
                        onBlur={e => (e.target.style.borderColor = '#E5E0D4')}
                      />
                    </div>
                    <p className="text-[12px] mt-1" style={{ color: '#6B7A72' }}>Minimum: {selectedTicket.currency} {selectedTicket.min_price}</p>
                  </div>
                )}

                {/* Access code unlock */}
                {!accessCodeVisible && unlockedTickets.length === 0 && (
                  <button
                    onClick={() => setAccessCodeVisible(true)}
                    className="mt-4 text-[13px]"
                    style={{ color: '#6B7A72', textDecoration: 'underline', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                  >
                    Have an access code?
                  </button>
                )}
                {accessCodeVisible && (
                  <div className="mt-4 p-4 rounded-xl" style={{ background: 'white', border: '1px solid #E5E0D4' }}>
                    <label className="block text-[13px] font-medium mb-2" style={{ color: '#0F1F18' }}>Access code</label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={accessCodeInput}
                        onChange={e => setAccessCodeInput(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && handleUnlock()}
                        placeholder="Enter code"
                        autoFocus
                        className="flex-1 h-10 px-3 rounded-lg text-[14px] outline-none transition"
                        style={{ background: '#FAF6EE', border: `1px solid ${accessCodeError ? '#B8423C' : '#E5E0D4'}`, color: '#0F1F18' }}
                        onFocus={e => (e.target.style.borderColor = '#E8C57E')}
                        onBlur={e => (e.target.style.borderColor = accessCodeError ? '#B8423C' : '#E5E0D4')}
                      />
                      <button
                        onClick={handleUnlock}
                        disabled={unlocking || !accessCodeInput.trim()}
                        className="h-10 px-4 rounded-lg text-[14px] font-medium transition"
                        style={{ background: '#1F4D3A', color: 'white', opacity: (unlocking || !accessCodeInput.trim()) ? 0.6 : 1 }}
                      >
                        {unlocking ? '…' : 'Unlock'}
                      </button>
                    </div>
                    {accessCodeError && <p className="text-[12px] mt-1" style={{ color: '#B8423C' }}>{accessCodeError}</p>}
                  </div>
                )}
                {unlockedTickets.length > 0 && (
                  <div className="mt-3 flex items-center gap-2 text-[13px]" style={{ color: '#2D7A4F' }}>
                    <span>✓</span><span>Access code applied — {unlockedTickets.length} ticket{unlockedTickets.length !== 1 ? 's' : ''} unlocked</span>
                  </div>
                )}
              </div>
            )}

            {/* Step 1 — Details */}
            {step === 1 && (
              <div>
                <h2 className="font-display font-semibold text-[22px] mb-2" style={{ color: '#0F1F18', letterSpacing: '-0.015em' }}>
                  Your details
                </h2>
                <p className="text-[14px] mb-6" style={{ color: '#6B7A72' }}>
                  These will appear on your ticket and Eventera Card.
                </p>
                <div className="space-y-4">
                  <RField label="Full name *" error={fieldErrors['name']}>
                    <input
                      type="text" value={name} onChange={e => setName(e.target.value)}
                      placeholder="Amina Osman" autoFocus
                      className="w-full h-10 px-3 rounded-lg text-[14px] outline-none transition"
                      style={{ background: 'white', border: `1px solid ${fieldErrors['name'] ? '#B8423C' : '#E5E0D4'}`, color: '#0F1F18' }}
                      onFocus={e => (e.target.style.borderColor = '#E8C57E')}
                      onBlur={e => (e.target.style.borderColor = fieldErrors['name'] ? '#B8423C' : '#E5E0D4')}
                    />
                  </RField>
                  <RField label="Email *" error={fieldErrors['email']}>
                    <input
                      type="email" value={email} onChange={e => setEmail(e.target.value)}
                      placeholder="amina@example.com"
                      className="w-full h-10 px-3 rounded-lg text-[14px] outline-none transition"
                      style={{ background: 'white', border: `1px solid ${fieldErrors['email'] ? '#B8423C' : '#E5E0D4'}`, color: '#0F1F18' }}
                      onFocus={e => (e.target.style.borderColor = '#E8C57E')}
                      onBlur={e => (e.target.style.borderColor = fieldErrors['email'] ? '#B8423C' : '#E5E0D4')}
                    />
                  </RField>
                  <RField label="Phone number">
                    <input
                      type="tel" value={phone} onChange={e => setPhone(e.target.value)}
                      placeholder="+254 712 345 678"
                      className="w-full h-10 px-3 rounded-lg text-[14px] outline-none transition"
                      style={{ background: 'white', border: '1px solid #E5E0D4', color: '#0F1F18' }}
                      onFocus={e => (e.target.style.borderColor = '#E8C57E')}
                      onBlur={e => (e.target.style.borderColor = '#E5E0D4')}
                    />
                  </RField>
                  {formFields.map(f => (
                    <CustomFieldInput
                      key={f.id}
                      field={f}
                      value={customFieldValues[f.id] ?? ''}
                      error={fieldErrors[f.id]}
                      onChange={v => setCustomFieldValues(p => ({ ...p, [f.id]: v }))}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Step 2 — Payment (paid) or Card personalisation (free) */}
            {step === 2 && isPaid && pendingRegToken && (
              <>
                {paymentProcessor === 'stripe' && clientSecret && (
                  <StripePaymentStep
                    clientSecret={clientSecret}
                    returnUrl={`${typeof window !== 'undefined' ? window.location.origin : ''}/e/${eventSlug}/register/confirm?reg=${pendingRegToken}`}
                    amount={paymentAmount}
                    currency={paymentCurrency}
                    eventTitle={page.title}
                    ticketName={selectedTicket?.name ?? 'Ticket'}
                  />
                )}
                {paymentProcessor === 'waafipay' && pendingRegId && (
                  <WaafiPayStep
                    registrationId={pendingRegId}
                    qrToken={pendingRegToken}
                    amount={paymentAmount}
                    currency={paymentCurrency}
                    eventTitle={page.title}
                    ticketName={selectedTicket?.name ?? 'Ticket'}
                    onSuccess={(token) => router.push(`/e/${eventSlug}/register/confirm?reg=${token}`)}
                  />
                )}
                {paymentProcessor === 'flutterwave' && (
                  <div className="text-center py-8">
                    <svg className="animate-spin mx-auto mb-3" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#1F4D3A" strokeWidth="2.5">
                      <path d="M21 12a9 9 0 1 1-9-9" strokeLinecap="round" />
                    </svg>
                    <p className="text-[14px]" style={{ color: '#6B7A72' }}>Redirecting to Flutterwave…</p>
                  </div>
                )}
              </>
            )}

            {step === 2 && !isPaid && (
              <div>
                <h2 className="font-display font-semibold text-[22px] mb-2" style={{ color: '#0F1F18', letterSpacing: '-0.015em' }}>
                  Personalise your card
                </h2>
                <p className="text-[14px] mb-6" style={{ color: '#6B7A72' }}>
                  Your Eventera Card is generated after you confirm. Share it anywhere.
                </p>
                {variant ? (
                  <CardZoneFill
                    zones={variant.zones}
                    values={zoneValues}
                    photoUrls={photoUrls}
                    errors={zoneErrors}
                    onChange={(id, v) => setZoneValues(p => ({ ...p, [id]: v }))}
                    onPhotoSelect={handlePhotoSelect}
                    onPhotoClear={handlePhotoClear}
                    backgroundUrl={variant.background_url}
                    backgroundWidth={variant.background_width}
                    backgroundHeight={variant.background_height}
                  />
                ) : (
                  <div
                    className="rounded-xl p-6 text-center"
                    style={{ background: 'white', border: '1px solid #E5E0D4' }}
                  >
                    <div className="text-[14px]" style={{ color: '#6B7A72' }}>
                      The organiser hasn&apos;t set up a card design yet. You&apos;ll still get a QR code for check-in.
                    </div>
                  </div>
                )}
                {submitError && (
                  <div
                    className="mt-4 px-4 py-3 rounded-xl text-[14px]"
                    style={{ background: 'rgba(184,66,60,0.08)', color: '#B8423C', border: '1px solid rgba(184,66,60,0.2)' }}
                  >
                    {submitError}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* -- Summary sidebar -- */}
          <div className="hidden lg:block">
            <div
              className="rounded-2xl p-5 sticky"
              style={{ top: 88, background: 'white', border: '1px solid #E5E0D4', boxShadow: '0 1px 2px rgba(15,31,24,0.04)' }}
            >
              {/* Event mini */}
              <div className="flex items-start gap-3 pb-4" style={{ borderBottom: '1px solid #E5E0D4' }}>
                <div
                  className="w-12 h-12 rounded-lg shrink-0 overflow-hidden"
                  style={{ background: 'linear-gradient(135deg, #1F4D3A, #2A6A50)' }}
                >
                  {page.cover_image_url && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={page.cover_image_url} alt="" className="w-full h-full object-cover" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-[14px] leading-snug" style={{ color: '#0F1F18' }}>{page.title}</div>
                  <div className="text-[12px] mt-0.5" style={{ color: '#6B7A72', fontFamily: 'Inter, system-ui, sans-serif' }}>
                    {new Date(page.starts_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                  </div>
                </div>
              </div>

              {/* Ticket + price */}
              {summaryTicket && (
                <div className="pt-4 space-y-3">
                  <SumRow label="Ticket" value={summaryTicket.name} />
                  <SumRow label="Price" value={summaryTicket.price === 0 ? 'Free' : `${summaryTicket.currency} ${summaryTicket.price}`} mono />
                </div>
              )}

              {/* Attendee (once filled) */}
              {name && (
                <div className="pt-3 mt-3" style={{ borderTop: '1px solid #E5E0D4' }}>
                  <SumRow label="Attendee" value={name} />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* -- Bottom nav bar — hidden on paid step 2 (Stripe has its own submit) -- */}
        {!(step === 2 && isPaid) && (
          <div
            className="fixed bottom-0 left-0 right-0 flex items-center justify-between gap-4 px-4 sm:px-6 py-4 z-30"
            style={{ background: 'white', borderTop: '1px solid #E5E0D4', boxShadow: '0 -4px 16px rgba(15,31,24,0.06)' }}
          >
            <button
              onClick={handleBack}
              className={`flex items-center gap-1.5 h-11 px-4 rounded-xl text-[14px] font-medium border transition ${step === 0 ? 'invisible' : ''}`}
              style={{ borderColor: '#E5E0D4', color: '#3A4A42' }}
            >
              <ChevronLeft size={16} strokeWidth={2} />
              Back
            </button>

            {step < STEPS.length - 1 ? (
              <button
                onClick={handleNext}
                disabled={creatingPayment}
                className="flex items-center gap-1.5 h-11 px-6 rounded-xl text-white text-[14px] font-semibold transition hover:opacity-90 disabled:opacity-60"
                style={{ background: '#1F4D3A' }}
              >
                {creatingPayment ? (
                  <>
                    <svg className="animate-spin" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <path d="M21 12a9 9 0 1 1-9-9" strokeLinecap="round" />
                    </svg>
                    Setting up…
                  </>
                ) : (
                  <>Continue <ChevronRight size={16} strokeWidth={2} /></>
                )}
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={submitting}
                className="flex items-center gap-2 h-11 px-6 rounded-xl text-white text-[15px] font-semibold transition hover:opacity-90 disabled:opacity-60"
                style={{ background: '#1F4D3A' }}
              >
                {submitting ? (
                  <>
                    <svg className="animate-spin" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <path d="M21 12a9 9 0 1 1-9-9" strokeLinecap="round" />
                    </svg>
                    Generating your card…
                  </>
                ) : (
                  'Confirm & get my card ->'
                )}
              </button>
            )}
          </div>
        )}
      </div>

      {/* Photo crop modal */}
      {cropTarget && (
        <PhotoCropModal
          target={cropTarget}
          onConfirm={handleCropConfirm}
          onCancel={() => setCropTarget(null)}
        />
      )}
    </div>
  );
}

// -- Helper components ------------------------------------------

function RField({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-[12px] font-medium mb-1.5" style={{ color: '#3A4A42' }}>{label}</label>
      {children}
      {error && <p className="text-[12px] mt-1" style={{ color: '#B8423C' }}>{error}</p>}
    </div>
  );
}

function CustomFieldInput({ field, value, error, onChange }: {
  field: FieldRow;
  value: string;
  error?: string;
  onChange: (v: string) => void;
}) {
  const label = `${field.label}${field.is_required ? ' *' : ''}`;
  const opts = Array.isArray(field.options) ? field.options as string[] : [];

  if (field.field_type === 'select' && opts.length) {
    return (
      <RField label={label} error={error}>
        <select
          value={value} onChange={e => onChange(e.target.value)}
          className="w-full h-10 px-3 rounded-lg text-[14px] outline-none transition"
          style={{ background: 'white', border: `1px solid ${error ? '#B8423C' : '#E5E0D4'}`, color: value ? '#0F1F18' : '#6B7A72' }}
        >
          <option value="">Select…</option>
          {opts.map(o => <option key={o} value={o}>{o}</option>)}
        </select>
      </RField>
    );
  }
  if (field.field_type === 'textarea') {
    return (
      <RField label={label} error={error}>
        <textarea
          value={value} onChange={e => onChange(e.target.value)}
          rows={3}
          className="w-full px-3 py-2.5 rounded-lg text-[14px] outline-none resize-none transition"
          style={{ background: 'white', border: `1px solid ${error ? '#B8423C' : '#E5E0D4'}`, color: '#0F1F18' }}
          onFocus={e => (e.target.style.borderColor = '#E8C57E')}
          onBlur={e => (e.target.style.borderColor = error ? '#B8423C' : '#E5E0D4')}
        />
      </RField>
    );
  }
  return (
    <RField label={label} error={error}>
      <input
        type={field.field_type === 'phone' ? 'tel' : field.field_type === 'url' ? 'url' : 'text'}
        value={value} onChange={e => onChange(e.target.value)}
        className="w-full h-10 px-3 rounded-lg text-[14px] outline-none transition"
        style={{ background: 'white', border: `1px solid ${error ? '#B8423C' : '#E5E0D4'}`, color: '#0F1F18' }}
        onFocus={e => (e.target.style.borderColor = '#E8C57E')}
        onBlur={e => (e.target.style.borderColor = error ? '#B8423C' : '#E5E0D4')}
      />
    </RField>
  );
}

function SumRow({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-2 text-[13px]">
      <span style={{ color: '#6B7A72' }}>{label}</span>
      <span
        style={{ color: '#0F1F18', fontFamily: mono ? 'Inter, system-ui, sans-serif' : undefined, fontWeight: mono ? 500 : 400 }}
      >
        {value}
      </span>
    </div>
  );
}

async function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}
