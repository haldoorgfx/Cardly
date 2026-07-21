export const dynamic = 'force-dynamic';

import { createClient, createAdminClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { QRScanner } from '@/components/check-in/QRScanner';
import { hasCheckInAccess } from '@/lib/rbac/ownership';

interface Props { params: { slug: string } }

export default async function CheckInPage({ params }: Props) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect(`/login?next=/e/${params.slug}/check-in`);

  const admin = createAdminClient();

  // Resolve event by custom_slug or events.slug (two-step; cross-table .or() doesn't work in PostgREST)
  const { data: byCustom } = await admin
    .from('event_pages')
    .select('event_id')
    .eq('custom_slug', params.slug)
    .single();

  const eventId = byCustom?.event_id ?? (await admin
    .from('events')
    .select('id')
    .eq('slug', params.slug)
    .single()
    .then(r => r.data?.id));

  if (!eventId) redirect('/events');

  const { data: event } = await admin
    .from('events')
    .select('id, slug, name, user_id, status')
    .eq('id', eventId)
    .single();

  if (!event) redirect('/events');

  // Same gate as /events/[id]/check-in. This used to be a hand-rolled
  // `event.user_id !== user.id`, which is a second, stricter rule for the same
  // scanner: an event_staff member with the 'check_in' role — the people the
  // Staff UI tells you can "Scan QR codes" — was bounced to /dashboard here
  // while being let into the identical scanner one route over. This is also
  // the URL printed inside every attendee QR code, so it is the one a staff
  // phone lands on when it scans a badge with the native camera app.
  if (!(await hasCheckInAccess(user.id, event.id))) redirect('/dashboard');

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
      eventSlug={event.slug}
      eventName={event.name}
      totalRegistrations={totalCount ?? 0}
      initialCheckedIn={checkedInCount ?? 0}
    />
  );
}
