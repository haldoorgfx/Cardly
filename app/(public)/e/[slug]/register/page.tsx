/* eslint-disable @typescript-eslint/no-explicit-any */
export const dynamic = 'force-dynamic';

import { createAdminClient, createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import { resolvePublicSlug } from '@/lib/events/resolvePublicSlug';
import RegistrationClient from '@/components/registration/RegistrationClient';
import type { Zone } from '@/types/database';

interface Props { params: { slug: string }; searchParams?: { ref?: string; utm_source?: string; ticket?: string } }

export default async function RegisterPage({ params, searchParams }: Props) {
  const admin = createAdminClient();

  const resolved = await resolvePublicSlug(params.slug);
  if (!resolved) notFound();
  const { event, eventPageTitle } = resolved;

  // Pre-fill registration form for logged-in users
  let sessionName = '';
  let sessionEmail = '';
  let alreadyRegistered = false;
  let existingTicketToken: string | null = null;
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      sessionEmail = user.email ?? '';
      const { data: profile } = await admin
        .from('profiles')
        .select('full_name')
        .eq('id', user.id)
        .single();
      if (profile?.full_name) sessionName = profile.full_name;

      // Detect an existing registration up front so we don't make the
      // attendee fill out the whole form only to be rejected at Confirm.
      // Only block on truly-completed registrations (confirmed / checked_in).
      // pending_approval = still in limbo; pending = abandoned payment — both
      // are handled gracefully in the form itself or the API cleanup logic.
      //
      // IMPORTANT: match ONLY this authenticated user. Build the identity filter
      // from real values — never `attendee_email.eq.` with a blank value, which
      // PostgREST treats as "email equals empty string" and would match unrelated
      // registrations (guest/imported rows with a null/blank email), producing a
      // false "already registered" on events the user never registered for.
      const normalizedEmail = sessionEmail.trim().toLowerCase();
      const identityFilters: string[] = [`user_id.eq.${user.id}`];
      if (normalizedEmail) identityFilters.push(`attendee_email.eq.${normalizedEmail}`);

      const { data: existing } = await (admin as any)
        .from('registrations')
        .select('id, qr_code_token')
        .eq('event_id', event.id)
        .or(identityFilters.join(','))
        .in('status', ['confirmed', 'checked_in'])
        .limit(1)
        .maybeSingle();
      alreadyRegistered = !!existing;
      if (existing?.qr_code_token) existingTicketToken = existing.qr_code_token as string;
    }
  } catch { /* non-blocking — if auth fails, form starts empty */ }

  const [ticketsRes, pageRes, variantRes, formFieldsRes] = await Promise.all([
    (admin as any)
      .from('ticket_types')
      .select('id, name, description, price, currency, quantity, quantity_sold, is_visible, min_price')
      .eq('event_id', event.id)
      .eq('is_visible', true)
      .order('price', { ascending: true }),
    (admin as any)
      .from('event_pages')
      .select('cover_image_url, starts_at, ends_at, city, payment_processor, payment_processors, registration_deadline')
      .eq('event_id', event.id)
      .single(),
    // Load all variants — client picks the one matching the selected ticket (or the default)
    admin
      .from('event_variants')
      .select('id, zones, background_url, background_width, background_height, ticket_type_id')
      .eq('event_id', event.id)
      .order('position' as never),
    // Load custom registration form fields configured by the organizer
    (admin as any)
      .from('registration_form_fields')
      .select('id, label, field_type, options, is_required, position')
      .eq('event_id', event.id)
      .order('position'),
  ]);

  const page = (pageRes as any).data;
  const now = new Date();
  const registrationsClosed = !!(
    (page?.registration_deadline && new Date(page.registration_deadline) < now) ||
    (page?.ends_at && new Date(page.ends_at) < now)
  );
  const tickets = (ticketsRes as any).data ?? [];
  // Dedupe custom fields by label so a misconfigured form never shows the
  // same field twice to attendees (e.g. two "Job Title" fields).
  const seenLabels = new Set<string>();
  const formFields = ((formFieldsRes as any).data ?? []).filter((f: any) => {
    const key = (f.label ?? '').trim().toLowerCase();
    if (!key || seenLabels.has(key)) return false;
    seenLabels.add(key);
    return true;
  });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const rawVariants: any[] = variantRes.data ?? [];

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  function toCanvasVariant(r: any) {
    if (!r?.background_url) return null;
    return {
      id: r.id as string,
      backgroundUrl: r.background_url as string,
      backgroundWidth: r.background_width as number | null,
      backgroundHeight: r.background_height as number | null,
      zones: (r.zones ?? []) as unknown as Zone[],
      ticketTypeId: (r.ticket_type_id as string | null) ?? null,
    };
  }

  const allVariants = rawVariants.map(toCanvasVariant).filter(Boolean) as NonNullable<ReturnType<typeof toCanvasVariant>>[];

  return (
    <div style={{ background: '#FAF6EE', minHeight: '100vh', position: 'relative', overflow: 'hidden' }}>

      {/* Mesh gradient */}
      <div
        style={{
          position: 'absolute', top: 56, left: '50%', transform: 'translateX(-50%)',
          width: 900, height: 380, pointerEvents: 'none', zIndex: 0,
          background: 'radial-gradient(40% 55% at 22% 28%, rgba(31,77,58,0.18), transparent 62%), radial-gradient(38% 55% at 80% 42%, rgba(232,197,126,0.22), transparent 62%)',
          filter: 'blur(80px)',
        }}
      />

      <div style={{ position: 'relative', zIndex: 1 }}>
        <RegistrationClient
          eventSlug={params.slug}
          eventId={event.id}
          eventName={event.name}
          eventSubtitle={eventPageTitle ?? event.name}
          coverUrl={page?.cover_image_url ?? null}
          startsAt={page?.starts_at ?? null}
          city={page?.city ?? null}
          tickets={tickets as any}
          allVariants={allVariants}
          canvasVariant={allVariants[0] ?? null}
          availableProcessors={
            (page?.payment_processors as string[] | null)?.length
              ? (page.payment_processors as string[])
              : (page?.payment_processor ? [page.payment_processor as string] : ['stripe'])
          }
          initialName={sessionName}
          initialEmail={sessionEmail}
          formFields={formFields}
          referralCode={searchParams?.ref ?? null}
          utmSource={searchParams?.utm_source ?? null}
          initialTicketId={searchParams?.ticket ?? null}
          alreadyRegistered={alreadyRegistered}
          existingTicketToken={existingTicketToken}
          registrationsClosed={registrationsClosed}
        />
      </div>
    </div>
  );
}
