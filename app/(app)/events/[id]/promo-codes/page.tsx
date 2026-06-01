export const dynamic = 'force-dynamic';

import { createClient, createAdminClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { EventManageNav } from '@/components/events/EventManageNav';
import { PromoCodesManager } from '@/components/events/PromoCodesManager';

interface Props { params: { id: string } }

export default async function PromoCodesPage({ params }: Props) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const admin = createAdminClient();
  const [{ data: event }, { data: codes }] = await Promise.all([
    admin.from('events').select('id, name, slug').eq('id', params.id).eq('user_id', user.id).single(),
    admin.from('promo_codes').select('*').eq('event_id', params.id).order('created_at', { ascending: false }),
  ]);

  if (!event) redirect('/dashboard');

  return (
    <div className="min-h-full" style={{ background: '#FAF6EE' }}>
      <EventManageNav eventId={params.id} eventName={event.name} active="promo-codes" />
      <div className="max-w-[800px] mx-auto px-6 py-8">
        <div className="mb-6">
          <h1 className="font-display font-semibold text-[24px]" style={{ color: '#0F1F18', letterSpacing: '-0.015em' }}>
            Promo codes
          </h1>
          <p className="text-[14px] mt-1" style={{ color: '#6B7A72' }}>
            Create discount codes — percent or fixed, with usage limits and date windows.
          </p>
        </div>
        {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
        <PromoCodesManager eventId={params.id} initialCodes={(codes ?? []) as any} />
      </div>
    </div>
  );
}
