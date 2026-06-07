export const dynamic = 'force-dynamic';

import { createClient, createAdminClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { PromoCodesManager } from '@/components/events/PromoCodesManager';

interface Props { params: Promise<{ id: string }> }

export default async function PromoCodesPage({ params }: Props) {
  const { id } = await params;
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const admin = createAdminClient();
  const [{ data: event }, { data: codes }] = await Promise.all([
    admin.from('events').select('id, name, slug').eq('id', id).eq('user_id', user.id).single(),
    admin.from('promo_codes').select('*').eq('event_id', id).order('created_at', { ascending: false }),
  ]);

  if (!event) redirect('/dashboard');

  return (
    <div className="min-h-full" style={{ background: '#FAF6EE' }}>
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
        <PromoCodesManager eventId={id} initialCodes={(codes ?? []) as any} />
      </div>
    </div>
  );
}
