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
  const { data: tickets } = await (admin as any)
    .from('ticket_types')
    .select('id, name, description, price, currency, quantity_total, quantity_sold, is_visible')
    .eq('event_id', event.id)
    .eq('is_visible', true)
    .order('price', { ascending: true });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: page } = await (admin as any)
    .from('event_pages')
    .select('cover_image_url, starts_at, city')
    .eq('event_id', event.id)
    .single();

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
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          coverUrl={(page as any)?.cover_image_url ?? null}
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          startsAt={(page as any)?.starts_at ?? null}
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          city={(page as any)?.city ?? null}
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          tickets={(tickets ?? []) as any}
        />
      </div>
    </div>
  );
}
