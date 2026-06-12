export const dynamic = 'force-dynamic';

import { createAdminClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import { LeadScoringClient } from '@/components/exhibitor/LeadScoringClient';

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
    .select('id, name, slug')
    .eq('slug', slug)
    .maybeSingle();

  if (!event) notFound();

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
