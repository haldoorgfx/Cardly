export const dynamic = 'force-dynamic';

import type { Metadata } from 'next';
export const metadata: Metadata = { title: 'Registrations' };

import { createClient, createAdminClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { EventManageNav } from '@/components/events/EventManageNav';
import { RegistrationsTable } from '@/components/events/RegistrationsTable';
import { QrCode } from 'lucide-react';

interface Props { params: { id: string } }

export default async function RegistrationsPage({ params }: Props) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const admin = createAdminClient();

  const [{ data: event }, regResult] = await Promise.all([
    admin
      .from('events')
      .select('id, name, slug')
      .eq('id', params.id)
      .eq('user_id', user.id)
      .single(),
    admin
      .from('registrations')
      .select('*, ticket_types(name, price)', { count: 'exact' })
      .eq('event_id', params.id)
      .order('created_at', { ascending: false })
      .range(0, 49),
  ]);

  if (!event) redirect('/dashboard');

  // Resolve event page slug for check-in link
  const { data: eventPage } = await admin
    .from('event_pages')
    .select('custom_slug')
    .eq('event_id', params.id)
    .single();

  const checkInSlug = eventPage?.custom_slug ?? event.slug;

  return (
    <div className="min-h-full" style={{ background: '#FAF6EE' }}>
      <EventManageNav eventId={params.id} eventName={event.name} active="registrations" />

      <div className="max-w-[1100px] mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex items-start justify-between mb-6 gap-4">
          <div>
            <h1
              className="font-display font-semibold text-[24px]"
              style={{ color: '#0F1F18', letterSpacing: '-0.015em' }}
            >
              Registrations
            </h1>
            <p className="text-[14px] mt-1" style={{ color: '#6B7A72' }}>
              Attendee list with check-in status, ticket type, payment, and card download.
            </p>
          </div>

          {/* Check-in scanner link */}
          <Link href={`/e/${checkInSlug}/check-in`}>
            <button
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-[13px] font-medium whitespace-nowrap"
              style={{ background: '#1F4D3A', color: 'white' }}
            >
              <QrCode size={15} />
              Check-in scanner
            </button>
          </Link>
        </div>

        <RegistrationsTable
          eventId={params.id}
          eventSlug={event.slug}
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          initialRegistrations={(regResult.data ?? []) as any}
          totalCount={regResult.count ?? 0}
        />
      </div>
    </div>
  );
}
