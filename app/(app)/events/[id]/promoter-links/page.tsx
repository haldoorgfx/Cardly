export const dynamic = 'force-dynamic';

import { createClient, createAdminClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { PromoterLinksManager } from '@/components/events/PromoterLinksManager';
import { resolveEventRef } from '@/lib/events/resolveEventRef';
import { PageShell, PageHeader } from '@/components/dash';
import { manageableOwnerIds } from '@/lib/rbac/canManageEvent';
import { isPlatformFeatureEnabled } from '@/lib/features/platform';

interface Props { params: Promise<{ id: string }> }

export default async function PromoterLinksPage({ params }: Props) {
  const { id: _ref } = await params;
  const _ev = await resolveEventRef(_ref);
  if (!_ev) redirect('/dashboard');
  const id = _ev.id;
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const admin = createAdminClient();
  const [{ data: event }, { data: codes }] = await Promise.all([
    admin.from('events').select('id, name, slug').eq('id', id).in('user_id', await manageableOwnerIds(user.id)).single(),
    admin.from('promoter_codes').select('*').eq('event_id', id).order('created_at', { ascending: false }),
  ]);

  if (!event) redirect('/dashboard');
  if (!(await isPlatformFeatureEnabled('promote'))) redirect(`/events/${_ev.slug}`);

  // Fetch registration stats per promoter code
  const { data: regs } = await admin
    .from('registrations')
    .select('referral_code, amount_paid, status')
    .eq('event_id', id)
    .not('referral_code', 'is', null)
    .in('status', ['confirmed', 'checked_in', 'pending_approval']);

  const statsMap: Record<string, { uses: number; revenue: number }> = {};
  for (const r of regs ?? []) {
    if (!r.referral_code) continue;
    const key = r.referral_code.toUpperCase();
    if (!statsMap[key]) statsMap[key] = { uses: 0, revenue: 0 };
    statsMap[key].uses++;
    if (r.status !== 'pending_approval') statsMap[key].revenue += r.amount_paid ?? 0;
  }

  const codesWithStats = (codes ?? []).map(c => ({
    ...c,
    uses:    statsMap[c.code]?.uses    ?? 0,
    revenue: statsMap[c.code]?.revenue ?? 0,
  }));

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? '';

  return (
    <PageShell width="wide">
      <PageHeader
        title="Promoter links"
        subtitle="Generate trackable links for partners, affiliates, and community promoters."
      />
      <PromoterLinksManager
        eventId={id}
        eventSlug={event.slug}
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        initialCodes={codesWithStats as any}
        appUrl={appUrl}
      />
    </PageShell>
  );
}
