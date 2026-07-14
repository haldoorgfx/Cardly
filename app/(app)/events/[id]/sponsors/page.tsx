export const dynamic = 'force-dynamic';

import { createClient, createAdminClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { resolveEventRef } from '@/lib/events/resolveEventRef';
import { getUserPlan } from '@/lib/billing/can';
import { SponsorsClient } from '@/components/events/SponsorsClient';

interface Props { params: Promise<{ id: string }> }

const PLAN_RANK: Record<string, number> = { free: 0, pro: 1, studio: 2 };

export default async function SponsorsPage({ params }: Props) {
  const { id: _ref } = await params;
  const _ev = await resolveEventRef(_ref);
  if (!_ev) redirect('/dashboard');
  const id = _ev.id;
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  // Plan gate — Sponsors is a Studio feature (minPlan: 'studio' in event overview ACTION_CARDS)
  const plan = await getUserPlan(user.id);
  if (PLAN_RANK[plan] < PLAN_RANK.studio) redirect(`/events/${_ev.slug}`);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const admin = createAdminClient() as any;

  const { data: event } = await admin
    .from('events').select('id, name, slug').eq('id', id).eq('user_id', user.id).single();
  if (!event) redirect('/dashboard');

  const { data: sponsors } = await admin
    .from('sponsors')
    .select('id, company_name, tier, booth_location, website_url, logo_url, contact_email, invite_token, created_at')
    .eq('event_id', id)
    .order('created_at', { ascending: false });

  // Lead counts per sponsor
  const sponsorIds = (sponsors ?? []).map((s: { id: string }) => s.id);
  const leadCounts: Record<string, number> = {};
  if (sponsorIds.length > 0) {
    const { data: leads } = await admin
      .from('sponsor_leads')
      .select('sponsor_id')
      .in('sponsor_id', sponsorIds);
    (leads ?? []).forEach((l: { sponsor_id: string }) => {
      leadCounts[l.sponsor_id] = (leadCounts[l.sponsor_id] ?? 0) + 1;
    });
  }

  const enriched = (sponsors ?? []).map((s: { id: string; company_name: string; tier: string | null; booth_location: string | null; website_url: string | null; logo_url: string | null; contact_email: string | null; invite_token: string; created_at: string }) => ({
    ...s,
    lead_count: leadCounts[s.id] ?? 0,
  }));

  return (
    <SponsorsClient
      eventId={id}
      eventSlug={event.slug}
      eventName={event.name}
      sponsors={enriched}
    />
  );
}
