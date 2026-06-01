export const dynamic = 'force-dynamic';

import { notFound } from 'next/navigation';
import { createAdminClient } from '@/lib/supabase/server';
import { RegistrationFlow } from '@/components/registration/RegistrationFlow';
import type { Zone } from '@/types/database';
import type { Metadata } from 'next';

interface Props {
  params: { slug: string };
  searchParams: { ticket?: string };
}

async function resolveEventPage(slug: string) {
  const admin = createAdminClient();
  const { data: byCustomSlug } = await admin.from('event_pages').select('*').eq('custom_slug', slug).eq('is_public', true).single();
  if (byCustomSlug) return byCustomSlug;
  const { data: event } = await admin.from('events').select('id').eq('slug', slug).single();
  if (!event) return null;
  const { data } = await admin.from('event_pages').select('*').eq('event_id', event.id).eq('is_public', true).single();
  return data ?? null;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const page = await resolveEventPage(params.slug);
  if (!page) return { title: 'Register — Karta' };
  return { title: `Register for ${page.title} — Karta` };
}

export default async function RegisterPage({ params, searchParams }: Props) {
  const page = await resolveEventPage(params.slug);
  if (!page) notFound();

  // Check registration deadline
  if (page.registration_deadline && new Date(page.registration_deadline) < new Date()) {
    return (
      <div className="min-h-screen flex items-center justify-center px-5" style={{ background: '#FAF6EE' }}>
        <div className="text-center">
          <h1 className="font-display font-semibold text-[24px] mb-3" style={{ color: '#0F1F18' }}>
            Registration closed
          </h1>
          <p className="text-[15px] mb-6" style={{ color: '#6B7A72' }}>
            Registration for this event has ended.
          </p>
          <a href={`/e/${params.slug}`} className="text-[14px] font-medium" style={{ color: '#1F4D3A' }}>
            ← Back to event
          </a>
        </div>
      </div>
    );
  }

  const admin = createAdminClient();
  const [{ data: tickets }, { data: formFields }, { data: variants }] = await Promise.all([
    admin.from('ticket_types').select('*').eq('event_id', page.event_id).eq('is_visible', true).order('position'),
    admin.from('registration_form_fields').select('*').eq('event_id', page.event_id).order('position'),
    admin.from('event_variants').select('id, zones, background_url, background_width, background_height, variant_name').eq('event_id', page.event_id).order('position'),
  ]);

  // Determine which variant to use for card personalisation
  const variantId = page.variant_id;
  const rawVariant = variantId
    ? variants?.find(v => v.id === variantId) ?? variants?.[0] ?? null
    : variants?.[0] ?? null;

  const variant = rawVariant ? {
    id: rawVariant.id,
    zones: (rawVariant.zones as unknown as Zone[]) ?? [],
    background_url: rawVariant.background_url,
    background_width: rawVariant.background_width,
    background_height: rawVariant.background_height,
  } : null;

  const allTickets = tickets ?? [];
  if (allTickets.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center px-5" style={{ background: '#FAF6EE' }}>
        <div className="text-center">
          <h1 className="font-display font-semibold text-[24px] mb-3" style={{ color: '#0F1F18' }}>
            No tickets available
          </h1>
          <p className="text-[15px] mb-6" style={{ color: '#6B7A72' }}>
            The organiser hasn&apos;t set up any tickets yet.
          </p>
          <a href={`/e/${params.slug}`} className="text-[14px] font-medium" style={{ color: '#1F4D3A' }}>
            ← Back to event
          </a>
        </div>
      </div>
    );
  }

  return (
    <RegistrationFlow
      eventSlug={params.slug}
      eventId={page.event_id}
      page={page}
      tickets={allTickets}
      formFields={formFields ?? []}
      variant={variant}
      preselectedTicketId={searchParams.ticket}
    />
  );
}
