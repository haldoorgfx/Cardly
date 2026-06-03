export const dynamic = 'force-dynamic';

import type { Metadata } from 'next';
export const metadata: Metadata = { title: 'Registrations' };

import { createClient, createAdminClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { RegistrationsTable } from '@/components/events/RegistrationsTable';

export default async function RegistrationsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const admin = createAdminClient();

  const [{ data: event }, regResult, { count: checkedInCount }, { count: cardCount }] = await Promise.all([
    admin.from('events').select('id, name, slug').eq('id', id).eq('user_id', user.id).single(),
    admin.from('registrations')
      .select('*, ticket_types(name, price)', { count: 'exact' })
      .eq('event_id', id)
      .order('created_at', { ascending: false })
      .range(0, 49),
    admin.from('registrations')
      .select('id', { count: 'exact', head: true })
      .eq('event_id', id).eq('status', 'checked_in'),
    admin.from('generated_cards')
      .select('id', { count: 'exact', head: true })
      .eq('event_id', id),
  ]);

  if (!event) redirect('/dashboard');

  const totalCount  = regResult.count ?? 0;
  const checkedIn   = checkedInCount ?? 0;
  const cards       = cardCount ?? 0;

  return (
    <div className="min-h-full" style={{ background: '#FAF6EE' }}>
      <div className="max-w-[1100px] mx-auto px-6 lg:px-8 py-8">

        {/* ── Page header ──────────────────────────────── */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <h1
              className="font-display text-[24px] font-semibold tracking-[-0.02em]"
              style={{ color: '#1F4D3A' }}
            >
              Registrations
            </h1>
            <p className="text-[14px] mt-0.5" style={{ color: '#6B7A72' }}>
              {totalCount} attendee{totalCount !== 1 ? 's' : ''}&nbsp;·&nbsp;
              {checkedIn} checked in&nbsp;·&nbsp;
              {cards} cards generated
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <a
              href={`/api/events/${id}/export`}
              download
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg border text-[13px] font-medium transition-colors"
              style={{ borderColor: '#E5E0D4', color: '#6B7A72', background: 'white' }}
            >
              ↓ Export CSV
            </a>
          </div>
        </div>

        <RegistrationsTable
          eventId={id}
          eventSlug={event.slug}
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          initialRegistrations={(regResult.data ?? []) as any}
          totalCount={totalCount}
        />
      </div>
    </div>
  );
}
