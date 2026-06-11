export const dynamic = 'force-dynamic';

import { createAdminClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import { resolvePublicSlug } from '@/lib/events/resolvePublicSlug';
import { ExhibitorPortalClient } from '@/components/exhibitor/ExhibitorPortalClient';

interface Props { params: { slug: string; sponsorId: string } }

export async function generateMetadata({ params }: Props) {
  return { title: 'Exhibitor Portal' };
}

export default async function ExhibitorPortalPage({ params }: Props) {
  const admin = createAdminClient();

  const resolved = await resolvePublicSlug(params.slug);
  if (!resolved) notFound();
  const { event } = resolved;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: sponsor } = await (admin as any)
    .from('sponsors')
    .select('*')
    .eq('id', params.sponsorId)
    .eq('event_id', event.id)
    .single();

  if (!sponsor) notFound();

  // Leads for this sponsor
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let leads: any[] = [];
  try {
    const { data } = await (admin as any)
      .from('sponsor_leads')
      .select('*')
      .eq('sponsor_id', params.sponsorId)
      .order('created_at', { ascending: false });
    leads = data ?? [];
  } catch {
    leads = [];
  }

  // Sessions this sponsor is speaking at (optional join)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let sessions: any[] = [];
  try {
    const { data } = await (admin as any)
      .from('session_speakers')
      .select('sessions(id, title, starts_at, ends_at, room, session_type)')
      .eq('sponsor_id', params.sponsorId);
    sessions = (data ?? []).map((ss: any) => ss.sessions).filter(Boolean);
  } catch {
    sessions = [];
  }

  return (
    <ExhibitorPortalClient
      sponsor={sponsor}
      event={{
        id: event.id,
        name: event.name,
        slug: event.slug,
        starts_at: (event as any).starts_at,
        ends_at: (event as any).ends_at,
      }}
      leads={leads}
      sessions={sessions}
    />
  );
}
