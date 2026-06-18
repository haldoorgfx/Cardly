export const dynamic = 'force-dynamic';

import { createClient, createAdminClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { resolveEventRef } from '@/lib/events/resolveEventRef';
import { ChevronLeft, CheckCircle2, Clock, Scan } from 'lucide-react';
import { RegistrationDetailActions } from '@/components/events/RegistrationDetailActions';

interface Props { params: Promise<{ id: string; regId: string }> }

function initials(name: string) {
  return name.split(' ').map(p => p[0]).join('').toUpperCase().slice(0, 2);
}

const AVATAR_GRADS = [
  'linear-gradient(135deg,#1F4D3A,#2A6A50)',
  'linear-gradient(135deg,#3E7E5E,#C9A45E)',
  'linear-gradient(135deg,#163828,#3E7E5E)',
  'linear-gradient(135deg,#2A6A50,#E8C57E)',
];

function InfoRow({ label, children, last }: { label: string; children: React.ReactNode; last?: boolean }) {
  return (
    <div className={`flex items-center justify-between gap-4 py-2.5 ${last ? '' : 'border-b'}`} style={{ borderColor: '#E5E0D4' }}>
      <span className=" text-[10px] tracking-[0.12em] uppercase" style={{ color: '#6B7A72' }}>{label}</span>
      <span className="text-[13.5px] text-right" style={{ color: '#0F1F18' }}>{children}</span>
    </div>
  );
}

const STATUS_LABEL: Record<string, string> = {
  confirmed: 'Confirmed', checked_in: 'Checked in', pending: 'Pending', cancelled: 'Cancelled', refunded: 'Refunded',
};
const STATUS_STYLE: Record<string, { bg: string; color: string }> = {
  confirmed:  { bg: '#E8EFEB', color: '#1F4D3A' },
  checked_in: { bg: '#D1FAE5', color: '#065F46' },
  pending:    { bg: '#FEF3C7', color: '#92400E' },
  cancelled:  { bg: '#FEE2E2', color: '#991B1B' },
  refunded:   { bg: '#E0E7FF', color: '#3730A3' },
};

export default async function AttendeeDetailPage({ params }: Props) {
  const { id: _ref, regId } = await params;
  const _ev = await resolveEventRef(_ref);
  if (!_ev) redirect('/dashboard');
  const id = _ev.id;
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const admin = createAdminClient();
  const [{ data: event }, { data: reg }, { data: formFields }] = await Promise.all([
    admin.from('events').select('id, name, slug').eq('id', id).eq('user_id', user.id).single(),
    admin.from('registrations')
      .select('*, ticket_types(name, price, currency)')
      .eq('id', regId)
      .eq('event_id', id)
      .single(),
    admin.from('registration_form_fields').select('id, label, field_type, position').eq('event_id', id).order('position'),
  ]);

  if (!event || !reg) redirect(`/events/${_ev.slug}/registrations`);

  // Build the attendee's form responses: map stored answers (keyed by field id) to labels.
  const answers = (reg.custom_fields ?? {}) as Record<string, unknown>;
  const fmtAnswer = (v: unknown): string => {
    if (v === true || v === 'true') return 'Yes';
    if (v === false || v === 'false' || v == null || v === '') return '';
    return String(v);
  };
  const responses = (formFields ?? [])
    .map(f => ({ label: f.label, value: fmtAnswer(answers[f.id]) }))
    .filter(r => r.value !== '');
  // Any extra answers not tied to a known field (e.g. legacy keys), excluding internal ones
  const knownIds = new Set((formFields ?? []).map(f => f.id));
  const extraResponses = Object.entries(answers)
    .filter(([k, v]) => !knownIds.has(k) && !k.startsWith('__') && fmtAnswer(v) !== '')
    .map(([k, v]) => ({ label: k, value: fmtAnswer(v) }));

  const firstChar = reg.attendee_name?.[0];
  const gradIdx = firstChar ? firstChar.charCodeAt(0) % AVATAR_GRADS.length : 0;
  const avatarGrad = AVATAR_GRADS[gradIdx];
  const statusStyle = STATUS_STYLE[reg.status] ?? STATUS_STYLE.pending;
  const registeredDate = new Date(reg.created_at).toLocaleDateString(undefined, { day: 'numeric', month: 'long', year: 'numeric' });
  const checkedInDate = reg.checked_in_at
    ? new Date(reg.checked_in_at).toLocaleDateString(undefined, { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
    : null;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const ticket = (reg as any).ticket_types as { name: string; price: number; currency: string } | null;
  const amountStr = reg.amount_paid > 0
    ? new Intl.NumberFormat(undefined, { style: 'currency', currency: reg.currency || 'USD', minimumFractionDigits: 0 }).format(reg.amount_paid)
    : 'Free';

  const timeline = [
    ...(reg.eventera_card_url ? [{ text: 'Generated their Eventera Card', when: registeredDate, color: '#C9A45E' }] : []),
    ...(checkedInDate ? [{ text: 'Checked in', when: checkedInDate, color: '#2D7A4F' }] : []),
    { text: `Registered · ${ticket?.name ?? 'General'}`, when: registeredDate, color: '#1F4D3A' },
    ...(reg.source ? [{ text: `Visited from ${reg.source}`, when: registeredDate, color: '#A8C2B5' }] : []),
  ];

  return (
    <div className="min-h-full" style={{ background: '#FAF6EE' }}>
      <div className="max-w-[1100px] mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">

        {/* Back */}
        <Link href={`/events/${_ev.slug}/registrations`}
          className="inline-flex items-center gap-1.5 text-[13px] mb-5 hover:opacity-80 transition-opacity"
          style={{ color: '#6B7A72' }}>
          <ChevronLeft size={15} /> Registrations
        </Link>

        {/* Header */}
        <div className="flex items-start gap-4 mb-6">
          <div className="w-16 h-16 rounded-2xl grid place-items-center shrink-0 text-white font-display text-[20px] font-semibold"
            style={{ background: avatarGrad }}>
            {initials(reg.attendee_name)}
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="font-display text-[24px] font-semibold leading-tight" style={{ color: '#0F1F18', letterSpacing: '-0.02em' }}>
              {reg.attendee_name}
            </h1>
            <div className="flex items-center gap-2 flex-wrap mt-2">
              {ticket && (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[12px] font-medium"
                  style={{ background: '#E8EFEB', color: '#1F4D3A' }}>
                  {ticket.name}
                </span>
              )}
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[12px] font-medium"
                style={{ background: statusStyle.bg, color: statusStyle.color }}>
                {reg.status === 'checked_in' && <CheckCircle2 size={10} />}
                {reg.status === 'confirmed' && <Clock size={10} />}
                {STATUS_LABEL[reg.status] ?? reg.status}
              </span>
            </div>
            <div className=" text-[12.5px] mt-2" style={{ color: '#6B7A72' }}>{reg.attendee_email}</div>
          </div>
          <div className="flex items-center gap-2 shrink-0 flex-wrap">
            <Link href={`/events/${_ev.slug}/check-in`}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-[13px] font-medium transition-all hover:opacity-90"
              style={{ background: '#1F4D3A', color: 'white' }}>
              <Scan size={14} /> Check in
            </Link>
            <RegistrationDetailActions
              regId={regId}
              eventId={id}
              currentStatus={reg.status}
              attendeeName={reg.attendee_name}
              attendeeEmail={reg.attendee_email}
              attendeePhone={reg.attendee_phone}
            />
          </div>
        </div>

        {/* Body */}
        <div className="grid lg:grid-cols-[1fr_320px] gap-5">

          {/* Left */}
          <div className="grid gap-5 content-start">
            {/* Activity timeline */}
            <div className="bg-white rounded-2xl p-5" style={{ border: '1px solid #E5E0D4', boxShadow: '0 1px 2px rgba(15,31,24,0.04)' }}>
              <div className="font-display text-[14.5px] font-semibold mb-5" style={{ color: '#0F1F18', letterSpacing: '-0.01em' }}>Activity</div>
              <div className="relative pl-6">
                <span className="absolute left-[5px] top-1.5 bottom-1.5 w-px" style={{ background: '#E5E0D4' }} />
                <div className="grid gap-4">
                  {timeline.map((item, i) => (
                    <div key={i} className="relative">
                      <span className="absolute -left-6 top-1 w-3 h-3 rounded-full ring-4"
                        style={{ background: item.color, outline: '3px solid white', outlineOffset: '-1px' }} />
                      <div className="text-[13px] leading-snug" style={{ color: '#0F1F18' }}>{item.text}</div>
                      <div className=" text-[11px] mt-0.5" style={{ color: '#6B7A72' }}>{item.when}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Form responses */}
            {(responses.length > 0 || extraResponses.length > 0) && (
              <div className="bg-white rounded-2xl p-5" style={{ border: '1px solid #E5E0D4', boxShadow: '0 1px 2px rgba(15,31,24,0.04)' }}>
                <div className="font-display text-[14.5px] font-semibold mb-4" style={{ color: '#0F1F18', letterSpacing: '-0.01em' }}>Form responses</div>
                <div className="grid gap-3">
                  {[...responses, ...extraResponses].map((r, i) => (
                    <div key={i} className="grid gap-0.5">
                      <span className="text-[10px] tracking-[0.12em] uppercase" style={{ color: '#6B7A72' }}>{r.label}</span>
                      <span className="text-[14px] whitespace-pre-line" style={{ color: '#0F1F18' }}>{r.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right */}
          <div className="grid gap-5 content-start">
            {/* Registration details */}
            <div className="bg-white rounded-2xl p-5" style={{ border: '1px solid #E5E0D4', boxShadow: '0 1px 2px rgba(15,31,24,0.04)' }}>
              <div className="font-display text-[14.5px] font-semibold mb-4" style={{ color: '#0F1F18', letterSpacing: '-0.01em' }}>Registration</div>
              <InfoRow label="Order ID">#{regId.slice(0, 8).toUpperCase()}</InfoRow>
              <InfoRow label="Ticket">{ticket?.name ?? 'General'} · {amountStr}</InfoRow>
              <InfoRow label="Payment">{reg.payment_status}</InfoRow>
              {reg.attendee_phone && <InfoRow label="Phone">{reg.attendee_phone}</InfoRow>}
              <InfoRow label="Registered">{registeredDate}</InfoRow>
              <InfoRow label="Eventera Card" last>{reg.eventera_card_url ? 'Generated' : 'Not yet'}</InfoRow>
            </div>

            {/* Eventera Card preview */}
            {reg.eventera_card_url && (
              <div className="bg-white rounded-2xl p-5" style={{ border: '1px solid #E5E0D4', boxShadow: '0 1px 2px rgba(15,31,24,0.04)' }}>
                <div className="font-display text-[14.5px] font-semibold mb-4" style={{ color: '#0F1F18', letterSpacing: '-0.01em' }}>Their Eventera Card</div>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={reg.eventera_card_url} alt="Eventera Card" className="w-full rounded-xl" style={{ border: '1px solid #E5E0D4' }} />
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
