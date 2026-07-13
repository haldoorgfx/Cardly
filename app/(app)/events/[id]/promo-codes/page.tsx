export const dynamic = 'force-dynamic';

import { createClient, createAdminClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { PromoCodesManager, type PromoCode } from '@/components/events/PromoCodesManager';
import { resolveEventRef } from '@/lib/events/resolveEventRef';
import { PageShell, PageHeader } from '@/components/dash';

interface Props { params: Promise<{ id: string }> }

export default async function PromoCodesPage({ params }: Props) {
  const { id: _ref } = await params;
  const _ev = await resolveEventRef(_ref);
  if (!_ev) redirect('/dashboard');
  const id = _ev.id;
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const admin = createAdminClient();
  const [{ data: event }, { data: codes }, { data: eventPage }] = await Promise.all([
    admin.from('events').select('id, name, slug').eq('id', id).eq('user_id', user.id).single(),
    admin.from('promo_codes').select('*').eq('event_id', id).order('created_at', { ascending: false }),
    admin.from('event_pages').select('starts_at, ends_at').eq('event_id', id).maybeSingle(),
  ]);

  if (!event) redirect('/dashboard');

  return (
    <PageShell width="wide">
      <PageHeader
        title="Promo codes"
        subtitle="Create discount codes — percent or fixed, with usage limits and date windows."
      />
      <PromoCodesManager
        eventId={id}
        initialCodes={(codes ?? []) as PromoCode[]}
        eventDates={{ starts_at: eventPage?.starts_at ?? null, ends_at: eventPage?.ends_at ?? null }}
      />
    </PageShell>
  );
}
