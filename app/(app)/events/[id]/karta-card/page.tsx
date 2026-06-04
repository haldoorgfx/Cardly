export const dynamic = 'force-dynamic';

import { createClient, createAdminClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { KartaCardView } from '@/components/events/KartaCardView';

export default async function KartaCardPage({ params }: { params: Promise<{ id: string }> }) {
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

  const { count: totalCards } = await admin
    .from('registrations')
    .select('id', { count: 'exact', head: true })
    .eq('event_id', id)
    .not('karta_card_url', 'is', null);

  return (
    <KartaCardView
      eventId={id}
      eventName={event.name}
      eventSlug={event.slug}
      totalCards={totalCards ?? 0}
      sharedCards={0}
    />
  );
}
