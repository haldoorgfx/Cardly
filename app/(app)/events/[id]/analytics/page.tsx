export const dynamic = 'force-dynamic';

import { createClient, createAdminClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { EventManageNav } from '@/components/events/EventManageNav';

interface Props { params: { id: string } }

export default async function EventAnalyticsPage({ params }: Props) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const admin = createAdminClient();
  const { data: event } = await admin
    .from('events')
    .select('id, name, slug')
    .eq('id', params.id)
    .eq('user_id', user.id)
    .single();

  if (!event) redirect('/dashboard');

  return (
    <div className="min-h-full" style={{ background: '#FAF6EE' }}>
      <EventManageNav eventId={params.id} eventName={event.name} active="analytics" />
      <div className="max-w-[1000px] mx-auto px-6 py-8">
        <div className="mb-6">
          <h1 className="font-display font-semibold text-[24px]" style={{ color: '#0F1F18', letterSpacing: '-0.015em' }}>
            Analytics
          </h1>
          <p className="text-[14px] mt-1" style={{ color: '#6B7A72' }}>
            Registration metrics, revenue by ticket type, check-in rate, card download rate.
          </p>
        </div>
        {/* Phase 1.9 — analytics charts built here */}
        <div
          className="rounded-2xl flex items-center justify-center py-20 text-center"
          style={{ background: 'white', border: '1px solid #E5E0D4' }}
        >
          <div>
            <div className="font-mono text-[11px] tracking-widest uppercase mb-2" style={{ color: '#6B7A72' }}>Phase 1.9</div>
            <div className="text-[14px]" style={{ color: '#3A4A42' }}>
              Registrations over time · revenue · check-in rate · card download rate
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
