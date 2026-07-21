export const dynamic = 'force-dynamic';

import type { Metadata } from 'next';
export const metadata: Metadata = { title: 'Catering' };

import { createClient, createAdminClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { resolveEventRef } from '@/lib/events/resolveEventRef';
import { CateringClient } from '@/components/catering/CateringClient';
import type { Meal } from '@/components/catering/CateringClient';
import { manageableOwnerIds } from '@/lib/rbac/canManageEvent';

interface Props { params: Promise<{ id: string }> }

export default async function CateringPage({ params }: Props) {
  const { id: _ref } = await params;
  const _ev = await resolveEventRef(_ref);
  if (!_ev) redirect('/dashboard');
  const id = _ev.id;

  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const admin = createAdminClient() as any;
  const { data: event } = await admin
    .from('events')
    .select('id, name, slug')
    .eq('id', id)
    .in('user_id', await manageableOwnerIds(user.id))
    .single();
  if (!event) redirect('/dashboard');

  // catering_counts authorises on auth.uid() → call with the SESSION client, and
  // catch its NOT_AUTHORISED (P0001) instead of surfacing a 500.
  let meals: Meal[] | null = null;
  let loadError: 'auth' | 'generic' | null = null;
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const sessionDb = createClient() as any;
    const { data, error } = await sessionDb.rpc('catering_counts', { p_event_id: id });
    if (error) {
      loadError = error.code === 'P0001' && /NOT_AUTHORISED/.test(error.message ?? '') ? 'auth' : 'generic';
    } else {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const rawMeals = ((data?.meals ?? []) as any[]);
      meals = rawMeals.map((m) => ({
        entitlement_id: m.entitlement_id,
        entitlement_name: m.entitlement_name ?? 'Meal',
        total_redeemed: Number(m.total_redeemed ?? 0),
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        dietary: ((m.dietary ?? []) as any[]).map((d) => ({ tag: String(d.tag ?? ''), count: Number(d.count ?? 0) })),
      }));
    }
  } catch {
    loadError = 'generic';
  }

  return <CateringClient eventSlug={event.slug} meals={meals} loadError={loadError} />;
}
