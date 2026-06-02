export const dynamic = 'force-dynamic';

import type { Metadata } from 'next';
export const metadata: Metadata = { title: 'Check-in Scanner' };

import { createClient, createAdminClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { QRScanner } from '@/components/check-in/QRScanner';

interface Props { params: Promise<{ id: string }> }

export default async function CheckInPage({ params }: Props) {
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

  const [{ count: totalCount }, { count: checkedInCount }] = await Promise.all([
    admin
      .from('registrations')
      .select('*', { count: 'exact', head: true })
      .eq('event_id', id)
      .in('status', ['confirmed', 'checked_in']),
    admin
      .from('registrations')
      .select('*', { count: 'exact', head: true })
      .eq('event_id', id)
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
