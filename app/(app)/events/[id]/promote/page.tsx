export const dynamic = 'force-dynamic';

import { createClient, createAdminClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { PromotedListingClient } from '@/components/events/PromotedListingClient';

export async function generateMetadata() {
  return { title: 'Promote Event' };
}

export default async function PromotePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const admin = createAdminClient();
  const { data: event } = await admin
    .from('events')
    .select('id, name, slug, status')
    .eq('id', id)
    .eq('user_id', user.id)
    .single();

  if (!event) redirect('/dashboard');

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: campaign } = await (admin as any)
    .from('promoted_listings')
    .select('*')
    .eq('event_id', id)
    .maybeSingle();

  return (
    <PromotedListingClient
      eventId={id}
      eventName={event.name}
      eventSlug={event.slug}
      campaign={campaign}
    />
  );
}
