'use client';

import { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Check, Lock, Unlock, ChevronDown, CreditCard, Smartphone, Layers } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import type { Zone } from '@/types/database';
import EventCardPreview from '@/app/c/[slug]/components/EventCardPreview';
import { CardZoneFill } from './CardZoneFill';
import { PhotoCropModal } from './PhotoCropModal';
import { StripePaymentStep } from './StripePaymentStep';
import { WaafiPayStep } from './WaafiPayStep';

interface TicketType {
  id: string;
  name: string;
  description: string | null;
  price: number;
  currency: string;
  quantity: number | null;
  quantity_sold: number;
  min_price?: number | null;
  is_visible?: boolean;
}

interface CanvasVariant {
  id: string;
  backgroundUrl: string;
  backgroundWidth: number | null;
  backgroundHeight: number | null;
  zones: Zone[];
  ticketTypeId?: string | null;
}

interface FormField {
  id: string;
  label: string;
  field_type: 'text' | 'textarea' | 'select' | 'checkbox' | 'number' | 'dietary' | 'accessibility' | string;
  options: string[] | null;
  is_required: boolean;
  position: number;
}

interface Props {
  eventSlug: string;
  eventId: string;
  eventName: string;
  eventSubtitle: string;
  coverUrl: string | null;
  startsAt: string | null;
  timezone: string | null;
  city: string | null;
  tickets: TicketType[];
  canvasVariant: CanvasVariant | null;
  allVariants?: CanvasVariant[];
  formFields?: FormField[];
  initialName?: string;
  initialEmail?: string;
  referralCode?: string | null;
  utmSource?: string | null;
  initialTicketId?: string | null;
  alreadyRegistered?: boolean;
  existingTicketToken?: string | null;
  availableProcessors?: string[];
  registrationsClosed?: boolean;
  /** Who bears the platform fee. 'absorb' (default) = attendee pays the face
   *  price; 'pass' = attendee pays face + fee. Mirrors lib/billing/fees.ts. */
  feeBearer?: 'absorb' | 'pass';
  /** Organizer's platform-fee rate (plan-based: free .05, pro .02, studio 0). */
  feePercent?: number;
}

const INPUT = 'w-full rounded-xl px-4 py-3 text-[16px] outline-none transition border focus:border-[#E8C57E] focus:ring-[3px] focus:ring-[rgba(232,197,126,0.15)]';

function fmt(price: number, currency: string) {
  if (price === 0) return 'Free';
  try {
    return new Intl.NumberFormat(undefined, { style: 'currency', currency: currency || 'USD', minimumFractionDigits: 0 }).format(price);
  } catch {
    return `${currency} ${price}`;
  }
}

function dateStr(iso: string | null, tz: string | null) {
  if (!iso) return '';
  return new Date(iso).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric', timeZone: tz || 'UTC' });
}

/** Derive attendee_name from zone values (looks for name-like zone) */
function deriveAttendeeName(zones: Zone[], values: Record<string, string>, fallback: string): string {
  for (const zone of zones) {
    if (zone.type !== 'text' && zone.type !== 'custom') continue;
    const lbl = (zone.label ?? '').toLowerCase();
    if (lbl.includes('name') && !lbl.includes('company') && !lbl.includes('org') && !lbl.includes('event')) {
      const v = values[zone.id]?.trim();
      if (v) return v;
    }
  }
  for (const zone of zones) {
    if ((zone.type === 'text' || zone.type === 'custom') && !zone.hidden) {
      const v = values[zone.id]?.trim();
      if (v) return v;
    }
  }
  return fallback || 'Attendee';
}

// -- Helpers -----------------------------------------------------------------
function pickDefaultTicket(tickets: TicketType[]): TicketType | null {
  const available = tickets.filter(t => !(t.quantity !== null && t.quantity_sold >= t.quantity));
  if (available.length === 0) return tickets[0] ?? null;
  const notInvite = available.filter(t => {
    const combined = `${t.name ?? ''} ${t.description ?? ''}`.toLowerCase();
    return !combined.includes('invitation only') && !combined.includes('invite only') && !combined.includes('speaker') && !combined.includes('vip');
  });
  return (notInvite[0] ?? available[0]) ?? null;
}

async function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

// -- Main component ----------------------------------------------------------
/** Pick the best variant for the given ticket: ticket-specific first, then default (null ticketTypeId), then first available. */
function pickVariant(variants: CanvasVariant[], ticketId: string | null): CanvasVariant | null {
  if (!variants.length) return null;
  if (ticketId) {
    const specific = variants.find(v => v.ticketTypeId === ticketId);
    if (specific) return specific;
  }
  return variants.find(v => !v.ticketTypeId) ?? variants[0];
}

const PAYMENT_METHOD_OPTIONS = [
  { value: 'stripe',      label: 'Credit / Debit Card',    desc: 'Visa, Mastercard, Apple Pay, Google Pay',          icon: CreditCard, badge: 'Worldwide' },
  { value: 'flutterwave', label: 'Flutterwave',            desc: 'Card, bank transfer, USSD — African currencies',   icon: Layers,     badge: 'Africa' },
  { value: 'waafipay',    label: 'Mobile Money',           desc: 'EVC Plus, eDahab, Somtel — Somalia & Djibouti',    icon: Smartphone, badge: 'East Africa' },
] as const;

// Currency support per processor — mirrors lib/payments/{waafipay,flutterwave}.ts.
// Inlined here so this client component doesn't pull server-only payment code into the bundle.
const WAAFIPAY_CCYS = ['USD', 'SOS', 'DJF'];
const FLUTTERWAVE_CCYS = ['NGN', 'KES', 'GHS', 'ZAR', 'UGX', 'TZS'];
function processorSupportsCurrency(processor: string, currency: string): boolean {
  if (processor === 'waafipay') return WAAFIPAY_CCYS.includes(currency);
  if (processor === 'flutterwave') return FLUTTERWAVE_CCYS.includes(currency);
  return true; // stripe (and anything else) — assume supported
}

export default function RegistrationClient({
  eventSlug, eventId, eventName, eventSubtitle,
  coverUrl, startsAt, timezone, city, tickets, canvasVariant,
  allVariants = [],
  formFields = [],
  initialName = '', initialEmail = '',
  referralCode, utmSource, initialTicketId = null,
  alreadyRegistered = false,
  existingTicketToken = null,
  availableProcessors = ['stripe'],
  registrationsClosed = false,
  feeBearer = 'absorb',
  feePercent = 0,
}: Props) {
  const router = useRouter();

  // If the attendee arrived from the event page with a chosen ticket, honor it.
  const preselected = initialTicketId ? tickets.find(t => t.id === initialTicketId) ?? null : null;

  // step 0 = ticket, 1 = details, 2 = review/pay, 3 = your card (canvas events only).
  // Always start at step 0 so the attendee confirms their ticket before continuing.
  const [step, setStep] = useState<0 | 1 | 2 | 3>(0);
  // Move focus to the new step's heading on every step change so keyboard/screen-reader
  // users get a clear signal the page moved forward, instead of focus staying stranded
  // on the "Continue" button they just activated.
  const stepHeadingRef = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    stepHeadingRef.current?.focus({ preventScroll: true });
  }, [step]);
  const [confirmedToken, setConfirmedToken] = useState<string | null>(null);
  const [confirmedRegId, setConfirmedRegId] = useState<string | null>(null);
  const [selectedTicket, setSelectedTicket] = useState<TicketType | null>(() => preselected ?? pickDefaultTicket(tickets));

  // Pick the card variant that matches the selected ticket (falls back to default / first)
  const activeVariant = useMemo(
    () => (allVariants.length ? pickVariant(allVariants, selectedTicket?.id ?? null) : canvasVariant),
    [allVariants, canvasVariant, selectedTicket?.id]
  );

  // Basic fields
  const [email, setEmail] = useState(initialEmail);
  const [name, setName] = useState(initialName);
  const [phone, setPhone] = useState('');
  const [customFieldValues, setCustomFieldValues] = useState<Record<string, string>>({});

  // Dietary + accessibility answers live in their own registration columns —
  // never mixed into custom_fields. One selection set per kind.
  const [dietarySel, setDietarySel] = useState<string[]>([]);
  const [dietaryNote, setDietaryNote] = useState('');
  const [accessSel, setAccessSel] = useState<string[]>([]);
  const [accessNote, setAccessNote] = useState('');
  const hasDietaryField = formFields.some(f => f.field_type === 'dietary');
  const hasAccessField = formFields.some(f => f.field_type === 'accessibility');

  // Card zone state
  const [zoneValues, setZoneValues] = useState<Record<string, string>>(() => {
    if (!canvasVariant || !initialName) return {};
    const vals: Record<string, string> = {};
    for (const zone of canvasVariant.zones) {
      const lbl = (zone.label ?? '').toLowerCase();
      if ((zone.type === 'text' || zone.type === 'custom') && lbl.includes('name') && !lbl.includes('company') && !lbl.includes('org')) {
        vals[zone.id] = initialName;
      }
    }
    return vals;
  });
  const [zonePhotoFiles, setZonePhotoFiles] = useState<Record<string, File>>({});
  const [zonePhotoUrls, setZonePhotoUrls] = useState<Record<string, string>>({});
  const [cropTarget, setCropTarget] = useState<{ zone: Zone; srcUrl: string; file: File } | null>(null);

  // M5: PWYW
  const [chosenPrice, setChosenPrice] = useState('');

  // Promo / discount code
  const [promoInput, setPromoInput] = useState('');
  const [appliedPromo, setAppliedPromo] = useState<{ code: string; discount_amount: number } | null>(null);
  const [promoError, setPromoError] = useState('');
  const [promoChecking, setPromoChecking] = useState(false);

  // M5: Access codes
  const [showAccessCode, setShowAccessCode] = useState(false);
  const [accessCodeInput, setAccessCodeInput] = useState('');
  const [accessCodeError, setAccessCodeError] = useState('');
  const [unlocking, setUnlocking] = useState(false);
  const [unlockedTickets, setUnlockedTickets] = useState<TicketType[]>([]);
  // Remember which access code unlocked each hidden ticket, keyed by ticket id.
  // The visible input is cleared after unlock (UX), but the register API still
  // needs the code at submit — without this, hidden-ticket registration 403s.
  const [unlockCodes, setUnlockCodes] = useState<Record<string, string>>({});

  // Payment state (after submit for paid tickets)
  const [paymentStep, setPaymentStep] = useState(false);
  const [step2Processor, setStep2Processor] = useState<string>('');
  const [paymentProcessor, setPaymentProcessor] = useState<'stripe' | 'waafipay'>('stripe');
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [pendingRegId, setPendingRegId] = useState<string | null>(null);
  const [pendingRegToken, setPendingRegToken] = useState<string | null>(null);
  const [paymentAmount, setPaymentAmount] = useState(0);
  const [paymentCurrency, setPaymentCurrency] = useState('USD');
  const [paymentTicketName, setPaymentTicketName] = useState('');

  // Form state
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  // Returning-guest guard: logged-in users are pre-checked server-side, but
  // guests aren't — so we check their email before letting them reach payment.
  const [checkingDup, setCheckingDup] = useState(false);
  const [guestAlreadyRegistered, setGuestAlreadyRegistered] = useState(false);

  const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  // Derived
  const isPWYW = !!(selectedTicket?.min_price && selectedTicket.min_price > 0);
  const effectivePrice = isPWYW
    ? (parseFloat(chosenPrice) || 0)
    : (selectedTicket?.price ?? 0);
  const promoDiscount = appliedPromo ? Math.min(effectivePrice, appliedPromo.discount_amount) : 0;
  const priceAfterPromo = Math.max(0, Math.round((effectivePrice - promoDiscount) * 100) / 100);
  const isFree = priceAfterPromo === 0;
  // Match the server's split (lib/billing/fees.ts) EXACTLY so the total shown is
  // the total charged. In 'absorb' mode the attendee pays face (no added fee);
  // in 'pass' mode they pay face + the organizer's plan-based platform fee.
  const fee = (feeBearer === 'pass' && priceAfterPromo > 0)
    ? Math.round(priceAfterPromo * feePercent * 100) / 100
    : 0;
  const total = priceAfterPromo + fee;
  const ccy = selectedTicket?.currency ?? 'USD';
  const allTickets = [...tickets, ...unlockedTickets];

  async function applyPromo() {
    const code = promoInput.trim();
    if (!code || !selectedTicket) return;
    setPromoChecking(true);
    setPromoError('');
    try {
      const res = await fetch(`/api/events/${eventId}/promo/validate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, ticket_type_id: selectedTicket.id, amount: effectivePrice }),
      });
      const data = await res.json().catch(() => ({}));
      if (!data.valid) {
        setAppliedPromo(null);
        setPromoError(data.error ?? "That code isn't valid.");
        return;
      }
      setAppliedPromo({ code: code.toUpperCase(), discount_amount: data.discount_amount ?? 0 });
    } catch {
      setPromoError("Couldn't check that code. Please try again.");
    } finally {
      setPromoChecking(false);
    }
  }

  function clearPromo() {
    setAppliedPromo(null);
    setPromoInput('');
    setPromoError('');
  }

  // Photo crop handlers
  const handlePhotoSelect = useCallback((zone: Zone, file: File, srcUrl: string) => {
    setCropTarget({ zone, srcUrl, file });
  }, []);
  const handleCropConfirm = useCallback((file: File, previewUrl: string) => {
    if (!cropTarget) return;
    setZonePhotoFiles(p => ({ ...p, [cropTarget.zone.id]: file }));
    setZonePhotoUrls(p => ({ ...p, [cropTarget.zone.id]: previewUrl }));
    setCropTarget(null);
  }, [cropTarget]);
  const handlePhotoClear = useCallback((zoneId: string) => {
    setZonePhotoFiles(p => { const n = { ...p }; delete n[zoneId]; return n; });
    setZonePhotoUrls(p => { const n = { ...p }; delete n[zoneId]; return n; });
  }, []);

  // Access code unlock
  const handleUnlock = async () => {
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
      if (!res.ok) {
        setAccessCodeError(data.error ?? 'Invalid access code');
        return;
      }
      const newTickets: TicketType[] = data.tickets ?? [];
      if (newTickets.length === 0) {
        setAccessCodeError('No tickets found for this code');
        return;
      }
      setUnlockedTickets(prev => {
        const existingIds = new Set(prev.map(t => t.id));
        return [...prev, ...newTickets.filter(t => !existingIds.has(t.id))];
      });
      // Record the code that unlocked each of these tickets so submit can send it.
      const usedCode = accessCodeInput.trim();
      setUnlockCodes(prev => {
        const next = { ...prev };
        for (const t of newTickets) next[t.id] = usedCode;
        return next;
      });
      setSelectedTicket(newTickets[0]);
      setShowAccessCode(false);
      setAccessCodeInput('');
    } catch {
      setAccessCodeError('Something went wrong. Try again.');
    } finally {
      setUnlocking(false);
    }
  };

  function validateDetails(): Record<string, string> {
    const errs: Record<string, string> = {};
    if (!name.trim()) errs.name = 'Full name is required';
    if (!email.trim()) errs.email = 'Email is required';
    else if (!EMAIL_RE.test(email)) errs.email = 'Enter a valid email address';
    for (const f of formFields) {
      if (f.field_type === 'section') continue;
      if (f.field_type === 'dietary') {
        if (f.is_required && dietarySel.length === 0 && !dietaryNote.trim()) errs[`cf_${f.id}`] = `${f.label} is required`;
        continue;
      }
      if (f.field_type === 'accessibility') {
        if (f.is_required && accessSel.length === 0 && !accessNote.trim()) errs[`cf_${f.id}`] = `${f.label} is required`;
        continue;
      }
      if (f.is_required && !customFieldValues[f.id]?.trim()) {
        errs[`cf_${f.id}`] = `${f.label} is required`;
      }
    }
    return errs;
  }

  function validateTicket(): Record<string, string> {
    const errs: Record<string, string> = {};
    if (isPWYW) {
      const val = parseFloat(chosenPrice);
      if (!chosenPrice || isNaN(val)) errs.chosenPrice = 'Please enter an amount';
      else if (val < (selectedTicket!.min_price!)) errs.chosenPrice = `Minimum is ${selectedTicket!.currency} ${selectedTicket!.min_price}`;
    }
    return errs;
  }

  // Advance from Ticket/Details steps. On leaving Details we run the guest
  // duplicate-email check so a returning guest sees "already registered" here,
  // not after filling out payment. Never blocks on a network failure — the
  // /register API still rejects true duplicates at submit.
  async function handleContinue() {
    if (step === 0) {
      const errs = validateTicket();
      if (Object.keys(errs).length > 0) { setFieldErrors(errs); return; }
      setStep(1);
      return;
    }
    if (step === 1) {
      const errs = validateDetails();
      if (Object.keys(errs).length > 0) { setFieldErrors(errs); return; }
      setCheckingDup(true);
      try {
        const res = await fetch(`/api/events/${eventId}/check-email?email=${encodeURIComponent(email.trim().toLowerCase())}`);
        const data = await res.json() as { registered?: boolean };
        if (data.registered) { setGuestAlreadyRegistered(true); return; }
      } catch { /* non-blocking — server-side check still catches it at submit */ }
      finally { setCheckingDup(false); }
      setStep(2);
    }
  }

  const handleSubmit = async (overrideProcessor?: string) => {
    setSubmitError('');

    // Only consider processors the organizer enabled that also support this ticket's currency.
    const ticketCurrency = selectedTicket?.currency ?? 'USD';
    const paidProcessors = availableProcessors
      .filter(p => p !== 'free')
      .filter(p => processorSupportsCurrency(p, ticketCurrency));
    const usableProcessors = paidProcessors.length ? paidProcessors : ['stripe'];
    const ticketIsPaid = (selectedTicket?.price ?? 0) > 0 || !!(selectedTicket?.min_price && selectedTicket.min_price > 0);
    // Resolve which processor to send: override > inline selection (if valid for currency) > first available
    const selectedIsUsable = step2Processor && usableProcessors.includes(step2Processor);
    const effectiveProcessor = overrideProcessor
      ?? (ticketIsPaid ? (selectedIsUsable ? step2Processor : usableProcessors[0]) : undefined);

    setSubmitting(true);
    try {
      const attendeeName = activeVariant
        ? deriveAttendeeName(activeVariant.zones, zoneValues, name || 'Attendee')
        : name;

      const zoneCustomFields = activeVariant
        ? Object.fromEntries(
            activeVariant.zones
              .filter(z => (z.type === 'text' || z.type === 'custom') && !z.hidden)
              .flatMap(z => {
                const v = zoneValues[z.id];
                return v ? [[z.id, v]] : [];
              }),
          )
        : {};

      const res = await fetch(`/api/events/${eventId}/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-event-slug': eventSlug },
        body: JSON.stringify({
          ticket_type_id: selectedTicket?.id,
          attendee_name: attendeeName,
          attendee_email: email,
          attendee_phone: phone.trim() || undefined,
          custom_fields: { ...zoneCustomFields, ...customFieldValues },
          ...(hasDietaryField ? { dietary: dietarySel, dietary_note: dietaryNote.trim() || undefined } : {}),
          ...(hasAccessField ? { accessibility: accessSel, accessibility_note: accessNote.trim() || undefined } : {}),
          chosen_price: isPWYW ? effectivePrice : undefined,
          access_code: selectedTicket ? (unlockCodes[selectedTicket.id] || undefined) : undefined,
          referral_code: referralCode ?? null,
          utm_source: utmSource ?? null,
          promo_code: appliedPromo?.code ?? null,
          preferred_processor: effectiveProcessor ?? null,
        }),
      });

      const data = await res.json() as {
        registration_id?: string;
        qr_code_token?: string;
        error?: string;
        payment_required?: boolean;
        redirect_url?: string;
        client_secret?: string;
        payment_processor?: string;
        amount?: number;
        currency?: string;
        ticket_name?: string;
      };

      if (!res.ok) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const rawError: string = (data as any).detail ?? data.error ?? 'Registration failed. Please try again.';
        const errorMessages: Record<string, string> = {
          TICKET_SOLD_OUT: 'Sorry, this ticket just sold out.',
          EVENT_FULL: 'Sorry, this event just reached capacity.',
          DUPLICATE_REGISTRATION: 'You are already registered for this event.',
        };
        setSubmitError(errorMessages[rawError] ?? rawError);
        return;
      }

      // Flutterwave: redirect externally
      if (data.payment_required && data.redirect_url) {
        window.location.href = data.redirect_url;
        return;
      }

      // Stripe
      if (data.payment_required && data.payment_processor !== 'waafipay' && data.client_secret) {
        setClientSecret(data.client_secret);
        setPendingRegId(data.registration_id ?? null);
        setPendingRegToken(data.qr_code_token ?? null);
        setPaymentProcessor('stripe');
        setPaymentAmount(data.amount ?? effectivePrice);
        setPaymentCurrency(data.currency ?? selectedTicket?.currency ?? 'USD');
        setPaymentTicketName(data.ticket_name ?? selectedTicket?.name ?? 'Ticket');
        setPaymentStep(true);
        return;
      }

      // WaafiPay
      if (data.payment_required && data.payment_processor === 'waafipay') {
        setPendingRegId(data.registration_id ?? null);
        setPendingRegToken(data.qr_code_token ?? null);
        setPaymentProcessor('waafipay');
        setPaymentAmount(data.amount ?? effectivePrice);
        setPaymentCurrency(data.currency ?? selectedTicket?.currency ?? 'USD');
        setPaymentTicketName(data.ticket_name ?? selectedTicket?.name ?? 'Ticket');
        setPaymentStep(true);
        return;
      }

      if (!data.qr_code_token) {
        setSubmitError('Registration created but something went wrong. Check your email for confirmation.');
        return;
      }

      const token = data.qr_code_token;

      // For canvas events: go to "Your card" step so the attendee can personalise before redirect
      if (activeVariant) {
        setConfirmedToken(token);
        setConfirmedRegId(data.registration_id ?? null);
        setStep(3);
        return;
      }

      router.push(`/e/${eventSlug}/register/confirm?reg=${token}`);
    } catch {
      setSubmitError('Something went wrong. Check your connection and try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCardFinish = async () => {
    if (!confirmedToken || !activeVariant) return;
    setSubmitting(true);
    try {
      const attendeeName = deriveAttendeeName(activeVariant.zones, zoneValues, name || 'Attendee');
      const fd = new FormData();
      fd.append('variantId', activeVariant.id);
      const enriched: Record<string, string> = { ...zoneValues, email: email.trim().toLowerCase() };
      const firstNameZone = activeVariant.zones.find(z => {
        const lbl = (z.label ?? '').toLowerCase();
        return (z.type === 'text' || z.type === 'custom') && lbl.includes('name') && !lbl.includes('company') && !lbl.includes('org');
      });
      if (firstNameZone && !enriched[firstNameZone.id]) enriched[firstNameZone.id] = attendeeName;
      fd.append('fields', JSON.stringify(enriched));
      fd.append('idempotencyKey', `reg-${confirmedToken}-card`);
      if (confirmedRegId) fd.append('registrationId', confirmedRegId);
      for (const [zoneId, file] of Object.entries(zonePhotoFiles)) {
        fd.append(`photo_${zoneId}`, file);
      }
      const renderRes = await fetch('/api/render', { method: 'POST', body: fd });
      if (renderRes.ok) {
        const blob = await renderRes.blob();
        const dataUrl = await blobToDataUrl(blob);
        try { sessionStorage.setItem(`card_${confirmedToken}`, dataUrl); } catch { /* ignore */ }
      }
    } catch { /* non-blocking */ } finally {
      setSubmitting(false);
    }
    router.push(`/e/${eventSlug}/register/confirm?reg=${confirmedToken}`);
  };

  // Payment screens (after registration created for paid tickets)
  if (paymentStep && pendingRegToken) {
    const returnUrl = `${window.location.origin}/e/${eventSlug}/register/confirm?reg=${pendingRegToken}&processor=stripe`;

    return (
      <div className="min-h-screen flex items-center justify-center px-5 py-12" style={{ background: '#FAF6EE' }}>
        <div className="w-full max-w-[440px]">
          {paymentProcessor === 'stripe' && clientSecret ? (
            <StripePaymentStep
              clientSecret={clientSecret}
              returnUrl={returnUrl}
              amount={paymentAmount}
              currency={paymentCurrency}
              eventTitle={eventName}
              ticketName={paymentTicketName}
            />
          ) : paymentProcessor === 'waafipay' && pendingRegId ? (
            <WaafiPayStep
              registrationId={pendingRegId}
              qrToken={pendingRegToken}
              amount={paymentAmount}
              currency={paymentCurrency}
              eventTitle={eventName}
              ticketName={paymentTicketName}
              onSuccess={() => router.push(`/e/${eventSlug}/register/confirm?reg=${pendingRegToken}&processor=waafipay`)}
            />
          ) : null}
        </div>
      </div>
    );
  }

  // Registration deadline has passed — show a clear closed state before the form.
  if (registrationsClosed) {
    return (
      <div className="min-h-screen flex items-center justify-center px-5 py-12" style={{ background: '#FAF6EE' }}>
        <div className="w-full max-w-[420px] bg-white rounded-2xl border p-8 text-center" style={{ borderColor: '#E5E0D4' }}>
          <div className="mx-auto mb-4 flex items-center justify-center rounded-full" style={{ width: 44, height: 44, background: '#FEF3C7', color: '#92400E' }}>
            <Lock size={22} strokeWidth={2.2} />
          </div>
          <h1 className="font-display font-semibold text-[22px] mb-1.5" style={{ color: '#0F1F18', letterSpacing: '-0.02em' }}>
            Registrations closed
          </h1>
          <p className="text-[14px] mb-6" style={{ color: '#65736B' }}>
            Registration for {eventName} is no longer available.
          </p>
          <Link href={`/e/${eventSlug}`} className="inline-flex items-center justify-center h-11 rounded-xl text-[14px] font-medium border transition hover:border-[#1F4D3A]/40" style={{ borderColor: '#E5E0D4', color: '#3A4A42' }}>
            Back to event
          </Link>
        </div>
      </div>
    );
  }

  // Caught up front: this attendee already has a registration for this event.
  // `alreadyRegistered` = logged-in server-side pre-check; `guestAlreadyRegistered`
  // = returning guest caught by the email check when leaving the Details step.
  if (alreadyRegistered || guestAlreadyRegistered) {
    return (
      <div className="min-h-screen flex items-center justify-center px-5 py-12" style={{ background: '#FAF6EE' }}>
        <div className="w-full max-w-[420px] bg-white rounded-2xl border p-8 text-center" style={{ borderColor: '#E5E0D4' }}>
          <div className="mx-auto mb-4 flex items-center justify-center rounded-full" style={{ width: 44, height: 44, background: '#E8EFEB', color: '#1F4D3A' }}>
            <Check size={22} strokeWidth={2.2} />
          </div>
          <h1 className="font-display font-semibold text-[22px] mb-1.5" style={{ color: '#0F1F18', letterSpacing: '-0.02em' }}>
            You&apos;re already registered
          </h1>
          <p className="text-[14px] mb-6" style={{ color: '#65736B' }}>
            You already have a ticket for {eventName}. Your Eventera Card and door QR are in My tickets.
          </p>
          <div className="flex flex-col gap-2.5">
            <Link
              href={existingTicketToken ? `/e/${eventSlug}/register/confirm?reg=${existingTicketToken}` : '/my-tickets'}
              className="inline-flex items-center justify-center h-11 rounded-xl text-white text-[14px] font-medium transition hover:bg-[#163828]"
              style={{ background: '#1F4D3A' }}
            >
              View my ticket
            </Link>
            <Link href={`/e/${eventSlug}`} className="inline-flex items-center justify-center h-11 rounded-xl text-[14px] font-medium border transition hover:border-[#1F4D3A]/40" style={{ borderColor: '#E5E0D4', color: '#3A4A42' }}>
              Back to event
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const STEPS = activeVariant
    ? ['Ticket', 'Details', isFree ? 'Confirm' : 'Pay', 'Your card']
    : ['Ticket', 'Details', isFree ? 'Confirm' : 'Pay'];
  const previewValues = zoneValues;
  const previewPhotoUrls = zonePhotoUrls;

  // Step 2 payment method variables (computed once, used in JSX below).
  // Only offer a processor if the organizer enabled it AND it supports this ticket's currency.
  // Stripe is always kept as a safety net so a paid ticket is never left with zero methods.
  const s2PaidProcessors = availableProcessors
    .filter(p => p !== 'free')
    .filter(p => processorSupportsCurrency(p, ccy));
  const s2AvailableForCurrency = s2PaidProcessors.length ? s2PaidProcessors : ['stripe'];
  const s2Methods = PAYMENT_METHOD_OPTIONS.filter(m => s2AvailableForCurrency.includes(m.value));
  const s2Active = (step2Processor && s2AvailableForCurrency.includes(step2Processor))
    ? step2Processor
    : s2AvailableForCurrency[0] || 'stripe';
  const s2SingleMethod = s2Methods.length === 1 ? s2Methods[0] ?? null : null;
  const S2SingleIcon = s2SingleMethod ? s2SingleMethod.icon : null;

  return (
    <div className="min-h-screen" style={{ background: '#FAF6EE' }}>
      <div className={`max-w-[1100px] mx-auto px-5 py-8 pb-20 lg:gap-12 lg:items-start ${step === 3 ? '' : 'lg:grid lg:grid-cols-[1fr_340px]'}`}>
        {/* Left: form */}
        <div>
          {/* Step indicator */}
          <div className="flex items-center gap-2.5 mb-8">
            {STEPS.map((label, i) => (
              <div key={i} className="flex items-center gap-2.5">
                <div className="flex items-center gap-2">
                  <div
                    className="w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-medium shrink-0 transition-all"
                    style={{
                      background: i < step ? '#E8EFEB' : i === step ? '#1F4D3A' : 'transparent',
                      border: `1.5px solid ${i <= step ? '#1F4D3A' : '#E5E0D4'}`,
                      color: i === step ? 'white' : i < step ? '#1F4D3A' : '#65736B',
                    }}
                  >
                    {i < step ? <Check size={10} strokeWidth={2.8} /> : i + 1}
                  </div>
                  <span className="text-[13px] font-medium hidden sm:block" style={{ color: i <= step ? '#1F4D3A' : '#65736B' }}>
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
              <h2 ref={stepHeadingRef} tabIndex={-1} className="font-display font-normal text-[28px] mb-1.5 outline-none" style={{ color: '#0F1F18', letterSpacing: '-0.02em' }}>
                Choose your ticket
              </h2>
              <p className="text-[14px] mb-6" style={{ color: '#65736B' }}>{eventSubtitle}</p>

              {allTickets.length === 0 ? (
                <div className="rounded-2xl py-12 text-center text-[14px]" style={{ background: 'white', border: '1px solid #E5E0D4', color: '#65736B' }}>
                  No tickets available yet.
                </div>
              ) : (
                <div className="space-y-3">
                  {allTickets.map((t: TicketType) => {
                    const sold = t.quantity !== null && t.quantity_sold >= t.quantity!;
                    const isSelected = selectedTicket?.id === t.id;
                    const isUnlocked = unlockedTickets.some(u => u.id === t.id);
                    const displayPrice = t.min_price && t.min_price > 0
                      ? `${t.currency} ${t.min_price}+`
                      : fmt(t.price, t.currency);
                    return (
                      <button
                        key={t.id}
                        disabled={sold}
                        aria-pressed={isSelected}
                        onClick={() => { setSelectedTicket(t); setChosenPrice(''); setSubmitError(''); setFieldErrors({}); clearPromo(); }}
                        className="w-full text-left flex items-center gap-4 p-5 rounded-2xl transition-all"
                        style={{ border: `1px solid ${isSelected ? '#1F4D3A' : '#E5E0D4'}`, background: 'white', boxShadow: isSelected ? 'inset 0 0 0 1px #1F4D3A' : 'none', opacity: sold ? 0.5 : 1 }}
                      >
                        <div className="w-5 h-5 rounded-full shrink-0 border-2 transition-all" style={{ borderColor: isSelected ? '#1F4D3A' : '#E5E0D4', boxShadow: isSelected ? 'inset 0 0 0 5px #1F4D3A' : 'none' }} />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-display font-medium text-[16px]" style={{ color: '#0F1F18' }}>{t.name}</span>
                            {isUnlocked && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium" style={{ background: '#E8EFEB', color: '#1F4D3A' }}>
                                <Unlock size={9} /> Unlocked
                              </span>
                            )}
                          </div>
                          {t.description && <div className="text-[13px] mt-0.5" style={{ color: '#65736B' }}>{t.description}</div>}
                          {sold && <div className="text-[12px] mt-1 font-medium" style={{ color: '#B8423C' }}>Sold out</div>}
                        </div>
                        <div className="font-title font-bold text-[18px] shrink-0" style={{ color: t.price === 0 && !t.min_price ? '#C9A45E' : '#1F4D3A' }}>
                          {displayPrice}
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}

              {/* PWYW price input */}
              {isPWYW && selectedTicket && (
                <div className="mt-4 rounded-2xl p-5" style={{ background: 'white', border: '1px solid #E5E0D4' }}>
                  <label htmlFor="reg-pwyw-amount" className="block text-[13px] font-medium mb-2" style={{ color: '#3A4A42' }}>
                    Choose your amount <span className="font-normal" style={{ color: '#65736B' }}>(minimum {selectedTicket.currency} {selectedTicket.min_price})</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2  text-[15px]" style={{ color: '#65736B' }}>
                      {selectedTicket.currency}
                    </span>
                    <input
                      id="reg-pwyw-amount"
                      type="number"
                      min={selectedTicket.min_price ?? 0}
                      step="any"
                      value={chosenPrice}
                      aria-invalid={!!fieldErrors.chosenPrice}
                      aria-describedby={fieldErrors.chosenPrice ? 'reg-pwyw-amount-error' : undefined}
                      onChange={e => { setChosenPrice(e.target.value); setFieldErrors(p => ({ ...p, chosenPrice: '' })); if (appliedPromo) clearPromo(); }}
                      placeholder={String(selectedTicket.min_price ?? 0)}
                      className={INPUT}
                      style={{ borderColor: fieldErrors.chosenPrice ? '#B8423C' : '#E5E0D4', background: 'white', color: '#0F1F18', paddingLeft: '3.5rem' }}
                    />
                  </div>
                  {fieldErrors.chosenPrice && <p id="reg-pwyw-amount-error" className="text-[12px] mt-1 font-medium" style={{ color: '#B8423C' }}>{fieldErrors.chosenPrice}</p>}
                </div>
              )}

              {/* Access code */}
              <div className="mt-4">
                {!showAccessCode ? (
                  <button
                    onClick={() => setShowAccessCode(true)}
                    className="flex items-center gap-1.5 text-[13px] transition-colors"
                    style={{ color: '#65736B' }}
                  >
                    <Lock size={13} /> Have an access code?
                    <ChevronDown size={13} />
                  </button>
                ) : (
                  <div className="rounded-2xl p-4" style={{ background: 'white', border: '1px solid #E5E0D4' }}>
                    <label htmlFor="reg-access-code" className="block text-[12px] font-medium mb-2" style={{ color: '#3A4A42' }}>Access code</label>
                    <div className="flex gap-2">
                      <input
                        id="reg-access-code"
                        type="text"
                        value={accessCodeInput}
                        aria-invalid={!!accessCodeError}
                        onChange={e => { setAccessCodeInput(e.target.value.toUpperCase()); setAccessCodeError(''); }}
                        placeholder="Enter code"
                        className="flex-1 rounded-xl px-4 py-2.5 text-[16px] outline-none border"
                        style={{ borderColor: accessCodeError ? '#B8423C' : '#E5E0D4', background: 'white', color: '#0F1F18' }}
                        onKeyDown={e => { if (e.key === 'Enter') handleUnlock(); }}
                      />
                      <button
                        onClick={handleUnlock}
                        disabled={unlocking || !accessCodeInput.trim()}
                        className="px-4 py-2.5 rounded-xl text-[14px] font-medium transition-opacity"
                        style={{ background: '#1F4D3A', color: 'white', opacity: (unlocking || !accessCodeInput.trim()) ? 0.6 : 1 }}
                      >
                        {unlocking ? '…' : 'Unlock'}
                      </button>
                    </div>
                    {accessCodeError && <p className="text-[12px] mt-1.5 font-medium" style={{ color: '#B8423C' }}>{accessCodeError}</p>}
                    {unlockedTickets.length > 0 && (
                      <p className="text-[12px] mt-1.5" style={{ color: '#2D7A4F' }}>
                        {unlockedTickets.length} hidden ticket{unlockedTickets.length !== 1 ? 's' : ''} unlocked
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Step 1: Details */}
          {step === 1 && (
            <div>
              <h2 ref={stepHeadingRef} tabIndex={-1} className="font-display font-normal text-[28px] mb-1.5 outline-none" style={{ color: '#0F1F18', letterSpacing: '-0.02em' }}>
                Your details
              </h2>
              <p className="text-[14px] mb-6" style={{ color: '#65736B' }}>
                This is how you&apos;ll appear on the attendee list and your Eventera Card.
              </p>
              <div className="space-y-4">
                {/* Full name — always required */}
                <div>
                  <label htmlFor="reg-name" className="block text-[12px] mb-1.5" style={{ color: fieldErrors.name ? '#B8423C' : '#65736B' }}>
                    Full name <span style={{ color: '#B8423C' }}>*</span>
                  </label>
                  <input
                    id="reg-name"
                    type="text" value={name}
                    aria-invalid={!!fieldErrors.name}
                    aria-describedby={fieldErrors.name ? 'reg-name-error' : undefined}
                    onChange={e => {
                      const val = e.target.value;
                      setName(val);
                      if (fieldErrors.name) setFieldErrors(p => ({ ...p, name: '' }));
                      // Auto-sync to card name zones so the live preview updates
                      if (activeVariant) {
                        setZoneValues(p => {
                          const updated = { ...p };
                          activeVariant.zones.forEach(zone => {
                            const lbl = (zone.label ?? '').toLowerCase();
                            if ((zone.type === 'text' || zone.type === 'custom') && lbl.includes('name') && !lbl.includes('company') && !lbl.includes('org') && !lbl.includes('event')) {
                              updated[zone.id] = val;
                            }
                          });
                          return updated;
                        });
                      }
                    }}
                    placeholder="Amina Osman" className={INPUT}
                    style={{ borderColor: fieldErrors.name ? '#B8423C' : '#E5E0D4', background: 'white', color: '#0F1F18' }}
                  />
                  {fieldErrors.name && <p id="reg-name-error" className="text-[12px] mt-1 font-medium" style={{ color: '#B8423C' }}>{fieldErrors.name}</p>}
                </div>

                {/* Email */}
                <div>
                  <label htmlFor="reg-email" className="block text-[12px] mb-1.5" style={{ color: fieldErrors.email ? '#B8423C' : '#65736B' }}>
                    Email <span style={{ color: '#B8423C' }}>*</span>
                  </label>
                  <input
                    id="reg-email"
                    type="email" value={email}
                    aria-invalid={!!fieldErrors.email}
                    aria-describedby={fieldErrors.email ? 'reg-email-error' : undefined}
                    onChange={e => { setEmail(e.target.value); if (fieldErrors.email) setFieldErrors(p => ({ ...p, email: '' })); }}
                    placeholder="you@example.com" className={INPUT}
                    style={{ borderColor: fieldErrors.email ? '#B8423C' : '#E5E0D4', background: 'white', color: '#0F1F18' }}
                  />
                  {fieldErrors.email && <p id="reg-email-error" className="text-[12px] mt-1 font-medium" style={{ color: '#B8423C' }}>{fieldErrors.email}</p>}
                </div>

                {/* Phone — optional */}
                <div>
                  <label htmlFor="reg-phone" className="block text-[12px] mb-1.5" style={{ color: '#65736B' }}>
                    Phone number <span style={{ color: '#65736B', fontWeight: 400 }}>(optional)</span>
                  </label>
                  <input
                    id="reg-phone"
                    type="tel" value={phone}
                    onChange={e => setPhone(e.target.value)}
                    placeholder="+252 61 234 5678" className={INPUT}
                    style={{ borderColor: '#E5E0D4', background: 'white', color: '#0F1F18' }}
                  />
                </div>

                {/* Custom form fields configured by the organizer */}
                {formFields.map(f => {
                  const err = fieldErrors[`cf_${f.id}`];
                  const val = customFieldValues[f.id] ?? '';
                  const set = (v: string) => {
                    setCustomFieldValues(p => ({ ...p, [f.id]: v }));
                    if (err) setFieldErrors(p => ({ ...p, [`cf_${f.id}`]: '' }));
                  };
                  const fieldId = `reg-cf-${f.id}`;
                  const labelEl = (
                    <label htmlFor={fieldId} className="block text-[12px] mb-1.5" style={{ color: err ? '#B8423C' : '#65736B' }}>
                      {f.label}{f.is_required && <span style={{ color: '#B8423C' }}> *</span>}
                    </label>
                  );
                  if (f.field_type === 'textarea') return (
                    <div key={f.id}>{labelEl}
                      <textarea id={fieldId} value={val} onChange={e => set(e.target.value)} rows={3} aria-invalid={!!err}
                        className={INPUT} style={{ borderColor: err ? '#B8423C' : '#E5E0D4', background: 'white', color: '#0F1F18', resize: 'vertical' }} />
                      {err && <p className="text-[12px] mt-1 font-medium" style={{ color: '#B8423C' }}>{err}</p>}
                    </div>
                  );
                  if (f.field_type === 'select' && f.options?.length) return (
                    <div key={f.id}>{labelEl}
                      <select id={fieldId} value={val} onChange={e => set(e.target.value)} aria-invalid={!!err}
                        className={INPUT} style={{ borderColor: err ? '#B8423C' : '#E5E0D4', background: 'white', color: val ? '#0F1F18' : '#65736B' }}>
                        <option value="">Select…</option>
                        {f.options.map(o => <option key={o} value={o}>{o}</option>)}
                      </select>
                      {err && <p className="text-[12px] mt-1 font-medium" style={{ color: '#B8423C' }}>{err}</p>}
                    </div>
                  );
                  if (f.field_type === 'checkbox') return (
                    <div key={f.id} className="flex items-center gap-3">
                      <input id={fieldId} type="checkbox" checked={val === 'true'} onChange={e => set(e.target.checked ? 'true' : '')}
                        className="w-4 h-4 rounded accent-[#1F4D3A]" />
                      <label htmlFor={fieldId} className="text-[14px]" style={{ color: '#0F1F18' }}>{f.label}{f.is_required && <span style={{ color: '#B8423C' }}> *</span>}</label>
                      {err && <p className="text-[12px] font-medium" style={{ color: '#B8423C' }}>{err}</p>}
                    </div>
                  );
                  // Section heading — no input
                  if (f.field_type === 'section') return (
                    <div key={f.id} className="pt-2">
                      <div className="font-title font-semibold text-[15px]" style={{ color: '#0F1F18' }}>{f.label}</div>
                      <div className="mt-1.5" style={{ borderBottom: '1px solid #E5E0D4' }} />
                    </div>
                  );
                  // Dietary / accessibility — calm multi-select tags + an optional note.
                  // Written to dedicated registration columns, never custom_fields.
                  if (f.field_type === 'dietary' || f.field_type === 'accessibility') {
                    const isDietary = f.field_type === 'dietary';
                    const selected = isDietary ? dietarySel : accessSel;
                    const setSel = isDietary ? setDietarySel : setAccessSel;
                    const note = isDietary ? dietaryNote : accessNote;
                    const setNote = isDietary ? setDietaryNote : setAccessNote;
                    const tags = f.options ?? [];
                    const toggle = (tag: string) => {
                      setSel(prev => prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]);
                      if (err) setFieldErrors(p => ({ ...p, [`cf_${f.id}`]: '' }));
                    };
                    return (
                      <div key={f.id}>
                        {labelEl}
                        <p className="text-[12px] mb-2.5" style={{ color: '#65736B' }}>
                          {isDietary
                            ? 'Select anything that applies — we’ll share it with catering so there’s something for you.'
                            : 'Tell us what will help you take part. We’ll prepare ahead of time.'}
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {tags.map(o => {
                            const on = selected.includes(o);
                            return (
                              <button
                                key={o}
                                type="button"
                                aria-pressed={on}
                                onClick={() => toggle(o)}
                                className="px-3.5 py-2 rounded-full text-[13px] font-medium transition"
                                style={{
                                  border: `1.5px solid ${on ? '#1F4D3A' : '#E5E0D4'}`,
                                  background: on ? '#E8EFEB' : 'white',
                                  color: on ? '#1F4D3A' : '#3A4A42',
                                }}
                              >
                                {on && <Check size={12} strokeWidth={2.8} className="inline mr-1 -mt-px" />}
                                {o}
                              </button>
                            );
                          })}
                        </div>
                        <textarea
                          value={note}
                          onChange={e => { setNote(e.target.value); if (err) setFieldErrors(p => ({ ...p, [`cf_${f.id}`]: '' })); }}
                          rows={2}
                          placeholder={isDietary ? 'Anything else catering should know (optional)' : 'Anything else that would help (optional)'}
                          className={INPUT}
                          style={{ marginTop: '0.75rem', borderColor: '#E5E0D4', background: 'white', color: '#0F1F18', resize: 'vertical' }}
                        />
                        {err && <p className="text-[12px] mt-1 font-medium" style={{ color: '#B8423C' }}>{err}</p>}
                      </div>
                    );
                  }
                  // Radio — single choice always visible
                  if (f.field_type === 'radio' && f.options?.length) return (
                    <div key={f.id}>{labelEl}
                      <div className="grid gap-2 mt-0.5">
                        {f.options.map(o => (
                          <label key={o} className="flex items-center gap-2.5 cursor-pointer text-[14px]" style={{ color: '#0F1F18' }}>
                            <input type="radio" name={`cf_${f.id}`} checked={val === o} onChange={() => set(o)} className="w-4 h-4 accent-[#1F4D3A]" />
                            {o}
                          </label>
                        ))}
                      </div>
                      {err && <p className="text-[12px] mt-1 font-medium" style={{ color: '#B8423C' }}>{err}</p>}
                    </div>
                  );
                  return (
                    <div key={f.id}>{labelEl}
                      <input
                        id={fieldId}
                        type={f.field_type === 'number' ? 'number' : f.field_type === 'date' ? 'date' : f.field_type === 'url' ? 'url' : f.field_type === 'phone' ? 'tel' : 'text'}
                        value={val} onChange={e => set(e.target.value)}
                        aria-invalid={!!err}
                        placeholder={f.field_type === 'date' ? undefined : f.label} className={INPUT}
                        style={{ borderColor: err ? '#B8423C' : '#E5E0D4', background: 'white', color: '#0F1F18' }} />
                      {err && <p className="text-[12px] mt-1 font-medium" style={{ color: '#B8423C' }}>{err}</p>}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Step 2: Review / Confirm */}
          {step === 2 && (
            <div>
              <h2 ref={stepHeadingRef} tabIndex={-1} className="font-display font-normal text-[28px] mb-1.5 outline-none" style={{ color: '#0F1F18', letterSpacing: '-0.02em' }}>
                {effectivePrice === 0 ? 'Confirm registration' : 'Review & pay'}
              </h2>
              <p className="text-[14px] mb-5" style={{ color: '#65736B' }}>
                {effectivePrice === 0
                  ? 'No payment required. Confirm to complete your registration.'
                  : eventName}
              </p>

              {/* Order summary */}
              <div className="rounded-2xl p-5 mb-4" style={{ background: 'white', border: '1px solid #E5E0D4' }}>
                <div className="text-[11px] font-semibold uppercase tracking-widest mb-3" style={{ color: '#65736B' }}>Order summary</div>

                <div className="flex items-center justify-between py-1.5 text-[14px]" style={{ color: '#3A4A42' }}>
                  <span>{selectedTicket?.name}</span>
                  <span className="font-semibold">{fmt(effectivePrice, ccy)}</span>
                </div>

                {/* Promo code */}
                {effectivePrice > 0 && !appliedPromo && (
                  <div className="pt-3 pb-1 mt-1" style={{ borderTop: '1px solid #F0EDE6' }}>
                    <div className="flex gap-2">
                      <input
                        aria-label="Promo code"
                        value={promoInput}
                        aria-invalid={!!promoError}
                        onChange={e => { setPromoInput(e.target.value.toUpperCase()); setPromoError(''); }}
                        onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); applyPromo(); } }}
                        placeholder="Promo code"
                        className="flex-1 rounded-xl px-3 py-2 text-[14px] outline-none border"
                        style={{ borderColor: promoError ? '#B8423C' : '#E5E0D4', background: '#FAF6EE', color: '#0F1F18' }}
                      />
                      <button
                        type="button"
                        onClick={applyPromo}
                        disabled={promoChecking || !promoInput.trim()}
                        className="px-4 py-2 rounded-xl text-[13px] font-semibold border transition hover:opacity-80 disabled:opacity-50"
                        style={{ borderColor: '#1F4D3A', color: '#1F4D3A' }}
                      >
                        {promoChecking ? '…' : 'Apply'}
                      </button>
                    </div>
                    {promoError && <p className="text-[12px] mt-1.5 font-medium" style={{ color: '#B8423C' }}>{promoError}</p>}
                  </div>
                )}
                {effectivePrice > 0 && appliedPromo && (
                  <div className="flex items-center justify-between py-1.5 mt-1 text-[14px]" style={{ color: '#2D7A4F', borderTop: '1px solid #F0EDE6' }}>
                    <span className="inline-flex items-center gap-1.5">
                      <Check size={14} strokeWidth={2.5} />
                      Promo &ldquo;{appliedPromo.code}&rdquo;
                      <button type="button" onClick={clearPromo} className="ml-1 text-[12px] underline" style={{ color: '#65736B' }}>remove</button>
                    </span>
                    <span className="font-semibold">−{fmt(promoDiscount, ccy)}</span>
                  </div>
                )}

                {fee > 0 && (
                  <div className="flex items-center justify-between py-1.5 text-[13px]" style={{ color: '#65736B', borderTop: '1px solid #F0EDE6', marginTop: '4px' }}>
                    <span>Service fee</span>
                    <span>{fmt(fee, ccy)}</span>
                  </div>
                )}

                <div className="flex items-center justify-between pt-3 mt-1 text-[16px] font-bold" style={{ borderTop: '1px solid #E5E0D4' }}>
                  <span style={{ color: '#0F1F18' }}>Total</span>
                  <span style={{ color: '#0F1F18' }}>{fmt(total, ccy)}</span>
                </div>
              </div>

              {/* Payment method — only shown for paid tickets */}
              {effectivePrice > 0 && (
                <div className="mb-4">
                  <div className="text-[11px] font-semibold uppercase tracking-widest mb-3" style={{ color: '#65736B' }}>
                    Payment method
                  </div>

                  {s2Methods.length > 1 ? (
                    /* Multi-processor: radio-style selector */
                    <div className="space-y-2">
                      {s2Methods.map(method => {
                        const Icon = method.icon;
                        const selected = s2Active === method.value;
                        return (
                          <button
                            key={method.value}
                            type="button"
                            aria-pressed={selected}
                            onClick={() => setStep2Processor(method.value)}
                            className="w-full flex items-center gap-3 p-4 rounded-xl text-left transition"
                            style={{
                              background: selected ? 'rgba(31,77,58,0.04)' : 'white',
                              border: selected ? '2px solid #1F4D3A' : '1.5px solid #E5E0D4',
                            }}
                          >
                            <div className="shrink-0 w-9 h-9 rounded-full flex items-center justify-center" style={{ background: '#E8EFEB' }}>
                              <Icon size={16} style={{ color: '#1F4D3A' }} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="text-[13px] font-medium" style={{ color: '#0F1F18' }}>{method.label}</span>
                                <span className="text-[10px] px-1.5 py-0.5 rounded-full font-medium" style={{ background: '#E8EFEB', color: '#1F4D3A' }}>{method.badge}</span>
                              </div>
                              <div className="text-[11px] mt-0.5 truncate" style={{ color: '#65736B' }}>{method.desc}</div>
                            </div>
                            <div className="shrink-0 w-4 h-4 rounded-full border-2 flex items-center justify-center"
                              style={{ borderColor: selected ? '#1F4D3A' : '#C9C3B1' }}>
                              {selected && <div className="w-2 h-2 rounded-full" style={{ background: '#1F4D3A' }} />}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  ) : s2SingleMethod?.value === 'stripe' ? (
                    /* Stripe: show accepted card brands */
                    <div className="flex items-center gap-3 px-4 py-3 rounded-xl" style={{ background: 'white', border: '1.5px solid #E5E0D4' }}>
                      <CreditCard size={16} style={{ color: '#65736B' }} />
                      <span className="text-[13px] flex-1" style={{ color: '#3A4A42' }}>Credit / Debit card</span>
                      <div className="flex items-center gap-1.5">
                        <span className="text-[9px] font-bold px-1.5 py-[3px] rounded" style={{ background: '#1A1F71', color: 'white', letterSpacing: '0.04em' }}>VISA</span>
                        <span className="text-[9px] font-bold px-1.5 py-[3px] rounded" style={{ background: '#EB001B', color: 'white' }}>MC</span>
                        <span className="text-[9px] font-bold px-1.5 py-[3px] rounded" style={{ background: '#016FD0', color: 'white' }}>AMEX</span>
                      </div>
                    </div>
                  ) : s2SingleMethod && S2SingleIcon ? (
                    /* Other single processor */
                    <div className="flex items-center gap-3 px-4 py-3 rounded-xl" style={{ background: 'white', border: '1.5px solid #E5E0D4' }}>
                      <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: '#E8EFEB' }}>
                        <S2SingleIcon size={15} style={{ color: '#1F4D3A' }} />
                      </div>
                      <div>
                        <div className="text-[13px] font-medium" style={{ color: '#0F1F18' }}>{s2SingleMethod.label}</div>
                        <div className="text-[11px]" style={{ color: '#65736B' }}>{s2SingleMethod.desc}</div>
                      </div>
                    </div>
                  ) : null}

                  {/* Secure payment badge */}
                  <div className="flex items-center justify-center gap-1.5 mt-4 text-[11px]" style={{ color: '#65736B' }}>
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                    </svg>
                    Payments are secure and encrypted
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Step 3: Your card */}
          {step === 3 && activeVariant && (
            <div>
              <h2 ref={stepHeadingRef} tabIndex={-1} className="font-display font-normal text-[28px] mb-1.5 outline-none" style={{ color: '#0F1F18', letterSpacing: '-0.02em' }}>
                Design your Eventera Card
              </h2>
              <p className="text-[14px] mb-6" style={{ color: '#65736B' }}>
                Personalise your card — it&apos;ll be sent to you with your ticket confirmation.
              </p>
              <CardZoneFill
                zones={activeVariant.zones}
                values={zoneValues}
                photoUrls={zonePhotoUrls}
                errors={fieldErrors}
                onChange={(id, v) => setZoneValues(p => ({ ...p, [id]: v }))}
                onPhotoSelect={handlePhotoSelect}
                onPhotoClear={handlePhotoClear}
                backgroundUrl={activeVariant.backgroundUrl}
                backgroundWidth={activeVariant.backgroundWidth}
                backgroundHeight={activeVariant.backgroundHeight}
              />
            </div>
          )}

          {/* spacer so content doesn't hide behind sticky nav */}
          <div className="h-4" />
        </div>

        {/* Right sidebar: card preview + order summary.
            Hidden on the card step (step 3) — CardZoneFill renders the single
            live preview there, so a second sidebar preview would be redundant. */}
        {activeVariant && step !== 3 && (
          <aside className="sticky hidden lg:block" style={{ top: 88 }}>
            {/* Card preview — shown while choosing ticket / filling details. */}
            <div className="mb-4">
              <div className="text-[11px] font-semibold uppercase tracking-wider mb-3" style={{ color: '#65736B', fontFamily: 'Inter, system-ui, sans-serif' }}>
                Your Eventera Card
              </div>
              <EventCardPreview
                backgroundUrl={activeVariant.backgroundUrl}
                backgroundWidth={activeVariant.backgroundWidth ?? 1200}
                backgroundHeight={activeVariant.backgroundHeight ?? 800}
                zones={activeVariant.zones}
                values={previewValues}
                photoUrls={previewPhotoUrls}
                style={{ borderRadius: 16, boxShadow: '0 4px 12px rgba(15,31,24,0.08), 0 16px 40px rgba(31,77,58,0.10)' }}
              />
              {(step === 1) && (
                <p className="text-[11px] mt-2 text-center" style={{ color: '#65736B' }}>Preview updates as you type</p>
              )}
            </div>
            {/* Order summary — hidden on step 3 (card personalisation step) */}
            {step < 3 && (
              <div className="rounded-2xl p-6 mt-4" style={{ background: 'white', border: '1px solid #E5E0D4', boxShadow: '0 1px 2px rgba(15,31,24,0.04), 0 8px 24px rgba(15,31,24,0.06)' }}>
                <div className="flex items-center gap-3 pb-4 mb-1" style={{ borderBottom: '1px solid #E5E0D4' }}>
                  {coverUrl ? (
                    <Image src={coverUrl} alt={eventName} width={48} height={48} className="w-12 h-12 rounded-xl object-cover shrink-0" unoptimized />
                  ) : (
                    <div className="w-12 h-12 rounded-xl shrink-0" style={{ background: '#E8EFEB' }} />
                  )}
                  <div>
                    <div className="font-display font-medium text-[15px]" style={{ color: '#0F1F18' }}>{eventName}</div>
                    {(startsAt || city) && (
                      <div className="text-[12px] mt-0.5" style={{ color: '#65736B' }}>
                        {startsAt ? dateStr(startsAt, timezone) : ''}{city ? ` · ${city}` : ''}
                      </div>
                    )}
                  </div>
                </div>
                {selectedTicket && (
                  <>
                    <div className="flex justify-between py-2.5 text-[14px]" style={{ color: '#3A4A42' }}>
                      <span>{selectedTicket.name}</span>
                      <span className="font-title font-semibold" style={{ color: '#0F1F18' }}>
                        {isPWYW && chosenPrice ? fmt(parseFloat(chosenPrice) || 0, selectedTicket.currency) : fmt(selectedTicket.price, selectedTicket.currency)}
                      </span>
                    </div>
                    {appliedPromo && promoDiscount > 0 && (
                      <div className="flex justify-between py-2.5 text-[14px]" style={{ color: '#2D7A4F' }}>
                        <span>Promo &ldquo;{appliedPromo.code}&rdquo;</span>
                        <span className="font-title font-medium">−{fmt(promoDiscount, selectedTicket.currency)}</span>
                      </div>
                    )}
                    {fee > 0 && (
                      <div className="flex justify-between py-2.5 text-[14px]" style={{ color: '#3A4A42' }}>
                        <span>Service fee</span>
                        <span className="font-title font-medium">{fmt(fee, selectedTicket.currency)}</span>
                      </div>
                    )}
                    <div className="flex justify-between items-baseline pt-3 mt-1" style={{ borderTop: '1px solid #E5E0D4' }}>
                      <span className="font-display font-medium text-[15px]" style={{ color: '#0F1F18' }}>Total</span>
                      <span className="font-title font-bold text-[22px]" style={{ color: '#0F1F18' }}>{fmt(total, selectedTicket.currency)}</span>
                    </div>
                  </>
                )}
              </div>
            )}
          </aside>
        )}

        {/* No canvas variant: order summary only */}
        {!activeVariant && (
          <aside className="sticky hidden lg:block" style={{ top: 88 }}>
            <div className="rounded-2xl p-6" style={{ background: 'white', border: '1px solid #E5E0D4', boxShadow: '0 1px 2px rgba(15,31,24,0.04), 0 8px 24px rgba(15,31,24,0.06)' }}>
              <div className="flex items-center gap-3 pb-4 mb-1" style={{ borderBottom: '1px solid #E5E0D4' }}>
                {coverUrl ? (
                  <Image src={coverUrl} alt={eventName} width={48} height={48} className="w-12 h-12 rounded-xl object-cover shrink-0" unoptimized />
                ) : (
                  <div className="w-12 h-12 rounded-xl shrink-0" style={{ background: '#E8EFEB' }} />
                )}
                <div>
                  <div className="font-display font-medium text-[15px]" style={{ color: '#0F1F18' }}>{eventName}</div>
                  {(startsAt || city) && (
                    <div className="text-[12px] mt-0.5" style={{ color: '#65736B' }}>
                      {startsAt ? dateStr(startsAt, timezone) : ''}{city ? ` · ${city}` : ''}
                    </div>
                  )}
                </div>
              </div>
              {selectedTicket && (
                <>
                  <div className="flex justify-between py-2.5 text-[14px]" style={{ color: '#3A4A42' }}>
                    <span>{selectedTicket.name}</span>
                    <span className="font-title font-semibold" style={{ color: '#0F1F18' }}>{fmt(selectedTicket.price, selectedTicket.currency)}</span>
                  </div>
                  {appliedPromo && promoDiscount > 0 && (
                    <div className="flex justify-between py-2.5 text-[14px]" style={{ color: '#2D7A4F' }}>
                      <span>Promo &ldquo;{appliedPromo.code}&rdquo;</span>
                      <span className="font-title font-medium">−{fmt(promoDiscount, selectedTicket.currency)}</span>
                    </div>
                  )}
                  {fee > 0 && (
                    <div className="flex justify-between py-2.5 text-[14px]" style={{ color: '#3A4A42' }}>
                      <span>Service fee</span>
                      <span className="font-title font-medium">{fmt(fee, selectedTicket.currency)}</span>
                    </div>
                  )}
                  <div className="flex justify-between items-baseline pt-3 mt-1" style={{ borderTop: '1px solid #E5E0D4' }}>
                    <span className="font-display font-medium text-[15px]" style={{ color: '#0F1F18' }}>Total</span>
                    <span className="font-title font-bold text-[22px]" style={{ color: '#0F1F18' }}>{fmt(total, selectedTicket.currency)}</span>
                  </div>
                </>
              )}
            </div>
          </aside>
        )}
      </div>

      {cropTarget && (
        <PhotoCropModal
          target={cropTarget}
          onConfirm={handleCropConfirm}
          onCancel={() => setCropTarget(null)}
        />
      )}

      {/* ── Sticky bottom nav bar — always visible regardless of list length ── */}
      <div
        className="fixed bottom-0 left-0 right-0 z-40"
        style={{ background: 'white', borderTop: '1px solid #E5E0D4', boxShadow: '0 -2px 16px rgba(15,31,24,0.07)' }}
      >
        {submitError && (
          <div className="px-5 pt-2">
            <div role="alert" aria-live="assertive" className="max-w-[1100px] mx-auto px-4 py-2 rounded-lg text-[13px] font-medium" style={{ background: '#FEF2F2', color: '#B8423C', border: '1px solid #FECACA' }}>
              {submitError}
            </div>
          </div>
        )}
        <div className="max-w-[1100px] mx-auto px-5 py-3 flex items-center justify-between gap-4">
          {/* Back */}
          <button
            onClick={() => {
              setSubmitError('');
              if (step === 0) router.push(`/e/${eventSlug}`);
              else setStep(s => (s - 1) as 0 | 1 | 2 | 3);
            }}
            className="px-5 h-11 rounded-xl font-medium text-[14px] transition-colors shrink-0"
            style={{ background: '#E8EFEB', color: '#1F4D3A' }}
          >
            ← Back
          </button>

          {/* Ticket summary pill — only on step 0 when ticket selected */}
          {step === 0 && selectedTicket && (
            <div className="hidden sm:flex flex-col items-end min-w-0">
              <span className="text-[13px] font-medium truncate" style={{ color: '#0F1F18' }}>{selectedTicket.name}</span>
              <span className="text-[12px]" style={{ color: '#65736B' }}>{fmt(total, selectedTicket.currency)}</span>
            </div>
          )}

          {/* Primary CTA */}
          {step < 2 ? (
            <button
              onClick={handleContinue}
              disabled={(step === 0 && !selectedTicket) || checkingDup}
              className="h-11 px-7 rounded-xl font-semibold text-[14px] text-white disabled:opacity-40 transition-opacity shrink-0 flex items-center gap-2"
              style={{ background: '#1F4D3A' }}
            >
              {checkingDup && (
                <svg className="animate-spin" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M21 12a9 9 0 1 1-9-9" strokeLinecap="round" />
                </svg>
              )}
              {checkingDup ? 'Checking…' : 'Continue →'}
            </button>
          ) : step === 2 ? (
            <button
              onClick={() => handleSubmit()}
              disabled={submitting}
              className="h-11 px-7 rounded-xl font-semibold text-[14px] text-white disabled:opacity-50 flex items-center gap-2 shrink-0"
              style={{ background: '#1F4D3A' }}
            >
              {submitting && (
                <svg className="animate-spin" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M21 12a9 9 0 1 1-9-9" strokeLinecap="round" />
                </svg>
              )}
              {submitting ? 'Processing…' : isFree ? 'Confirm registration' : `Pay ${fmt(total, selectedTicket?.currency ?? 'USD')} →`}
            </button>
          ) : (
            <button
              onClick={handleCardFinish}
              disabled={submitting}
              className="h-11 px-7 rounded-xl font-semibold text-[14px] text-white disabled:opacity-50 flex items-center gap-2 shrink-0"
              style={{ background: '#1F4D3A' }}
            >
              {submitting && (
                <svg className="animate-spin" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M21 12a9 9 0 1 1-9-9" strokeLinecap="round" />
                </svg>
              )}
              {submitting ? 'Generating card…' : 'Get my card →'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
