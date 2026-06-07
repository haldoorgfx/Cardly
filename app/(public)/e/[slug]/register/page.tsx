export const dynamic = 'force-dynamic';

import { createAdminClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import { PublicNav } from '@/components/events/PublicNav';
import { resolvePublicSlug } from '@/lib/events/resolvePublicSlug';
import RegistrationClient from '@/components/registration/RegistrationClient';

interface Props { params: { slug: string } }

export default async function RegisterPage({ params }: Props) {
  const admin = createAdminClient();

  const resolved = await resolvePublicSlug(params.slug);
  if (!resolved) notFound();
  const { event, eventPageTitle } = resolved;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [ticketsRes, pageRes, variantRes] = await Promise.all([
    (admin as any)
      .from('ticket_types')
      .select('id, name, description, price, currency, quantity, quantity_sold, is_visible')
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
      .select('id, background_url, background_width, background_height')
      .eq('event_id', event.id)
      .order('position' as never)
      .limit(1)
      .maybeSingle(),
  ]);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const page = (pageRes as any).data;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const tickets = (ticketsRes as any).data ?? [];
  const rawVariant = variantRes.data;

  const canvasVariant = rawVariant && rawVariant.background_url
    ? {
        backgroundUrl: rawVariant.background_url as string,
        backgroundWidth: rawVariant.background_width as number | null,
        backgroundHeight: rawVariant.background_height as number | null,
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
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          tickets={tickets as any}
          canvasVariant={canvasVariant}
        />
      </div>
    </div>
  );
}
