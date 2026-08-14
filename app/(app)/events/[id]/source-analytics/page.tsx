export const dynamic = 'force-dynamic';

import { createClient, createAdminClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { resolveEventRef } from '@/lib/events/resolveEventRef';
import { SourceAnalyticsClient } from '@/components/events/SourceAnalyticsClient';
import { manageableOwnerIds } from '@/lib/rbac/canManageEvent';
import { isPlatformFeatureEnabled } from '@/lib/features/platform';

export async function generateMetadata() {
  return { title: 'Source Analytics' };
}

export default async function SourceAnalyticsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: _ref } = await params;
  const _ev = await resolveEventRef(_ref);
  if (!_ev) redirect('/dashboard');
  const id = _ev.id;
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const admin = createAdminClient();
  const [{ data: event }, { data: eventPage }] = await Promise.all([
    admin.from('events').select('id, name, slug').eq('id', id).in('user_id', await manageableOwnerIds(user.id)).single(),
    admin.from('event_pages').select('custom_slug').eq('event_id', id).maybeSingle(),
  ]);
  if (!event) redirect('/dashboard');
  if (!(await isPlatformFeatureEnabled('analytics'))) redirect(`/events/${event.slug}`);

  // Fetch registrations with referral_code (used as UTM source).
  // Confirmed + checked_in only — the same set Analytics, Reports,
  // Registrations, Revenue and the Dashboard all call "registrations" for this
  // event. Counting pending/pending_approval rows here inflated the "All
  // sources · N registrations" total past what every other page shows for the
  // exact same event.
  const { data: regs } = await admin
    .from('registrations')
    .select('referral_code, status, amount_paid')
    .eq('event_id', id)
    .in('status', ['confirmed', 'checked_in']);

  const allRegs = regs ?? [];
  const total = allRegs.length;

  // Bucket by source: referral_code maps to ?src= param value
  const buckets: Record<string, number> = {};
  for (const r of allRegs) {
    const src = r.referral_code ?? 'direct';
    buckets[src] = (buckets[src] ?? 0) + 1;
  }

  // Sort by count desc
  const sources = Object.entries(buckets)
    .sort(([, a], [, b]) => b - a)
    .map(([name, count]) => ({ name, count, pct: total > 0 ? Math.round((count / total) * 100) : 0 }));

  const publicSlug = eventPage?.custom_slug ?? event.slug;

  return (
    <SourceAnalyticsClient
      eventId={id}
      eventName={event.name}
      publicSlug={publicSlug}
      sources={sources}
      total={total}
    />
  );
}
