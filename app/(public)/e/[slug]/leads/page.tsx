export const dynamic = 'force-dynamic';

import { createAdminClient, createClient } from '@/lib/supabase/server';
import { notFound, redirect } from 'next/navigation';
import { LeadScoringClient } from '@/components/exhibitor/LeadScoringClient';
import { hasRole } from '@/lib/rbac/roles';

interface Props { params: Promise<{ slug: string }> }

export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  return { title: `Leads — ${slug}` };
}

export default async function LeadsPage({ params }: Props) {
  const { slug } = await params;
  const admin = createAdminClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const adminAny = admin as any;

  const { data: event } = await adminAny
    .from('events')
    .select('id, name, slug, user_id')
    .eq('slug', slug)
    .maybeSingle();

  if (!event) notFound();

  // AuthZ (this page previously dumped every booth lead to anyone): only the
  // event's organizer or a sponsor of the event may see leads.
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect(`/account/login?next=${encodeURIComponent(`/e/${slug}/leads`)}`);
  const isOrganizer = event.user_id === user.id;
  const isSponsor = await hasRole(user.id, event.id, 'sponsor');
  if (!isOrganizer && !isSponsor) redirect(`/e/${slug}`);

  // Fetch booth leads if table exists
  const { data: leads } = await adminAny
    .from('booth_leads')
    .select('*')
    .eq('event_id', event.id)
    .order('score', { ascending: false });

  return (
    <LeadScoringClient
      eventSlug={slug}
      eventName={event.name}
      leads={leads ?? []}
    />
  );
}
