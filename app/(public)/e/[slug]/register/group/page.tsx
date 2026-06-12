export const dynamic = 'force-dynamic';

import { createAdminClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import { resolvePublicSlug } from '@/lib/events/resolvePublicSlug';
import { GroupRegistrationClient } from '@/components/registration/GroupRegistrationClient';

interface Props { params: { slug: string } }

export async function generateMetadata({ params }: Props) {
  return { title: `Group Registration — ${params.slug}` };
}

export default async function GroupRegistrationPage({ params }: Props) {
  const admin = createAdminClient();
  const resolved = await resolvePublicSlug(params.slug);
  if (!resolved) notFound();
  const { event } = resolved;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const adminAny = admin as any;

  const { data: tickets } = await adminAny
    .from('ticket_types')
    .select('id, name, description, price, currency, quantity, quantity_sold, is_visible')
    .eq('event_id', event.id)
    .eq('is_visible', true)
    .order('price', { ascending: true });

  const available = (tickets ?? []).filter(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (t: any) => t.quantity === null || t.quantity_sold < t.quantity
  );

  return (
    <GroupRegistrationClient
      eventId={event.id}
      eventName={event.name}
      eventSlug={params.slug}
      tickets={available}
    />
  );
}
