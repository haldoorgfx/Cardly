export const dynamic = 'force-dynamic';

import { createClient, createAdminClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { QRScanner } from '@/components/check-in/QRScanner';

interface Props { params: { slug: string } }

export default async function CheckInPage({ params }: Props) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect(`/login?next=/e/${params.slug}/check-in`);

  const admin = createAdminClient();

  // Resolve event by custom_slug or event slug
  const { data: eventPage } = await admin
    .from('event_pages')
    .select('event_id, title, events!inner(id, slug, name, user_id, status)')
    .or(`custom_slug.eq.${params.slug},events.slug.eq.${params.slug}`)
    .single();

  if (!eventPage) redirect('/events');

  const event = eventPage.events as unknown as { id: string; slug: string; name: string; user_id: string; status: string };

  // Only the event owner can access the check-in scanner
  if (event.user_id !== user.id) redirect('/dashboard');

  // Get check-in stats
  const [{ count: totalCount }, { count: checkedInCount }] = await Promise.all([
    admin
      .from('registrations')
      .select('*', { count: 'exact', head: true })
      .eq('event_id', event.id)
      .in('status', ['confirmed', 'checked_in']),
    admin
      .from('registrations')
      .select('*', { count: 'exact', head: true })
      .eq('event_id', event.id)
      .eq('status', 'checked_in'),
  ]);

  return (
    <QRScanner
      eventId={event.id}
      eventName={event.name}
      totalRegistrations={totalCount ?? 0}
      initialCheckedIn={checkedInCount ?? 0}
    />
  );
}
