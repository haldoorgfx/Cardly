/* eslint-disable @typescript-eslint/no-explicit-any */
export const dynamic = 'force-dynamic';

import { createAdminClient, createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import { PublicNav } from '@/components/events/PublicNav';
import { resolvePublicSlug } from '@/lib/events/resolvePublicSlug';
import RegistrationClient from '@/components/registration/RegistrationClient';
import type { Zone } from '@/types/database';

interface Props { params: { slug: string }; searchParams?: { ref?: string; utm_source?: string } }

export default async function RegisterPage({ params, searchParams }: Props) {
  const admin = createAdminClient();

  const resolved = await resolvePublicSlug(params.slug);
  if (!resolved) notFound();
  const { event, eventPageTitle } = resolved;

  // Pre-fill registration form for logged-in users
  let sessionName = '';
  let sessionEmail = '';
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
      .select('cover_image_url, starts_at, city')
      .eq('event_id', event.id)
      .single(),
    // Load the primary canvas variant so registration can preview the real card design
    admin
      .from('event_variants')
      .select('id, zones, background_url, background_width, background_height')
      .eq('event_id', event.id)
      .order('position' as never)
      .limit(1)
      .maybeSingle(),
    // Load custom registration form fields configured by the organizer
    (admin as any)
      .from('registration_form_fields')
      .select('id, label, field_type, options, is_required, position')
      .eq('event_id', event.id)
      .order('position'),
  ]);

  const page = (pageRes as any).data;
  const tickets = (ticketsRes as any).data ?? [];
  const formFields = (formFieldsRes as any).data ?? [];
  const rawVariant = variantRes.data;

  const canvasVariant = rawVariant && rawVariant.background_url
    ? {
        id: rawVariant.id as string,
        backgroundUrl: rawVariant.background_url as string,
        backgroundWidth: rawVariant.background_width as number | null,
        backgroundHeight: rawVariant.background_height as number | null,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        zones: (rawVariant.zones ?? []) as unknown as Zone[],
      }
    : null;

  return (
    <div style={{ background: '#FAF6EE', minHeight: '100vh', position: 'relative', overflow: 'hidden' }}>
      <PublicNav eventSlug={params.slug} eventName={event.name} />

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
          canvasVariant={canvasVariant}
          initialName={sessionName}
          initialEmail={sessionEmail}
          formFields={formFields}
          referralCode={searchParams?.ref ?? null}
          utmSource={searchParams?.utm_source ?? null}
        />
      </div>
    </div>
  );
}
