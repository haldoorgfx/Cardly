export const dynamic = 'force-dynamic';

import { createClient, createAdminClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { resolveEventRef } from '@/lib/events/resolveEventRef';
import { AICopilotClient } from '@/components/events/AICopilotClient';
import { manageableOwnerIds } from '@/lib/rbac/canManageEvent';
import { getEventOwnerPlan } from '@/lib/billing/can';
import { hasStudioERA } from '@/lib/ai/gate';

export async function generateMetadata() {
  return { title: 'AI Copilot' };
}

export default async function CopilotPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: _ref } = await params;
  const _ev = await resolveEventRef(_ref);
  if (!_ev) redirect('/dashboard');
  const id = _ev.id;
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const admin = createAdminClient();
  const { data: event } = await admin
    .from('events')
    .select('id, name, slug, status')
    .eq('id', id)
    .in('user_id', await manageableOwnerIds(user.id))
    .single();

  if (!event) redirect('/dashboard');

  // Match the API's plan gate so a Free or Pro organiser sees the event page
  // instead of a chat box that 402s on the first message. Studio-only —
  // Abdalla's call, 2026-07-22: Copilot is the most expensive AI call in the
  // product and belongs in the tier that already advertises "ERA AI". Same
  // redirect-to-event shape the other paid tabs use (gamification / q-and-a /
  // sponsors).
  const ownerPlan = await getEventOwnerPlan(id);
  if (!ownerPlan || !hasStudioERA(ownerPlan)) redirect(`/events/${_ev.slug}`);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const adminAny = admin as any;

  // Fetch key event stats for AI context
  const [{ count: regCount }, { count: checkInCount }] = await Promise.all([
    adminAny.from('registrations').select('id', { count: 'exact', head: true }).eq('event_id', id).in('status', ['confirmed', 'checked_in']),
    adminAny.from('registrations').select('id', { count: 'exact', head: true }).eq('event_id', id).eq('status', 'checked_in'),
  ]);

  return (
    <AICopilotClient
      eventId={id}
      eventName={event.name}
      eventSlug={event.slug}
      stats={{ registrations: regCount ?? 0, checkedIn: checkInCount ?? 0 }}
    />
  );
}
